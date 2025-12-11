// src/tenants/dto/update-settings.dto.ts
import { IsOptional, IsObject, IsBoolean, IsString, IsArray, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailSignature?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  notifications?: {
    newLead?: boolean;
    dealWon?: boolean;
    taskDue?: boolean;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  security?: {
    enforceSSO?: boolean;
    enforce2FA?: boolean;
    sessionTimeout?: number;
    ipWhitelist?: string[];
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  branding?: {
    loginPageMessage?: string;
    customCSS?: string;
  };
}