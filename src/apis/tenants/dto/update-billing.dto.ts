import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBillingDto {
  @ApiPropertyOptional({ example: 'billing@acme.com' })
  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @ApiPropertyOptional({ example: 'Acme Corporation' })
  @IsOptional()
  @IsString()
  billingName?: string;

  @ApiPropertyOptional({ example: '123 Main St, Suite 100' })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  billingCity?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  billingState?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsOptional()
  @IsString()
  billingZipCode?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsOptional()
  @IsString()
  billingCountry?: string;

  @ApiPropertyOptional({ example: 'US123456789' })
  @IsOptional()
  @IsString()
  taxId?: string;
}