import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProviderConnection,
  ProviderConnectionDocument,
} from './entities/provider-connection.entity';
import { ConnectionStatus } from '@videoforge/shared-types';

@Injectable()
export class ProviderConnectionsRepository {
  constructor(
    @InjectModel(ProviderConnection.name)
    private readonly connectionModel: Model<ProviderConnectionDocument>,
  ) {}

  async create(data: Partial<ProviderConnection>): Promise<ProviderConnectionDocument> {
    return this.connectionModel.create(data);
  }

  async findByUserId(userId: string): Promise<ProviderConnectionDocument[]> {
    return this.connectionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<ProviderConnectionDocument | null> {
    return this.connectionModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();
  }

  /**
   * Internal/Worker use only: selects encryptedCredentials.
   * NEVER pass this result back directly to the HTTP response layer!
   */
  async findWithCredentials(
    id: string,
    userId: string,
  ): Promise<ProviderConnectionDocument | null> {
    return this.connectionModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .select('+encryptedCredentials')
      .exec();
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    updates: Partial<ProviderConnection>,
  ): Promise<ProviderConnectionDocument | null> {
    return this.connectionModel
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
    const res = await this.connectionModel
      .deleteOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    return res.deletedCount > 0;
  }

  async updateStatus(
    id: string,
    status: ConnectionStatus,
    lastErrorCode?: string,
  ): Promise<void> {
    await this.connectionModel
      .updateOne(
        { _id: new Types.ObjectId(id) },
        {
          $set: {
            status,
            lastErrorCode,
            lastTestedAt: new Date(),
          },
        },
      )
      .exec();
  }

  async markSuccessfulUse(id: string): Promise<void> {
    await this.connectionModel
      .updateOne(
        { _id: new Types.ObjectId(id) },
        {
          $set: {
            lastSuccessfulUseAt: new Date(),
            status: ConnectionStatus.CONNECTED,
          },
        },
      )
      .exec();
  }
}
