import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateIf,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldType } from 'src/common/entities';
import { Type } from 'class-transformer';

class CustomFieldOptionDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsString()
  value: string;
}

export class CreateCustomFieldDto {
  @ApiProperty({ example: 'Preferred Contact Method' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'preferred_contact_method' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Key can only contain lowercase letters, numbers, and underscores',
  })
  key: string;

  @ApiPropertyOptional({ example: 'How the lead prefers to be contacted' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CustomFieldType })
  @IsNotEmpty()
  @IsEnum(CustomFieldType)
  type: CustomFieldType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ type: [CustomFieldOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => [CustomFieldType.DROPDOWN, CustomFieldType.MULTI_SELECT].includes(o.type))
  options?: CustomFieldOptionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  position?: number;

  @ApiProperty({ example: 'lead' })
  @IsNotEmpty()
  @IsString()
  entityType: string;
}