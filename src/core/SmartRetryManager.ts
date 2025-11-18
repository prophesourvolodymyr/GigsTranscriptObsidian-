import { DetectedVideoLink } from '../types';

/**
 * Retry attempt record
 */
interface RetryAttempt {
  timestamp: number;
  error: string;
  link: DetectedVideoLink;
}

/**
 * Retry strategy
 */
type RetryStrategy = 'immediate' | 'exponential' | 'scheduled' | 'manual';

/**
 * Smart Retry Manager - Intelligently retries failed transcriptions
 */
export class SmartRetryManager {
  private failedTranscriptions: Map<string, RetryAttempt[]> = new Map();
  private retryQueue: Set<string> = new Set();
  private debugMode: boolean;

  // Retry configuration
  private readonly MAX_AUTO_RETRIES = 3;
  private readonly RETRY_DELAYS = [5000, 15000, 60000]; // 5s, 15s, 60s

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Record failed transcription
   */
  recordFailure(link: DetectedVideoLink, error: Error): void {
    const key = this.generateKey(link);

    if (!this.failedTranscriptions.has(key)) {
      this.failedTranscriptions.set(key, []);
    }

    const attempts = this.failedTranscriptions.get(key)!;
    attempts.push({
      timestamp: Date.now(),
      error: error.message,
      link,
    });

    if (this.debugMode) {
      console.log(`Recorded failure for ${link.url} (${attempts.length} attempts)`);
    }

    // Add to retry queue if appropriate
    if (this.shouldAutoRetry(link, error)) {
      this.addToRetryQueue(key);
    }
  }

  /**
   * Check if should auto-retry
   */
  private shouldAutoRetry(link: DetectedVideoLink, error: Error): boolean {
    const key = this.generateKey(link);
    const attempts = this.failedTranscriptions.get(key) || [];

    // Don't auto-retry if max attempts reached
    if (attempts.length >= this.MAX_AUTO_RETRIES) {
      return false;
    }

    // Check error type - some errors shouldn't be retried
    const errorMessage = error.message.toLowerCase();

    // Non-retryable errors
    if (
      errorMessage.includes('invalid api key') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('invalid url')
    ) {
      return false;
    }

    // Retryable errors (network, rate limit, server errors)
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503')
    ) {
      return true;
    }

    // By default, don't auto-retry unknown errors after first attempt
    return attempts.length === 0;
  }

  /**
   * Add to retry queue
   */
  private addToRetryQueue(key: string): void {
    this.retryQueue.add(key);

    if (this.debugMode) {
      console.log(`Added to retry queue: ${key}`);
    }
  }

  /**
   * Get retry delay for attempt number
   */
  getRetryDelay(link: DetectedVideoLink): number {
    const key = this.generateKey(link);
    const attempts = this.failedTranscriptions.get(key) || [];
    const attemptNumber = attempts.length;

    if (attemptNumber >= this.RETRY_DELAYS.length) {
      return this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
    }

    return this.RETRY_DELAYS[attemptNumber];
  }

  /**
   * Get all failed transcriptions
   */
  getFailedTranscriptions(): Array<{
    link: DetectedVideoLink;
    attempts: number;
    lastError: string;
    lastAttempt: number;
    canRetry: boolean;
  }> {
    const failed: Array<any> = [];

    for (const [key, attempts] of this.failedTranscriptions.entries()) {
      const lastAttempt = attempts[attempts.length - 1];

      failed.push({
        link: lastAttempt.link,
        attempts: attempts.length,
        lastError: lastAttempt.error,
        lastAttempt: lastAttempt.timestamp,
        canRetry: attempts.length < this.MAX_AUTO_RETRIES,
      });
    }

    return failed.sort((a, b) => b.lastAttempt - a.lastAttempt);
  }

  /**
   * Get items in retry queue
   */
  getRetryQueue(): DetectedVideoLink[] {
    const items: DetectedVideoLink[] = [];

    for (const key of this.retryQueue) {
      const attempts = this.failedTranscriptions.get(key);
      if (attempts && attempts.length > 0) {
        items.push(attempts[attempts.length - 1].link);
      }
    }

    return items;
  }

  /**
   * Clear failed record for a specific link
   */
  clearFailure(link: DetectedVideoLink): boolean {
    const key = this.generateKey(link);
    const deleted = this.failedTranscriptions.delete(key);
    this.retryQueue.delete(key);

    if (this.debugMode && deleted) {
      console.log(`Cleared failure record: ${key}`);
    }

    return deleted;
  }

  /**
   * Clear all failures
   */
  clearAllFailures(): void {
    this.failedTranscriptions.clear();
    this.retryQueue.clear();

    if (this.debugMode) {
      console.log('Cleared all failure records');
    }
  }

  /**
   * Mark transcription as successful (removes from failures)
   */
  markSuccess(link: DetectedVideoLink): void {
    this.clearFailure(link);
  }

  /**
   * Get failure statistics
   */
  getStatistics(): {
    totalFailed: number;
    inRetryQueue: number;
    permanentlyFailed: number;
    avgAttempts: number;
  } {
    let totalAttempts = 0;
    let permanentlyFailed = 0;

    for (const attempts of this.failedTranscriptions.values()) {
      totalAttempts += attempts.length;
      if (attempts.length >= this.MAX_AUTO_RETRIES) {
        permanentlyFailed++;
      }
    }

    return {
      totalFailed: this.failedTranscriptions.size,
      inRetryQueue: this.retryQueue.size,
      permanentlyFailed,
      avgAttempts: this.failedTranscriptions.size > 0
        ? totalAttempts / this.failedTranscriptions.size
        : 0,
    };
  }

  /**
   * Generate unique key for link
   */
  private generateKey(link: DetectedVideoLink): string {
    return `${link.platform}:${link.videoId}`;
  }

  /**
   * Check if link has failed before
   */
  hasFailed(link: DetectedVideoLink): boolean {
    const key = this.generateKey(link);
    return this.failedTranscriptions.has(key);
  }

  /**
   * Get attempt count for link
   */
  getAttemptCount(link: DetectedVideoLink): number {
    const key = this.generateKey(link);
    const attempts = this.failedTranscriptions.get(key);
    return attempts ? attempts.length : 0;
  }

  /**
   * Get failure reason for link
   */
  getFailureReason(link: DetectedVideoLink): string | null {
    const key = this.generateKey(link);
    const attempts = this.failedTranscriptions.get(key);

    if (!attempts || attempts.length === 0) {
      return null;
    }

    return attempts[attempts.length - 1].error;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}
