import { Plugin, TFile, Notice, MarkdownView } from 'obsidian';
import { LinkVideoTranscriberSettings, DEFAULT_SETTINGS, DetectedVideoLink } from './types';
import { LinkVideoTranscriberSettingTab } from './ui/SettingsTab';
import { LinkDetector } from './core/LinkDetector';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { TranscriptCache } from './core/TranscriptCache';
import { PLUGIN_NAME } from './constants';

export default class LinkVideoTranscriberPlugin extends Plugin {
  settings: LinkVideoTranscriberSettings;
  linkDetector: LinkDetector;
  cache: TranscriptCache;

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

    // Initialize core components
    this.linkDetector = new LinkDetector(this);

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
      // TODO: Implement canvas detection
    }

    // Excalidraw detection
    if (this.settings.autoDetectExcalidraw) {
      // TODO: Implement Excalidraw detection
    }
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
      callback: () => {
        // TODO: Implement queue UI
        new Notice('Queue UI coming soon');
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
      const rapidApi = new RapidAPIClient(this.settings.rapidApiKey, this.settings.debugMode);
      const metadata = await errorHandler.withRetry(
        () => rapidApi.extractVideo(link.url, link.platform),
        { maxRetries: 3 }
      );

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

      const whisper = new WhisperAPITranscriber(this.settings.openaiApiKey, this.settings.debugMode);
      const transcription = await errorHandler.withRetry(
        () => whisper.transcribe(audioFilePath),
        { maxRetries: 2 }
      );

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

      new Notice('✅ Transcription complete!');
    } catch (error) {
      errorHandler.showError(error);
      errorHandler.logError(error, 'transcribeVideo');
      if (progressModal) {
        progressModal.error(error.message || 'Transcription failed');
      }
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
