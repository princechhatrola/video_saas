import type { AssetType } from './enums';
import type { S3StorageRef, VideoProbeMetadata } from './common.types';

export interface MediaAsset {
  id: string;
  userId: string;
  projectId: string;
  sceneId?: string;
  type: AssetType;
  storage: S3StorageRef;
  mimeType: string;
  sizeBytes: number;
  checksum?: string;
  probeMetadata?: Partial<VideoProbeMetadata>;
  createdAt: Date;
}
