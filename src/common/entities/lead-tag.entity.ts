import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Lead } from './lead.entity';
import { Tag } from './tag.entity';

@Entity('lead_tags')
@Index(['leadId', 'tagId'], { unique: true })
export class LeadTag extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  leadId: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Index()
  @Column({ type: 'uuid' })
  tagId: string;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: Tag;
}