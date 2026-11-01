import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDocument } from './entities/user.entity';
import type { UserProfile, UserPreferences } from '@videoforge/shared-types';
import { UserStatus } from '@videoforge/shared-types';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.usersRepo.findByIdOrThrow(userId);
    return this.toProfile(user);
  }

  async updateProfile(
    userId: string,
    update: { name?: string; preferences?: Partial<UserPreferences> },
  ): Promise<UserProfile> {
    const user = await this.usersRepo.findByIdOrThrow(userId);

    const merged: Partial<UserDocument> = {};
    if (update.name) merged.name = update.name;
    if (update.preferences) {
      merged.preferences = { ...user.preferences, ...update.preferences };
    }

    const updated = await this.usersRepo.updateById(userId, merged);
    if (!updated) throw new NotFoundException('User not found');

    return this.toProfile(updated);
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    const user = await this.usersRepo.findByIdOrThrow(userId);

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('Account is already suspended or deleted');
    }

    await this.usersRepo.softDelete(userId);
    // Asset cleanup job is scheduled separately via audit/cleanup queue
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepo.findByEmail(email);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.usersRepo.findById(id);
  }

  private toProfile(user: UserDocument): UserProfile {
    return {
      id: user.id as string,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      preferences: user.preferences,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
