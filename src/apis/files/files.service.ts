import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import { FileEntityType, Files } from 'src/common/entities/file.entity';
import { UploadFileDto } from './dto/upload-file.dto';


@Injectable()
export class FilesService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(
    @InjectRepository(Files)
    private fileRepository: Repository<Files>,
    private configService: ConfigService,
  ) {
    this.region = this.configService.get<string>('S3_REGION');
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Uploads a file to S3 and creates a record in the database.
   */
  async uploadFile(
    file: Express.Multer.File,
    dto: UploadFileDto,
    tenantId: string,
    userId: string,
  ): Promise<Files> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    const fileExtension = file.originalname.split('.').pop();
    const s3Key = `${tenantId}/${nanoid()}.${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const s3Url = `${this.configService.get<string>('S3_ENDPOINT')}/${this.bucketName}/${s3Key}`;

    // Create database record
    const fileRecord = this.fileRepository.create({
      tenantId,
      uploadedByUserId: userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      s3Key,
      s3Url,
      entityType: dto.entityType,
      entityId: dto.entityId,
      isPublic: dto.isPublic || false,
    });

    return this.fileRepository.save(fileRecord);
  }

  /**
   * Finds a file record by its ID.
   */
  async findOne(tenantId: string, id: string): Promise<Files> {
    const file = await this.fileRepository.findOne({ where: { id, tenantId } });
    if (!file) {
      throw new NotFoundException('File not found.');
    }
    return file;
  }

  /**
   * Generates a temporary, secure URL to download a private file.
   */
  async getDownloadUrl(tenantId: string, id: string): Promise<{ url: string }> {
    const file = await this.findOne(tenantId, id);

    if (file.isPublic) {
      return { url: file.s3Url };
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: file.s3Key,
    });

    // Signed URL expires in 15 minutes
    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });

    return { url: signedUrl };
  }
  
  /**
   * Finds all files associated with a specific entity.
   */
  // async findByEntity(
  //   tenantId: string,
  //   entityType: string,
  //   entityId: string,
  // ): Promise<Files[]> {
  //   return this.fileRepository.find({
  //     where: {
  //       tenantId,
  //       entityType,
  //       entityId,
  //     },
  //     order: {
  //       createdAt: 'DESC',
  //     },
  //   });
  // }

  async findByEntity(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<Files[]> {
    // 1. Validate the entityType string against our allowed enum values
    const allowedEntityTypes = Object.values(FileEntityType);
    if (!allowedEntityTypes.includes(entityType as FileEntityType)) {
      throw new BadRequestException(`Invalid entityType: "${entityType}". Allowed types are: ${allowedEntityTypes.join(', ')}`);
    }

    // 2. Perform the query using the validated and asserted type
    return this.fileRepository.find({
      where: {
        tenantId,
        entityType: entityType as FileEntityType, // Assert the type for TypeORM
        entityId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Deletes a file from S3 and the database.
   */
  async deleteFile(tenantId: string, id: string): Promise<{ message: string }> {
    const file = await this.findOne(tenantId, id);

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: file.s3Key,
    });

    await this.s3Client.send(command);

    // Delete from database
    await this.fileRepository.remove(file);

    return { message: 'File deleted successfully.' };
  }
}