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

import { ActivitiesService } from './activities.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  CompleteActivityDto,
  QueryActivitiesDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, CurrentUser, Roles } from 'src/auth/decorators';


@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(tenantId, dto, userId);
  }

  @Get()
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get all activities with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryActivitiesDto,
  ) {
    return this.activitiesService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get activity statistics' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
  ) {
    return this.activitiesService.getStats(tenantId, userId);
  }

  @Get('upcoming')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Get upcoming activities for current user' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  @ApiResponse({ status: 200, description: 'Upcoming activities retrieved' })
  getUpcoming(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Query('days') days?: number,
  ) {
    return this.activitiesService.getUpcoming(
      tenantId,
      userId,
      days ? parseInt(days.toString(), 10) : 7,
    );
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.activitiesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Update activity' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(tenantId, id, dto);
  }

  @Post(':id/complete')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark activity as completed' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity completed successfully' })
  @ApiResponse({ status: 400, description: 'Activity already completed' })
  complete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CompleteActivityDto,
  ) {
    return this.activitiesService.complete(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'manager', 'sales-rep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete activity (soft delete)' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.activitiesService.remove(tenantId, id);
  }

  @Post(':id/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted activity' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity restored successfully' })
  restore(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.activitiesService.restore(tenantId, id);
  }
}