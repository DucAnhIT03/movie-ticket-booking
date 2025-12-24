import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../../../providers/redis-cache/redis-cache.service';

interface LoginAttemptData {
  count: number;
  blockedUntil: number | null; // timestamp in milliseconds
}

@Injectable()
export class LoginAttemptService {
  private readonly logger = new Logger(LoginAttemptService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_KEY_PREFIX = 'login_attempts';
  
  // In-memory fallback if Redis is not available
  private memoryCache = new Map<string, LoginAttemptData>();

  constructor(private readonly redisCache: RedisCacheService) {}

  /**
   * Get cache key for IP address
   */
  private getCacheKey(ip: string): string {
    return `${this.CACHE_KEY_PREFIX}:${ip}`;
  }

  /**
   * Get client IP address from request
   */
  getIpAddress(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1'
    );
  }

  /**
   * Check if IP is blocked
   */
  async isBlocked(ip: string): Promise<{ blocked: boolean; blockedUntil?: number }> {
    const key = this.getCacheKey(ip);
    
    try {
      // Try Redis first
      if (this.redisCache.isAvailable()) {
        const data = await this.redisCache.get<LoginAttemptData>(key);
        if (data) {
          const now = Date.now();
          if (data.blockedUntil && now < data.blockedUntil) {
            return { blocked: true, blockedUntil: data.blockedUntil };
          }
          // Block period expired, reset
          if (data.blockedUntil && now >= data.blockedUntil) {
            await this.resetAttempts(ip);
            return { blocked: false };
          }
        }
        return { blocked: false };
      }
    } catch (error) {
      this.logger.warn(`Redis check failed, using memory cache: ${error.message}`);
    }

    // Fallback to memory cache
    const data = this.memoryCache.get(ip);
    if (data) {
      const now = Date.now();
      if (data.blockedUntil && now < data.blockedUntil) {
        return { blocked: true, blockedUntil: data.blockedUntil };
      }
      // Block period expired, reset
      if (data.blockedUntil && now >= data.blockedUntil) {
        this.memoryCache.delete(ip);
        return { blocked: false };
      }
    }

    return { blocked: false };
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(ip: string): Promise<void> {
    const key = this.getCacheKey(ip);
    
    try {
      // Try Redis first
      if (this.redisCache.isAvailable()) {
        const existing = await this.redisCache.get<LoginAttemptData>(key);
        const newCount = (existing?.count || 0) + 1;
        const now = Date.now();
        
        let blockedUntil: number | null = null;
        if (newCount >= this.MAX_ATTEMPTS) {
          blockedUntil = now + this.BLOCK_DURATION_MS;
        }

        const data: LoginAttemptData = {
          count: newCount,
          blockedUntil,
        };

        // Store with TTL (block duration + 1 minute buffer)
        const ttl = blockedUntil 
          ? Math.ceil((this.BLOCK_DURATION_MS + 60000) / 1000)
          : RedisCacheService.TTL.MEDIUM;
        
        await this.redisCache.set(key, data, ttl);
        this.logger.warn(`Failed login attempt ${newCount}/${this.MAX_ATTEMPTS} from IP: ${ip}`);
        
        if (blockedUntil) {
          this.logger.warn(`IP ${ip} blocked until ${new Date(blockedUntil).toISOString()}`);
        }
        return;
      }
    } catch (error) {
      this.logger.warn(`Redis record failed, using memory cache: ${error.message}`);
    }

    // Fallback to memory cache
    const existing = this.memoryCache.get(ip);
    const newCount = (existing?.count || 0) + 1;
    const now = Date.now();
    
    let blockedUntil: number | null = null;
    if (newCount >= this.MAX_ATTEMPTS) {
      blockedUntil = now + this.BLOCK_DURATION_MS;
    }

    const data: LoginAttemptData = {
      count: newCount,
      blockedUntil,
    };

    this.memoryCache.set(ip, data);
    this.logger.warn(`Failed login attempt ${newCount}/${this.MAX_ATTEMPTS} from IP: ${ip}`);
    
    if (blockedUntil) {
      this.logger.warn(`IP ${ip} blocked until ${new Date(blockedUntil).toISOString()}`);
      
      // Auto-cleanup after block period
      setTimeout(() => {
        this.memoryCache.delete(ip);
      }, this.BLOCK_DURATION_MS);
    }
  }

  /**
   * Reset failed attempts (on successful login)
   */
  async resetAttempts(ip: string): Promise<void> {
    const key = this.getCacheKey(ip);
    
    try {
      if (this.redisCache.isAvailable()) {
        await this.redisCache.del(key);
        return;
      }
    } catch (error) {
      this.logger.warn(`Redis reset failed, using memory cache: ${error.message}`);
    }

    // Fallback to memory cache
    this.memoryCache.delete(ip);
  }

  /**
   * Get remaining time until unblock (in seconds)
   */
  async getRemainingBlockTime(ip: string): Promise<number> {
    const key = this.getCacheKey(ip);
    
    try {
      if (this.redisCache.isAvailable()) {
        const data = await this.redisCache.get<LoginAttemptData>(key);
        if (data?.blockedUntil) {
          const remaining = Math.ceil((data.blockedUntil - Date.now()) / 1000);
          return remaining > 0 ? remaining : 0;
        }
        return 0;
      }
    } catch (error) {
      this.logger.warn(`Redis get remaining time failed: ${error.message}`);
    }

    // Fallback to memory cache
    const data = this.memoryCache.get(ip);
    if (data?.blockedUntil) {
      const remaining = Math.ceil((data.blockedUntil - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }

    return 0;
  }
}


