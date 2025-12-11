import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios'; // Terminus requires HttpModule
import { HealthController } from './health.controller';
import { S3HealthIndicator } from './indicators/s3.health';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [S3HealthIndicator],
})
export class HealthModule {}