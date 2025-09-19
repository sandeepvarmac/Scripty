// Simple in-memory rate limiter
interface RateLimitData {
  count: number
  resetTime: number
  blockedUntil?: number
}

const rateCache = new Map<string, RateLimitData>()

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 60 * 1000, // 60 seconds
  blockDurationMs: 5 * 60 * 1000, // 5 minutes
}

export class RateLimiterService {
  static async checkLimit(key: string): Promise<{
    allowed: boolean
    remainingPoints?: number
    msBeforeNext?: number
  }> {
    const now = Date.now()
    let data = rateCache.get(key)

    // Clean up expired entries
    if (data && now > data.resetTime) {
      data = undefined
    }

    // Check if currently blocked
    if (data?.blockedUntil && now < data.blockedUntil) {
      return {
        allowed: false,
        remainingPoints: 0,
        msBeforeNext: data.blockedUntil - now,
      }
    }

    // Initialize or reset window
    if (!data || now > data.resetTime) {
      data = {
        count: 0,
        resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      }
    }

    // Increment count
    data.count++

    // Check if limit exceeded
    if (data.count > RATE_LIMIT_CONFIG.maxAttempts) {
      data.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs
      rateCache.set(key, data)

      return {
        allowed: false,
        remainingPoints: 0,
        msBeforeNext: data.blockedUntil - now,
      }
    }

    rateCache.set(key, data)

    return {
      allowed: true,
      remainingPoints: RATE_LIMIT_CONFIG.maxAttempts - data.count,
      msBeforeNext: data.resetTime - now,
    }
  }

  static async resetLimit(key: string): Promise<void> {
    rateCache.delete(key)
  }

  static getRateLimitKey(type: 'login' | 'signup' | 'password_reset', identifier: string): string {
    return `${type}:${identifier}`
  }

  static getIPRateLimitKey(ip: string, type: string): string {
    return `ip:${ip}:${type}`
  }
}