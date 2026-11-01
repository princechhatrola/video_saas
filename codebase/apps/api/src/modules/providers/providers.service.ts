import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ProviderConnectionsRepository } from './provider-connections.repository';
import { ProviderCatalogRepository } from './provider-catalog/provider-catalog.repository';
import { CredentialCryptoService } from '../../common/crypto/credential-crypto.service';
import { AuditService } from '../audit/audit.service';
import { CreateProviderConnectionDto } from './dto/create-provider-connection.dto';
import { UpdateProviderConnectionDto } from './dto/update-provider-connection.dto';
import {
  AuditAction,
  ConnectionStatus,
  MaskedConnectionView,
  ProviderCatalogEntry,
  ProviderModelEntry,
} from '@videoforge/shared-types';
import { SEED_PROVIDERS, SEED_MODELS } from './provider-catalog/provider-catalog.seed';

@Injectable()
export class ProvidersService implements OnModuleInit {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private readonly connectionsRepo: ProviderConnectionsRepository,
    private readonly catalogRepo: ProviderCatalogRepository,
    private readonly cryptoService: CredentialCryptoService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedCatalogIfEmpty();
  }

  async seedCatalogIfEmpty(): Promise<void> {
    try {
      const count = await this.catalogRepo.count();
      if (count === 0) {
        this.logger.log('Seeding initial provider catalog and models...');
        for (const provider of SEED_PROVIDERS) {
          await this.catalogRepo.upsertProvider(provider as any);
        }
        for (const model of SEED_MODELS) {
          await this.catalogRepo.upsertModel(model as any);
        }
        this.logger.log('Provider catalog seeded successfully.');
      }
    } catch (err: any) {
      this.logger.error(`Failed to seed provider catalog: ${err.message}`);
    }
  }

  // ── Catalog Methods ──────────────────────────────────────────

  async getCatalog(onlyActive = true): Promise<any[]> {
    const providers = await this.catalogRepo.findAll(onlyActive);
    const result = [];
    for (const p of providers) {
      const models = await this.catalogRepo.findModelsByProviderId(p.providerId);
      result.push({
        id: p._id.toString(),
        providerId: p.providerId,
        name: p.name,
        company: p.company,
        country: p.country,
        providerType: p.providerType,
        docsUrl: p.docsUrl,
        apiBaseUrl: p.apiBaseUrl,
        authType: p.authType,
        capabilities: p.capabilities,
        billingClassification: p.billingClassification,
        freeQuotaPolicy: p.freeQuotaPolicy,
        status: p.status,
        models: models.map((m) => ({
          id: m._id.toString(),
          providerId: m.providerId,
          modelId: m.modelId,
          displayName: m.displayName,
          capabilities: m.capabilities,
          supportedDurationsSeconds: m.supportedDurationsSeconds,
          maxDurationSeconds: m.maxDurationSeconds,
          aspectRatios: m.aspectRatios,
          resolutions: m.resolutions,
          pricing: m.pricing,
          availability: m.availability,
          enabled: m.enabled,
        })),
      });
    }
    return result;
  }

  async getProviderDetails(providerId: string): Promise<any> {
    const provider = await this.catalogRepo.findByProviderId(providerId);
    if (!provider) {
      throw new NotFoundException(`Provider '${providerId}' not found in catalog`);
    }
    const models = await this.catalogRepo.findModelsByProviderId(providerId);
    return {
      id: provider._id.toString(),
      ...provider.toObject(),
      models,
    };
  }

  // ── Connection Methods (BYOK) ────────────────────────────────

  async listUserConnections(userId: string): Promise<MaskedConnectionView[]> {
    const connections = await this.connectionsRepo.findByUserId(userId);
    return connections.map((c) => ({
      id: c._id.toString(),
      userId: c.userId.toString(),
      providerId: c.providerId,
      label: c.label,
      region: c.region,
      workspaceId: c.workspaceId,
      status: c.status,
      maskedKey: c.maskedKey,
      lastTestedAt: c.lastTestedAt,
      lastSuccessfulUseAt: c.lastSuccessfulUseAt,
      lastErrorCode: c.lastErrorCode,
      limits: c.limits,
      quotaInfo: c.quotaInfo as any,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async getConnection(userId: string, connectionId: string): Promise<MaskedConnectionView> {
    const connection = await this.connectionsRepo.findByIdAndUserId(connectionId, userId);
    if (!connection) {
      throw new NotFoundException('Provider connection not found');
    }
    return {
      id: connection._id.toString(),
      userId: connection.userId.toString(),
      providerId: connection.providerId,
      label: connection.label,
      region: connection.region,
      workspaceId: connection.workspaceId,
      status: connection.status,
      maskedKey: connection.maskedKey,
      lastTestedAt: connection.lastTestedAt,
      lastSuccessfulUseAt: connection.lastSuccessfulUseAt,
      lastErrorCode: connection.lastErrorCode,
      limits: connection.limits,
      quotaInfo: connection.quotaInfo as any,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  async createConnection(
    userId: string,
    dto: CreateProviderConnectionDto,
    reqMeta?: { ip?: string; userAgent?: string },
  ): Promise<MaskedConnectionView> {
    // 1. Verify provider exists in catalog
    const provider = await this.catalogRepo.findByProviderId(dto.providerId);
    if (!provider) {
      throw new BadRequestException(`Provider '${dto.providerId}' is not supported`);
    }

    // 2. Encrypt credentials via AES-256-GCM
    const encryptedCredentials = this.cryptoService.encrypt({
      apiKey: dto.apiKey,
    });

    // 3. Mask the key for safe UI display (e.g. sk-****abcd)
    const maskedKey = this.cryptoService.maskKey(dto.apiKey);

    // 4. Save to DB
    const connection = await this.connectionsRepo.create({
      userId: userId as any,
      providerId: dto.providerId.toLowerCase(),
      label: dto.label,
      region: dto.region,
      workspaceId: dto.workspaceId,
      status: ConnectionStatus.CONNECTED,
      encryptedCredentials: encryptedCredentials as any,
      maskedKey,
      limits: dto.limits as any,
    });

    // 5. Audit log
    await this.auditService.log({
      userId,
      action: AuditAction.CREATE_PROVIDER_CONNECTION,
      resourceType: 'provider_connection',
      resourceId: connection._id.toString(),
      details: {
        providerId: dto.providerId,
        label: dto.label,
      },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return {
      id: connection._id.toString(),
      userId,
      providerId: connection.providerId,
      label: connection.label,
      region: connection.region,
      workspaceId: connection.workspaceId,
      status: connection.status,
      maskedKey: connection.maskedKey,
      limits: connection.limits,
      quotaInfo: connection.quotaInfo as any,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  async updateConnection(
    userId: string,
    connectionId: string,
    dto: UpdateProviderConnectionDto,
    reqMeta?: { ip?: string; userAgent?: string },
  ): Promise<MaskedConnectionView> {
    const existing = await this.connectionsRepo.findByIdAndUserId(connectionId, userId);
    if (!existing) {
      throw new NotFoundException('Provider connection not found');
    }

    const updates: any = {};
    if (dto.label !== undefined) updates.label = dto.label;
    if (dto.region !== undefined) updates.region = dto.region;
    if (dto.workspaceId !== undefined) updates.workspaceId = dto.workspaceId;

    if (dto.apiKey) {
      // Re-encrypt updated credentials
      updates.encryptedCredentials = this.cryptoService.encrypt({
        apiKey: dto.apiKey,
      });
      updates.maskedKey = this.cryptoService.maskKey(dto.apiKey);
      updates.status = ConnectionStatus.CONNECTED;
      updates.lastTestedAt = new Date();
    }

    const updated = await this.connectionsRepo.updateByIdAndUserId(
      connectionId,
      userId,
      updates,
    );

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE_PROVIDER_CONNECTION,
      resourceType: 'provider_connection',
      resourceId: connectionId,
      details: {
        updatedFields: Object.keys(updates).filter((k) => k !== 'encryptedCredentials'),
      },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return {
      id: updated!._id.toString(),
      userId,
      providerId: updated!.providerId,
      label: updated!.label,
      region: updated!.region,
      workspaceId: updated!.workspaceId,
      status: updated!.status,
      maskedKey: updated!.maskedKey,
      limits: updated!.limits,
      quotaInfo: updated!.quotaInfo as any,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    };
  }

  async deleteConnection(
    userId: string,
    connectionId: string,
    reqMeta?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const deleted = await this.connectionsRepo.deleteByIdAndUserId(connectionId, userId);
    if (!deleted) {
      throw new NotFoundException('Provider connection not found');
    }

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE_PROVIDER_CONNECTION,
      resourceType: 'provider_connection',
      resourceId: connectionId,
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });
  }

  async testConnection(
    userId: string,
    connectionId: string,
  ): Promise<{ success: boolean; message: string; status: ConnectionStatus }> {
    const connWithCreds = await this.connectionsRepo.findWithCredentials(
      connectionId,
      userId,
    );
    if (!connWithCreds) {
      throw new NotFoundException('Provider connection not found');
    }

    try {
      // Attempt decryption to verify key integrity
      const creds = this.cryptoService.decrypt(
        connWithCreds.encryptedCredentials as any,
      );

      if (!creds.apiKey || creds.apiKey.trim().length === 0) {
        throw new BadRequestException('Stored credentials are empty or corrupted');
      }

      // Mark connection as tested and valid
      await this.connectionsRepo.updateStatus(
        connectionId,
        ConnectionStatus.CONNECTED,
      );

      return {
        success: true,
        message: 'API key validated successfully',
        status: ConnectionStatus.CONNECTED,
      };
    } catch (err: any) {
      await this.connectionsRepo.updateStatus(
        connectionId,
        ConnectionStatus.INVALID_KEY,
        err.message,
      );
      return {
        success: false,
        message: `Key validation failed: ${err.message}`,
        status: ConnectionStatus.INVALID_KEY,
      };
    }
  }
}
