// import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
// import { BaseEntity } from './base.entity';
// import { Pipeline } from './pipeline.entity';

// @Entity('pipeline_stages')
// export class PipelineStage extends BaseEntity {
//   @Index()
//   @Column({ type: 'uuid' })
//   pipelineId: string;

//   @ManyToOne(() => Pipeline, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'pipelineId' })
//   pipeline: Pipeline;

//   @Column({ type: 'varchar', length: 100 })
//   name: string;

//   @Column({ type: 'varchar', length: 7, nullable: true })
//   color: string;

//   @Column({ type: 'int', default: 0 })
//   position: number;

//   @Column({ type: 'int', default: 0 })
//   leadCount: number;

//   @Column({ type: 'int', nullable: true })
//   probability: number; // 0-100%

//   @Column({ type: 'boolean', default: true })
//   isActive: boolean;
// }


import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Pipeline } from './pipeline.entity';

@Entity('pipeline_stages')
export class PipelineStage extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  pipelineId: string;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipelineId' })
  pipeline: Pipeline;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'int', default: 0 })
  leadCount: number;

  @Column({ type: 'int', nullable: true })
  probability: number; // 0-100%

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Set default color if not provided
  @BeforeInsert()
  setDefaultColor() {
    if (!this.color) {
      const colors = [
        '#0066CC', '#FF9500', '#36B37E', '#9999FF',
        '#00C851', '#FF4444', '#FF6B6B', '#4ECDC4',
      ];
      this.color = colors[this.position % colors.length];
    }
  }

  // Set default probability if not provided
  @BeforeInsert()
  setDefaultProbability() {
    if (this.probability === undefined || this.probability === null) {
      // Default probabilities based on position
      const defaultProbabilities = [10, 30, 60, 80, 100, 0];
      this.probability = defaultProbabilities[this.position] || 0;
    }
  }
}