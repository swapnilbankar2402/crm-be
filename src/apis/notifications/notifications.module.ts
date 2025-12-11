// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsModule } from '../emails/emails.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationListeners } from './listeners/notification.listeners';
import { AppNotification, Lead, User } from 'src/common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppNotification, User, Lead]), // CORRECTED
    EmailsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationListeners],
  exports: [NotificationsService],
})
export class NotificationsModule {}