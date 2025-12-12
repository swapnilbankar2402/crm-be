import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsISO8601()
  from?: string; // ISO date string

  @IsOptional()
  @IsISO8601()
  to?: string; // ISO date string

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';

  @IsOptional()
  @IsString()
  timezone?: string = 'UTC'; // optional; we’ll keep UTC in SQL by default
}