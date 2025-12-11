// src/activities/activities.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateActivityDto,
  UpdateActivityDto,
  CompleteActivityDto,
  QueryActivitiesDto,
} from './dto';
import {
  Activity,
  ActivityStatus,
  Company,
  Contact,
  Deal,
  Lead,
  Tenant,
  User,
} from 'src/common/entities';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Deal)
    private dealRepository: Repository<Deal>,
  ) {}

  /**
   * Create a new activity
   */
  async create(tenantId: string, dto: CreateActivityDto, userId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new BadRequestException('Tenant is not active');
    }

    // Validate assignedTo user if provided
    if (dto.assignedToId) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: dto.assignedToId, tenantId },
      });
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    // Validate related entities
    if (dto.leadId) {
      const lead = await this.leadRepository.findOne({
        where: { id: dto.leadId, tenantId },
      });
      if (!lead) throw new NotFoundException('Lead not found');
    }

    if (dto.contactId) {
      const contact = await this.contactRepository.findOne({
        where: { id: dto.contactId, tenantId },
      });
      if (!contact) throw new NotFoundException('Contact not found');
    }

    if (dto.companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: dto.companyId, tenantId },
      });
      if (!company) throw new NotFoundException('Company not found');
    }

    if (dto.dealId) {
      const deal = await this.dealRepository.findOne({
        where: { id: dto.dealId, tenantId },
      });
      if (!deal) throw new NotFoundException('Deal not found');
    }

    const activity = this.activityRepository.create({
      tenantId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      status: dto.status || ActivityStatus.SCHEDULED,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      duration: dto.duration,
      userId,
      assignedToId: dto.assignedToId || userId,
      leadId: dto.leadId,
      contactId: dto.contactId,
      companyId: dto.companyId,
      dealId: dto.dealId,
      location: dto.location,
      attendees: dto.attendees || [],
      isPrivate: dto.isPrivate || false,
      isAllDay: dto.isAllDay || false,
      reminderMinutes: dto.reminderMinutes,
      metadata: dto.metadata || null,
    });

    const saved = await this.activityRepository.save(activity);

    return this.findOne(tenantId, saved.id);
  }

  /**
   * Find all activities with filtering and pagination
   */
  async findAll(tenantId: string, query: QueryActivitiesDto) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      priority,
      userId,
      assignedToId,
      leadId,
      contactId,
      companyId,
      dealId,
      isOverdue,
      dueBefore,
      dueAfter,
      sortBy = 'dueDate',
      sortOrder = 'ASC',
    } = query;

    const qb = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.assignedTo', 'assignedTo')
      .leftJoinAndSelect('activity.lead', 'lead')
      .leftJoinAndSelect('activity.contact', 'contact')
      .leftJoinAndSelect('activity.company', 'company')
      .leftJoinAndSelect('activity.deal', 'deal')
      .where('activity.tenantId = :tenantId', { tenantId });

    // Search
    if (search) {
      qb.andWhere(
        '(activity.title ILIKE :search OR activity.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filters
    if (type) {
      qb.andWhere('activity.type = :type', { type });
    }

    if (status) {
      qb.andWhere('activity.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('activity.priority = :priority', { priority });
    }

    if (userId) {
      qb.andWhere('activity.userId = :userId', { userId });
    }

    if (assignedToId) {
      qb.andWhere('activity.assignedToId = :assignedToId', { assignedToId });
    }

    if (leadId) {
      qb.andWhere('activity.leadId = :leadId', { leadId });
    }

    if (contactId) {
      qb.andWhere('activity.contactId = :contactId', { contactId });
    }

    if (companyId) {
      qb.andWhere('activity.companyId = :companyId', { companyId });
    }

    if (dealId) {
      qb.andWhere('activity.dealId = :dealId', { dealId });
    }

    if (isOverdue !== undefined && isOverdue) {
      qb.andWhere('activity.dueDate < :now', { now: new Date() }).andWhere(
        'activity.status != :completed',
        {
          completed: ActivityStatus.COMPLETED,
        },
      );
    }

    if (dueBefore || dueAfter) {
      if (dueBefore && dueAfter) {
        qb.andWhere('activity.dueDate BETWEEN :dueAfter AND :dueBefore', {
          dueAfter,
          dueBefore,
        });
      } else if (dueBefore) {
        qb.andWhere('activity.dueDate <= :dueBefore', { dueBefore });
      } else if (dueAfter) {
        qb.andWhere('activity.dueDate >= :dueAfter', { dueAfter });
      }
    }

    // Sorting
    const validSortFields = ['createdAt', 'dueDate', 'completedAt', 'priority'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'dueDate';
    qb.orderBy(`activity.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [activities, total] = await qb.getManyAndCount();

    return {
      data: activities.map((a) => this.formatActivityResponse(a)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one activity by ID
   */
  async findOne(tenantId: string, id: string) {
    const activity = await this.activityRepository.findOne({
      where: { id, tenantId },
      relations: ['user', 'assignedTo', 'lead', 'contact', 'company', 'deal'],
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.formatActivityResponse(activity);
  }

  /**
   * Update activity
   */
  async update(tenantId: string, id: string, dto: UpdateActivityDto) {
    const activity = await this.activityRepository.findOne({
      where: { id, tenantId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Validate assignedTo user if being changed
    if (dto.assignedToId) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: dto.assignedToId, tenantId },
      });
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    // Validate related entities if being changed
    if (dto.leadId) {
      const lead = await this.leadRepository.findOne({
        where: { id: dto.leadId, tenantId },
      });
      if (!lead) throw new NotFoundException('Lead not found');
    }

    if (dto.contactId) {
      const contact = await this.contactRepository.findOne({
        where: { id: dto.contactId, tenantId },
      });
      if (!contact) throw new NotFoundException('Contact not found');
    }

    if (dto.companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: dto.companyId, tenantId },
      });
      if (!company) throw new NotFoundException('Company not found');
    }

    if (dto.dealId) {
      const deal = await this.dealRepository.findOne({
        where: { id: dto.dealId, tenantId },
      });
      if (!deal) throw new NotFoundException('Deal not found');
    }

    // Update fields
    Object.assign(activity, {
      type: dto.type ?? activity.type,
      title: dto.title ?? activity.title,
      description: dto.description ?? activity.description,
      status: dto.status ?? activity.status,
      priority: dto.priority ?? activity.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : activity.dueDate,
      startDate: dto.startDate ? new Date(dto.startDate) : activity.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : activity.endDate,
      duration: dto.duration ?? activity.duration,
      assignedToId: dto.assignedToId ?? activity.assignedToId,
      leadId: dto.leadId ?? activity.leadId,
      contactId: dto.contactId ?? activity.contactId,
      companyId: dto.companyId ?? activity.companyId,
      dealId: dto.dealId ?? activity.dealId,
      location: dto.location ?? activity.location,
      attendees: dto.attendees ?? activity.attendees,
      isPrivate: dto.isPrivate ?? activity.isPrivate,
      isAllDay: dto.isAllDay ?? activity.isAllDay,
      reminderMinutes: dto.reminderMinutes ?? activity.reminderMinutes,
      metadata: dto.metadata ?? activity.metadata,
    });

    const updated = await this.activityRepository.save(activity);
    return this.findOne(tenantId, updated.id);
  }

  /**
   * Complete activity
   */
  async complete(tenantId: string, id: string, dto: CompleteActivityDto) {
    const activity = await this.activityRepository.findOne({
      where: { id, tenantId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    if (activity.isCompleted) {
      throw new BadRequestException('Activity is already completed');
    }

    activity.status = ActivityStatus.COMPLETED;
    activity.completedAt = dto.completedAt
      ? new Date(dto.completedAt)
      : new Date();

    if (dto.outcome) {
      activity.outcome = dto.outcome;
    }

    if (dto.notes) {
      activity.description = activity.description
        ? `${activity.description}\n\n--- Completion Notes ---\n${dto.notes}`
        : dto.notes;
    }

    await this.activityRepository.save(activity);

    return this.findOne(tenantId, id);
  }

  /**
   * Soft delete activity
   */
  async remove(tenantId: string, id: string) {
    const activity = await this.activityRepository.findOne({
      where: { id, tenantId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    await this.activityRepository.softDelete(id);

    return { message: 'Activity deleted successfully' };
  }

  /**
   * Restore soft-deleted activity
   */
  async restore(tenantId: string, id: string) {
    const activity = await this.activityRepository.findOne({
      where: { id, tenantId },
      withDeleted: true,
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    await this.activityRepository.restore(id);

    return this.findOne(tenantId, id);
  }

  /**
   * Get activity statistics
   */
  async getStats(tenantId: string, userId?: string) {
    const qb = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.tenantId = :tenantId', { tenantId });

    if (userId) {
      qb.andWhere('activity.assignedToId = :userId', { userId });
    }

    const total = await qb.getCount();

    const completed = await qb
      .clone()
      .andWhere('activity.status = :status', {
        status: ActivityStatus.COMPLETED,
      })
      .getCount();

    const pending = await qb
      .clone()
      .andWhere('activity.status IN (:...statuses)', {
        statuses: [ActivityStatus.SCHEDULED, ActivityStatus.IN_PROGRESS],
      })
      .getCount();

    const overdue = await qb
      .clone()
      .andWhere('activity.dueDate < :now', { now: new Date() })
      .andWhere('activity.status != :completed', {
        completed: ActivityStatus.COMPLETED,
      })
      .getCount();

    // By type
    const byType = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('activity.tenantId = :tenantId', { tenantId })
      .groupBy('activity.type')
      .getRawMany();

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: parseFloat(completionRate.toFixed(2)),
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count, 10);
        return acc;
      }, {}),
    };
  }

  /**
   * Get upcoming activities
   */
  async getUpcoming(tenantId: string, userId: string, days: number = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const activities = await this.activityRepository.find({
      where: {
        tenantId,
        assignedToId: userId,
        status: ActivityStatus.SCHEDULED,
      },
      relations: ['lead', 'contact', 'company', 'deal'],
      order: { dueDate: 'ASC' },
    });

    return activities
      .filter((a) => a.dueDate && a.dueDate >= now && a.dueDate <= future)
      .map((a) => this.formatActivityResponse(a));
  }

  // ========== HELPER METHODS ==========

  private formatActivityResponse(activity: Activity) {
    return {
      id: activity.id,
      tenantId: activity.tenantId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      status: activity.status,
      priority: activity.priority,
      dueDate: activity.dueDate,
      startDate: activity.startDate,
      endDate: activity.endDate,
      duration: activity.duration,
      completedAt: activity.completedAt,
      location: activity.location,
      attendees: activity.attendees || [],
      isPrivate: activity.isPrivate,
      isAllDay: activity.isAllDay,
      outcome: activity.outcome,
      reminderMinutes: activity.reminderMinutes,
      isOverdue: activity.isOverdue,
      isCompleted: activity.isCompleted,
      isPending: activity.isPending,
      user: activity.user
        ? {
            id: activity.user.id,
            firstName: activity.user.firstName,
            lastName: activity.user.lastName,
            email: activity.user.email,
          }
        : null,
      assignedTo: activity.assignedTo
        ? {
            id: activity.assignedTo.id,
            firstName: activity.assignedTo.firstName,
            lastName: activity.assignedTo.lastName,
            email: activity.assignedTo.email,
          }
        : null,
      lead: activity.lead
        ? {
            id: activity.lead.id,
            title: activity.lead.title,
            status: activity.lead.status,
          }
        : null,
      contact: activity.contact
        ? {
            id: activity.contact.id,
            firstName: activity.contact.firstName,
            lastName: activity.contact.lastName,
            email: activity.contact.email,
          }
        : null,
      company: activity.company
        ? {
            id: activity.company.id,
            name: activity.company.name,
            domain: activity.company.domain,
          }
        : null,
      deal: activity.deal
        ? {
            id: activity.deal.id,
            name: activity.deal.name,
            amount: activity.deal.amount,
            status: activity.deal.status,
          }
        : null,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }
}
