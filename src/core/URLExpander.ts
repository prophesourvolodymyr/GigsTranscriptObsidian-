import axios from 'axios';

/**
 * URL Expander - Expands shortened URLs to their full form
 */
export class URLExpander {
  private cache: Map<string, string> = new Map();
  private debugMode: boolean;

  // Common URL shorteners
  private readonly shorteners = [
    'bit.ly',
    'tinyurl.com',
    't.co',
    'goo.gl',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'youtu.be',
    'short.gy',
    'cutt.ly',
    'rb.gy',
    'tiny.cc',
  ];

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Check if URL is a shortened URL
   */
  isShortened(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.shorteners.some((shortener) => urlObj.hostname.includes(shortener));
    } catch {
      return false;
    }
  }

  /**
   * Expand shortened URL to full URL
   */
  async expand(url: string): Promise<string> {
    // Check cache first
    if (this.cache.has(url)) {
      if (this.debugMode) {
        console.log('URL Expander: Using cached expansion', { short: url, full: this.cache.get(url) });
      }
      return this.cache.get(url)!;
    }

    // If not shortened, return as-is
    if (!this.isShortened(url)) {
      return url;
    }

    try {
      if (this.debugMode) {
        console.log('URL Expander: Expanding URL', { url });
      }

      // Method 1: HEAD request with redirect following
      const response = await axios.head(url, {
        maxRedirects: 5,
        timeout: 5000,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const expandedUrl = response.request.res.responseUrl || url;

      // Cache the result
      this.cache.set(url, expandedUrl);

      if (this.debugMode) {
        console.log('URL Expander: URL expanded', { short: url, full: expandedUrl });
      }

      return expandedUrl;
    } catch (error) {
      if (this.debugMode) {
        console.warn('URL Expander: Failed to expand URL', { url, error });
      }

      // Return original URL if expansion fails
      return url;
    }
  }

  /**
   * Expand multiple URLs
   */
  async expandMultiple(urls: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    await Promise.all(
      urls.map(async (url) => {
        const expanded = await this.expand(url);
        results.set(url, expanded);
      })
    );

    return results;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
