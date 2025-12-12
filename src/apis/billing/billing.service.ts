import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

import { Tenant } from '../../common/entities/tenant.entity';
import { Plan } from '../../common/entities/plan.entity';
import { TenantSubscription, SubscriptionStatus } from '../../common/entities/tenant-subscription.entity';
import { createStripeClient } from './stripe/stripe.client';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    @InjectRepository(Tenant) private tenants: Repository<Tenant>,
    @InjectRepository(Plan) private plans: Repository<Plan>,
    @InjectRepository(TenantSubscription) private subs: Repository<TenantSubscription>,
  ) {
    this.stripe = createStripeClient(this.config.get<string>('STRIPE_SECRET_KEY')!);
  }

  async listPublicPlans() {
    return this.plans.find({ where: { isActive: true, isPublic: true }, order: { amountCents: 'ASC' as any } });
  }

  async createCheckoutSession(tenantId: string, userEmail: string, planSlug: string) {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const plan = await this.plans.findOne({ where: { slug: planSlug, isActive: true } });
    if (!plan) throw new NotFoundException('Plan not found');

    let sub = await this.subs.findOne({ where: { tenantId } });

    // ensure Stripe customer
    let stripeCustomerId = sub?.stripeCustomerId || tenant.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: userEmail,
        name: tenant.name,
        metadata: { tenantId },
      });
      stripeCustomerId = customer.id;

      // persist on both (tenant + subscription) for compatibility
      tenant.stripeCustomerId = stripeCustomerId;
      await this.tenants.save(tenant);
    }

    if (!sub) {
      sub = this.subs.create({
        tenantId,
        stripeCustomerId,
        status: SubscriptionStatus.INCOMPLETE,
      });
      await this.subs.save(sub);
    }

    const successUrl = this.config.get<string>('STRIPE_SUCCESS_URL')!;
    const cancelUrl = this.config.get<string>('STRIPE_CANCEL_URL')!;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { tenantId, planSlug: plan.slug },
      },
      metadata: { tenantId, planSlug: plan.slug },
    });

    return { url: session.url, id: session.id };
  }

  async createBillingPortalSession(tenantId: string, returnUrl: string) {
    const sub = await this.subs.findOne({ where: { tenantId } });
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });

    const customerId = sub?.stripeCustomerId || tenant?.stripeCustomerId;
    if (!customerId) throw new BadRequestException('No Stripe customer found for tenant');

    const portal = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: portal.url };
  }

  async getSubscription(tenantId: string) {
    const sub = await this.subs.findOne({ where: { tenantId }, relations: ['plan'] });
    return sub;
  }
}