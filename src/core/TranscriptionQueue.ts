import { DetectedVideoLink } from '../types';
import { Notice } from 'obsidian';

/**
 * Queue item status
 */
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Queue item
 */
export interface QueueItem {
  id: string;
  link: DetectedVideoLink;
  status: QueueItemStatus;
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  progress?: number;
}

/**
 * Queue statistics
 */
export interface QueueStatistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
}

/**
 * Transcription Queue - Manages batch processing of video transcriptions
 */
export class TranscriptionQueue {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private isPaused: boolean = false;
  private concurrency: number = 1; // Process one at a time by default
  private currentlyProcessing: number = 0;
  private debugMode: boolean;

  private onItemStart?: (item: QueueItem) => void;
  private onItemComplete?: (item: QueueItem) => void;
  private onItemError?: (item: QueueItem, error: Error) => void;
  private onQueueComplete?: () => void;
  private processItem?: (link: DetectedVideoLink) => Promise<void>;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Set processing function
   */
  setProcessFunction(fn: (link: DetectedVideoLink) => Promise<void>) {
    this.processItem = fn;
  }

  /**
   * Set event handlers
   */
  on(
    event: 'itemStart' | 'itemComplete' | 'itemError' | 'queueComplete',
    handler: (...args: any[]) => void
  ) {
    switch (event) {
      case 'itemStart':
        this.onItemStart = handler;
        break;
      case 'itemComplete':
        this.onItemComplete = handler;
        break;
      case 'itemError':
        this.onItemError = handler;
        break;
      case 'queueComplete':
        this.onQueueComplete = handler;
        break;
    }
  }

  /**
   * Add item to queue
   */
  add(link: DetectedVideoLink): string {
    const id = this.generateId();

    const item: QueueItem = {
      id,
      link,
      status: 'pending',
      addedAt: Date.now(),
    };

    this.queue.push(item);

    if (this.debugMode) {
      console.log('Queue: Item added', { id, url: link.url });
    }

    // Auto-start processing if not already running
    if (!this.isProcessing && !this.isPaused) {
      this.start();
    }

    return id;
  }

  /**
   * Add multiple items to queue
   */
  addMultiple(links: DetectedVideoLink[]): string[] {
    const ids = links.map((link) => this.add(link));
    new Notice(`Added ${links.length} videos to transcription queue`);
    return ids;
  }

  /**
   * Start queue processing
   */
  async start(): Promise<void> {
    if (this.isProcessing) {
      if (this.debugMode) {
        console.log('Queue: Already processing');
      }
      return;
    }

    this.isProcessing = true;
    this.isPaused = false;

    if (this.debugMode) {
      console.log('Queue: Starting processing');
    }

    await this.processQueue();
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    this.isPaused = true;
    new Notice('Queue paused. Current items will finish processing.');

    if (this.debugMode) {
      console.log('Queue: Paused');
    }
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    new Notice('Queue resumed');

    if (this.debugMode) {
      console.log('Queue: Resumed');
    }

    if (!this.isProcessing) {
      this.start();
    }
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    this.isProcessing = false;
    this.isPaused = true;

    // Mark all pending items as cancelled
    for (const item of this.queue) {
      if (item.status === 'pending') {
        item.status = 'cancelled';
      }
    }

    new Notice('Queue stopped');

    if (this.debugMode) {
      console.log('Queue: Stopped');
    }
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessing && !this.isPaused) {
      // Find next pending items (up to concurrency limit)
      const pendingItems = this.queue
        .filter((item) => item.status === 'pending')
        .slice(0, this.concurrency - this.currentlyProcessing);

      if (pendingItems.length === 0) {
        // No more items to process
        this.isProcessing = false;

        if (this.onQueueComplete) {
          this.onQueueComplete();
        }

        if (this.debugMode) {
          console.log('Queue: Processing complete');
        }

        break;
      }

      // Process items concurrently
      await Promise.all(pendingItems.map((item) => this.processQueueItem(item)));

      // Wait a bit before checking for next items
      await this.sleep(100);
    }

    this.isProcessing = false;
  }

  /**
   * Process single queue item
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    if (!this.processItem) {
      throw new Error('Process function not set');
    }

    this.currentlyProcessing++;

    try {
      // Update status
      item.status = 'processing';
      item.startedAt = Date.now();

      if (this.onItemStart) {
        this.onItemStart(item);
      }

      if (this.debugMode) {
        console.log('Queue: Processing item', { id: item.id, url: item.link.url });
      }

      // Process the item
      await this.processItem(item.link);

      // Mark as completed
      item.status = 'completed';
      item.completedAt = Date.now();
      item.progress = 100;

      if (this.onItemComplete) {
        this.onItemComplete(item);
      }

      if (this.debugMode) {
        console.log('Queue: Item completed', { id: item.id });
      }
    } catch (error) {
      // Mark as failed
      item.status = 'failed';
      item.completedAt = Date.now();
      item.error = error.message || 'Unknown error';

      if (this.onItemError) {
        this.onItemError(item, error);
      }

      if (this.debugMode) {
        console.error('Queue: Item failed', { id: item.id, error });
      }
    } finally {
      this.currentlyProcessing--;
    }
  }

  /**
   * Remove item from queue
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id);

    if (index === -1) {
      return false;
    }

    const item = this.queue[index];

    // Can't remove if currently processing
    if (item.status === 'processing') {
      return false;
    }

    this.queue.splice(index, 1);

    if (this.debugMode) {
      console.log('Queue: Item removed', { id });
    }

    return true;
  }

  /**
   * Clear completed items
   */
  clearCompleted(): number {
    const beforeCount = this.queue.length;
    this.queue = this.queue.filter((item) => item.status !== 'completed');
    return beforeCount - this.queue.length;
  }

  /**
   * Clear all items
   */
  clearAll(): void {
    this.stop();
    this.queue = [];
  }

  /**
   * Get queue statistics
   */
  getStatistics(): QueueStatistics {
    const stats: QueueStatistics = {
      total: this.queue.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const item of this.queue) {
      stats[item.status]++;
    }

    return stats;
  }

  /**
   * Get all items
   */
  getItems(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Get item by ID
   */
  getItem(id: string): QueueItem | undefined {
    return this.queue.find((item) => item.id === id);
  }

  /**
   * Get items by status
   */
  getItemsByStatus(status: QueueItemStatus): QueueItem[] {
    return this.queue.filter((item) => item.status === status);
  }

  /**
   * Set concurrency level
   */
  setConcurrency(concurrency: number): void {
    this.concurrency = Math.max(1, concurrency);
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Check if queue is processing
   */
  isActive(): boolean {
    return this.isProcessing && !this.isPaused;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
