# F2: Platform Router and Identification

## Overview
The Platform Router analyzes detected video URLs to determine which platform they belong to, extract relevant identifiers (video IDs, post IDs), and route requests to the appropriate API endpoint. This component ensures that each platform's unique URL structure and requirements are handled correctly.

## User Story
As a plugin developer, I want a centralized system that can identify any video platform from a URL and extract the necessary information to fetch that video, so that the rest of the system can work with a standardized format regardless of the original source.

## Technical Approach

### Platform Identification Strategy

**1. Pattern Matching**
Use comprehensive regex patterns for each platform, accounting for:
- Multiple URL formats per platform
- Mobile vs desktop URLs
- Shortened URLs
- Regional variations
- Query parameters

**2. Priority System**
- Try most common patterns first (YouTube, Instagram, TikTok, X)
- Fall back to less common platforms
- Handle ambiguous cases (e.g., twitter.com vs x.com)

**3. ID Extraction**
Extract platform-specific identifiers:
- YouTube: 11-character video ID
- Instagram: Alphanumeric shortcode
- X/Twitter: Numeric tweet ID
- TikTok: Numeric video ID
- Facebook: Numeric video ID

### Routing Logic

```typescript
interface PlatformInfo {
  platform: VideoPlatform;
  videoId: string;
  originalUrl: string;
  normalizedUrl: string;
  metadata: {
    urlType?: 'direct' | 'short' | 'embed';
    contentType?: 'video' | 'reel' | 'short' | 'live';
  };
}

class PlatformRouter {
  identifyPlatform(url: string): PlatformInfo | null;
  routeToAPI(platformInfo: PlatformInfo): APIEndpoint;
  normalizeURL(url: string): string;
}
```

### Platform-Specific Handling

**YouTube**
- Regular videos: `watch?v=VIDEO_ID`
- Shorts: `shorts/VIDEO_ID`
- Embedded: `embed/VIDEO_ID`
- Shortened: `youtu.be/VIDEO_ID`
- Extract playlist info if present (for future batch feature)

**Instagram**
- Reels: `/reel/SHORTCODE`
- Posts: `/p/SHORTCODE`
- TV: `/tv/SHORTCODE`
- Stories: `/stories/USERNAME/STORY_ID` (24-hour expiry)

**X/Twitter**
- Standard: `twitter.com/USER/status/TWEET_ID`
- New domain: `x.com/USER/status/TWEET_ID`
- Mobile: `mobile.twitter.com/USER/status/TWEET_ID`
- Extract username for context

**TikTok**
- Standard: `tiktok.com/@USERNAME/video/VIDEO_ID`
- Shortened: `vm.tiktok.com/SHORT_CODE`
- Mobile: `m.tiktok.com/...`
- Resolve shortened URLs first

**Facebook**
- Watch: `facebook.com/watch?v=VIDEO_ID`
- Profile videos: `facebook.com/USER/videos/VIDEO_ID`
- Reel: `facebook.com/reel/VIDEO_ID`
- Handle different privacy levels

## Dependencies
- **Depends on**: F1 (Video URL Detection)
- **Required APIs**: None (pure logic)
- **Obsidian APIs**: None
- **External Libraries**: URL parsing utilities

## UI/UX Design

### Platform Badge Display
When platform is identified, show visual indicator:

```
YouTube  [Red icon]
Instagram  [Gradient icon]
X  [Blue/Black icon]
TikTok  [Black icon]
Facebook  [Blue icon]
```

### Error Handling UI
```
⚠️ Could not identify video platform
URL: https://unknown-site.com/video/123

Supported platforms:
• YouTube, Instagram, X, TikTok
• Facebook, Pinterest, Threads

[Try Manual Detection] [Cancel]
```

## Edge Cases

1. **Ambiguous URLs**
   - Domain could match multiple patterns
   - Resolution: Use most specific pattern match
   - Fallback: Ask user to confirm platform

