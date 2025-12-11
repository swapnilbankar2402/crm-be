import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';

import { CreatePipelineDto, UpdatePipelineDto } from './dto';
import { Pipeline, PipelineStage } from 'src/common/entities';

@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(Pipeline)
    private pipelineRepository: Repository<Pipeline>,
    @InjectRepository(PipelineStage)
    private pipelineStageRepository: Repository<PipelineStage>,
  ) {}

  /**
   * Create a new pipeline
   */
  async create(tenantId: string, createPipelineDto: CreatePipelineDto) {
    // Check if pipeline name already exists
    const existingPipelineName = await this.pipelineRepository.findOne({
      where: { tenantId, name: createPipelineDto.name },
    });
    if (existingPipelineName) {
      throw new ConflictException('Pipeline with this name already exists.');
    }

    // Check if default pipeline already exists for this tenant
    if (createPipelineDto.isDefault) {
      const existingDefault = await this.pipelineRepository.findOne({
        where: { tenantId, isDefault: true },
      });
      if (existingDefault) {
        throw new ConflictException('A default pipeline already exists for this tenant.');
      }
    }

    // Create pipeline first
    const pipeline = this.pipelineRepository.create({
      name: createPipelineDto.name,
      description: createPipelineDto.description,
      isDefault: createPipelineDto.isDefault || false,
      isActive: true, // Pipelines are active by default
      tenantId,
    });

    const savedPipeline = await this.pipelineRepository.save(pipeline);

    // Create stages with proper pipeline relationship
    const stages = createPipelineDto.stages.map((stage, index) =>
      this.pipelineStageRepository.create({
        ...stage,
        pipelineId: savedPipeline.id,
        position: index,
        leadCount: 0, // Initial lead count is 0
        isActive: stage.isActive !== undefined ? stage.isActive : true, // Stages are active by default
      }),
    );

    // Bulk save stages
    await this.pipelineStageRepository.save(stages);

    return this.findOne(tenantId, savedPipeline.id);
  }

  /**
   * Find all pipelines for a tenant
   */
  async findAll(tenantId: string) {
    const pipelines = await this.pipelineRepository.find({
      where: { tenantId },
      relations: ['stages'],
      order: { createdAt: 'ASC' },
    });

    return pipelines.map((pipeline) => this.formatPipelineResponse(pipeline));
  }

  /**
   * Find one pipeline by ID
   */
  async findOne(tenantId: string, id: string) {
    const pipeline = await this.pipelineRepository.findOne({
      where: { id, tenantId },
      relations: ['stages'],
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found.');
    }

    return this.formatPipelineResponse(pipeline);
  }

  /**
   * Update pipeline
   */
  async update(tenantId: string, id: string, updatePipelineDto: UpdatePipelineDto) {
    const pipeline = await this.pipelineRepository.findOne({
      where: { id, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found.');
    }

    // Check if pipeline name already exists (excluding itself)
    if (updatePipelineDto.name && updatePipelineDto.name !== pipeline.name) {
      const existingPipelineName = await this.pipelineRepository.findOne({
        where: { tenantId, name: updatePipelineDto.name, id: Not(id) },
      });
      if (existingPipelineName) {
        throw new ConflictException('Pipeline with this name already exists.');
      }
    }

    // Handle default pipeline conflict
    if (updatePipelineDto.isDefault !== undefined && updatePipelineDto.isDefault) {
      const existingDefault = await this.pipelineRepository.findOne({
        where: { tenantId, isDefault: true, id: Not(id) },
      });
      if (existingDefault) {
        throw new ConflictException('A default pipeline already exists for this tenant.');
      }
    }

    // Update pipeline fields
    Object.assign(pipeline, updatePipelineDto);
    const updatedPipeline = await this.pipelineRepository.save(pipeline);

    // Update stages if provided
    if (updatePipelineDto.stages !== undefined) { // Check for undefined to allow empty array to clear stages
      // Delete existing stages
      await this.pipelineStageRepository.delete({ pipelineId: id });

      // Create new stages
      if (updatePipelineDto.stages.length > 0) {
        const stages = updatePipelineDto.stages.map((stage, index) =>
          this.pipelineStageRepository.create({
            ...stage,
            pipelineId: id,
            position: index,
            leadCount: 0, // Initial lead count is 0
            isActive: stage.isActive !== undefined ? stage.isActive : true,
          }),
        );
        await this.pipelineStageRepository.save(stages);
      }
    }

    return this.findOne(tenantId, updatedPipeline.id);
  }

  /**
   * Delete pipeline
   */
  async remove(tenantId: string, id: string) {
    const pipeline = await this.pipelineRepository.findOne({
      where: { id, tenantId },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found.');
    }

    if (pipeline.isDefault) {
      throw new BadRequestException('Cannot delete default pipeline.');
    }

    if (pipeline.leadCount > 0) {
        throw new BadRequestException(`Cannot delete pipeline with ${pipeline.leadCount} leads associated.`);
    }

    await this.pipelineRepository.softDelete(id);

    return { message: 'Pipeline deleted successfully.' };
  }

  /**
   * Helper to format pipeline response
   */
  private formatPipelineResponse(pipeline: Pipeline) {
    return {
      id: pipeline.id,
      name: pipeline.name,
      description: pipeline.description,
      isDefault: pipeline.isDefault,
      isActive: pipeline.isActive,
      leadCount: pipeline.leadCount,
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
      stages: pipeline.stages
        ?.sort((a, b) => a.position - b.position)
        .map((stage) => ({
          id: stage.id,
          name: stage.name,
          color: stage.color,
          position: stage.position,
          probability: stage.probability,
          isActive: stage.isActive,
          leadCount: stage.leadCount,
          createdAt: stage.createdAt,
          updatedAt: stage.updatedAt,
        })),
    };
  }
}