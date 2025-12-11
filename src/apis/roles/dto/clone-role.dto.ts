import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloneRoleDto {
  @ApiProperty({ example: 'Cloned Sales Manager' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'cloned-sales-manager' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiPropertyOptional({ example: 'Cloned from Sales Manager role' })
  @IsOptional()
  @IsString()
  description?: string;
}