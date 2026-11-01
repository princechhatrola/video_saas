import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { JobStatus, JobType } from '@videoforge/shared-types';

export type GenerationJobDocument = HydratedDocument<GenerationJobModel>;

@Schema({ timestamps: true, collection: 'generation_jobs' })
export class GenerationJobModel {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Scene', index: true })
  sceneId?: Types.ObjectId;

  @Prop({ type: String, enum: JobType, required: true })
  jobType!: JobType;

  @Prop({ trim: true })
  queueJobId?: string;

  @Prop({
    type: String,
    enum: JobStatus,
    default: JobStatus.QUEUED,
    index: true,
  })
  status!: JobStatus;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ required: true, unique: true, index: true })
  idempotencyKey!: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  errorCode?: string;

  @Prop()
  errorMessage?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const GenerationJobSchema = SchemaFactory.createForClass(GenerationJobModel);

GenerationJobSchema.index({ userId: 1, status: 1 });
GenerationJobSchema.index({ projectId: 1, jobType: 1 });
