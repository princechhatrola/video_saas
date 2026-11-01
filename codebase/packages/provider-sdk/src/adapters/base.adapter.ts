import type {
  CredentialTestResult,
  DecryptedCredentials,
  ModelCapabilities,
  ProviderConfig,
  ProviderGenerationAccepted,
  ProviderGenerationStatus,
  VideoGenerationRequest,
  VideoProviderAdapter,
} from '@videoforge/shared-types';

export abstract class BaseVideoProviderAdapter implements VideoProviderAdapter {
  abstract readonly providerId: string;
  abstract readonly defaultBaseUrl: string;

  protected getBaseUrl(config?: ProviderConfig): string {
    return config?.baseUrl || this.defaultBaseUrl;
  }

  abstract validateCredentials(
    credentials: DecryptedCredentials,
    config?: ProviderConfig,
  ): Promise<CredentialTestResult>;

  abstract getCapabilities(
    credentials: DecryptedCredentials,
    modelId: string,
  ): Promise<ModelCapabilities>;

  abstract generateVideo(
    credentials: DecryptedCredentials,
    request: VideoGenerationRequest,
    idempotencyKey: string,
    config?: ProviderConfig,
  ): Promise<ProviderGenerationAccepted>;

  abstract getGenerationStatus(
    credentials: DecryptedCredentials,
    providerJobId: string,
    config?: ProviderConfig,
  ): Promise<ProviderGenerationStatus>;
}
