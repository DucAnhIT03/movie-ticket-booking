import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RedisCacheService } from './redis-cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Only cache GET requests
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache metadata from decorator
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );
    
    if (!cacheKey) {
      return next.handle();
    }

    const ttl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    ) || RedisCacheService.TTL.MEDIUM;

    // Generate full cache key including query params
    const queryString = request.url.includes('?') 
      ? request.url.split('?')[1] 
      : '';
    const fullKey = queryString ? `${cacheKey}:${queryString}` : cacheKey;

    // Try to get from cache
    const cached = await this.cacheService.get(fullKey);
    if (cached !== null) {
      this.logger.debug(`Cache HIT: ${fullKey}`);
      return of(cached);
    }

    // Cache miss - execute handler and cache result
    this.logger.debug(`Cache MISS: ${fullKey}`);
    return next.handle().pipe(
      tap(async (data) => {
        // Only cache successful responses
        if (data !== undefined && data !== null) {
          await this.cacheService.set(fullKey, data, ttl);
        }
      }),
    );
  }
}


