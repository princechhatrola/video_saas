import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole, UserStatus } from '@videoforge/shared-types';

export type UserDocument = HydratedDocument<User>;

class UserPreferences {
  @Prop({ default: 'en' })
  language!: string;

  @Prop({ default: 'UTC' })
  timezone!: string;

  @Prop({ enum: ['light', 'dark', 'system'], default: 'system' })
  theme!: 'light' | 'dark' | 'system';
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 255,
  })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status!: UserStatus;

  @Prop({ type: Date, default: null })
  emailVerifiedAt!: Date | null;

  @Prop({
    type: String,
    select: false,
    default: null,
  })
  emailVerificationToken!: string | null;

  @Prop({ type: Date, default: null, select: false })
  emailVerificationTokenExpiresAt!: Date | null;

  @Prop({ type: String, default: null, select: false })
  passwordResetToken!: string | null;

  @Prop({ type: Date, default: null, select: false })
  passwordResetTokenExpiresAt!: Date | null;

  /** Array of valid refresh token IDs (UUID). Used for rotation. */
  @Prop({ type: [String], default: [], select: false })
  refreshTokenIds!: string[];

  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences!: UserPreferences;

  // Timestamps added by mongoose
  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes — autoIndex is disabled; run scripts/create-indexes.ts
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });
