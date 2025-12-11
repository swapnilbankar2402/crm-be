import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  userId: string; // The user who performed the action

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  action: string; // e.g., 'deal.create', 'user.update.status'

  @Index()
  @Column({ type: 'varchar', length: 50 })
  entityType: string; // e.g., 'Deal', 'User'

  @Index()
  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;
}