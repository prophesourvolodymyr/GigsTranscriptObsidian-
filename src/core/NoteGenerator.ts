import { App, TFile, TFolder, normalizePath } from 'obsidian';
import { TemplateEngine } from './TemplateEngine';
import { TemplateData, LinkVideoTranscriberSettings } from '../types';
import moment from 'moment';

/**
 * Note Generator - Creates and organizes transcript notes in the vault
 */
export class NoteGenerator {
  private app: App;
  private settings: LinkVideoTranscriberSettings;
  private templateEngine: TemplateEngine;

  constructor(app: App, settings: LinkVideoTranscriberSettings) {
    this.app = app;
    this.settings = settings;
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Generate and create a transcript note
   */
  async generateNote(data: TemplateData): Promise<TFile> {
    // Get template content
    const templateContent = this.getTemplateContent();

    // Render template with data
    const noteContent = this.templateEngine.render(templateContent, data);

    // Generate filename
    const filename = this.generateFilename(data);

    // Determine folder path
    const folderPath = this.getFolderPath(data);

    // Create folder if it doesn't exist
    await this.ensureFolderExists(folderPath);

    // Create full file path
    const filePath = normalizePath(`${folderPath}/${filename}.md`);

    // Check for existing file and handle collision
    const finalPath = await this.handleFileCollision(filePath);

    // Create the note
    const file = await this.app.vault.create(finalPath, noteContent);

    return file;
  }

  /**
   * Get template content based on settings
   */
  private getTemplateContent(): string {
    const templates = this.templateEngine.getBuiltInTemplates();
    const templateName = this.settings.defaultTemplate || 'default';

    if (templates[templateName]) {
      return templates[templateName];
    }

    // Fallback to default template
    return templates.default;
  }

  /**
   * Generate filename from pattern
   */
  private generateFilename(data: TemplateData): string {
    let pattern = this.settings.filenamePattern || '{title} - {date}';

    // Replace placeholders
    const replacements: Record<string, string> = {
      '{title}': this.sanitizeFilename(data.title),
      '{date}': moment(data.transcribedAt).format('YYYY-MM-DD'),
      '{datetime}': moment(data.transcribedAt).format('YYYY-MM-DD HH-mm'),
      '{platform}': data.platform,
      '{author}': this.sanitizeFilename(data.author),
      '{videoId}': data.videoId,
      '{timestamp}': moment(data.transcribedAt).format('YYYYMMDD-HHmmss'),
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      pattern = pattern.replace(new RegExp(placeholder, 'g'), value);
    }

    return this.sanitizeFilename(pattern);
  }

  /**
   * Sanitize filename (remove invalid characters)
   */
  private sanitizeFilename(filename: string): string {
    // Remove invalid characters for file systems
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid chars
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .substring(0, 255); // Limit length
  }

  /**
   * Get folder path based on organization strategy
   */
  private getFolderPath(data: TemplateData): string {
    const baseFolder = this.settings.noteFolder || 'Transcripts';
    const strategy = this.settings.folderOrganization || 'platform';

    let subFolder = '';

    switch (strategy) {
      case 'platform':
        subFolder = this.capitalize(data.platform);
        break;

      case 'date':
        subFolder = moment(data.transcribedAt).format('YYYY/MM');
        break;

      case 'author':
        subFolder = this.sanitizeFilename(data.author);
        break;

      case 'custom':
        subFolder = this.settings.customFolderPath || '';
        break;

      default:
        subFolder = '';
    }

    if (subFolder) {
      return normalizePath(`${baseFolder}/${subFolder}`);
    }

    return normalizePath(baseFolder);
  }

  /**
   * Ensure folder exists, create if not
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    const normalizedPath = normalizePath(folderPath);

    // Check if folder exists
    const folder = this.app.vault.getAbstractFileByPath(normalizedPath);

    if (!folder) {
      // Create folder recursively
      await this.app.vault.createFolder(normalizedPath);
    }
  }

  /**
   * Handle filename collision by appending number
   */
  private async handleFileCollision(filePath: string): Promise<string> {
    const normalizedPath = normalizePath(filePath);

    // Check if file exists
    const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath);

    if (!existingFile) {
      return normalizedPath;
    }

    // File exists, append number
    const pathWithoutExt = normalizedPath.replace(/\.md$/, '');
    let counter = 1;

    while (true) {
      const newPath = `${pathWithoutExt} (${counter}).md`;
      const exists = this.app.vault.getAbstractFileByPath(newPath);

      if (!exists) {
        return newPath;
      }

      counter++;

      // Prevent infinite loop
      if (counter > 1000) {
        throw new Error('Too many file collisions. Please rename existing files.');
      }
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Generate tags for note
   */
  generateTags(data: TemplateData): string[] {
    const tags: string[] = [];
    const strategy = this.settings.tagStrategy || 'auto';

    if (strategy === 'none') {
      return [];
    }

    if (strategy === 'auto' || strategy === 'manual') {
      // Always add base tags
      tags.push('transcript');
      tags.push(data.platform.toLowerCase());

      // Add author tag
      if (data.author) {
        const authorTag = this.sanitizeTag(data.author);
        if (authorTag) {
          tags.push(authorTag);
        }
      }

      // Add AI-detected topic tags
      if (data.topics && data.topics.length > 0) {
        data.topics.forEach((topic) => {
          const topicTag = this.sanitizeTag(topic);
          if (topicTag) {
            tags.push(topicTag);
          }
        });
      }

      // Add custom tags from settings (if any)
      // TODO: Add custom tags from settings
    }

    // Remove duplicates and return
    return [...new Set(tags)];
  }

  /**
   * Sanitize tag (remove spaces, special chars)
   */
  private sanitizeTag(tag: string): string {
    return tag
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with dash
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  }

  /**
   * Replace video link with note link in source file
   */
  async replaceVideoLinkWithNoteLink(
    sourceFilePath: string,
    videoUrl: string,
    noteFile: TFile
  ): Promise<void> {
    const strategy = this.settings.linkStrategy || 'link';

    if (strategy === 'none') {
      return;
    }

    try {
      // Get source file
      const sourceFile = this.app.vault.getAbstractFileByPath(sourceFilePath);

      if (!sourceFile || !(sourceFile instanceof TFile)) {
        return;
      }

      // Read source file content
      const content = await this.app.vault.read(sourceFile);

      // Create note link
      const noteLink =
        strategy === 'embed'
          ? `![[${noteFile.basename}]]`
          : `[[${noteFile.basename}]]`;

      // Replace video URL with note link
      const newContent = content.replace(videoUrl, `${videoUrl}\n\n${noteLink}`);

      // Write back to source file
      await this.app.vault.modify(sourceFile, newContent);
    } catch (error) {
      console.error('Failed to replace video link:', error);
      // Non-critical error, just log it
    }
  }

  /**
   * Open note after creation
   */
  async openNote(file: TFile): Promise<void> {
    if (this.settings.openNoteOnCreate) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    }
  }

  /**
   * Update settings
   */
  updateSettings(settings: LinkVideoTranscriberSettings) {
    this.settings = settings;
  }

  /**
   * Get template engine (for external access)
   */
  getTemplateEngine(): TemplateEngine {
    return this.templateEngine;
  }
}
