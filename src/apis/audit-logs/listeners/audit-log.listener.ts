import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLogsService } from '../audit-logs.service';
import { AppEvents, AuditEvent } from 'src/common/events/app-events';

@Injectable()
export class AuditLogListener {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @OnEvent(AppEvents.AUDIT_LOG_EVENT)
  async handleAuditEvent(event: AuditEvent) {
    await this.auditLogsService.create(event);
  }
}