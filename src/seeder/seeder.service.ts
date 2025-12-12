import { Injectable } from '@nestjs/common';
import { Seed } from './seeds/seed.interface';
import { RolesSeed } from './seeds/roles.seed';
import { PlansSeed } from './seeds/plans.seed';
import { EmailTemplatesSeed } from './seeds/email-templates.seed';

type RunOptions = {
  only?: string[];
};

@Injectable()
export class SeederService {
  private readonly seeds: Seed[];

  constructor(
    private readonly rolesSeed: RolesSeed,
    private readonly plansSeed: PlansSeed,
    private readonly emailTemplatesSeed: EmailTemplatesSeed,
  ) {
    // execution order matters
    this.seeds = [this.rolesSeed, this.plansSeed, this.emailTemplatesSeed];
  }

  async run(options: RunOptions = {}) {
    const { only } = options;

    const list = only?.length
      ? this.seeds.filter((s) => only.includes(s.name))
      : this.seeds;

    for (const seed of list) {
      // eslint-disable-next-line no-console
      console.log(`\n[seed] running: ${seed.name}`);
      await seed.run();
      // eslint-disable-next-line no-console
      console.log(`[seed] done: ${seed.name}`);
    }
  }
}