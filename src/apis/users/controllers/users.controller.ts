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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { UsersService } from '../services/users.service';
import { CurrentTenant, CurrentUser, Roles } from 'src/auth/decorators';
import {
  ChangePasswordDto,
  CreateUserDto,
  InviteUserDto,
  QueryUsersDto,
  UpdatePreferencesDto,
  UpdateUserDto,
} from '../dto';
import { UserStatus } from 'src/common/entities';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(tenantId, createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryUsersDto) {
    return this.usersService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  getStats(@CurrentTenant() tenantId: string) {
    return this.usersService.getUserStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.usersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(tenantId, id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('userId') currentUserId: string,
  ) {
    return this.usersService.remove(tenantId, id, currentUserId);
  }

  @Post(':id/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  restore(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.usersService.restore(tenantId, id);
  }

  @Post(':id/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  changePassword(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser('userId') currentUserId: string,
  ) {
    // Users can only change their own password unless they're admin
    if (id !== currentUserId) {
      // Check if user is admin (this should be done via guard in production)
      throw new Error('You can only change your own password');
    }
    return this.usersService.changePassword(tenantId, id, changePasswordDto);
  }

  @Patch(':id/preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  updatePreferences(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(
      tenantId,
      id,
      updatePreferencesDto,
    );
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ) {
    return this.usersService.updateStatus(tenantId, id, status);
  }

  @Post('invite')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Invite a new user' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  inviteUser(
    @CurrentTenant() tenantId: string,
    @Body() inviteUserDto: InviteUserDto,
  ) {
    return this.usersService.inviteUser(tenantId, inviteUserDto);
  }
}
