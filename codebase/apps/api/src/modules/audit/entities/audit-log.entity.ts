import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { AuditEventType } from '@videoforge/shared-types';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: false, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: String, enum: AuditEventType, required: true })
  eventType!: AuditEventType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId?: string;

  @Prop({ type: String })
  ip?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata?: Record<string, unknown>;

  @Prop({ type: Date, default: () => new Date() })
  occurredAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1, occurredAt: -1 });
AuditLogSchema.index({ eventType: 1, occurredAt: -1 });
AuditLogSchema.index({ occurredAt: -1 });
