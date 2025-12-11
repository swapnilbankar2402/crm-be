import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStatus } from 'src/common/entities';

export class CloseDealDto {
  @ApiProperty({ enum: [DealStatus.WON, DealStatus.LOST, DealStatus.ABANDONED] })
  @IsNotEmpty()
  @IsEnum([DealStatus.WON, DealStatus.LOST, DealStatus.ABANDONED])
  status: DealStatus;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @ApiPropertyOptional({ example: 'Customer chose competitor' })
  @IsOptional()
  @IsString()
  reason?: string;
}