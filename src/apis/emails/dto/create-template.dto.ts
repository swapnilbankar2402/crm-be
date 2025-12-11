import { IsNotEmpty, IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Welcome Email' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'welcome-email' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens.',
  })
  slug: string;

  @ApiProperty({ example: 'Welcome to {{company}}, {{name}}!' })
  @IsNotEmpty()
  @IsString()
  subjectTemplate: string;

  @ApiProperty({ example: '<mjml>...</mjml>' })
  @IsNotEmpty()
  @IsString()
  mjmlTemplate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textTemplate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}