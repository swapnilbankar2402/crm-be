import { SetMetadata } from '@nestjs/common';

export const CACHE_RESOURCE_KEY = 'cache_resource';
export const CACHE_TTL_KEY = 'cache_ttl_seconds';
export const SKIP_CACHE_KEY = 'skip_cache';

export const CacheResource = (resource: string) => SetMetadata(CACHE_RESOURCE_KEY, resource);
export const CacheTtl = (seconds: number) => SetMetadata(CACHE_TTL_KEY, seconds);
export const SkipCache = () => SetMetadata(SKIP_CACHE_KEY, true);