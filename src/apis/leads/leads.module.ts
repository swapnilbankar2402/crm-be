import { Module } from '@nestjs/common';
import { LeadsService } from './services/leads.service';
import { LeadsController } from './controllers/leads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CustomField,
  CustomFieldValue,
  Lead,
  LeadTag,
  Pipeline,
  PipelineStage,
  Tag,
  Tenant,
  User,
} from 'src/common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      Tag,
      LeadTag,
      CustomField,
      CustomFieldValue,
      User,
      Tenant,
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
