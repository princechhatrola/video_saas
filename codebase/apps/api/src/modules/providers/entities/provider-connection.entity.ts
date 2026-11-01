import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ConnectionStatus,
  QuotaSource,
} from '@videoforge/shared-types';

export type ProviderConnectionDocument = HydratedDocument<ProviderConnection>;

class EncryptedEnvelope {
  @Prop({ required: true })
  ciphertext!: string;

  @Prop({ required: true })
  iv!: string;

  @Prop({ required: true })
  authTag!: string;

  @Prop({ required: true, default: 'v1' })
  keyVersion!: string;
}

class ConnectionLimitsSubdocument {
  @Prop()
  dailyJobs?: number;

  @Prop()
  monthlyJobs?: number;

  @Prop()
  maxConcurrentJobs?: number;

  @Prop()
  maxEstimatedCostPerProject?: number;

  @Prop({ default: false })
  blockPaidOrUnknownProviders!: boolean;
}

class QuotaInfoSubdocument {
  @Prop()
  remaining?: number;

  @Prop()
  total?: number;

  @Prop()
  unit?: string;

  @Prop({
    type: String,
    enum: QuotaSource,
    default: QuotaSource.MANUAL,
  })
  source!: QuotaSource;

  @Prop()
  checkedAt?: Date;
}

@Schema({ timestamps: true, collection: 'provider_connections' })
export class ProviderConnection {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true })
  providerId!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ trim: true })
  region?: string;

  @Prop({ trim: true })
  workspaceId?: string;

  @Prop({
    type: String,
    enum: ConnectionStatus,
    default: ConnectionStatus.CONNECTED,
  })
  status!: ConnectionStatus;

  /**
   * Encrypted credential payload (AES-256-GCM).
   * select: false prevents accidental leakage in ordinary queries.
   */
  @Prop({ type: EncryptedEnvelope, required: true, select: false })
  encryptedCredentials!: EncryptedEnvelope;

  /** Masked key representation safe for frontend display e.g. "sk-****5678" */
  @Prop({ required: true })
  maskedKey!: string;

  @Prop({ type: ConnectionLimitsSubdocument, default: () => ({}) })
  limits!: ConnectionLimitsSubdocument;

  @Prop({ type: QuotaInfoSubdocument })
  quotaInfo?: QuotaInfoSubdocument;

  @Prop()
  lastTestedAt?: Date;

  @Prop()
  lastSuccessfulUseAt?: Date;

  @Prop()
  lastErrorCode?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProviderConnectionSchema = SchemaFactory.createForClass(ProviderConnection);

ProviderConnectionSchema.index({ userId: 1, providerId: 1 });
ProviderConnectionSchema.index({ userId: 1, status: 1 });
