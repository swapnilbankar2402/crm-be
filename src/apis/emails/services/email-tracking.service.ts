import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EmailTrackingService {
  private readonly trackingSecret: string;
  private readonly trackingBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.trackingSecret = this.configService.get<string>('EMAIL_TRACKING_SECRET');
    this.trackingBaseUrl = this.configService.get<string>('EMAIL_TRACKING_BASE_URL');

    if (!this.trackingSecret) {
      throw new Error('EMAIL_TRACKING_SECRET is not defined in the environment variables.');
    }
  }

  generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.trackingSecret)
      .update(payload)
      .digest('hex');
  }

  verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  }

  getSignedPixelUrl(messagePublicId: string, recipientToken: string): string {
    const payload = `${messagePublicId}:${recipientToken}`;
    const signature = this.generateSignature(payload);
    return `${this.trackingBaseUrl}/emails/t/o/${messagePublicId}/${recipientToken}.png?sig=${signature}`;
  }

  getSignedClickUrl(linkToken: string, recipientToken: string): string {
    const payload = `${linkToken}:${recipientToken}`;
    const signature = this.generateSignature(payload);
    return `${this.trackingBaseUrl}/emails/t/c/${linkToken}/${recipientToken}?sig=${signature}`;
  }
}