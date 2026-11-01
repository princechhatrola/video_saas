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

export class MinimaxAdapter extends BaseVideoProviderAdapter {
  readonly providerId = 'minimax-hailuo';
  readonly defaultBaseUrl = 'https://api.minimax.chat/v1';

  async validateCredentials(
    credentials: DecryptedCredentials,
    _config?: ProviderConfig,
  ): Promise<CredentialTestResult> {
    if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
      return {
        success: false,
        errorCode: 'INVALID_API_KEY',
        errorMessage: 'MiniMax API key is required.',
      };
    }

    try {
      // MiniMax models or text probe endpoint
      const res = await fetch(`${this.getBaseUrl(_config)}/models`, {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      });

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          errorCode: 'AUTHENTICATION_FAILED',
          errorMessage: 'Invalid MiniMax API key.',
        };
      }

      return {
        success: true,
        accountInfo: { provider: 'minimax', status: 'verified' },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: `MiniMax validation failed: ${err.message}`,
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
      minDurationSeconds: 6,
      maxDurationSeconds: 6,
      supportedDurationsSeconds: [6],
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
    const url = `${this.getBaseUrl(config)}/video_generation`;

    const body = {
      model: request.modelId || 'video-01',
      prompt: request.prompt,
      prompt_optimizer: true,
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
    if (!res.ok || (data.base_resp && data.base_resp.status_code !== 0)) {
      throw new Error(
        data.base_resp?.status_msg || `MiniMax generation failed with status ${res.status}`,
      );
    }

    return {
      providerJobId: data.task_id,
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
    const url = `${this.getBaseUrl(config)}/query/video_generation?task_id=${providerJobId}`;

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

    const status = data.status; // 'Preparing' | 'Queueing' | 'Processing' | 'Success' | 'Fail'

    if (status === 'Success') {
      return {
        providerJobId,
        state: 'completed',
        progress: 100,
        outputUrl: data.file_id ? `${this.getBaseUrl(config)}/files/retrieve?file_id=${data.file_id}` : data.video_url,
      };
    }

    if (status === 'Fail') {
      return {
        providerJobId,
        state: 'failed',
        errorMessage: data.base_resp?.status_msg || 'Generation failed on MiniMax',
      };
    }

    return {
      providerJobId,
      state: status === 'Processing' ? 'processing' : 'pending',
      progress: status === 'Processing' ? 60 : 15,
    };
  }
}
