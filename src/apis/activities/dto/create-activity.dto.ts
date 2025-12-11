import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityPriority, ActivityStatus, ActivityType } from 'src/common/entities';

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType })
  @IsNotEmpty()
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ example: 'Follow-up call with client' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Discuss pricing and contract terms' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ enum: ActivityPriority, default: 'medium' })
  @IsOptional()
  @IsEnum(ActivityPriority)
  priority?: ActivityPriority;

  @ApiPropertyOptional({ example: '2024-12-31T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 60, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ example: 'company-uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid' })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional({ example: 'Conference Room A' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: ['john@example.com', 'jane@example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ example: 30, description: 'Reminder before due date in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  reminderMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}