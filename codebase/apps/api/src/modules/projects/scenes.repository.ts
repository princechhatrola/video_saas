import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Scene, SceneDocumentModel } from './entities/scene.entity';
import { SceneStatus } from '@videoforge/shared-types';

@Injectable()
export class ScenesRepository {
  constructor(
    @InjectModel(Scene.name)
    private readonly sceneModel: Model<SceneDocumentModel>,
  ) {}

  async createMany(scenes: Partial<Scene>[]): Promise<SceneDocumentModel[]> {
    return this.sceneModel.insertMany(scenes as any[]) as any;
  }

  async findByProjectId(
    projectId: string,
    userId: string,
  ): Promise<SceneDocumentModel[]> {
    return this.sceneModel
      .find({
        projectId: new Types.ObjectId(projectId),
        userId: new Types.ObjectId(userId),
      })
      .sort({ sceneNumber: 1 })
      .exec();
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<SceneDocumentModel | null> {
    return this.sceneModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();
  }

  async updateStatus(
    id: string,
    status: SceneStatus,
    error?: { code: string; message: string; retryable: boolean },
  ): Promise<void> {
    const update: any = { status };
    if (error) {
      update.sanitizedError = error;
    }
    await this.sceneModel
      .updateOne({ _id: new Types.ObjectId(id) }, { $set: update })
      .exec();
  }

  async updateVideoClip(
    id: string,
    assetId: string,
    videoClipUrl: string,
  ): Promise<void> {
    await this.sceneModel
      .updateOne(
        { _id: new Types.ObjectId(id) },
        {
          $set: {
            status: SceneStatus.COMPLETED,
            assetId,
            videoClipUrl,
          },
        },
      )
      .exec();
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await this.sceneModel
      .deleteMany({ projectId: new Types.ObjectId(projectId) })
      .exec();
  }
}
