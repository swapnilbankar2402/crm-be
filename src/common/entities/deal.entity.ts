// src/common/entities/deal.entity.ts
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
import { User } from './user.entity';
import { Contact } from './contact.entity';
import { Company } from './company.entity';
import { Lead } from './lead.entity';
import { Activity } from './activity.entity';
import { Pipeline } from './pipeline.entity';
import { PipelineStage } from './pipeline-stage.entity';
import { CustomFieldValue } from './custom-field-value.entity';
import { DealProduct } from './deal-product.entity';

export enum DealStatus {
  OPEN = 'open',
  WON = 'won',
  LOST = 'lost',
  ABANDONED = 'abandoned',
}

export enum DealPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('deals')
export class Deal extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DealStatus,
    default: DealStatus.OPEN,
  })
  status: DealStatus;

  @Column({
    type: 'enum',
    enum: DealPriority,
    default: DealPriority.MEDIUM,
  })
  priority: DealPriority;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Index()
  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  contactId: string;

  @ManyToOne(() => Contact, (contact) => contact.deals, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.deals, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  leadId: string;

  @ManyToOne(() => Lead, (lead) => lead.deals, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  pipelineId: string;

  @ManyToOne(() => Pipeline, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pipelineId' })
  pipeline: Pipeline;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  stageId: string;

  @ManyToOne(() => PipelineStage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stageId' })
  stage: PipelineStage;

  @Column({ type: 'int', nullable: true })
  probability: number; // 0-100%

  @Column({ type: 'timestamptz', nullable: true })
  expectedCloseDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actualCloseDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lostReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string; // Where did this deal come from?

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;

  @Column({ type: 'timestamptz', nullable: true })
  lastActivityAt: Date;

  @Column({ type: 'int', default: 0 })
  daysInStage: number;

  @Column({ type: 'int', default: 0 })
  totalDaysInPipeline: number;

  // Relationships
  @OneToMany(() => Activity, (activity) => activity.deal)
  activities: Activity[];

  @OneToMany(
    () => CustomFieldValue,
    (customFieldValue) => customFieldValue.deal,
  )
  customFieldValues: CustomFieldValue[];

  @OneToMany(() => DealProduct, (product) => product.deal)
  dealProducts: DealProduct[];

  // Computed properties
  get weightedValue(): number {
    if (!this.probability) return 0;
    return parseFloat(this.amount.toString()) * (this.probability / 100);
  }

  get isOpen(): boolean {
    return this.status === DealStatus.OPEN;
  }

  get isWon(): boolean {
    return this.status === DealStatus.WON;
  }

  get isLost(): boolean {
    return this.status === DealStatus.LOST;
  }

  get isClosed(): boolean {
    return [DealStatus.WON, DealStatus.LOST, DealStatus.ABANDONED].includes(
      this.status,
    );
  }

  get productsTotal(): number {
    if (!this.products || this.products.length === 0) return 0;
    return this.products.reduce((sum, product) => sum + product.total, 0);
  }
}
