import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './entities/project.entity';
import { Scene, SceneSchema } from './entities/scene.entity';
import {
  GenerationJobModel,
  GenerationJobSchema,
} from './entities/job.entity';
import {
  MediaAssetModel,
  MediaAssetSchema,
} from './entities/media-asset.entity';
import { ProjectsRepository } from './projects.repository';
import { ScenesRepository } from './scenes.repository';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProvidersModule } from '../providers/providers.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Scene.name, schema: SceneSchema },
      { name: GenerationJobModel.name, schema: GenerationJobSchema },
      { name: MediaAssetModel.name, schema: MediaAssetSchema },
    ]),
    ProvidersModule,
    AuditModule,
  ],
  providers: [ProjectsRepository, ScenesRepository, ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService, ProjectsRepository, ScenesRepository],
})
export class ProjectsModule {}
