import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export interface EmailPayload {
  from: { name: string; address: string };
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  provider: 'smtp';
  messageId: string;
  response: any;
}

@Injectable()
export class SmtpSenderService implements OnModuleInit {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<boolean>('SMTP_SECURE');
    this.defaultFrom = `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM_EMAIL')}>`;

    if (!host || !port || !user || !pass) {
      console.warn('SMTP configuration is incomplete. Email sending will be disabled.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(payload: EmailPayload): Promise<SendResult> {
    if (!this.transporter) {
      throw new Error('SMTP transporter is not configured.');
    }

    const mailOptions: Mail.Options = {
      from: `"${payload.from.name}" <${payload.from.address}>` || this.defaultFrom,
      to: payload.to.join(', '),
      cc: payload.cc?.join(', '),
      bcc: payload.bcc?.join(', '),
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        provider: 'smtp',
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error('SMTP sending error:', error);
      throw error;
    }
  }
}