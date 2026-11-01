import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';
import type { AuditEventType } from '@videoforge/shared-types';

export interface LogInput {
  eventType?: AuditEventType | string;
  action?: AuditEventType | string;
  userId?: string;
  ip?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async log(input: LogInput): Promise<void> {
    const eventType = (input.eventType || input.action || 'system.event') as any;
    const ip = input.ip || input.ipAddress;
    const meta = {
      ...(input.metadata || {}),
      ...(input.details || {}),
      ...(input.resourceType ? { resourceType: input.resourceType } : {}),
      ...(input.resourceId ? { resourceId: input.resourceId } : {}),
      ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    };

    // Fire and forget — audit logging must never block the main request
    this.auditModel
      .create({
        eventType,
        userId: input.userId,
        ip,
        metadata: this.sanitize(meta),
        occurredAt: new Date(),
      })
      .catch(() => {
        // Silently ignore audit failures — do not surface to caller
      });
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditModel
        .find({ userId })
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments({ userId }).exec(),
    ]);
    return { logs, total };
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditModel
        .find()
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments().exec(),
    ]);
    return { logs, total };
  }

  /** Strip any fields that might contain secrets before persisting */
  private sanitize(
    meta?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!meta) return undefined;
    const REDACTED = '[REDACTED]';
    const sensitiveKeys = [
      'password',
      'apiKey',
      'api_key',
      'secret',
      'token',
      'authorization',
      'credential',
    ];
    return Object.fromEntries(
      Object.entries(meta).map(([k, v]) => [
        k,
        sensitiveKeys.some((s) => k.toLowerCase().includes(s)) ? REDACTED : v,
      ]),
    );
  }
}
