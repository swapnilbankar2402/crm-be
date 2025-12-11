import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';
import { Pipeline, PipelineStage } from 'src/common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Pipeline, PipelineStage])],
  controllers: [PipelinesController],
  providers: [PipelinesService],
  exports: [PipelinesService], // Export so other modules can use it
})
export class PipelinesModule {}