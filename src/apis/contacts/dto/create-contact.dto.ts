import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsUUID,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john.doe@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ example: 'company-uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ example: 'CTO' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  department?: string;

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
  @IsString()
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twitter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: ['vip', 'tech'] })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  customFields?: Record<string, any>;
}