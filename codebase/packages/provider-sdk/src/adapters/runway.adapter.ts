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

export class RunwayAdapter extends BaseVideoProviderAdapter {
  readonly providerId = 'runway';
  readonly defaultBaseUrl = 'https://api.runwayml.com/v1';

  async validateCredentials(
    credentials: DecryptedCredentials,
    _config?: ProviderConfig,
  ): Promise<CredentialTestResult> {
    if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
      return {
        success: false,
        errorCode: 'INVALID_API_KEY',
        errorMessage: 'Runway API key is required.',
      };
    }

    try {
      const res = await fetch(`${this.getBaseUrl(_config)}/tasks`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
          'X-Runway-Version': '2024-09-13',
        },
      });

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          errorCode: 'AUTHENTICATION_FAILED',
          errorMessage: 'Invalid Runway API key or unauthorized.',
        };
      }

      return {
        success: true,
        accountInfo: { provider: 'runway', status: 'verified' },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Runway connection failed: ${err.message}`,
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
      supportedAspectRatios: ['16:9', '9:16'],
      supportedResolutions: ['720p'],
      isAsync: true,
      supportsWebhooks: true,
      supportsCancel: true,
    };
  }

  async generateVideo(
    credentials: DecryptedCredentials,
    request: VideoGenerationRequest,
    _idempotencyKey: string,
    config?: ProviderConfig,
  ): Promise<ProviderGenerationAccepted> {
    const url = `${this.getBaseUrl(config)}/image_to_video`;

    const body: any = {
      model: request.modelId || 'gen3a_turbo',
      promptText: request.prompt,
      duration: request.durationSeconds === 10 ? 10 : 5,
      ratio: request.aspectRatio === '9:16' ? '9:16' : '16:9',
    };

    if (request.referenceImageUrl) {
      body.promptImage = request.referenceImageUrl;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-09-13',
      },
      body: JSON.stringify(body),
    });

    const data: any = await res.json();
    if (!res.ok || !data.id) {
      throw new Error(
        data.error || data.message || `Runway task creation failed: HTTP ${res.status}`,
      );
    }

    return {
      providerJobId: data.id,
      isAsync: true,
      estimatedCompletionSeconds: 60,
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
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'X-Runway-Version': '2024-09-13',
      },
    });

    const data: any = await res.json();
    if (!res.ok) {
      return {
        providerJobId,
        state: 'failed',
        errorMessage: `HTTP ${res.status}`,
      };
    }

    const status = data.status; // 'PENDING' | 'THROTTLED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'

    if (status === 'SUCCEEDED') {
      const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      return {
        providerJobId,
        state: 'completed',
        progress: 100,
        outputUrl,
      };
    }

    if (status === 'FAILED' || status === 'CANCELLED') {
      return {
        providerJobId,
        state: 'failed',
        errorCode: data.failureCode || 'FAILED',
        errorMessage: data.failure || 'Runway generation failed',
      };
    }

    return {
      providerJobId,
      state: status === 'RUNNING' ? 'processing' : 'pending',
      progress: data.progress ? Math.round(data.progress * 100) : 30,
    };
  }
}
