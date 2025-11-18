import { App, Modal, Setting } from 'obsidian';
import LinkVideoTranscriberPlugin from '../main';

/**
 * Debug Panel - Provides troubleshooting information and tools
 */
export class DebugPanel extends Modal {
  private plugin: LinkVideoTranscriberPlugin;

  constructor(app: App, plugin: LinkVideoTranscriberPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '🐛 Debug Panel' });

    // System Information
    this.addSystemInfo(contentEl);

    // Plugin Status
    this.addPluginStatus(contentEl);

    // API Status
    this.addApiStatus(contentEl);

    // Cache Information
    this.addCacheInfo(contentEl);

    // Queue Information
    this.addQueueInfo(contentEl);

    // Debug Actions
    this.addDebugActions(contentEl);

    // Export Debug Info
    this.addExportButton(contentEl);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Add system information section
   */
  private addSystemInfo(contentEl: HTMLElement) {
    const section = contentEl.createDiv({ cls: 'debug-section' });
    section.createEl('h3', { text: 'System Information' });

    const info = section.createEl('pre', { cls: 'debug-info' });
    info.textContent = `Platform: ${navigator.platform}
User Agent: ${navigator.userAgent}
Obsidian Version: ${(this.app as any).appVersion || 'Unknown'}
Plugin Version: ${this.plugin.manifest.version}
Vault Name: ${this.app.vault.getName()}`;
  }

  /**
   * Add plugin status section
   */
  private addPluginStatus(contentEl: HTMLElement) {
    const section = contentEl.createDiv({ cls: 'debug-section' });
    section.createEl('h3', { text: 'Plugin Status' });

    const settings = this.plugin.settings;
    const status = section.createEl('pre', { cls: 'debug-info' });
    status.textContent = `Debug Mode: ${settings.debugMode}
Auto-detect Markdown: ${settings.autoDetectMarkdown}
Auto-detect Canvas: ${settings.autoDetectCanvas}
Enable AI Summary: ${settings.enableAiSummary}
Default AI Provider: ${settings.defaultAiProvider}
Transcription Method: ${settings.transcriptionMethod}
Cache Enabled: ${settings.cacheTranscripts}
Show Confirmation: ${settings.showConfirmationModal}`;
  }

  /**
   * Add API status section
   */
  private addApiStatus(contentEl: HTMLElement) {
    const section = contentEl.createDiv({ cls: 'debug-section' });
    section.createEl('h3', { text: 'API Keys Status' });

    const settings = this.plugin.settings;
    const status = section.createEl('pre', { cls: 'debug-info' });

    const apiStatus = {
      RapidAPI: settings.rapidApiKey ? '✅ Configured' : '❌ Not set',
      'OpenAI Whisper': settings.openaiApiKey ? '✅ Configured' : '❌ Not set',
      'Google Gemini': settings.geminiApiKey ? '✅ Configured' : '⚠️ Optional',
      'Anthropic Claude': settings.claudeApiKey ? '✅ Configured' : '⚠️ Optional',
    };

    status.textContent = Object.entries(apiStatus)
      .map(([name, stat]) => `${name}: ${stat}`)
      .join('\n');
  }

  /**
   * Add cache information
   */
  private addCacheInfo(contentEl: HTMLElement) {
    const section = contentEl.createDiv({ cls: 'debug-section' });
    section.createEl('h3', { text: 'Cache Information' });

    const stats = this.plugin.cache.getStats();
    const sizeMB = (stats.cacheSize / (1024 * 1024)).toFixed(2);

    const info = section.createEl('pre', { cls: 'debug-info' });
    info.textContent = `Cached Transcripts: ${stats.totalEntries}
Cache Size: ${sizeMB} MB
Oldest Entry: ${stats.oldestEntry ? new Date(stats.oldestEntry).toLocaleString() : 'N/A'}
Newest Entry: ${stats.newestEntry ? new Date(stats.newestEntry).toLocaleString() : 'N/A'}`;
  }

  /**
   * Add queue information
   */
  private addQueueInfo(contentEl: HTMLElement) {
    const section = contentEl.createDiv({ cls: 'debug-section' });
    section.createEl('h3', { text: 'Queue Information' });

    const queueStats = this.plugin.queue.getStatistics();
    const info = section.createEl('pre', { cls: 'debug-info' });
    info.textContent = `Total Items: ${queueStats.total}
Pending: ${queueStats.pending}
Processing: ${queueStats.processing}
Completed: ${queueStats.completed}
Failed: ${queueStats.failed}
Cancelled: ${queueStats.cancelled}
Queue Active: ${this.plugin.queue.isActive()}`;
  }

  /**
   * Add debug actions
   */
  private addDebugActions(contentEl: HTMLElement) {
    const section = contentEl.createDiv({ cls: 'debug-section' });
    section.createEl('h3', { text: 'Debug Actions' });

    // Clear cache
    new Setting(section)
      .setName('Clear Cache')
      .setDesc('Clear all cached transcriptions')
      .addButton((button) =>
        button.setButtonText('Clear').onClick(async () => {
          await this.plugin.cache.clear();
          this.onOpen(); // Refresh display
        })
      );

    // Reset settings
    new Setting(section)
      .setName('Reset Queue')
      .setDesc('Clear all queue items')
      .addButton((button) =>
        button
          .setButtonText('Reset')
          .setWarning()
          .onClick(() => {
            this.plugin.queue.clearAll();
            this.onOpen(); // Refresh display
          })
      );

    // Test URL detection
    new Setting(section)
      .setName('Test URL Detection')
      .setDesc('Test if URL patterns are working correctly')
      .addText((text) =>
        text
          .setPlaceholder('Enter a video URL')
          .onChange(async (value) => {
            if (value) {
              const links = await this.plugin.linkDetector.detectInText(value, 'markdown');
              console.log('Detected links:', links);
            }
          })
      );

    // Toggle debug mode
    new Setting(section)
      .setName('Enable Debug Mode')
      .setDesc('Enable detailed console logging')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.debugMode).onChange(async (value) => {
          this.plugin.settings.debugMode = value;
          await this.plugin.saveSettings();

          // Update debug mode on all components
          this.plugin.cache.setDebugMode(value);
          this.plugin.costCalculator.setDebugMode(value);
          this.plugin.rateLimitTracker.setDebugMode(value);
          this.plugin.queue.setDebugMode(value);
          this.plugin.canvasDetector.setDebugMode(value);
        })
      );
  }

  /**
   * Add export debug info button
   */
  private addExportButton(contentEl: HTMLElement) {
    const section = contentEl.createDiv({ cls: 'debug-section' });

    new Setting(section)
      .setName('Export Debug Information')
      .setDesc('Copy all debug information to clipboard for troubleshooting')
      .addButton((button) =>
        button.setButtonText('Copy to Clipboard').onClick(() => {
          const debugInfo = this.generateDebugReport();
          navigator.clipboard.writeText(debugInfo);
          new Notice('Debug information copied to clipboard');
        })
      );
  }

  /**
   * Generate complete debug report
   */
  private generateDebugReport(): string {
    const settings = this.plugin.settings;
    const cacheStats = this.plugin.cache.getStats();
    const queueStats = this.plugin.queue.getStatistics();
    const costSummary = this.plugin.costCalculator.getSummary();
    const rateLimitStats = this.plugin.rateLimitTracker.getAllStatuses();

    return `# Link Video Transcriber Debug Report
Generated: ${new Date().toISOString()}

## System Information
Platform: ${navigator.platform}
User Agent: ${navigator.userAgent}
Obsidian Version: ${(this.app as any).appVersion || 'Unknown'}
Plugin Version: ${this.plugin.manifest.version}
Vault Name: ${this.app.vault.getName()}

## Plugin Status
Debug Mode: ${settings.debugMode}
Auto-detect Markdown: ${settings.autoDetectMarkdown}
Auto-detect Canvas: ${settings.autoDetectCanvas}
Enable AI Summary: ${settings.enableAiSummary}
Default AI Provider: ${settings.defaultAiProvider}
Transcription Method: ${settings.transcriptionMethod}
Cache Enabled: ${settings.cacheTranscripts}

## API Keys
RapidAPI: ${settings.rapidApiKey ? '✅ Set' : '❌ Not set'}
OpenAI: ${settings.openaiApiKey ? '✅ Set' : '❌ Not set'}
Gemini: ${settings.geminiApiKey ? '✅ Set' : '⚠️ Not set'}
Claude: ${settings.claudeApiKey ? '✅ Set' : '⚠️ Not set'}

## Cache Statistics
Cached Transcripts: ${cacheStats.totalEntries}
Cache Size: ${(cacheStats.cacheSize / (1024 * 1024)).toFixed(2)} MB

## Queue Statistics
Total: ${queueStats.total}
Pending: ${queueStats.pending}
Processing: ${queueStats.processing}
Completed: ${queueStats.completed}
Failed: ${queueStats.failed}
Active: ${this.plugin.queue.isActive()}

## Cost Summary
Total Cost: $${costSummary.totalCost.toFixed(4)}
Total Requests: ${costSummary.entryCount}

## Rate Limit Status
${rateLimitStats.map((s) => `${s.api}: ${s.status} (${s.failures} failures)`).join('\n')}

---
This report can be shared with support for troubleshooting.
`;
  }
}
