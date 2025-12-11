import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { Company, Contact, CustomField, CustomFieldValue, Deal, DealProduct, Lead, Pipeline, PipelineStage, Tenant, User } from 'src/common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Deal,
      DealProduct,
      Tenant,
      User,
      Contact,
      Company,
      Lead,
      Pipeline,
      PipelineStage,
      CustomField,
      CustomFieldValue,
    ]),
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}