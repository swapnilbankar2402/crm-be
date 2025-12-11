// src/audit-logs/audit-logs.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, Roles } from 'src/auth/decorators';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('admin') // Only admins can view audit logs
  @ApiOperation({ summary: 'Get audit logs with filtering and pagination' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryAuditLogsDto,
  ) {
    return this.auditLogsService.findAll(tenantId, query);
  }
}