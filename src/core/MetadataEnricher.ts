import { VideoMetadata, VideoPlatform } from '../types';
import { Notice } from 'obsidian';

/**
 * Enriched metadata with additional information
 */
export interface EnrichedMetadata extends VideoMetadata {
  // Social stats
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;

  // Channel/Author info
  channelId?: string;
  channelName?: string;
  channelSubscribers?: number;
  authorVerified?: boolean;

  // Content classification
  category?: string;
  tags?: string[];
  hashtags?: string[];
  mentions?: string[];

  // Additional metadata
  language?: string;
  publishedAt?: string;
  updatedAt?: string;
  thumbnailUrl?: string;
  embedUrl?: string;

  // Related content
  relatedVideos?: Array<{
    id: string;
    title: string;
    url: string;
  }>;

  // Transcription metadata
  hasSubtitles?: boolean;
  availableLanguages?: string[];
}

/**
 * Metadata Enricher - Enriches video metadata with additional information
 */
export class MetadataEnricher {
  private debugMode: boolean;
  private rapidApiKey: string;

  constructor(rapidApiKey: string, debugMode: boolean = false) {
    this.rapidApiKey = rapidApiKey;
    this.debugMode = debugMode;
  }

  /**
   * Enrich basic metadata with additional information
   */
  async enrichMetadata(metadata: VideoMetadata): Promise<EnrichedMetadata> {
    const enriched: EnrichedMetadata = { ...metadata };

    try {
      // Platform-specific enrichment
      switch (metadata.platform) {
        case 'youtube':
          await this.enrichYouTubeMetadata(enriched);
          break;
        case 'instagram':
          await this.enrichInstagramMetadata(enriched);
          break;
        case 'twitter':
          await this.enrichTwitterMetadata(enriched);
          break;
        case 'tiktok':
          await this.enrichTikTokMetadata(enriched);
          break;
        default:
          // Generic enrichment for other platforms
          await this.enrichGenericMetadata(enriched);
      }

      // Extract hashtags and mentions
      this.extractHashtagsAndMentions(enriched);

      if (this.debugMode) {
        console.log('Enriched metadata:', enriched);
      }

      return enriched;
    } catch (error) {
      if (this.debugMode) {
        console.error('Metadata enrichment failed:', error);
      }

      // Return original metadata if enrichment fails
      return enriched;
    }
  }

  /**
   * Enrich YouTube metadata
   */
  private async enrichYouTubeMetadata(metadata: EnrichedMetadata): Promise<void> {
    // Extract video ID from URL or ID field
    const videoId = this.extractYouTubeId(metadata.url);
    if (!videoId) return;

    try {
      // In a real implementation, this would call YouTube Data API
      // For now, we'll add placeholder logic

      // Set embed URL
      metadata.embedUrl = `https://www.youtube.com/embed/${videoId}`;

      // Add category hint based on title keywords
      metadata.category = this.inferCategory(metadata.title);

      if (this.debugMode) {
        console.log('YouTube metadata enriched:', {
          videoId,
          embedUrl: metadata.embedUrl,
          category: metadata.category,
        });
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('YouTube enrichment failed:', error);
      }
    }
  }

  /**
   * Enrich Instagram metadata
   */
  private async enrichInstagramMetadata(metadata: EnrichedMetadata): Promise<void> {
    try {
      // Extract username from URL
      const usernameMatch = metadata.url.match(/instagram\.com\/(?:p|reel)\/([^\/]+)/);
      if (usernameMatch) {
        metadata.channelName = usernameMatch[1];
      }

      metadata.category = 'Social Media';

      if (this.debugMode) {
        console.log('Instagram metadata enriched');
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('Instagram enrichment failed:', error);
      }
    }
  }

  /**
   * Enrich Twitter/X metadata
   */
  private async enrichTwitterMetadata(metadata: EnrichedMetadata): Promise<void> {
    try {
      // Extract username from URL
      const usernameMatch = metadata.url.match(/(?:twitter|x)\.com\/([^\/]+)/);
      if (usernameMatch) {
        metadata.channelName = `@${usernameMatch[1]}`;
      }

      metadata.category = 'Social Media';

      if (this.debugMode) {
        console.log('Twitter metadata enriched');
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('Twitter enrichment failed:', error);
      }
    }
  }

