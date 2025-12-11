import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { LeadTag } from './lead-tag.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @OneToMany(() => LeadTag, (leadTag) => leadTag.tag)
  leadTags: LeadTag[];

  @Column({ type: 'int', default: 0 })
  usageCount: number;
}