import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WebhookEvent, WebhookSource } from '../../../common/entities/webhook-event.entity';
import { EmailRecipient, EmailRecipientSendStatus } from '../../../common/entities/email-recipient.entity';
import { EmailMessage } from '../../../common/entities/email-message.entity';
import { EmailEvent, EmailEventType } from '../../../common/entities/email-event.entity';

type SesSnsEnvelope = {
  notificationType: 'Delivery' | 'Bounce' | 'Complaint';
  mail: { messageId: string; timestamp: string; destination?: string[] };
  delivery?: { timestamp: string; recipients: string[] };
  bounce?: { timestamp: string; bouncedRecipients: Array<{ emailAddress: string; status?: string; diagnosticCode?: string }> };
  complaint?: { timestamp: string; complainedRecipients: Array<{ emailAddress: string }> };
};

@Injectable()
export class SesWebhookService {
  constructor(
    @InjectRepository(WebhookEvent) private webhookEvents: Repository<WebhookEvent>,
    @InjectRepository(EmailRecipient) private recipients: Repository<EmailRecipient>,
    @InjectRepository(EmailMessage) private messages: Repository<EmailMessage>,
    @InjectRepository(EmailEvent) private events: Repository<EmailEvent>,
  ) {}

  async handleSnsNotification(messageId: string, sesPayload: SesSnsEnvelope) {
    // idempotency at SNS message level (MessageId)
    const exists = await this.webhookEvents.findOne({
      where: { source: WebhookSource.SES_SNS, externalId: messageId },
    });
    if (exists?.processedAt) return;

    const rec = exists || this.webhookEvents.create({
      source: WebhookSource.SES_SNS,
      externalId: messageId,
      type: sesPayload.notificationType,
      payload: sesPayload as any,
    });

    try {
      const providerMessageId = sesPayload.mail.messageId; // SES message id

      // Find recipient row by providerMessageId (you already store providerMessageId per-recipient)
      // If SES sends one messageId for multiple recipients and you send per recipient, this is perfect.
      const recipient = await this.recipients.findOne({ where: { providerMessageId } });

      // If you have a different mapping (like EmailMessage.providerMessageId), tell me and I'll adjust.
      if (!recipient) {
        rec.processedAt = new Date();
        await this.webhookEvents.save(rec);
        return;
      }

      const emailMessageId = recipient.emailMessageId;
      const now = new Date();

      if (sesPayload.notificationType === 'Delivery') {
        await this.recipients.update(recipient.id, { sendStatus: EmailRecipientSendStatus.DELIVERED });
        await this.events.save(this.events.create({
          emailMessageId,
          type: EmailEventType.DELIVERED,
          occurredAt: now,
          metadata: { recipientId: recipient.id, providerMessageId },
        }));
      }

      if (sesPayload.notificationType === 'Bounce') {
        await this.recipients.update(recipient.id, { sendStatus: EmailRecipientSendStatus.BOUNCED });
        await this.events.save(this.events.create({
          emailMessageId,
          type: EmailEventType.BOUNCE,
          occurredAt: now,
          metadata: { recipientId: recipient.id, providerMessageId, bounce: sesPayload.bounce },
        }));
      }

      if (sesPayload.notificationType === 'Complaint') {
        await this.recipients.update(recipient.id, { sendStatus: EmailRecipientSendStatus.COMPLAINED });
        await this.events.save(this.events.create({
          emailMessageId,
          type: EmailEventType.COMPLAINT,
          occurredAt: now,
          metadata: { recipientId: recipient.id, providerMessageId, complaint: sesPayload.complaint },
        }));
      }

      rec.processedAt = new Date();
      await this.webhookEvents.save(rec);
    } catch (e: any) {
      rec.error = String(e?.message || e);
      await this.webhookEvents.save(rec);
      throw e;
    }
  }
}