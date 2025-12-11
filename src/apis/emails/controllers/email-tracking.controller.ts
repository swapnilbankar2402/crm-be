import { Controller, Get, Param, Query, Res, Ip, Req, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTrackingService } from '../services/email-tracking.service';
import { EmailEvent, EmailEventType, EmailLink, EmailMessage, EmailRecipient } from 'src/common/entities';
import { Public } from 'src/auth/decorators';
import { SkipCache } from 'src/cache/cache.decorators';

@SkipCache()
@ApiTags('Email Tracking')
@Controller('emails/t')
export class EmailTrackingController {
  constructor(
    private emailTrackingService: EmailTrackingService,
    @InjectRepository(EmailMessage)
    private emailMessageRepository: Repository<EmailMessage>,
    @InjectRepository(EmailRecipient)
    private emailRecipientRepository: Repository<EmailRecipient>,
    @InjectRepository(EmailLink)
    private emailLinkRepository: Repository<EmailLink>,
    @InjectRepository(EmailEvent)
    private emailEventRepository: Repository<EmailEvent>,
  ) {}

  @Public()
  @Get('o/:messagePublicId/:recipientToken.png')
  @ApiOperation({ summary: 'Track email open (pixel)' })
  @ApiParam({ name: 'messagePublicId', description: 'Public ID of the email message' })
  @ApiParam({ name: 'recipientToken', description: 'Unique token for the recipient' })
  @ApiQuery({ name: 'sig', description: 'HMAC signature' })
  async trackOpen(
    @Param('messagePublicId') messagePublicId: string,
    @Param('recipientToken') recipientToken: string,
    @Query('sig') signature: string,
    @Res() res: Response,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    
    // Always send pixel, even if tracking fails, to not reveal info
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    );
    res.send(pixel);

    try {
      // 1. Verify signature
      const payload = `${messagePublicId}:${recipientToken}`;
      if (!this.emailTrackingService.verifySignature(payload, signature)) {
        console.warn('Invalid signature for open tracking');
        return;
      }

      // 2. Find the recipient
      const recipient = await this.emailRecipientRepository.findOne({
        where: { trackingToken: recipientToken },
        relations: ['emailMessage'],
      });

      if (!recipient || recipient.emailMessage.publicId !== messagePublicId) {
        console.warn('Recipient or message not found for open tracking');
        return;
      }

      // 3. Record the open event
      const now = new Date();
      recipient.openCount += 1;
      recipient.lastOpenedAt = now;
      if (!recipient.firstOpenedAt) {
        recipient.firstOpenedAt = now;
      }

      await this.emailRecipientRepository.save(recipient);

      // 4. Create an event log
      const event = this.emailEventRepository.create({
        emailMessageId: recipient.emailMessageId,
        recipientId: recipient.id,
        type: EmailEventType.OPEN,
        ip,
        userAgent: req.headers['user-agent'],
      });
      await this.emailEventRepository.save(event);

    } catch (error) {
      console.error('Error in open tracking:', error);
    }
  }

  @Public()
  @Get('c/:linkToken/:recipientToken')
  @ApiOperation({ summary: 'Track link click and redirect' })
  @ApiParam({ name: 'linkToken', description: 'Unique token for the link' })
  @ApiParam({ name: 'recipientToken', description: 'Unique token for the recipient' })
  @ApiQuery({ name: 'sig', description: 'HMAC signature' })
  async trackClick(
    @Param('linkToken') linkToken: string,
    @Param('recipientToken') recipientToken: string,
    @Query('sig') signature: string,
    @Res() res: Response,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    try {
      // 1. Verify signature
      const payload = `${linkToken}:${recipientToken}`;
      if (!this.emailTrackingService.verifySignature(payload, signature)) {
        console.warn('Invalid signature for click tracking');
        // Redirect to a safe fallback URL if signature is invalid
        res.redirect('https://example.com/invalid-link');
        return;
      }

      // 2. Find the link and recipient
      const link = await this.emailLinkRepository.findOne({
        where: { token: linkToken },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      const recipient = await this.emailRecipientRepository.findOne({
        where: { trackingToken: recipientToken, emailMessageId: link.emailMessageId },
      });
      
      if (!recipient) {
        throw new NotFoundException('Recipient not found');
      }

      // 3. Record the click event
      const now = new Date();

      // Update link stats
      link.clickCount += 1;
      link.lastClickedAt = now;
      if (!link.firstClickedAt) {
        link.firstClickedAt = now;
      }

      // Update recipient stats
      recipient.clickCount += 1;
      recipient.lastClickedAt = now;
      if (!recipient.firstClickedAt) {
        recipient.firstClickedAt = now;
      }
      
      await Promise.all([
        this.emailLinkRepository.save(link),
        this.emailRecipientRepository.save(recipient),
      ]);
      
      // 4. Create an event log
      const event = this.emailEventRepository.create({
        emailMessageId: link.emailMessageId,
        recipientId: recipient.id,
        linkId: link.id,
        type: EmailEventType.CLICK,
        ip,
        userAgent: req.headers['user-agent'],
        metadata: { originalUrl: link.originalUrl },
      });
      await this.emailEventRepository.save(event);

      // 5. Redirect to the original URL
      res.redirect(302, link.originalUrl);

    } catch (error) {
      console.error('Error in click tracking:', error);
      // Redirect to a safe fallback URL on error
      res.redirect('https://example.com/link-error');
    }
  }
}