import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Activity, Deal, EmailMessage, Lead } from 'src/common/entities';


@Module({
  imports: [TypeOrmModule.forFeature([Lead, Deal, Activity, EmailMessage])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}