import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Seed } from './seed.interface';
import { EmailTemplate, EmailTemplateEngine } from '../../common/entities/email-template.entity';

@Injectable()
export class EmailTemplatesSeed implements Seed {
  name = 'email-templates';

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly repo: Repository<EmailTemplate>,
  ) {}

  async run(): Promise<void> {
    const templates: Array<Partial<EmailTemplate>> = [
      {
        tenantId: null,
        name: 'Notification (Generic)',
        slug: 'notification-generic',
        engine: EmailTemplateEngine.MJML,
        subjectTemplate: '{{title}}',
        mjmlTemplate:
          `<mjml><mj-body><mj-section><mj-column>` +
          `<mj-text font-size="18px"><strong>{{title}}</strong></mj-text>` +
          `<mj-text>{{message}}</mj-text>` +
          `{{#if actionUrl}}<mj-button href="{{actionUrl}}">Open</mj-button>{{/if}}` +
          `<mj-text font-size="12px" color="#999">Type: {{type}}</mj-text>` +
          `</mj-column></mj-section></mj-body></mjml>`,
        isActive: true,
      },
    ];

    for (const t of templates) {
      const existing = await this.repo.findOne({
        where: { tenantId: IsNull(), slug: t.slug as string },
        withDeleted: true,
      });

      if (existing) {
        await this.repo.update(existing.id, { ...t, deletedAt: null });
      } else {
        await this.repo.save(this.repo.create(t));
      }
    }
  }
}