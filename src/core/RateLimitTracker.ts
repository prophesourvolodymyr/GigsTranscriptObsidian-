import { Notice } from 'obsidian';

/**
 * Rate limit configuration for an API
 */
export interface RateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  requestsPerMonth?: number;
}

/**
 * Request record
 */
interface RequestRecord {
  timestamp: number;
  service: string;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  service: string;
  requestsInLastMinute: number;
  requestsInLastHour: number;
  requestsInLastDay: number;
  requestsInLastMonth: number;
  isLimited: boolean;
  percentageUsed: number;
  estimatedResetTime?: number;
}

/**
 * Rate Limit Tracker - Tracks API usage and prevents rate limit violations
 */
export class RateLimitTracker {
  private requests: RequestRecord[] = [];
  private limits: Map<string, RateLimitConfig> = new Map();
  private debugMode: boolean;

  // Time windows in milliseconds
  private readonly MINUTE = 60 * 1000;
  private readonly HOUR = 60 * this.MINUTE;
  private readonly DAY = 24 * this.HOUR;
  private readonly MONTH = 30 * this.DAY;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
    this.initializeDefaultLimits();
  }

  /**
   * Initialize default rate limits for common APIs
   */
  private initializeDefaultLimits() {
    // RapidAPI default limits (varies by subscription)
    this.limits.set('rapidapi', {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 500,
      requestsPerMonth: 10000,
    });

    // OpenAI Whisper API
    this.limits.set('whisper', {
      requestsPerMinute: 50,
    });

    // OpenAI GPT API
    this.limits.set('openai', {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
    });

    // Google Gemini (free tier)
    this.limits.set('gemini', {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
    });

    // Anthropic Claude
    this.limits.set('claude', {
      requestsPerMinute: 50,
      requestsPerDay: 1000,
    });
  }

  /**
   * Set rate limit for a service
   */
  setLimit(service: string, config: RateLimitConfig) {
    this.limits.set(service, config);
  }

  /**
   * Track a request
   */
  trackRequest(service: string): void {
    const record: RequestRecord = {
      timestamp: Date.now(),
      service,
    };

    this.requests.push(record);

    // Clean up old requests (older than 1 month)
    this.cleanupOldRequests();

    if (this.debugMode) {
      console.log(`Request tracked for ${service}`, this.getStatus(service));
    }
  }

  /**
   * Check if request would exceed rate limit
   */
  wouldExceedLimit(service: string): boolean {
    const status = this.getStatus(service);
    return status.isLimited;
  }

  /**
   * Check if request is allowed (throws error if not)
   */
  checkLimit(service: string): void {
    if (this.wouldExceedLimit(service)) {
      const status = this.getStatus(service);
      const resetTime = status.estimatedResetTime
        ? new Date(status.estimatedResetTime).toLocaleTimeString()
        : 'unknown';

      throw new Error(
        `Rate limit exceeded for ${service}. Estimated reset: ${resetTime}. Please wait before trying again.`
      );
    }
  }

  /**
   * Get rate limit status for a service
   */
  getStatus(service: string): RateLimitStatus {
    const now = Date.now();
    const config = this.limits.get(service);

    if (!config) {
      return {
        service,
        requestsInLastMinute: 0,
        requestsInLastHour: 0,
        requestsInLastDay: 0,
        requestsInLastMonth: 0,
        isLimited: false,
        percentageUsed: 0,
      };
    }

    // Count requests in each time window
    const serviceRequests = this.requests.filter((r) => r.service === service);

    const requestsInLastMinute = serviceRequests.filter(
      (r) => now - r.timestamp < this.MINUTE
    ).length;
    const requestsInLastHour = serviceRequests.filter((r) => now - r.timestamp < this.HOUR).length;
    const requestsInLastDay = serviceRequests.filter((r) => now - r.timestamp < this.DAY).length;
    const requestsInLastMonth = serviceRequests.filter(
      (r) => now - r.timestamp < this.MONTH
    ).length;

    // Check if any limit is exceeded
    const limits = [
      {
        current: requestsInLastMinute,
        max: config.requestsPerMinute,
        window: this.MINUTE,
      },
      {
        current: requestsInLastHour,
        max: config.requestsPerHour,
        window: this.HOUR,
      },
      {
        current: requestsInLastDay,
        max: config.requestsPerDay,
        window: this.DAY,
      },
      {
        current: requestsInLastMonth,
        max: config.requestsPerMonth,
        window: this.MONTH,
      },
    ];

    let isLimited = false;
    let estimatedResetTime: number | undefined;
    let maxPercentage = 0;

    for (const limit of limits) {
      if (limit.max !== undefined) {
        const percentage = (limit.current / limit.max) * 100;
        maxPercentage = Math.max(maxPercentage, percentage);

        if (limit.current >= limit.max) {
          isLimited = true;

          // Find oldest request in this window
          const oldestInWindow = serviceRequests
            .filter((r) => now - r.timestamp < limit.window)
            .sort((a, b) => a.timestamp - b.timestamp)[0];

          if (oldestInWindow) {
            estimatedResetTime = oldestInWindow.timestamp + limit.window;
          }
        }
      }
    }

    // Warn at 80% usage
    if (maxPercentage >= 80 && maxPercentage < 100 && !isLimited) {
      new Notice(
        `⚠️ ${service} API usage at ${maxPercentage.toFixed(0)}%. Consider slowing down requests.`,
        3000
      );
    }

    return {
      service,
      requestsInLastMinute,
      requestsInLastHour,
      requestsInLastDay,
      requestsInLastMonth,
      isLimited,
      percentageUsed: maxPercentage,
      estimatedResetTime,
    };
  }

  /**
   * Get all statuses
   */
  getAllStatuses(): RateLimitStatus[] {
    const services = Array.from(this.limits.keys());
    return services.map((service) => this.getStatus(service));
  }

  /**
   * Clean up requests older than 1 month
   */
  private cleanupOldRequests(): void {
    const cutoff = Date.now() - this.MONTH;
    const beforeCount = this.requests.length;

    this.requests = this.requests.filter((r) => r.timestamp > cutoff);

    if (this.debugMode && beforeCount !== this.requests.length) {
      console.log(`Cleaned up ${beforeCount - this.requests.length} old requests`);
    }
  }

  /**
   * Reset tracking for a service
   */
  resetService(service: string): void {
    this.requests = this.requests.filter((r) => r.service !== service);
  }

  /**
   * Reset all tracking
   */
  resetAll(): void {
    this.requests = [];
  }

  /**
   * Get wait time until next request is allowed (in ms)
   */
  getWaitTime(service: string): number {
    const status = this.getStatus(service);

    if (!status.isLimited) {
      return 0;
    }

    if (status.estimatedResetTime) {
      return Math.max(0, status.estimatedResetTime - Date.now());
    }

    return 0;
  }

  /**
   * Wait until request is allowed
   */
  async waitUntilAllowed(service: string): Promise<void> {
    const waitTime = this.getWaitTime(service);

    if (waitTime > 0) {
      if (this.debugMode) {
        console.log(`Waiting ${waitTime}ms for ${service} rate limit to reset`);
      }

      new Notice(
        `Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s before continuing...`,
        waitTime
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Export usage statistics
   */
  getStatistics(): {
    totalRequests: number;
    byService: Record<string, number>;
    timeRange: { start: number; end: number };
  } {
    const byService: Record<string, number> = {};

    for (const request of this.requests) {
      if (!byService[request.service]) {
        byService[request.service] = 0;
      }
      byService[request.service]++;
    }

    const timestamps = this.requests.map((r) => r.timestamp);

    return {
      totalRequests: this.requests.length,
      byService,
      timeRange: {
        start: timestamps.length > 0 ? Math.min(...timestamps) : 0,
        end: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      },
    };
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
