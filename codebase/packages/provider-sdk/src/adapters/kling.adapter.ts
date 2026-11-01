import { BaseVideoProviderAdapter } from './base.adapter';
import type {
  CredentialTestResult,
  DecryptedCredentials,
  ModelCapabilities,
  ProviderConfig,
  ProviderGenerationAccepted,
  ProviderGenerationStatus,
  VideoGenerationRequest,
} from '@videoforge/shared-types';

export class KlingAdapter extends BaseVideoProviderAdapter {
  readonly providerId = 'kling';
  readonly defaultBaseUrl = 'https://api.klingai.com/v1';

  async validateCredentials(
    credentials: DecryptedCredentials,
    _config?: ProviderConfig,
  ): Promise<CredentialTestResult> {
    if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
      return {
        success: false,
        errorCode: 'INVALID_API_KEY',
        errorMessage: 'Kling API key is required.',
      };
    }

    try {
      const res = await fetch(`${this.getBaseUrl(_config)}/user/balance`, {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      });

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          errorCode: 'AUTHENTICATION_FAILED',
          errorMessage: 'Invalid Kling API key.',
        };
      }

      return {
        success: true,
        accountInfo: { provider: 'kling', status: 'verified' },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Kling connection failed: ${err.message}`,
      };
    }
  }

  async getCapabilities(
    _credentials: DecryptedCredentials,
    modelId: string,
  ): Promise<ModelCapabilities> {
    return {
      modelId,
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      minDurationSeconds: 5,
      maxDurationSeconds: 10,
      supportedDurationsSeconds: [5, 10],
      supportedAspectRatios: ['16:9', '9:16', '1:1'],
      supportedResolutions: ['720p', '1080p'],
      isAsync: true,
      supportsWebhooks: false,
      supportsCancel: false,
    };
  }

  async generateVideo(
    credentials: DecryptedCredentials,
    request: VideoGenerationRequest,
    _idempotencyKey: string,
    config?: ProviderConfig,
  ): Promise<ProviderGenerationAccepted> {
    const url = `${this.getBaseUrl(config)}/videos/text2video`;

    const body: any = {
      model: request.modelId || 'kling-v1-5',
      prompt: request.prompt,
      negative_prompt: request.negativePrompt,
      duration: request.durationSeconds === 10 ? '10' : '5',
      aspect_ratio: request.aspectRatio || '9:16',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data: any = await res.json();
    if (!res.ok || data.code !== 0) {
      throw new Error(
        data.message || `Kling generation failed with code ${data.code}`,
      );
    }

    return {
      providerJobId: data.data.task_id,
      isAsync: true,
      estimatedCompletionSeconds: 120,
      pollingIntervalSeconds: 15,
    };
  }

  async getGenerationStatus(
    credentials: DecryptedCredentials,
    providerJobId: string,
    config?: ProviderConfig,
  ): Promise<ProviderGenerationStatus> {
    const url = `${this.getBaseUrl(config)}/videos/text2video/${providerJobId}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${credentials.apiKey}` },
    });

    const data: any = await res.json();
    if (!res.ok) {
      return {
        providerJobId,
        state: 'failed',
        errorMessage: `HTTP ${res.status}`,
      };
    }

    const taskStatus = data.data?.task_status; // 'submitted' | 'processing' | 'succeed' | 'failed'

    if (taskStatus === 'succeed') {
      const videoResult = data.data.task_result?.videos?.[0];
      return {
        providerJobId,
        state: 'completed',
        progress: 100,
        outputUrl: videoResult?.url,
      };
    }

    if (taskStatus === 'failed') {
      return {
        providerJobId,
        state: 'failed',
        errorCode: 'GENERATION_FAILED',
        errorMessage: data.data?.task_status_msg || 'Kling video generation failed',
      };
    }

    return {
      providerJobId,
      state: taskStatus === 'processing' ? 'processing' : 'pending',
      progress: taskStatus === 'processing' ? 50 : 10,
    };
  }
}
