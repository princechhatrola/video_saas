# Product Requirements Document (PRD)
# Multi-Provider AI Video Generator SaaS (BYOK)

**Document version:** 1.0  
**Date:** 1 November 2026  
**Product type:** Multi-tenant SaaS web application  
**Working title:** VideoForge AI (name is configurable)  
**Primary objective:** Let a user submit text or an idea and generate a finished video made from actual AI-generated moving video clips, using that user's own provider API credentials.

---

## 1. Executive summary

Build a production-minded SaaS application where users register, connect their own AI provider API keys, create video projects, generate short-form reels or longer videos, monitor every generation job, and store completed MP4 files in the SaaS owner's Amazon S3 bucket.

The product uses a **Bring Your Own Key (BYOK)** model:
- Each user adds their own provider credentials in Settings → API Providers.
- The application uses the selected user's credential for that user's generation request.
- The SaaS must never silently use the platform owner's AI credentials or a paid fallback.
- Provider credentials are encrypted at rest and never returned to the browser after saving.
- The SaaS owner pays for the application infrastructure and central S3 storage; users pay their own AI provider bills/credits directly to the provider.
- The application tracks jobs, provider usage reported by providers, estimated consumption, limits, failures, and generated assets.

**Non-negotiable product rule:** Every scene in a generated video must be an actual moving video clip returned by a video-generation model/API. Do not substitute generated still images with pan/zoom effects, slideshows, stock footage, or static-image animation as a successful video-generation result. If a provider only supports image generation, it must not be listed as a video provider.

The application should support 10–20+ provider integrations over time through a common adapter architecture. Provider availability, model IDs, pricing metadata, capabilities, regions, and limits must be configurable rather than hard-coded throughout the application.

## 2. Product goals

### 2.1 Primary goals
1. Convert user-supplied text/ideas into a structured video script and scene plan.
2. Generate actual moving clips for every scene using external hosted video-generation APIs.
3. Support text-to-video and image-to-video when the provider supports them.
4. Support 30-second reels and 60-/90-/120-second videos, subject to the selected provider's maximum clip duration and available user quota.
5. Combine generated clips, narration, subtitles, and optional user-provided/licensed music into an MP4.
6. Let every user securely connect and manage their own API keys.
7. Let users choose provider/model per project or scene, with an optional auto-selection mode restricted to their enabled providers.
8. Track generation history, provider/model usage, errors, remaining quota where the provider exposes it, and user-configured limits.
9. Store generated video files and related assets in the platform's Amazon S3 bucket.
10. Provide platform-admin tools to manage provider catalogues, supported models, availability, quotas metadata, and system health.

### 2.2 Secondary goals
- Multiple languages for script and narration.
- Multiple aspect ratios (9:16, 16:9, 1:1 where supported).
- Scene regeneration without regenerating the entire project.
- Project duplication and video download.
- Optional AI voiceover and subtitles.
- Admin-level global provider disable switch.
- Future addition of team workspaces, paid plans, templates, and editing timeline.

### 2.3 Non-goals for initial release
- Training or hosting AI models.
- Installing/running LLM, diffusion, or video models on the user's machine or SaaS servers.
- Promising unlimited or permanently free video generation.
- Building a professional nonlinear video editor.
- Generating video from images alone and presenting it as text-to-video.
- Automatically paying providers or topping up user balances.
- Sharing API keys between users.
- Automatically switching to an unconfigured provider or the SaaS owner's provider key.
- Mobile native applications.

## 3. Target users and use cases

### Primary users
- Individual creators producing Instagram Reels, YouTube Shorts, explainers, and marketing videos.
- Small businesses producing product explainers and promotional videos.
- Developers/AI enthusiasts who own multiple AI provider accounts and want one interface to use them.
- Agencies managing video generation across several provider accounts.

### Main user journey
1. User signs up and verifies email.
2. User opens Settings → API Providers.
3. User selects a provider, enters their API key (and optional region/base URL/project ID), and tests the connection.
4. User saves the key. The UI displays only a masked value thereafter.
5. User creates a project, enters text/idea, chooses duration, language, format, style, provider and model.
6. AI script service creates a structured script and scene plan.
7. User reviews/edits the script and prompts.
8. User starts generation.
9. Backend queues scene jobs and submits each scene to the selected provider using the user's key.
10. Backend polls the provider or receives webhooks until each scene is complete.
11. Backend downloads the generated video files and uploads them into the platform's S3 bucket.
12. Backend renders the final MP4 with FFmpeg, narration/subtitles if enabled, and uploads the final file to S3.
13. User sees completion, preview, download, provider/model used, duration, and usage summary.
14. User can regenerate a scene, duplicate the project, or delete the project and assets.

## 4. Product principles and critical constraints

### 4.1 BYOK isolation
- Every generation job must resolve credentials using both `userId` and `providerConnectionId`.
- A user must never be able to reference another user's provider connection.
- The platform's own AI keys must not be used for end-user generation.
- No silent fallback to another provider.
- If the user's key is missing, invalid, expired, out of quota, or unsupported in the selected region, stop the job and explain the reason.
- User must explicitly choose another connected provider or enable a specific provider for auto-routing.

### 4.2 Free-only / no accidental billing
Users may connect free-tier or paid provider accounts, but the app must not make any claim that a provider is free. The app must show provider billing mode as:
- `free_verified`
- `trial`
- `paid`
- `unknown`
- `user_managed`

For this product's initial configuration, default generation policy is **user-managed BYOK**. Add an optional user setting `block_paid_or_unknown_providers`. If enabled, only providers whose free quota has been explicitly verified by the user/admin may be used. Do not infer free quota from a provider's marketing page.

