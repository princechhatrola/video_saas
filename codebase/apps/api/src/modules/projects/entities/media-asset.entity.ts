import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AssetType } from '@videoforge/shared-types';

export type MediaAssetDocument = HydratedDocument<MediaAssetModel>;

class S3StorageRefSubdocument {
  @Prop({ required: true })
  bucket!: string;

  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  region!: string;

  @Prop()
  publicUrl?: string;

  @Prop()
  cdnUrl?: string;
}

class VideoProbeMetadataSubdocument {
  @Prop() durationSeconds?: number;
  @Prop() width?: number;
  @Prop() height?: number;
  @Prop() fps?: number;
  @Prop() codec?: string;
  @Prop() bitrate?: number;
  @Prop() audioCodec?: string;
}

@Schema({ timestamps: true, collection: 'media_assets' })
export class MediaAssetModel {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Scene', index: true })
  sceneId?: Types.ObjectId;

  @Prop({ type: String, enum: AssetType, required: true })
  type!: AssetType;

  @Prop({ type: S3StorageRefSubdocument, required: true })
  storage!: S3StorageRefSubdocument;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true, default: 0 })
  sizeBytes!: number;

  @Prop()
  checksum?: string;

  @Prop({ type: VideoProbeMetadataSubdocument })
  probeMetadata?: VideoProbeMetadataSubdocument;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MediaAssetSchema = SchemaFactory.createForClass(MediaAssetModel);

MediaAssetSchema.index({ projectId: 1, type: 1 });
MediaAssetSchema.index({ userId: 1 });
