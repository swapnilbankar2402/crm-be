// src/common/entities/user.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { UserRole } from './user-role.entity';
import { Exclude } from 'class-transformer';
import { NotificationType } from './app-notification.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  // Job Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  jobTitle: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  managerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'managerId' })
  manager: User;

  // Email Verification
  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken: string;

  // Password Reset
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken: string;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpires: Date;

  // Login Tracking
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string;

  // User Preferences
  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'light' })
  theme: string;

  // Notifications Settings
  @Column({ type: 'boolean', default: true })
  emailNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  inAppNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  smsNotifications: boolean;

  @Column({ type: 'jsonb', nullable: true })
  notificationSettings: {
    [key in NotificationType]?: {
      // This will now use the correct enum
      in_app: boolean;
      email: boolean;
    };
  };
  
  // Additional Info
  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  permissions: string[]; // Custom permissions override

  // Relationships (will be used by future modules)
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  // Future relationships (commented for now, will be uncommented when modules are created)
  // @OneToMany(() => Lead, (lead) => lead.assignedTo)
  // leads: Lead[];

  // @OneToMany(() => Deal, (deal) => deal.owner)
  // deals: Deal[];

  // @OneToMany(() => Activity, (activity) => activity.user)
  // activities: Activity[];

  // @OneToMany(() => Team, (team) => team.leader)
  // teamsLed: Team[];

  // @ManyToMany(() => Team, (team) => team.members)
  // teams: Team[];

  // Virtual field for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
