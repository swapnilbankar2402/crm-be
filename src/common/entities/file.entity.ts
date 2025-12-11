import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum FileEntityType {
  LEAD = 'lead',
  CONTACT = 'contact',
  COMPANY = 'company',
  DEAL = 'deal',
  TASK = 'task',
  NOTE = 'note',
}

@Entity('files')
export class Files extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  uploadedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy: User;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  size: number; // Size in bytes

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 500 })
  s3Key: string; // The unique path/key in the S3 bucket

  @Column({ type: 'varchar', length: 1000 })
  s3Url: string; // The full URL to the file in S3

  // Contextual linking
  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  entityType?: 'lead' | 'contact' | 'company' | 'deal' | 'task' | 'note';

  @Index()
  @Column({ type: 'uuid', nullable: true })
  entityId?: string;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean; // Public files can be accessed without a signed URL
}