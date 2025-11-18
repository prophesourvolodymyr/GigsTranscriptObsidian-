import { SummaryResult, SummaryOptions } from '../types';

/**
 * Base AI Provider interface
 */
export interface AIProvider {
  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Generate summary from transcript
   */
  generateSummary(transcript: string, options: Partial<SummaryOptions>): Promise<SummaryResult>;

  /**
   * Test API connection
   */
  testConnection(): Promise<boolean>;

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void;

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void;
}

/**
 * AI Provider Manager - Manages multiple AI providers
 */
export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Register an AI provider
   */
  registerProvider(name: string, provider: AIProvider) {
    this.providers.set(name, provider);

    if (this.debugMode) {
      console.log(`AI Provider registered: ${name}`);
    }
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Generate summary using specified provider
   */
  async generateSummary(
    providerName: string,
    transcript: string,
    options: Partial<SummaryOptions>
  ): Promise<SummaryResult> {
    const provider = this.getProvider(providerName);

    if (!provider) {
      throw new Error(`AI provider not found: ${providerName}`);
    }

    return provider.generateSummary(transcript, options);
  }

  /**
   * Generate summary with fallback to other providers
   */
  async generateSummaryWithFallback(
    preferredProvider: string,
    transcript: string,
    options: Partial<SummaryOptions>
  ): Promise<SummaryResult> {
    const provider = this.getProvider(preferredProvider);

    if (provider) {
      try {
        return await provider.generateSummary(transcript, options);
      } catch (error) {
        if (this.debugMode) {
          console.warn(`Provider ${preferredProvider} failed, trying fallback:`, error);
        }
      }
    }

    // Try other providers as fallback
    for (const fallbackProvider of this.getAllProviders()) {
      if (fallbackProvider.name === preferredProvider) {
        continue; // Skip already tried provider
      }

      try {
        if (this.debugMode) {
          console.log(`Trying fallback provider: ${fallbackProvider.name}`);
        }

        return await fallbackProvider.generateSummary(transcript, options);
      } catch (error) {
        if (this.debugMode) {
          console.warn(`Fallback provider ${fallbackProvider.name} failed:`, error);
        }
        // Continue to next fallback
      }
    }

    // All providers failed
    throw new Error('All AI providers failed to generate summary');
  }

  /**
   * Set debug mode for all providers
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    for (const provider of this.getAllProviders()) {
      provider.setDebugMode(enabled);
    }
  }
}
