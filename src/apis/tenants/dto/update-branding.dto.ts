import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBrandingDto {
  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ example: '#0066CC' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Primary color must be a valid hex color',
  })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#FF6600' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Secondary color must be a valid hex color',
  })
  secondaryColor?: string;
}