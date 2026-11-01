# Architectural & Implementation Decisions

> Recorded decisions for VideoForge AI following the PRD requirements.

---

## Decision Log

| ID | Date | Decision | Rationale | Status |
|----|------|----------|-----------|--------|
| ADR-001 | 2026-11-01 | AES-256-GCM Envelope Encryption for BYOK Credentials | Protects user API keys at rest in MongoDB; decrypted only in-memory inside worker | Accepted |
| ADR-002 | 2026-11-01 | Adapter Pattern with Normalized Status & Capabilities | Encapsulates divergent video provider APIs (Wan 2.1, Hailuo, Runway, Luma, Kling) behind unified interface | Accepted |
| ADR-003 | 2026-11-01 | Central S3 Ingestion for Completed Moving Clips | Guarantees permanent asset retention and prevents expired temporary provider URLs | Accepted |

---

### ADR-001: AES-256-GCM Envelope Encryption for BYOK Credentials

**Date**: 2026-11-01  
**Status**: Accepted  
**Phase**: PHASE-01

#### Context
VideoForge AI operates on a Bring Your Own Key (BYOK) model. Users store sensitive credentials for commercial video models. If MongoDB were compromised, plaintext keys would leak.

#### Decision
All provider keys are encrypted upon ingestion with AES-256-GCM using a 96-bit random IV and 16-byte authentication tag (`CredentialCryptoService`). Mongoose entities configure `encryptedCredentials` with `{ select: false }`. Plaintext is never returned to the frontend; only masked keys (`sk-****1234`) are displayed.

---

### ADR-002: Adapter Pattern for Multi-Provider AI Video Generation

**Date**: 2026-11-01  
**Status**: Accepted  
**Phase**: PHASE-01

#### Context
External video generation APIs (Alibaba DashScope, MiniMax, Runway, Luma, Kling) use vastly different parameter names, polling endpoints, response schemas, and error codes.

#### Decision
Created `@videoforge/provider-sdk` with `VideoProviderAdapter` interface and `VideoProviderAdapterFactory`. Each provider implements `generateVideo`, `getGenerationStatus`, `validateCredentials`, and `getCapabilities`, normalizing all outputs to common VideoForge types.

---

### ADR-003: Direct S3 Ingestion for Moving Video Clips

**Date**: 2026-11-01  
**Status**: Accepted  
**Phase**: PHASE-01

#### Context
Video providers return presigned CDN URLs that expire after 1–24 hours. The PRD specifies that users must have perpetual access to their generated clips in central platform storage.

#### Decision
The worker streams the generated clip directly from the provider's temporary URL and uploads it into the SaaS platform's Amazon S3 bucket via `@aws-sdk/client-s3`. Scene documents store the permanent S3 key reference and public/presigned URL.
