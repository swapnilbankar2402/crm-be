import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTemplateDto, UpdateTemplateDto } from '../dto';
import { EmailTemplate } from 'src/common/entities';

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
  ) {}

  async create(tenantId: string, dto: CreateTemplateDto) {
    const existing = await this.templateRepository.findOne({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('A template with this slug already exists.');
    }
    const template = this.templateRepository.create({ ...dto, tenantId });
    return this.templateRepository.save(template);
  }

  async findAll(tenantId: string) {
    return this.templateRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.templateRepository.findOne({
      where: { id, tenantId },
    });
    if (!template) {
      throw new NotFoundException('Template not found.');
    }
    return template;
  }

  async findBySlug(tenantId: string, slug: string) {
    const template = await this.templateRepository.findOne({
      where: { slug, tenantId },
    });
    if (!template) {
      throw new NotFoundException('Template not found.');
    }
    return template;
  }

  async update(tenantId: string, id: string, dto: UpdateTemplateDto) {
    const template = await this.findOne(tenantId, id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async remove(tenantId: string, id: string) {
    const template = await this.findOne(tenantId, id);
    await this.templateRepository.softDelete(id);
    return { message: 'Template deleted successfully.' };
  }
}