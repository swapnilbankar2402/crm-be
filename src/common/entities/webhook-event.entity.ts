import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum WebhookSource {
  STRIPE = 'stripe',
  SES_SNS = 'ses_sns',
}

@Entity('webhook_events')
@Index(['source', 'externalId'], { unique: true })
export class WebhookEvent extends BaseEntity {
  @Column({ type: 'enum', enum: WebhookSource })
  source: WebhookSource;s

  // Stripe: event.id, SNS: MessageId
  @Column({ type: 'varchar', length: 255 })
  externalId: string;

  // Stripe event.type, SNS Type/notificationType
  @Column({ type: 'varchar', length: 255 })
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