// ============================================================
// Shared Enums — VideoForge AI
// ============================================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum ProviderType {
  DIRECT = 'direct',
  AGGREGATOR = 'aggregator',
}

export enum ProviderAuthType {
  BEARER = 'bearer',
  API_KEY_HEADER = 'api_key_header',
  QUERY_PARAMETER = 'query_parameter',
  CUSTOM = 'custom',
}

export enum ProviderCapability {
  TEXT_TO_VIDEO = 'text_to_video',
  IMAGE_TO_VIDEO = 'image_to_video',
  REFERENCE_TO_VIDEO = 'reference_to_video',
  VIDEO_EXTENSION = 'video_extension',
  EXTEND_VIDEO = 'video_extension',
  AUDIO_GENERATION = 'audio_generation',
  SCRIPT_GENERATION = 'script_generation',
  HD_EXPORT = 'hd_export',
  ASPECT_RATIO_SELECTION = 'aspect_ratio_selection',
  CAMERA_CONTROL = 'camera_control',
}

export enum BillingClassification {
  FREE_VERIFIED = 'free_verified',
  FREE_TIER_AVAILABLE = 'free_verified',
  TRIAL = 'trial',
  TRIAL_CREDITS = 'trial',
  PAID = 'paid',
  PAID_ONLY = 'paid',
  UNKNOWN = 'unknown',
  USER_MANAGED = 'user_managed',
}

export enum ProviderStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  DISABLED = 'disabled',
  EXPERIMENTAL = 'experimental',
  NOT_IMPLEMENTED = 'not_implemented',
}

export enum ModelAvailability {
  AVAILABLE = 'available',
  RESTRICTED = 'restricted',
  DEPRECATED = 'deprecated',
  UNKNOWN = 'unknown',
}

export enum ConnectionStatus {
  UNTESTED = 'untested',
  VALID = 'valid',
  CONNECTED = 'valid',
  INVALID = 'invalid',
  INVALID_KEY = 'invalid',
  QUOTA_EXHAUSTED = 'quota_exhausted',
  RATE_LIMITED = 'quota_exhausted',
  DISABLED = 'disabled',
  ERROR = 'error',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  SCRIPT_READY = 'awaiting_approval',
  SCRIPT_GENERATING = 'script_generating',
  AWAITING_APPROVAL = 'awaiting_approval',
  QUEUED = 'queued',
  GENERATING = 'generating',
  RENDERING = 'rendering',
  COMPLETED = 'completed',
  PARTIAL_FAILED = 'partial_failed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AspectRatio {
  PORTRAIT = '9:16',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE = '16:9',
  LANDSCAPE_16_9 = '16:9',
  SQUARE = '1:1',
  SQUARE_1_1 = '1:1',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'text_to_video',
  IMAGE_TO_VIDEO = 'image_to_video',
}

export enum ProviderSelectionMode {
  MANUAL = 'manual',
  AUTO = 'auto',
}

export enum SceneStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  DOWNLOADING = 'downloading',
  STORED = 'stored',
  COMPLETED = 'stored',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AuditAction {
  USER_REGISTER = 'user.registered',
  USER_LOGIN = 'user.logged_in',
  USER_LOGOUT = 'user.logged_out',
  CREATE_PROJECT = 'project.created',
  UPDATE_PROJECT = 'project.updated',
  DELETE_PROJECT = 'project.deleted',
  CREATE_PROVIDER_CONNECTION = 'provider_key.added',
  UPDATE_PROVIDER_CONNECTION = 'provider_key.updated',
  DELETE_PROVIDER_CONNECTION = 'provider_key.deleted',
  TEST_PROVIDER_CONNECTION = 'provider_key.tested',
  ADMIN_ACTION = 'admin.action',
}

export enum JobType {
  SCRIPT = 'script',
  VIDEO_GENERATION = 'video_generation',
  VIDEO_DOWNLOAD = 'video_download',
  AUDIO_GENERATION = 'audio_generation',
  RENDER = 'render',
  CLEANUP = 'cleanup',
}

export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AssetType {
  REFERENCE_IMAGE = 'reference_image',
  SOURCE_VIDEO = 'source_video',
  SCENE_VIDEO = 'scene_video',
  VOICEOVER = 'voiceover',
  MUSIC = 'music',
  SUBTITLE = 'subtitle',
  FINAL_VIDEO = 'final_video',
  THUMBNAIL = 'thumbnail',
}

/** Normalized error codes returned from provider adapters */
export enum ProviderErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  REGION_NOT_SUPPORTED = 'REGION_NOT_SUPPORTED',
  CONTENT_POLICY_REJECTED = 'CONTENT_POLICY_REJECTED',
  PROVIDER_TIMEOUT = 'PROVIDER_TIMEOUT',
  PROVIDER_SERVER_ERROR = 'PROVIDER_SERVER_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  OUTPUT_DOWNLOAD_FAILED = 'OUTPUT_DOWNLOAD_FAILED',
  INVALID_VIDEO_OUTPUT = 'INVALID_VIDEO_OUTPUT',
  S3_UPLOAD_FAILED = 'S3_UPLOAD_FAILED',
  RENDER_FAILED = 'RENDER_FAILED',
  USER_LIMIT_EXCEEDED = 'USER_LIMIT_EXCEEDED',
  PROVIDER_DISABLED = 'PROVIDER_DISABLED',
  UNKNOWN = 'UNKNOWN',
}

export enum QuotaSource {
  PROVIDER_API = 'provider_api',
  RESPONSE_HEADERS = 'response_headers',
  USER_ENTERED = 'user_entered',
  MANUAL = 'user_entered',
  UNAVAILABLE = 'unavailable',
}

export enum AuditEventType {
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  USER_PASSWORD_RESET = 'user.password_reset',
  USER_EMAIL_VERIFIED = 'user.email_verified',
  USER_DELETED = 'user.deleted',
  USER_SUSPENDED = 'user.suspended',
  PROVIDER_KEY_ADDED = 'provider_key.added',
  PROVIDER_KEY_UPDATED = 'provider_key.updated',
  PROVIDER_KEY_DELETED = 'provider_key.deleted',
  PROVIDER_KEY_TESTED = 'provider_key.tested',
  PROVIDER_KEY_ROTATED = 'provider_key.rotated',
  PROJECT_CREATED = 'project.created',
  PROJECT_DELETED = 'project.deleted',
  ADMIN_PROVIDER_DISABLED = 'admin.provider_disabled',
  ADMIN_USER_SUSPENDED = 'admin.user_suspended',
  QUOTA_LIMIT_CHANGED = 'quota.limit_changed',
}
