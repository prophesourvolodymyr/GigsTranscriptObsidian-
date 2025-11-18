import { Plugin, TFile, Notice, MarkdownView } from 'obsidian';
import { LinkVideoTranscriberSettings, DEFAULT_SETTINGS, DetectedVideoLink } from './types';
import { LinkVideoTranscriberSettingTab } from './ui/SettingsTab';
import { LinkDetector } from './core/LinkDetector';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { TranscriptCache } from './core/TranscriptCache';
import { TranscriptionQueue } from './core/TranscriptionQueue';
import { CostCalculator } from './core/CostCalculator';
import { RateLimitTracker } from './core/RateLimitTracker';
import { CanvasDetector } from './core/CanvasDetector';
import { FolderBlacklist } from './core/FolderBlacklist';
import { APIFallbackManager } from './core/APIFallbackManager';
import { NotificationManager } from './core/NotificationManager';
import { SmartRetryManager } from './core/SmartRetryManager';
import { BatchExporter } from './core/BatchExporter';
import { PLUGIN_NAME } from './constants';

export default class LinkVideoTranscriberPlugin extends Plugin {
  settings: LinkVideoTranscriberSettings;
  linkDetector: LinkDetector;
  cache: TranscriptCache;
  queue: TranscriptionQueue;
  costCalculator: CostCalculator;
  rateLimitTracker: RateLimitTracker;
  canvasDetector: CanvasDetector;
  folderBlacklist: FolderBlacklist;
  apiFallbackManager: APIFallbackManager;
  notificationManager: NotificationManager;
  retryManager: SmartRetryManager;
  batchExporter: BatchExporter;

  async onload() {
    console.log(`Loading ${PLUGIN_NAME}`);

    // Load settings
    await this.loadSettings();

    // Initialize cache
    this.cache = new TranscriptCache(
      this.app,
      this.settings.cacheDuration,
      this.settings.debugMode
    );
    await this.cache.load();

    // Initialize cost calculator
    this.costCalculator = new CostCalculator(this.app, this.settings.debugMode);
    await this.costCalculator.load();

    // Initialize rate limit tracker
    this.rateLimitTracker = new RateLimitTracker(this.settings.debugMode);

    // Initialize folder blacklist
    this.folderBlacklist = new FolderBlacklist(
      this.settings.folderBlacklist || [],
      this.settings.debugMode
    );

    // Initialize API fallback manager
    this.apiFallbackManager = new APIFallbackManager(
      this.settings.rapidApiKey,
      this.settings.debugMode
    );

    // Initialize notification manager
    this.notificationManager = new NotificationManager(
      {
        enabled: this.settings.showNotifications !== false,
        quietMode: this.settings.quietMode || false,
      },
      this.settings.debugMode
    );

    // Initialize retry manager
    this.retryManager = new SmartRetryManager(this.settings.debugMode);

    // Initialize batch exporter
    this.batchExporter = new BatchExporter(this.app, this.settings.debugMode);

    // Initialize queue
    this.queue = new TranscriptionQueue(this.settings.debugMode);
    this.queue.setProcessFunction((link) => this.transcribeVideo(link));

    // Initialize core components
    this.linkDetector = new LinkDetector(this);
    this.canvasDetector = new CanvasDetector(this.app, this.settings.debugMode);

    // Show onboarding if first time
    if (!this.settings.hasCompletedOnboarding) {
      this.showOnboarding();
    }

    // Register event listeners
    this.registerEventListeners();

    // Add ribbon icon
    this.addRibbonIcon('microphone', 'Link Video Transcriber', () => {
      this.showQuickActions();
    });

    // Register commands
    this.registerCommands();

    // Add settings tab
    this.addSettingTab(new LinkVideoTranscriberSettingTab(this.app, this));

    console.log(`${PLUGIN_NAME} loaded successfully`);
  }

