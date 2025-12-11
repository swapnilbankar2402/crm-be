import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  Matches,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Custom Sales Manager' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'custom-sales-manager' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'Custom role for sales team managers' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: ['leads:*', 'contacts:read', 'deals:*'],
    description: 'Array of permission strings',
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 5, description: 'Role hierarchy level' })
  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}