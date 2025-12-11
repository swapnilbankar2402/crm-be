import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Deal } from './deal.entity';

@Entity('deal_products')
export class DealProduct extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  dealId: string;

  @ManyToOne(() => Deal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dealId' })
  deal: Deal;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number; // Percentage

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;
}