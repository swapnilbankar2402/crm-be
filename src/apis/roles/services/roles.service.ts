// src/roles/roles.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User, UserRole } from 'src/common/entities';
import { Repository, In } from 'typeorm';
import { AssignPermissionsDto, AssignRoleToUsersDto, CloneRoleDto, CreateRoleDto, QueryRolesDto, UpdateRoleDto } from '../dto';
import { Permission, PermissionSets } from 'src/common/permissions/permissions.enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new role
   */
  async create(tenantId: string, createRoleDto: CreateRoleDto) {
    // Check if role slug already exists for this tenant
    const existingRole = await this.roleRepository.findOne({
      where: [
        { slug: createRoleDto.slug, tenantId },
        { slug: createRoleDto.slug, isSystem: true },
      ],
    });

    if (existingRole) {
      throw new ConflictException('Role slug already exists');
    }

    // Validate permissions
    this.validatePermissions(createRoleDto.permissions);

    const role = this.roleRepository.create({
      ...createRoleDto,
      tenantId,
      isSystem: false,
    });

    const savedRole = await this.roleRepository.save(role);

    return this.findOne(tenantId, savedRole.id);
  }

  /**
   * Find all roles with filtering and pagination
   */
  async findAll(tenantId: string, query: QueryRolesDto) {
    const {
      page = 1,
      limit = 10,
      search,
      isSystem,
      isDefault,
      sortBy = 'createdAt',
      sortOrder = 'ASC',
    } = query;

    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.userRoles', 'userRoles')
      .where('(role.tenantId = :tenantId OR role.isSystem = true)', { tenantId });

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(role.name ILIKE :search OR role.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by system roles
    if (isSystem !== undefined) {
      queryBuilder.andWhere('role.isSystem = :isSystem', { isSystem });
    }

    // Filter by default roles
    if (isDefault !== undefined) {
      queryBuilder.andWhere('role.isDefault = :isDefault', { isDefault });
    }

    // Sorting
    queryBuilder.orderBy(`role.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [roles, total] = await queryBuilder.getManyAndCount();

    return {
      data: roles.map((role) => this.formatRoleResponse(role)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one role by ID
   */
  async findOne(tenantId: string, roleId: string) {
    const role = await this.roleRepository.findOne({
      where: [
        { id: roleId, tenantId },
        { id: roleId, isSystem: true },
      ],
      relations: ['userRoles', 'userRoles.user'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.formatRoleResponse(role);
  }

  /**
   * Find role by slug
   */
  async findBySlug(tenantId: string, slug: string) {
    const role = await this.roleRepository.findOne({
      where: [
        { slug, tenantId },
        { slug, isSystem: true },
      ],
      relations: ['userRoles'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.formatRoleResponse(role);
  }

  /**
   * Update role
   */
  async update(tenantId: string, roleId: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system roles');
    }

    // Validate permissions if provided
    if (updateRoleDto.permissions) {
      this.validatePermissions(updateRoleDto.permissions);
    }

    Object.assign(role, updateRoleDto);
    await this.roleRepository.save(role);

    return this.findOne(tenantId, roleId);
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(
    tenantId: string,
    roleId: string,
    assignPermissionsDto: AssignPermissionsDto,
  ) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify permissions of system roles');
    }

    // Validate permissions
    this.validatePermissions(assignPermissionsDto.permissions);

    role.permissions = assignPermissionsDto.permissions;
    await this.roleRepository.save(role);

    return this.findOne(tenantId, roleId);
  }

  /**
   * Add permissions to existing role permissions
   */
  async addPermissions(
    tenantId: string,
    roleId: string,
    assignPermissionsDto: AssignPermissionsDto,
  ) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify permissions of system roles');
    }

    // Validate permissions
    this.validatePermissions(assignPermissionsDto.permissions);

    // Merge permissions (remove duplicates)
    const mergedPermissions = Array.from(
      new Set([...role.permissions, ...assignPermissionsDto.permissions]),
    );

    role.permissions = mergedPermissions;
    await this.roleRepository.save(role);

    return this.findOne(tenantId, roleId);
  }

  /**
   * Remove permissions from role
   */
  async removePermissions(
    tenantId: string,
    roleId: string,
    permissions: string[],
  ) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify permissions of system roles');
    }

    role.permissions = role.permissions.filter((p) => !permissions.includes(p));
    await this.roleRepository.save(role);

    return this.findOne(tenantId, roleId);
  }

  /**
   * Assign role to multiple users
   */
  async assignRoleToUsers(
    tenantId: string,
    roleId: string,
    assignRoleToUsersDto: AssignRoleToUsersDto,
  ) {
    const role = await this.roleRepository.findOne({
      where: [
        { id: roleId, tenantId },
        { id: roleId, isSystem: true },
      ],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify all users exist and belong to the tenant
    const users = await this.userRepository.find({
      where: {
        id: In(assignRoleToUsersDto.userIds),
        tenantId,
      },
    });

    if (users.length !== assignRoleToUsersDto.userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    // Create user-role associations (skip existing)
    const userRoles = [];
    for (const userId of assignRoleToUsersDto.userIds) {
      const existingUserRole = await this.userRoleRepository.findOne({
        where: { userId, roleId },
      });

      if (!existingUserRole) {
        userRoles.push(
          this.userRoleRepository.create({
            userId,
            roleId,
          }),
        );
      }
    }

    if (userRoles.length > 0) {
      await this.userRoleRepository.save(userRoles);
    }

    return {
      message: `Role assigned to ${userRoles.length} users`,
      assignedCount: userRoles.length,
      skippedCount: assignRoleToUsersDto.userIds.length - userRoles.length,
    };
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(tenantId: string, roleId: string, userId: string) {
    const role = await this.roleRepository.findOne({
      where: [
        { id: roleId, tenantId },
        { id: roleId, isSystem: true },
      ],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRoleRepository.delete({ userId, roleId });

    return { message: 'Role removed from user successfully' };
  }

  /**
   * Clone an existing role
   */
  async cloneRole(tenantId: string, roleId: string, cloneRoleDto: CloneRoleDto) {
    const sourceRole = await this.roleRepository.findOne({
      where: [
        { id: roleId, tenantId },
        { id: roleId, isSystem: true },
      ],
    });

    if (!sourceRole) {
      throw new NotFoundException('Source role not found');
    }

    // Check if new slug exists
    const existingRole = await this.roleRepository.findOne({
      where: { slug: cloneRoleDto.slug, tenantId },
    });

    if (existingRole) {
      throw new ConflictException('Role slug already exists');
    }

    const clonedRole = this.roleRepository.create({
      ...sourceRole,
      id: undefined,
      name: cloneRoleDto.name,
      slug: cloneRoleDto.slug,
      description: cloneRoleDto.description || sourceRole.description,
      tenantId,
      isSystem: false,
      isDefault: false,
      createdAt: undefined,
      updatedAt: undefined,
    });

    const savedRole = await this.roleRepository.save(clonedRole);

    return this.findOne(tenantId, savedRole.id);
  }

  /**
   * Delete role
   */
  async remove(tenantId: string, roleId: string) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId },
      relations: ['userRoles'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system roles');
    }

    if (role.userRoles && role.userRoles.length > 0) {
      throw new BadRequestException(
        `Cannot delete role assigned to ${role.userRoles.length} users. Please reassign users first.`,
      );
    }

    await this.roleRepository.softDelete(roleId);

    return { message: 'Role deleted successfully' };
  }

  /**
   * Get all available permissions (for UI)
   */
  async getAvailablePermissions() {
    // This would ideally be dynamically generated based on registered modules
    // For now, we'll return the predefined permission sets
    return {
      permissionSets: PermissionSets,
      allPermissions: this.getAllPermissions(),
    };
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(
    userId: string,
    tenantId: string,
    requiredPermission: string,
  ): Promise<boolean> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    const userPermissions: string[] = [];

    for (const userRole of userRoles) {
      // Skip roles from other tenants (unless system role)
      if (userRole.role.tenantId !== tenantId && !userRole.role.isSystem) {
        continue;
      }

      userPermissions.push(...userRole.role.permissions);
    }

    return Permission.hasPermission(userPermissions, requiredPermission);
  }

  /**
   * Get user's all permissions
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      // Skip roles from other tenants (unless system role)
      if (userRole.role.tenantId !== tenantId && !userRole.role.isSystem) {
        continue;
      }

      userRole.role.permissions.forEach((p) => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Validate permissions array
   */
  private validatePermissions(permissions: string[]): void {
    const validPermissions = this.getAllPermissions();
    
    for (const permission of permissions) {
      // Allow wildcard
      if (permission === '*') continue;

      // Allow resource wildcards (e.g., "leads:*")
      if (permission.endsWith(':*')) {
        const resource = permission.split(':')[0];
        const hasValidResource = validPermissions.some((p) => p.startsWith(resource + ':'));
        if (!hasValidResource) {
          throw new BadRequestException(`Invalid permission: ${permission}`);
        }
        continue;
      }

      // Check exact match
      if (!validPermissions.includes(permission)) {
        throw new BadRequestException(`Invalid permission: ${permission}`);
      }
    }
  }

  /**
   * Get all valid permissions
   */
  private getAllPermissions(): string[] {
    const permissions: string[] = [];
    
    Object.values(PermissionSets).forEach((set) => {
      permissions.push(...set);
    });

    return Array.from(new Set(permissions));
  }

  /**
   * Format role response
   */
  private formatRoleResponse(role: Role) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      permissions: role.permissions,
      color: role.color,
      level: role.level,
      tenantId: role.tenantId,
      userCount: role.userRoles?.length || 0,
      users: role.userRoles?.map((ur) => ({
        id: ur.user?.id,
        firstName: ur.user?.firstName,
        lastName: ur.user?.lastName,
        email: ur.user?.email,
        assignedAt: ur.assignedAt,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}