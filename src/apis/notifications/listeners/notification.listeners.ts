// src/notifications/listeners/notification.listeners.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, User } from 'src/common/entities';
import { AppEvents, DealWonEvent, LeadAssignedEvent, TaskDueEvent } from 'src/common/events/app-events';
import { NotificationType } from 'src/common/entities/app-notification.entity';

@Injectable()
export class NotificationListeners {
  constructor(
    private notificationsService: NotificationsService,
    @InjectRepository(Lead) private leadRepository: Repository<Lead>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  @OnEvent(AppEvents.LEAD_ASSIGNED)
  async handleLeadAssigned(event: LeadAssignedEvent) {
    const [lead, assignedByUser] = await Promise.all([
      this.leadRepository.findOne({ where: { id: event.leadId } }),
      this.userRepository.findOne({ where: { id: event.assignedByUserId } }),
    ]);

    if (!lead || !assignedByUser) return;

    // Call the single public method to create and dispatch
    await this.notificationsService.createAndDispatch({
      tenantId: event.tenantId,
      recipientId: event.assignedToUserId,
      type: NotificationType.LEAD_ASSIGNED,
      title: 'New Lead Assigned',
      body: `Lead "${lead.title}" was assigned to you by ${assignedByUser.fullName}.`,
      context: {
        entityType: 'lead',
        entityId: event.leadId,
        assignedByUserId: event.assignedByUserId,
      },
    });
  }

  @OnEvent(AppEvents.TASK_DUE_SOON)
  async handleTaskDue(event: TaskDueEvent) {
    // This is where you would implement the logic for this event
    console.log('Handling task due event:', event);
  }

  @OnEvent(AppEvents.DEAL_WON)
  async handleDealWon(event: DealWonEvent) {
    // This is where you would implement the logic for this event
    console.log('Handling deal won event:', event);
  }
}