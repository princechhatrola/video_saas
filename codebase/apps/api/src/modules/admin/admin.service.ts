import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import {
  ProviderCatalog,
  ProviderCatalogDocument,
} from '../providers/provider-catalog/entities/provider-catalog.entity';
import {
  AuditLog,
  AuditLogDocument,
} from '../audit/entities/audit-log.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProviderCatalog.name)
    private readonly catalogModel: Model<ProviderCatalogDocument>,
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async getPlatformOverview() {
    const [totalUsers, totalProjects, totalProviders, recentAuditLogs] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.projectModel.countDocuments(),
        this.catalogModel.countDocuments(),
        this.auditModel.find().sort({ createdAt: -1 }).limit(10).exec(),
      ]);

    return {
      totalUsers,
      totalProjects,
      totalProviders,
      recentAuditLogs,
    };
  }

  async listAuditLogs(limit = 50, offset = 0) {
    const [items, total] = await Promise.all([
      this.auditModel.find().sort({ createdAt: -1 }).skip(offset).limit(limit).exec(),
      this.auditModel.countDocuments().exec(),
    ]);
    return { items, total };
  }
}
