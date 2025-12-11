// src/common/entities/custom-field.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

export enum CustomFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  DROPDOWN = 'dropdown',
  MULTI_SELECT = 'multi_select',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
}

@Entity('custom_fields')
export class CustomField extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CustomFieldType,
  })
  type: CustomFieldType;

  @Column({ type: 'jsonb', nullable: true })
  options: any; // For dropdown/multi-select options

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  position: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityType: string; // 'lead', 'contact', 'company', etc.
}