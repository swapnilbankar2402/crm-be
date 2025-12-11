import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

export enum EmailTemplateEngine {
  MJML = 'mjml',
}

@Entity('email_templates')
@Index(['tenantId', 'slug'], { unique: true })
export class EmailTemplate extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', nullable: true })
  tenantId: string | null; // null = system template

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150 })
  slug: string;

  @Column({ type: 'enum', enum: EmailTemplateEngine, default: EmailTemplateEngine.MJML })
  engine: EmailTemplateEngine;

  @Column({ type: 'varchar', length: 255 })
  subjectTemplate: string; // handlebars template

  @Column({ type: 'text' })
  mjmlTemplate: string; // stored MJML

  @Column({ type: 'text', nullable: true })
  textTemplate?: string | null; // optional manual text template

  @Column({ type: 'jsonb', nullable: true })
  variablesSchema?: Record<string, any> | null; // optional (for UI)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}