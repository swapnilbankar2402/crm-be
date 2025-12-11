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

import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto, UpdatePipelineDto } from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, Roles } from 'src/auth/decorators';


@ApiTags('Pipelines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new pipeline' })
  @ApiResponse({ status: 201, description: 'Pipeline created successfully' })
  @ApiResponse({ status: 409, description: 'Pipeline name or default pipeline already exists' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createPipelineDto: CreatePipelineDto,
  ) {
    return this.pipelinesService.create(tenantId, createPipelineDto);
  }

  @Get()
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get all pipelines' })
  @ApiResponse({ status: 200, description: 'Pipelines retrieved successfully' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.pipelinesService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get pipeline by ID' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiResponse({ status: 200, description: 'Pipeline retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.pipelinesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update pipeline' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiResponse({ status: 200, description: 'Pipeline updated successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updatePipelineDto: UpdatePipelineDto,
  ) {
    return this.pipelinesService.update(tenantId, id, updatePipelineDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete pipeline' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiResponse({ status: 200, description: 'Pipeline deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pipeline not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete default pipeline or pipeline with associated leads' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.pipelinesService.remove(tenantId, id);
  }
}