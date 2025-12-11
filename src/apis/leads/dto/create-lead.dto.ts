import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsArray,
  IsEmail,
  IsPhoneNumber,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource, LeadStatus } from 'src/common/entities';

export class CreateLeadDto {
  @ApiProperty({ example: 'Interested in Enterprise Plan' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Prospect from Acme Corp interested in our enterprise solution',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'john@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ example: 'company-uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ enum: LeadSource, default: LeadSource.WEBSITE })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ example: 'Contact Form' })
  @IsOptional()
  @IsString()
  sourceDetails?: string;

  @ApiPropertyOptional({ example: 75, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({
    example: 'high',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: '2023-12-31' })
  @IsOptional()
  @IsDateString()
  nextActionDate?: string;

  @ApiPropertyOptional({ example: 'Follow up with proposal' })
  @IsOptional()
  @IsString()
  nextAction?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({ example: ['hot', 'enterprise'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  customFields?: Record<string, any>;
}
