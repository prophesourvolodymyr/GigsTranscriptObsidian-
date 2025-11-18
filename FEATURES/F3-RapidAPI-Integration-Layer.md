# F3: RapidAPI Integration Layer

## Overview
The RapidAPI Integration Layer is the core API communication component that handles all video extraction requests through RapidAPI's marketplace. This layer manages authentication, request formatting, response parsing, error handling, and fallback logic across multiple RapidAPI providers. **This supersedes any local extraction tools (yt-dlp, ffmpeg) per N3 architecture.**

## User Story
As a plugin user, I want the plugin to reliably extract video and audio from any supported platform without requiring me to install or maintain any local tools, so that the transcription process is seamless and cross-platform compatible.

## Technical Approach

### API Architecture

**Three-Tier Strategy:**

1. **Primary API**: Auto Download All In One (FastSaverAPI)
   - Covers 90% of use cases
   - Best price-to-performance ratio
   - Supports: YouTube, Instagram, X, TikTok, Facebook, Pinterest, Threads

2. **Fallback API**: All Social Media Video Downloader
   - Activates when primary fails or rate-limited
   - Different infrastructure = higher uptime
   - Similar platform coverage

3. **Specialized APIs**: Platform-specific fallbacks
   - X/Twitter Video Downloader (hyoga)
   - TikTok Video Downloader (elisbushaj2)
   - Telegram Stories Downloader (Phase 2)

### Request Flow

```typescript
interface RapidAPIRequest {
  url: string;
  format?: 'mp3' | 'mp4' | 'best';
  quality?: '128' | '192' | '320'; // for audio
}

interface RapidAPIResponse {
  status: 'success' | 'error';
  data?: {
    title: string;
    author: string;
    thumbnail: string;
    duration: number;
    platform: string;
    downloadUrl: string;
    audioUrl?: string;
    metadata?: Record<string, any>;
  };
  error?: {
    code: string;
    message: string;
    retry: boolean;
  };
}

class RapidAPIClient {
  private apiKey: string;
  private primaryHost: string;
  private fallbackHosts: string[];

  async fetchVideo(
    videoUrl: string,
    options: FetchOptions
  ): Promise<NormalizedVideoData> {
    // Try primary API
    try {
      return await this.requestPrimaryAPI(videoUrl, options);
    } catch (error) {
      if (this.shouldRetry(error)) {
        // Try fallback APIs
        return await this.requestWithFallback(videoUrl, options);
      }
      throw error;
    }
  }
}
```

### Authentication Management

**API Key Storage:**
- Encrypted using Electron's safeStorage API
- OS-level keychain integration
- Never logged or transmitted except to RapidAPI
- Validation on settings save

**Header Format:**
```typescript
const headers = {
  'X-RapidAPI-Key': this.apiKey,
  'X-RapidAPI-Host': 'instagram-tiktok-youtube-downloader.p.rapidapi.com',
  'Content-Type': 'application/json'
};
```

### Response Normalization

Different APIs return different formats. Normalize to unified schema:

```typescript
interface NormalizedVideoData {
  // Core fields (required)
  platform: 'youtube' | 'instagram' | 'twitter' | 'tiktok' | 'facebook';
  title: string;
  downloadUrl: string;
  audioUrl?: string;
  duration: number; // seconds

  // Metadata (optional)
  author?: string;
  authorId?: string;
  thumbnail?: string;
  description?: string;
  uploadDate?: string; // ISO 8601
  viewCount?: number;
  likeCount?: number;

  // Platform-specific
  platformMetadata: Record<string, any>;

  // Internal tracking
  apiSource: 'primary' | 'fallback' | 'specialized';
  retrievedAt: Date;
  expiresAt?: Date; // Download URL expiration
}

class ResponseNormalizer {
  normalize(rawResponse: any, apiType: string): NormalizedVideoData {
    // Convert various API formats to unified schema
    switch (apiType) {
      case 'fastsaver':
        return this.normalizeFastSaver(rawResponse);
      case 'keepsaveit':
        return this.normalizeKeepSaveIt(rawResponse);
      case 'specialized':
        return this.normalizeSpecialized(rawResponse);
    }
  }
}
```

## Dependencies
- **Depends on**: F2 (Platform Router)
- **Required APIs**: RapidAPI account + API key
- **Obsidian APIs**: `requestUrl()` for HTTP requests
- **External Libraries**: None (native fetch/axios)

## UI/UX Design

### API Key Setup Flow

**First-Time Setup:**
```
┌────────────────────────────────────────────┐
│  🔑 RapidAPI Configuration Required        │
│                                             │
│  Link Video Transcriber uses RapidAPI to   │
│  extract videos from all platforms.        │
│                                             │
│  Steps:                                     │
│  1. Create free account at rapidapi.com    │
│  2. Subscribe to "Auto Download All In One"│
│  3. Copy your API key                      │
│                                             │
│  API Key: [___________________________]    │
│                                             │
│  [Test Connection]  [Save]  [Learn More]   │
└────────────────────────────────────────────┘
```

### API Status Indicator

In settings panel:
```
✅ RapidAPI: Connected (127/500 requests used this month)
⚠️ Rate Limit: 80% used - consider upgrading
❌ API Error: Invalid key - please check settings
```

## Edge Cases

1. **Rate Limit Exceeded**
   - Detect 429 response
   - Switch to fallback API automatically
   - Notify user about limit
   - Track usage to prevent hitting limits

2. **Invalid API Key**
   - Detect 401/403 responses
   - Clear error message with setup guide
   - Prevent further requests until fixed
   - Validate key on save

3. **Network Timeout**
   - Retry with exponential backoff (2s, 4s, 8s)
   - Max 3 retries
   - Clear timeout error after retries fail
   - Option to try fallback API

