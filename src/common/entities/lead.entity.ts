// import {
//   Entity,
//   Column,
//   ManyToOne,
//   JoinColumn,
//   Index,
//   OneToMany,
//   RelationId,
// } from 'typeorm';
// import { BaseEntity } from './base.entity';
// import { Tenant } from './tenant.entity';
// import { User } from './user.entity';
// import { Contact } from './contact.entity';
// import { Company } from './company.entity';
// import { Deal } from './deal.entity';
// import { Activity } from './activity.entity';
// import { LeadTag } from './lead-tag.entity';
// import { CustomFieldValue } from './custom-field-value.entity';

// export enum LeadStatus {
//   NEW = 'new',
//   CONTACTED = 'contacted',
//   QUALIFIED = 'qualified',
//   UNQUALIFIED = 'unqualified',
//   CONVERTED = 'converted',
//   LOST = 'lost',
// }

// export enum LeadSource {
//   WEBSITE = 'website',
//   EMAIL = 'email',
//   PHONE = 'phone',
//   REFERRAL = 'referral',
//   SOCIAL = 'social',
//   ADVERTISING = 'advertising',
//   EVENT = 'event',
//   OTHER = 'other',
// }

// @Entity('leads')
// export class Lead extends BaseEntity {
//   @Index()
//   @Column({ type: 'uuid' })
//   tenantId: string;

//   @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'tenantId' })
//   tenant: Tenant;

//   @Column({ type: 'varchar', length: 255 })
//   title: string;

//   @Column({ type: 'varchar', length: 255, nullable: true })
//   email: string;

//   @Column({ type: 'varchar', length: 20, nullable: true })
//   phone: string;

//   @Column({ type: 'text', nullable: true })
//   description: string;

//   @Column({
//     type: 'enum',
//     enum: LeadStatus,
//     default: LeadStatus.NEW,
//   })
//   status: LeadStatus;

//   @Index()
//   @Column({ type: 'uuid', nullable: true })
//   assignedToId: string;

//   @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
//   @JoinColumn({ name: 'assignedToId' })
//   assignedTo: User;

//   @RelationId((lead: Lead) => lead.assignedTo)
//   assignedToUserId: string;

//   @Index()
//   @Column({ type: 'uuid', nullable: true })
//   contactId: string;

//   @ManyToOne(() => Contact, (contact) => contact.leads, {
//     nullable: true,
//     onDelete: 'SET NULL',
//   })
//   @JoinColumn({ name: 'contactId' })
//   contact: Contact;

//   @Index()
//   @Column({ type: 'uuid', nullable: true })
//   companyId: string;

//   @ManyToOne(() => Company, (company) => company.leads, {
//     nullable: true,
//     onDelete: 'SET NULL',
//   })
//   @JoinColumn({ name: 'companyId' })
//   company: Company;

//   @Column({
//     type: 'enum',
//     enum: LeadSource,
//     nullable: true,
//   })
//   source: LeadSource;

//   @Column({ type: 'varchar', length: 255, nullable: true })
//   sourceDetails: string;

//   @Column({ type: 'int', default: 0 })
//   score: number;

//   @Column({ type: 'varchar', length: 100, nullable: true })
//   priority: string; // 'low', 'medium', 'high', 'critical'

//   @Column({ type: 'timestamptz', nullable: true })
//   nextActionDate: Date;

//   @Column({ type: 'varchar', length: 255, nullable: true })
//   nextAction: string;

//   @Column({ type: 'varchar', length: 100, nullable: true })
//   industry: string;

//   @Column({ type: 'int', nullable: true })
//   estimatedValue: number;

//   @Column({ type: 'varchar', length: 10, default: 'USD' })
//   currency: string;

//   @Column({ type: 'jsonb', nullable: true })
//   address: {
//     street?: string;
//     city?: string;
//     state?: string;
//     postalCode?: string;
//     country?: string;
//   };

//   @Column({ type: 'jsonb', nullable: true })
//   socialProfiles: {
//     linkedin?: string;
//     twitter?: string;
//     facebook?: string;
//   };

//   @Column({ type: 'jsonb', nullable: true })
//   customFields: Record<string, any>;

//   @Column({ type: 'timestamptz', nullable: true })
//   firstContactDate: Date;

//   @Column({ type: 'timestamptz', nullable: true })
//   lastContactDate: Date;

