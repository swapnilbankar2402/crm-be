import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ConvertLeadDto {
  @ApiPropertyOptional({ example: 'deal-uuid' })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiProperty({ example: 'New Deal from Lead Conversion' })
  @IsNotEmpty()
  @IsString()
  dealName: string;

  @ApiPropertyOptional({ example: '10000' })
  @IsOptional()
  @Type(() => Number)
  dealAmount?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  dealCurrency?: string;

  @ApiPropertyOptional({ example: '2023-12-31' })
  @IsOptional()
  @IsDateString()
  dealCloseDate?: string;
}