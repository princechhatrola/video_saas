import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/entities/user.entity';
import { Project, ProjectSchema } from '../projects/entities/project.entity';
import {
  ProviderCatalog,
  ProviderCatalogSchema,
} from '../providers/provider-catalog/entities/provider-catalog.entity';
import {
  AuditLog,
  AuditLogSchema,
} from '../audit/entities/audit-log.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ProviderCatalog.name, schema: ProviderCatalogSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
