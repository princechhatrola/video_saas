import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UsersRepository } from '../users/users.repository';
import { AuditService } from '../audit/audit.service';
import type { AuthTokens, JwtPayload, LoginResponse } from '@videoforge/shared-types';
import { UserStatus, AuditEventType } from '@videoforge/shared-types';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';

const VERIFICATION_TOKEN_EXPIRES_HOURS = 24;
const RESET_TOKEN_EXPIRES_HOURS = 1;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ip: string): Promise<{ message: string }> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRES_HOURS * 3600 * 1000,
    );

    const user = await this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: expiresAt,
    });

    // TODO: Send verification email via EmailService
    this.logger.log(`User registered: ${user.email} — verification email queued`);

    await this.auditService.log({
      eventType: AuditEventType.USER_REGISTERED,
      userId: user.id as string,
      ip,
      metadata: { email: user.email },
    });

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(dto: LoginDto, ip: string): Promise<LoginResponse> {
    const user = await this.usersRepo.findByEmail(dto.email, true);

    if (!user) {
      // Constant-time fake hash to prevent timing attacks
      await argon2.hash('dummy-password-for-timing');
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended. Please contact support.');
    }

    const tokenId = uuidv4();
    await this.usersRepo.addRefreshTokenId(user.id as string, tokenId);

    const { accessToken, expiresIn } = await this.generateAccessToken(user);
    await this.generateRefreshToken(user.id as string, tokenId);

    await this.auditService.log({
      eventType: AuditEventType.USER_LOGGED_IN,
      userId: user.id as string,
      ip,
    });

    return {
      user: {
        id: user.id as string,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      accessToken,
      expiresIn,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens & { tokenId: string }> {
    let payload: { sub: string; tokenId: string };

    try {
      payload = this.jwtService.verify<{ sub: string; tokenId: string }>(
        refreshToken,
        { secret: this.config.get<string>('JWT_REFRESH_SECRET') },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepo.findById(payload.sub, true);
    if (!user || !user.refreshTokenIds.includes(payload.tokenId)) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Rotate: remove old, add new
    await this.usersRepo.removeRefreshTokenId(payload.sub, payload.tokenId);
    const newTokenId = uuidv4();
    await this.usersRepo.addRefreshTokenId(payload.sub, newTokenId);

    const { accessToken, expiresIn } = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(payload.sub, newTokenId);

    return { accessToken, expiresIn, tokenId: newTokenId };
  }

  async logout(userId: string, tokenId: string, ip: string): Promise<void> {
    await this.usersRepo.removeRefreshTokenId(userId, tokenId);
    await this.auditService.log({
      eventType: AuditEventType.USER_LOGGED_OUT,
      userId,
      ip,
    });
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersRepo.findByEmailVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersRepo.updateById(user.id as string, {
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    });

    await this.auditService.log({
      eventType: AuditEventType.USER_EMAIL_VERIFIED,
      userId: user.id as string,
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Always return the same message to prevent email enumeration
    const msg = {
      message: 'If this email is registered, a password reset link has been sent.',
    };

    const user = await this.usersRepo.findByEmail(email);
    if (!user) return msg;

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRES_HOURS * 3600 * 1000,
    );

    await this.usersRepo.updateById(user.id as string, {
      passwordResetToken: resetToken,
      passwordResetTokenExpiresAt: expiresAt,
    });

    // TODO: Send password reset email
    this.logger.log(`Password reset requested for ${email}`);

    await this.auditService.log({
      eventType: AuditEventType.USER_PASSWORD_RESET,
      userId: user.id as string,
      metadata: { action: 'requested' },
    });

    return msg;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepo.findByPasswordResetToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.usersRepo.updateById(user.id as string, {
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
    });

    // Revoke all sessions on password reset
    await this.usersRepo.clearAllRefreshTokenIds(user.id as string);

    await this.auditService.log({
      eventType: AuditEventType.USER_PASSWORD_RESET,
      userId: user.id as string,
      metadata: { action: 'completed' },
    });

    return { message: 'Password reset successfully. Please log in again.' };
  }

  async generateAccessToken(user: {
    id: string | unknown;
    email: string;
    role: string;
  }): Promise<AuthTokens> {
    const expiresIn = 900; // 15 minutes in seconds
    const payload: JwtPayload = {
      sub: user.id as string,
      email: user.email,
      role: user.role as never,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn,
    });

    return { accessToken, expiresIn };
  }

  async generateRefreshToken(userId: string, tokenId: string): Promise<string> {
    return this.jwtService.sign(
      { sub: userId, tokenId },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRY', '7d') || '7d') as any,
      },
    );
  }
}
