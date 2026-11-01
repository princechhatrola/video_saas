import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  AspectRatio,
  GenerationMode,
  ProjectStatus,
  ProviderSelectionMode,
} from '@videoforge/shared-types';

export type ProjectDocument = HydratedDocument<Project>;

class ProjectSettingsSubdocument {
  @Prop({ default: 30 })
  targetDurationSeconds!: number;

  @Prop({ type: String, enum: AspectRatio, default: AspectRatio.PORTRAIT_9_16 })
  aspectRatio!: AspectRatio;

  @Prop({ default: 'en' })
  language!: string;

  @Prop({ default: 'cinematic' })
  style!: string;

  @Prop({ default: '720p' })
  resolution!: string;

  @Prop({ default: true })
  narrationEnabled!: boolean;

  @Prop({ default: true })
  subtitlesEnabled!: boolean;

  @Prop({ default: false })
  musicEnabled!: boolean;
}

class ProviderSelectionSubdocument {
  @Prop({
    type: String,
    enum: ProviderSelectionMode,
    default: ProviderSelectionMode.MANUAL,
  })
  mode!: ProviderSelectionMode;

  @Prop({ trim: true })
  providerId?: string;

  @Prop({ trim: true })
  modelId?: string;

  @Prop({ trim: true })
  connectionId?: string;
}

class SceneDocumentSubdocument {
  @Prop({ required: true })
  sceneNumber!: number;

  @Prop({ default: '' })
  narration!: string;

  @Prop({ required: true })
  visualPrompt!: string;

  @Prop()
  negativePrompt?: string;

  @Prop({ required: true, default: 5 })
  plannedDurationSeconds!: number;

  @Prop()
  recommendedVideoProvider?: string;

  @Prop()
  recommendedModel?: string;

  @Prop({
    type: String,
    enum: GenerationMode,
    default: GenerationMode.TEXT_TO_VIDEO,
  })
  generationMode!: GenerationMode;

  @Prop()
  continuityNotes?: string;

  @Prop()
  transition?: string;
}

class ScriptDocumentSubdocument {
  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  summary!: string;

  @Prop({ default: 30 })
  targetDurationSeconds!: number;

  @Prop({ type: String, enum: AspectRatio, default: AspectRatio.PORTRAIT_9_16 })
  aspectRatio!: AspectRatio;

  @Prop({ default: 'en' })
  language!: string;

  @Prop()
  narration?: string;

  @Prop({ type: [SceneDocumentSubdocument], default: [] })
  scenes!: SceneDocumentSubdocument[];

  @Prop()
  captionText?: string;

  @Prop()
  callToAction?: string;
}

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  inputText!: string;

  @Prop({
    type: String,
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
    index: true,
  })
  status!: ProjectStatus;

  @Prop({ type: ProjectSettingsSubdocument, default: () => ({}) })
  settings!: ProjectSettingsSubdocument;

  @Prop({ type: ProviderSelectionSubdocument, default: () => ({}) })
  providerSelection!: ProviderSelectionSubdocument;

  @Prop({ type: ScriptDocumentSubdocument })
  script?: ScriptDocumentSubdocument;

  @Prop({ default: 0 })
  totalScenes!: number;

  @Prop({ default: 0 })
  completedScenes!: number;

  @Prop({ default: 0 })
  failedScenes!: number;

  @Prop()
  finalAssetId?: string;

  @Prop()
  finalVideoUrl?: string;

  @Prop()
  finalDurationSeconds?: number;

  @Prop()
  completedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ userId: 1, status: 1 });
