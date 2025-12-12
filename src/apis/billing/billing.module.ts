import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

import { StripeWebhookController } from './stripe/stripe-webhook.controller';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { Plan, StripeWebhookEvent, Tenant, TenantSubscription } from 'src/common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Plan, TenantSubscription, StripeWebhookEvent])],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, StripeWebhookService],
  exports: [BillingService, StripeWebhookService],
})
export class BillingModule {}