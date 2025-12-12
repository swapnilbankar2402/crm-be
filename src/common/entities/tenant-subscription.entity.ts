import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Plan } from './plan.entity';

export enum SubscriptionStatus {
  INCOMPLETE = 'incomplete',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
}

@Entity('tenant_subscriptions')
@Index('UQ_tenant_subscriptions_tenantId', ['tenantId'], { unique: true })
export class TenantSubscription extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  planId?: string | null;

  @ManyToOne(() => Plan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'planId' })
  plan?: Plan | null;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeCustomerId?: string | null;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeSubscriptionId?: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripePriceId?: string | null;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.INCOMPLETE })
  status: SubscriptionStatus;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  currentPeriodStart?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  currentPeriodEnd?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  trialStart?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  trialEnd?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}