import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheVersionService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  private key(tenantId: string, resource: string) {
    return `t:${tenantId}:v:${resource}`;
  }

  async getVersion(tenantId: string, resource: string): Promise<number> {
    const v = await this.cache.get<number>(this.key(tenantId, resource));
    return v ?? 1;
  }

  async bump(tenantId: string, resource: string): Promise<number> {
    const next = (await this.getVersion(tenantId, resource)) + 1;
    // 0 TTL = store indefinitely (depends on store; works for redis-yet and memory)
    await this.cache.set(this.key(tenantId, resource), next, 0);
    return next;
  }
}