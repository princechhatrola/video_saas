import type { JobStatus, JobType } from './enums';

export interface GenerationJob {
  id: string;
  userId: string;
  projectId: string;
  sceneId?: string;
  jobType: JobType;
  queueJobId?: string;
  status: JobStatus;
  attempts: number;
  idempotencyKey: string;
  startedAt?: Date;
  completedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** BullMQ job payloads — never contain API keys */
export interface ScriptJobPayload {
  projectId: string;
  userId: string;
  connectionId: string;
}

export interface VideoGenerationJobPayload {
  projectId: string;
  sceneId: string;
  userId: string;
  connectionId: string;
  idempotencyKey: string;
}

export interface PollJobPayload {
  projectId: string;
  sceneId: string;
  userId: string;
  connectionId: string;
  providerJobId: string;
  providerId: string;
  attempt: number;
}

export interface DownloadJobPayload {
  projectId: string;
  sceneId: string;
  userId: string;
  outputUrl: string;
}

export interface RenderJobPayload {
  projectId: string;
  userId: string;
  renderId: string;
}

export interface CleanupJobPayload {
  projectId: string;
  userId: string;
  assetIds: string[];
}
