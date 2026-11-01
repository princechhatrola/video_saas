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

export class AlibabaWanAdapter extends BaseVideoProviderAdapter {
  readonly providerId = 'alibaba-wan';
  readonly defaultBaseUrl = 'https://dashscope.aliyuncs.com/api/v1';

  async validateCredentials(
    credentials: DecryptedCredentials,
    config?: ProviderConfig,
  ): Promise<CredentialTestResult> {
    if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
      return {
        success: false,
        errorCode: 'INVALID_API_KEY',
        errorMessage: 'Alibaba Cloud DashScope API key is required.',
      };
    }

    try {
      // DashScope lightweight probe or model query
      const url = `${this.getBaseUrl(config)}/models`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          errorCode: 'AUTHENTICATION_FAILED',
          errorMessage: 'Invalid DashScope API key or unauthorized.',
        };
      }

      return {
        success: true,
        accountInfo: {
          provider: 'alibaba-wan',
          status: 'verified',
        },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Failed to contact DashScope API: ${err.message}`,
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
      supportsImageToVideo: modelId.includes('i2v'),
      minDurationSeconds: 5,
      maxDurationSeconds: 5,
      supportedDurationsSeconds: [5],
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
    idempotencyKey: string,
    config?: ProviderConfig,
  ): Promise<ProviderGenerationAccepted> {
    const url = `${this.getBaseUrl(config)}/services/aigc/video-generation/generation`;

    const body: Record<string, unknown> = {
      model: request.modelId || 'wan2.1-t2v-plus',
      input: {
        prompt: request.prompt,
        ...(request.negativePrompt ? { negative_prompt: request.negativePrompt } : {}),
      },
      parameters: {
        size: request.aspectRatio === '9:16' ? '720*1280' : '1280*720',
        duration: request.durationSeconds || 5,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
        'X-DashScope-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    const data: any = await res.json();

    if (!res.ok || data.code) {
      throw new Error(
        data.message || `DashScope generation failed with status ${res.status}`,
      );
    }

    const providerJobId = data.output?.task_id || data.request_id;
    return {
      providerJobId,
      isAsync: true,
      estimatedCompletionSeconds: 90,
      pollingIntervalSeconds: 10,
    };
  }

  async getGenerationStatus(
    credentials: DecryptedCredentials,
    providerJobId: string,
    config?: ProviderConfig,
  ): Promise<ProviderGenerationStatus> {
    const url = `${this.getBaseUrl(config)}/tasks/${providerJobId}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
      },
    });

    const data: any = await res.json();

    if (!res.ok) {
      return {
        providerJobId,
        state: 'failed',
        errorCode: 'PROVIDER_ERROR',
        errorMessage: data.message || `HTTP ${res.status}`,
      };
    }

    const taskStatus = data.output?.task_status;

    if (taskStatus === 'SUCCEEDED') {
      const outputUrl = data.output?.video_url;
      return {
        providerJobId,
        state: 'completed',
        progress: 100,
        outputUrl,
      };
    }

    if (taskStatus === 'FAILED' || taskStatus === 'CANCELED') {
      return {
        providerJobId,
        state: 'failed',
        errorCode: data.output?.code || 'GENERATION_FAILED',
        errorMessage: data.output?.message || 'Video generation failed on DashScope',
      };
    }

    return {
      providerJobId,
      state: taskStatus === 'RUNNING' ? 'processing' : 'pending',
      progress: taskStatus === 'RUNNING' ? 50 : 10,
    };
  }
}
