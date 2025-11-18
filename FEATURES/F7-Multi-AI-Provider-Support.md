# F7: Multi-AI Provider Support (Gemini, Claude)

## Overview
Multi-AI Provider Support enables users to choose between OpenAI, Google Gemini, and Anthropic Claude for transcript processing. This provides flexibility, cost optimization, and resilience against single-provider outages or rate limits.

## User Story
As a user, I want to use different AI providers based on my preferences (cost, quality, privacy), so that I'm not locked into a single service and can optimize for my specific needs.

## Technical Approach

### Provider Abstraction Layer

```typescript
interface AIProvider {
  name: 'openai' | 'gemini' | 'claude';
  displayName: string;
  isConfigured(): boolean;
  isAvailable(): Promise<boolean>;

  summarize(transcript: string, options: SummaryOptions): Promise<SummaryResult>;
  extract(transcript: string, query: string): Promise<string>;
  chat(messages: ChatMessage[]): Promise<string>;

  getCostEstimate(transcript: string): number;
  getRateLimit(): RateLimitInfo;
}

class AIProviderManager {
  private providers: Map<string, AIProvider>;
  private defaultProvider: string;

  constructor() {
    this.providers = new Map([
      ['openai', new OpenAIProvider()],
      ['gemini', new GeminiProvider()],
      ['claude', new ClaudeProvider()]
    ]);
  }

  getProvider(name?: string): AIProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`${provider.displayName} not configured`);
    }

    return provider;
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    const providers = Array.from(this.providers.values());
    const available = [];

    for (const provider of providers) {
      if (provider.isConfigured() && await provider.isAvailable()) {
        available.push(provider);
      }
    }

    return available;
  }

  async selectBestProvider(context: TaskContext): Promise<AIProvider> {
    const available = await this.getAvailableProviders();

    // No providers available
    if (available.length === 0) {
      throw new Error('No AI providers configured');
    }

    // Only one available
    if (available.length === 1) {
      return available[0];
    }

    // Select based on context
    return this.rankProviders(available, context)[0];
  }

  private rankProviders(
    providers: AIProvider[],
    context: TaskContext
  ): AIProvider[] {
    return providers.sort((a, b) => {
      const scoreA = this.scoreProvider(a, context);
      const scoreB = this.scoreProvider(b, context);
      return scoreB - scoreA; // Higher score first
    });
  }

  private scoreProvider(provider: AIProvider, context: TaskContext): number {
    let score = 0;

    // Cost consideration
    const cost = provider.getCostEstimate(context.transcript);
    score += (1 / (cost + 0.01)) * context.priorityCost;

    // Speed consideration
    const speed = provider.getAverageSpeed();
    score += speed * context.prioritySpeed;

    // Quality consideration (user ratings)
    const quality = this.getProviderQuality(provider.name);
    score += quality * context.priorityQuality;

    // Availability (rate limits)
    const availability = this.checkAvailability(provider);
    score += availability * 10; // Heavy weight

    return score;
  }
}
```

### Google Gemini Integration

**Models:**
- **Gemini 1.5 Flash**: Free tier, fast, good quality
- **Gemini 1.5 Pro**: Paid, best quality, 1M token context

**Implementation:**
```typescript
class GeminiProvider implements AIProvider {
  name = 'gemini';
  displayName = 'Google Gemini';
  private apiKey: string;
  private model = 'gemini-1.5-flash';

  async summarize(
    transcript: string,
    options: SummaryOptions
  ): Promise<SummaryResult> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.model });

    const prompt = this.buildPrompt(transcript, options);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return this.parseResponse(text);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test API connectivity
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('test');
      return true;
    } catch {
      return false;
    }
  }

  getCostEstimate(transcript: string): number {
    const tokens = this.estimateTokens(transcript);

    if (this.model === 'gemini-1.5-flash') {
      // Free tier: first 15 RPM, 1M TPM
      return 0; // Effectively free for most users
    } else {
      // Gemini Pro: $1.25/1M input, $5/1M output
      const inputCost = (tokens / 1_000_000) * 1.25;
      const outputCost = (2000 / 1_000_000) * 5; // Assume 2K output
      return inputCost + outputCost;
    }
  }
}
```

