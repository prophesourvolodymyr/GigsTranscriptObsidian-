import { Notice } from 'obsidian';
import { DetectedVideoLink, VideoPlatform } from '../types';
import { isVideoUrl, identifyPlatform, extractVideoId } from '../constants';
import { URLExpander } from './URLExpander';
import LinkVideoTranscriberPlugin from '../main';

/**
 * Link Detector - Identifies video URLs in various contexts
 */
export class LinkDetector {
  private plugin: LinkVideoTranscriberPlugin;
  private detectedLinks: Map<string, DetectedVideoLink> = new Map();
  private urlExpander: URLExpander;

  constructor(plugin: LinkVideoTranscriberPlugin) {
    this.plugin = plugin;
    this.urlExpander = new URLExpander(plugin.settings.debugMode);
  }

  /**
   * Detect video links in text
   */
  async detectInText(
    text: string,
    context: 'markdown' | 'canvas' | 'excalidraw',
    sourceFile?: string
  ): Promise<DetectedVideoLink[]> {
    const urls = this.extractUrls(text);
    const videoLinks: DetectedVideoLink[] = [];

    for (let url of urls) {
      // Expand shortened URLs if enabled
      if (this.plugin.settings.expandShortenedUrls && this.urlExpander.isShortened(url)) {
        try {
          url = await this.urlExpander.expand(url);
          if (this.plugin.settings.debugMode) {
            console.log('Expanded URL:', url);
          }
        } catch (error) {
          console.warn('Failed to expand URL:', url, error);
          // Continue with original URL
        }
      }

      if (isVideoUrl(url)) {
        const platform = identifyPlatform(url);
        if (platform) {
          const videoId = extractVideoId(url, platform);
          if (videoId) {
            const link: DetectedVideoLink = {
              url,
              platform,
              videoId,
              context,
              sourceFile,
            };

            videoLinks.push(link);
            this.detectedLinks.set(url, link);
          }
        }
      }
    }

    if (videoLinks.length > 0) {
      this.handleDetectedLinks(videoLinks);
    }

    return videoLinks;
  }

  /**
   * Scan file content for video links
   */
  async scanFileContent(content: string, filePath: string): Promise<DetectedVideoLink[]> {
    // Check if file is in blacklisted folder
    if (this.plugin.folderBlacklist && this.plugin.folderBlacklist.isPathBlacklisted(filePath)) {
      if (this.plugin.settings.debugMode) {
        console.log('File in blacklisted folder, skipping:', filePath);
      }
      return [];
    }

    return this.detectInText(content, 'markdown', filePath);
  }

  /**
   * Extract URLs from text
   */
  private extractUrls(text: string): string[] {
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const matches = text.match(urlRegex);
    return matches || [];
  }

  /**
   * Handle detected video links
   */
  private async handleDetectedLinks(links: DetectedVideoLink[]) {
    if (links.length === 0) return;

    if (this.plugin.settings.debugMode) {
      console.log('Detected video links:', links);
    }

    // Handle first link (for now, TODO: batch handling)
    if (links.length > 0) {
      await this.plugin.handleDetectedLink(links[0]);
    }

    // Show notification for additional links
    if (links.length > 1) {
      new Notice(`Found ${links.length} video links. Processing first one...`);
    }
  }

  /**
   * Clear detected links cache
   */
  clearCache() {
    this.detectedLinks.clear();
  }

  /**
   * Get cached detected links
   */
  getCachedLinks(): DetectedVideoLink[] {
    return Array.from(this.detectedLinks.values());
  }
}
