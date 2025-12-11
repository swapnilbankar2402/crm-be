import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto, MarkAsReadDto } from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentUser } from 'src/auth/decorators';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the current user' })
  findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findAllForUser(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get the count of unread notifications' })
  getUnreadCount(@CurrentUser('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Post('mark-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark specific notifications as read' })
  markAsRead(
    @CurrentUser('userId') userId: string,
    @Body() dto: MarkAsReadDto,
  ) {
    return this.notificationsService.markAsRead(userId, dto);
  }

  @Post('mark-all-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}