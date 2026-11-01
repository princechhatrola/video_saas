// ============================================================
// Provider Adapter Contract — VideoForge AI
// All video provider adapters must implement VideoProviderAdapter
// ============================================================

import type { DecryptedCredentials } from './common.types';

export interface ProviderConfig {
  baseUrl?: string;
  region?: string;
  timeout?: number;
}

export interface CredentialTestResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  accountInfo?: Record<string, unknown>;
}

export interface ModelCapabilities {
  modelId: string;
  supportsTextToVideo: boolean;
  supportsImageToVideo: boolean;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  supportedDurationsSeconds: number[];
  supportedAspectRatios: string[];
  supportedResolutions: string[];
  isAsync: boolean;
  supportsWebhooks: boolean;
  supportsCancel: boolean;
}

export interface VideoGenerationRequest {
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  durationSeconds: number;
  aspectRatio: string;
  resolution?: string;
  referenceImageUrl?: string;
  providerOptions?: Record<string, unknown>;
}

export interface ProviderGenerationAccepted {
  providerJobId: string;
  isAsync: boolean;
  estimatedCompletionSeconds?: number;
  pollingIntervalSeconds?: number;
}

export type ProviderJobState = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ProviderGenerationStatus {
  providerJobId: string;
  state: ProviderJobState;
  progress?: number;
  outputUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  providerMetadata?: Record<string, unknown>;
}

export interface CancelResult {
  cancelled: boolean;
  message?: string;
}

export interface ProviderUsage {
  quotaRemaining?: number;
  quotaTotal?: number;
  quotaUnit?: string;
  balance?: number;
  currency?: string;
  quotaSource: string;
  checkedAt: Date;
}

/** Core adapter interface — every video provider must implement this */
export interface VideoProviderAdapter {
  readonly providerId: string;

  validateCredentials(
    credentials: DecryptedCredentials,
    config?: ProviderConfig,
  ): Promise<CredentialTestResult>;

  getCapabilities(
    credentials: DecryptedCredentials,
    modelId: string,
  ): Promise<ModelCapabilities>;

  generateVideo(
    credentials: DecryptedCredentials,
    request: VideoGenerationRequest,
    idempotencyKey: string,
  ): Promise<ProviderGenerationAccepted>;

  getGenerationStatus(
    credentials: DecryptedCredentials,
    providerJobId: string,
  ): Promise<ProviderGenerationStatus>;

  cancelGeneration?(
    credentials: DecryptedCredentials,
    providerJobId: string,
  ): Promise<CancelResult>;

  getUsage?(credentials: DecryptedCredentials): Promise<ProviderUsage>;
}
