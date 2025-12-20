import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RedisCacheService } from './redis-cache.service';
import { CACHE_INVALIDATE_METADATA } from './cache.decorator';

@Injectable()
export class CacheInvalidateInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidateInterceptor.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const patterns = this.reflector.get<string[]>(
      CACHE_INVALIDATE_METADATA,
      context.getHandler(),
    );

    if (!patterns || patterns.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        // Invalidate all specified patterns after successful execution
        for (const pattern of patterns) {
          await this.cacheService.delByPattern(`${pattern}*`);
          this.logger.debug(`Cache invalidated: ${pattern}*`);
        }
      }),
    );
  }
}