  /**
   * Enrich TikTok metadata
   */
  private async enrichTikTokMetadata(metadata: EnrichedMetadata): Promise<void> {
    try {
      // Extract username from URL
      const usernameMatch = metadata.url.match(/tiktok\.com\/@([^\/]+)/);
      if (usernameMatch) {
        metadata.channelName = `@${usernameMatch[1]}`;
      }

      metadata.category = 'Social Media';

      if (this.debugMode) {
        console.log('TikTok metadata enriched');
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('TikTok enrichment failed:', error);
      }
    }
  }

  /**
   * Generic metadata enrichment
   */
  private async enrichGenericMetadata(metadata: EnrichedMetadata): Promise<void> {
    // Infer category from title
    metadata.category = this.inferCategory(metadata.title);

    if (this.debugMode) {
      console.log('Generic metadata enriched');
    }
  }

  /**
   * Extract hashtags and mentions from title and description
   */
  private extractHashtagsAndMentions(metadata: EnrichedMetadata): void {
    const text = `${metadata.title} ${metadata.description || ''}`;

    // Extract hashtags
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags = Array.from(text.matchAll(hashtagRegex), (m) => m[1]);
    if (hashtags.length > 0) {
      metadata.hashtags = [...new Set(hashtags)];
    }

    // Extract mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = Array.from(text.matchAll(mentionRegex), (m) => m[1]);
    if (mentions.length > 0) {
      metadata.mentions = [...new Set(mentions)];
    }

    if (this.debugMode && (hashtags.length > 0 || mentions.length > 0)) {
      console.log('Extracted:', {
        hashtags: metadata.hashtags,
        mentions: metadata.mentions,
      });
    }
  }

  /**
   * Infer category from video title
   */
  private inferCategory(title: string): string {
    const titleLower = title.toLowerCase();

    const categories = [
      { keywords: ['tutorial', 'how to', 'guide', 'learn'], category: 'Tutorial' },
      { keywords: ['podcast', 'interview', 'talk'], category: 'Podcast' },
      { keywords: ['music', 'song', 'album', 'mv', 'official video'], category: 'Music' },
      { keywords: ['news', 'breaking', 'update'], category: 'News' },
      { keywords: ['review', 'unboxing'], category: 'Review' },
      { keywords: ['gaming', 'gameplay', 'playthrough', 'game'], category: 'Gaming' },
      { keywords: ['cooking', 'recipe', 'food'], category: 'Cooking' },
      { keywords: ['vlog', 'daily', 'day in'], category: 'Vlog' },
      { keywords: ['documentary', 'history'], category: 'Documentary' },
      { keywords: ['comedy', 'funny', 'humor'], category: 'Comedy' },
      { keywords: ['education', 'science', 'lecture'], category: 'Education' },
      { keywords: ['tech', 'technology', 'gadget'], category: 'Technology' },
      { keywords: ['fitness', 'workout', 'exercise'], category: 'Fitness' },
      { keywords: ['travel', 'tour', 'destination'], category: 'Travel' },
    ];

    for (const { keywords, category } of categories) {
      if (keywords.some((keyword) => titleLower.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/,
      /youtube\.com\/embed\/([^&\?\/]+)/,
      /youtube\.com\/v\/([^&\?\/]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Generate tags from title and description
   */
  generateTags(metadata: EnrichedMetadata, maxTags: number = 10): string[] {
    const text = `${metadata.title} ${metadata.description || ''}`.toLowerCase();

    // Remove common words
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
    ]);

    // Extract words
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word));

    // Count word frequency
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Sort by frequency and take top N
    const tags = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTags)
      .map(([word]) => word);

    // Add platform tag
    tags.unshift(metadata.platform);

    // Add category tag
    if (metadata.category) {
      tags.unshift(metadata.category.toLowerCase());
    }

    return [...new Set(tags)];
  }

  /**
   * Extract key information for note frontmatter
   */
  extractFrontmatter(metadata: EnrichedMetadata): Record<string, any> {
    return {
      title: metadata.title,
      author: metadata.author || metadata.channelName || 'Unknown',
      platform: metadata.platform,
      url: metadata.url,
      duration: metadata.duration,
      category: metadata.category || 'General',
      tags: this.generateTags(metadata),
      hashtags: metadata.hashtags || [],
      mentions: metadata.mentions || [],
      transcribed: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
