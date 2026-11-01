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

export class LumaAdapter extends BaseVideoProviderAdapter {
  readonly providerId = 'luma';
  readonly defaultBaseUrl = 'https://api.lumalabs.ai/dream-machine/v1';

  async validateCredentials(
    credentials: DecryptedCredentials,
    _config?: ProviderConfig,
  ): Promise<CredentialTestResult> {
    if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
      return {
        success: false,
        errorCode: 'INVALID_API_KEY',
        errorMessage: 'Luma Dream Machine API key is required.',
      };
    }

    try {
      const res = await fetch(`${this.getBaseUrl(_config)}/generations?limit=1`, {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      });

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          errorCode: 'AUTHENTICATION_FAILED',
          errorMessage: 'Invalid Luma API key.',
        };
      }

      return {
        success: true,
        accountInfo: { provider: 'luma', status: 'verified' },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Luma connection failed: ${err.message}`,
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
      maxDurationSeconds: 9,
      supportedDurationsSeconds: [5, 9],
      supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '21:9'],
      supportedResolutions: ['720p', '1080p'],
      isAsync: true,
      supportsWebhooks: true,
      supportsCancel: false,
    };
  }

  async generateVideo(
    credentials: DecryptedCredentials,
    request: VideoGenerationRequest,
    _idempotencyKey: string,
    config?: ProviderConfig,
  ): Promise<ProviderGenerationAccepted> {
    const url = `${this.getBaseUrl(config)}/generations`;

    const body: any = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio || '9:16',
      loop: false,
    };

    if (request.referenceImageUrl) {
      body.keyframes = {
        frame0: {
          type: 'image',
          url: request.referenceImageUrl,
        },
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data: any = await res.json();
    if (!res.ok || !data.id) {
      throw new Error(
        data.detail || data.message || `Luma generation failed: HTTP ${res.status}`,
      );
    }

    return {
      providerJobId: data.id,
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
    const url = `${this.getBaseUrl(config)}/generations/${providerJobId}`;

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

    const state = data.state; // 'queued' | 'dreaming' | 'completed' | 'failed'

    if (state === 'completed') {
      return {
        providerJobId,
        state: 'completed',
        progress: 100,
        outputUrl: data.assets?.video,
      };
    }

    if (state === 'failed') {
      return {
        providerJobId,
        state: 'failed',
        errorCode: 'GENERATION_FAILED',
        errorMessage: data.failure_reason || 'Luma video dreaming failed',
      };
    }

    return {
      providerJobId,
      state: state === 'dreaming' ? 'processing' : 'pending',
      progress: state === 'dreaming' ? 50 : 10,
    };
  }
}
