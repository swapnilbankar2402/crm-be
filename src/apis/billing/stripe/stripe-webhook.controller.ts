import { Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../../auth/decorators/public.decorator';
import { StripeWebhookService } from './stripe-webhook.service';

@Public()
@Controller('billing/webhook')
export class StripeWebhookController {
  constructor(private webhook: StripeWebhookService) {}

  @Post('stripe')
  async handleStripe(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    // raw body required
    const rawBody = (req as any).rawBody as Buffer;
    const event = this.webhook.verifyAndConstructEvent(rawBody, signature);
    await this.webhook.handleEvent(event);
    return { received: true };
  }
}