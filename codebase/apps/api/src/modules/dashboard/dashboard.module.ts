import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../projects/entities/project.entity';
import { Scene, SceneSchema } from '../projects/entities/scene.entity';
import {
  ProviderConnection,
  ProviderConnectionSchema,
} from '../providers/entities/provider-connection.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Scene.name, schema: SceneSchema },
      { name: ProviderConnection.name, schema: ProviderConnectionSchema },
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
