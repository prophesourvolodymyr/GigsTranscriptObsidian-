# F10: Settings Panel and Configuration

## Overview
Comprehensive settings interface for configuring all plugin aspects including API keys, transcription preferences, AI providers, note templates, and organizational preferences.

## User Story
As a user, I want a centralized, intuitive settings panel where I can configure all plugin options, so that I can customize the plugin to match my workflow and preferences.

## Technical Approach

### Settings Data Structure

```typescript
interface PluginSettings {
  // API Configuration
  rapidApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  claudeApiKey: string;

  // Transcription Settings
  transcriptionMethod: 'auto' | 'always-api' | 'always-local';
  whisperApiEnabled: boolean;
  localWhisperEnabled: boolean;
  whisperModelPath: string;
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large-v3';

  // AI Provider Settings
  defaultAiProvider: 'openai' | 'gemini' | 'claude';
  enableAiSummary: boolean;
  aiSummaryStyle: 'concise' | 'detailed' | 'bullet-points' | 'academic';
  includeKeyPoints: boolean;
  includeQuotes: boolean;
  includeQuestions: boolean;

  // Note Generation
  defaultTemplate: string;
  noteFolder: string;
  folderOrganization: 'platform' | 'date' | 'author' | 'custom';
  filenamePattern: string;
  tagStrategy: 'auto' | 'manual' | 'none';
  linkStrategy: 'embed' | 'link' | 'none';
  openNoteOnCreate: boolean;

  // Detection Settings
  autoDetectMarkdown: boolean;
  autoDetectCanvas: boolean;
  autoDetectExcalidraw: boolean;
  detectionDelay: number;
  showConfirmationModal: boolean;

  // Performance
  maxConcurrentTranscriptions: number;
  cacheTranscripts: boolean;
  cacheDuration: number; // days

  // Privacy
  privacyMode: boolean;
  deleteAudioAfterTranscription: boolean;
  saveAudioFiles: boolean;
  audioFileLocation: string;

  // Advanced
  debugMode: boolean;
  customApiEndpoint: string;
  proxyUrl: string;
}
```

### Settings Panel Implementation

```typescript
class LinkVideoTranscriberSettingTab extends PluginSettingTab {
  plugin: LinkVideoTranscriberPlugin;

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // API Keys Section
    this.addSection(containerEl, 'API Configuration', () => {
      this.addApiKeySetting(containerEl, 'RapidAPI', 'rapidApiKey');
      this.addApiKeySetting(containerEl, 'OpenAI', 'openaiApiKey');
      this.addApiKeySetting(containerEl, 'Google Gemini', 'geminiApiKey');
      this.addApiKeySetting(containerEl, 'Anthropic Claude', 'claudeApiKey');
    });

    // Transcription Settings
    this.addSection(containerEl, 'Transcription', () => {
      new Setting(containerEl)
        .setName('Transcription method')
        .setDesc('Choose how videos should be transcribed')
        .addDropdown(dropdown => dropdown
          .addOption('auto', 'Auto (smart selection)')
          .addOption('always-api', 'Always use Whisper API')
          .addOption('always-local', 'Always use local Whisper')
          .setValue(this.plugin.settings.transcriptionMethod)
          .onChange(async (value) => {
            this.plugin.settings.transcriptionMethod = value;
            await this.plugin.saveSettings();
          })
        );

      // Local Whisper configuration
      if (this.plugin.settings.localWhisperEnabled) {
        this.addLocalWhisperSettings(containerEl);
      } else {
        this.addLocalWhisperSetupButton(containerEl);
      }
    });

    // AI Provider Settings
    this.addSection(containerEl, 'AI Processing', () => {
      new Setting(containerEl)
        .setName('Enable AI summaries')
        .setDesc('Generate summaries and key points using AI')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.enableAiSummary)
          .onChange(async (value) => {
            this.plugin.settings.enableAiSummary = value;
            await this.plugin.saveSettings();
          })
        );

      if (this.plugin.settings.enableAiSummary) {
        // ... AI provider selection
        // ... Summary style
        // ... Additional options
      }
    });

    // Note Generation Settings
    this.addSection(containerEl, 'Note Organization', () => {
      // Template selection
      // Folder organization
      // Filename pattern
      // Tag settings
    });

    // Advanced Settings
    this.addCollapsibleSection(containerEl, 'Advanced', () => {
      // Debug mode
      // Cache settings
      // Privacy options
      // Performance tuning
    });
  }

  private addApiKeySetting(
    containerEl: HTMLElement,
    name: string,
    settingKey: keyof PluginSettings
  ): void {
    new Setting(containerEl)
      .setName(`${name} API Key`)
      .setDesc(`Enter your ${name} API key`)
      .addText(text => {
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings[settingKey] as string)
          .onChange(async (value) => {
            this.plugin.settings[settingKey] = value;
            await this.plugin.saveSettings();
          });

        // Mask API key
        text.inputEl.type = 'password';

        // Add show/hide toggle
        const toggleButton = text.inputEl.parentElement.createEl('button', {
          text: '👁️'
        });
        toggleButton.addEventListener('click', () => {
          text.inputEl.type = text.inputEl.type === 'password' ? 'text' : 'password';
        });
      })
      .addButton(button => button
        .setButtonText('Test')
        .onClick(async () => {
          await this.testApiKey(name, settingKey);
        })
      );
  }

  private async testApiKey(name: string, key: keyof PluginSettings): Promise<void> {
    try {
      const isValid = await this.plugin.testApiConnection(key);
      if (isValid) {
        new Notice(`✅ ${name} API key is valid`);
      } else {
        new Notice(`❌ ${name} API key is invalid`);
      }
    } catch (error) {
      new Notice(`❌ Failed to test ${name} API: ${error.message}`);
    }
  }
}
```

## Priority
**Must-Have** 🔴

## Estimated Effort
**5-6 days**
