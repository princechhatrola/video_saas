import type { QuotaSource } from './enums';

export interface ProviderUsageRecord {
  id: string;
  userId: string;
  connectionId: string;
  providerId: string;
  modelId: string;
  projectId: string;
  sceneId?: string;
  providerJobId?: string;
  usageUnit?: string;
  usageAmount?: number;
  providerReportedCost?: number;
  estimatedCost?: number;
  currency?: string;
  billingClassification: string;
  status: string;
  occurredAt: Date;
}

export interface UsageSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  estimatedTotalCost: number;
  currency: string;
  storageBytes: number;
  byProvider: ProviderUsageSummary[];
  period: {
    from: Date;
    to: Date;
  };
}

export interface ProviderUsageSummary {
  providerId: string;
  providerName: string;
  jobs: number;
  estimatedCost: number;
  quotaRemaining?: number;
  quotaUnit?: string;
  quotaSource: QuotaSource;
  quotaCheckedAt?: Date;
}

export interface UserLimits {
  maxJobsPerDay?: number;
  maxJobsPerMonth?: number;
  maxConcurrentSceneGenerations?: number;
  maxScenesPerProject?: number;
  maxVideoDurationSecondsPerProject?: number;
  maxEstimatedCostPerProject?: number;
  maxProviderRequestsPerDay?: number;
  blockPaidOrUnknownProviders: boolean;
  pauseIfQuotaUnverifiable: boolean;
}
