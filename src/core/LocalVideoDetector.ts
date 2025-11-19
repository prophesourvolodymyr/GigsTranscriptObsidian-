import { TFile, TFolder } from 'obsidian';
import LinkVideoTranscriberPlugin from '../main';

/**
 * Supported video formats
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.flv', '.wmv'];

/**
 * Local video file reference
 */
export interface LocalVideoFile {
  file: TFile;
  filePath: string;
  fileName: string;
  fileSize: number;
  extension: string;
  sourceFile?: string; // File where this video was referenced
  context: 'attachment' | 'embed' | 'direct';
}

/**
 * Local Video Detector - Detects local video files in the vault
 */
export class LocalVideoDetector {
  private plugin: LinkVideoTranscriberPlugin;
  private debugMode: boolean;

  constructor(plugin: LinkVideoTranscriberPlugin, debugMode: boolean = false) {
    this.plugin = plugin;
    this.debugMode = debugMode;
  }

  /**
   * Check if file is a video file
   */
  isVideoFile(file: TFile): boolean {
    const ext = file.extension.toLowerCase();
    return VIDEO_EXTENSIONS.some((videoExt) => videoExt === `.${ext}`);
  }

  /**
   * Get all video files in vault
   */
  getAllVideoFiles(): TFile[] {
    const allFiles = this.plugin.app.vault.getFiles();
    return allFiles.filter((file) => this.isVideoFile(file));
  }

  /**
   * Get video files in a specific folder
   */
  getVideoFilesInFolder(folder: TFolder): TFile[] {
    const allVideos = this.getAllVideoFiles();
    return allVideos.filter((file) => file.parent?.path === folder.path);
  }

  /**
   * Detect video file embeds in markdown content
   * Looks for: ![[video.mp4]], ![](video.mp4), [[video.mp4]]
   */
  async detectInMarkdown(content: string, sourceFile: string): Promise<LocalVideoFile[]> {
    const videos: LocalVideoFile[] = [];

    // Pattern 1: Wiki-style embeds ![[video.mp4]]
    const wikiEmbedRegex = /!\[\[([^\]]+\.(mp4|mov|avi|mkv|webm|m4v|flv|wmv))\]\]/gi;
    const wikiMatches = content.matchAll(wikiEmbedRegex);

    for (const match of wikiMatches) {
      const fileName = match[1];
      const file = this.plugin.app.metadataCache.getFirstLinkpathDest(fileName, sourceFile);

      if (file && this.isVideoFile(file)) {
        videos.push(this.createLocalVideoFile(file, sourceFile, 'embed'));
      }
    }

