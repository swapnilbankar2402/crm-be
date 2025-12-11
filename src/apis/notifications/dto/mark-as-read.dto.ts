import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAsReadDto {
  @ApiProperty({
    example: ['notification-uuid-1', 'notification-uuid-2'],
    description: 'Array of notification IDs to mark as read',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  notificationIds: string[];
}