import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis;
  private isConnected = false;

  // Default TTL values in seconds
  static readonly TTL = {
    SHORT: 60,           // 1 minute - for frequently changing data
    MEDIUM: 300,         // 5 minutes - for moderately changing data
    LONG: 1800,          // 30 minutes - for rarely changing data
    VERY_LONG: 3600,     // 1 hour - for static data
    DAY: 86400,          // 24 hours - for very static data
    // Specific TTL values for different data types
    MOVIES: 1800,        // 30 minutes - movies list
    MOVIES_DETAIL: 3600, // 1 hour - movie details
    THEATERS: 3600,      // 1 hour - theaters list
    SHOWTIMES: 600,      // 10 minutes - showtimes (5-10 min range)
    BANNERS: 1800,       // 30 minutes - banners/posters
    TICKET_PRICES: 900,  // 15 minutes - ticket prices (10-15 min range)
    GENRES: 86400,       // 24 hours (1 day) - genres list
    USER_PROFILE: 600,   // 10 minutes - user profile (5-10 min range)
  };

  // Cache key prefixes for different entities
  static readonly KEYS = {
    MOVIES: 'movies',
    MOVIE: 'movie',
    THEATERS: 'theaters',
    THEATER: 'theater',
    SHOWTIMES: 'showtimes',
    SHOWTIME: 'showtime',
    SHOWTIMES_BY_DATE: 'showtimes:date',
    SHOWTIMES_BY_MOVIE: 'showtimes:movie',
    BANNERS: 'banners',
    NEWS: 'news',
    NEWS_ITEM: 'news:item',
    PROMOTIONS: 'promotions',
    SCREENS: 'screens',
    SCREEN: 'screen',
    GENRES: 'genres',
    TICKET_PRICES: 'ticket_prices',
    USER_PROFILE: 'user:profile',
  };

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // TEMP: disable Redis caching completely (no connection, no cache usage)
    this.logger.warn('Redis caching is temporarily disabled (no connection will be established).');
    this.isConnected = false;
    return;

    // Original connection code kept below for future re‑enable
    /*
    try {
      this.client = new Redis({
        host: this.configService.get<string>('REDIS_HOST', '127.0.0.1'),
        port: Number(this.configService.get<string>('REDIS_PORT', '6379')),
        password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
        db: Number(this.configService.get<string>('REDIS_CACHE_DB', '1')), // Use DB 1 for caching, DB 0 for BullMQ
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed after 3 retries, caching disabled');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('✅ Redis Cache connected successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis Cache error: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis Cache connection closed');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.warn(`Failed to connect to Redis Cache: ${error.message}. Caching disabled.`);
      this.isConnected = false;
    }
    */
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Check if Redis is connected
   */
  isAvailable(): boolean {
    // Caching is disabled, always return false
    return false;
  }

  /**
   * Generate a cache key with prefix
   */
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return [prefix, ...parts.map(p => String(p))].join(':');
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const data = await this.client.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = RedisCacheService.TTL.MEDIUM): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete a specific key
   */
  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.warn(`Cache del error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delByPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      const deleted = await this.client.del(...keys);
      this.logger.debug(`Deleted ${deleted} keys matching pattern: ${pattern}`);
      return deleted;
    } catch (error) {
      this.logger.warn(`Cache delByPattern error for pattern ${pattern}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Invalidate cache for a specific entity type
   */
  async invalidateEntity(prefix: string, id?: number | string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      if (id !== undefined) {
        // Delete specific entity
        await this.del(this.generateKey(prefix, id));
      }
      // Always delete list caches for this entity type
      await this.delByPattern(`${prefix}:*`);
      await this.delByPattern(`${prefix}s:*`); // Plural form
    } catch (error) {
      this.logger.warn(`Cache invalidateEntity error: ${error.message}`);
    }
  }

  /**
   * Get or set cache - returns cached value if exists, otherwise calls factory and caches result
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttlSeconds: number = RedisCacheService.TTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache HIT for key: ${key}`);
      return cached;
    }

    // Cache miss - call factory
    this.logger.debug(`Cache MISS for key: ${key}`);
    const result = await factory();
    
    // Store in cache (don't await to not block response)
    this.set(key, result, ttlSeconds).catch(() => {});
    
    return result;
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client.flushdb();
      this.logger.log('Cache flushed successfully');
      return true;
    } catch (error) {
      this.logger.warn(`Cache flush error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string } | null> {
    if (!this.isAvailable()) return null;

    try {
      const info = await this.client.info('memory');
      const dbsize = await this.client.dbsize();
      
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';
      
      return { keys: dbsize, memory };
    } catch (error) {
      this.logger.warn(`Cache getStats error: ${error.message}`);
      return null;
    }
  }

  /**
   * Invalidate all movie-related caches
   */
  async invalidateMovies(movieId?: number): Promise<void> {
    await this.invalidateEntity(RedisCacheService.KEYS.MOVIE, movieId);
    await this.delByPattern(`${RedisCacheService.KEYS.MOVIES}*`);
    // Also invalidate showtimes as they depend on movies
    await this.delByPattern(`${RedisCacheService.KEYS.SHOWTIMES}*`);
  }

  /**
   * Invalidate all theater-related caches
   */
  async invalidateTheaters(theaterId?: number): Promise<void> {
    await this.invalidateEntity(RedisCacheService.KEYS.THEATER, theaterId);
    await this.delByPattern(`${RedisCacheService.KEYS.THEATERS}*`);
    // Also invalidate screens and showtimes
    await this.delByPattern(`${RedisCacheService.KEYS.SCREENS}*`);
    await this.delByPattern(`${RedisCacheService.KEYS.SHOWTIMES}*`);
  }

  /**
   * Invalidate all showtime-related caches
   */
  async invalidateShowtimes(showtimeId?: number): Promise<void> {
    await this.invalidateEntity(RedisCacheService.KEYS.SHOWTIME, showtimeId);
    await this.delByPattern(`${RedisCacheService.KEYS.SHOWTIMES}*`);
  }

  /**
   * Invalidate banner caches
   */
  async invalidateBanners(): Promise<void> {
    await this.delByPattern(`${RedisCacheService.KEYS.BANNERS}*`);
  }

  /**
   * Invalidate news caches
   */
  async invalidateNews(newsId?: number): Promise<void> {
    await this.invalidateEntity(RedisCacheService.KEYS.NEWS_ITEM, newsId);
    await this.delByPattern(`${RedisCacheService.KEYS.NEWS}*`);
  }

  /**
   * Invalidate promotion caches
   */
  async invalidatePromotions(): Promise<void> {
    await this.delByPattern(`${RedisCacheService.KEYS.PROMOTIONS}*`);
  }

  /**
   * Invalidate screen caches
   */
  async invalidateScreens(screenId?: number): Promise<void> {
    await this.invalidateEntity(RedisCacheService.KEYS.SCREEN, screenId);
    await this.delByPattern(`${RedisCacheService.KEYS.SCREENS}*`);
    // Also invalidate showtimes
    await this.delByPattern(`${RedisCacheService.KEYS.SHOWTIMES}*`);
  }
}


