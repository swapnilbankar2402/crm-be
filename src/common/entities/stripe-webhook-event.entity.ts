import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('stripe_webhook_events')
@Index(['stripeEventId'], { unique: true })
export class StripeWebhookEvent extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  stripeEventId: string;

  @Column({ type: 'varchar', length: 200 })
  type: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  receivedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  error?: string | null;
}