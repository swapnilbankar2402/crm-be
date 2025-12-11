import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Role, Tenant, User, UserRole, UserStatus } from 'src/common/entities';
import { ChangePasswordDto, CreateUserDto, InviteUserDto, QueryUsersDto, UpdatePreferencesDto, UpdateUserDto } from '../dto';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  /**
   * Create a new user within a tenant
   */
  async create(tenantId: string, createUserDto: CreateUserDto) {
    // Check tenant exists and is active
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new ForbiddenException('Tenant is not active');
    }

    // Check user limit
    const userCount = await this.userRepository.count({
      where: { tenantId },
    });

    if (userCount >= tenant.maxUsers) {
      throw new BadRequestException(
        `User limit reached. Your plan allows ${tenant.maxUsers} users.`,
      );
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if manager exists (if provided)
    if (createUserDto.managerId) {
      const manager = await this.userRepository.findOne({
        where: { id: createUserDto.managerId, tenantId },
      });

      if (!manager) {
        throw new NotFoundException('Manager not found');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      tenantId,
      password: hashedPassword,
      status: createUserDto.status || UserStatus.ACTIVE,
      emailVerificationToken: createUserDto.sendWelcomeEmail ? uuidv4() : null,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign roles
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      await this.assignRoles(savedUser.id, createUserDto.roleIds, tenantId);
    }

    // TODO: Send welcome email if requested
    // if (createUserDto.sendWelcomeEmail) {
    //   await this.mailService.sendWelcomeEmail(savedUser);
    // }

    return this.findOne(tenantId, savedUser.id);
  }

  /**
   * Find all users with filtering, pagination, and search
   */
  async findAll(tenantId: string, query: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      department,
      roleSlug,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('user.manager', 'manager')
      .where('user.tenantId = :tenantId', { tenantId });

    // Search by name or email
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Filter by department
    if (department) {
      queryBuilder.andWhere('user.department = :department', { department });
    }

    // Filter by role
    if (roleSlug) {
      queryBuilder.andWhere('role.slug = :roleSlug', { roleSlug });
    }

    // Sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users.map((user) => this.formatUserResponse(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one user by ID
   */
  async findOne(tenantId: string, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      relations: ['userRoles', 'userRoles.role', 'manager', 'tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  /**
   * Update user
   */
  async update(tenantId: string, userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if manager exists (if provided)
    if (updateUserDto.managerId) {
      const manager = await this.userRepository.findOne({
        where: { id: updateUserDto.managerId, tenantId },
      });

      if (!manager) {
        throw new NotFoundException('Manager not found');
      }

      if (updateUserDto.managerId === userId) {
        throw new BadRequestException('User cannot be their own manager');
      }
    }

    // Update roles if provided
    if (updateUserDto.roleIds) {
      await this.updateUserRoles(userId, updateUserDto.roleIds, tenantId);
      delete updateUserDto.roleIds;
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return this.findOne(tenantId, userId);
  }

  /**
   * Soft delete user
   */
  async remove(tenantId: string, userId: string, currentUserId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (userId === currentUserId) {
      throw new BadRequestException('You cannot delete yourself');
    }

    await this.userRepository.softDelete(userId);

    return { message: 'User deleted successfully' };
  }

  /**
   * Restore soft-deleted user
   */
  async restore(tenantId: string, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.restore(userId);

    return this.findOne(tenantId, userId);
  }

  /**
   * Change user password
   */
  async changePassword(
    tenantId: string,
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.userRepository.update(userId, { password: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    tenantId: string,
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updatePreferencesDto);
    await this.userRepository.save(user);

    return this.findOne(tenantId, userId);
  }

  /**
   * Update user status
   */
  async updateStatus(tenantId: string, userId: string, status: UserStatus) {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = status;
    await this.userRepository.save(user);

    return this.findOne(tenantId, userId);
  }

  /**
   * Invite user (creates user with pending status and sends invite email)
   */
  async inviteUser(tenantId: string, inviteUserDto: InviteUserDto) {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: inviteUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = uuidv4();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user with pending status
    const user = this.userRepository.create({
      tenantId,
      email: inviteUserDto.email,
      firstName: inviteUserDto.firstName,
      lastName: inviteUserDto.lastName,
      jobTitle: inviteUserDto.jobTitle,
      department: inviteUserDto.department,
      password: hashedPassword,
      status: UserStatus.PENDING,
      emailVerified: false,
      emailVerificationToken: uuidv4(),
    });

    const savedUser = await this.userRepository.save(user);

    // Assign roles
    if (inviteUserDto.roleIds && inviteUserDto.roleIds.length > 0) {
      await this.assignRoles(savedUser.id, inviteUserDto.roleIds, tenantId);
    }

    // TODO: Send invitation email
    // await this.mailService.sendInvitationEmail(
    //   savedUser,
    //   savedUser.emailVerificationToken,
    //   inviteUserDto.customMessage,
    // );

    return {
      message: 'Invitation sent successfully',
      user: this.formatUserResponse(savedUser),
    };
  }

  /**
   * Assign roles to user
   */
  private async assignRoles(userId: string, roleIds: string[], tenantId: string) {
    // Verify all roles exist and belong to tenant (or are system roles)
    const roles = await this.roleRepository.find({
      where: [
        { id: In(roleIds), tenantId },
        { id: In(roleIds), isSystem: true },
      ],
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    // Create user-role associations
    const userRoles = roleIds.map((roleId) =>
      this.userRoleRepository.create({
        userId,
        roleId,
      }),
    );

    await this.userRoleRepository.save(userRoles);
  }

  /**
   * Update user roles
   */
  private async updateUserRoles(userId: string, roleIds: string[], tenantId: string) {
    // Remove existing roles
    await this.userRoleRepository.delete({ userId });

    // Assign new roles
    if (roleIds.length > 0) {
      await this.assignRoles(userId, roleIds, tenantId);
    }
  }

  /**
   * Format user response (remove sensitive data)
   */
  private formatUserResponse(user: User) {
    const { password, emailVerificationToken, passwordResetToken, ...userWithoutSensitiveData } = user;

    return {
      ...userWithoutSensitiveData,
      roles: user.userRoles?.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        slug: ur.role.slug,
        permissions: ur.role.permissions,
      })),
      manager: user.manager
        ? {
            id: user.manager.id,
            firstName: user.manager.firstName,
            lastName: user.manager.lastName,
            email: user.manager.email,
          }
        : null,
    };
  }

  /**
   * Get user statistics for dashboard
   */
  async getUserStats(tenantId: string) {
    const total = await this.userRepository.count({ where: { tenantId } });
    const active = await this.userRepository.count({
      where: { tenantId, status: UserStatus.ACTIVE },
    });
    const pending = await this.userRepository.count({
      where: { tenantId, status: UserStatus.PENDING },
    });
    const inactive = await this.userRepository.count({
      where: { tenantId, status: UserStatus.INACTIVE },
    });

    return {
      total,
      active,
      pending,
      inactive,
    };
  }
}