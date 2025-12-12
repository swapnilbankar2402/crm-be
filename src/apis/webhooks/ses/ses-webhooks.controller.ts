import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../../auth/decorators/public.decorator';
import { SnsVerifierService } from '../sns/sns-verifier.service';
import { SesWebhookService } from './ses-webhook.service';

type SnsMessage = {
  Type: 'SubscriptionConfirmation' | 'Notification' | 'UnsubscribeConfirmation';
  MessageId: string;
  Message: string;
  SigningCertURL: string;
  Signature: string;
  SignatureVersion: string;
  Timestamp: string;
  TopicArn: string;
  SubscribeURL?: string;
  Subject?: string;
};

@Public()
@Controller('webhooks/ses')
export class SesWebhooksController {
  constructor(
    private snsVerifier: SnsVerifierService,
    private sesWebhook: SesWebhookService,
  ) {}

  @Post()
  async handle(@Body() body: SnsMessage) {
    // Verify SNS signature
    await this.snsVerifier.verify(body);

    // Confirm subscription
    if (body.Type === 'SubscriptionConfirmation' && body.SubscribeURL) {
      await this.snsVerifier.confirmSubscription(body.SubscribeURL);
      return { ok: true, confirmed: true };
    }

    if (body.Type === 'Notification') {
      const sesPayload = JSON.parse(body.Message);
      await this.sesWebhook.handleSnsNotification(body.MessageId, sesPayload);
      return { ok: true };
    }

    return { ok: true };
  }
}