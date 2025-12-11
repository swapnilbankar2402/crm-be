import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTemplateDto } from './create-template.dto';

export class UpdateTemplateDto extends PartialType(
  OmitType(CreateTemplateDto, ['slug'] as const),
) {}