import { App, PluginSettingTab, Setting } from 'obsidian';
import LinkVideoTranscriberPlugin from '../main';

/**
 * Settings Tab - Plugin configuration interface
 */
export class LinkVideoTranscriberSettingTab extends PluginSettingTab {
  plugin: LinkVideoTranscriberPlugin;

  constructor(app: App, plugin: LinkVideoTranscriberPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Link Video Transcriber Settings' });

    // ========================================================================
    // API Configuration
    // ========================================================================
    containerEl.createEl('h3', { text: '🔑 API Configuration' });

    new Setting(containerEl)
      .setName('RapidAPI Key')
      .setDesc('Your RapidAPI key for video extraction')
      .addText((text) =>
        text
          .setPlaceholder('Enter your RapidAPI key')
          .setValue(this.plugin.settings.rapidApiKey)
          .onChange(async (value) => {
            this.plugin.settings.rapidApiKey = value;
            await this.plugin.saveSettings();
          })
      )
      .addButton((button) =>
        button.setButtonText('Test').onClick(async () => {
          const isValid = await this.plugin.testApiConnection('rapidApiKey');
          if (isValid) {
            // Success notification
          } else {
            // Error notification
          }
        })
      );

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Your OpenAI API key for Whisper and GPT')
      .addText((text) => {
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiApiKey = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

    new Setting(containerEl)
      .setName('Google Gemini API Key')
      .setDesc('Your Google AI API key for Gemini (optional)')
      .addText((text) => {
        text
          .setPlaceholder('Enter Gemini API key')
          .setValue(this.plugin.settings.geminiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.geminiApiKey = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

    new Setting(containerEl)
      .setName('Anthropic Claude API Key')
      .setDesc('Your Anthropic API key for Claude (optional)')
      .addText((text) => {
        text
          .setPlaceholder('Enter Claude API key')
          .setValue(this.plugin.settings.claudeApiKey)
          .onChange(async (value) => {
            this.plugin.settings.claudeApiKey = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      });

    // ========================================================================
    // Transcription Settings
    // ========================================================================
    containerEl.createEl('h3', { text: '🎙️ Transcription Settings' });

    new Setting(containerEl)
      .setName('Transcription method')
      .setDesc('Choose default transcription method')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('auto', 'Auto (smart selection)')
          .addOption('always-api', 'Always use Whisper API')
          .addOption('always-local', 'Always use local Whisper')
          .setValue(this.plugin.settings.transcriptionMethod)
          .onChange(async (value: any) => {
            this.plugin.settings.transcriptionMethod = value;
            await this.plugin.saveSettings();
          })
      );

    // ========================================================================
    // AI Provider Settings
    // ========================================================================
    containerEl.createEl('h3', { text: '✨ AI Summary Settings' });

    new Setting(containerEl)
      .setName('Enable AI summaries')
      .setDesc('Generate summaries and key points using AI')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableAiSummary).onChange(async (value) => {
          this.plugin.settings.enableAiSummary = value;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show/hide AI settings
        })
      );

    if (this.plugin.settings.enableAiSummary) {
      new Setting(containerEl)
        .setName('Default AI provider')
        .setDesc('Choose which AI service to use for summaries')
        .addDropdown((dropdown) =>
          dropdown
            .addOption('gemini', 'Google Gemini (free)')
            .addOption('openai', 'OpenAI GPT-4o-mini')
            .addOption('claude', 'Anthropic Claude')
            .setValue(this.plugin.settings.defaultAiProvider)
            .onChange(async (value: any) => {
              this.plugin.settings.defaultAiProvider = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName('Summary style')
        .setDesc('Choose the style of AI-generated summaries')
        .addDropdown((dropdown) =>
          dropdown
            .addOption('concise', 'Concise (2-3 paragraphs)')
            .addOption('detailed', 'Detailed (comprehensive)')
            .addOption('bullet-points', 'Bullet points (easy scan)')
            .addOption('academic', 'Academic (formal)')
            .setValue(this.plugin.settings.aiSummaryStyle)
            .onChange(async (value: any) => {
              this.plugin.settings.aiSummaryStyle = value;
              await this.plugin.saveSettings();
            })
        );
    }

    // ========================================================================
    // Note Generation
    // ========================================================================
    containerEl.createEl('h3', { text: '📝 Note Organization' });

    new Setting(containerEl)
      .setName('Transcripts folder')
      .setDesc('Where to save transcript notes')
      .addText((text) =>
        text
          .setPlaceholder('Transcripts')
          .setValue(this.plugin.settings.noteFolder)
          .onChange(async (value) => {
            this.plugin.settings.noteFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Folder organization')
      .setDesc('How to organize transcripts in subfolders')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('platform', 'By platform (YouTube, Instagram, etc.)')
          .addOption('date', 'By date (YYYY/MM)')
          .addOption('author', 'By author/creator')
          .addOption('custom', 'Custom path')
          .setValue(this.plugin.settings.folderOrganization)
          .onChange(async (value: any) => {
            this.plugin.settings.folderOrganization = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Filename pattern')
      .setDesc('Pattern for transcript note filenames')
      .addText((text) =>
        text
          .setPlaceholder('{title} - {date}')
          .setValue(this.plugin.settings.filenamePattern)
          .onChange(async (value) => {
            this.plugin.settings.filenamePattern = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Open note after creation')
      .setDesc('Automatically open the transcript note when ready')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.openNoteOnCreate).onChange(async (value) => {
          this.plugin.settings.openNoteOnCreate = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Detection Settings
    // ========================================================================
    containerEl.createEl('h3', { text: '🔍 Link Detection' });

    new Setting(containerEl)
      .setName('Auto-detect in markdown files')
      .setDesc('Automatically detect video links when pasting or opening files')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoDetectMarkdown).onChange(async (value) => {
          this.plugin.settings.autoDetectMarkdown = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Show confirmation modal')
      .setDesc('Ask for confirmation before transcribing')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showConfirmationModal).onChange(async (value) => {
          this.plugin.settings.showConfirmationModal = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Privacy Settings
    // ========================================================================
    containerEl.createEl('h3', { text: '🔒 Privacy & Performance' });

    new Setting(containerEl)
      .setName('Privacy mode')
      .setDesc('Use only local processing (local Whisper, no AI summaries)')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.privacyMode).onChange(async (value) => {
          this.plugin.settings.privacyMode = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Delete audio after transcription')
      .setDesc('Remove temporary audio files after transcription completes')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.deleteAudioAfterTranscription)
          .onChange(async (value) => {
            this.plugin.settings.deleteAudioAfterTranscription = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Cache transcripts')
      .setDesc('Cache transcripts to avoid re-transcribing the same video')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.cacheTranscripts).onChange(async (value) => {
          this.plugin.settings.cacheTranscripts = value;
          await this.plugin.saveSettings();
        })
      );

    // ========================================================================
    // Debug
    // ========================================================================
    containerEl.createEl('h3', { text: '🐛 Advanced' });

    new Setting(containerEl)
      .setName('Debug mode')
      .setDesc('Enable verbose logging for troubleshooting')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.debugMode).onChange(async (value) => {
          this.plugin.settings.debugMode = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
