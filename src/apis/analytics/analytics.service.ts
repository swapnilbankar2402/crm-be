import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Lead, LeadStatus } from '../../common/entities/lead.entity';
import { Deal, DealStatus } from '../../common/entities/deal.entity';
import { Activity, ActivityStatus } from '../../common/entities/activity.entity';
import { EmailMessage } from '../../common/entities/email-message.entity';

import { AnalyticsFiltersDto, DateRangeDto } from './dto';

type Range = { from: Date; to: Date };

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Lead) private leads: Repository<Lead>,
    @InjectRepository(Deal) private deals: Repository<Deal>,
    @InjectRepository(Activity) private activities: Repository<Activity>,
    @InjectRepository(EmailMessage) private emails: Repository<EmailMessage>,
  ) {}

  // ---------- helpers ----------
  private parseRange(dto: DateRangeDto): Range {
    const now = new Date();
    const to = dto.to ? new Date(dto.to) : now;

    // default: last 30 days
    const from = dto.from ? new Date(dto.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    return { from, to };
  }

  private groupTrunc(groupBy: 'day' | 'week' | 'month') {
    // Postgres date_trunc units
    return groupBy;
  }

  // ---------- Overview (dashboard KPI) ----------
  async overview(tenantId: string, dto: AnalyticsFiltersDto) {
    const { from, to } = this.parseRange(dto);

    const leadsQb = this.leads.createQueryBuilder('l')
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('l.createdAt BETWEEN :from AND :to', { from, to });

    if (dto.assignedToId) {
      leadsQb.andWhere('l.assignedToId = :assignedToId', { assignedToId: dto.assignedToId });
    }

    const dealsQb = this.deals.createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.createdAt BETWEEN :from AND :to', { from, to });

    if (dto.ownerId) {
      dealsQb.andWhere('d.ownerId = :ownerId', { ownerId: dto.ownerId });
    }

    const activitiesQb = this.activities.createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.createdAt BETWEEN :from AND :to', { from, to });

    const emailsQb = this.emails.createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.createdAt BETWEEN :from AND :to', { from, to });

    const [
      leadsTotal,
      leadsConverted,
      dealsOpenCount,
      dealsWonCount,
      dealsWonValueRaw,
      pipelineValueRaw,
      pipelineWeightedValueRaw,
      activitiesTotal,
      activitiesCompleted,
      activitiesOverdue,
      emailsSent,
      emailsOpenSumRaw,
      emailsClickSumRaw,
    ] = await Promise.all([
      leadsQb.clone().getCount(),
      leadsQb.clone().andWhere('l.status = :converted', { converted: LeadStatus.CONVERTED }).getCount(),

      dealsQb.clone().andWhere('d.status = :open', { open: DealStatus.OPEN }).getCount(),
      dealsQb.clone().andWhere('d.status = :won', { won: DealStatus.WON }).getCount(),

      dealsQb.clone()
        .select('COALESCE(SUM(d.amount::numeric),0)', 'value')
        .andWhere('d.status = :won', { won: DealStatus.WON })
        .getRawOne(),

      dealsQb.clone()
        .select('COALESCE(SUM(d.amount::numeric),0)', 'value')
        .andWhere('d.status = :open', { open: DealStatus.OPEN })
        .getRawOne(),

      dealsQb.clone()
        .select('COALESCE(SUM((d.amount::numeric * COALESCE(d.probability,0)) / 100),0)', 'value')
        .andWhere('d.status = :open', { open: DealStatus.OPEN })
        .getRawOne(),

      activitiesQb.clone().getCount(),
      activitiesQb.clone().andWhere('a.status = :completed', { completed: ActivityStatus.COMPLETED }).getCount(),
      this.activities.createQueryBuilder('a')
        .where('a.tenantId = :tenantId', { tenantId })
        .andWhere('a.dueDate IS NOT NULL')
        .andWhere('a.dueDate < now()')
        .andWhere('a.status != :completed', { completed: ActivityStatus.COMPLETED })
        .getCount(),

      emailsQb.clone().getCount(),
      emailsQb.clone().select('COALESCE(SUM(e.openCount),0)', 'value').getRawOne(),
      emailsQb.clone().select('COALESCE(SUM(e.clickCount),0)', 'value').getRawOne(),
    ]);

    const dealsWonValue = Number(dealsWonValueRaw?.value || 0);
    const pipelineValue = Number(pipelineValueRaw?.value || 0);
    const pipelineWeightedValue = Number(pipelineWeightedValueRaw?.value || 0);

    const openSum = Number(emailsOpenSumRaw?.value || 0);
    const clickSum = Number(emailsClickSumRaw?.value || 0);

    const leadConversionRate = leadsTotal > 0 ? (leadsConverted / leadsTotal) * 100 : 0;
    const activityCompletionRate = activitiesTotal > 0 ? (activitiesCompleted / activitiesTotal) * 100 : 0;
    const emailOpenRate = emailsSent > 0 ? (openSum / emailsSent) * 100 : 0;
    const emailClickRate = emailsSent > 0 ? (clickSum / emailsSent) * 100 : 0;

    return {
      range: { from, to },
      leads: {
        total: leadsTotal,
        converted: leadsConverted,
        conversionRate: Number(leadConversionRate.toFixed(2)),
      },
      deals: {
        openCount: dealsOpenCount,
        wonCount: dealsWonCount,
        wonValue: dealsWonValue,
        pipelineValue,
        pipelineWeightedValue,
      },
      activities: {
        total: activitiesTotal,
        completed: activitiesCompleted,
        overdue: activitiesOverdue,
        completionRate: Number(activityCompletionRate.toFixed(2)),
      },
      emails: {
        sent: emailsSent,
        opens: openSum,
        clicks: clickSum,
        openRate: Number(emailOpenRate.toFixed(2)),
        clickRate: Number(emailClickRate.toFixed(2)),
      },
    };
  }

  // ---------- Leads time series ----------
  async leadsCreatedSeries(tenantId: string, dto: AnalyticsFiltersDto) {
    const { from, to } = this.parseRange(dto);
    const unit = this.groupTrunc(dto.groupBy || 'day');

    const qb = this.leads.createQueryBuilder('l')
      .select(`date_trunc('${unit}', l.createdAt)`, 'bucket')
      .addSelect('COUNT(*)', 'count')
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('l.createdAt BETWEEN :from AND :to', { from, to });

    if (dto.assignedToId) qb.andWhere('l.assignedToId = :assignedToId', { assignedToId: dto.assignedToId });

    qb.groupBy('bucket').orderBy('bucket', 'ASC');

    const rows = await qb.getRawMany();
    return rows.map(r => ({ bucket: r.bucket, count: Number(r.count) }));
  }

  // ---------- Deals revenue time series (WON) ----------
  async wonRevenueSeries(tenantId: string, dto: AnalyticsFiltersDto) {
    const { from, to } = this.parseRange(dto);
    const unit = this.groupTrunc(dto.groupBy || 'day');

    const qb = this.deals.createQueryBuilder('d')
      .select(`date_trunc('${unit}', COALESCE(d.actualCloseDate, d.updatedAt))`, 'bucket')
      .addSelect('COALESCE(SUM(d.amount::numeric),0)', 'value')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.status = :won', { won: DealStatus.WON })
      .andWhere('COALESCE(d.actualCloseDate, d.updatedAt) BETWEEN :from AND :to', { from, to });

    if (dto.ownerId) qb.andWhere('d.ownerId = :ownerId', { ownerId: dto.ownerId });

    qb.groupBy('bucket').orderBy('bucket', 'ASC');

    const rows = await qb.getRawMany();
    return rows.map(r => ({ bucket: r.bucket, value: Number(r.value) }));
  }

  // ---------- Deals pipeline by stage (OPEN) ----------
  async pipelineByStage(tenantId: string, dto: AnalyticsFiltersDto) {
    const qb = this.deals.createQueryBuilder('d')
      .leftJoin('d.stage', 's')
      .select('COALESCE(s.name, \'No Stage\')', 'stage')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(d.amount::numeric),0)', 'value')
      .addSelect('COALESCE(SUM((d.amount::numeric * COALESCE(d.probability,0))/100),0)', 'weightedValue')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.status = :open', { open: DealStatus.OPEN });

    if (dto.ownerId) qb.andWhere('d.ownerId = :ownerId', { ownerId: dto.ownerId });

    qb.groupBy('stage').orderBy('value', 'DESC');

    const rows = await qb.getRawMany();
    return rows.map(r => ({
      stage: r.stage,
      count: Number(r.count),
      value: Number(r.value),
      weightedValue: Number(r.weightedvalue ?? r.weightedValue ?? 0),
    }));
  }

  // ---------- Activities summary ----------
  async activitiesSummary(tenantId: string, dto: AnalyticsFiltersDto) {
    const { from, to } = this.parseRange(dto);

    const total = await this.activities.createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.createdAt BETWEEN :from AND :to', { from, to })
      .getCount();

    const completed = await this.activities.createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('a.status = :completed', { completed: ActivityStatus.COMPLETED })
      .getCount();

    const overdue = await this.activities.createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.dueDate IS NOT NULL')
      .andWhere('a.dueDate < now()')
      .andWhere('a.status != :completed', { completed: ActivityStatus.COMPLETED })
      .getCount();

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      range: { from, to },
      total,
      completed,
      overdue,
      completionRate: Number(completionRate.toFixed(2)),
    };
  }

  // ---------- Email stats ----------
  async emailSummary(tenantId: string, dto: AnalyticsFiltersDto) {
    const { from, to } = this.parseRange(dto);

    const sent = await this.emails.createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.createdAt BETWEEN :from AND :to', { from, to })
      .getCount();

    const openSumRaw = await this.emails.createQueryBuilder('e')
      .select('COALESCE(SUM(e.openCount),0)', 'value')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const clickSumRaw = await this.emails.createQueryBuilder('e')
      .select('COALESCE(SUM(e.clickCount),0)', 'value')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const opens = Number(openSumRaw?.value || 0);
    const clicks = Number(clickSumRaw?.value || 0);

    return {
      range: { from, to },
      sent,
      opens,
      clicks,
      openRate: sent > 0 ? Number(((opens / sent) * 100).toFixed(2)) : 0,
      clickRate: sent > 0 ? Number(((clicks / sent) * 100).toFixed(2)) : 0,
    };
  }
}