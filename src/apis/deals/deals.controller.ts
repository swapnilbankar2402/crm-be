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

import { DealsService } from './deals.service';
import {
  CreateDealDto,
  UpdateDealDto,
  MoveDealStageDto,
  CloseDealDto,
  QueryDealsDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, CurrentUser, Roles } from 'src/auth/decorators';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Roles('admin', 'manager', 'sales-rep')
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Deal created successfully' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDealDto,
  ) {
    return this.dealsService.create(tenantId, dto, userId);
  }

  @Get()
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get all deals with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Deals retrieved successfully' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryDealsDto) {
    return this.dealsService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get deal statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  getStats(@CurrentTenant() tenantId: string) {
    return this.dealsService.getStats(tenantId);
  }

  @Get('forecast')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get pipeline forecast' })
  @ApiQuery({ name: 'pipelineId', required: false })
  @ApiResponse({ status: 200, description: 'Forecast retrieved successfully' })
  getForecast(
    @CurrentTenant() tenantId: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.dealsService.getForecast(tenantId, pipelineId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get deal by ID' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.dealsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'sales-rep')
  @ApiOperation({ summary: 'Update deal' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal updated successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(tenantId, id, dto);
  }

  @Post(':id/move-stage')
  @Roles('admin', 'manager', 'sales-rep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move deal to different stage' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal moved successfully' })
  moveToStage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: MoveDealStageDto,
  ) {
    return this.dealsService.moveToStage(tenantId, id, dto);
  }

  @Post(':id/close')
  @Roles('admin', 'manager', 'sales-rep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close deal (won/lost/abandoned)' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal closed successfully' })
  @ApiResponse({ status: 400, description: 'Deal already closed' })
  closeDeal(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CloseDealDto,
  ) {
    return this.dealsService.closeDeal(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete deal (soft delete)' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.dealsService.remove(tenantId, id);
  }

  @Post(':id/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted deal' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal restored successfully' })
  restore(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.dealsService.restore(tenantId, id);
  }
}
