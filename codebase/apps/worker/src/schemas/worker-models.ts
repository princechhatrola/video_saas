import { Schema } from 'mongoose';
import {
  ConnectionStatus,
  ProjectStatus,
  SceneStatus,
  JobStatus,
  JobType,
  AssetType,
} from '@videoforge/shared-types';

export const WorkerProjectSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    inputText: { type: String, required: true },
    status: { type: String, enum: ProjectStatus, default: ProjectStatus.DRAFT },
    settings: { type: Object, default: {} },
    providerSelection: { type: Object, default: {} },
    script: { type: Object },
    totalScenes: { type: Number, default: 0 },
    completedScenes: { type: Number, default: 0 },
    failedScenes: { type: Number, default: 0 },
    finalAssetId: { type: String },
    finalVideoUrl: { type: String },
    finalDurationSeconds: { type: Number },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: 'projects' },
);

export const WorkerSceneSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    sceneNumber: { type: Number, required: true },
    narration: { type: String, default: '' },
    visualPrompt: { type: String, required: true },
    negativePrompt: { type: String },
    plannedDurationSeconds: { type: Number, default: 5 },
    generationMode: { type: String, default: 'text_to_video' },
    providerId: { type: String, required: true },
    modelId: { type: String, required: true },
    connectionId: { type: Schema.Types.ObjectId, ref: 'ProviderConnection', required: true },
    providerJobId: { type: String },
    status: { type: String, enum: SceneStatus, default: SceneStatus.PENDING },
    attempts: { type: Number, default: 0 },
    assetId: { type: String },
    videoClipUrl: { type: String },
    sanitizedError: { type: Object },
  },
  { timestamps: true, collection: 'scenes' },
);

export const WorkerProviderConnectionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: String, required: true },
    label: { type: String, required: true },
    region: { type: String },
    workspaceId: { type: String },
    status: { type: String, enum: ConnectionStatus, default: ConnectionStatus.CONNECTED },
    encryptedCredentials: {
      type: {
        ciphertext: String,
        iv: String,
        authTag: String,
        keyVersion: String,
      },
      required: true,
      select: false,
    },
    maskedKey: { type: String, required: true },
    limits: { type: Object, default: {} },
    lastTestedAt: { type: Date },
    lastSuccessfulUseAt: { type: Date },
    lastErrorCode: { type: String },
  },
  { timestamps: true, collection: 'provider_connections' },
);

export const WorkerMediaAssetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    sceneId: { type: Schema.Types.ObjectId, ref: 'Scene' },
    type: { type: String, enum: AssetType, required: true },
    storage: { type: Object, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
    checksum: { type: String },
    probeMetadata: { type: Object },
  },
  { timestamps: true, collection: 'media_assets' },
);

export const WorkerJobSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    sceneId: { type: Schema.Types.ObjectId, ref: 'Scene' },
    jobType: { type: String, enum: JobType, required: true },
    queueJobId: { type: String },
    status: { type: String, enum: JobStatus, default: JobStatus.QUEUED },
    attempts: { type: Number, default: 0 },
    idempotencyKey: { type: String, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorCode: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true, collection: 'generation_jobs' },
);
