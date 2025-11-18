import axios, { AxiosInstance, AxiosError } from 'axios';
import { VideoMetadata, VideoPlatform, RapidAPIResponse } from '../types';
import { Notice } from 'obsidian';

/**
 * RapidAPI Client - Handles video extraction from all platforms
 * Uses RapidAPI marketplace for video metadata and download URLs
 */
export class RapidAPIClient {
  private client: AxiosInstance;
  private apiKey: string;
  private debugMode: boolean;

  constructor(apiKey: string, debugMode: boolean = false) {
    this.apiKey = apiKey;
    this.debugMode = debugMode;

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: 'https://instagram-tiktok-youtube-downloader.p.rapidapi.com',
      timeout: 30000, // 30 seconds
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': 'instagram-tiktok-youtube-downloader.p.rapidapi.com',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (this.debugMode) {
          console.log('RapidAPI Request:', {
            url: config.url,
            method: config.method,
            params: config.params,
          });
        }
        return config;
      },
      (error) => {
        if (this.debugMode) {
          console.error('RapidAPI Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        if (this.debugMode) {
          console.log('RapidAPI Response:', {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      (error) => {
        if (this.debugMode) {
          console.error('RapidAPI Response Error:', error);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Extract video metadata and download URLs
   */
  async extractVideo(url: string, platform: VideoPlatform): Promise<VideoMetadata> {
    try {
      const response = await this.client.get('/auto_download', {
        params: { url },
      });

      const data = response.data;

      if (!data || data.error) {
        throw new Error(data?.error || 'Failed to extract video');
      }

      // Normalize response to VideoMetadata format
      return this.normalizeResponse(data, url, platform);
    } catch (error) {
      return this.handleError(error, url, platform);
    }
  }

  /**
   * Normalize API response to VideoMetadata format
   */
  private normalizeResponse(
    data: any,
    url: string,
    platform: VideoPlatform
  ): VideoMetadata {
    // Extract core metadata
    const metadata: VideoMetadata = {
      title: data.title || 'Untitled Video',
      author: data.author || data.uploader || 'Unknown',
      authorId: data.author_id || data.uploader_id,
      platform,
      url,
      videoId: data.id || this.extractVideoIdFromUrl(url, platform),
      duration: this.parseDuration(data.duration),
      thumbnail: data.thumbnail || data.thumbnails?.[0]?.url,
      uploadDate: data.upload_date || data.timestamp,
      description: data.description,
      viewCount: this.parseNumber(data.view_count || data.views),
      likeCount: this.parseNumber(data.like_count || data.likes),
      commentCount: this.parseNumber(data.comment_count),
      category: data.category,
      tags: data.tags || [],
      language: data.language,
      downloadUrl: data.download_url || data.video_url,
      audioUrl: data.audio_url,
      platformMetadata: {
        rawResponse: data,
      },
    };

    return metadata;
  }

  /**
   * Parse duration from various formats (seconds, "MM:SS", "HH:MM:SS")
   */
  private parseDuration(duration: any): number {
    if (typeof duration === 'number') {
      return duration;
    }

    if (typeof duration === 'string') {
      const parts = duration.split(':').map((p) => parseInt(p, 10));
      if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
      }
    }

    return 0;
  }

  /**
   * Parse number from string or number
   */
  private parseNumber(value: any): number | undefined {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  /**
   * Extract video ID from URL (fallback)
   */
  private extractVideoIdFromUrl(url: string, platform: VideoPlatform): string {
    // Simple extraction - this is a fallback
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter((p) => p);
    return pathParts[pathParts.length - 1] || 'unknown';
  }

  /**
   * Handle API errors with user-friendly messages
   */
  private handleError(error: any, url: string, platform: VideoPlatform): never {
    let errorMessage = 'Failed to extract video';
    let errorCode = 'UNKNOWN_ERROR';

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status;
        const data: any = axiosError.response.data;

        switch (status) {
          case 400:
            errorMessage = 'Invalid video URL or unsupported platform';
            errorCode = 'INVALID_URL';
            break;
          case 401:
            errorMessage = 'Invalid RapidAPI key. Please check your settings.';
            errorCode = 'INVALID_API_KEY';
            break;
          case 403:
            errorMessage = 'API access forbidden. Please check your subscription.';
            errorCode = 'FORBIDDEN';
            break;
          case 404:
            errorMessage = 'Video not found or unavailable';
            errorCode = 'VIDEO_NOT_FOUND';
            break;
          case 429:
            errorMessage = 'API rate limit exceeded. Please try again later.';
            errorCode = 'RATE_LIMIT';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'API server error. Please try again later.';
            errorCode = 'SERVER_ERROR';
            break;
          default:
            errorMessage = data?.message || `API error (${status})`;
            errorCode = 'API_ERROR';
        }
      } else if (axiosError.request) {
        // Request made but no response received
        errorMessage = 'No response from API. Check your internet connection.';
        errorCode = 'NO_RESPONSE';
      } else {
        // Error setting up request
        errorMessage = axiosError.message;
        errorCode = 'REQUEST_ERROR';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = 'EXTRACTION_ERROR';
    }

    if (this.debugMode) {
      console.error('RapidAPI Error:', {
        code: errorCode,
        message: errorMessage,
        platform,
        url,
        error,
      });
    }

    // Show user notification
    new Notice(`❌ ${errorMessage}`);

    throw new Error(`[${errorCode}] ${errorMessage}`);
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a known YouTube URL
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      await this.client.get('/auto_download', {
        params: { url: testUrl },
        timeout: 10000, // 10 seconds for test
      });
      return true;
    } catch (error) {
      if (this.debugMode) {
        console.error('RapidAPI connection test failed:', error);
      }
      return false;
    }
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client.defaults.headers['x-rapidapi-key'] = apiKey;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