    // Pattern 2: Markdown embeds ![](video.mp4) or ![alt](video.mp4)
    const mdEmbedRegex = /!\[[^\]]*\]\(([^\)]+\.(mp4|mov|avi|mkv|webm|m4v|flv|wmv))\)/gi;
    const mdMatches = content.matchAll(mdEmbedRegex);

    for (const match of mdMatches) {
      const filePath = match[1];
      const file = this.plugin.app.vault.getAbstractFileByPath(filePath);

      if (file instanceof TFile && this.isVideoFile(file)) {
        videos.push(this.createLocalVideoFile(file, sourceFile, 'embed'));
      }
    }

    // Pattern 3: Wiki-style links (without !) [[video.mp4]]
    const wikiLinkRegex = /(?<!\!)\[\[([^\]]+\.(mp4|mov|avi|mkv|webm|m4v|flv|wmv))\]\]/gi;
    const linkMatches = content.matchAll(wikiLinkRegex);

    for (const match of linkMatches) {
      const fileName = match[1];
      const file = this.plugin.app.metadataCache.getFirstLinkpathDest(fileName, sourceFile);

      if (file && this.isVideoFile(file)) {
        videos.push(this.createLocalVideoFile(file, sourceFile, 'attachment'));
      }
    }

    if (this.debugMode && videos.length > 0) {
      console.log(`Detected ${videos.length} local video files in markdown:`, videos);
    }

    return videos;
  }

  /**
   * Detect video files in Excalidraw
   * Excalidraw stores files in its JSON structure
   */
  async detectInExcalidraw(file: TFile): Promise<LocalVideoFile[]> {
    const videos: LocalVideoFile[] = [];

    try {
      const content = await this.plugin.app.vault.read(file);

      // Look for Excalidraw file references in JSON
      // Excalidraw stores files with keys like "files": {"fileId": {...}}
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

      if (!jsonMatch) return videos;

      const data = JSON.parse(jsonMatch[1]);

      // Check for embedded files
      if (data.files) {
        for (const [fileId, fileData] of Object.entries(data.files)) {
          const fileInfo = fileData as any;

          // Check if it's a video file by dataURL or mimeType
          if (
            fileInfo.mimeType?.startsWith('video/') ||
            fileInfo.dataURL?.startsWith('data:video/')
          ) {
            // For embedded data URLs, we'd need to extract and save
            // For now, we'll look for file references in text elements
            if (this.debugMode) {
              console.log('Found embedded video in Excalidraw:', fileId);
            }
          }
        }
      }

      // Also check text elements for file paths
      if (data.elements) {
        for (const element of data.elements) {
          if (element.text) {
            const textVideos = await this.detectInMarkdown(element.text, file.path);
            videos.push(...textVideos);
          }
        }
      }

      if (this.debugMode && videos.length > 0) {
        console.log(`Detected ${videos.length} video files in Excalidraw:`, videos);
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('Error detecting videos in Excalidraw:', error);
      }
    }

    return videos;
  }

  /**
   * Scan a note file for video references
   */
  async scanFile(file: TFile): Promise<LocalVideoFile[]> {
    // Check if it's an Excalidraw file
    if (this.plugin.excalidrawDetector?.isExcalidrawFile(file)) {
      return await this.detectInExcalidraw(file);
    }

    // Regular markdown file
    if (file.extension === 'md') {
      const content = await this.plugin.app.vault.read(file);
      return await this.detectInMarkdown(content, file.path);
    }

    return [];
  }

  /**
   * Scan all files in vault for local video references
   */
  async scanAllFiles(): Promise<Map<string, LocalVideoFile[]>> {
    const results = new Map<string, LocalVideoFile[]>();

    const files = this.plugin.app.vault.getMarkdownFiles();

    for (const file of files) {
      const videos = await this.scanFile(file);

      if (videos.length > 0) {
        results.set(file.path, videos);
      }
    }

    if (this.debugMode) {
      console.log('Local video scan complete:', {
        filesWithVideos: results.size,
        totalVideos: Array.from(results.values()).flat().length,
      });
    }

    return results;
  }

  /**
   * Get file size in MB
   */
  getFileSizeMB(file: TFile): number {
    return file.stat.size / (1024 * 1024);
  }

  /**
   * Check if file is too large for processing
   */
  isFileTooLarge(file: TFile, maxSizeMB: number = 100): boolean {
    return this.getFileSizeMB(file) > maxSizeMB;
  }

  /**
   * Create LocalVideoFile object
   */
  private createLocalVideoFile(
    file: TFile,
    sourceFile: string,
    context: 'attachment' | 'embed' | 'direct'
  ): LocalVideoFile {
    return {
      file,
      filePath: file.path,
      fileName: file.name,
      fileSize: file.stat.size,
      extension: file.extension,
      sourceFile,
      context,
    };
  }

  /**
   * Get absolute file path for processing
   */
  getAbsolutePath(file: TFile): string {
    // @ts-ignore - accessing adapter basePath
    const basePath = this.plugin.app.vault.adapter.basePath;
    return `${basePath}/${file.path}`;
  }

  /**
   * Get statistics about local videos
   */
  async getStatistics(): Promise<{
    totalVideoFiles: number;
    totalSizeMB: number;
    largestFile: { name: string; sizeMB: number } | null;
    filesByExtension: Record<string, number>;
  }> {
    const allVideos = this.getAllVideoFiles();

    const stats = {
      totalVideoFiles: allVideos.length,
      totalSizeMB: 0,
      largestFile: null as { name: string; sizeMB: number } | null,
      filesByExtension: {} as Record<string, number>,
    };

    let largestSize = 0;

    for (const video of allVideos) {
      const sizeMB = this.getFileSizeMB(video);
      stats.totalSizeMB += sizeMB;

      // Track largest file
      if (sizeMB > largestSize) {
        largestSize = sizeMB;
        stats.largestFile = {
          name: video.name,
          sizeMB: Math.round(sizeMB * 100) / 100,
        };
      }

      // Count by extension
      const ext = `.${video.extension}`;
      stats.filesByExtension[ext] = (stats.filesByExtension[ext] || 0) + 1;
    }

    stats.totalSizeMB = Math.round(stats.totalSizeMB * 100) / 100;

    return stats;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
