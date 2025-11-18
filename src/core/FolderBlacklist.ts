import { TFile, TFolder } from 'obsidian';

/**
 * Folder Blacklist - Manages folders excluded from auto-detection
 */
export class FolderBlacklist {
  private blacklist: Set<string> = new Set();
  private patterns: RegExp[] = [];
  private debugMode: boolean;

  constructor(blacklistPaths: string[] = [], debugMode: boolean = false) {
    this.debugMode = debugMode;
    this.setBlacklist(blacklistPaths);
  }

  /**
   * Set blacklist from array of paths/patterns
   */
  setBlacklist(paths: string[]) {
    this.blacklist.clear();
    this.patterns = [];

    for (const path of paths) {
      // Normalize path
      const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '');

      if (this.isPattern(normalizedPath)) {
        // Convert glob pattern to regex
        const regex = this.globToRegex(normalizedPath);
        this.patterns.push(regex);

        if (this.debugMode) {
          console.log('Added blacklist pattern:', normalizedPath, regex);
        }
      } else {
        // Add as exact path
        this.blacklist.add(normalizedPath);

        if (this.debugMode) {
          console.log('Added blacklist path:', normalizedPath);
        }
      }
    }
  }

  /**
   * Check if file is blacklisted
   */
  isFileBlacklisted(file: TFile): boolean {
    return this.isPathBlacklisted(file.path);
  }

  /**
   * Check if folder is blacklisted
   */
  isFolderBlacklisted(folder: TFolder): boolean {
    return this.isPathBlacklisted(folder.path);
  }

  /**
   * Check if path is blacklisted
   */
  isPathBlacklisted(path: string): boolean {
    // Normalize path
    const normalizedPath = path.trim().replace(/^\/+/, '');

    // Check exact matches
    if (this.blacklist.has(normalizedPath)) {
      return true;
    }

    // Check if any parent folder is blacklisted
    const pathParts = normalizedPath.split('/');
    for (let i = 1; i <= pathParts.length; i++) {
      const parentPath = pathParts.slice(0, i).join('/');
      if (this.blacklist.has(parentPath)) {
        return true;
      }
    }

    // Check patterns
    for (const pattern of this.patterns) {
      if (pattern.test(normalizedPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add path to blacklist
   */
  add(path: string) {
    const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '');

    if (this.isPattern(normalizedPath)) {
      const regex = this.globToRegex(normalizedPath);
      this.patterns.push(regex);
    } else {
      this.blacklist.add(normalizedPath);
    }

    if (this.debugMode) {
      console.log('Added to blacklist:', normalizedPath);
    }
  }

  /**
   * Remove path from blacklist
   */
  remove(path: string) {
    const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '');
    this.blacklist.delete(normalizedPath);

    if (this.debugMode) {
      console.log('Removed from blacklist:', normalizedPath);
    }
  }

  /**
   * Clear blacklist
   */
  clear() {
    this.blacklist.clear();
    this.patterns = [];

    if (this.debugMode) {
      console.log('Blacklist cleared');
    }
  }

  /**
   * Get all blacklisted paths
   */
  getAll(): string[] {
    return Array.from(this.blacklist);
  }

  /**
   * Get blacklist size
   */
  size(): number {
    return this.blacklist.size + this.patterns.length;
  }

  /**
   * Check if string is a glob pattern
   */
  private isPattern(str: string): boolean {
    return str.includes('*') || str.includes('?') || str.includes('[');
  }

  /**
   * Convert glob pattern to regex
   */
  private globToRegex(pattern: string): RegExp {
    // Escape special regex characters except glob wildcards
    let regex = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*') // * matches any characters
      .replace(/\?/g, '.'); // ? matches single character

    // Anchor to start and end
    regex = `^${regex}$`;

    return new RegExp(regex);
  }

  /**
   * Get common blacklist suggestions
   */
  static getCommonBlacklist(): string[] {
    return [
      '.obsidian',
      '.trash',
      'Archive',
      'Templates',
      'Daily Notes',
      'Private',
      '.git',
      'node_modules',
    ];
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
