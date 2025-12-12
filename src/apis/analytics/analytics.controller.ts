import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AnalyticsService } from './analytics.service';
import { AnalyticsFiltersDto } from './dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentTenant } from '../../auth/decorators/tenant.decorator';

// If you have cache decorators, you can enable these:
// import { CacheResource, CacheTtl } from '../../cache/cache.decorators';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('overview')
  @Roles('admin', 'manager')
  // @CacheResource('analytics_overview')
  // @CacheTtl(30)
  overview(@CurrentTenant() tenantId: string, @Query() q: AnalyticsFiltersDto) {
    return this.analytics.overview(tenantId, q);
  }

  @Get('leads/created')
  @Roles('admin', 'manager')
  // @CacheResource('analytics_leads_created')
  // @CacheTtl(30)
  leadsCreated(@CurrentTenant() tenantId: string, @Query() q: AnalyticsFiltersDto) {
    return this.analytics.leadsCreatedSeries(tenantId, q);
  }

  @Get('deals/revenue-won')
  @Roles('admin', 'manager')
  // @CacheResource('analytics_deals_won')
  // @CacheTtl(30)
  wonRevenue(@CurrentTenant() tenantId: string, @Query() q: AnalyticsFiltersDto) {
    return this.analytics.wonRevenueSeries(tenantId, q);
  }

  @Get('deals/pipeline-by-stage')
  @Roles('admin', 'manager')
  pipelineByStage(@CurrentTenant() tenantId: string, @Query() q: AnalyticsFiltersDto) {
    return this.analytics.pipelineByStage(tenantId, q);
  }

  @Get('activities/summary')
  @Roles('admin', 'manager')
  activities(@CurrentTenant() tenantId: string, @Query() q: AnalyticsFiltersDto) {
    return this.analytics.activitiesSummary(tenantId, q);
  }

  @Get('emails/summary')
  @Roles('admin', 'manager')
  emails(@CurrentTenant() tenantId: string, @Query() q: AnalyticsFiltersDto) {
    return this.analytics.emailSummary(tenantId, q);
  }
}