The application must:
- Never store provider payment-card data.
- Never purchase credits or top up accounts.
- Never invoke a paid fallback automatically.
- Respect provider response codes for quota exhaustion and billing restrictions.
- Display an explicit warning before a user selects a provider marked `paid` or `unknown`.
- Allow user-level daily/monthly job limits and max estimated cost per project. Estimates must be clearly labelled estimates, not guaranteed billing totals.
- Where provider quota/balance API exists, query it; otherwise show `Not available from provider` and let the user enter a manual allowance/limit.

### 4.3 Actual video requirement
A scene is complete only when a valid video asset is returned and validated:
- Supported container: MP4 preferred; provider-specific formats may be transcoded.
- Video stream must exist and have non-zero duration.
- Duration, dimensions, codec, frame rate, and file size recorded using `ffprobe`.
- Reject image-only responses.
- A provider can be registered only if it has a documented API that returns or exposes an actual video file/job result.

## 5. Scope and feature requirements

### 5.1 Authentication and account management
- Email/password registration and login.
- Email verification.
- Forgot/reset password.
- Secure logout and refresh-token rotation.
- Optional Google OAuth (phase 2).
- User profile: name, email, avatar, timezone, preferred language.
- Account deletion with confirmation and scheduled asset deletion.
- Rate limiting for authentication endpoints.
- Roles: `user`, `admin`, optional `support`.
- Admin accounts should support MFA in production.

### 5.2 Main dashboard
Display:
- Total projects.
- Completed videos.
- Videos generating.
- Failed jobs.
- Total generated duration.
- Storage used.
- Connected providers count.
- Recent projects.
- Provider warnings (invalid key, quota exhausted, provider disabled).
- Quick action: Create Video.

