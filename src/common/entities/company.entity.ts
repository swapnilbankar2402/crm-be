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
import { Contact } from './contact.entity';
import { Lead } from './lead.entity';
import { Deal } from './deal.entity';
import { Activity } from './activity.entity';
import { CustomFieldValue } from './custom-field-value.entity';

export enum CompanySize {
  SMALL = '1-10',
  MEDIUM = '11-50',
  LARGE = '51-200',
  ENTERPRISE = '201-500',
  MEGA = '500+',
}

@Entity('companies')
export class Company extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  domain: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({
    type: 'enum',
    enum: CompanySize,
    nullable: true,
  })
  companySize: CompanySize;

  @Column({ type: 'int', nullable: true })
  employeeCount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualRevenue: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string;

  @Column({ type: 'boolean', default: false })
  isCustomer: boolean;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  // Relationships
  @OneToMany(() => Contact, (contact) => contact.company)
  contacts: Contact[];

  @OneToMany(() => Lead, (lead) => lead.company)
  leads: Lead[];

  @OneToMany(() => Deal, (deal) => deal.company)
  deals: Deal[];

  @OneToMany(() => Activity, (activity) => activity.company)
  activities: Activity[];

  @OneToMany(
    () => CustomFieldValue,
    (customFieldValue) => customFieldValue.company,
  )
  customFieldValues: CustomFieldValue[];

  get fullAddress(): string {
    if (!this.address) return '';
    return [
      this.address.street,
      this.address.city,
      this.address.state,
      this.address.postalCode,
      this.address.country,
    ]
      .filter(Boolean)
      .join(', ');
  }
}