  onunload() {
    console.log(`Unloading ${PLUGIN_NAME}`);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Register event listeners for link detection
   */
  private registerEventListeners() {
    // Markdown file detection
    if (this.settings.autoDetectMarkdown) {
      this.registerMarkdownDetection();
    }

    // Canvas detection
    if (this.settings.autoDetectCanvas) {
      this.registerCanvasDetection();
    }

    // Excalidraw detection
    if (this.settings.autoDetectExcalidraw) {
      // TODO: Implement Excalidraw detection (future enhancement)
    }
  }

  /**
   * Register Canvas file detection
   */
  private registerCanvasDetection() {
    this.registerEvent(
      this.app.workspace.on('file-open', async (file: TFile) => {
        if (!file || !this.settings.autoDetectCanvas) return;

        // Only scan Canvas files
        if (!this.canvasDetector.isCanvasFile(file)) return;

        // Scan Canvas file for video links
        const links = await this.canvasDetector.scanCanvasFile(file);

        if (links.length > 0) {
          new Notice(`Found ${links.length} video link(s) in Canvas`);

          // Add to queue for batch processing
          if (links.length > 1) {
            this.queue.addMultiple(links);
          } else {
            // Single link - show confirmation
            await this.handleDetectedLink(links[0]);
          }
        }
      })
    );
  }

  /**
   * Register markdown file link detection
   */
  private registerMarkdownDetection() {
    // Detect on paste
    this.registerEvent(
      this.app.workspace.on('editor-paste', async (evt: ClipboardEvent, editor) => {
        if (!this.settings.autoDetectMarkdown) return;

        const pastedText = evt.clipboardData?.getData('text');
        if (!pastedText) return;

        // Debounce detection
        setTimeout(() => {
          this.linkDetector.detectInText(pastedText, 'markdown');
        }, this.settings.detectionDelay);
      })
    );

    // Detect on file open
    this.registerEvent(
      this.app.workspace.on('file-open', async (file: TFile) => {
        if (!file || !this.settings.autoDetectMarkdown) return;

        // Only scan markdown files
        if (file.extension !== 'md') return;

        const content = await this.app.vault.read(file);
        this.linkDetector.scanFileContent(content, file.path);
      })
    );
  }

  /**
   * Register plugin commands
   */
  private registerCommands() {
    // Transcribe from clipboard
    this.addCommand({
      id: 'transcribe-from-clipboard',
      name: 'Transcribe video from clipboard',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'V' }],
      callback: async () => {
        const clipboard = await navigator.clipboard.readText();
        if (clipboard) {
          this.linkDetector.detectInText(clipboard, 'markdown');
        } else {
          new Notice('No text in clipboard');
        }
      },
    });

