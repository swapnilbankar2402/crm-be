import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  IsEnum,
  IsInt,
  Min,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanySize } from 'src/common/entities';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'acme.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'https://www.acme.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  companySize?: CompanySize;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsInt()
  @Min(1)
  employeeCount?: number;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  annualRevenue?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'Leading tech company specializing in AI solutions' })
  @IsOptional()
  @IsString()
  description?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isCustomer?: boolean;

  @ApiPropertyOptional({ example: ['enterprise', 'saas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  customFields?: Record<string, any>;
}