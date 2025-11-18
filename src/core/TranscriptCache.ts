import { App } from 'obsidian';
import { TranscriptionResult, VideoMetadata, SummaryResult } from '../types';

/**
 * Cache entry structure
 */
export interface CacheEntry {
  videoId: string;
  platform: string;
  url: string;
  metadata: VideoMetadata;
  transcription: TranscriptionResult;
  summary?: SummaryResult;
  timestamp: number;
  expiresAt: number;
}

/**
 * Transcript Cache - Caches transcription results to avoid re-transcribing
 */
export class TranscriptCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheFile = '.transcript-cache.json';
  private app: App;
  private cacheDurationDays: number;
  private debugMode: boolean;

  constructor(app: App, cacheDurationDays: number = 30, debugMode: boolean = false) {
    this.app = app;
    this.cacheDurationDays = cacheDurationDays;
    this.debugMode = debugMode;
  }

  /**
   * Load cache from disk
   */
  async load(): Promise<void> {
    try {
      const cacheFilePath = `${this.app.vault.configDir}/${this.cacheFile}`;
      const adapter = this.app.vault.adapter;

      if (await adapter.exists(cacheFilePath)) {
        const data = await adapter.read(cacheFilePath);
        const cacheData = JSON.parse(data);

        // Restore cache entries
        if (Array.isArray(cacheData)) {
          for (const entry of cacheData) {
            const key = this.generateKey(entry.videoId, entry.platform);
            this.cache.set(key, entry);
          }
        }

        // Clean expired entries
        this.cleanExpired();

        if (this.debugMode) {
          console.log(`Cache loaded: ${this.cache.size} entries`);
        }
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('Failed to load cache:', error);
      }
      // Initialize empty cache on error
      this.cache.clear();
    }
  }

  /**
   * Save cache to disk
   */
  async save(): Promise<void> {
    try {
      const cacheFilePath = `${this.app.vault.configDir}/${this.cacheFile}`;
      const adapter = this.app.vault.adapter;

      // Convert cache to array
      const cacheData = Array.from(this.cache.values());

      // Save to file
      await adapter.write(cacheFilePath, JSON.stringify(cacheData, null, 2));

      if (this.debugMode) {
        console.log(`Cache saved: ${cacheData.length} entries`);
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('Failed to save cache:', error);
      }
    }
  }

  /**
   * Generate cache key
   */
  private generateKey(videoId: string, platform: string): string {
    return `${platform}:${videoId}`;
  }

  /**
   * Check if video is cached
   */
  has(videoId: string, platform: string): boolean {
    const key = this.generateKey(videoId, platform);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cached entry
   */
  get(videoId: string, platform: string): CacheEntry | undefined {
    const key = this.generateKey(videoId, platform);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry;
  }

  /**
   * Add entry to cache
   */
  set(
    videoId: string,
    platform: string,
    url: string,
    metadata: VideoMetadata,
    transcription: TranscriptionResult,
    summary?: SummaryResult
  ): void {
    const key = this.generateKey(videoId, platform);

    const entry: CacheEntry = {
      videoId,
      platform,
      url,
      metadata,
      transcription,
      summary,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheDurationDays * 24 * 60 * 60 * 1000,
    };

    this.cache.set(key, entry);

    // Save to disk (async, fire and forget)
    this.save().catch((err) => {
      if (this.debugMode) {
        console.error('Failed to save cache after set:', err);
      }
    });
  }

  /**
   * Remove entry from cache
   */
  delete(videoId: string, platform: string): boolean {
    const key = this.generateKey(videoId, platform);
    const deleted = this.cache.delete(key);

    if (deleted) {
      // Save to disk (async, fire and forget)
      this.save().catch((err) => {
        if (this.debugMode) {
          console.error('Failed to save cache after delete:', err);
        }
      });
    }

    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.save().catch((err) => {
      if (this.debugMode) {
        console.error('Failed to save cache after clear:', err);
      }
    });
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0 && this.debugMode) {
      console.log(`Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    cacheSize: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());

    return {
      totalEntries: entries.length,
      cacheSize: JSON.stringify(entries).length,
      oldestEntry: Math.min(...entries.map((e) => e.timestamp)),
      newestEntry: Math.max(...entries.map((e) => e.timestamp)),
    };
  }

  /**
   * Set cache duration
   */
  setCacheDuration(days: number) {
    this.cacheDurationDays = days;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
