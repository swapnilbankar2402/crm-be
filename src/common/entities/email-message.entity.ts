import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { Lead } from './lead.entity';
import { Contact } from './contact.entity';
import { Company } from './company.entity';
import { Deal } from './deal.entity';
import { EmailEvent } from './email-event.entity';
import { EmailLink } from './email-link.entity';
import { EmailRecipient } from './email-recipient.entity';
import { EmailTemplate } from './email-template.entity';

export enum EmailProvider {
  SMTP = 'smtp',
  SES = 'ses',
}

export enum EmailMessageStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('email_messages')
export class EmailMessage extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  publicId: string; // nanoid, safe for public URLs

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  templateId?: string | null;

  @ManyToOne(() => EmailTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'templateId' })
  template?: EmailTemplate | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fromEmail?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fromName?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  replyTo?: string | null;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  html: string; // The final, rendered HTML

  @Column({ type: 'text', nullable: true })
  text?: string | null;

  @Column({ type: 'enum', enum: EmailProvider, default: EmailProvider.SMTP })
  provider: EmailProvider;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  providerMessageId?: string | null;

  @Column({ type: 'enum', enum: EmailMessageStatus, default: EmailMessageStatus.DRAFT })
  status: EmailMessageStatus;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string | null;

  // CRM context links
  @Index()
  @Column({ type: 'uuid', nullable: true })
  leadId?: string | null;

  @ManyToOne(() => Lead, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'leadId' })
  lead?: Lead | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  contactId?: string | null;

  @ManyToOne(() => Contact, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contactId' })
  contact?: Contact | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  companyId?: string | null;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'companyId' })
  company?: Company | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  dealId?: string | null;

  @ManyToOne(() => Deal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dealId' })
  deal?: Deal | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @OneToMany(() => EmailRecipient, (r) => r.emailMessage, { cascade: true })
  recipients: EmailRecipient[];

  @OneToMany(() => EmailEvent, (e) => e.emailMessage, { cascade: true })
  events: EmailEvent[];

  @OneToMany(() => EmailLink, (l) => l.emailMessage, { cascade: true })
  links: EmailLink[];
}