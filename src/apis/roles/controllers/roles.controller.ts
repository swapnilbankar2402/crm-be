import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { RolesService } from '../services/roles.service';
import { CurrentTenant, Roles } from 'src/auth/decorators';
import { AssignPermissionsDto, AssignRoleToUsersDto, CloneRoleDto, CreateRoleDto, QueryRolesDto, UpdateRoleDto } from '../dto';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role slug already exists' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    return this.rolesService.create(tenantId, createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles with filtering' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryRolesDto,
  ) {
    return this.rolesService.findAll(tenantId, query);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  getAvailablePermissions() {
    return this.rolesService.getAvailablePermissions();
  }

  @Get('user/:userId/permissions')
  @ApiOperation({ summary: 'Get all permissions for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved' })
  getUserPermissions(
    @CurrentTenant() tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.getUserPermissions(userId, tenantId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get role by slug' })
  @ApiParam({ name: 'slug', description: 'Role slug' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findBySlug(
    @CurrentTenant() tenantId: string,
    @Param('slug') slug: string,
  ) {
    return this.rolesService.findBySlug(tenantId, slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.rolesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Cannot modify system roles' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(tenantId, id, updateRoleDto);
  }

  @Patch(':id/permissions')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign permissions to role (replaces existing)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
  assignPermissions(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(tenantId, id, assignPermissionsDto);
  }

  @Post(':id/permissions')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add permissions to role (keeps existing)' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Permissions added successfully' })
  addPermissions(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.addPermissions(tenantId, id, assignPermissionsDto);
  }

  @Delete(':id/permissions')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove specific permissions from role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Permissions removed successfully' })
  removePermissions(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.removePermissions(
      tenantId,
      id,
      assignPermissionsDto.permissions,
    );
  }

  @Post(':id/assign-users')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign role to multiple users' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role assigned to users' })
  assignRoleToUsers(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() assignRoleToUsersDto: AssignRoleToUsersDto,
  ) {
    return this.rolesService.assignRoleToUsers(tenantId, id, assignRoleToUsersDto);
  }

  @Delete(':roleId/users/:userId')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Role removed from user' })
  removeRoleFromUser(
    @CurrentTenant() tenantId: string,
    @Param('roleId') roleId: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.removeRoleFromUser(tenantId, roleId, userId);
  }

  @Post(':id/clone')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clone an existing role' })
  @ApiParam({ name: 'id', description: 'Source role ID' })
  @ApiResponse({ status: 201, description: 'Role cloned successfully' })
  cloneRole(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() cloneRoleDto: CloneRoleDto,
  ) {
    return this.rolesService.cloneRole(tenantId, id, cloneRoleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete system roles' })
  @ApiResponse({ status: 400, description: 'Role is assigned to users' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.rolesService.remove(tenantId, id);
  }
}