import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  GenerationMode,
  SceneStatus,
} from '@videoforge/shared-types';

export type SceneDocumentModel = HydratedDocument<Scene>;

class SanitizedErrorSubdocument {
  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: false })
  retryable!: boolean;
}

@Schema({ timestamps: true, collection: 'scenes' })
export class Scene {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: Types.ObjectId;

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

  @Prop({
    type: String,
    enum: GenerationMode,
    default: GenerationMode.TEXT_TO_VIDEO,
  })
  generationMode!: GenerationMode;

  @Prop({ required: true, trim: true, lowercase: true })
  providerId!: string;

  @Prop({ required: true, trim: true })
  modelId!: string;

  @Prop({ type: Types.ObjectId, ref: 'ProviderConnection', required: true })
  connectionId!: Types.ObjectId;

  @Prop({ trim: true })
  providerJobId?: string;

  @Prop({
    type: String,
    enum: SceneStatus,
    default: SceneStatus.PENDING,
    index: true,
  })
  status!: SceneStatus;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop()
  assetId?: string;

  @Prop()
  videoClipUrl?: string;

  @Prop({ type: SanitizedErrorSubdocument })
  sanitizedError?: SanitizedErrorSubdocument;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SceneSchema = SchemaFactory.createForClass(Scene);

SceneSchema.index({ projectId: 1, sceneNumber: 1 });
SceneSchema.index({ userId: 1, status: 1 });
