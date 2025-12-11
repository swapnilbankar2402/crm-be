// src/activities/activities.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import {
  Activity,
  ActivityStatus,
  Company,
  Contact,
  Deal,
  Lead,
  Tenant,
  User,
} from 'src/common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      Tenant,
      User,
      Lead,
      Contact,
      Company,
      Deal,
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
