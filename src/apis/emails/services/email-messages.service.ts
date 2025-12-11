// src/emails/services/email-messages.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';


import { SmtpSenderService } from './smtp-sender.service';
import { EmailComposerService } from './email-composer.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { EmailEvent, EmailEventType, EmailMessage, EmailMessageStatus, EmailRecipient, EmailRecipientType, EmailTemplate } from 'src/common/entities';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 24);

@Injectable()
export class EmailMessagesService {
  constructor(
    @InjectRepository(EmailMessage)
    private emailMessageRepository: Repository<EmailMessage>,
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(EmailEvent)
    private emailEventRepository: Repository<EmailEvent>,
    private smtpSenderService: SmtpSenderService,
    private composerService: EmailComposerService,
  ) {}

  async send(tenantId: string, userId: string, dto: SendEmailDto) {
    let subject: string = dto.subject;
    let html: string = dto.html;
    let text: string = '';
    let template: EmailTemplate | null = null;

    if (dto.templateSlug) {
      template = await this.emailTemplateRepository.findOne({
        where: { slug: dto.templateSlug, tenantId },
      });
      if (!template) {
        throw new NotFoundException(`Template with slug "${dto.templateSlug}" not found.`);
      }
    } else if (!dto.subject || (!dto.html && !dto.mjml)) {
      throw new BadRequestException('Either a template or subject/html/mjml content is required.');
    }

    // 1. Create the parent EmailMessage in a DRAFT state
    const message = this.emailMessageRepository.create({
      tenantId,
      createdByUserId: userId,
      templateId: template?.id,
      publicId: nanoid(),
      status: EmailMessageStatus.DRAFT,
      subject: template ? template.subjectTemplate : subject,
      html: '', // Placeholder, will be updated per recipient
      // CRM context links
      leadId: dto.leadId,
      contactId: dto.contactId,
      companyId: dto.companyId,
      dealId: dto.dealId,
    });
    
    // Add recipients
    message.recipients = [];
    dto.to.forEach(r => message.recipients.push({ ...r, type: EmailRecipientType.TO, trackingToken: nanoid() } as EmailRecipient));
    dto.cc?.forEach(r => message.recipients.push({ ...r, type: EmailRecipientType.CC, trackingToken: nanoid() } as EmailRecipient));
    dto.bcc?.forEach(r => message.recipients.push({ ...r, type: EmailRecipientType.BCC, trackingToken: nanoid() } as EmailRecipient));
    
    await this.emailMessageRepository.save(message);

    // 2. Compose and Send for each recipient
    for (const recipient of message.recipients) {
      const composedEmail = template
        ? this.composerService.composeFromTemplate(template, { ...dto.variables, recipient }, message.publicId, recipient.trackingToken)
        : this.composerService.composeFromRaw(subject, html || dto.mjml, message.publicId, recipient.trackingToken);

      // This is the first recipient, so we save the composed content to the parent message
      if (recipient.type === EmailRecipientType.TO && !message.html) {
        message.subject = composedEmail.subject;
        message.html = composedEmail.html;
        message.text = composedEmail.text;
        message.links = composedEmail.links as any;
      }
      
      try {
        const sendResult = await this.smtpSenderService.sendEmail({
          from: { name: 'Your CRM', address: 'no-reply@yourcrm.com' }, // This should be configured
          to: [recipient.email],
          subject: composedEmail.subject,
          html: composedEmail.html,
          text: composedEmail.text,
        });

        if (!message.providerMessageId) {
          message.providerMessageId = sendResult.messageId;
        }
        recipient.status = 'sent' as any;
      } catch (error) {
        recipient.status = 'failed' as any;
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }
    }
    
    // 3. Finalize the parent message state
    message.status = EmailMessageStatus.SENT;
    message.sentAt = new Date();
    await this.emailMessageRepository.save(message);

    // 4. Create a "SENT" event
    await this.emailEventRepository.save({
      emailMessageId: message.id,
      type: EmailEventType.SENT,
    });

    return this.findOne(tenantId, message.id);
  }

  async findOne(tenantId: string, id: string) {
    const message = await this.emailMessageRepository.findOne({
      where: { id, tenantId },
      relations: ['recipients', 'links', 'events', 'template'],
    });

    if (!message) {
      throw new NotFoundException('Email message not found.');
    }
    
    return message;
  }

  // ... other methods like findAll, resend, etc.
}