4. **Malformed API Response**
   - Schema validation
   - Log unexpected formats
   - Graceful degradation (extract what's available)
   - Report issue to user

5. **Download URL Expiration**
   - URLs expire (typically 1-6 hours)
   - Detect expired URLs (403/404 on download)
   - Re-fetch video data automatically
   - Cache refresh strategy

6. **Platform API Changes**
   - RapidAPI provider updates their API
   - Detect schema changes
   - Alert user to update plugin
   - Fallback to older schema parsing

## Testing Strategy

### Unit Tests
```typescript
describe('RapidAPIClient', () => {
  test('formats request headers correctly', () => {
    const client = new RapidAPIClient('test-key');
    const headers = client.getHeaders('primary');
    expect(headers['X-RapidAPI-Key']).toBe('test-key');
    expect(headers['X-RapidAPI-Host']).toBeDefined();
  });

  test('normalizes response from primary API', () => {
    const rawResponse = mockFastSaverResponse;
    const normalized = normalizer.normalize(rawResponse, 'fastsaver');
    expect(normalized.platform).toBe('youtube');
    expect(normalized.duration).toBeGreaterThan(0);
  });

  test('handles rate limit with fallback', async () => {
    mockPrimaryAPI.replyWithError(429);
    mockFallbackAPI.replyWithSuccess();
    const result = await client.fetchVideo('https://youtube.com/...');
    expect(result.apiSource).toBe('fallback');
  });
});
```

### Integration Tests (with real APIs)
- Test against actual RapidAPI endpoints
- Verify response format hasn't changed
- Test authentication flow
- Measure response times
- Validate fallback switching

### Mock Server for Development
Create mock RapidAPI responses for:
- Successful video fetch
- Rate limit error
- Invalid URL error
- Network timeout
- Malformed response

## Implementation Complexity
**Medium-High**

- HTTP requests: Easy
- Authentication: Easy
- Response normalization: Medium
- Error handling: Medium
- Fallback logic: Medium-High
- Rate limit tracking: Medium

## Priority
**Must-Have** 🔴

This is the core video extraction mechanism replacing all local tools.

## Estimated Effort
**5-7 days**

- Day 1-2: Core API client + authentication
- Day 3: Response normalization
- Day 4: Error handling + retry logic
- Day 5: Fallback system
- Day 6: Rate limit tracking
- Day 7: Testing + polish

## Implementation Notes

### API Request Optimization

**Caching Strategy:**
```typescript
class APICache {
  // Cache video metadata for 24 hours
  private metadataCache: Map<string, CachedMetadata>;

  async getOrFetch(videoUrl: string): Promise<VideoMetadata> {
    const cached = this.metadataCache.get(videoUrl);
    if (cached && !cached.isExpired()) {
      return cached.data;
    }

    const fresh = await this.fetchFromAPI(videoUrl);
    this.cache(videoUrl, fresh);
    return fresh;
  }
}
```

**Request Queue:**
- Limit concurrent API requests (max 3)
- Queue additional requests
- Priority system (user-initiated > background)
- Cancel queued requests on user abort

### Rate Limit Management

```typescript
class RateLimitTracker {
  private requests: Request[] = [];
  private limit: number;
  private period: number; // milliseconds

  canMakeRequest(): boolean {
    this.cleanOldRequests();
    return this.requests.length < this.limit;
  }

  trackRequest(request: Request): void {
    this.requests.push(request);
    this.updateUsageDisplay();
  }

  getUsagePercent(): number {
    return (this.requests.length / this.limit) * 100;
  }

  warnIfNearLimit(): void {
    if (this.getUsagePercent() > 80) {
      new Notice('⚠️ RapidAPI rate limit: 80% used this month');
    }
  }
}
```

### Fallback Strategy

```typescript
class FallbackOrchestrator {
  private apiTiers = [
    { name: 'primary', hosts: ['instagram-tiktok-youtube-downloader.p.rapidapi.com'] },
    { name: 'fallback', hosts: ['all-social-media-video-downloader.p.rapidapi.com'] },
    { name: 'specialized', hosts: ['x-twitter-video-downloader2.p.rapidapi.com'] }
  ];

  async fetchWithFallback(url: string): Promise<VideoData> {
    for (const tier of this.apiTiers) {
      try {
        const result = await this.tryTier(tier, url);
        if (result) return result;
      } catch (error) {
        console.warn(`Tier ${tier.name} failed:`, error);
        continue; // Try next tier
      }
    }
    throw new Error('All API tiers failed');
  }
}
```

### Security Considerations

**API Key Protection:**
- Never log API keys
- Mask in UI (show only last 4 characters)
- Encrypt at rest
- Clear from memory after use
- Warn if key appears in notes

**HTTPS Enforcement:**
```typescript
class SecureAPIClient {
  constructor(apiKey: string) {
    if (!this.isSecureConnection()) {
      throw new Error('RapidAPI requires HTTPS');
    }
    this.apiKey = apiKey;
  }
}
```

### Monitoring and Analytics

**Track API Performance:**
- Response time per API
- Success rate per platform
- Fallback activation frequency
- Error type distribution
- Cost estimation (requests × tier price)

**User Dashboard:**
```
API Usage This Month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary API:    127 / 500 requests
Fallback API:   3 / 100 requests
Specialized:    0 / 50 requests

Estimated Cost: $2.40 / $25.00
Most Used Platform: YouTube (89%)
Average Response Time: 2.3s

[View Details] [Upgrade Plan]
```

### Future Enhancements
- Multiple API key support (key rotation)
- Custom API endpoint configuration
- Proxy support for restricted regions
- Bulk request optimization
- API health monitoring dashboard
- Cost prediction based on usage patterns
