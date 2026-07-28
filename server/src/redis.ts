import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Define Redis URL; fallback to localhost if not provided
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisCache {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(REDIS_URL, {
      // Retry strategy to gracefully handle connection failures
      retryStrategy(times) {
        // Stop retrying after 3 attempts and fallback to direct DB queries
        if (times > 3) {
          console.warn('[Redis] Max retries reached, disabling cache.');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 1, // Don't block indefinitely on failures
    });

    this.client.on('connect', () => {
      console.log('[Redis] Connected successfully.');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      if (this.isConnected) {
         console.warn(`[Redis] Connection error: ${err.message}`);
      }
      this.isConnected = false;
    });
    
    this.client.on('end', () => {
       this.isConnected = false;
    });
  }

  /**
   * Retrieves data from the cache.
   * Returns null if cache miss or Redis is unavailable.
   */
  async get(key: string): Promise<any | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn(`[Redis] Get Error for key ${key}:`, err);
      return null;
    }
  }

  /**
   * Sets data in the cache with a specified TTL (Time-To-Live).
   * Default TTL is 3600 seconds (1 hour).
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`[Redis] Set Error for key ${key}:`, err);
    }
  }

  /**
   * Deletes one or multiple keys from the cache.
   * Supports wildcard invalidation by finding keys matching a pattern.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(`[Redis] Invalidated ${keys.length} keys matching ${pattern}`);
      }
    } catch (err) {
       console.warn(`[Redis] Invalidate Error for pattern ${pattern}:`, err);
    }
  }
}

// Export a singleton instance
export const redisCache = new RedisCache();
