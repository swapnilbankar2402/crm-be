import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FileEntityType } from 'src/common/entities/file.entity';

export class UploadFileDto {
  @ApiPropertyOptional({
    description: 'The type of entity this file is associated with.',
    enum: FileEntityType,
  })
  @IsOptional()
  @IsEnum(FileEntityType) // Use the enum for validation
  entityType?: FileEntityType;

  @ApiPropertyOptional({
    description: 'The UUID of the entity this file is associated with.',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description:
      'Whether the file should be publicly accessible without a signed URL.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
