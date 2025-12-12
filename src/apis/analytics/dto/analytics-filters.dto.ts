import { IsOptional, IsUUID } from 'class-validator';
import { DateRangeDto } from './date-range.dto';

export class AnalyticsFiltersDto extends DateRangeDto {
  @IsOptional()
  @IsUUID()
  ownerId?: string; // deals owner filter

  @IsOptional()
  @IsUUID()
  assignedToId?: string; // leads assigned filter
}