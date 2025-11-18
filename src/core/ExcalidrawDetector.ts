import { TFile } from 'obsidian';
import LinkVideoTranscriberPlugin from '../main';
import { DetectedVideoLink } from '../types';

/**
 * Excalidraw element with text
 */
interface ExcalidrawElement {
  type: string;
  text?: string;
  id: string;
  x: number;
  y: number;
}

/**
 * Excalidraw file structure
 */
interface ExcalidrawData {
  type: string;
  version: number;
  source: string;
  elements: ExcalidrawElement[];
  appState?: any;
  files?: any;
}

/**
 * Excalidraw Detector - Detects video links in Excalidraw drawings
 */
export class ExcalidrawDetector {
  private plugin: LinkVideoTranscriberPlugin;
  private debugMode: boolean;

  constructor(plugin: LinkVideoTranscriberPlugin, debugMode: boolean = false) {
    this.plugin = plugin;
    this.debugMode = debugMode;
  }

  /**
   * Check if file is an Excalidraw file
   */
  isExcalidrawFile(file: TFile): boolean {
    if (file.extension !== 'md') return false;

    // Excalidraw files typically have .excalidraw.md extension
    // or contain excalidraw data markers
    return file.name.endsWith('.excalidraw.md') || file.basename.includes('excalidraw');
  }

  /**
   * Parse Excalidraw data from markdown file
   */
  async parseExcalidrawData(file: TFile): Promise<ExcalidrawData | null> {
    try {
      const content = await this.plugin.app.vault.read(file);

      // Excalidraw data is stored as JSON in a code block
      // Look for ```json excalidraw data
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

      if (!jsonMatch) {
        // Try alternative format with excalidraw-md marker
        const altMatch = content.match(/# Excalidraw Data[\s\S]*?```json\n([\s\S]*?)\n```/);
        if (altMatch) {
          const data = JSON.parse(altMatch[1]);
          return data;
        }

        if (this.debugMode) {
          console.log('No Excalidraw data found in file:', file.path);
        }
        return null;
      }

      const data: ExcalidrawData = JSON.parse(jsonMatch[1]);

      if (this.debugMode) {
        console.log('Parsed Excalidraw data:', {
          file: file.path,
          elements: data.elements.length,
        });
      }

      return data;
    } catch (error) {
      if (this.debugMode) {
        console.error('Error parsing Excalidraw file:', file.path, error);
      }
      return null;
    }
  }

  /**
   * Extract text from Excalidraw elements
   */
  extractTextFromElements(elements: ExcalidrawElement[]): string[] {
    const texts: string[] = [];

    for (const element of elements) {
      // Text elements have a text property
      if (element.text && element.text.trim()) {
        texts.push(element.text.trim());
      }
    }

    if (this.debugMode) {
      console.log('Extracted text elements:', texts.length);
    }

    return texts;
  }

  /**
   * Detect video links in Excalidraw file
   */
  async detectInFile(file: TFile): Promise<DetectedVideoLink[]> {
    if (!this.isExcalidrawFile(file)) {
      return [];
    }

    const data = await this.parseExcalidrawData(file);
    if (!data || !data.elements) {
      return [];
    }

    // Extract text from all elements
    const texts = this.extractTextFromElements(data.elements);

    // Detect video links in the text
    const allLinks: DetectedVideoLink[] = [];

    for (const text of texts) {
      const links = await this.plugin.linkDetector.detectInText(text, 'excalidraw', file.path);
      allLinks.push(...links);
    }

    if (this.debugMode) {
      console.log(`Found ${allLinks.length} video links in Excalidraw file:`, file.path);
    }

    return allLinks;
  }

  /**
   * Scan all Excalidraw files in vault
   */
  async scanAllFiles(): Promise<Map<string, DetectedVideoLink[]>> {
    const results = new Map<string, DetectedVideoLink[]>();

    const files = this.plugin.app.vault.getMarkdownFiles();

    for (const file of files) {
      if (this.isExcalidrawFile(file)) {
        const links = await this.detectInFile(file);

        if (links.length > 0) {
          results.set(file.path, links);
        }
      }
    }

    if (this.debugMode) {
      console.log('Excalidraw scan complete:', {
        filesScanned: results.size,
        totalLinks: Array.from(results.values()).flat().length,
      });
    }

    return results;
  }

  /**
   * Get statistics about Excalidraw files
   */
  async getStatistics(): Promise<{
    totalFiles: number;
    filesWithLinks: number;
    totalLinks: number;
  }> {
    const results = await this.scanAllFiles();

    return {
      totalFiles: this.plugin.app.vault
        .getMarkdownFiles()
        .filter((f) => this.isExcalidrawFile(f)).length,
      filesWithLinks: results.size,
      totalLinks: Array.from(results.values()).flat().length,
    };
  }

  /**
   * Monitor Excalidraw file for changes
   */
  async monitorFile(file: TFile, callback: (links: DetectedVideoLink[]) => void): Promise<void> {
    // Set up a file modification listener
    const listener = async (modifiedFile: TFile) => {
      if (modifiedFile.path === file.path) {
        const links = await this.detectInFile(file);
        callback(links);
      }
    };

    // Register the listener
    this.plugin.registerEvent(this.plugin.app.vault.on('modify', listener));
  }

  /**
   * Check if Excalidraw plugin is installed
   */
  isExcalidrawPluginInstalled(): boolean {
    // @ts-ignore - Check for Excalidraw plugin
    const plugins = (this.plugin.app as any).plugins?.plugins;
    return plugins && plugins['obsidian-excalidraw-plugin'] !== undefined;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
