// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { S3HealthIndicator } from './indicators/s3.health';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private s3: S3HealthIndicator,
  ) {}

  @Get()
  @Public() // Make this endpoint public
  @HealthCheck()
  @ApiOperation({ summary: 'Get application health status' })
  check() {
    return this.health.check([
      // 1. Database Check
      () => this.db.pingCheck('database', { timeout: 300 }),
      
      // 2. Memory Check: Fails if memory usage exceeds 250MB
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // Resident Set Size

      // 3. Disk Storage Check: Fails if disk usage is over 80%
      () => this.disk.checkStorage('storage', {
          thresholdPercent: 0.8,
          path: '/', // Check the root disk. Use 'C:\\' or 'D:\\' on Windows.
        }),
        
      // 4. S3 Bucket Check
      () => this.s3.isHealthy('s3_bucket'),
    ]);
  }
}