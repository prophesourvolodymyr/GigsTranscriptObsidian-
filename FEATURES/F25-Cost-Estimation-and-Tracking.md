# F25: Cost Estimation and Tracking

## Overview
Real-time cost estimation before transcription and comprehensive cost tracking across all API usage (RapidAPI, Whisper, AI providers).

## User Story
As a user, I want to see cost estimates before transcribing and track my monthly spending, so that I can stay within budget and make informed decisions about API vs local transcription.

## Technical Approach

### Cost Calculator
```typescript
class CostCalculator {
  estimateTranscriptionCost(duration: number, method: 'api' | 'local'): number {
    if (method === 'local') return 0;

    // Whisper API: $0.006 per minute
    return (duration / 60) * 0.006;
  }

  estimateAICost(transcript: string, provider: AIProvider): number {
    const tokens = this.estimateTokens(transcript);

    const pricing = {
      'gpt-4o-mini': 0.15 / 1_000_000, // per input token
      'gemini-flash': 0, // free tier
      'claude-haiku': 0.25 / 1_000_000
    };

    return tokens * pricing[provider];
  }

  getTotalEstimate(video: VideoMetadata, options: Options): CostEstimate {
    return {
      rapidApi: 0.002, // ~$0.002 per request
      transcription: this.estimateTranscriptionCost(video.duration, options.method),
      aiSummary: options.enableAI ? this.estimateAICost(video.transcript, options.aiProvider) : 0,
      total: // sum of above
    };
  }
}
```

### Usage Tracking
```typescript
class UsageTracker {
  private db: UsageDatabase;

  async recordUsage(operation: Operation, cost: number): Promise<void> {
    await this.db.insert({
      timestamp: Date.now(),
      operation,
      provider: operation.provider,
      cost,
      metadata: operation.metadata
    });
  }

  getMonthlyReport(): MonthlyReport {
    return {
      rapidApi: { requests: 127, cost: 0.25 },
      whisperApi: { minutes: 145, cost: 0.87 },
      openai: { tokens: 45000, cost: 0.12 },
      gemini: { tokens: 80000, cost: 0 },
      total: 1.24
    };
  }

  async generateChart(): Promise<ChartData> {
    // Daily/weekly/monthly cost trends
  }
}
```

### Budget Alerts
- Set monthly budget
- Warning at 80% usage
- Block at 100% with override option
- Suggest cheaper alternatives when approaching limit

## Priority
**Should-Have** 🟡 (Phase 2)

## Estimated Effort
**3-4 days**
