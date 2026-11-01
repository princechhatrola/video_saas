import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './entities/project.entity';
import { ProjectStatus } from '@videoforge/shared-types';

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(data: Partial<Project>): Promise<ProjectDocument> {
    return this.projectModel.create(data);
  }

  async findByUserId(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: ProjectDocument[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const [items, total] = await Promise.all([
      this.projectModel
        .find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.projectModel.countDocuments({ userId: userObjectId }).exec(),
    ]);
    return { items, total };
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ProjectDocument | null> {
    return this.projectModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    updates: Partial<Project>,
  ): Promise<ProjectDocument | null> {
    return this.projectModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
        },
        { $set: updates },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const res = await this.projectModel
      .deleteOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    return res.deletedCount > 0;
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<void> {
    await this.projectModel
      .updateOne({ _id: new Types.ObjectId(id) }, { $set: { status } })
      .exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.projectModel
      .countDocuments({ userId: new Types.ObjectId(userId) })
      .exec();
  }
}
