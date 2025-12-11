import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CustomField,
  CustomFieldValue,
  Lead,
  LeadSource,
  LeadStatus,
  LeadTag,
  Tag,
  Tenant,
  User,
} from 'src/common/entities';
import {
  Repository,
  In,
  Like,
  MoreThan,
  LessThan,
  Between,
  Not,
} from 'typeorm';
import {
  ConvertLeadDto,
  CreateCustomFieldDto,
  CreateLeadDto,
  CreatePipelineDto,
  CreateTagDto,
  QueryLeadsDto,
  UpdateCustomFieldDto,
  UpdateLeadDto,
  UpdateTagDto,
} from '../dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(LeadTag)
    private leadTagRepository: Repository<LeadTag>,
    @InjectRepository(CustomField)
    private customFieldRepository: Repository<CustomField>,
    @InjectRepository(CustomFieldValue)
    private customFieldValueRepository: Repository<CustomFieldValue>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  // ========== LEAD METHODS ==========

  /**
   * Create a new lead
   */
  async create(tenantId: string, createLeadDto: CreateLeadDto, userId: string) {
    // Check tenant exists and is active
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new ForbiddenException('Tenant is not active');
    }

    // Check lead limit
    if (tenant.currentLeads >= tenant.maxLeads) {
      throw new BadRequestException(
        `Lead limit reached. Your plan allows ${tenant.maxLeads} leads.`,
      );
    }

    // Create lead
    const lead = this.leadRepository.create({
      ...createLeadDto,
      tenantId,
    });

    // Set default status if not provided
    if (!lead.status) {
      lead.status = LeadStatus.NEW;
    }

    // Set default source if not provided
    if (!lead.source) {
      lead.source = LeadSource.WEBSITE;
    }

    // Handle tags
    if (createLeadDto.tags && createLeadDto.tags.length > 0) {
      await this.handleLeadTags(tenantId, lead, createLeadDto.tags);
    }

    // Handle custom fields
    if (createLeadDto.customFields) {
      await this.handleCustomFields(
        tenantId,
        lead,
        createLeadDto.customFields,
        'lead',
      );
    }

    const savedLead = await this.leadRepository.save(lead);

    // Update tenant lead count
    await this.tenantRepository.update(tenantId, {
      currentLeads: () => 'currentLeads + 1',
    });

    return this.findOne(tenantId, savedLead.id);
  }

  /**
   * Find all leads with filtering and pagination
   */
  async findAll(tenantId: string, query: QueryLeadsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      source,
      assignedToId,
      pipelineId,
      stageId,
      tags,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      minScore,
      maxScore,
      createdAfter,
      createdBefore,
    } = query;

    const queryBuilder = this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedTo', 'assignedTo')
      .leftJoinAndSelect('lead.contact', 'contact')
      .leftJoinAndSelect('lead.company', 'company')
      .leftJoinAndSelect('lead.leadTags', 'leadTags')
      .leftJoinAndSelect('leadTags.tag', 'tag')
      .leftJoinAndSelect('lead.customFieldValues', 'customFieldValues')
      .leftJoinAndSelect('customFieldValues.field', 'customField')
      .where('lead.tenantId = :tenantId', { tenantId });

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(lead.title ILIKE :search OR lead.description ILIKE :search OR lead.email ILIKE :search OR contact.name ILIKE :search OR company.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('lead.status = :status', { status });
    }

    // Filter by source
    if (source) {
      queryBuilder.andWhere('lead.source = :source', { source });
    }

    // Filter by assigned user
    if (assignedToId) {
      queryBuilder.andWhere('lead.assignedToId = :assignedToId', {
        assignedToId,
      });
    }

    // Filter by pipeline (would need to join through pipeline stages)
    if (pipelineId) {
      // This would require a more complex query joining through pipeline stages
      // For now, we'll skip this filter
    }

    // Filter by stage (would need to track lead stage in a separate table)
    if (stageId) {
      // This would require a lead_stages junction table
      // For now, we'll skip this filter
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      queryBuilder.andWhere('tag.name IN (:...tags)', { tags });
    }

    // Filter by priority
    if (priority) {
      queryBuilder.andWhere('lead.priority = :priority', { priority });
    }

    // Filter by score range
    if (minScore !== undefined || maxScore !== undefined) {
      if (minScore !== undefined && maxScore !== undefined) {
        queryBuilder.andWhere('lead.score BETWEEN :minScore AND :maxScore', {
          minScore,
          maxScore,
        });
      } else if (minScore !== undefined) {
        queryBuilder.andWhere('lead.score >= :minScore', { minScore });
      } else if (maxScore !== undefined) {
        queryBuilder.andWhere('lead.score <= :maxScore', { maxScore });
      }
    }

    // Filter by date range
    if (createdAfter || createdBefore) {
      if (createdAfter && createdBefore) {
        queryBuilder.andWhere(
          'lead.createdAt BETWEEN :createdAfter AND :createdBefore',
          {
            createdAfter,
            createdBefore,
          },
        );
      } else if (createdAfter) {
        queryBuilder.andWhere('lead.createdAt >= :createdAfter', {
          createdAfter,
        });
      } else if (createdBefore) {
        queryBuilder.andWhere('lead.createdAt <= :createdBefore', {
          createdBefore,
        });
      }
    }

    // Sorting
    const validSortFields = [
      'lead.createdAt',
      'lead.updatedAt',
      'lead.score',
      'lead.estimatedValue',
      'lead.nextActionDate',
    ];

    const sortField = validSortFields.includes(`lead.${sortBy}`)
      ? `lead.${sortBy}`
      : 'lead.createdAt';

    queryBuilder.orderBy(sortField, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [leads, total] = await queryBuilder.getManyAndCount();

    return {
      data: leads.map((lead) => this.formatLeadResponse(lead)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one lead by ID
   */
  async findOne(tenantId: string, id: string) {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
      relations: [
        'assignedTo',
        'contact',
        'company',
        'leadTags',
        'leadTags.tag',
        'customFieldValues',
        'customFieldValues.field',
      ],
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return this.formatLeadResponse(lead);
  }

  /**
   * Update lead
   */
  async update(tenantId: string, id: string, updateLeadDto: UpdateLeadDto) {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
      relations: ['leadTags', 'customFieldValues'],
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Handle tags
    if (updateLeadDto.tags !== undefined) {
      await this.handleLeadTags(tenantId, lead, updateLeadDto.tags);
    }

    // Handle custom fields
    if (updateLeadDto.customFields) {
      await this.handleCustomFields(
        tenantId,
        lead,
        updateLeadDto.customFields,
        'lead',
      );
    }

    // Update lead
    Object.assign(lead, updateLeadDto);
    delete lead.tags; // Remove tags from update (handled separately)
    delete lead.customFields; // Remove custom fields from update (handled separately)

    const updatedLead = await this.leadRepository.save(lead);

    return this.findOne(tenantId, updatedLead.id);
  }

  /**
   * Delete lead (soft delete)
   */
  async remove(tenantId: string, id: string) {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    await this.leadRepository.softDelete(id);

    // Update tenant lead count
    await this.tenantRepository.update(tenantId, {
      currentLeads: () => 'currentLeads - 1',
    });

    return { message: 'Lead deleted successfully' };
  }

  /**
   * Restore soft-deleted lead
   */
  async restore(tenantId: string, id: string) {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    await this.leadRepository.restore(id);

    // Update tenant lead count
    await this.tenantRepository.update(tenantId, {
      currentLeads: () => 'currentLeads + 1',
    });

    return this.findOne(tenantId, id);
  }

  /**
   * Convert lead to contact/deal
   */
  async convertLead(
    tenantId: string,
    id: string,
    convertLeadDto: ConvertLeadDto,
    userId: string,
  ) {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
      relations: ['contact', 'company'],
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.isConverted) {
      throw new BadRequestException('Lead is already converted');
    }

    // Update lead status
    lead.status = LeadStatus.CONVERTED;
    lead.convertedAt = new Date();
    lead.convertedById = userId;

    // If we had the ContactsModule and DealsModule, we would:
    // 1. Create/update contact if needed
    // 2. Create deal
    // 3. Link them together

    // For now, we'll just mark the lead as converted
    // and store the deal info in the lead's custom fields
    if (convertLeadDto.dealName) {
      lead.customFields = {
        ...lead.customFields,
        convertedDeal: {
          name: convertLeadDto.dealName,
          amount: convertLeadDto.dealAmount,
          currency: convertLeadDto.dealCurrency,
          closeDate: convertLeadDto.dealCloseDate,
        },
      };
    }

    await this.leadRepository.save(lead);

    return this.findOne(tenantId, id);
  }

  /**
   * Update lead status
   */
  async updateStatus(tenantId: string, id: string, status: LeadStatus) {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    lead.status = status;

    // If converting to lost, we might want to capture a reason
    if (status === LeadStatus.LOST && !lead.lostReason) {
      lead.lostReason = 'Status updated to lost';
    }

    await this.leadRepository.save(lead);

    return this.findOne(tenantId, id);
  }

  /**
   * Assign lead to user
   */
  async assignToUser(tenantId: string, id: string, userId: string) {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    lead.assignedToId = userId;
    await this.leadRepository.save(lead);

    return this.findOne(tenantId, id);
  }

  /**
   * Update lead score
   */
  async updateScore(tenantId: string, id: string, score: number) {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    lead.score = score;
    await this.leadRepository.save(lead);

    return this.findOne(tenantId, id);
  }

  /**
   * Get lead statistics
   */
  async getStats(tenantId: string) {
    const [total, statusStats, sourceStats, scoreStats] = await Promise.all([
      this.leadRepository.count({ where: { tenantId } }),
      this.getStatusStatistics(tenantId),
      this.getSourceStatistics(tenantId),
      this.getScoreStatistics(tenantId),
    ]);

    return {
      total,
      byStatus: statusStats,
      bySource: sourceStats,
      byScore: scoreStats,
    };
  }

  /**
   * Get lead activity timeline
   */
  async getActivityTimeline(tenantId: string, leadId: string) {
    // TODO: Implement activity timeline
    // This would query the activities table for all activities related to this lead
    return [];
  }

  // ========== TAG METHODS ==========

  /**
   * Create a new tag
   */
  async createTag(tenantId: string, createTagDto: CreateTagDto) {
    // Check if tag already exists
    const existingTag = await this.tagRepository.findOne({
      where: { name: createTagDto.name, tenantId },
    });

    if (existingTag) {
      throw new ConflictException('Tag with this name already exists');
    }

    const tag = this.tagRepository.create({
      ...createTagDto,
      tenantId,
    });

    const savedTag = await this.tagRepository.save(tag);

    return this.findTag(tenantId, savedTag.id);
  }

  /**
   * Find all tags
   */
  async findAllTags(tenantId: string) {
    const tags = await this.tagRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });

    return tags.map((tag) => this.formatTagResponse(tag));
  }

  /**
   * Find one tag by ID
   */
  async findTag(tenantId: string, id: string) {
    const tag = await this.tagRepository.findOne({
      where: { id, tenantId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return this.formatTagResponse(tag);
  }

  /**
   * Update tag
   */
  async updateTag(tenantId: string, id: string, updateTagDto: UpdateTagDto) {
    const tag = await this.tagRepository.findOne({
      where: { id, tenantId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Check if new name conflicts with existing tag
    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existingTag = await this.tagRepository.findOne({
        where: { name: updateTagDto.name, tenantId },
      });

      if (existingTag) {
        throw new ConflictException('Tag with this name already exists');
      }
    }

    Object.assign(tag, updateTagDto);
    const updatedTag = await this.tagRepository.save(tag);

    return this.findTag(tenantId, updatedTag.id);
  }

  /**
   * Delete tag
   */
  async removeTag(tenantId: string, id: string) {
    const tag = await this.tagRepository.findOne({
      where: { id, tenantId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Check if tag is used by any leads
    const leadTagCount = await this.leadTagRepository.count({
      where: { tagId: id },
    });

    if (leadTagCount > 0) {
      throw new BadRequestException(
        `Cannot delete tag that is used by ${leadTagCount} leads`,
      );
    }

    await this.tagRepository.delete(id);

    return { message: 'Tag deleted successfully' };
  }

  // ========== CUSTOM FIELD METHODS ==========

  /**
   * Create a new custom field
   */
  async createCustomField(
    tenantId: string,
    createCustomFieldDto: CreateCustomFieldDto,
  ) {
    // Check if field with this key already exists
    const existingField = await this.customFieldRepository.findOne({
      where: { key: createCustomFieldDto.key, tenantId },
    });

    if (existingField) {
      throw new ConflictException('Custom field with this key already exists');
    }

    const customField = this.customFieldRepository.create({
      ...createCustomFieldDto,
      tenantId,
    });

    const savedField = await this.customFieldRepository.save(customField);

    return this.findCustomField(tenantId, savedField.id);
  }

  /**
   * Find all custom fields
   */
  async findAllCustomFields(tenantId: string, entityType?: string) {
    const query: any = { tenantId };
    if (entityType) {
      query.entityType = entityType;
    }

    const fields = await this.customFieldRepository.find({
      where: query,
      order: { position: 'ASC' },
    });

    return fields.map((field) => this.formatCustomFieldResponse(field));
  }

  /**
   * Find one custom field by ID
   */
  async findCustomField(tenantId: string, id: string) {
    const field = await this.customFieldRepository.findOne({
      where: { id, tenantId },
    });

    if (!field) {
      throw new NotFoundException('Custom field not found');
    }

    return this.formatCustomFieldResponse(field);
  }

  /**
   * Update custom field
   */
  async updateCustomField(
    tenantId: string,
    id: string,
    updateCustomFieldDto: UpdateCustomFieldDto,
  ) {
    const field = await this.customFieldRepository.findOne({
      where: { id, tenantId },
    });

    if (!field) {
      throw new NotFoundException('Custom field not found');
    }

    // Check if new key conflicts with existing field
    if (updateCustomFieldDto.key && updateCustomFieldDto.key !== field.key) {
      const existingField = await this.customFieldRepository.findOne({
        where: { key: updateCustomFieldDto.key, tenantId },
      });

      if (existingField) {
        throw new ConflictException(
          'Custom field with this key already exists',
        );
      }
    }

    Object.assign(field, updateCustomFieldDto);
    const updatedField = await this.customFieldRepository.save(field);

    return this.findCustomField(tenantId, updatedField.id);
  }

  /**
   * Delete custom field
   */
  async removeCustomField(tenantId: string, id: string) {
    const field = await this.customFieldRepository.findOne({
      where: { id, tenantId },
    });

    if (!field) {
      throw new NotFoundException('Custom field not found');
    }

    // Check if field is used by any entities
    const valueCount = await this.customFieldValueRepository.count({
      where: { fieldId: id },
    });

    if (valueCount > 0) {
      throw new BadRequestException(
        `Cannot delete custom field that is used by ${valueCount} records`,
      );
    }

    await this.customFieldRepository.delete(id);

    return { message: 'Custom field deleted successfully' };
  }

  // ========== HELPER METHODS ==========

  /**
   * Handle lead tags
   */
  private async handleLeadTags(
    tenantId: string,
    lead: Lead,
    tagNames: string[],
  ) {
    if (!tagNames || tagNames.length === 0) {
      // If no tags provided, remove all existing tags
      await this.leadTagRepository.delete({ leadId: lead.id });
      return;
    }

    // Find existing tags and create new ones as needed
    const existingTags = await this.tagRepository.find({
      where: { name: In(tagNames), tenantId },
    });

    const existingTagNames = existingTags.map((t) => t.name);
    const newTagNames = tagNames.filter(
      (name) => !existingTagNames.includes(name),
    );

    // Create new tags
    const newTags = await Promise.all(
      newTagNames.map((name) =>
        this.tagRepository.save(
          this.tagRepository.create({
            name,
            tenantId,
            color: this.getRandomColor(),
          }),
        ),
      ),
    );

    const allTags = [...existingTags, ...newTags];

    // Remove existing lead tags
    await this.leadTagRepository.delete({ leadId: lead.id });

    // Create new lead tags
    const leadTags = allTags.map((tag) =>
      this.leadTagRepository.create({
        leadId: lead.id,
        tagId: tag.id,
      }),
    );

    await this.leadTagRepository.save(leadTags);
  }

  /**
   * Handle custom fields
   */
  private async handleCustomFields(
    tenantId: string,
    entity: any,
    customFields: Record<string, any>,
    entityType: string,
  ) {
    // Get all custom fields for this entity type
    const fields = await this.customFieldRepository.find({
      where: { tenantId, entityType },
    });

    // Delete existing custom field values for this entity
    await this.customFieldValueRepository.delete({
      [entityType + 'Id']: entity.id,
    });

    // Create new custom field values
    const fieldValues = [];
    for (const [key, value] of Object.entries(customFields)) {
      const field = fields.find((f) => f.key === key);
      if (field) {
        fieldValues.push(
          this.customFieldValueRepository.create({
            fieldId: field.id,
            [entityType + 'Id']: entity.id,
            value: typeof value === 'object' ? JSON.stringify(value) : value,
          }),
        );
      }
    }

    if (fieldValues.length > 0) {
      await this.customFieldValueRepository.save(fieldValues);
    }
  }

  /**
   * Get status statistics
   */
  private async getStatusStatistics(tenantId: string) {
    const statusCounts = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('lead.tenantId = :tenantId', { tenantId })
      .groupBy('lead.status')
      .getRawMany();

    const result: Record<string, number> = {};
    for (const status of Object.values(LeadStatus)) {
      result[status] = 0;
    }

    for (const item of statusCounts) {
      result[item.status] = parseInt(item.count, 10);
    }

    return result;
  }

  /**
   * Get source statistics
   */
  private async getSourceStatistics(tenantId: string) {
    const sourceCounts = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .where('lead.tenantId = :tenantId', { tenantId })
      .andWhere('lead.source IS NOT NULL')
      .groupBy('lead.source')
      .getRawMany();

    const result: Record<string, number> = {};
    for (const item of sourceCounts) {
      result[item.source] = parseInt(item.count, 10);
    }

    return result;
  }

  /**
   * Get score statistics
   */
  private async getScoreStatistics(tenantId: string) {
    const stats = await this.leadRepository
      .createQueryBuilder('lead')
      .select('MIN(lead.score)', 'min')
      .addSelect('MAX(lead.score)', 'max')
      .addSelect('AVG(lead.score)', 'avg')
      .where('lead.tenantId = :tenantId', { tenantId })
      .getRawOne();

    return {
      min: parseFloat(stats.min) || 0,
      max: parseFloat(stats.max) || 0,
      avg: parseFloat(stats.avg) || 0,
    };
  }

  /**
   * Format lead response
   */
  //   private formatLeadResponse(lead: Lead) {
  //     return {
  //       id: lead.id,
  //       title: lead.title,
  //       description: lead.description,
  //       status: lead.status,
  //       source: lead.source,
  //       sourceDetails: lead.sourceDetails,
  //       score: lead.score,
  //       priority: lead.priority,
  //       nextActionDate: lead.nextActionDate,
  //       nextAction: lead.nextAction,
  //       industry: lead.industry,
  //       estimatedValue: lead.estimatedValue,
  //       currency: lead.currency,
  //       address: lead.address,
  //       socialProfiles: lead.socialProfiles,
  //       email: lead.email,
  //       phone: lead.phone,
  //       firstContactDate: lead.firstContactDate,
  //       lastContactDate: lead.lastContactDate,
  //       convertedAt: lead.convertedAt,
  //       lostReason: lead.lostReason,
  //       fullAddress: lead.fullAddress,
  //       isConverted: lead.isConverted,
  //       isActive: lead.isActive,
  //       createdAt: lead.createdAt,
  //       updatedAt: lead.updatedAt,
  //       assignedTo: lead.assignedTo
  //         ? {
  //             id: lead.assignedTo.id,
  //             firstName: lead.assignedTo.firstName,
  //             lastName: lead.assignedTo.lastName,
  //             email: lead.assignedTo.email,
  //           }
  //         : null,
  //       contact: lead.contact
  //         ? {
  //             id: lead.contact.id,
  //             name: lead.contact.name,
  //             email: lead.contact.email,
  //             phone: lead.contact.phone,
  //           }
  //         : null,
  //       company: lead.company
  //         ? {
  //             id: lead.company.id,
  //             name: lead.company.name,
  //             domain: lead.company.domain,
  //           }
  //         : null,
  //       tags: lead.leadTags?.map((lt) => ({
  //         id: lt.tag.id,
  //         name: lt.tag.name,
  //         color: lt.tag.color,
  //       })),
  //       customFields: lead.customFieldValues?.reduce((acc, cfv) => {
  //         acc[cfv.field.key] = cfv.value;
  //         return acc;
  //       }, {}),
  //     };
  //   }

  // Update the formatLeadResponse method
  private formatLeadResponse(lead: Lead) {
    return {
      id: lead.id,
      title: lead.title,
      description: lead.description,
      status: lead.status,
      source: lead.source,
      sourceDetails: lead.sourceDetails,
      score: lead.score,
      priority: lead.priority,
      nextActionDate: lead.nextActionDate,
      nextAction: lead.nextAction,
      industry: lead.industry,
      estimatedValue: lead.estimatedValue,
      currency: lead.currency,
      address: lead.address,
      socialProfiles: lead.socialProfiles,
      email: lead.email,
      phone: lead.phone,
      firstContactDate: lead.firstContactDate,
      lastContactDate: lead.lastContactDate,
      convertedAt: lead.convertedAt,
      lostReason: lead.lostReason,
      fullAddress: lead.fullAddress,
      isConverted: lead.isConverted,
      isActive: lead.isActive,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      assignedTo: lead.assignedTo
        ? {
            id: lead.assignedTo.id,
            firstName: lead.assignedTo.firstName,
            lastName: lead.assignedTo.lastName,
            email: lead.assignedTo.email,
          }
        : null,
      contact: lead.contact
        ? {
            id: lead.contact.id,
            name: lead.contact.name,
            email: lead.contact.email,
            phone: lead.contact.phone,
          }
        : null,
      company: lead.company
        ? {
            id: lead.company.id,
            name: lead.company.name,
            domain: lead.company.domain,
          }
        : null,
      tags: lead.leadTags?.map((lt) => ({
        id: lt.tag.id,
        name: lt.tag.name,
        color: lt.tag.color,
      })),
      customFields: lead.customFieldValues?.reduce((acc, cfv) => {
        acc[cfv.field.key] = cfv.value;
        return acc;
      }, {}),
    };
  }

  /**
   * Format tag response
   */
  private formatTagResponse(tag: Tag) {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      usageCount: tag.usageCount,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  /**
   * Format custom field response
   */
  private formatCustomFieldResponse(field: CustomField) {
    return {
      id: field.id,
      name: field.name,
      key: field.key,
      description: field.description,
      type: field.type,
      options: field.options,
      isRequired: field.isRequired,
      isActive: field.isActive,
      position: field.position,
      entityType: field.entityType,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    };
  }

  /**
   * Generate random color for tags
   */
  private getRandomColor(): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFBE0B',
      '#FB5607',
      '#8338EC',
      '#3A86FF',
      '#FF006E',
      '#A5DD9B',
      '#F9C74F',
      '#90BE6D',
      '#43AA8B',
      '#577590',
      '#F94144',
      '#F3722C',
      '#F8961E',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
