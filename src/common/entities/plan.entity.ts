import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum PlanInterval {
  MONTH = 'month',
  YEAR = 'year',
}

@Entity('plans')
@Index(['slug'], { unique: true })
export class Plan extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  slug: string; // free, starter, pro, enterprise

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  amountCents: number;

  @Column({ type: 'enum', enum: PlanInterval, default: PlanInterval.MONTH })
  interval: PlanInterval;

  // Stripe mapping
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  stripePriceId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeProductId?: string | null;

  // Limits + features (you already have these in Tenant; Plan is the source of truth)
  @Column({ type: 'jsonb', default: {} })
  limits: {
    maxUsers: number;
    maxLeads: number;
    maxContacts: number;
    maxEmailsPerMonth: number;
    maxStorageGB: number;
  };

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, boolean>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}