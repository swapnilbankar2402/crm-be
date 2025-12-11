import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmailMessage } from './email-message.entity';
import { EmailRecipient } from './email-recipient.entity';
import { EmailLink } from './email-link.entity';

export enum EmailEventType {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  OPEN = 'open',
  CLICK = 'click',
  BOUNCE = 'bounce',
  COMPLAINT = 'complaint',
}

@Entity('email_events')
export class EmailEvent extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  emailMessageId: string;

  @ManyToOne(() => EmailMessage, (m) => m.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emailMessageId' })
  emailMessage: EmailMessage;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  recipientId?: string | null; // Link to the specific recipient

  @ManyToOne(() => EmailRecipient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recipientId' })
  recipient?: EmailRecipient | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  linkId?: string | null; // Link to the specific link clicked

  @ManyToOne(() => EmailLink, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'linkId' })
  link?: EmailLink | null;

  @Column({ type: 'enum', enum: EmailEventType })
  type: EmailEventType;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  occurredAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}