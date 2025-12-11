import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailTemplatesService } from '../services/email-templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from '../dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, Roles } from 'src/auth/decorators';

@ApiTags('Emails')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly templatesService: EmailTemplatesService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create an email template' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(tenantId, dto);
  }

  @Get()
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'List all email templates for the tenant' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.templatesService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Get a single email template' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.templatesService.findOne(tenantId, id);
  }
  
  @Get('slug/:slug')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @ApiOperation({ summary: 'Get a single email template by slug' })
  findBySlug(
    @CurrentTenant() tenantId: string,
    @Param('slug') slug: string,
  ) {
    return this.templatesService.findBySlug(tenantId, slug);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update an email template' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Delete an email template' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.templatesService.remove(tenantId, id);
  }
}