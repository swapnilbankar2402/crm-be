// src/audit-logs/audit-logs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryAuditLogsDto } from './dto';
import { AuditEvent } from 'src/common/events/app-events';
import { AuditLog } from 'src/common/entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Creates an audit log entry. This is typically called by an event listener.
   */
  async create(payload: AuditEvent): Promise<AuditLog> {
    const logEntry = this.auditLogRepository.create(payload);
    return this.auditLogRepository.save(logEntry);
  }

  /**
   * Finds all audit logs with filtering and pagination.
   */
  async findAll(tenantId: string, query: QueryAuditLogsDto) {
    const {
      page = 1,
      limit = 25,
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (userId) qb.andWhere('log.userId = :userId', { userId });
    if (action) qb.andWhere('log.action = :action', { action });
    if (entityType) qb.andWhere('log.entityType = :entityType', { entityType });
    if (entityId) qb.andWhere('log.entityId = :entityId', { entityId });

    if (startDate) qb.andWhere('log.createdAt >= :startDate', { startDate });
    if (endDate) qb.andWhere('log.createdAt <= :endDate', { endDate });
    
    // Sorting
    qb.orderBy(`log.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [logs, total] = await qb.getManyAndCount();
    
    // Format response to include user info
    const formattedLogs = logs.map(log => ({
      ...log,
      user: log.user ? {
        id: log.user.id,
        firstName: log.user.firstName,
        lastName: log.user.lastName,
        email: log.user.email,
      } : { id: log.userId, firstName: 'Deleted', lastName: 'User' }
    }));

    return {
      data: formattedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}