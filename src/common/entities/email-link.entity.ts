import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmailMessage } from './email-message.entity';

@Entity('email_links')
export class EmailLink extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  emailMessageId: string;

  @ManyToOne(() => EmailMessage, (m) => m.links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emailMessageId' })
  emailMessage: EmailMessage;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  token: string; // nanoid token used in tracking URL

  @Column({ type: 'text' })
  originalUrl: string;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  firstClickedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastClickedAt?: Date | null;
}