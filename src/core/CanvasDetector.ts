import { App, TFile } from 'obsidian';
import { DetectedVideoLink } from '../types';
import { isVideoUrl, identifyPlatform, extractVideoId } from '../constants';

/**
 * Canvas node types
 */
interface CanvasNode {
  id: string;
  type: 'text' | 'file' | 'link' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  url?: string;
  file?: string;
}

/**
 * Canvas data structure
 */
interface CanvasData {
  nodes: CanvasNode[];
  edges: any[];
}

/**
 * Canvas Detector - Detects video URLs in Canvas files
 */
export class CanvasDetector {
  private app: App;
  private debugMode: boolean;

  constructor(app: App, debugMode: boolean = false) {
    this.app = app;
    this.debugMode = debugMode;
  }

  /**
   * Check if file is a Canvas file
   */
  isCanvasFile(file: TFile): boolean {
    return file.extension === 'canvas';
  }

  /**
   * Scan Canvas file for video URLs
   */
  async scanCanvasFile(file: TFile): Promise<DetectedVideoLink[]> {
    try {
      // Read Canvas file content
      const content = await this.app.vault.read(file);

      // Parse Canvas JSON
      const canvasData: CanvasData = JSON.parse(content);

      if (!canvasData.nodes || !Array.isArray(canvasData.nodes)) {
        if (this.debugMode) {
          console.warn('Canvas file has invalid structure:', file.path);
        }
        return [];
      }

      const videoLinks: DetectedVideoLink[] = [];

      // Scan each node
      for (const node of canvasData.nodes) {
        const links = this.scanNode(node, file.path);
        videoLinks.push(...links);
      }

      if (this.debugMode && videoLinks.length > 0) {
        console.log(`Found ${videoLinks.length} video links in Canvas file:`, file.path);
      }

      return videoLinks;
    } catch (error) {
      if (this.debugMode) {
        console.error('Failed to scan Canvas file:', file.path, error);
      }
      return [];
    }
  }

  /**
   * Scan individual Canvas node for video URLs
   */
  private scanNode(node: CanvasNode, sourceFile: string): DetectedVideoLink[] {
    const videoLinks: DetectedVideoLink[] = [];

    // Check text nodes
    if (node.type === 'text' && node.text) {
      const urls = this.extractUrls(node.text);
      for (const url of urls) {
        const link = this.createVideoLink(url, sourceFile, node.id);
        if (link) {
          videoLinks.push(link);
        }
      }
    }

    // Check link nodes
    if (node.type === 'link' && node.url) {
      const link = this.createVideoLink(node.url, sourceFile, node.id);
      if (link) {
        videoLinks.push(link);
      }
    }

    return videoLinks;
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
   * Create DetectedVideoLink from URL
   */
  private createVideoLink(
    url: string,
    sourceFile: string,
    nodeId: string
  ): DetectedVideoLink | null {
    if (!isVideoUrl(url)) {
      return null;
    }

    const platform = identifyPlatform(url);
    if (!platform) {
      return null;
    }

    const videoId = extractVideoId(url, platform);
    if (!videoId) {
      return null;
    }

    return {
      url,
      platform,
      videoId,
      context: 'canvas',
      sourceFile,
      metadata: {
        canvasNodeId: nodeId,
      },
    };
  }

  /**
   * Update Canvas node with note link
   */
  async updateNodeWithNoteLink(
    canvasFile: TFile,
    nodeId: string,
    noteFile: TFile
  ): Promise<void> {
    try {
      // Read Canvas file
      const content = await this.app.vault.read(canvasFile);
      const canvasData: CanvasData = JSON.parse(content);

      // Find the node
      const node = canvasData.nodes.find((n) => n.id === nodeId);

      if (!node) {
        if (this.debugMode) {
          console.warn('Canvas node not found:', nodeId);
        }
        return;
      }

      // Add note link to the node
      const noteLink = `[[${noteFile.basename}]]`;

      if (node.type === 'text' && node.text) {
        // Append link to existing text
        node.text = `${node.text}\n\n${noteLink}`;
      } else if (node.type === 'link') {
        // Create a new text node adjacent to the link node
        const newNode: CanvasNode = {
          id: this.generateNodeId(),
          type: 'text',
          x: node.x + node.width + 20, // Position to the right
          y: node.y,
          width: 250,
          height: 60,
          text: `Transcript:\n${noteLink}`,
        };

        canvasData.nodes.push(newNode);

        // Create edge connecting the nodes
        canvasData.edges.push({
          id: this.generateNodeId(),
          fromNode: node.id,
          toNode: newNode.id,
          fromSide: 'right',
          toSide: 'left',
        });
      }

      // Save updated Canvas file
      await this.app.vault.modify(canvasFile, JSON.stringify(canvasData, null, 2));

      if (this.debugMode) {
        console.log('Canvas node updated with note link:', nodeId);
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('Failed to update Canvas node:', error);
      }
    }
  }

  /**
   * Generate unique node ID
   */
  private generateNodeId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
