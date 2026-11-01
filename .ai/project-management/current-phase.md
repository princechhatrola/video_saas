# Current Phase

> Updated automatically for VideoForge AI code generation tracking.

---

## Active Phase: PHASE-01 — Foundation, Monorepo Architecture, BYOK Provider Engine & Full Stack Pipeline

**Phase Status:** 🟢 ACTIVE / CORE CODEBASE GENERATED

### Objectives Achieved:
1. **Shared Types (`@videoforge/shared-types`)**:
   - Complete data model: User, Project, Scene, MediaAsset, GenerationJob, ProviderCatalog, UserProviderConnection.
   - Core Enums: `ConnectionStatus`, `BillingClassification`, `ProviderCapability`, `JobType`, `SceneStatus`, `AssetType`, `AspectRatio`.
   - Security primitives: `EncryptedCredentialEnvelope`, `DecryptedCredentials`.
2. **Provider SDK (`@videoforge/provider-sdk`)**:
   - Unified `VideoProviderAdapter` interface for external AI video engines.
   - Provider adapters:
     - `alibaba-wan.adapter.ts` (DashScope Wan 2.1 T2V & I2V)
     - `minimax.adapter.ts` (MiniMax Hailuo AI Video-01)
     - `runway.adapter.ts` (Runway Gen-3 Alpha Turbo)
     - `luma.adapter.ts` (Luma Ray 2)
     - `kling.adapter.ts` (Kuaishou Kling 1.5)
   - Dynamic `VideoProviderAdapterFactory` router.
3. **API Application (`apps/api`)**:
   - NestJS 11 + Mongoose 8 + Express entry point with Swagger docs, CORS, global validation pipes.
   - AES-256-GCM envelope encryption service (`CredentialCryptoService`) with UI key masking (`sk-****abcd`).
   - `AuthModule`: Argon2id password hashing, JWT access & rotating refresh tokens, rate limiting.
   - `UsersModule`: User profile CRUD with `select: false` security fields.
   - `ProvidersModule`: BYOK connection management, key testing, provider catalog & model seeders.
   - `ProjectsModule`: Multi-scene video projects, automatic scene decomposition & prompt planning, generation triggers.
   - `DashboardModule`: Studio metrics & stats aggregation.
   - `AdminModule`: Platform oversight & audit log inspection.
   - `HealthModule`: Liveness & readiness probes.
4. **Worker Application (`apps/worker`)**:
   - Background processing worker with MongoDB integration.
   - Decrypts user BYOK keys in-memory only at time of dispatch.
   - Calls provider adapter, submits prompt, polls until video rendering completes.
   - Ingests generated video clips and uploads directly to Amazon S3 bucket via `@aws-sdk/client-s3`.
   - Updates Scene status (`STORED`) and finalizes master video when all scenes finish.
5. **Frontend Application (`apps/frontend`)**:
   - Next.js 14 App Router with Tailwind CSS, Shadcn dark theme, and Lucide icons.
   - Landing page with interactive architecture visualization and provider grid.
   - Studio Dashboard (`/dashboard`) with real-time project metrics.
   - BYOK API Providers Hub (`/providers`) with encrypted key creation modal, test key action, masked keys list, and catalog inspector.
   - Project Creation Wizard (`/projects/new`) with duration (30s/60s/90s/120s), aspect ratio (9:16/16:9/1:1), visual styles, and inspiration presets.
   - Project Studio (`/projects/[id]`) with scene timeline, visual prompts, live generation status tracking, and MP4 master player with download.
