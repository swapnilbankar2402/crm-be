import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
}

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  // Basic Info
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  primaryColor: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  secondaryColor: string;

  // Status
  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  status: TenantStatus;

  // Subscription Info
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionStartedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionEndsAt: Date;

  // Limits (based on plan)
  @Column({ type: 'int', default: 5 })
  maxUsers: number;

  @Column({ type: 'int', default: 1000 })
  maxLeads: number;

  @Column({ type: 'int', default: 1000 })
  maxContacts: number;

  @Column({ type: 'int', default: 5000 })
  maxEmailsPerMonth: number;

  @Column({ type: 'int', default: 1 }) // GB
  maxStorageGB: number;

  // Current Usage
  @Column({ type: 'int', default: 0 })
  currentUsers: number;

  @Column({ type: 'int', default: 0 })
  currentLeads: number;

  @Column({ type: 'int', default: 0 })
  currentContacts: number;

  @Column({ type: 'int', default: 0 })
  currentEmailsThisMonth: number;

  @Column({ type: 'float', default: 0 })
  currentStorageGB: number;

  // Billing
  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeCustomerId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeSubscriptionId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  billingEmail: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  billingName: string;

  @Column({ type: 'text', nullable: true })
  billingAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  billingCity: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  billingState: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  billingZipCode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  billingCountry: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxId: string;

  // Contact Info
  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  // Company Info
  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companySize: string; // '1-10', '11-50', '51-200', '201-500', '500+'

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  defaultLanguage: string;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  // Feature Flags
  @Column({ type: 'jsonb', default: {} })
  enabledFeatures: {
    leads?: boolean;
    contacts?: boolean;
    deals?: boolean;
    analytics?: boolean;
    emailTracking?: boolean;
    apiAccess?: boolean;
    customFields?: boolean;
    automation?: boolean;
    reporting?: boolean;
    webhooks?: boolean;
  };

  // Settings
  @Column({ type: 'jsonb', nullable: true })
  settings: {
    emailSignature?: string;
    workingHours?: {
      start: string;
      end: string;
      timezone: string;
    };
    notifications?: {
      newLead?: boolean;
      dealWon?: boolean;
      taskDue?: boolean;
    };
    security?: {
      enforceSSO?: boolean;
      enforce2FA?: boolean;
      sessionTimeout?: number;
      ipWhitelist?: string[];
    };
    branding?: {
      loginPageMessage?: string;
      customCSS?: string;
    };
  };

  // Onboarding
  @Column({ type: 'boolean', default: false })
  onboardingCompleted: boolean;

  @Column({ type: 'jsonb', default: {} })
  onboardingSteps: {
    profileCompleted?: boolean;
    teamInvited?: boolean;
    firstLeadAdded?: boolean;
    pipelineConfigured?: boolean;
    integrationSetup?: boolean;
  };

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Tracking
  @Column({ type: 'timestamptz', nullable: true })
  lastActivityAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // 'website', 'referral', 'advertising', etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  referralCode: string;

  // Relationships
  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  // Future relationships (commented for now)
  // @OneToMany(() => Lead, (lead) => lead.tenant)
  // leads: Lead[];

  // @OneToMany(() => Contact, (contact) => contact.tenant)
  // contacts: Contact[];

  // @OneToMany(() => Deal, (deal) => deal.tenant)
  // deals: Deal[];

  // @OneToMany(() => Invoice, (invoice) => invoice.tenant)
  // invoices: Invoice[];

  // Computed properties
  get isActive(): boolean {
    return this.status === TenantStatus.ACTIVE || this.status === TenantStatus.TRIAL;
  }

  get isTrialExpired(): boolean {
    if (!this.trialEndsAt) return false;
    return new Date() > this.trialEndsAt;
  }

  get daysUntilTrialExpires(): number {
    if (!this.trialEndsAt) return 0;
    const now = new Date();
    const diff = this.trialEndsAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  get isSubscriptionActive(): boolean {
    if (!this.subscriptionEndsAt) return false;
    return new Date() < this.subscriptionEndsAt;
  }

  get usersPercentage(): number {
    return (this.currentUsers / this.maxUsers) * 100;
  }

  get leadsPercentage(): number {
    return (this.currentLeads / this.maxLeads) * 100;
  }

  get contactsPercentage(): number {
    return (this.currentContacts / this.maxContacts) * 100;
  }

  get storagePercentage(): number {
    return (this.currentStorageGB / this.maxStorageGB) * 100;
  }

  get isNearUserLimit(): boolean {
    return this.usersPercentage >= 80;
  }

  get isNearLeadLimit(): boolean {
    return this.leadsPercentage >= 80;
  }
}