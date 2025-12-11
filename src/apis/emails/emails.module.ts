// src/emails/emails.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmailEvent,
  EmailLink,
  EmailMessage,
  EmailRecipient,
  EmailTemplate,
} from 'src/common/entities';
import { EmailTrackingController } from './controllers/email-tracking.controller';
import { EmailTrackingService } from './services/email-tracking.service';
import { EmailComposerService } from './services/email-composer.service';
import { EmailMessagesController } from './controllers/email-messages.controller';
import { EmailTemplatesController } from './controllers/email-templates.controller';
import { SmtpSenderService } from './services/smtp-sender.service';
import { EmailMessagesService } from './services/email-messages.service';
import { EmailTemplatesService } from './services/email-templates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailTemplate,
      EmailMessage,
      EmailRecipient,
      EmailLink,
      EmailEvent,
    ]),
  ],
  controllers: [
    EmailTrackingController,
    EmailMessagesController,
    EmailTemplatesController,
  ],
  providers: [
    EmailTrackingService,
    EmailComposerService,
    SmtpSenderService,
    EmailMessagesService,
    EmailTemplatesService,
  ],
  exports: [EmailMessagesService], // Export if other modules need to send emails
})
export class EmailsModule {}
