import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { cacheConfig } from './cache.config';
import { CacheVersionService } from './cache-version.service';
import { VersionedTenantCacheInterceptor } from './versioned-tenant-cache.interceptor';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: cacheConfig,
    }),
  ],
  providers: [
    CacheVersionService,
    { provide: APP_INTERCEPTOR, useClass: VersionedTenantCacheInterceptor },
  ],
  exports: [CacheVersionService],
})
export class AppCacheModule {}