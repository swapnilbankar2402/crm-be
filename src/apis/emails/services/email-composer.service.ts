import { Injectable } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as mjml2html from 'mjml';
import * as cheerio from 'cheerio';
import { htmlToText } from 'html-to-text';
import { customAlphabet } from 'nanoid';
import { EmailTrackingService } from './email-tracking.service';
import { EmailTemplate } from 'src/common/entities';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 24);

export interface ComposedEmail {
  subject: string;
  html: string;
  text: string;
  links: { token: string; originalUrl: string }[];
}

@Injectable()
export class EmailComposerService {
  constructor(private emailTrackingService: EmailTrackingService) {}

  composeFromTemplate(
    template: EmailTemplate,
    variables: Record<string, any>,
    messagePublicId: string,
    recipientToken: string,
  ): ComposedEmail {
    // 1. Render Subject
    const subjectTemplate = handlebars.compile(template.subjectTemplate);
    const subject = subjectTemplate(variables);

    // 2. Render MJML template to get HTML
    const mjmlTemplate = handlebars.compile(template.mjmlTemplate);
    const renderedMjml = mjmlTemplate(variables);
    const { html: rawHtml, errors } = mjml2html(renderedMjml);

    if (errors.length > 0) {
      console.warn('MJML compilation errors:', errors);
    }

    // 3. Process HTML: rewrite links and inject pixel
    return this.processHtml(rawHtml, messagePublicId, recipientToken, subject);
  }

  composeFromRaw(
    subject: string,
    htmlContent: string,
    messagePublicId: string,
    recipientToken: string,
  ): ComposedEmail {
    return this.processHtml(htmlContent, messagePublicId, recipientToken, subject);
  }

  private processHtml(
    rawHtml: string,
    messagePublicId: string,
    recipientToken: string,
    subject: string,
  ): ComposedEmail {
    const $ = cheerio.load(rawHtml);
    const linksToTrack: { token: string; originalUrl: string }[] = [];

    // 1. Rewrite all links
    $('a').each((i, elem) => {
      const originalUrl = $(elem).attr('href');
      if (originalUrl && originalUrl.startsWith('http')) {
        const linkToken = nanoid();
        linksToTrack.push({ token: linkToken, originalUrl });
        const trackingUrl = this.emailTrackingService.getSignedClickUrl(linkToken, recipientToken);
        $(elem).attr('href', trackingUrl);
      }
    });

    // 2. Inject tracking pixel
    const pixelUrl = this.emailTrackingService.getSignedPixelUrl(messagePublicId, recipientToken);
    $('body').append(`<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;"/>`);

    const finalHtml = $.html();

    // 3. Generate plain text version
    const text = htmlToText(finalHtml, {
      wordwrap: 130,
    });

    return {
      subject,
      html: finalHtml,
      text,
      links: linksToTrack,
    };
  }
}