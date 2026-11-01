import type {
  AspectRatio,
  GenerationMode,
  ProjectStatus,
  ProviderSelectionMode,
} from './enums';

export interface ProjectSettings {
  targetDurationSeconds: number;
  aspectRatio: AspectRatio;
  language: string;
  style: string;
  resolution: string;
  narrationEnabled: boolean;
  subtitlesEnabled: boolean;
  musicEnabled: boolean;
}

export interface ProviderSelection {
  mode: ProviderSelectionMode;
  providerId?: string;
  modelId?: string;
  connectionId?: string;
}

export interface VideoProject {
  id: string;
  userId: string;
  title: string;
  inputText: string;
  status: ProjectStatus;
  settings: ProjectSettings;
  providerSelection: ProviderSelection;
  script?: ScriptDocument;
  totalScenes: number;
  completedScenes: number;
  failedScenes: number;
  finalAssetId?: string;
  finalDurationSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface SceneDocument {
  sceneNumber: number;
  narration: string;
  visualPrompt: string;
  negativePrompt?: string;
  plannedDurationSeconds: number;
  recommendedVideoProvider?: string;
  recommendedModel?: string;
  generationMode: GenerationMode;
  continuityNotes?: string;
  transition?: string;
}

export interface ScriptDocument {
  title: string;
  summary: string;
  targetDurationSeconds: number;
  aspectRatio: AspectRatio;
  language: string;
  narration?: string;
  scenes: SceneDocument[];
  captionText?: string;
  callToAction?: string;
}
