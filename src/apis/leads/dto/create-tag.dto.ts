import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Hot Lead' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '#FF0000' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
  color?: string;

  @ApiPropertyOptional({ example: 'Leads with high purchase intent' })
  @IsOptional()
  @IsString()
  description?: string;
}