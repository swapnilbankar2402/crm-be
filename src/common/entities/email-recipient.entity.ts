import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmailMessage } from './email-message.entity';

export enum EmailRecipientType {
  TO = 'to',
  CC = 'cc',
  BCC = 'bcc',
}

export enum EmailRecipientStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  REJECTED = 'rejected',
}

export enum EmailRecipientSendStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
}

@Entity('email_recipients')
export class EmailRecipient extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  emailMessageId: string;

  @ManyToOne(() => EmailMessage, (m) => m.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emailMessageId' })
  emailMessage: EmailMessage;

  @Column({ type: 'enum', enum: EmailRecipientType })
  type: EmailRecipientType;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  trackingToken: string; // nanoid, unique per recipient

  // ✅ ADD THIS
  @Column({
    type: 'enum',
    enum: EmailRecipientSendStatus,
    default: EmailRecipientSendStatus.QUEUED,
  })
  sendStatus: EmailRecipientSendStatus;

  // ✅ ADD THIS (SES messageId or SMTP messageId)
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  providerMessageId?: string | null;

  @Column({
    type: 'enum',
    enum: EmailRecipientStatus,
    default: EmailRecipientStatus.PENDING,
  })
  status: EmailRecipientStatus;

  // Tracking summary counters
  @Column({ type: 'int', default: 0 })
  openCount: number;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  firstOpenedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastOpenedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  firstClickedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastClickedAt?: Date | null;
}
