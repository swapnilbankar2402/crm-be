import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

export async function cacheConfig(config: ConfigService): Promise<CacheModuleOptions> {
  const ttl = config.get<number>('CACHE_TTL_SECONDS', 60);
  const store = config.get<string>('CACHE_STORE', 'memory');

  if (store === 'redis') {
    return {
      ttl,
      store: await redisStore({
        socket: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
        password: config.get<string>('REDIS_PASSWORD') || undefined,
      }),
    };
  }

  return {
    ttl,
    max: config.get<number>('CACHE_MAX_ITEMS', 1000),
  };
}