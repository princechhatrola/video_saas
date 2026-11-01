import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  BillingClassification,
  ProviderAuthType,
  ProviderCapability,
  ProviderStatus,
  ProviderType,
} from '@videoforge/shared-types';

export type ProviderCatalogDocument = HydratedDocument<ProviderCatalog>;

class FreeQuotaPolicy {
  @Prop() amount?: number;
  @Prop() unit?: string;
  @Prop({
    enum: ['daily', 'weekly', 'monthly', 'one_time', 'none', 'unknown'],
    default: 'unknown',
  })
  renewal!: string;
  @Prop() expiryDays?: number;
  @Prop({ type: [String], default: [] }) regionRestrictions!: string[];
  @Prop() lastVerifiedAt?: Date;
  @Prop() sourceUrl?: string;
}

@Schema({ timestamps: true, collection: 'provider_catalog' })
export class ProviderCatalog {
  /** Unique slug e.g. "alibaba-wan", "minimax-hailuo" */
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  providerId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  company!: string;

  @Prop({ default: 'unknown' })
  country!: string;

  @Prop({ type: String, enum: ProviderType, default: ProviderType.DIRECT })
  providerType!: ProviderType;

  @Prop({ default: '' })
  docsUrl!: string;

  @Prop({ default: '' })
  apiBaseUrl!: string;

  @Prop({ type: String, enum: ProviderAuthType, default: ProviderAuthType.BEARER })
  authType!: ProviderAuthType;

  @Prop({ type: [String], enum: ProviderCapability, default: [] })
  capabilities!: ProviderCapability[];

  @Prop({
    type: String,
    enum: BillingClassification,
    default: BillingClassification.UNKNOWN,
  })
  billingClassification!: BillingClassification;

  @Prop({ type: FreeQuotaPolicy, default: () => ({}) })
  freeQuotaPolicy!: FreeQuotaPolicy;

  @Prop({
    type: String,
    enum: ProviderStatus,
    default: ProviderStatus.NOT_IMPLEMENTED,
  })
  status!: ProviderStatus;

  @Prop({ trim: true })
  adminNotes?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProviderCatalogSchema = SchemaFactory.createForClass(ProviderCatalog);

ProviderCatalogSchema.index({ providerId: 1 }, { unique: true });
ProviderCatalogSchema.index({ status: 1 });
ProviderCatalogSchema.index({ capabilities: 1 });
ProviderCatalogSchema.index({ billingClassification: 1 });
