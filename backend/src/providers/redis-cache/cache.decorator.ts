import { SetMetadata, applyDecorators } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Decorator to enable caching for a controller method
 * @param key - Cache key prefix
 * @param ttl - Time to live in seconds (default: 5 minutes)
 */
export const CacheResponse = (key: string, ttl: number = RedisCacheService.TTL.MEDIUM) => {
  return applyDecorators(
    SetMetadata(CACHE_KEY_METADATA, key),
    SetMetadata(CACHE_TTL_METADATA, ttl),
  );
};

/**
 * Mark a method to invalidate cache after execution
 * Used for POST, PUT, PATCH, DELETE operations
 */
export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

export const InvalidateCache = (...patterns: string[]) => {
  return SetMetadata(CACHE_INVALIDATE_METADATA, patterns);
};


