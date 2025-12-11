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
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto, QueryTenantsDto, UpdateBillingDto, UpdateBrandingDto, UpdateSettingsDto, UpdateSubscriptionDto, UpdateTenantDto } from '../dto';
import { CurrentTenant, Roles } from 'src/auth/decorators';
import { TenantStatus } from 'src/common/entities';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles('super-admin')
  @ApiOperation({ summary: 'Create a new tenant (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Tenant slug or domain already exists' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Roles('super-admin')
  @ApiOperation({ summary: 'Get all tenants (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  findAll(@Query() query: QueryTenantsDto) {
    return this.tenantsService.findAll(query);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant information' })
  @ApiResponse({ status: 200, description: 'Current tenant retrieved successfully' })
  getCurrentTenant(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getCurrentTenant(tenantId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Get(':id')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Get tenant by ID (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch('current/settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update current tenant settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.tenantsService.updateSettings(tenantId, updateSettingsDto);
  }

  @Patch('current/branding')
  @Roles('admin')
  @ApiOperation({ summary: 'Update current tenant branding' })
  @ApiResponse({ status: 200, description: 'Branding updated successfully' })
  updateBranding(
    @CurrentTenant() tenantId: string,
    @Body() updateBrandingDto: UpdateBrandingDto,
  ) {
    return this.tenantsService.updateBranding(tenantId, updateBrandingDto);
  }

  @Patch('current/billing')
  @Roles('admin')
  @ApiOperation({ summary: 'Update current tenant billing information' })
  @ApiResponse({ status: 200, description: 'Billing info updated successfully' })
  updateBilling(
    @CurrentTenant() tenantId: string,
    @Body() updateBillingDto: UpdateBillingDto,
  ) {
    return this.tenantsService.updateBilling(tenantId, updateBillingDto);
  }

  @Patch(':id/subscription')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Update tenant subscription (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.tenantsService.updateSubscription(id, updateSubscriptionDto);
  }

  @Patch(':id/status')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Update tenant status (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(@Param('id') id: string, @Body('status') status: TenantStatus) {
    return this.tenantsService.updateStatus(id, status);
  }

  @Post('current/onboarding/:step')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete onboarding step' })
  @ApiParam({ name: 'step', description: 'Onboarding step name' })
  @ApiResponse({ status: 200, description: 'Onboarding step completed' })
  completeOnboardingStep(
    @CurrentTenant() tenantId: string,
    @Param('step') step: string,
  ) {
    return this.tenantsService.completeOnboardingStep(tenantId, step);
  }

  @Get('current/usage')
  @Roles('admin')
  @ApiOperation({ summary: 'Get current tenant usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage stats retrieved successfully' })
  getUsageStats(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getUsageStats(tenantId);
  }

  @Get('current/analytics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get current tenant analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getAnalytics(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getAnalytics(tenantId);
  }

  @Delete(':id')
  @Roles('super-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete tenant (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}