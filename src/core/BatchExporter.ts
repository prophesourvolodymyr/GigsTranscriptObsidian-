import { App, TFile, TFolder } from 'obsidian';

/**
 * Export format
 */
export type ExportFormat = 'markdown' | 'txt' | 'json' | 'csv' | 'html';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeSummary: boolean;
  includeTranscript: boolean;
  folder?: string;
  filePattern?: string;
}

/**
 * Batch Exporter - Export multiple transcripts in various formats
 */
export class BatchExporter {
  private app: App;
  private debugMode: boolean;

  constructor(app: App, debugMode: boolean = false) {
    this.app = app;
    this.debugMode = debugMode;
  }

  /**
   * Export transcripts from a folder
   */
  async exportFolder(
    folderPath: string,
    outputPath: string,
    options: ExportOptions
  ): Promise<number> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);

    if (!folder || !(folder instanceof TFolder)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    const files = this.getMarkdownFiles(folder);

    if (this.debugMode) {
      console.log(`Found ${files.length} markdown files in ${folderPath}`);
    }

    let exportedCount = 0;

    for (const file of files) {
      try {
        await this.exportFile(file, outputPath, options);
        exportedCount++;
      } catch (error) {
        if (this.debugMode) {
          console.error(`Failed to export ${file.path}:`, error);
        }
      }
    }

    return exportedCount;
  }

  /**
   * Export single file
   */
  async exportFile(file: TFile, outputPath: string, options: ExportOptions): Promise<void> {
    const content = await this.app.vault.read(file);

    const exportedContent = await this.convertToFormat(content, file, options);

    // Generate output filename
    const outputFilename = this.generateOutputFilename(file, options.format);
    const fullOutputPath = `${outputPath}/${outputFilename}`;

    // Create or update export file
    await this.writeExportFile(fullOutputPath, exportedContent);

    if (this.debugMode) {
      console.log(`Exported ${file.path} to ${fullOutputPath}`);
    }
  }

  /**
   * Convert content to specified format
   */
  private async convertToFormat(
    content: string,
    file: TFile,
    options: ExportOptions
  ): Promise<string> {
    switch (options.format) {
      case 'markdown':
        return this.convertToMarkdown(content, options);

      case 'txt':
        return this.convertToText(content, options);

      case 'json':
        return this.convertToJSON(content, file, options);

      case 'csv':
        return this.convertToCSV(content, file, options);

      case 'html':
        return this.convertToHTML(content, file, options);

      default:
        return content;
    }
  }

  /**
   * Convert to Markdown (filtered)
   */
  private convertToMarkdown(content: string, options: ExportOptions): string {
    if (options.includeMetadata && options.includeSummary && options.includeTranscript) {
      return content; // Return as-is
    }

    // Parse and filter content
    const sections = this.parseContent(content);
    let output = '';

    if (options.includeMetadata && sections.frontmatter) {
      output += sections.frontmatter + '\n\n';
    }

    if (options.includeSummary && sections.summary) {
      output += sections.summary + '\n\n';
    }

    if (options.includeTranscript && sections.transcript) {
      output += sections.transcript;
    }

    return output.trim();
  }

  /**
   * Convert to plain text
   */
  private convertToText(content: string, options: ExportOptions): string {
    // Remove frontmatter
    let text = content.replace(/^---[\s\S]*?---\n/m, '');

    // Remove markdown formatting
    text = text
      .replace(/#+\s/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1'); // Remove inline code

    if (!options.includeMetadata) {
      // Remove metadata lines (lines starting with "**")
      text = text.replace(/^\*\*[^:]+:\*\*.*$/gm, '');
    }

    return text.trim();
  }

  /**
   * Convert to JSON
   */
  private convertToJSON(content: string, file: TFile, options: ExportOptions): string {
    const sections = this.parseContent(content);
    const metadata = this.extractMetadata(sections.frontmatter || '');

    const jsonData: any = {
      filename: file.basename,
      path: file.path,
      createdAt: file.stat.ctime,
      modifiedAt: file.stat.mtime,
    };

    if (options.includeMetadata) {
      jsonData.metadata = metadata;
    }

    if (options.includeSummary && sections.summary) {
      jsonData.summary = sections.summary;
    }

    if (options.includeTranscript && sections.transcript) {
      jsonData.transcript = sections.transcript;
    }

    return JSON.stringify(jsonData, null, 2);
  }

  /**
   * Convert to CSV
   */
  private convertToCSV(content: string, file: TFile, options: ExportOptions): string {
    const sections = this.parseContent(content);
    const metadata = this.extractMetadata(sections.frontmatter || '');

    // CSV header
    const headers = ['Filename', 'Platform', 'Author', 'Duration', 'Date'];

    if (options.includeSummary) {
      headers.push('Summary');
    }

    if (options.includeTranscript) {
      headers.push('Transcript');
    }

    // CSV row
    const row = [
      this.escapeCsv(file.basename),
      this.escapeCsv(metadata.platform || ''),
      this.escapeCsv(metadata.author || ''),
      this.escapeCsv(metadata.duration || ''),
      this.escapeCsv(metadata.transcribed || ''),
    ];

    if (options.includeSummary) {
      row.push(this.escapeCsv(sections.summary || ''));
    }

    if (options.includeTranscript) {
      row.push(this.escapeCsv(sections.transcript || ''));
    }

    return headers.join(',') + '\n' + row.join(',');
  }

  /**
   * Convert to HTML
   */
  private convertToHTML(content: string, file: TFile, options: ExportOptions): string {
    const sections = this.parseContent(content);
    const metadata = this.extractMetadata(sections.frontmatter || '');

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${file.basename}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .summary { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .transcript { line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${file.basename}</h1>`;

    if (options.includeMetadata && metadata) {
      html += `\n  <div class="metadata">`;
      html += `\n    <p><strong>Platform:</strong> ${metadata.platform || 'Unknown'}</p>`;
      html += `\n    <p><strong>Author:</strong> ${metadata.author || 'Unknown'}</p>`;
      html += `\n    <p><strong>Date:</strong> ${metadata.transcribed || 'Unknown'}</p>`;
      html += `\n  </div>`;
    }

    if (options.includeSummary && sections.summary) {
      html += `\n  <div class="summary">`;
      html += `\n    <h2>Summary</h2>`;
      html += `\n    <p>${this.escapeHtml(sections.summary)}</p>`;
      html += `\n  </div>`;
    }

    if (options.includeTranscript && sections.transcript) {
      html += `\n  <div class="transcript">`;
      html += `\n    <h2>Transcript</h2>`;
      html += `\n    <p>${this.escapeHtml(sections.transcript).replace(/\n/g, '<br>')}</p>`;
      html += `\n  </div>`;
    }

    html += `\n</body>\n</html>`;

    return html;
  }

  /**
   * Parse content into sections
   */
  private parseContent(content: string): {
    frontmatter?: string;
    summary?: string;
    transcript?: string;
  } {
    const sections: any = {};

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontmatterMatch) {
      sections.frontmatter = frontmatterMatch[0];
      content = content.substring(frontmatterMatch[0].length);
    }

    // Extract summary (everything before "## Full Transcript" or similar)
    const transcriptMatch = content.match(/##\s+(Full\s+)?Transcript/i);
    if (transcriptMatch) {
      sections.summary = content.substring(0, transcriptMatch.index).trim();
      sections.transcript = content.substring(transcriptMatch.index!).trim();
    } else {
      sections.summary = content.trim();
    }

    return sections;
  }

  /**
   * Extract metadata from frontmatter
   */
  private extractMetadata(frontmatter: string): Record<string, string> {
    const metadata: Record<string, string> = {};
    const lines = frontmatter.split('\n');

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        metadata[match[1]] = match[2];
      }
    }

    return metadata;
  }

  /**
   * Get all markdown files in folder recursively
   */
  private getMarkdownFiles(folder: TFolder): TFile[] {
    const files: TFile[] = [];

    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === 'md') {
        files.push(child);
      } else if (child instanceof TFolder) {
        files.push(...this.getMarkdownFiles(child));
      }
    }

    return files;
  }

  /**
   * Generate output filename
   */
  private generateOutputFilename(file: TFile, format: ExportFormat): string {
    return `${file.basename}.${format}`;
  }

  /**
   * Write export file
   */
  private async writeExportFile(path: string, content: string): Promise<void> {
    const existingFile = this.app.vault.getAbstractFileByPath(path);

    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, content);
    } else {
      await this.app.vault.create(path, content);
    }
  }

  /**
   * Escape CSV value
   */
  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}
