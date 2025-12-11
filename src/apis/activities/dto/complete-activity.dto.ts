import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteActivityDto {
  @ApiPropertyOptional({ example: '2024-01-15T14:30:00Z' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({ example: 'Successfully connected with decision maker' })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({ example: 'Discussed pricing. Follow-up scheduled for next week.' })
  @IsOptional()
  @IsString()
  notes?: string;
}