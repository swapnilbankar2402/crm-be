// src/companies/companies.controller.ts
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

import { CompaniesService } from './companies.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  QueryCompaniesDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, Roles } from 'src/auth/decorators';


@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles('admin', 'manager', 'sales-rep')
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 409, description: 'Company domain already exists' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(tenantId, dto);
  }

  @Get()
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get all companies with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryCompaniesDto,
  ) {
    return this.companiesService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get company statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.companiesService.getStats(tenantId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.findOne(tenantId, id);
  }

  @Get(':id/contacts')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get company contacts' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved successfully' })
  getContacts(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.getCompanyContacts(tenantId, id);
  }

  @Get(':id/leads')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get company leads' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  getLeads(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.getCompanyLeads(tenantId, id);
  }

  @Get(':id/deals')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get company deals' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Deals retrieved successfully' })
  getDeals(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.getCompanyDeals(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'sales-rep')
  @ApiOperation({ summary: 'Update company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete company (soft delete)' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 400, description: 'Company has associated records' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.remove(tenantId, id);
  }

  @Post(':id/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company restored successfully' })
  restore(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.restore(tenantId, id);
  }
}