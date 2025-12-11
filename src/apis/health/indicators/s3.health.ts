import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3HealthIndicator extends HealthIndicator {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    super();
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION'),
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // We send a lightweight HeadBucket command to check if we can access the bucket.
      const command = new HeadBucketCommand({ Bucket: this.bucketName });
      await this.s3Client.send(command);
      return this.getStatus(key, true);
    } catch (error) {
      const errorMessage = `S3 health check failed for bucket: ${this.bucketName}`;
      console.error(errorMessage, error);
      throw new HealthCheckError(errorMessage, this.getStatus(key, false, { message: error.message }));
    }
  }
}