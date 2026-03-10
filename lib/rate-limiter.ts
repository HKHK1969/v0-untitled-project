interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
    this.config = config

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime < now) {
        this.requests.delete(key)
      }
    }
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    if (!entry || entry.resetTime < now) {
      // New window
      const resetTime = now + this.config.windowMs
      this.requests.set(identifier, { count: 1, resetTime })
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
      }
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    // Increment count
    entry.count++
    this.requests.set(identifier, entry)

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }
}

// Create rate limiter instances for different endpoints
export const apiRateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 100 })
export const aiAssistantRateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 20 })
