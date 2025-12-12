import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentTenant } from '../../auth/decorators/tenant.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('plans')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  plans() {
    return this.billing.listPublicPlans();
  }

  @Get('subscription')
  @Roles('admin', 'manager')
  subscription(@CurrentTenant() tenantId: string) {
    return this.billing.getSubscription(tenantId);
  }

  @Post('checkout')
  @Roles('admin', 'manager')
  checkout(
    @CurrentTenant() tenantId: string,
    @CurrentUser('email') email: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.billing.createCheckoutSession(tenantId, email, dto.planSlug);
  }

  @Post('portal')
  @Roles('admin', 'manager')
  portal(@CurrentTenant() tenantId: string, @Query('returnUrl') returnUrl: string) {
    return this.billing.createBillingPortalSession(tenantId, returnUrl || 'http://localhost:3000');
  }
}