import { IsNotEmpty, IsString, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RecipientDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class SendEmailDto {
  @ApiPropertyOptional({ example: 'template-slug' })
  @IsOptional()
  @IsString()
  templateSlug?: string;

  @ApiProperty({ type: [RecipientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  to: RecipientDto[];

  @ApiPropertyOptional({ type: [RecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  cc?: RecipientDto[];

  @ApiPropertyOptional({ type: [RecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  bcc?: RecipientDto[];

  @ApiPropertyOptional({ example: 'Welcome to our platform!' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: '<h1>Welcome!</h1>' })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({ example: '<mjml>...</mjml>' })
  @IsOptional()
  @IsString()
  mjml?: string;

  @ApiPropertyOptional({ example: { name: 'John', company: 'Acme' } })
  @IsOptional()
  variables?: Record<string, any>;

  // CRM context links
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  dealId?: string;
}