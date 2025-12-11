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
import { Company } from './company.entity';
import { Lead } from './lead.entity';
import { Deal } from './deal.entity';
import { Activity } from './activity.entity';
import { CustomFieldValue } from './custom-field-value.entity';

@Entity('contacts')
export class Contact extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.contacts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'varchar', length: 100, nullable: true })
  jobTitle: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

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

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  isCustomer: boolean;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  // Relationships
  @OneToMany(() => Lead, (lead) => lead.contact)
  leads: Lead[];

  @OneToMany(() => Deal, (deal) => deal.contact)
  deals: Deal[];

  @OneToMany(() => Activity, (activity) => activity.contact)
  activities: Activity[];

  @OneToMany(
    () => CustomFieldValue,
    (customFieldValue) => customFieldValue.contact,
  )
  customFieldValues: CustomFieldValue[];

  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }
}
