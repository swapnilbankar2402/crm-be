import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoveDealStageDto {
  @ApiProperty({ example: 'stage-uuid' })
  @IsNotEmpty()
  @IsUUID()
  stageId: string;

  @ApiPropertyOptional({ example: 'Customer agreed to terms' })
  @IsOptional()
  @IsString()
  reason?: string;
}