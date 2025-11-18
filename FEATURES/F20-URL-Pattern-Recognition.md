# F20: URL Pattern Recognition

## Overview
Comprehensive regex pattern system for identifying video URLs across all supported platforms, including shortened URLs and mobile variants.

## Technical Approach

### Pattern Library
```typescript
const VIDEO_PATTERNS = {
  youtube: [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ],
  instagram: [
    /instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/,
    /instagram\.com\/stories\/([^\/]+)\/(\d+)/
  ],
  twitter: [
    /(?:twitter|x)\.com\/\w+\/status\/(\d+)/
  ],
  tiktok: [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([a-zA-Z0-9]+)/
  ],
  // ... more platforms
};
```

### Shortened URL Expansion
- bit.ly, t.co, tinyurl.com
- Follow redirects (max 3 hops)
- Cache expanded URLs

### Pattern Testing
- Comprehensive test suite
- Real-world URL examples
- Edge case coverage

## Priority
**Must-Have** 🔴

## Estimated Effort
**2-3 days**
