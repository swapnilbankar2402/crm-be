// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { User, UserStatus } from '../common/entities/user.entity';
import { Tenant, TenantStatus } from '../common/entities/tenant.entity';
import { Role } from '../common/entities/role.entity';
import { UserRole } from '../common/entities/user-role.entity';
import { RefreshToken } from '../common/entities/refresh-token.entity';

import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new tenant with owner user
   */
  async register(registerDto: RegisterDto, ipAddress: string, userAgent: string) {
    // Check if tenant slug already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug: registerDto.tenantSlug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create tenant
    const tenant = this.tenantRepository.create({
      name: registerDto.tenantName,
      slug: registerDto.tenantSlug,
      status: TenantStatus.TRIAL,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    });

    await this.tenantRepository.save(tenant);

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create owner user
    const user = this.userRepository.create({
      tenantId: tenant.id,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      phone: registerDto.phone,
      status: UserStatus.PENDING,
      emailVerified: false,
      emailVerificationToken: uuidv4(),
    });

    await this.userRepository.save(user);

    // Assign "Admin" role to the owner
    const adminRole = await this.roleRepository.findOne({
      where: { slug: 'admin', isSystem: true },
    });

    if (adminRole) {
      const userRole = this.userRoleRepository.create({
        userId: user.id,
        roleId: adminRole.id,
      });
      await this.userRoleRepository.save(userRole);
    }

    // TODO: Send email verification email
    // await this.mailService.sendVerificationEmail(user.email, user.emailVerificationToken);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'tenantId', 'status', 'emailVerified'],
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING) {
      throw new UnauthorizedException('Account is suspended or inactive');
    }

    // Get user roles
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    const roles = userRoles.map((ur) => ur.role.slug);

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id, ipAddress, userAgent);

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        roles,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(userId: string, ipAddress: string, userAgent: string) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenDto.refreshToken },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Get user roles
    const userRoles = await this.userRoleRepository.find({
      where: { userId: refreshToken.user.id },
      relations: ['role'],
    });

    const roles = userRoles.map((ur) => ur.role.slug);

    // Generate new access token
    const payload = {
      sub: refreshToken.user.id,
      email: refreshToken.user.email,
      tenantId: refreshToken.user.tenantId,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (token) {
      token.isRevoked = true;
      token.revokedAt = new Date();
      await this.refreshTokenRepository.save(token);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Verify email
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: verifyEmailDto.token },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.status = UserStatus.ACTIVE;

    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;

    await this.userRepository.save(user);

    // TODO: Send password reset email
    // await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: resetPasswordDto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.userRepository.save(user);

    // Revoke all refresh tokens for security
    await this.refreshTokenRepository.update(
      { userId: user.id },
      { isRevoked: true, revokedAt: new Date() },
    );

    return { message: 'Password reset successful' };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    const roles = userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      slug: ur.role.slug,
    }));

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      status: user.status,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        status: user.tenant.status,
      },
      roles,
    };
  }
}