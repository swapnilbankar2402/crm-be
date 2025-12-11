import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { Lead } from './lead.entity';
import { Contact } from './contact.entity';
import { Company } from './company.entity';
import { Deal } from './deal.entity';

export enum ActivityType {
  CALL = 'call',
  MEETING = 'meeting',
  TASK = 'task',
  NOTE = 'note',
  EMAIL = 'email',
  SMS = 'sms',
  DEADLINE = 'deadline',
  LUNCH = 'lunch',
}

export enum ActivityStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum ActivityPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('activities')
export class Activity extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.SCHEDULED,
  })
  status: ActivityStatus;

  @Column({
    type: 'enum',
    enum: ActivityPriority,
    default: ActivityPriority.MEDIUM,
  })
  priority: ActivityPriority;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date;

  @Column({ type: 'int', nullable: true })
  duration: number; // Duration in minutes

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  // Related entities
  @Index()
  @Column({ type: 'uuid', nullable: true })
  leadId: string;

  @ManyToOne(() => Lead, (lead) => lead.activities, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  contactId: string;

  @ManyToOne(() => Contact, (contact) => contact.activities, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.activities, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  dealId: string;

  @ManyToOne(() => Deal, (deal) => deal.activities, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dealId' })
  deal: Deal;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  attendees: string[]; // Array of email addresses or user IDs

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'boolean', default: false })
  isAllDay: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  outcome: string; // Result of the activity (e.g., "Connected", "No Answer", "Left Voicemail")

  @Column({ type: 'int', nullable: true })
  reminderMinutes: number; // Minutes before due date to send reminder

  // Computed properties
  get isOverdue(): boolean {
    if (!this.dueDate || this.status === ActivityStatus.COMPLETED) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  get isCompleted(): boolean {
    return this.status === ActivityStatus.COMPLETED;
  }

  get isPending(): boolean {
    return [ActivityStatus.SCHEDULED, ActivityStatus.IN_PROGRESS].includes(
      this.status,
    );
  }

  // Auto-update status to overdue
  @BeforeUpdate()
  checkOverdue() {
    if (
      this.dueDate &&
      new Date() > this.dueDate &&
      this.status === ActivityStatus.SCHEDULED
    ) {
      this.status = ActivityStatus.OVERDUE;
    }
  }
}