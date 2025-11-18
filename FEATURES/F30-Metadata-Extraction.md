# F30: Metadata Extraction

## Overview
Comprehensive extraction and parsing of video metadata from RapidAPI responses, including title, author, thumbnail, duration, upload date, and platform-specific data.

## User Story
As a user, I want rich metadata included in my transcript notes, so that I have complete context about the source video.

## Technical Approach

### Metadata Schema
```typescript
interface VideoMetadata {
  // Core metadata
  title: string;
  author: string;
  authorId?: string;
  platform: Platform;
  url: string;
  videoId: string;

  // Media info
  thumbnail: string;
  duration: number; // seconds
  uploadDate?: string;
  description?: string;

  // Engagement metrics
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;

  // Content classification
  category?: string;
  tags?: string[];
  language?: string;

  // Platform-specific
  platformMetadata: {
    // YouTube
    channelId?: string;
    chapters?: Chapter[];
    subtitles?: Subtitle[];

    // Instagram
    isReel?: boolean;
    musicInfo?: MusicInfo;

    // TikTok
    soundId?: string;
    hashtags?: string[];

    // X/Twitter
    tweetText?: string;
    replyTo?: string;
  };
}
```

### Extraction Pipeline
```typescript
class MetadataExtractor {
  async extract(apiResponse: RapidAPIResponse): Promise<VideoMetadata> {
    const metadata = this.extractCoreMetadata(apiResponse);
    metadata.platformMetadata = this.extractPlatformSpecific(apiResponse);
    metadata.engagement = this.extractEngagementMetrics(apiResponse);

    return this.validate(metadata);
  }

  private extractCoreMetadata(response: any): Partial<VideoMetadata> {
    return {
      title: this.cleanTitle(response.title),
      author: response.author || response.uploader || 'Unknown',
      thumbnail: this.selectBestThumbnail(response.thumbnails),
      duration: this.parseDuration(response.duration),
      uploadDate: this.parseDate(response.upload_date),
      description: response.description
    };
  }
}
```

### Thumbnail Handling
- Download and embed in note (optional)
- Use highest quality available
- Fallback to platform default
- Cache thumbnails locally

### Date Parsing
- Various date formats from different APIs
- Normalize to ISO 8601
- Display in user's preferred format
- Relative dates ("2 days ago")

## Priority
**Must-Have** 🔴

## Estimated Effort
**2-3 days**