2. **URL Redirects**
   - Shortened URLs (bit.ly, t.co)
   - Solution: Follow redirects (max 3 hops)
   - Cache redirect resolutions

3. **Invalid Video IDs**
   - ID extracted but doesn't match platform format
   - Solution: Validate ID format before proceeding
   - Return null if validation fails

4. **New Platform Variants**
   - Platform adds new URL format
   - Solution: Pattern update mechanism
   - Log unknown patterns for future support

5. **Geo-Specific Domains**
   - youtube.co.uk, instagram.com/es/
   - Solution: Normalize to canonical domain
   - Maintain domain alias map

6. **Query Parameters**
   - URLs with tracking params, timestamps
   - Solution: Clean URL, extract only essential params
   - Preserve timestamp param for future chapter feature

## Testing Strategy

### Unit Tests
```typescript
describe('PlatformRouter', () => {
  test('identifies YouTube standard URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = router.identifyPlatform(url);
    expect(result.platform).toBe('youtube');
    expect(result.videoId).toBe('dQw4w9WgXcQ');
  });

  test('identifies YouTube shorts URL', () => {
    const url = 'https://youtube.com/shorts/abc123DEF45';
    const result = router.identifyPlatform(url);
    expect(result.platform).toBe('youtube');
    expect(result.metadata.contentType).toBe('short');
  });

  test('handles shortened youtu.be links', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ?t=30';
    const result = router.identifyPlatform(url);
    expect(result.videoId).toBe('dQw4w9WgXcQ');
  });

  test('returns null for unsupported platform', () => {
    const url = 'https://vimeo.com/123456';
    const result = router.identifyPlatform(url);
    expect(result).toBeNull();
  });
});
```

### Integration Tests
- Test with real URLs from each platform
- Verify correct API routing
- Test redirect resolution
- Validate extracted IDs

### Test URL Database
Maintain comprehensive test URL collection:
- Valid URLs for each platform (10+ variants)
- Invalid URLs that should fail gracefully
- Edge cases (malformed, missing IDs, etc.)

## Implementation Complexity
**Easy-Medium**

- Regex patterns: Easy
- URL parsing: Easy
- Router logic: Medium
- Redirect resolution: Medium

## Priority
**Must-Have** 🔴

Critical component that determines how all subsequent API calls are made.

## Estimated Effort
**2-3 days**

- Day 1: Core routing logic + patterns
- Day 2: Edge case handling + validation
- Day 3: Testing + documentation

## Implementation Notes

### Pattern Maintenance
- Store patterns in separate configuration file
- Allow runtime pattern updates (for hotfixes)
- Version patterns to track changes
- Document each pattern with examples

### Performance Optimization
- Compile regex patterns at plugin init
- Cache platform identification results
- Use early returns in pattern matching
- Profile regex performance for optimization

### Extensibility
- Plugin architecture for adding new platforms
- User-defined custom patterns (advanced feature)
- Pattern override system for platform changes
- Hot-reload patterns without plugin restart

### API Selection Logic
After identifying platform, route to:
1. **Primary RapidAPI**: First attempt
2. **Fallback API**: If primary fails
3. **Platform-Specific API**: For specialized needs

```typescript
class APIRouter {
  selectAPI(platformInfo: PlatformInfo, context: RequestContext): APIEndpoint {
    const primary = this.getPrimaryAPI(platformInfo.platform);
    if (primary.isAvailable() && !context.primaryFailed) {
      return primary;
    }

    const fallback = this.getFallbackAPI(platformInfo.platform);
    if (fallback.isAvailable()) {
      return fallback;
    }

    const specialized = this.getSpecializedAPI(platformInfo.platform);
    return specialized; // May throw if unavailable
  }
}
```

### Logging and Debugging
- Log all platform identifications
- Track identification success rate
- Alert when unknown patterns detected
- Generate analytics for platform usage

### Future Enhancements
- Machine learning for pattern recognition
- Community pattern database
- Auto-update patterns from remote
- Platform detection API fallback