    // Transcribe current selection
    this.addCommand({
      id: 'transcribe-selection',
      name: 'Transcribe video from selection',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'T' }],
      editorCallback: (editor) => {
        const selection = editor.getSelection();
        if (selection) {
          this.linkDetector.detectInText(selection, 'markdown');
        } else {
          new Notice('No text selected');
        }
      },
    });

    // Open transcription queue
    this.addCommand({
      id: 'open-queue',
      name: 'Open transcription queue',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'Q' }],
      callback: () => {
        this.showQueueStatus();
      },
    });

    // View cost summary
    this.addCommand({
      id: 'view-cost-summary',
      name: 'View cost summary',
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'C' }],
      callback: () => {
        this.showCostSummary();
      },
    });

    // View cache statistics
    this.addCommand({
      id: 'view-cache-stats',
      name: 'View cache statistics',
      callback: () => {
        this.showCacheStats();
      },
    });

    // Clear cache
    this.addCommand({
      id: 'clear-cache',
      name: 'Clear transcript cache',
      callback: async () => {
        this.cache.clear();
        new Notice('Transcript cache cleared');
      },
    });

    // Pause queue
    this.addCommand({
      id: 'pause-queue',
      name: 'Pause transcription queue',
      callback: () => {
        this.queue.pause();
      },
    });

    // Resume queue
    this.addCommand({
      id: 'resume-queue',
      name: 'Resume transcription queue',
      callback: () => {
        this.queue.resume();
      },
    });

    // Stop queue
    this.addCommand({
      id: 'stop-queue',
      name: 'Stop transcription queue',
      callback: () => {
        this.queue.stop();
      },
    });

    // Scan current Canvas for videos
    this.addCommand({
      id: 'scan-canvas',
      name: 'Scan current Canvas for videos',
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && this.canvasDetector.isCanvasFile(activeFile)) {
          if (!checking) {
            this.canvasDetector.scanCanvasFile(activeFile).then((links) => {
              if (links.length > 0) {
                this.queue.addMultiple(links);
              } else {
                new Notice('No video links found in Canvas');
              }
            });
          }
          return true;
        }
        return false;
      },
    });

    // Export cost data
    this.addCommand({
      id: 'export-costs',
      name: 'Export cost data as CSV',
      callback: () => {
        const csv = this.costCalculator.exportAsCSV();
        navigator.clipboard.writeText(csv);
        new Notice('Cost data copied to clipboard as CSV');
      },
    });

    // Open debug panel
    this.addCommand({
      id: 'open-debug-panel',
      name: 'Open debug panel',
      callback: () => {
        this.showDebugPanel();
      },
    });

    // View failed transcriptions
    this.addCommand({
      id: 'view-failed-transcriptions',
      name: 'View failed transcriptions',
      callback: () => {
        this.showFailedTranscriptions();
      },
    });

    // Retry failed transcriptions
    this.addCommand({
      id: 'retry-failed',
      name: 'Retry failed transcriptions',
      callback: () => {
        const failed = this.retryManager.getFailedTranscriptions();
        if (failed.length === 0) {
          new Notice('No failed transcriptions to retry');
        } else {
          const retryable = failed.filter((f) => f.canRetry);
          this.queue.addMultiple(retryable.map((f) => f.link));
          new Notice(`Added ${retryable.length} failed items to retry queue`);
        }
      },
    });

    // Configure settings
    this.addCommand({
      id: 'open-settings',
      name: 'Configure Link Video Transcriber',
      callback: () => {
        // @ts-ignore
        this.app.setting.open();
        // @ts-ignore
        this.app.setting.openTabById(this.manifest.id);
      },
    });
  }

  /**
   * Show queue status
   */
  private showQueueStatus() {
    const stats = this.queue.getStatistics();
    const message = `
📊 **Queue Status**

Total: ${stats.total}
⏳ Pending: ${stats.pending}
⚙️ Processing: ${stats.processing}
✅ Completed: ${stats.completed}
❌ Failed: ${stats.failed}
🚫 Cancelled: ${stats.cancelled}

${this.queue.isActive() ? '▶️ Queue is running' : '⏸️ Queue is paused'}
    `.trim();

    new Notice(message, 8000);
  }

  /**
   * Show cost summary
   */
  private showCostSummary() {
    const summary = this.costCalculator.getSummary();
    const monthTotal = this.costCalculator.getCurrentMonthTotal();

    const byServiceLines = Object.entries(summary.byService)
      .map(([service, cost]) => `  ${service}: $${cost.toFixed(4)}`)
      .join('\n');

    const message = `
💰 **Cost Summary**

**Total All-Time**: $${summary.totalCost.toFixed(4)}
**Current Month**: $${monthTotal.toFixed(4)}
**Total Requests**: ${summary.entryCount}

**By Service**:
${byServiceLines}
    `.trim();

    new Notice(message, 10000);
  }

  /**
   * Show cache statistics
   */
  private showCacheStats() {
    const stats = this.cache.getStats();
    const sizeMB = (stats.cacheSize / (1024 * 1024)).toFixed(2);

    const message = `
📦 **Cache Statistics**

**Cached Transcripts**: ${stats.totalEntries}
**Cache Size**: ${sizeMB} MB

Use "Clear transcript cache" command to free space.
    `.trim();

    new Notice(message, 6000);
  }

  /**
   * Show quick actions menu
   */
  private showQuickActions() {
    new Notice('Quick actions: Use command palette (Ctrl/Cmd+P) for transcription commands');
  }

  /**
   * Handle detected video link
   */
  async handleDetectedLink(link: DetectedVideoLink) {
    if (this.settings.showConfirmationModal) {
      // Show confirmation modal
      new ConfirmationModal(this.app, link, async (confirmed) => {
        if (confirmed) {
          await this.transcribeVideo(link);
        }
      }).open();
    } else {
      // Auto-transcribe without confirmation
      await this.transcribeVideo(link);
    }
  }

  /**
   * Main transcription workflow
   */
  async transcribeVideo(link: DetectedVideoLink) {
    const { RapidAPIClient } = await import('./api/RapidAPIClient');
    const { WhisperAPITranscriber } = await import('./api/WhisperAPITranscriber');
    const { NoteGenerator } = await import('./core/NoteGenerator');
    const { ErrorHandler } = await import('./core/ErrorHandler');
    const { ProgressModal } = await import('./ui/ProgressModal');
    const { AIProviderManager } = await import('./ai/AIProvider');
    const { OpenAIProvider } = await import('./ai/OpenAIProvider');
    const { GeminiProvider } = await import('./ai/GeminiProvider');
    const { ClaudeProvider } = await import('./ai/ClaudeProvider');
    const axios = (await import('axios')).default;

    const errorHandler = new ErrorHandler(this.settings.debugMode);
    const progressModal = new ProgressModal(this.app);

    try {
      // Check cache first
      if (this.settings.cacheTranscripts && this.cache.has(link.videoId, link.platform)) {
        const cached = this.cache.get(link.videoId, link.platform);
        if (cached) {
          new Notice('✨ Using cached transcription!');

          // Create note from cached data
          const noteGenerator = new NoteGenerator(this.app, this.settings);
          const templateData = this.buildTemplateData(cached.metadata, cached.transcription, cached.summary);
          const noteFile = await noteGenerator.generateNote(templateData);

          // Open note if configured
          await noteGenerator.openNote(noteFile);

          new Notice('✅ Note created from cache!');
          return;
        }
      }

      // Show progress modal
      progressModal.open();
      progressModal.update({
        stage: 'fetching-metadata',
        percent: 10,
        message: 'Fetching video information...',
      });

      // 1. Fetch video metadata
      // Check rate limit
      this.rateLimitTracker.checkLimit('rapidapi');

      const rapidApi = new RapidAPIClient(this.settings.rapidApiKey, this.settings.debugMode);
      const metadata = await errorHandler.withRetry(
        () => rapidApi.extractVideo(link.url, link.platform),
        { maxRetries: 3 }
      );

      // Track API usage
      this.rateLimitTracker.trackRequest('rapidapi');
      this.costCalculator.trackRapidAPICost(link.platform, { videoId: link.videoId });

      progressModal.setVideoTitle(metadata.title);
      progressModal.update({
        stage: 'downloading-audio',
        percent: 25,
        message: 'Preparing audio...',
        details: `Duration: ${Math.floor(metadata.duration / 60)}m ${metadata.duration % 60}s`,
      });

      // 2. Download audio
      const audioUrl = metadata.audioUrl || metadata.downloadUrl;
      if (!audioUrl) {
        throw new Error('No audio URL available from video');
      }

      const audioFilePath = await this.downloadAudio(audioUrl, link.videoId);

      progressModal.update({
        stage: 'transcribing',
        percent: 40,
        message: 'Transcribing audio...',
        details: 'This may take a few moments',
      });

      // 3. Transcribe using Whisper
      const transcriptionMethod = this.determineTranscriptionMethod();
      if (transcriptionMethod !== 'api') {
        throw new Error('Local Whisper not yet implemented. Please use API transcription in settings.');
      }

      // Check rate limit for Whisper
      this.rateLimitTracker.checkLimit('whisper');

      const whisper = new WhisperAPITranscriber(this.settings.openaiApiKey, this.settings.debugMode);
      const transcription = await errorHandler.withRetry(
        () => whisper.transcribe(audioFilePath),
        { maxRetries: 2 }
      );

      // Track Whisper usage and cost
      this.rateLimitTracker.trackRequest('whisper');
      this.costCalculator.trackWhisperCost(metadata.duration, {
        videoId: link.videoId,
        platform: link.platform,
      });

      // 4. Generate AI summary (if enabled)
      let summary;
      if (this.settings.enableAiSummary) {
        progressModal.update({
          stage: 'ai-processing',
          percent: 70,
          message: 'Generating AI summary...',
        });

        const aiManager = new AIProviderManager(this.settings.debugMode);

        // Register available providers
        if (this.settings.openaiApiKey) {
          aiManager.registerProvider('openai', new OpenAIProvider(this.settings.openaiApiKey));
        }
        if (this.settings.geminiApiKey) {
          aiManager.registerProvider('gemini', new GeminiProvider(this.settings.geminiApiKey));
        }
        if (this.settings.claudeApiKey) {
          aiManager.registerProvider('claude', new ClaudeProvider(this.settings.claudeApiKey));
        }

        try {
          summary = await aiManager.generateSummaryWithFallback(
            this.settings.defaultAiProvider,
            transcription.text,
            {
              provider: this.settings.defaultAiProvider,
              style: this.settings.aiSummaryStyle,
              includeKeyPoints: this.settings.includeKeyPoints,
              includeQuotes: this.settings.includeQuotes,
              includeQuestions: this.settings.includeQuestions,
              includeChapters: this.settings.includeChapters,
            }
          );
        } catch (error) {
          console.warn('AI summary failed:', error);
          // Continue without summary
        }
      }

      progressModal.update({
        stage: 'creating-note',
        percent: 90,
        message: 'Creating note...',
      });

      // 5. Create note from template
      const noteGenerator = new NoteGenerator(this.app, this.settings);
      const templateData = this.buildTemplateData(metadata, transcription, summary);
      const noteFile = await noteGenerator.generateNote(templateData);

      // 6. Cache the result
      if (this.settings.cacheTranscripts) {
        this.cache.set(link.videoId, link.platform, link.url, metadata, transcription, summary);
      }

      // 7. Link back to source file (if applicable)
      if (link.sourceFile) {
        await noteGenerator.replaceVideoLinkWithNoteLink(link.sourceFile, link.url, noteFile);
      }

      // 8. Clean up audio file if configured
      if (this.settings.deleteAudioAfterTranscription) {
        try {
          const { unlink } = await import('fs/promises');
          await unlink(audioFilePath);
        } catch (error) {
          console.warn('Failed to delete audio file:', error);
        }
      }

      // Complete!
      progressModal.complete();
      await noteGenerator.openNote(noteFile);

      // Mark as successful in retry manager
      this.retryManager.markSuccess(link);

      new Notice('✅ Transcription complete!');
    } catch (error) {
      // Record failure for smart retry
      this.retryManager.recordFailure(link, error);

      errorHandler.showError(error);
      errorHandler.logError(error, 'transcribeVideo');
      if (progressModal) {
        progressModal.error(error.message || 'Transcription failed');
      }

      // Rethrow to let queue handler know it failed
      throw error;
    }
  }

  /**
   * Download audio file to temporary location
   */
  private async downloadAudio(audioUrl: string, videoId: string): Promise<string> {
    const axios = (await import('axios')).default;
    const { writeFile } = await import('fs/promises');
    const { tmpdir } = await import('os');
    const { join } = await import('path');

    const tempDir = tmpdir();
    const audioFilePath = join(tempDir, `${videoId}.mp3`);

    const response = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 seconds
    });

    await writeFile(audioFilePath, response.data);

    return audioFilePath;
  }

  /**
   * Build template data from metadata, transcription, and summary
   */
  private buildTemplateData(metadata: any, transcription: any, summary?: any): any {
    return {
      // Video metadata
      title: metadata.title,
      platform: metadata.platform,
      author: metadata.author,
      url: metadata.url,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
      uploadDate: metadata.uploadDate,
      videoId: metadata.videoId,

      // Transcript data
      transcript: transcription.text,
      transcriptSegments: transcription.segments,
      language: transcription.language || 'en',
      wordCount: transcription.text.split(/\s+/).length,

      // AI-generated content
      summary: summary?.summary,
      keyPoints: summary?.keyPoints || [],
      actionItems: summary?.actionItems || [],
      quotes: summary?.quotes || [],
      chapters: summary?.chapters || [],
      topics: summary?.topics || [],

      // Metadata
      transcribedAt: new Date().toISOString(),
      transcriptionMethod: this.determineTranscriptionMethod(),
      aiProvider: this.settings.enableAiSummary ? this.settings.defaultAiProvider : undefined,
      tags: this.generateTags(metadata.platform, summary?.topics || []),
    };
  }

  /**
   * Generate tags for note
   */
  private generateTags(platform: string, topics: string[]): string[] {
    const tags = ['transcript', platform.toLowerCase()];

    if (topics && topics.length > 0) {
      tags.push(...topics.map((t) => t.toLowerCase().replace(/\s+/g, '-')));
    }

    return tags;
  }

  /**
   * Determine which transcription method to use
   */
  private determineTranscriptionMethod(): 'api' | 'local' {
    const method = this.settings.transcriptionMethod;

    if (method === 'always-api') {
      return 'api';
    } else if (method === 'always-local') {
      return 'local';
    } else {
      // Auto: prefer API for now (local Whisper not yet implemented)
      return 'api';
    }
  }

  /**
   * Test API connection
   */
  async testApiConnection(apiKey: keyof LinkVideoTranscriberSettings): Promise<boolean> {
    // TODO: Implement API connection testing
    return false;
  }
}
