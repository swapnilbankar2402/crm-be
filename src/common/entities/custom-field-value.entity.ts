import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { CustomField } from './custom-field.entity';
import { Lead } from './lead.entity';
import { Contact } from './contact.entity';
import { Company } from './company.entity';
import { Deal } from './deal.entity';

@Entity('custom_field_values')
export class CustomFieldValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  fieldId: string;

  @ManyToOne(() => CustomField, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fieldId' })
  field: CustomField;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  leadId: string;

  @ManyToOne(() => Lead, (lead) => lead.customFieldValues, { 
    nullable: true, 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  contactId: string;

  @ManyToOne(() => Contact, (contact) => contact.customFieldValues, { 
    nullable: true, 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.customFieldValues, { 
    nullable: true, 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  dealId: string;

  @ManyToOne(() => Deal, (deal) => deal.customFieldValues, { 
    nullable: true, 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'dealId' })
  deal: Deal;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ type: 'jsonb', nullable: true })
  valueJson: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}