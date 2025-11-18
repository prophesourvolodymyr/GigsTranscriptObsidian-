/**
 * URL patterns for video platform detection
 */

import { VideoPlatform } from '../types';

export interface PlatformPattern {
  platform: VideoPlatform;
  patterns: RegExp[];
  extractId: (url: string) => string | null;
}

export const VIDEO_PATTERNS: Record<VideoPlatform, PlatformPattern> = {
  youtube: {
    platform: 'youtube',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ],
    extractId: (url: string): string | null => {
      const match = url.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    },
  },

  instagram: {
    platform: 'instagram',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/stories\/([a-zA-Z0-9_.-]+)\/(\d+)/,
    ],
    extractId: (url: string): string | null => {
      const reelMatch = url.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/);
      if (reelMatch) return reelMatch[1];

      const storyMatch = url.match(/instagram\.com\/stories\/[^/]+\/(\d+)/);
      if (storyMatch) return storyMatch[1];

      return null;
    },
  },

  twitter: {
    platform: 'twitter',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/status\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/status\/(\d+)/,
    ],
    extractId: (url: string): string | null => {
      const match = url.match(/status\/(\d+)/);
      return match ? match[1] : null;
    },
  },

  tiktok: {
    platform: 'tiktok',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
      /(?:https?:\/\/)?(?:www\.)?m\.tiktok\.com\/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/,
    ],
    extractId: (url: string): string | null => {
      const videoMatch = url.match(/video\/(\d+)/);
      if (videoMatch) return videoMatch[1];

      const vmMatch = url.match(/vm\.tiktok\.com\/([a-zA-Z0-9]+)/);
      if (vmMatch) return vmMatch[1];

      return null;
    },
  },

  facebook: {
    platform: 'facebook',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/watch\/?\?v=(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^/]+\/videos\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/(\d+)/,
    ],
    extractId: (url: string): string | null => {
      const match = url.match(/(?:v=|videos\/|reel\/)(\d+)/);
      return match ? match[1] : null;
    },
  },

  pinterest: {
    platform: 'pinterest',
    patterns: [/(?:https?:\/\/)?(?:www\.)?pinterest\.com\/pin\/(\d+)/],
    extractId: (url: string): string | null => {
      const match = url.match(/pin\/(\d+)/);
      return match ? match[1] : null;
    },
  },

  threads: {
    platform: 'threads',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?threads\.net\/@([a-zA-Z0-9_.-]+)\/post\/([a-zA-Z0-9_-]+)/,
    ],
    extractId: (url: string): string | null => {
      const match = url.match(/post\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    },
  },

  telegram: {
    platform: 'telegram',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]+)\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?telegram\.(?:me|dog)\/([a-zA-Z0-9_]+)\/(\d+)/,
    ],
    extractId: (url: string): string | null => {
      const match = url.match(/\/([a-zA-Z0-9_]+)\/(\d+)/);
      return match ? match[2] : null;
    },
  },
};

/**
 * Test if a URL matches any video platform pattern
 */
export function isVideoUrl(url: string): boolean {
  for (const pattern of Object.values(VIDEO_PATTERNS)) {
    if (pattern.patterns.some((p) => p.test(url))) {
      return true;
    }
  }
  return false;
}

/**
 * Identify which platform a URL belongs to
 */
export function identifyPlatform(url: string): VideoPlatform | null {
  for (const [platform, pattern] of Object.entries(VIDEO_PATTERNS)) {
    if (pattern.patterns.some((p) => p.test(url))) {
      return platform as VideoPlatform;
    }
  }
  return null;
}

/**
 * Extract video ID from URL
 */
export function extractVideoId(url: string, platform: VideoPlatform): string | null {
  const pattern = VIDEO_PATTERNS[platform];
  return pattern ? pattern.extractId(url) : null;
}

/**
 * Get platform-specific metadata
 */
export function getPlatformInfo(platform: VideoPlatform) {
  const info = {
    youtube: {
      name: 'YouTube',
      icon: '▶️',
      color: '#FF0000',
      supportLevel: 'excellent',
    },
    instagram: {
      name: 'Instagram',
      icon: '📷',
      color: '#E4405F',
      supportLevel: 'good',
    },
    twitter: {
      name: 'X (Twitter)',
      icon: '𝕏',
      color: '#1DA1F2',
      supportLevel: 'excellent',
    },
    tiktok: {
      name: 'TikTok',
      icon: '🎵',
      color: '#000000',
      supportLevel: 'excellent',
    },
    facebook: {
      name: 'Facebook',
      icon: 'f',
      color: '#1877F2',
      supportLevel: 'moderate',
    },
    pinterest: {
      name: 'Pinterest',
      icon: 'P',
      color: '#E60023',
      supportLevel: 'good',
    },
    threads: {
      name: 'Threads',
      icon: '@',
      color: '#000000',
      supportLevel: 'good',
    },
    telegram: {
      name: 'Telegram',
      icon: '✈️',
      color: '#0088CC',
      supportLevel: 'experimental',
    },
  };

  return info[platform];
}
