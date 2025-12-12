import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seed } from './seed.interface';
import { Plan, PlanInterval } from '../../common/entities/plan.entity';

@Injectable()
export class PlansSeed implements Seed {
  name = 'plans';

  constructor(
    @InjectRepository(Plan)
    private readonly plansRepo: Repository<Plan>,
  ) {}

  async run(): Promise<void> {
    const plans: Array<Partial<Plan>> = [
      {
        name: 'Free',
        slug: 'free',
        isActive: true,
        isPublic: true,
        currency: 'USD',
        amountCents: 0,
        interval: PlanInterval.MONTH,
        stripePriceId: 'price_free_placeholder', // replace later
        limits: {
          maxUsers: 2,
          maxLeads: 100,
          maxContacts: 100,
          maxEmailsPerMonth: 500,
          maxStorageGB: 1,
        },
        features: {
          leads: true,
          contacts: true,
          deals: false,
          analytics: false,
          emailTracking: true,
        },
      },
      {
        name: 'Starter',
        slug: 'starter',
        isActive: true,
        isPublic: true,
        currency: 'USD',
        amountCents: 1900,
        interval: PlanInterval.MONTH,
        stripePriceId: 'price_starter_placeholder',
        limits: {
          maxUsers: 5,
          maxLeads: 1000,
          maxContacts: 1000,
          maxEmailsPerMonth: 5000,
          maxStorageGB: 5,
        },
        features: {
          leads: true,
          contacts: true,
          deals: true,
          analytics: true,
          emailTracking: true,
        },
      },
    ];

    for (const p of plans) {
      const existing = await this.plansRepo.findOne({ where: { slug: p.slug as string }, withDeleted: true });
      if (existing) {
        await this.plansRepo.update(existing.id, { ...p, deletedAt: null });
      } else {
        await this.plansRepo.save(this.plansRepo.create(p));
      }
    }
  }
}