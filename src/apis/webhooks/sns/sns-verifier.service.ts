import { Injectable, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

type SnsMessage = {
  Type: 'SubscriptionConfirmation' | 'Notification' | 'UnsubscribeConfirmation';
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  SubscribeURL?: string;
  Subject?: string;
};

@Injectable()
export class SnsVerifierService {
  constructor(private http: HttpService) {}

  // AWS recommends allowing only cert URLs from AWS domains
  private isAllowedCertUrl(url: string) {
    return /^https:\/\/sns\.[a-z0-9-]+\.amazonaws\.com\/.*\.pem$/i.test(url);
  }

  private buildStringToSign(msg: SnsMessage): string {
    // Follow AWS SNS docs: https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
    const fields: Array<[string, string | undefined]> =
      msg.Type === 'Notification'
        ? [
            ['Message', msg.Message],
            ['MessageId', msg.MessageId],
            ['Subject', msg.Subject],
            ['Timestamp', msg.Timestamp],
            ['TopicArn', msg.TopicArn],
            ['Type', msg.Type],
          ]
        : [
            ['Message', msg.Message],
            ['MessageId', msg.MessageId],
            ['SubscribeURL', msg.SubscribeURL],
            ['Timestamp', msg.Timestamp],
            ['Token', (msg as any).Token],
            ['TopicArn', msg.TopicArn],
            ['Type', msg.Type],
          ];

    // Subject is optional, only include if present
    return fields
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}\n${v}\n`)
      .join('');
  }

  async verify(msg: SnsMessage): Promise<void> {
    if (!this.isAllowedCertUrl(msg.SigningCertURL)) {
      throw new ForbiddenException('Invalid SNS SigningCertURL');
    }

    const pem = await firstValueFrom(this.http.get(msg.SigningCertURL, { responseType: 'text' }));
    const cert = pem.data;

    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(this.buildStringToSign(msg), 'utf8');
    verifier.end();

    const ok = verifier.verify(cert, msg.Signature, 'base64');
    if (!ok) throw new ForbiddenException('SNS signature verification failed');
  }

  async confirmSubscription(subscribeUrl: string) {
    // SNS requires you to call SubscribeURL
    await firstValueFrom(this.http.get(subscribeUrl));
  }
}