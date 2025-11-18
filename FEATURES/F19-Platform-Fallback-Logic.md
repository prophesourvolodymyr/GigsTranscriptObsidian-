# F19: Platform Fallback Logic

## Overview
Intelligent fallback system when primary API fails for specific platform, automatically trying backup APIs and specialized endpoints.

## User Story
As a user, I want the plugin to automatically try alternative APIs if the primary fails, so that transcription succeeds even during API outages or rate limits.

## Technical Approach

### Three-Tier Fallback Strategy
1. **Primary API**: Auto Download All In One (90% of requests)
2. **Fallback API**: All Social Media Video Downloader
3. **Specialized APIs**: Platform-specific endpoints

### Fallback Decision Tree
```typescript
class FallbackOrchestrator {
  async fetchWithFallback(url: string, platform: Platform): Promise<VideoData> {
    // Try primary
    try {
      return await this.primaryAPI.fetch(url);
    } catch (error) {
      if (!this.shouldRetry(error)) throw error;
    }

    // Try fallback
    try {
      return await this.fallbackAPI.fetch(url);
    } catch (error) {
      if (!this.shouldRetry(error)) throw error;
    }

    // Try specialized
    const specialized = this.getSpecializedAPI(platform);
    if (specialized) {
      return await specialized.fetch(url);
    }

    throw new Error('All API tiers failed');
  }
}
```

### Error Classification
- **429 Rate Limit**: Switch to fallback immediately
- **404 Not Found**: No fallback (video doesn't exist)
- **403 Forbidden**: No fallback (private content)
- **500 Server Error**: Retry with exponential backoff
- **Network Timeout**: Retry then fallback

## Priority
**Must-Have** 🔴

## Estimated Effort
**3-4 days**
