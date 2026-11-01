// ============================================================
// Common Utility Types — VideoForge AI
// ============================================================

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** S3 storage reference (stored in MongoDB; never a public URL) */
export interface S3StorageRef {
  provider: 's3';
  bucket: string;
  key: string;
  region: string;
  publicUrl?: string;
  cdnUrl?: string;
}

/** Encrypted credential envelope stored in MongoDB */
export interface EncryptedCredentialEnvelope {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: string;
}

/** Decrypted credentials — only exists in-memory inside worker, never persisted */
export interface DecryptedCredentials {
  apiKey?: string;
  apiSecret?: string;
  region?: string;
  projectId?: string;
  baseUrl?: string;
  customFields?: Record<string, string>;
}

/** Duration statistics from ffprobe */
export interface VideoProbeMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  codec: string;
  frameRate: number;
  bitrate: number;
  sizeBytes: number;
  hasVideoStream: boolean;
  hasAudioStream: boolean;
}
