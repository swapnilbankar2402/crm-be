import { PartialType } from '@nestjs/swagger';
import { CreatePipelineDto } from '../../pipelines/dto/create-pipeline.dto';

export class UpdatePipelineDto extends PartialType(CreatePipelineDto) {}