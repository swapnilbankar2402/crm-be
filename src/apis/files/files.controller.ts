import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard, RolesGuard } from 'src/auth/guards';
import { CurrentTenant, CurrentUser, Roles } from 'src/auth/decorators';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        entityType: {
          type: 'string',
          enum: ['lead', 'contact', 'company', 'deal', 'task', 'note'],
          nullable: true,
        },
        entityId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
        },
        isPublic: {
          type: 'boolean',
          default: false,
          nullable: true,
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a file' })
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    // Convert isPublic from string to boolean if it comes from form-data
    if (typeof dto.isPublic === 'string') {
      dto.isPublic = dto.isPublic === 'true';
    }
    return this.filesService.uploadFile(file, dto, tenantId, userId);
  }
  
  @Get('entity/:entityType/:entityId')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get all files for a specific entity' })
  @ApiParam({ name: 'entityType', enum: ['lead', 'contact', 'company', 'deal', 'task', 'note'] })
  @ApiParam({ name: 'entityId', type: 'string', format: 'uuid' })
  findByEntity(
    @CurrentTenant() tenantId: string,
    @Param('entityType') entityType: string,
    @Param('entityId', new ParseUUIDPipe()) entityId: string,
  ) {
    return this.filesService.findByEntity(tenantId, entityType, entityId);
  }

  @Get(':id/download-url')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get a temporary download URL for a private file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  getDownloadUrl(
    @CurrentTenant() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.filesService.getDownloadUrl(tenantId, id);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support', 'viewer')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.filesService.findOne(tenantId, id);
  }

  @Delete(':id')
  @Roles('admin', 'manager', 'sales-rep', 'support')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  deleteFile(
    @CurrentTenant() tenantId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.filesService.deleteFile(tenantId, id);
  }
}