import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityPriority, ActivityStatus, ActivityType } from 'src/common/entities';


export class QueryActivitiesDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiPropertyOptional({ enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ enum: ActivityPriority })
  @IsOptional()
  @IsEnum(ActivityPriority)
  priority?: ActivityPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOverdue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  dueBefore?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  dueAfter?: Date;

  @ApiPropertyOptional({ enum: ['createdAt', 'dueDate', 'completedAt', 'priority'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'dueDate';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}