### Anthropic Claude Integration

**Models:**
- **Claude 3 Haiku**: Fast, cheap, good for simple summaries
- **Claude 3.5 Sonnet**: Balanced, excellent quality
- **Claude 3 Opus**: Highest quality, expensive

**Implementation:**
```typescript
class ClaudeProvider implements AIProvider {
  name = 'claude';
  displayName = 'Anthropic Claude';
  private apiKey: string;
  private model = 'claude-3-5-sonnet-20240620';

  async summarize(
    transcript: string,
    options: SummaryOptions
  ): Promise<SummaryResult> {
    const anthropic = new Anthropic({ apiKey: this.apiKey });

    const message = await anthropic.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(transcript, options)
        }
      ]
    });

    const text = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return this.parseResponse(text);
  }

  getCostEstimate(transcript: string): number {
    const tokens = this.estimateTokens(transcript);

    const pricing = {
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      'claude-3-5-sonnet-20240620': { input: 3, output: 15 },
      'claude-3-opus-20240229': { input: 15, output: 75 }
    };

    const price = pricing[this.model];
    const inputCost = (tokens / 1_000_000) * price.input;
    const outputCost = (2000 / 1_000_000) * price.output;

    return inputCost + outputCost;
  }
}
```

## Dependencies
- **Depends on**: F4 or F5 (Transcription)
- **Required APIs**: At least one provider API key
- **Obsidian APIs**: None
- **External Libraries**:
  - `openai` SDK
  - `@google/generative-ai` SDK
  - `@anthropic-ai/sdk` SDK

## UI/UX Design

### Provider Selection

```
┌────────────────────────────────────────────┐
│  🤖 AI Provider Selection                  │
│                                             │
│  ✅ OpenAI GPT-4o-mini                     │
│     Status: Configured                      │
│     Cost: ~$0.01 per summary               │
│     Speed: Fast (2-3s)                     │
│     [Set as Default]                       │
│                                             │
│  ✅ Google Gemini Flash                    │
│     Status: Configured                      │
│     Cost: FREE (rate limited)              │
│     Speed: Very Fast (1-2s)                │
│     [Set as Default]                       │
│                                             │
│  ❌ Anthropic Claude Sonnet                │
│     Status: Not configured                  │
│     [Add API Key]                          │
│                                             │
│  Default Provider: Gemini Flash            │
│  Auto-Switch: ☑ Use fallback if unavailable│
│                                             │
│  [Save Settings]                           │
└────────────────────────────────────────────┘
```

### Real-Time Provider Comparison

```
┌────────────────────────────────────────────┐
│  📊 Provider Comparison                    │
│                                             │
│  For this transcript (15 min, 3,500 words):│
│                                             │
│  ┌────────────────────────────────────────┐│
│  │ Gemini Flash    FREE    ⚡ 1-2s   ⭐⭐⭐⭐│
│  │ GPT-4o-mini     $0.008  ⚡⚡ 2-3s  ⭐⭐⭐⭐⭐│
│  │ Claude Haiku    $0.003  ⚡ 1-2s   ⭐⭐⭐⭐│
│  │ GPT-4o          $0.06   ⚡⚡⚡ 5s   ⭐⭐⭐⭐⭐│
│  └────────────────────────────────────────┘│
│                                             │
│  Recommendation: Gemini Flash              │
│  (Free, fast, good quality)                │
│                                             │
│  [Use Recommended] [Choose Manually]       │
└────────────────────────────────────────────┘
```

## Edge Cases

1. **All Providers Unavailable**
   - Detect before starting
   - Clear message about configuration
   - Guide to settings
   - Skip AI processing option

2. **Provider Rate Limit Hit**
   - Automatically switch to fallback
   - Queue request for later
   - Notify user transparently

3. **Different Response Formats**
   - Normalize across providers
   - Handle provider-specific quirks
   - Validate output structure

4. **API Key Expiration**
   - Detect 401/403 errors
   - Alert user to refresh key
   - Don't retry repeatedly

5. **Provider Outage**
   - Timeout after 30s
   - Try next available provider
   - Log outage for monitoring

## Testing Strategy

