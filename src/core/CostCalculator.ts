import { App } from 'obsidian';

/**
 * Cost entry for tracking
 */
export interface CostEntry {
  timestamp: number;
  service: 'rapidapi' | 'whisper' | 'openai' | 'gemini' | 'claude';
  operation: string;
  cost: number;
  details?: any;
}

/**
 * Cost summary
 */
export interface CostSummary {
  totalCost: number;
  byService: Record<string, number>;
  byMonth: Record<string, number>;
  entryCount: number;
}

/**
 * Cost Calculator - Tracks and calculates API usage costs
 */
export class CostCalculator {
  private costs: CostEntry[] = [];
  private costFile = '.cost-tracking.json';
  private app: App;
  private debugMode: boolean;

  // Pricing (as of 2024)
  private readonly pricing = {
    whisper: {
      perMinute: 0.006, // $0.006 per minute
    },
    openai: {
      'gpt-4o': {
        input: 0.0025 / 1000, // $2.50 per 1M tokens
        output: 0.01 / 1000, // $10.00 per 1M tokens
      },
      'gpt-4o-mini': {
        input: 0.00015 / 1000, // $0.15 per 1M tokens
        output: 0.0006 / 1000, // $0.60 per 1M tokens
      },
    },
    gemini: {
      'gemini-1.5-flash': {
        input: 0, // Free tier
        output: 0, // Free tier
      },
      'gemini-1.5-pro': {
        input: 0.00125 / 1000, // $1.25 per 1M tokens
        output: 0.005 / 1000, // $5.00 per 1M tokens
      },
    },
    claude: {
      'claude-3-haiku-20240307': {
        input: 0.00025 / 1000, // $0.25 per 1M tokens
        output: 0.00125 / 1000, // $1.25 per 1M tokens
      },
      'claude-3-5-sonnet-20241022': {
        input: 0.003 / 1000, // $3.00 per 1M tokens
        output: 0.015 / 1000, // $15.00 per 1M tokens
      },
    },
    rapidapi: {
      // Typical costs vary by API, using estimates
      perRequest: 0.001, // $0.001 per request (varies)
    },
  };

  constructor(app: App, debugMode: boolean = false) {
    this.app = app;
    this.debugMode = debugMode;
  }

  /**
   * Load cost history from disk
   */
  async load(): Promise<void> {
    try {
      const costFilePath = `${this.app.vault.configDir}/${this.costFile}`;
      const adapter = this.app.vault.adapter;

      if (await adapter.exists(costFilePath)) {
        const data = await adapter.read(costFilePath);
        this.costs = JSON.parse(data);

        if (this.debugMode) {
          console.log(`Cost tracking loaded: ${this.costs.length} entries`);
        }
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('Failed to load cost tracking:', error);
      }
      this.costs = [];
    }
  }

  /**
   * Save cost history to disk
   */
  async save(): Promise<void> {
    try {
      const costFilePath = `${this.app.vault.configDir}/${this.costFile}`;
      const adapter = this.app.vault.adapter;

      await adapter.write(costFilePath, JSON.stringify(this.costs, null, 2));

      if (this.debugMode) {
        console.log(`Cost tracking saved: ${this.costs.length} entries`);
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('Failed to save cost tracking:', error);
      }
    }
  }

  /**
   * Add cost entry
   */
  addEntry(entry: Omit<CostEntry, 'timestamp'>): void {
    const fullEntry: CostEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    this.costs.push(fullEntry);

    // Save to disk (async, fire and forget)
    this.save().catch((err) => {
      if (this.debugMode) {
        console.error('Failed to save cost tracking after add:', err);
      }
    });

    if (this.debugMode) {
      console.log('Cost entry added:', fullEntry);
    }
  }

  /**
   * Calculate Whisper API cost
   */
  calculateWhisperCost(durationSeconds: number): number {
    const minutes = durationSeconds / 60;
    return minutes * this.pricing.whisper.perMinute;
  }

  /**
   * Track Whisper transcription cost
   */
  trackWhisperCost(durationSeconds: number, details?: any): void {
    const cost = this.calculateWhisperCost(durationSeconds);
    this.addEntry({
      service: 'whisper',
      operation: 'transcription',
      cost,
      details: { durationSeconds, ...details },
    });
  }

  /**
   * Estimate AI summary cost
   */
  estimateAISummaryCost(
    provider: 'openai' | 'gemini' | 'claude',
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const modelPricing = this.pricing[provider]?.[model];

    if (!modelPricing) {
      return 0; // Unknown model, return 0
    }

    const inputCost = inputTokens * modelPricing.input;
    const outputCost = outputTokens * modelPricing.output;

    return inputCost + outputCost;
  }

  /**
   * Track AI summary cost
   */
  trackAISummaryCost(
    provider: 'openai' | 'gemini' | 'claude',
    model: string,
    inputTokens: number,
    outputTokens: number,
    details?: any
  ): void {
    const cost = this.estimateAISummaryCost(provider, model, inputTokens, outputTokens);
    this.addEntry({
      service: provider,
      operation: 'summary',
      cost,
      details: { model, inputTokens, outputTokens, ...details },
    });
  }

  /**
   * Track RapidAPI cost
   */
  trackRapidAPICost(platform: string, details?: any): void {
    const cost = this.pricing.rapidapi.perRequest;
    this.addEntry({
      service: 'rapidapi',
      operation: 'video_extraction',
      cost,
      details: { platform, ...details },
    });
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return this.costs.reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get cost summary
   */
  getSummary(): CostSummary {
    const byService: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const entry of this.costs) {
      // By service
      if (!byService[entry.service]) {
        byService[entry.service] = 0;
      }
      byService[entry.service] += entry.cost;

      // By month
      const date = new Date(entry.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = 0;
      }
      byMonth[monthKey] += entry.cost;
    }

    return {
      totalCost: this.getTotalCost(),
      byService,
      byMonth,
      entryCount: this.costs.length,
    };
  }

  /**
   * Get costs for date range
   */
  getCostsByDateRange(startDate: Date, endDate: Date): CostEntry[] {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return this.costs.filter((entry) => entry.timestamp >= start && entry.timestamp <= end);
  }

  /**
   * Get costs for current month
   */
  getCurrentMonthCosts(): CostEntry[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.getCostsByDateRange(startOfMonth, endOfMonth);
  }

  /**
   * Get current month total
   */
  getCurrentMonthTotal(): number {
    const costs = this.getCurrentMonthCosts();
    return costs.reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Export cost data as CSV
   */
  exportAsCSV(): string {
    const headers = ['Timestamp', 'Date', 'Service', 'Operation', 'Cost', 'Details'];
    const rows = this.costs.map((entry) => {
      const date = new Date(entry.timestamp).toISOString();
      const details = entry.details ? JSON.stringify(entry.details) : '';
      return [entry.timestamp, date, entry.service, entry.operation, entry.cost.toFixed(6), details];
    });

    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Clear all cost data
   */
  async clear(): Promise<void> {
    this.costs = [];
    await this.save();
  }

  /**
   * Clear old entries (older than days)
   */
  async clearOldEntries(days: number): Promise<number> {
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const beforeCount = this.costs.length;

    this.costs = this.costs.filter((entry) => entry.timestamp >= cutoffDate);

    await this.save();

    return beforeCount - this.costs.length;
  }

  /**
   * Get pricing information
   */
  getPricing() {
    return this.pricing;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
