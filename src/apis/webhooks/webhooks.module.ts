import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { WebhookEvent } from '../../common/entities/webhook-event.entity';
import { EmailRecipient } from '../../common/entities/email-recipient.entity';
import { EmailMessage } from '../../common/entities/email-message.entity';
import { EmailEvent } from '../../common/entities/email-event.entity';

import { BillingModule } from '../billing/billing.module';

import { StripeWebhooksController } from './stripe/stripe-webhooks.controller';
import { SesWebhooksController } from './ses/ses-webhooks.controller';

import { SnsVerifierService } from './sns/sns-verifier.service';
import { SesWebhookService } from './ses/ses-webhook.service';

@Module({
  imports: [
    HttpModule,
    BillingModule, // for StripeWebhookService
    TypeOrmModule.forFeature([WebhookEvent, EmailRecipient, EmailMessage, EmailEvent]),
  ],
  controllers: [StripeWebhooksController, SesWebhooksController],
  providers: [SnsVerifierService, SesWebhookService],
})
export class WebhooksModule {}