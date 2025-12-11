// src/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';

// CORRECTED IMPORTS
import { EmailMessagesService } from '../emails/services/email-messages.service';
import { QueryNotificationsDto, MarkAsReadDto } from './dto';
import {
  AppNotification,
  NotificationChannel,
  NotificationType,
  User,
} from 'src/common/entities';

export interface CreateNotificationPayload {
  recipientId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  body?: string;
  context: AppNotification['context'];
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(AppNotification) // CORRECTED
    private notificationRepository: Repository<AppNotification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailMessagesService: EmailMessagesService,
  ) {}

  async createAndDispatch(payload: CreateNotificationPayload): Promise<void> {
    const recipient = await this.userRepository.findOne({
      where: { id: payload.recipientId },
    });
    if (!recipient) {
      console.warn(
        `Recipient with ID ${payload.recipientId} not found. Skipping notification.`,
      );
      return;
    }

    const preferences = recipient.notificationSettings?.[payload.type];
    const channels: NotificationChannel[] = [];

    if (preferences?.in_app !== false) {
      channels.push(NotificationChannel.IN_APP);
    }
    if (
      preferences?.email !== false &&
      recipient.emailNotifications !== false
    ) {
      channels.push(NotificationChannel.EMAIL);
    }

    if (channels.length === 0) {
      return;
    }

    const notification = this.notificationRepository.create({
      ...payload,
      channels,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    if (channels.includes(NotificationChannel.EMAIL)) {
      await this.sendEmailNotification(recipient, savedNotification);
    }
  }

  private async sendEmailNotification(
    recipient: User,
    notification: AppNotification,
  ) {
    // CORRECTED
    try {
      await this.emailMessagesService.send(
        notification.tenantId,
        recipient.id,
        {
          to: [{ email: recipient.email, name: recipient.fullName }],
          subject: `[CRM Notification] ${notification.title}`,
          html: `<p>${notification.body || notification.title}</p><p>This is an automated notification from your CRM.</p>`,
        },
      );
    } catch (error) {
      console.error(
        `Failed to send email notification ${notification.id} to ${recipient.email}:`,
        error,
      );
    }
  }

  async findAllForUser(userId: string, query: QueryNotificationsDto) {
    const { page = 1, limit = 10, isRead } = query;
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipientId = :userId', { userId });

    if (isRead === true) {
      qb.andWhere('notification.readAt IS NOT NULL');
    } else if (isRead === false) {
      qb.andWhere('notification.readAt IS NULL');
    }

    qb.orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [notifications, total] = await qb.getManyAndCount();
    return {
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { recipientId: userId, readAt: IsNull() },
    });
    return { count };
  }

  async markAsRead(
    userId: string,
    dto: MarkAsReadDto,
  ): Promise<{ affected: number }> {
    const result = await this.notificationRepository.update(
      { recipientId: userId, id: In(dto.notificationIds), readAt: IsNull() },
      { readAt: new Date() },
    );
    return { affected: result.affected || 0 };
  }

  async markAllAsRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepository.update(
      { recipientId: userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { affected: result.affected || 0 };
  }
}
