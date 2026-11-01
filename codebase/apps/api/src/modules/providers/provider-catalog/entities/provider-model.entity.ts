import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  ModelAvailability,
  ProviderCapability,
} from '@videoforge/shared-types';

export type ProviderModelDocument = HydratedDocument<ProviderModel>;

class ModelPricing {
  @Prop() unit?: string;
  @Prop() amount?: number;
  @Prop({ default: 'USD' }) currency?: string;
  @Prop() pricingUrl?: string;
  @Prop() verifiedAt?: Date;
}

@Schema({ timestamps: true, collection: 'provider_models' })
export class ProviderModel {
  @Prop({ required: true, trim: true, lowercase: true, index: true })
  providerId!: string;

  @Prop({ required: true, trim: true })
  modelId!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ type: [String], enum: ProviderCapability, default: [] })
  capabilities!: ProviderCapability[];

  @Prop({ type: [Number], default: [5] })
  supportedDurationsSeconds!: number[];

  @Prop({ default: 10 })
  maxDurationSeconds?: number;

  @Prop({ type: [String], default: ['16:9', '9:16', '1:1'] })
  aspectRatios!: string[];

  @Prop({ type: [String], default: ['720p', '1080p'] })
  resolutions!: string[];

  @Prop({ type: ModelPricing, default: () => ({}) })
  pricing?: ModelPricing;

  @Prop({
    type: String,
    enum: ModelAvailability,
    default: ModelAvailability.AVAILABLE,
  })
  availability!: ModelAvailability;

  @Prop({ default: true })
  enabled!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProviderModelSchema = SchemaFactory.createForClass(ProviderModel);

ProviderModelSchema.index({ providerId: 1, modelId: 1 }, { unique: true });
ProviderModelSchema.index({ capabilities: 1 });
ProviderModelSchema.index({ enabled: 1 });