### Unit Tests
```typescript
describe('AIProviderManager', () => {
  test('returns configured providers only', () => {
    const manager = new AIProviderManager();
    const available = manager.getAvailableProviders();
    expect(available.every(p => p.isConfigured())).toBe(true);
  });

  test('selects cheapest provider when cost prioritized', () => {
    const context = { priorityCost: 1, prioritySpeed: 0, priorityQuality: 0 };
    const provider = manager.selectBestProvider(context);
    expect(provider.name).toBe('gemini'); // Free tier
  });

  test('normalizes responses across providers', async () => {
    const openaiResult = await openaiProvider.summarize(transcript);
    const geminiResult = await geminiProvider.summarize(transcript);

    expect(openaiResult).toHaveProperty('summary');
    expect(openaiResult).toHaveProperty('keyPoints');
    expect(geminiResult).toHaveProperty('summary');
    expect(geminiResult).toHaveProperty('keyPoints');
  });
});
```

### Integration Tests
- Test each provider with same transcript
- Compare output quality
- Measure response times
- Test fallback switching
- Verify cost calculations

## Implementation Complexity
**Medium**

- Provider abstraction: Medium
- Multiple SDK integration: Medium
- Response normalization: Medium
- Smart selection: Medium-High

## Priority
**Should-Have** 🟡

Adds significant value through flexibility and cost optimization.

## Estimated Effort
**4-5 days**

- Day 1: Provider abstraction layer
- Day 2: Gemini integration
- Day 3: Claude integration
- Day 4: Smart selection logic
- Day 5: Testing + UI

## Implementation Notes

### Provider Selection Strategies

**Smart Default:**
```typescript
class ProviderSelector {
  selectDefault(): AIProvider {
    // Priority order:
    // 1. Gemini Flash (free)
    // 2. GPT-4o-mini (cheap)
    // 3. Claude Haiku (cheap)
    // 4. Any configured provider

    const providers = this.getConfiguredProviders();

    return providers.find(p => p.name === 'gemini') ||
           providers.find(p => p.name === 'openai') ||
           providers.find(p => p.name === 'claude') ||
           providers[0];
  }
}
```

**User Preference Learning:**
```typescript
class PreferenceLearner {
  async recordChoice(provider: AIProvider, satisfaction: number): Promise<void> {
    await this.database.insert({
      provider: provider.name,
      timestamp: Date.now(),
      satisfaction: satisfaction // 1-5 scale
    });

    // Update provider weights
    await this.updateProviderWeights();
  }

  getPreferredProvider(): AIProvider {
    const history = this.getRecentHistory(30); // Last 30 days
    const scores = this.calculateProviderScores(history);
    return this.providers.get(scores[0].provider);
  }
}
```

### Cost Tracking

```typescript
class MultiProviderCostTracker {
  private costs: Map<string, number> = new Map();

  async trackUsage(
    provider: AIProvider,
    transcript: string,
    response: string
  ): Promise<void> {
    const inputTokens = this.countTokens(transcript);
    const outputTokens = this.countTokens(response);

    const cost = provider.calculateCost(inputTokens, outputTokens);

    const currentCost = this.costs.get(provider.name) || 0;
    this.costs.set(provider.name, currentCost + cost);

    await this.persistCosts();
  }

  getMonthlyReport(): CostReport {
    return {
      totalCost: Array.from(this.costs.values()).reduce((a, b) => a + b, 0),
      byProvider: Object.fromEntries(this.costs),
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations = [];

    // Check if using expensive provider unnecessarily
    if (this.costs.get('gpt-4o') > 10) {
      recommendations.push('Consider using GPT-4o-mini for simple summaries to reduce costs');
    }

    // Suggest Gemini if not using
    if (!this.costs.has('gemini')) {
      recommendations.push('Try Gemini Flash - it\'s free and fast for most summaries');
    }

    return recommendations;
  }
}
```

### Future Enhancements
- Additional providers (Cohere, AI21, Mistral)
- Ensemble summaries (combine multiple providers)
- A/B testing of providers
- Custom provider endpoints
- Local LLM support (Ollama, LM Studio)
- Provider performance analytics dashboard
