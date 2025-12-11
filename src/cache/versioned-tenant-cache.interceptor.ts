import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
  CACHE_RESOURCE_KEY,
  CACHE_TTL_KEY,
  SKIP_CACHE_KEY,
} from './cache.decorators';
import { CacheVersionService } from './cache-version.service';

@Injectable()
export class VersionedTenantCacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private versions: CacheVersionService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    // only cache GET
    if (req.method !== 'GET') return next.handle();

    // allow bypass
    if (req.headers['x-cache-bypass'] === '1') return next.handle();

    // allow opt-out
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CACHE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    const tenantId = req.user?.tenantId || 'public';

    const resource =
      this.reflector.getAllAndOverride<string>(CACHE_RESOURCE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || 'generic';

    const ttlSeconds =
      this.reflector.getAllAndOverride<number>(CACHE_TTL_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? undefined;

    const version = await this.versions.getVersion(tenantId, resource);

    // include full URL + query + tenant + version
    const key = `t:${tenantId}:r:${resource}:v:${version}:${req.originalUrl}`;

    const cached = await this.cache.get(key);
    if (cached !== undefined && cached !== null) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(async (data) => {
        // cache only successful responses
        if (res?.statusCode && res.statusCode >= 400) return;

        // avoid caching undefined
        if (data === undefined) return;

        await this.cache.set(key, data, ttlSeconds);
      }),
    );
  }
}