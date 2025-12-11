import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { PipelineStage } from './pipeline-stage.entity';

@Entity('pipelines')
export class Pipeline extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => PipelineStage, (stage) => stage.pipeline, {
    cascade: true,
    eager: true,
  })
  stages: PipelineStage[];

  @Column({ type: 'int', default: 0 })
  leadCount: number;
}