//   @Column({ type: 'timestamptz', nullable: true })
//   convertedAt: Date;

//   @Index()
//   @Column({ type: 'uuid', nullable: true })
//   convertedById: string;

//   @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
//   @JoinColumn({ name: 'convertedById' })
//   convertedBy: User;

//   @Index()
//   @Column({ type: 'uuid', nullable: true })
//   convertedToDealId: string;

//   @ManyToOne(() => Deal, (deal) => deal.lead, {
//     nullable: true,
//     onDelete: 'SET NULL',
//   })
//   @JoinColumn({ name: 'convertedToDealId' })
//   convertedToDeal: Deal;

//   @Column({ type: 'varchar', length: 255, nullable: true })
//   lostReason: string;

//   @Column({ type: 'jsonb', default: [] })
//   tags: string[];

//   // Relationships
//   @OneToMany(() => Activity, (activity) => activity.lead)
//   activities: Activity[];

//   @OneToMany(() => LeadTag, (leadTag) => leadTag.lead)
//   leadTags: LeadTag[];

//   // Add this relationship in the Lead entity class
//   @OneToMany(() => Deal, (deal) => deal.lead)
//   deals: Deal[];

//   @OneToMany(
//     () => CustomFieldValue,
//     (customFieldValue) => customFieldValue.lead,
//   )
//   customFieldValues: CustomFieldValue[];

//   // Computed properties
//   get fullAddress(): string {
//     if (!this.address) return '';
//     return [
//       this.address.street,
//       this.address.city,
//       this.address.state,
//       this.address.postalCode,
//       this.address.country,
//     ]
//       .filter(Boolean)
//       .join(', ');
//   }

//   get isConverted(): boolean {
//     return this.status === LeadStatus.CONVERTED;
//   }

//   get isActive(): boolean {
//     return [
//       LeadStatus.NEW,
//       LeadStatus.CONTACTED,
//       LeadStatus.QUALIFIED,
//     ].includes(this.status);
//   }
// }


// src/common/entities/lead.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  RelationId,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { Contact } from './contact.entity';
import { Company } from './company.entity';
import { Deal } from './deal.entity';
import { Activity } from './activity.entity';
import { LeadTag } from './lead-tag.entity';
import { CustomFieldValue } from './custom-field-value.entity';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  UNQUALIFIED = 'unqualified',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export enum LeadSource {
  WEBSITE = 'website',
  EMAIL = 'email',
  PHONE = 'phone',
  REFERRAL = 'referral',
  SOCIAL = 'social',
  ADVERTISING = 'advertising',
  EVENT = 'event',
  OTHER = 'other',
}

@Entity('leads')
export class Lead extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status: LeadStatus;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @RelationId((lead: Lead) => lead.assignedTo)
  assignedToUserId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  contactId: string;

  @ManyToOne(() => Contact, (contact) => contact.leads, { 
    nullable: true, 
    onDelete: 'SET NULL' 
  })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.leads, { 
    nullable: true, 
    onDelete: 'SET NULL' 
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({
    type: 'enum',
    enum: LeadSource,
    nullable: true,
  })
  source: LeadSource;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceDetails: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  priority: string;

  @Column({ type: 'timestamptz', nullable: true })
  nextActionDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nextAction: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'int', nullable: true })
  estimatedValue: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

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

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true })
  firstContactDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastContactDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  convertedAt: Date;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  convertedById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'convertedById' })
  convertedBy: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  convertedToDealId: string;

  @ManyToOne(() => Deal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'convertedToDealId' })
  convertedToDeal: Deal;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lostReason: string;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  // Relationships
  @OneToMany(() => Activity, (activity) => activity.lead)
  activities: Activity[];

  @OneToMany(() => LeadTag, (leadTag) => leadTag.lead)
  leadTags: LeadTag[];

  @OneToMany(() => CustomFieldValue, (customFieldValue) => customFieldValue.lead)
  customFieldValues: CustomFieldValue[];

  @OneToMany(() => Deal, (deal) => deal.lead)
  deals: Deal[];

  // Computed properties
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

  get isConverted(): boolean {
    return this.status === LeadStatus.CONVERTED;
  }

  get isActive(): boolean {
    return [
      LeadStatus.NEW,
      LeadStatus.CONTACTED,
      LeadStatus.QUALIFIED,
    ].includes(this.status);
  }
}