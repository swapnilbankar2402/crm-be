// src/common/entities/app-notification.entity.ts
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

// We can keep these enums here or move them to a separate file if preferred
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
}

export enum NotificationType {
  LEAD_ASSIGNED = 'lead_assigned',
  TASK_DUE = 'task_due',
  DEAL_WON = 'deal_won',
  MENTION = 'mention',
  SYSTEM_ALERT = 'system_alert',
}

@Entity('notifications') // The table name in the database remains 'notifications'
export class AppNotification extends BaseEntity { // Renamed from Notification
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @Column({ type: 'enum', enum: NotificationChannel, array: true, default: [] })
  channels: NotificationChannel[];

  @Column({ type: 'jsonb', nullable: true })
  context: {
    entityType?: 'lead' | 'deal' | 'contact' | 'task';
    entityId?: string;
    [key: string]: any;
  };
}