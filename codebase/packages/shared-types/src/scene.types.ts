import type { GenerationMode, SceneStatus } from './enums';

export interface SanitizedError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface VideoScene {
  id: string;
  userId: string;
  projectId: string;
  sceneNumber: number;
  narration: string;
  visualPrompt: string;
  negativePrompt?: string;
  plannedDurationSeconds: number;
  generationMode: GenerationMode;
  providerId: string;
  modelId: string;
  connectionId: string;
  providerJobId?: string;
  status: SceneStatus;
  attempts: number;
  assetId?: string;
  sanitizedError?: SanitizedError;
  createdAt: Date;
  updatedAt: Date;
}
