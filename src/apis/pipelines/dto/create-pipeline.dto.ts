import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreatePipelineStageDto {
  @ApiProperty({ example: 'New' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '#0066CC' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  position?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  probability?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePipelineDto {
  @ApiProperty({ example: 'Sales Pipeline' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Our main sales pipeline' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ type: [CreatePipelineStageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePipelineStageDto)
  stages: CreatePipelineStageDto[];
}