// src/companies/companies.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company, Contact, CustomField, CustomFieldValue, Deal, Lead, Tenant } from 'src/common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      Tenant,
      Contact,
      Lead,
      Deal,
      CustomField,
      CustomFieldValue,
    ]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}