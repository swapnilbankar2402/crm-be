import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import { Role } from '../common/entities/role.entity';
import { Plan } from '../common/entities/plan.entity';
import { EmailTemplate } from '../common/entities/email-template.entity';
import { SeederService } from './seeder.service';
import { RolesSeed } from './seeds/roles.seed';
import { PlansSeed } from './seeds/plans.seed';
import { EmailTemplatesSeed } from './seeds/email-templates.seed';
import { ConfigModule } from '@nestjs/config';
import configuration from 'src/config/configuration';

// seeds

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    TypeOrmModule.forFeature([Role, Plan, EmailTemplate]),
  ],
  providers: [SeederService, RolesSeed, PlansSeed, EmailTemplatesSeed],
})
export class SeederModule {}
