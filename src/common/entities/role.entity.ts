import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { UserRole } from './user-role.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean; // System roles cannot be deleted/modified

  @Column({ type: 'boolean', default: false })
  isDefault: boolean; // Auto-assign to new users

  @Column({ type: 'jsonb', default: [] })
  permissions: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string; // For UI display

  @Column({ type: 'int', default: 0 })
  level: number; // For hierarchy (0 = highest)

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  // Computed
  get userCount(): number {
    return this.userRoles?.length || 0;
  }
}