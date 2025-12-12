import { Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../../auth/decorators/public.decorator';
import { StripeWebhookService } from 'src/apis/billing/stripe/stripe-webhook.service';

@Public()
@Controller('webhooks/stripe')
export class StripeWebhooksController {
  constructor(private stripeWebhook: StripeWebhookService) {}

  @Post()
  async handle(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    const rawBody = (req as any).rawBody as Buffer;
    const event = this.stripeWebhook.verifyAndConstructEvent(rawBody, signature);
    await this.stripeWebhook.handleEvent(event);
    return { received: true };
  }
}