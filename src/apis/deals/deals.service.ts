import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreateDealDto,
  UpdateDealDto,
  MoveDealStageDto,
  CloseDealDto,
  QueryDealsDto,
} from './dto';
import {
  Company,
  Contact,
  CustomField,
  CustomFieldValue,
  Deal,
  DealStatus,
  Lead,
  Pipeline,
  PipelineStage,
  Tenant,
  User,
} from 'src/common/entities';
import { AppEvents, AuditEvent } from 'src/common/events/app-events';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private dealRepository: Repository<Deal>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Pipeline)
    private pipelineRepository: Repository<Pipeline>,
    @InjectRepository(PipelineStage)
    private pipelineStageRepository: Repository<PipelineStage>,
    @InjectRepository(CustomField)
    private customFieldRepository: Repository<CustomField>,
    @InjectRepository(CustomFieldValue)
    private customFieldValueRepository: Repository<CustomFieldValue>,

    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new deal
   */
  async create(tenantId: string, dto: CreateDealDto, userId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new BadRequestException('Tenant is not active');
    }

    // Validate owner
    const ownerId = dto.ownerId || userId;
    const owner = await this.userRepository.findOne({
      where: { id: ownerId, tenantId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Validate contact if provided
    if (dto.contactId) {
      const contact = await this.contactRepository.findOne({
        where: { id: dto.contactId, tenantId },
      });
      if (!contact) throw new NotFoundException('Contact not found');
    }

    // Validate company if provided
    if (dto.companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: dto.companyId, tenantId },
      });
      if (!company) throw new NotFoundException('Company not found');
    }

    // Validate lead if provided
    if (dto.leadId) {
      const lead = await this.leadRepository.findOne({
        where: { id: dto.leadId, tenantId },
      });
      if (!lead) throw new NotFoundException('Lead not found');
    }

    // Validate pipeline and stage
    let pipelineId = dto.pipelineId;
    let stageId = dto.stageId;

    if (!pipelineId) {
      // Get default pipeline
      const defaultPipeline = await this.pipelineRepository.findOne({
        where: { tenantId, isDefault: true },
        relations: ['stages'],
      });

      if (defaultPipeline) {
        pipelineId = defaultPipeline.id;
        if (!stageId && defaultPipeline.stages?.length > 0) {
          stageId = defaultPipeline.stages[0].id;
        }
      }
    }

    if (pipelineId) {
      const pipeline = await this.pipelineRepository.findOne({
        where: { id: pipelineId, tenantId },
      });
      if (!pipeline) throw new NotFoundException('Pipeline not found');
    }

    if (stageId) {
      const stage = await this.pipelineStageRepository.findOne({
        where: { id: stageId, pipelineId },
      });
      if (!stage) throw new NotFoundException('Stage not found');
    }

    const deal = this.dealRepository.create({
      tenantId,
      name: dto.name,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency || 'USD',
      ownerId,
      contactId: dto.contactId,
      companyId: dto.companyId,
      leadId: dto.leadId,
      pipelineId,
      stageId,
      probability: dto.probability,
      status: dto.status || DealStatus.OPEN,
      priority: dto.priority,
      expectedCloseDate: dto.expectedCloseDate
        ? new Date(dto.expectedCloseDate)
        : null,
      source: dto.source,
      tags: dto.tags || [],
      products: dto.products || [],
      customFields: dto.customFields || null,
    });

    const saved = await this.dealRepository.save(deal);

    // --- EMIT AUDIT EVENT ---
    const auditEvent = new AuditEvent();
    auditEvent.tenantId = tenantId;
    auditEvent.userId = userId;
    auditEvent.action = 'deal.create';
    auditEvent.entityType = 'Deal';
    auditEvent.entityId = saved.id;
    auditEvent.details = { name: saved.name, amount: saved.amount };
    this.eventEmitter.emit(AppEvents.AUDIT_LOG_EVENT, auditEvent);
    // --- END AUDIT ---

    // Handle custom fields
    if (dto.customFields) {
      await this.handleCustomFields(
        tenantId,
        saved.id,
        dto.customFields,
        'deal',
      );
    }

    return this.findOne(tenantId, saved.id);
  }

  /**
   * Find all deals with filtering and pagination
   */
  async findAll(tenantId: string, query: QueryDealsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      ownerId,
      pipelineId,
      stageId,
      contactId,
      companyId,
      tag,
      minAmount,
      maxAmount,
      closingAfter,
      closingBefore,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.dealRepository
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.owner', 'owner')
      .leftJoinAndSelect('deal.contact', 'contact')
      .leftJoinAndSelect('deal.company', 'company')
      .leftJoinAndSelect('deal.pipeline', 'pipeline')
      .leftJoinAndSelect('deal.stage', 'stage')
      .where('deal.tenantId = :tenantId', { tenantId });

    // Search
    if (search) {
      qb.andWhere(
        '(deal.name ILIKE :search OR deal.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filters
    if (status) {
      qb.andWhere('deal.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('deal.priority = :priority', { priority });
    }

    if (ownerId) {
      qb.andWhere('deal.ownerId = :ownerId', { ownerId });
    }

    if (pipelineId) {
      qb.andWhere('deal.pipelineId = :pipelineId', { pipelineId });
    }

    if (stageId) {
      qb.andWhere('deal.stageId = :stageId', { stageId });
    }

    if (contactId) {
      qb.andWhere('deal.contactId = :contactId', { contactId });
    }

    if (companyId) {
      qb.andWhere('deal.companyId = :companyId', { companyId });
    }

    if (tag) {
      qb.andWhere(':tag = ANY(deal.tags)', { tag });
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      if (minAmount !== undefined && maxAmount !== undefined) {
        qb.andWhere('deal.amount BETWEEN :minAmount AND :maxAmount', {
          minAmount,
          maxAmount,
        });
      } else if (minAmount !== undefined) {
        qb.andWhere('deal.amount >= :minAmount', { minAmount });
      } else if (maxAmount !== undefined) {
        qb.andWhere('deal.amount <= :maxAmount', { maxAmount });
      }
    }

    if (closingAfter || closingBefore) {
      if (closingAfter && closingBefore) {
        qb.andWhere(
          'deal.expectedCloseDate BETWEEN :closingAfter AND :closingBefore',
          { closingAfter, closingBefore },
        );
      } else if (closingAfter) {
        qb.andWhere('deal.expectedCloseDate >= :closingAfter', {
          closingAfter,
        });
      } else if (closingBefore) {
        qb.andWhere('deal.expectedCloseDate <= :closingBefore', {
          closingBefore,
        });
      }
    }

    // Sorting
    const validSortFields = [
      'createdAt',
      'amount',
      'expectedCloseDate',
      'probability',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`deal.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [deals, total] = await qb.getManyAndCount();

    return {
      data: deals.map((d) => this.formatDealResponse(d)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one deal by ID
   */
  async findOne(tenantId: string, id: string) {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId },
      relations: [
        'owner',
        'contact',
        'company',
        'lead',
        'pipeline',
        'stage',
        'customFieldValues',
        'customFieldValues.field',
      ],
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return this.formatDealResponse(deal);
  }

  /**
   * Update deal
   */
  async update(tenantId: string, id: string, dto: UpdateDealDto) {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId },
      relations: ['customFieldValues'],
    });

    const oldDeal = { ...deal }; // Create a snapshot before changes

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // Validate owner if being changed
    if (dto.ownerId) {
      const owner = await this.userRepository.findOne({
        where: { id: dto.ownerId, tenantId },
      });
      if (!owner) throw new NotFoundException('Owner not found');
    }

    // Validate contact if being changed
    if (dto.contactId) {
      const contact = await this.contactRepository.findOne({
        where: { id: dto.contactId, tenantId },
      });
      if (!contact) throw new NotFoundException('Contact not found');
    }

    // Validate company if being changed
    if (dto.companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: dto.companyId, tenantId },
      });
      if (!company) throw new NotFoundException('Company not found');
    }

    // Validate pipeline and stage if being changed
    if (dto.pipelineId) {
      const pipeline = await this.pipelineRepository.findOne({
        where: { id: dto.pipelineId, tenantId },
      });
      if (!pipeline) throw new NotFoundException('Pipeline not found');
    }

    if (dto.stageId) {
      const stage = await this.pipelineStageRepository.findOne({
        where: {
          id: dto.stageId,
          pipelineId: dto.pipelineId || deal.pipelineId,
        },
      });
      if (!stage) throw new NotFoundException('Stage not found');
    }

    // Handle tags
    if (dto.tags !== undefined) {
      deal.tags = dto.tags;
    }

    // Handle products
    if (dto.products !== undefined) {
      deal.products = dto.products;
    }

    // Handle custom fields
    if (dto.customFields) {
      await this.handleCustomFields(
        tenantId,
        deal.id,
        dto.customFields,
        'deal',
      );
      deal.customFields = dto.customFields;
    }

    // Update other fields
    Object.assign(deal, {
      name: dto.name ?? deal.name,
      description: dto.description ?? deal.description,
      amount: dto.amount ?? deal.amount,
      currency: dto.currency ?? deal.currency,
      ownerId: dto.ownerId ?? deal.ownerId,
      contactId: dto.contactId ?? deal.contactId,
      companyId: dto.companyId ?? deal.companyId,
      leadId: dto.leadId ?? deal.leadId,
      pipelineId: dto.pipelineId ?? deal.pipelineId,
      stageId: dto.stageId ?? deal.stageId,
      probability: dto.probability ?? deal.probability,
      status: dto.status ?? deal.status,
      priority: dto.priority ?? deal.priority,
      expectedCloseDate: dto.expectedCloseDate
        ? new Date(dto.expectedCloseDate)
        : deal.expectedCloseDate,
      source: dto.source ?? deal.source,
    });

    const updated = await this.dealRepository.save(deal);

    // --- EMIT AUDIT EVENT WITH CHANGES ---
    const changes = this.getChanges(oldDeal, updated, [
      'name',
      'amount',
      'status',
      'stageId',
      'ownerId',
    ]);

    if (changes.length > 0) {
      const auditEvent = new AuditEvent();
      auditEvent.tenantId = tenantId;
      auditEvent.userId = 'user-id-from-request'; // You'll need to pass the user ID here
      auditEvent.action = 'deal.update';
      auditEvent.entityType = 'Deal';
      auditEvent.entityId = updated.id;
      auditEvent.changes = changes;
      this.eventEmitter.emit(AppEvents.AUDIT_LOG_EVENT, auditEvent);
    }
    // --- END AUDIT ---

    return this.findOne(tenantId, updated.id);
  }

  /**
   * Move deal to different stage
   */
  async moveToStage(tenantId: string, id: string, dto: MoveDealStageDto) {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId },
      relations: ['stage'],
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const newStage = await this.pipelineStageRepository.findOne({
      where: { id: dto.stageId },
    });

    if (!newStage) {
      throw new NotFoundException('Stage not found');
    }

    // Update deal stage and probability
    deal.stageId = dto.stageId;
    deal.probability = newStage.probability;
    deal.daysInStage = 0; // Reset days in stage counter

    await this.dealRepository.save(deal);

    // TODO: Create activity log for stage change
    // await this.activityService.create({
    //   type: 'stage_change',
    //   dealId: deal.id,
    //   description: `Moved from ${deal.stage.name} to ${newStage.name}`,
    //   reason: dto.reason,
    // });

    return this.findOne(tenantId, id);
  }

  /**
   * Close deal (won, lost, or abandoned)
   */
  async closeDeal(tenantId: string, id: string, dto: CloseDealDto) {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.isClosed) {
      throw new BadRequestException('Deal is already closed');
    }

    deal.status = dto.status;
    deal.actualCloseDate = dto.closeDate ? new Date(dto.closeDate) : new Date();

    if (dto.status === DealStatus.LOST && dto.reason) {
      deal.lostReason = dto.reason;
    }

    // Set probability based on outcome
    if (dto.status === DealStatus.WON) {
      deal.probability = 100;
    } else {
      deal.probability = 0;
    }

    await this.dealRepository.save(deal);

    // TODO: Create activity log for deal closure
    // TODO: If won, trigger customer onboarding workflow

    return this.findOne(tenantId, id);
  }

  /**
   * Soft delete deal
   */
  async remove(tenantId: string, id: string) {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    await this.dealRepository.softDelete(id);

    return { message: 'Deal deleted successfully' };
  }

  /**
   * Restore soft-deleted deal
   */
  async restore(tenantId: string, id: string) {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    await this.dealRepository.restore(id);

    return this.findOne(tenantId, id);
  }

  /**
   * Get deal statistics
   */
  async getStats(tenantId: string) {
    const total = await this.dealRepository.count({ where: { tenantId } });
    const open = await this.dealRepository.count({
      where: { tenantId, status: DealStatus.OPEN },
    });
    const won = await this.dealRepository.count({
      where: { tenantId, status: DealStatus.WON },
    });
    const lost = await this.dealRepository.count({
      where: { tenantId, status: DealStatus.LOST },
    });

    // Total value and weighted value
    const valueStats = await this.dealRepository
      .createQueryBuilder('deal')
      .select('SUM(deal.amount)', 'totalValue')
      .addSelect('SUM(deal.amount * deal.probability / 100)', 'weightedValue')
      .where('deal.tenantId = :tenantId', { tenantId })
      .andWhere('deal.status = :status', { status: DealStatus.OPEN })
      .getRawOne();

    // Win rate
    const closedDeals = won + lost;
    const winRate = closedDeals > 0 ? (won / closedDeals) * 100 : 0;

    // By stage
    const stageStats = await this.dealRepository
      .createQueryBuilder('deal')
      .leftJoin('deal.stage', 'stage')
      .select('stage.name', 'stageName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(deal.amount)', 'value')
      .where('deal.tenantId = :tenantId', { tenantId })
      .andWhere('deal.status = :status', { status: DealStatus.OPEN })
      .groupBy('stage.name')
      .getRawMany();

    return {
      total,
      open,
      won,
      lost,
      winRate: parseFloat(winRate.toFixed(2)),
      totalValue: parseFloat(valueStats.totalValue || 0),
      weightedValue: parseFloat(valueStats.weightedValue || 0),
      byStage: stageStats.map((s) => ({
        stage: s.stageName,
        count: parseInt(s.count, 10),
        value: parseFloat(s.value || 0),
      })),
    };
  }

  /**
   * Get pipeline forecast
   */
  async getForecast(tenantId: string, pipelineId?: string) {
    const qb = this.dealRepository
      .createQueryBuilder('deal')
      .leftJoin('deal.stage', 'stage')
      .where('deal.tenantId = :tenantId', { tenantId })
      .andWhere('deal.status = :status', { status: DealStatus.OPEN });

    if (pipelineId) {
      qb.andWhere('deal.pipelineId = :pipelineId', { pipelineId });
    }

    const deals = await qb.getMany();

    const forecast = {
      totalDeals: deals.length,
      totalValue: 0,
      weightedValue: 0,
      byProbability: {
        low: { count: 0, value: 0 }, // 0-30%
        medium: { count: 0, value: 0 }, // 31-60%
        high: { count: 0, value: 0 }, // 61-90%
        veryHigh: { count: 0, value: 0 }, // 91-100%
      },
    };

    deals.forEach((deal) => {
      const amount = parseFloat(deal.amount.toString());
      forecast.totalValue += amount;
      forecast.weightedValue += deal.weightedValue;

      if (deal.probability <= 30) {
        forecast.byProbability.low.count++;
        forecast.byProbability.low.value += amount;
      } else if (deal.probability <= 60) {
        forecast.byProbability.medium.count++;
        forecast.byProbability.medium.value += amount;
      } else if (deal.probability <= 90) {
        forecast.byProbability.high.count++;
        forecast.byProbability.high.value += amount;
      } else {
        forecast.byProbability.veryHigh.count++;
        forecast.byProbability.veryHigh.value += amount;
      }
    });

    return forecast;
  }

  // ========== HELPER METHODS ==========

  private async handleCustomFields(
    tenantId: string,
    dealId: string,
    customFields: Record<string, any>,
    entityType: string,
  ) {
    const fields = await this.customFieldRepository.find({
      where: { tenantId, entityType },
    });

    // Delete existing custom field values
    await this.customFieldValueRepository.delete({ dealId });

    const valuesToSave: CustomFieldValue[] = [];

    for (const [key, value] of Object.entries(customFields)) {
      const field = fields.find((f) => f.key === key);
      if (!field) continue;

      const cfv = this.customFieldValueRepository.create({
        fieldId: field.id,
        dealId,
        value:
          typeof value === 'object' ? JSON.stringify(value) : String(value),
      });

      valuesToSave.push(cfv);
    }

    if (valuesToSave.length > 0) {
      await this.customFieldValueRepository.save(valuesToSave);
    }
  }

  private formatDealResponse(deal: Deal) {
    return {
      id: deal.id,
      tenantId: deal.tenantId,
      name: deal.name,
      description: deal.description,
      status: deal.status,
      priority: deal.priority,
      amount: deal.amount,
      currency: deal.currency,
      probability: deal.probability,
      weightedValue: deal.weightedValue,
      expectedCloseDate: deal.expectedCloseDate,
      actualCloseDate: deal.actualCloseDate,
      lostReason: deal.lostReason,
      source: deal.source,
      tags: deal.tags || [],
      products: deal.products || [],
      productsTotal: deal.productsTotal,
      daysInStage: deal.daysInStage,
      totalDaysInPipeline: deal.totalDaysInPipeline,
      isOpen: deal.isOpen,
      isWon: deal.isWon,
      isLost: deal.isLost,
      isClosed: deal.isClosed,
      owner: deal.owner
        ? {
            id: deal.owner.id,
            firstName: deal.owner.firstName,
            lastName: deal.owner.lastName,
            email: deal.owner.email,
          }
        : null,
      contact: deal.contact
        ? {
            id: deal.contact.id,
            firstName: deal.contact.firstName,
            lastName: deal.contact.lastName,
            email: deal.contact.email,
          }
        : null,
      company: deal.company
        ? {
            id: deal.company.id,
            name: deal.company.name,
            domain: deal.company.domain,
          }
        : null,
      lead: deal.lead
        ? {
            id: deal.lead.id,
            title: deal.lead.title,
            status: deal.lead.status,
          }
        : null,
      pipeline: deal.pipeline
        ? {
            id: deal.pipeline.id,
            name: deal.pipeline.name,
          }
        : null,
      stage: deal.stage
        ? {
            id: deal.stage.id,
            name: deal.stage.name,
            color: deal.stage.color,
            probability: deal.stage.probability,
          }
        : null,
      customFields: deal.customFieldValues
        ? deal.customFieldValues.reduce(
            (acc, cfv) => {
              acc[cfv.field.key] = cfv.value;
              return acc;
            },
            {} as Record<string, any>,
          )
        : deal.customFields || {},
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  }

  private getChanges(
    oldEntity: any,
    newEntity: any,
    fieldsToTrack: string[],
  ): any[] {
    const changes = [];
    for (const field of fieldsToTrack) {
      if (oldEntity[field] !== newEntity[field]) {
        changes.push({
          field,
          oldValue: oldEntity[field],
          newValue: newEntity[field],
        });
      }
    }
    return changes;
  }
}
