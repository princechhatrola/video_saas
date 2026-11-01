import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../entities/user.entity';
import type { UserRole, UserStatus } from '@videoforge/shared-types';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string, includeSecrets = false): Promise<UserDocument | null> {
    const projection = includeSecrets
      ? '+passwordHash +refreshTokenIds +emailVerificationToken +emailVerificationTokenExpiresAt +passwordResetToken +passwordResetTokenExpiresAt'
      : '';
    return this.userModel.findById(id).select(projection).exec();
  }

  async findByIdOrThrow(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string, includeSecrets = false): Promise<UserDocument | null> {
    const projection = includeSecrets ? '+passwordHash +refreshTokenIds' : '';
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select(projection)
      .exec();
  }

  async findByEmailVerificationToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: { $gt: new Date() },
      })
      .select('+emailVerificationToken +emailVerificationTokenExpiresAt')
      .exec();
  }

  async findByPasswordResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetTokenExpiresAt: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetTokenExpiresAt +passwordHash')
      .exec();
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    emailVerificationToken: string;
    emailVerificationTokenExpiresAt: Date;
  }): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async updateById(
    id: string,
    update: Partial<Pick<User,
      | 'name'
      | 'email'
      | 'passwordHash'
      | 'status'
      | 'emailVerifiedAt'
      | 'emailVerificationToken'
      | 'emailVerificationTokenExpiresAt'
      | 'passwordResetToken'
      | 'passwordResetTokenExpiresAt'
      | 'refreshTokenIds'
      | 'preferences'
    >>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
  }

  async addRefreshTokenId(userId: string, tokenId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $push: { refreshTokenIds: tokenId },
    });
  }

  async removeRefreshTokenId(userId: string, tokenId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { refreshTokenIds: tokenId },
    });
  }

  async clearAllRefreshTokenIds(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { refreshTokenIds: [] },
    });
  }

  async updateRole(userId: string, role: UserRole): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $set: { role } });
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $set: { status } });
  }

  async softDelete(userId: string): Promise<void> {
    // Mark for deletion; actual asset cleanup is handled by a scheduled job
    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        status: 'pending_deletion' as UserStatus,
        email: `deleted_${userId}_${Date.now()}@deleted.internal`,
      },
    });
  }

  async countByStatus(status: UserStatus): Promise<number> {
    return this.userModel.countDocuments({ status }).exec();
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ users: UserDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.userModel.countDocuments().exec(),
    ]);
    return { users, total };
  }
}