### 5.3 Video creation wizard
Input fields:
- Project title (auto-suggest from prompt).
- Text content / idea (required).
- Target duration: 30, 60, 90, 120 seconds.
- Video type: Reel/Short (9:16), Landscape (16:9), Square (1:1).
- Language: English, Hindi, Gujarati initially; extensible.
- Style: cinematic, realistic, documentary, educational, product advertisement, storytelling, animation (only if provider actually supports requested video style).
- Target audience (optional).
- Tone (optional).
- Provider selection: specific provider or Auto (only among user's connected and enabled providers).
- Model selection based on provider capabilities.
- Resolution: provider-supported options; never promise unsupported resolution.
- Scene count or auto.
- Narration: off/on; voice/language selection if supported.
- Subtitles: off/on.
- Background music: off/on; user-uploaded or properly licensed assets only.
- Reference image upload for image-to-video (optional).
- Negative prompt (optional).
- Advanced provider parameters in an expandable section.

Before starting generation, show:
- Selected provider and model.
- User's connected account being used (masked label).
- Provider billing classification.
- Provider quota status (verified, user-entered, unknown, unavailable).
- Number of scene requests expected.
- Estimated provider usage/cost if known.
- Warning if the provider's quota/cost cannot be checked.

### 5.4 Script and scene planner
Use an LLM provider selected/configured by the user, or a clearly configured platform script provider if the product owner later chooses to provide one. BYOK should be supported for LLM keys too.

Output strict validated JSON:
- title
- summary
- targetDurationSeconds
- aspectRatio
- language
- narration
- scenes[]
  - sceneNumber
  - narration
  - visualPrompt
  - negativePrompt
  - plannedDurationSeconds
  - recommendedVideoProvider
  - recommendedModel
  - generationMode (`text_to_video` or `image_to_video`)
  - continuityNotes
  - transition
- captions/subtitle text
- callToAction (optional)

Script generation must not claim a scene has been generated. It only creates the plan.

User can:
- Edit title, narration and prompts.
- Reorder scenes.
- Add/delete scenes.
- Regenerate the script.
- Approve the plan before video generation.

Duration planning:
- Provider clip duration limits must be respected.
- The planner may split a long scene into multiple provider jobs.
- Total final duration can differ from target because model outputs have fixed duration; show expected final duration before rendering.
- Do not fabricate extra seconds using still-image animation. Use actual generated video clips; trimming/concatenation is acceptable.

### 5.5 Video generation
- Generate scenes sequentially or in parallel based on provider limits and user's concurrency setting.
- Provider adapter supports synchronous and asynchronous APIs.
- For asynchronous APIs: create provider job, store provider job ID, poll status with exponential backoff and jitter, or accept signed webhooks where supported.
- Idempotency keys prevent duplicate charges/jobs when the user retries or network times out.
- Record request metadata, response metadata (redacted), provider job ID, timestamps, attempts, latency, status, error code.
- Never log API keys, authorization headers, signed URLs, or full sensitive request payloads.
- Retry only transient errors; do not retry invalid key, policy rejection, insufficient quota, or payment-required errors automatically.
- A retry must be user initiated for billing-related errors.
- User can cancel queued jobs. If provider supports cancellation, attempt it; otherwise mark cancellation pending and explain that remote inference may continue.
- Allow scene-level regeneration.
- Preserve successful scenes when another scene fails.
- Provider outage must not silently trigger another provider.
- Auto-routing can select only among user-enabled connections and must show which provider/model was selected before submitting jobs.

### 5.6 Audio and subtitles
- Voiceover can be generated through a user's connected TTS provider or omitted.
- Support uploaded narration audio.
- Subtitle text can be generated from approved script narration.
- Generate SRT and optionally burn captions into final video.
- Keep voiceover and music tracks separate until final render.
- Background music must be user-uploaded or sourced from assets with explicit suitable licensing.
- Do not scrape or use copyrighted commercial music without permission.
- Audio generation providers should use the same BYOK credential architecture.

### 5.7 Rendering and final output
Use FFmpeg in a dedicated worker/container, not inside the HTTP request process.
- Download completed scene clips from provider.
- Upload original scene clips to S3.
- Validate files with ffprobe.
- Normalize codec, dimensions, frame rate, pixel format and audio layout as required.
- Concatenate clips in scene order.
- Mix narration and optional licensed music.
- Add subtitles if requested.
- Export MP4 (H.264/AAC as initial compatibility target).
- Upload final MP4 to S3.
- Generate poster/thumbnail from an actual video frame.
- Store render manifest, output metadata, file size, duration, resolution, codec.
- Provide preview and expiring download URL.
- Rendering failure must preserve original scene clips so user can retry rendering without paying for video generation again.

## 6. Provider integration architecture

### 6.1 Provider catalogue
Maintain a central provider/model catalogue. Do not hard-code provider names into UI components.

Provider catalogue fields:
- providerId
- displayName
- company
- country
- providerType (`direct` or `aggregator`)
- documentationUrl
- API base URL
- authentication type (`bearer`, `api_key_header`, `query_parameter`, `custom`)
- supported capabilities (`text_to_video`, `image_to_video`, `reference_to_video`, `video_extension`, `audio_generation`)
- supported models and model IDs
- supported aspect ratios
- supported resolutions
- min/max clip duration
- async/sync behavior
- polling endpoint pattern or webhook support
- quota/balance endpoint support
- pricing metadata and source URL
- billing classification
- enabled/disabled status
- maintenance status
- last verified timestamp
- terms/commercial-use notes
- region restrictions

Provider/model metadata must be admin-editable. Do not claim an API or free quota is available unless verified from provider documentation or a successful test.

### 6.2 User provider connections
Users can add multiple connections for the same provider, e.g. separate accounts or regions.

Connection fields:
- userId
- providerId
- displayName (e.g. "My Alibaba Singapore key")
- encrypted credential payload
- region
- optional base URL (allowlist/validation required)
- optional project/workspace ID
- connection status (`untested`, `valid`, `invalid`, `quota_exhausted`, `disabled`, `error`)
- last tested timestamp
- last successful generation timestamp
- last error code (sanitized)
- user-configured daily/monthly limits
- user-configured maximum cost per project
- `blockPaidOrUnknownProviders`
- createdAt/updatedAt

Credential security:
- Encrypt credentials server-side using envelope encryption (AWS KMS preferred; otherwise a strong application encryption key stored in a secret manager).
- Use AES-256-GCM or an equivalent authenticated encryption design with unique nonce/IV.
- Store ciphertext, nonce, auth tag, key version; never store plaintext.
- Decrypt only in the provider execution worker immediately before making the API request.
- Mask keys in UI, e.g. `sk-****abcd`.
- Do not return ciphertext or plaintext in normal API responses.
- Do not put credentials in localStorage, sessionStorage, URLs, analytics, error traces, or logs.
- Add rotate, replace, test, disable and delete actions.
- Use least-privilege IAM roles and separate dev/staging/production secrets.

### 6.3 Provider adapter interface
Implement a common TypeScript contract:

```ts
interface VideoProviderAdapter {
  providerId: string;

  validateCredentials(
    credentials: DecryptedCredentials,
    config?: ProviderConfig
  ): Promise<CredentialTestResult>;

  getCapabilities(
    credentials: DecryptedCredentials,
    modelId: string
  ): Promise<ModelCapabilities>;

  generateVideo(
    credentials: DecryptedCredentials,
    request: VideoGenerationRequest,
    idempotencyKey: string
  ): Promise<ProviderGenerationAccepted>;

  getGenerationStatus(
    credentials: DecryptedCredentials,
    providerJobId: string
  ): Promise<ProviderGenerationStatus>;

  cancelGeneration?(
    credentials: DecryptedCredentials,
    providerJobId: string
  ): Promise<CancelResult>;

  getUsage?(
    credentials: DecryptedCredentials
  ): Promise<ProviderUsage>;
}
```

Use separate adapter classes for each provider. Normalize all provider responses into internal types. Keep provider-specific parameters in a validated `providerOptions` object and never pass arbitrary untrusted user fields directly to provider APIs.

### 6.4 Initial provider integrations
Implement the adapter framework first, then add providers in this order:
1. Alibaba Cloud Model Studio (Wan)
2. Google video API, only for models/endpoints confirmed active and available to the user's account
3. NVIDIA video API / NIM endpoint, after validating actual API access and current model availability
4. Tencent Hunyuan
5. MiniMax Hailuo
6. ByteDance Volcengine Seedance
7. Kling
8. Vidu
9. PixVerse
10. xAI Grok Imagine Video
11. Luma
12. Runway
13. WaveSpeedAI
14. Magic Hour
15. PiAPI
16. fal.ai
17. Replicate
18. Hugging Face Inference Providers
19. Novita AI
20. Segmind

This is an integration roadmap, not a claim that all providers offer free API calls. Each provider must be verified individually. Claude is an LLM/script provider, not a video-generation provider. OpenAI Sora should not be added unless a currently supported official API is independently verified.

Do not implement fake adapters or hardcode unverified endpoints. If API docs/credentials are unavailable, create a disabled provider catalogue entry and a clear `not_implemented` status.

## 7. Usage, limits, quota and cost management

### 7.1 Usage tracking
Record every provider request and result:
- userId
- projectId
- sceneId
- providerId
- connectionId
- modelId
- request type
- provider job ID
- requested duration/resolution/aspect ratio
- actual generated duration
- provider-reported units/credits/cost if returned
- estimated cost (clearly marked estimate)
- billing classification snapshot
- start/completion timestamps
- status and sanitized error

### 7.2 Quota sources
Quota can be:
1. Provider-reported via official usage/balance API.
2. Inferred from provider response headers/usage response.
3. Manually entered by user.
4. Unknown/unavailable.

Always show the source and last checked time. Never invent remaining quota.

### 7.3 Limits
Allow users to configure:
- Max jobs per day.
- Max jobs per month.
- Max concurrent scene generations.
- Max scenes per project.
- Max video duration per project.
- Max estimated cost per project.
- Max provider requests per day.
- Block paid/unknown providers.
- Pause generation if provider quota cannot be verified (optional strict setting).

Admin can configure platform-wide safety ceilings:
- Max request size.
- Max scenes per project.
- Max concurrent jobs per user.
- Max polling duration.
- Max download size.
- Max stored asset size.
- Provider-level emergency disable switch.

### 7.4 Usage dashboard
Show:
- Usage by provider.
- Usage by model.
- Jobs by day/month.
- Completed/failed/cancelled jobs.
- Estimated vs provider-reported cost.
- Provider quota remaining, when known.
- Free/trial/paid/unknown classification.
- Storage usage.
- User's configured limits and percentage consumed.

## 8. Amazon S3 storage design

Use one platform-owned private S3 bucket. Users do not need to provide their own S3 credentials in the initial version.

### 8.1 Storage layout
Use tenant-scoped object keys:

```text
s3://VIDEO_BUCKET/
  users/{userId}/
    projects/{projectId}/
      input/
        reference-{assetId}.{ext}
        narration-upload-{assetId}.{ext}
      scenes/
        {sceneId}/
          original-provider-output.mp4
          normalized.mp4
      audio/
        voiceover.mp3
        background-music.{ext}
      subtitles/
        captions.srt
      renders/
        {renderId}/
          final.mp4
          thumbnail.jpg
          manifest.json
```

Never use a user-supplied filename directly as the S3 object key. Generate UUID-based object names and store original display name as metadata.

### 8.2 S3 requirements
- Private bucket; block all public access.
- Enable server-side encryption (SSE-S3 or SSE-KMS).
- Enable bucket versioning if appropriate.
- Configure lifecycle rules for abandoned temporary assets and incomplete multipart uploads.
- Use least-privilege IAM roles.
- Use presigned GET URLs for temporary download/preview access.
- Use presigned PUT URLs for direct browser uploads where appropriate.
- Validate uploaded MIME type, extension, file size and actual file signature.
- Store object key, bucket, region, size, content type, checksum, duration and metadata in MongoDB.
- Do not store public S3 URLs.
- Do not expose AWS access key/secret to the browser.
- Do not use public-read ACLs.
- Apply per-user storage quotas.
- Delete S3 assets when user deletes a project, subject to retention policy.
- Keep provider source URL separately from S3 object key; download provider output promptly because provider URLs may expire.

### 8.3 S3 access pattern
For provider-generated clips:
1. Worker receives completed provider result.
2. Worker downloads the provider's temporary output using a controlled HTTP client.
3. Validate content type, file size and video stream.
4. Upload stream/file to S3.
5. Store S3 key and metadata.
6. Do not save long-lived provider output URLs as the canonical asset URL.

For downloads:
1. Authenticated user requests download.
2. Backend checks project ownership.
3. Backend generates short-lived presigned GET URL.
4. Frontend downloads from S3.
5. URL expires automatically.

## 9. MongoDB data model

Use Mongoose schemas with timestamps, validation and indexes. Use ObjectId references. Every tenant-owned record must include `userId` or be reachable through a project that is checked against `userId`.

### 9.1 users
```ts
{
  _id: ObjectId,
  name: string,
  email: string, // unique, normalized
  passwordHash: string,
  role: "user" | "admin" | "support",
  emailVerifiedAt?: Date,
  status: "active" | "suspended" | "pending_verification",
  preferences: {
    language: string,
    timezone: string,
    theme: "light" | "dark" | "system"
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 9.2 provider_catalog
```ts
{
  _id: ObjectId,
  providerId: string, // unique slug
  name: string,
  company: string,
  country: string,
  providerType: "direct" | "aggregator",
  docsUrl: string,
  apiBaseUrl: string,
  authType: string,
  capabilities: string[],
  billingClassification: "free_verified" | "trial" | "paid" | "unknown",
  freeQuotaPolicy: {
    amount?: number,
    unit?: string,
    renewal: "daily" | "weekly" | "monthly" | "one_time" | "none" | "unknown",
    expiryDays?: number,
    regionRestrictions?: string[],
    lastVerifiedAt?: Date,
    sourceUrl?: string
  },
  status: "active" | "maintenance" | "disabled" | "not_implemented",
  adminNotes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 9.3 provider_models
```ts
{
  _id: ObjectId,
  providerId: string,
  modelId: string,
  displayName: string,
  capabilities: string[],
  supportedDurationsSeconds: number[],
  maxDurationSeconds?: number,
  aspectRatios: string[],
  resolutions: string[],
  pricing: {
    unit?: string,
    amount?: number,
    currency?: string,
    pricingUrl?: string,
    verifiedAt?: Date
  },
  availability: "available" | "restricted" | "deprecated" | "unknown",
  enabled: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 9.4 user_provider_connections
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  providerId: string,
  label: string,
  encryptedCredentials: {
    ciphertext: string,
    iv: string,
    authTag: string,
    keyVersion: string
  },
  region?: string,
  workspaceId?: string,
  status: "untested" | "valid" | "invalid" | "quota_exhausted" | "disabled" | "error",
  lastTestedAt?: Date,
  lastSuccessfulUseAt?: Date,
  lastErrorCode?: string,
  limits: {
    dailyJobs?: number,
    monthlyJobs?: number,
    maxConcurrentJobs?: number,
    maxEstimatedCostPerProject?: number,
    blockPaidOrUnknownProviders: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

Unique/index considerations: `{ userId: 1, providerId: 1, label: 1 }`; never make credentials queryable or searchable.

### 9.5 video_projects
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  title: string,
  inputText: string,
  status: "draft" | "script_generating" | "awaiting_approval" |
          "queued" | "generating" | "rendering" | "completed" |
          "partial_failed" | "failed" | "cancelled",
  settings: {
    targetDurationSeconds: number,
    aspectRatio: "9:16" | "16:9" | "1:1",
    language: string,
    style: string,
    resolution: string,
    narrationEnabled: boolean,
    subtitlesEnabled: boolean,
    musicEnabled: boolean
  },
  providerSelection: {
    mode: "manual" | "auto",
    providerId?: string,
    modelId?: string,
    connectionId?: ObjectId
  },
  script: object,
  totalScenes: number,
  completedScenes: number,
  failedScenes: number,
  finalAssetId?: ObjectId,
  finalDurationSeconds?: number,
  createdAt: Date,
  updatedAt: Date,
  completedAt?: Date
}
```

### 9.6 video_scenes
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  projectId: ObjectId,
  sceneNumber: number,
  narration: string,
  visualPrompt: string,
  negativePrompt?: string,
  plannedDurationSeconds: number,
  generationMode: "text_to_video" | "image_to_video",
  providerId: string,
  modelId: string,
  connectionId: ObjectId,
  providerJobId?: string,
  status: "pending" | "queued" | "submitted" | "processing" |
          "downloading" | "stored" | "failed" | "cancelled",
  attempts: number,
  assetId?: ObjectId,
  sanitizedError?: {
    code: string,
    message: string,
    retryable: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 9.7 media_assets
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  projectId: ObjectId,
  sceneId?: ObjectId,
  type: "reference_image" | "source_video" | "scene_video" |
        "voiceover" | "music" | "subtitle" | "final_video" | "thumbnail",
  storage: {
    provider: "s3",
    bucket: string,
    key: string,
    region: string
  },
  mimeType: string,
  sizeBytes: number,
  checksum?: string,
  durationSeconds?: number,
  width?: number,
  height?: number,
  codec?: string,
  createdAt: Date
}
```

### 9.8 generation_jobs
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  projectId: ObjectId,
  sceneId?: ObjectId,
  jobType: "script" | "video_generation" | "video_download" |
           "audio_generation" | "render" | "cleanup",
  queueJobId?: string,
  status: "queued" | "processing" | "completed" | "failed" | "cancelled",
  attempts: number,
  idempotencyKey: string,
  startedAt?: Date,
  completedAt?: Date,
  errorCode?: string,
  errorMessage?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 9.9 provider_usage
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  connectionId: ObjectId,
  providerId: string,
  modelId: string,
  projectId: ObjectId,
  sceneId?: ObjectId,
  providerJobId?: string,
  usageUnit?: string,
  usageAmount?: number,
  providerReportedCost?: number,
  estimatedCost?: number,
  currency?: string,
  billingClassification: string,
  status: string,
  occurredAt: Date
}
```

### 9.10 user_storage_usage
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  totalBytes: number,
  assetCount: number,
  updatedAt: Date
}
```

### 9.11 audit_logs
Record provider key add/update/delete/test events, login/security events, admin changes, project deletion, quota changes and provider status changes. Never record secret values.

## 10. Backend architecture (NestJS)

Use a modular monolith with a separate worker process. Suggested structure:

```text
apps/
  api/
    src/
      main.ts
      app.module.ts
      modules/
        auth/
        users/
        dashboard/
        projects/
        script-engine/
        scenes/
        video-generation/
        providers/
          provider-catalog/
          provider-connections/
          adapters/
            contracts/
            alibaba/
            google/
            nvidia/
            tencent/
            minimax/
            bytedance/
            kling/
            vidu/
            pixverse/
            xai/
            luma/
            runway/
            wavespeed/
            magic-hour/
            piapi/
            fal/
            replicate/
            huggingface/
            novita/
            segmind/
        usage/
        quota/
        storage/
        media/
        rendering/
        notifications/
        admin/
        audit/
      common/
        guards/
        decorators/
        filters/
        interceptors/
        pipes/
        crypto/
        utils/
  worker/
    src/
      worker.module.ts
      processors/
        script.processor.ts
        scene-generation.processor.ts
        provider-poll.processor.ts
        download.processor.ts
        audio.processor.ts
        render.processor.ts
        cleanup.processor.ts
packages/
  shared-types/
  provider-sdk/
  config/
```

### Backend technology
- Node.js LTS
- NestJS
- TypeScript strict mode
- MongoDB + Mongoose
- Redis + BullMQ for durable background jobs
- AWS SDK v3 for S3
- AWS KMS for credential encryption key management
- FFmpeg + ffprobe in worker container
- Swagger/OpenAPI
- class-validator/class-transformer or Zod for validation
- Pino structured logging with redaction
- Jest for unit/integration tests
- Docker for local and production packaging

Use a Redis service for BullMQ in production. Do not process long-running video inference inside HTTP request handlers. NestJS queues support persisted jobs and workers; design for restart recovery.

## 11. Frontend architecture (React)

Use:
- React + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Zustand or lightweight context for UI state
- React Hook Form + Zod
- Video.js or native HTML video for preview

### Main application pages
1. `/login` – login.
2. `/register` – account creation.
3. `/forgot-password` – reset flow.
4. `/dashboard` – overview and recent videos.
5. `/videos` – all projects/history.
6. `/videos/new` – create video wizard.
7. `/videos/:id` – project details, scenes, progress and preview.
8. `/videos/:id/edit-script` – script and scene prompt review.
9. `/providers` – provider catalogue and available models.
10. `/settings/providers` – user's connected API keys.
11. `/settings/profile` – profile and preferences.
12. `/settings/limits` – personal limits and strict free-only preference.
13. `/usage` – provider usage, limits and storage.
14. `/admin` – platform admin overview.
15. `/admin/providers` – provider/model catalogue management.
16. `/admin/jobs` – all generation jobs and failure diagnostics.
17. `/admin/users` – user management and suspension.
18. `/admin/storage` – storage usage and cleanup status.

### Design direction
- Professional modern SaaS dashboard.
- Responsive desktop-first layout, usable on mobile.
- Left sidebar: Dashboard, Create Video, My Videos, Providers, Usage, Settings.
- Top bar: project search, notifications, profile.
- Clear status badges: Queued, Generating, Rendering, Completed, Failed.
- Show provider/model and masked connection label on every project.
- Show quota source and last checked timestamp.
- Avoid fake analytics; all dashboard figures must come from real DB records.
- Include skeleton/loading states, empty states, error states, retry actions and confirmation dialogs.

## 12. API endpoint specification

All endpoints use `/api/v1`. Apply JWT authentication except public auth and health endpoints. Validate DTOs, enforce ownership, and return a consistent response envelope.

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/verify-email`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

### Dashboard and projects
- `GET /dashboard/summary`
- `GET /projects`
- `POST /projects`
- `GET /projects/:projectId`
- `PATCH /projects/:projectId`
- `DELETE /projects/:projectId`
- `POST /projects/:projectId/duplicate`

### Script and scenes
- `POST /projects/:projectId/script/generate`
- `PATCH /projects/:projectId/script`
- `POST /projects/:projectId/script/approve`
- `GET /projects/:projectId/scenes`
- `POST /projects/:projectId/scenes`
- `PATCH /projects/:projectId/scenes/:sceneId`
- `DELETE /projects/:projectId/scenes/:sceneId`
- `POST /projects/:projectId/scenes/:sceneId/regenerate`

### Generation
- `POST /projects/:projectId/generate`
- `GET /projects/:projectId/progress`
- `POST /projects/:projectId/cancel`
- `POST /projects/:projectId/retry-failed`
- `GET /projects/:projectId/jobs`
- `GET /jobs/:jobId`

### Provider catalogue and user connections
- `GET /providers`
- `GET /providers/:providerId`
- `GET /providers/:providerId/models`
- `GET /provider-connections`
- `POST /provider-connections`
- `POST /provider-connections/:connectionId/test`
- `PATCH /provider-connections/:connectionId`
- `POST /provider-connections/:connectionId/rotate`
- `DELETE /provider-connections/:connectionId`
- `GET /provider-connections/:connectionId/usage`
- `POST /provider-connections/:connectionId/refresh-usage`

### Media and S3
- `POST /uploads/presign`
- `POST /uploads/complete`
- `GET /assets/:assetId`
- `GET /assets/:assetId/download-url`
- `DELETE /assets/:assetId`

### Usage and limits
- `GET /usage/summary`
- `GET /usage/providers`
- `GET /usage/history`
- `GET /limits`
- `PATCH /limits`

### Rendering
- `POST /projects/:projectId/render`
- `GET /projects/:projectId/render-status`
- `GET /projects/:projectId/download`

### Admin
- `GET /admin/dashboard`
- `GET /admin/users`
- `PATCH /admin/users/:userId/status`
- `GET /admin/providers`
- `POST /admin/providers`
- `PATCH /admin/providers/:providerId`
- `POST /admin/providers/:providerId/disable`
- `GET /admin/models`
- `POST /admin/models`
- `PATCH /admin/models/:modelId`
- `GET /admin/jobs`
- `GET /admin/audit-logs`
- `GET /admin/storage/usage`

Provider webhooks:
- `POST /webhooks/providers/:providerId`
- Verify provider signature where supported.
- Do not trust webhook payloads without verification.
- If a provider does not support webhooks, use polling.

## 13. Generation state machine

Project lifecycle:

```text
DRAFT
  -> SCRIPT_GENERATING
  -> AWAITING_APPROVAL
  -> QUEUED
  -> GENERATING
  -> RENDERING
  -> COMPLETED

Any stage may transition to FAILED or CANCELLED.
A project with some successful and some failed scenes may become PARTIAL_FAILED.
```

Scene lifecycle:

```text
PENDING
  -> QUEUED
  -> SUBMITTED
  -> PROCESSING
  -> DOWNLOADING
  -> STORED

Failure paths:
  -> FAILED
  -> CANCELLED
```

Use atomic DB updates/conditional transitions to prevent duplicate job processing. Store an idempotency key for each generation attempt.

## 14. Queue and worker design

Queues:
- `script-generation`
- `video-generation`
- `video-status-polling`
- `provider-webhooks`
- `media-download`
- `audio-generation`
- `video-render`
- `asset-cleanup`
- `usage-refresh`

Worker responsibilities:
1. Load job and verify user/project ownership.
2. Check user limits and connection status.
3. Load/decrypt that user's provider credentials.
4. Verify provider/model is enabled and supported.
5. Submit provider request.
6. Save provider job ID and normalized status.
7. Poll or process webhook.
8. Download output safely.
9. Validate video with ffprobe.
10. Upload output to S3.
11. Update scene, job, project and usage records.
12. Redact secrets and clean temporary files.

Use concurrency limits globally, per provider, per user, and per connection. Add exponential backoff with jitter and provider-specific rate-limit handling.

## 15. Security, privacy and abuse prevention

Must-have:
- Password hashing with Argon2id or bcrypt with appropriate cost.
- JWT access token short expiry and rotating refresh tokens.
- Secure, HttpOnly, SameSite cookies where possible.
- CSRF protection if cookie-based auth is used.
- Rate limits on auth, provider tests, script generation and video generation.
- DTO validation and strict payload size limits.
- Tenant ownership checks in every service/query.
- Credential encryption with KMS/envelope encryption.
- Secrets redaction in logs, traces and error reporting.
- S3 bucket private; no public access.
- Short-lived presigned download URLs.
- Validate provider output URLs to prevent SSRF; block private/internal IP ranges and unsafe redirects.
- Restrict configurable provider base URLs to trusted allowlisted domains.
- File upload MIME/signature validation and malware scanning where appropriate.
- Admin RBAC and audit logs.
- CORS allowlist.
- Helmet/security headers.
- Dependency and container scanning.
- Data deletion workflow and retention policy.
- Do not send provider API keys to any LLM or script-generation model.
- Do not store full authorization headers in MongoDB or job payloads.
- Do not put API keys in BullMQ payloads; workers should resolve encrypted connection records by ID.

## 16. Error handling and user-facing messages

Normalize provider errors:
- `INVALID_API_KEY`
- `AUTHENTICATION_FAILED`
- `INSUFFICIENT_QUOTA`
- `PAYMENT_REQUIRED`
- `RATE_LIMITED`
- `MODEL_UNAVAILABLE`
- `REGION_NOT_SUPPORTED`
- `CONTENT_POLICY_REJECTED`
- `PROVIDER_TIMEOUT`
- `PROVIDER_SERVER_ERROR`
- `INVALID_REQUEST`
- `OUTPUT_DOWNLOAD_FAILED`
- `INVALID_VIDEO_OUTPUT`
- `S3_UPLOAD_FAILED`
- `RENDER_FAILED`
- `USER_LIMIT_EXCEEDED`
- `PROVIDER_DISABLED`

User-facing messages must be actionable. Example:
- Invalid key: "The API key was rejected by Alibaba Model Studio. Update your connection and test again."
- Insufficient quota: "Your provider account has insufficient quota. No alternate provider was used."
- Paid endpoint: "This model requires paid billing. It was not called because your free-only setting is enabled."
- Unknown quota: "This provider does not expose remaining quota. Continue only if you accept the provider's billing terms."
- Render failure: "Your generated scenes are saved. Retry rendering without regenerating the scenes."

## 17. Admin console requirements

Platform admins can:
- Add/edit/disable provider catalogue entries.
- Add/edit/disable model entries.
- Configure docs, capability, model ID, API base URL, auth type and parameter schema.
- Set provider billing classification and evidence/source URL.
- Record last free-quota verification date and expiry/renewal policy.
- See global job volume and error rates.
- See provider outages and latency.
- See total S3 storage and per-user usage.
- Suspend abusive users.
- Configure global concurrency and rate limits.
- Review audit logs.
- Disable a provider immediately if its API changes or becomes unsafe.

Admins must not be able to view users' decrypted API keys. A key should only be decrypted by the execution worker when required.

## 18. Observability and operations

- Structured JSON logs with correlation IDs.
- Metrics: job count, success rate, provider latency, queue depth, polling count, S3 upload errors, render duration, worker memory/CPU.
- Error tracking with secrets redacted.
- Health endpoints: `/health/live`, `/health/ready`.
- Queue dashboard restricted to admins.
- Alert on repeated provider failures, queue backlog, S3 errors and worker crashes.
- Graceful shutdown and queue job recovery.
- Daily reconciliation of usage records and storage counters.
- Backup MongoDB and test restore procedure.

## 19. Deployment and environment configuration

Recommended initial deployment:
- Frontend: Cloudflare Pages, Vercel or equivalent.
- API: Dockerized NestJS service on a suitable Node hosting platform.
- Worker: separate Dockerized process with FFmpeg installed.
- Database: MongoDB Atlas.
- Queue: managed Redis compatible with BullMQ.
- Storage: Amazon S3.
- Encryption: AWS KMS.
- Email: transactional email provider.
- Monitoring: Sentry/OpenTelemetry-compatible stack.

Do not assume the free tier of any host can run sustained FFmpeg jobs or high-volume workers. Keep infrastructure provider configurable.

Environment variables (examples only; never commit actual secrets):

```env
NODE_ENV=development
PORT=3000
WEB_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:3000/api/v1

MONGODB_URI=
REDIS_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CREDENTIAL_ENCRYPTION_KEY=
AWS_REGION=
AWS_S3_BUCKET=
AWS_KMS_KEY_ID=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

EMAIL_FROM=
EMAIL_PROVIDER_API_KEY=

LOG_LEVEL=debug
```

Prefer IAM roles/workload identity over static AWS access keys in production.

## 20. Testing strategy

### Unit tests
- Credential encryption/decryption and rotation.
- Provider adapter request/response normalization.
- Quota/limit enforcement.
- Project and scene state transitions.
- Idempotency.
- Tenant access controls.
- S3 object-key generation.
- Error normalization.

### Integration tests
- MongoDB repositories.
- Redis/BullMQ job recovery.
- S3 upload/download/presigned URLs.
- Provider adapters with mocked HTTP responses.
- Webhook signature validation.
- FFmpeg render and ffprobe validation.

### End-to-end tests
1. Register and login.
2. Add a provider key.
3. Test the key.
4. Create a 30-second project.
5. Generate script and approve scenes.
6. Generate at least one real video scene using a sandbox/test provider account.
7. Verify provider job ID and status polling.
8. Verify scene MP4 is uploaded to S3.
9. Render final MP4.
10. Verify preview/download.
11. Confirm history and usage records.
12. Confirm invalid key fails safely.
13. Confirm quota exhaustion does not trigger another provider.
14. Confirm one user cannot access another user's project, key, job or S3 asset.
15. Confirm deleted projects and assets follow retention/deletion rules.

Use mocked provider adapters for CI; real provider calls must be opt-in and must never run in ordinary automated tests.

## 21. MVP acceptance criteria

The MVP is complete only when:
- A user can register, verify email, login and logout.
- A user can securely add multiple API keys.
- API keys are masked and encrypted at rest.
- A user can test and disable/delete a connection.
- Provider catalogue is dynamic and admin-managed.
- At least two real video providers are implemented end-to-end; the adapter framework supports adding more.
- A user can create a 30-second vertical project.
- Script is generated into editable scenes.
- Every completed scene contains an actual moving video file.
- Generation is asynchronous and progress is visible.
- Scene outputs are uploaded to private S3.
- FFmpeg renders final MP4 and stores it in S3.
- User can preview/download the video using an authorized expiring URL.
- Project history shows provider, model, job status, dates and output.
- Usage and quota status are visible, with unknown quota clearly labelled.
- User-configured limits are enforced.
- Paid/unknown provider calls are blocked when free-only mode is enabled.
- No silent paid fallback exists.
- A user cannot access another user's data or credentials.
- Admin can disable providers and inspect operational metrics.
- Automated tests cover security, limits, jobs and core generation flow.

## 22. Phased delivery plan

### Phase 0 – Repository and technical design
- Inspect repository.
- Create architecture and implementation plan.
- Confirm Node/React versions and package manager.
- Set up monorepo or clearly separated apps.
- Define API contracts and DB schemas.
- Create `.env.example`.
- Create ADRs for credential encryption, queues, storage and provider adapters.

### Phase 1 – SaaS foundation
- Authentication and RBAC.
- User profile.
- MongoDB schemas and indexes.
- React dashboard shell.
- Provider catalogue.
- User provider connections.
- Credential encryption and key testing.
- Audit logs.

### Phase 2 – First provider adapters
- Implement common provider SDK contract.
- Integrate Alibaba Wan.
- Integrate one additional provider with a documented video API.
- Implement async jobs, polling/webhooks and normalized errors.
- Add mock provider for CI.
- Do not add unverified endpoints.

### Phase 3 – Script and scene planner
- BYOK LLM connection support.
- Script JSON generation.
- Scene editing and approval.
- Provider capability-based validation.

### Phase 4 – Actual video generation
- Scene job queue.
- Provider execution worker.
- Status polling.
- Retry and cancellation behavior.
- Download/validate generated clips.
- Upload scene clips to S3.

### Phase 5 – Render and media library
- FFmpeg worker.
- Audio/subtitles.
- Final MP4 upload.
- Thumbnail.
- Preview/download.
- Project history and scene regeneration.

### Phase 6 – Usage and admin
- Provider usage records.
- User limits.
- Free-only enforcement.
- Admin provider/model management.
- Admin jobs and storage screens.
- Monitoring and audit.

### Phase 7 – Expand to 10–20 providers
Add each provider using the same adapter contract. For each integration, require:
- Official or provider-maintained API documentation.
- Working credential validation.
- Actual video-generation test.
- Model capability metadata.
- Correct async job handling.
- Error and quota mapping.
- Billing classification evidence.
- Unit and integration tests.
- Admin enablement only after verification.

## 23. Required documentation deliverables

Create and maintain:
- `README.md` – setup, run and test.
- `docs/PRD.md` – this product requirements document.
- `docs/ARCHITECTURE.md` – components and data flow.
- `docs/DATABASE.md` – collections, fields and indexes.
- `docs/API.md` – endpoints and examples.
- `docs/PROVIDERS.md` – provider integrations, docs, model IDs, billing status and verification date.
- `docs/SECURITY.md` – BYOK encryption, threat model, S3 and tenant isolation.
- `docs/DEPLOYMENT.md` – staging/production deployment.
- `docs/DECISIONS/` – architecture decision records.
- `.env.example` – placeholders only.

## 24. Instructions to Google Antigravity

Act as a senior product engineer, SaaS architect, backend engineer, frontend engineer, security engineer and QA engineer.

Build this product in the existing workspace.

**Before coding:**
1. Inspect all existing files and repository structure.
2. Do not overwrite an existing project blindly.
3. Produce an implementation plan and architecture diagram.
4. Identify missing secrets/configuration without asking the user to paste secrets into chat.
5. Create a task checklist and break implementation into verifiable phases.
6. Record any requirement that cannot be implemented or verified.

**During implementation:**
1. Implement working end-to-end features, not just static UI mockups.
2. Use strict TypeScript and maintainable modular architecture.
3. Build real authentication, MongoDB persistence, encrypted BYOK credentials, queues, S3 storage and provider adapters.
4. Use environment variables and secret management; never hardcode secrets.
5. Use mock adapters for providers whose API credentials are not available.
6. Do not invent provider endpoints, API schemas, model IDs, free quotas or pricing.
7. Do not use image generation as a substitute for actual video generation.
8. Do not silently call paid providers or use platform-owner API keys for users.
9. Implement tenant isolation in every data access path.
10. Add tests as each module is completed.

**Execution order:**
- First deliver repository assessment, architecture, database design and implementation plan.
- Then complete Phase 1.
- Continue phase by phase, running tests and builds after each phase.
- Do not stop after producing a frontend mockup.
- Do not claim an integration works until a real provider test succeeds or clearly label it as mocked.
- If real credentials are unavailable, finish the adapter with mocks and document exactly what is needed to enable it.
- Ask for user approval before destructive database migrations, production deployments, paid cloud resource creation or any operation that can incur charges.

**Final handoff:**
- Provide exact commands to install, configure, run, test and build.
- List implemented and mocked providers separately.
- List required environment variables.
- Provide screenshots or browser walkthrough of the working application.
- Report test/build results and known limitations.
- Ensure no real API keys or AWS secrets are committed to source control.

---

# Final product definition

Build a secure multi-user SaaS where each user connects their own AI provider credentials, generates real moving video scenes from text, monitors provider/model usage and limits, and stores all generated media in the platform's private Amazon S3 bucket. Use React, NestJS, MongoDB, Redis/BullMQ, AWS S3, AWS KMS and FFmpeg. The system must be provider-agnostic, auditable, tenant-isolated, and must never make paid API calls without explicit user authorization.
