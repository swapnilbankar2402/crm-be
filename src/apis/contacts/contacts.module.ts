import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { Company, Contact, CustomField, CustomFieldValue, Tenant } from 'src/common/entities';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contact,
      Company,
      Tenant,
      CustomField,
      CustomFieldValue,
    ]),
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}