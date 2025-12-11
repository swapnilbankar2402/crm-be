// src/tenants/dto/create-tenant.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  Matches,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from 'src/common/entities';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'acme.example.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'contact@acme.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '11-50' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: SubscriptionPlan })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;
}