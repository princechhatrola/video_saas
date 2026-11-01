import type {
  BillingClassification,
  ConnectionStatus,
  ModelAvailability,
  ProviderAuthType,
  ProviderCapability,
  ProviderStatus,
  ProviderType,
  QuotaSource,
} from './enums';

export interface FreeQuotaPolicy {
  amount?: number;
  unit?: string;
  renewal: 'daily' | 'weekly' | 'monthly' | 'one_time' | 'none' | 'unknown';
  expiryDays?: number;
  regionRestrictions?: string[];
  lastVerifiedAt?: Date;
  sourceUrl?: string;
}

export interface ProviderCatalogEntry {
  id: string;
  providerId: string;
  name: string;
  company: string;
  country: string;
  providerType: ProviderType;
  docsUrl: string;
  apiBaseUrl: string;
  authType: ProviderAuthType;
  capabilities: ProviderCapability[];
  billingClassification: BillingClassification;
  freeQuotaPolicy: FreeQuotaPolicy;
  status: ProviderStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderModelEntry {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string;
  capabilities: ProviderCapability[];
  supportedDurationsSeconds: number[];
  maxDurationSeconds?: number;
  aspectRatios: string[];
  resolutions: string[];
  pricing?: {
    unit?: string;
    amount?: number;
    currency?: string;
    pricingUrl?: string;
    verifiedAt?: Date;
  };
  availability: ModelAvailability;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionLimits {
  dailyJobs?: number;
  monthlyJobs?: number;
  maxConcurrentJobs?: number;
  maxEstimatedCostPerProject?: number;
  blockPaidOrUnknownProviders: boolean;
}

export interface UserProviderConnection {
  id: string;
  userId: string;
  providerId: string;
  label: string;
  region?: string;
  workspaceId?: string;
  status: ConnectionStatus;
  lastTestedAt?: Date;
  lastSuccessfulUseAt?: Date;
  lastErrorCode?: string;
  limits: ConnectionLimits;
  quotaInfo?: {
    remaining?: number;
    total?: number;
    unit?: string;
    source: QuotaSource;
    checkedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

/** Safe masked view returned to browser — no ciphertext */
export interface MaskedConnectionView extends Omit<UserProviderConnection, 'id'> {
  id: string;
  maskedKey: string; // e.g. "sk-****abcd"
}
