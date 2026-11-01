import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProviderCatalog,
  ProviderCatalogDocument,
} from './entities/provider-catalog.entity';
import {
  ProviderModel,
  ProviderModelDocument,
} from './entities/provider-model.entity';
import { ProviderStatus } from '@videoforge/shared-types';

@Injectable()
export class ProviderCatalogRepository {
  constructor(
    @InjectModel(ProviderCatalog.name)
    private readonly catalogModel: Model<ProviderCatalogDocument>,
    @InjectModel(ProviderModel.name)
    private readonly modelModel: Model<ProviderModelDocument>,
  ) {}

  async findAll(onlyActive = true): Promise<ProviderCatalogDocument[]> {
    const filter = onlyActive
      ? { status: { $ne: ProviderStatus.NOT_IMPLEMENTED } }
      : {};
    return this.catalogModel.find(filter).sort({ name: 1 }).exec();
  }

  async findByProviderId(providerId: string): Promise<ProviderCatalogDocument | null> {
    return this.catalogModel
      .findOne({ providerId: providerId.toLowerCase() })
      .exec();
  }

  async findModelsByProviderId(providerId: string): Promise<ProviderModelDocument[]> {
    return this.modelModel
      .find({ providerId: providerId.toLowerCase(), enabled: true })
      .sort({ displayName: 1 })
      .exec();
  }

  async findAllModels(): Promise<ProviderModelDocument[]> {
    return this.modelModel.find({ enabled: true }).sort({ providerId: 1 }).exec();
  }

  async findModel(
    providerId: string,
    modelId: string,
  ): Promise<ProviderModelDocument | null> {
    return this.modelModel
      .findOne({
        providerId: providerId.toLowerCase(),
        modelId,
        enabled: true,
      })
      .exec();
  }

  async upsertProvider(data: Partial<ProviderCatalog>): Promise<void> {
    await this.catalogModel.updateOne(
      { providerId: data.providerId },
      { $set: data },
      { upsert: true },
    );
  }

  async upsertModel(data: Partial<ProviderModel>): Promise<void> {
    await this.modelModel.updateOne(
      { providerId: data.providerId, modelId: data.modelId },
      { $set: data },
      { upsert: true },
    );
  }

  async count(): Promise<number> {
    return this.catalogModel.countDocuments().exec();
  }
}
