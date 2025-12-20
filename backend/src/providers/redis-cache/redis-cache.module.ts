import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisCacheService } from './redis-cache.service';
import { CacheController } from './cache.controller';
import { CacheInterceptor } from './cache.interceptor';
import { CacheInvalidateInterceptor } from './cache-invalidate.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [CacheController],
  providers: [
    RedisCacheService,
    // Register interceptors globally
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInvalidateInterceptor,
    },
  ],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}

