# F29: Cache System

## Overview
Intelligent caching of video metadata, transcripts, and API responses to reduce costs and improve performance.

## User Story
As a user, I want the plugin to remember videos I've already transcribed, so that I don't accidentally transcribe the same video twice or waste API credits.

## Technical Approach

### Cache Structure
```typescript
interface CacheEntry {
  videoUrl: string;
  videoId: string;
  platform: string;

  // Cached data
  metadata: VideoMetadata;
  transcript?: string;
  summary?: string;

  // Cache metadata
  cachedAt: number;
  expiresAt: number;
  notePath?: string; // Link to existing transcript note
}

class TranscriptCache {
  private cache: Map<string, CacheEntry> = new Map();

  async get(videoUrl: string): Promise<CacheEntry | null> {
    const key = this.normalizeUrl(videoUrl);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  async set(videoUrl: string, data: Partial<CacheEntry>): Promise<void> {
    const key = this.normalizeUrl(videoUrl);
    const entry = this.cache.get(key) || this.createEntry(videoUrl);

    Object.assign(entry, data);
    entry.cachedAt = Date.now();
    entry.expiresAt = Date.now() + this.getCacheDuration();

    this.cache.set(key, entry);
    await this.persist();
  }
}
```

### Cache Layers
1. **Memory Cache**: Fast, session-only
2. **Disk Cache**: Persistent across sessions
3. **Note Linking**: References to existing transcript notes

### Cache Strategy
- **Metadata**: 7 days
- **Transcripts**: 30 days
- **API responses**: 24 hours
- **Download URLs**: 6 hours (they expire)

### Duplicate Detection
```
┌────────────────────────────────────────┐
│  ℹ️ Video Already Transcribed         │
│                                         │
│  This video was transcribed on:        │
│  2025-01-15 at 14:30                   │
│                                         │
│  Existing note:                         │
│  [[How to Build Obsidian Plugins]]     │
│                                         │
│  Options:                               │
│  • Open existing transcript            │
│  • Transcribe again (new note)         │
│  • Cancel                               │
│                                         │
│  [Open Existing] [New] [Cancel]       │
└────────────────────────────────────────┘
```

### Cache Management
- Clear expired entries automatically
- Manual cache clear option
- Cache size limit (configurable)
- Export/import cache for backup

## Priority
**Should-Have** 🟡 (Phase 2)

## Estimated Effort
**3-4 days**
