import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import { Scene, SceneDocumentModel } from '../projects/entities/scene.entity';
import {
  ProviderConnection,
  ProviderConnectionDocument,
} from '../providers/entities/provider-connection.entity';
import { ProjectStatus, SceneStatus } from '@videoforge/shared-types';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Scene.name)
    private readonly sceneModel: Model<SceneDocumentModel>,
    @InjectModel(ProviderConnection.name)
    private readonly connectionModel: Model<ProviderConnectionDocument>,
  ) {}

  async getUserStats(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const [
      totalProjects,
      completedProjects,
      generatingProjects,
      totalScenesGenerated,
      activeConnections,
      recentProjects,
    ] = await Promise.all([
      this.projectModel.countDocuments({ userId: userObjectId }),
      this.projectModel.countDocuments({
        userId: userObjectId,
        status: ProjectStatus.COMPLETED,
      }),
      this.projectModel.countDocuments({
        userId: userObjectId,
        status: ProjectStatus.GENERATING,
      }),
      this.sceneModel.countDocuments({
        userId: userObjectId,
        status: SceneStatus.COMPLETED,
      }),
      this.connectionModel.countDocuments({ userId: userObjectId }),
      this.projectModel
        .find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status settings totalScenes completedScenes createdAt')
        .exec(),
    ]);

    return {
      summary: {
        totalProjects,
        completedProjects,
        generatingProjects,
        totalScenesGenerated,
        activeConnections,
      },
      recentProjects,
    };
  }
}
