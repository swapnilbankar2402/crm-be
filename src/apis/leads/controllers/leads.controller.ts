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
import { LeadsService } from '../services/leads.service';
import {
  ConvertLeadDto,
  CreateCustomFieldDto,
  CreateLeadDto,
  CreateTagDto,
  QueryLeadsDto,
  UpdateCustomFieldDto,
  UpdateLeadDto,
  UpdateTagDto,
} from '../dto';
import { CurrentTenant, CurrentUser, Roles } from 'src/auth/decorators';
import { LeadStatus } from 'src/common/entities';
import { CacheResource, CacheTtl } from 'src/cache/cache.decorators';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Only these two guards
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // ========== LEADS ==========

  @Post()
  @Roles('admin', 'manager', 'sales-rep')
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() createLeadDto: CreateLeadDto,
  ) {
    return this.leadsService.create(tenantId, createLeadDto, userId);
  }

  @Get()
  @CacheResource('leads')
  @CacheTtl(30)
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get all leads' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get lead statistics' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.leadsService.getStats(tenantId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get lead by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.leadsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'sales-rep')
  @ApiOperation({ summary: 'Update lead' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(tenantId, id, updateLeadDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete lead' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.leadsService.remove(tenantId, id);
  }

  @Post(':id/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore lead' })
  restore(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.leadsService.restore(tenantId, id);
  }

  @Post(':id/convert')
  @Roles('admin', 'manager', 'sales-rep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert lead' })
  convertLead(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() convertLeadDto: ConvertLeadDto,
  ) {
    return this.leadsService.convertLead(tenantId, id, convertLeadDto, userId);
  }

  @Patch(':id/status')
  @Roles('admin', 'manager', 'sales-rep')
  @ApiOperation({ summary: 'Update lead status' })
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: LeadStatus,
  ) {
    return this.leadsService.updateStatus(tenantId, id, status);
  }

  @Post(':id/assign/:userId')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign lead to user' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiParam({ name: 'userId', description: 'User ID to assign to' })
  @ApiResponse({ status: 200, description: 'Lead assigned successfully' })
  assignToUser(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Param('userId') assignedToUserId: string,
    @CurrentUser('userId') assignedByUserId: string,
  ) {
    return this.leadsService.assignToUser(
      tenantId,
      id,
      assignedToUserId,
      assignedByUserId,
    );
  }

  @Patch(':id/score')
  @Roles('admin', 'manager', 'sales-rep')
  @ApiOperation({ summary: 'Update lead score' })
  updateScore(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('score') score: number,
  ) {
    return this.leadsService.updateScore(tenantId, id, score);
  }

  // ========== TAGS ==========

  @Post('tags')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create tag' })
  createTag(
    @CurrentTenant() tenantId: string,
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.leadsService.createTag(tenantId, createTagDto);
  }

  @Get('tags')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get all tags' })
  findAllTags(@CurrentTenant() tenantId: string) {
    return this.leadsService.findAllTags(tenantId);
  }

  @Get('tags/:id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get tag by ID' })
  findTag(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.leadsService.findTag(tenantId, id);
  }

  @Patch('tags/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update tag' })
  updateTag(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.leadsService.updateTag(tenantId, id, updateTagDto);
  }

  @Delete('tags/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete tag' })
  removeTag(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.leadsService.removeTag(tenantId, id);
  }

  // ========== CUSTOM FIELDS ==========

  @Post('custom-fields')
  @Roles('admin')
  @ApiOperation({ summary: 'Create custom field' })
  createCustomField(
    @CurrentTenant() tenantId: string,
    @Body() createCustomFieldDto: CreateCustomFieldDto,
  ) {
    return this.leadsService.createCustomField(tenantId, createCustomFieldDto);
  }

  @Get('custom-fields')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get all custom fields' })
  findAllCustomFields(
    @CurrentTenant() tenantId: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.leadsService.findAllCustomFields(tenantId, entityType);
  }

  @Get('custom-fields/:id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get custom field by ID' })
  findCustomField(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.leadsService.findCustomField(tenantId, id);
  }

  @Patch('custom-fields/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update custom field' })
  updateCustomField(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateCustomFieldDto: UpdateCustomFieldDto,
  ) {
    return this.leadsService.updateCustomField(
      tenantId,
      id,
      updateCustomFieldDto,
    );
  }

  @Delete('custom-fields/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete custom field' })
  removeCustomField(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.removeCustomField(tenantId, id);
  }
}
