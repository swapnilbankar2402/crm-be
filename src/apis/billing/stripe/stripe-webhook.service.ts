import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

import { createStripeClient } from './stripe.client';
import { StripeWebhookEvent } from '../../../common/entities/stripe-webhook-event.entity';
import { Tenant } from '../../../common/entities/tenant.entity';
import { Plan } from '../../../common/entities/plan.entity';
import { TenantSubscription, SubscriptionStatus } from '../../../common/entities/tenant-subscription.entity';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    @InjectRepository(StripeWebhookEvent) private eventsRepo: Repository<StripeWebhookEvent>,
    @InjectRepository(Tenant) private tenants: Repository<Tenant>,
    @InjectRepository(Plan) private plans: Repository<Plan>,
    @InjectRepository(TenantSubscription) private subs: Repository<TenantSubscription>,
  ) {
    this.stripe = createStripeClient(this.config.get<string>('STRIPE_SECRET_KEY')!);
  }

  verifyAndConstructEvent(rawBody: Buffer, signature: string | string[]): Stripe.Event {
    const sig = Array.isArray(signature) ? signature[0] : signature;
    return this.stripe.webhooks.constructEvent(
      rawBody,
      sig,
      this.config.get<string>('STRIPE_WEBHOOK_SECRET')!,
    );
  }

  async handleEvent(event: Stripe.Event) {
    // idempotency
    const exists = await this.eventsRepo.findOne({ where: { stripeEventId: event.id } });
    if (exists?.processedAt) return;

    const rec = exists || this.eventsRepo.create({
      stripeEventId: event.id,
      type: event.type,
      payload: event.data as any,
    });

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.onCheckoutCompleted(event);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.onSubscriptionUpdated(event);
          break;

        default:
          // ignore other events for now
          break;
      }

      rec.processedAt = new Date();
      await this.eventsRepo.save(rec);
    } catch (e: any) {
      rec.error = String(e?.message || e);
      await this.eventsRepo.save(rec);
      throw e;
    }
  }

  private async onCheckoutCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenantId = (session.metadata?.tenantId || session.subscription && session.metadata?.tenantId) as string;
    if (!tenantId) return;

    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (tenant && stripeCustomerId) {
      tenant.stripeCustomerId = stripeCustomerId;
      tenant.stripeSubscriptionId = stripeSubscriptionId;
      await this.tenants.save(tenant);
    }

    // Ensure subscription row exists
    let sub = await this.subs.findOne({ where: { tenantId } });
    if (!sub) sub = this.subs.create({ tenantId });

    sub.stripeCustomerId = stripeCustomerId || sub.stripeCustomerId;
    sub.stripeSubscriptionId = stripeSubscriptionId || sub.stripeSubscriptionId;
    await this.subs.save(sub);
  }

  private async onSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    const tenantId = subscription.metadata?.tenantId;
    const planSlug = subscription.metadata?.planSlug;

    if (!tenantId) return;

    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) return;

    // map Stripe status -> our status
    const status = subscription.status as SubscriptionStatus;

    // Find plan by slug or priceId
    const priceId = subscription.items.data[0]?.price?.id;
    let plan: Plan | null = null;

    if (planSlug) plan = await this.plans.findOne({ where: { slug: planSlug } });
    if (!plan && priceId) plan = await this.plans.findOne({ where: { stripePriceId: priceId } });

    let sub = await this.subs.findOne({ where: { tenantId } });
    if (!sub) sub = this.subs.create({ tenantId });

    sub.status = status;
    sub.stripeCustomerId = (subscription.customer as string) || sub.stripeCustomerId;
    sub.stripeSubscriptionId = subscription.id;
    sub.stripePriceId = priceId || sub.stripePriceId;
    sub.planId = plan?.id || sub.planId;
    sub.cancelAtPeriodEnd = !!subscription.cancel_at_period_end;
    sub.currentPeriodStart = subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null;
    sub.currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
    sub.trialStart = subscription.trial_start ? new Date(subscription.trial_start * 1000) : null;
    sub.trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    sub.canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null;

    await this.subs.save(sub);

    // Sync tenant limits/features when ACTIVE/TRIALING
    if (plan && (status === 'active' || status === 'trialing')) {
      tenant.subscriptionPlan = plan.slug as any; // or map to your enum
      tenant.maxUsers = plan.limits.maxUsers;
      tenant.maxLeads = plan.limits.maxLeads;
      tenant.maxContacts = plan.limits.maxContacts;
      tenant.maxEmailsPerMonth = plan.limits.maxEmailsPerMonth;
      tenant.maxStorageGB = plan.limits.maxStorageGB;
      tenant.enabledFeatures = plan.features as any;
      tenant.status = tenant.status === 'trial' ? tenant.status : tenant.status; // keep your tenant status rules
      await this.tenants.save(tenant);
    }

    // If canceled/unpaid -> optionally suspend features
    if (status === 'canceled' || status === 'unpaid') {
      // You can mark tenant suspended/inactive here if you want
      // tenant.status = 'suspended' as any;
      // await this.tenants.save(tenant);
    }
  }
}