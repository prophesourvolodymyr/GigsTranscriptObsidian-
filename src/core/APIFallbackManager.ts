import { VideoMetadata, VideoPlatform } from '../types';
import { RapidAPIClient } from '../api/RapidAPIClient';

/**
 * Fallback API configuration
 */
interface FallbackAPIConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  priority: number;
  enabled: boolean;
}

/**
 * API Fallback Manager - Manages multiple video extraction APIs with automatic fallback
 */
export class APIFallbackManager {
  private primaryApi: RapidAPIClient;
  private fallbackApis: FallbackAPIConfig[] = [];
  private debugMode: boolean;
  private failureCount: Map<string, number> = new Map();
  private readonly MAX_FAILURES = 3;

  constructor(primaryApiKey: string, debugMode: boolean = false) {
    this.primaryApi = new RapidAPIClient(primaryApiKey, debugMode);
    this.debugMode = debugMode;
    this.initializeFallbackApis();
  }

  /**
   * Initialize fallback API configurations
   */
  private initializeFallbackApis() {
    // Secondary RapidAPI services
    this.fallbackApis = [
      {
        name: 'TikTok Scraper',
        baseUrl: 'https://tiktok-scraper7.p.rapidapi.com',
        priority: 2,
        enabled: true,
      },
      {
        name: 'Social Media Downloader',
        baseUrl: 'https://social-media-video-downloader.p.rapidapi.com',
        priority: 3,
        enabled: true,
      },
      {
        name: 'YouTube Transcript',
        baseUrl: 'https://youtube-transcript3.p.rapidapi.com',
        priority: 4,
        enabled: true,
      },
    ];
  }

  /**
   * Extract video with automatic fallback
   */
  async extractVideo(url: string, platform: VideoPlatform): Promise<VideoMetadata> {
    // Try primary API first
    try {
      if (this.debugMode) {
        console.log('Trying primary API for video extraction');
      }

      const metadata = await this.primaryApi.extractVideo(url, platform);

      // Reset failure count on success
      this.failureCount.set('primary', 0);

      return metadata;
    } catch (primaryError) {
      if (this.debugMode) {
        console.warn('Primary API failed:', primaryError);
      }

      // Increment failure count
      const currentFailures = this.failureCount.get('primary') || 0;
      this.failureCount.set('primary', currentFailures + 1);

      // If primary API has failed too many times, mark it as temporarily disabled
      if (currentFailures >= this.MAX_FAILURES) {
        if (this.debugMode) {
          console.warn('Primary API has exceeded max failures, trying fallbacks');
        }
      }

      // Try fallback APIs
      return await this.tryFallbackApis(url, platform, primaryError);
    }
  }

  /**
   * Try fallback APIs in priority order
   */
  private async tryFallbackApis(
    url: string,
    platform: VideoPlatform,
    primaryError: any
  ): Promise<VideoMetadata> {
    // Get platform-specific fallbacks
    const suitableFallbacks = this.getSuitableFallbacks(platform);

    for (const fallback of suitableFallbacks) {
      try {
        if (this.debugMode) {
          console.log(`Trying fallback API: ${fallback.name}`);
        }

        const metadata = await this.extractWithFallback(url, platform, fallback);

        // Success! Reset failure count
        this.failureCount.set(fallback.name, 0);

        if (this.debugMode) {
          console.log(`Successfully extracted with fallback: ${fallback.name}`);
        }

        return metadata;
      } catch (fallbackError) {
        if (this.debugMode) {
          console.warn(`Fallback ${fallback.name} failed:`, fallbackError);
        }

        // Increment failure count
        const currentFailures = this.failureCount.get(fallback.name) || 0;
        this.failureCount.set(fallback.name, currentFailures + 1);

        // Continue to next fallback
        continue;
      }
    }

    // All fallbacks failed, throw original error
    throw new Error(
      `All video extraction APIs failed. Primary error: ${primaryError.message}`
    );
  }

  /**
   * Get suitable fallback APIs for platform
   */
  private getSuitableFallbacks(platform: VideoPlatform): FallbackAPIConfig[] {
    return this.fallbackApis
      .filter((api) => {
        // Filter by platform compatibility
        if (!api.enabled) return false;

        // Platform-specific filtering
        if (platform === 'tiktok' && api.name === 'TikTok Scraper') {
          return true;
        }
        if (platform === 'youtube' && api.name === 'YouTube Transcript') {
          return true;
        }
        if (api.name === 'Social Media Downloader') {
          return true; // Supports multiple platforms
        }

        return false;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Extract video using specific fallback API
   */
  private async extractWithFallback(
    url: string,
    platform: VideoPlatform,
    fallback: FallbackAPIConfig
  ): Promise<VideoMetadata> {
    // This is a simplified implementation
    // In production, you'd implement specific logic for each fallback API

    // For now, we'll use a generic approach
    // Platform-specific implementations would go here

    throw new Error(`Fallback API ${fallback.name} not fully implemented yet`);
  }

  /**
   * Add custom fallback API
   */
  addFallbackApi(config: FallbackAPIConfig) {
    this.fallbackApis.push(config);
    this.fallbackApis.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Enable/disable fallback API
   */
  setFallbackEnabled(name: string, enabled: boolean) {
    const api = this.fallbackApis.find((a) => a.name === name);
    if (api) {
      api.enabled = enabled;
    }
  }

  /**
   * Get fallback status
   */
  getFallbackStatus(): {
    api: string;
    enabled: boolean;
    failures: number;
    status: 'healthy' | 'degraded' | 'disabled';
  }[] {
    const status = [
      {
        api: 'Primary API',
        enabled: true,
        failures: this.failureCount.get('primary') || 0,
        status: (this.failureCount.get('primary') || 0) >= this.MAX_FAILURES
          ? 'degraded'
          : 'healthy',
      },
    ];

    for (const fallback of this.fallbackApis) {
      const failures = this.failureCount.get(fallback.name) || 0;
      status.push({
        api: fallback.name,
        enabled: fallback.enabled,
        failures,
        status: !fallback.enabled
          ? 'disabled'
          : failures >= this.MAX_FAILURES
          ? 'degraded'
          : 'healthy',
      });
    }

    return status;
  }

  /**
   * Reset failure counts
   */
  resetFailures() {
    this.failureCount.clear();
  }

  /**
   * Update primary API key
   */
  updatePrimaryApiKey(apiKey: string) {
    this.primaryApi.updateApiKey(apiKey);
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    this.primaryApi.setDebugMode(enabled);
  }
}
