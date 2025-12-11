import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealPriority, DealStatus } from 'src/common/entities';

class ProductDto {
  @ApiProperty({ example: 'Enterprise License' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  total: number;
}

export class CreateDealDto {
  @ApiProperty({ example: 'Acme Enterprise Deal' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Large enterprise deal for 5 licenses' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ example: 'company-uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ example: 'pipeline-uuid' })
  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @ApiPropertyOptional({ example: 'stage-uuid' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ example: 60, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ enum: DealStatus })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @ApiPropertyOptional({ enum: DealPriority })
  @IsOptional()
  @IsEnum(DealPriority)
  priority?: DealPriority;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({ example: 'Referral' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: ['enterprise', 'high-value'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [ProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products?: ProductDto[];

  @ApiPropertyOptional()
  @IsOptional()
  customFields?: Record<string, any>;
}