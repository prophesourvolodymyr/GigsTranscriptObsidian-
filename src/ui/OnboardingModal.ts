import { App, Modal, Setting } from 'obsidian';
import LinkVideoTranscriberPlugin from '../main';

/**
 * Onboarding Modal - Guides users through initial setup
 */
export class OnboardingModal extends Modal {
  private plugin: LinkVideoTranscriberPlugin;
  private currentStep: number = 0;
  private totalSteps: number = 5;
  private tempSettings: any = {};

  constructor(app: App, plugin: LinkVideoTranscriberPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    this.displayStep(this.currentStep);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Display specific step
   */
  private displayStep(step: number) {
    const { contentEl } = this;
    contentEl.empty();

    // Add header
    contentEl.createEl('h2', {
      text: '🎬 Welcome to Link Video Transcriber',
      cls: 'onboarding-header',
    });

    // Add progress indicator
    const progressDiv = contentEl.createDiv({ cls: 'onboarding-progress' });
    progressDiv.createEl('p', {
      text: `Step ${step + 1} of ${this.totalSteps}`,
      cls: 'onboarding-progress-text',
    });

    // Add progress bar
    const progressBar = progressDiv.createDiv({ cls: 'onboarding-progress-bar' });
    const progressFill = progressBar.createDiv({ cls: 'onboarding-progress-fill' });
    progressFill.style.width = `${((step + 1) / this.totalSteps) * 100}%`;

    // Display step content
    switch (step) {
      case 0:
        this.displayWelcomeStep(contentEl);
        break;
      case 1:
        this.displayApiKeysStep(contentEl);
        break;
      case 2:
        this.displayTranscriptionStep(contentEl);
        break;
      case 3:
        this.displayOrganizationStep(contentEl);
        break;
      case 4:
        this.displayCompletionStep(contentEl);
        break;
    }

    // Add navigation buttons
    this.addNavigationButtons(contentEl, step);
  }

  /**
   * Step 0: Welcome
   */
  private displayWelcomeStep(contentEl: HTMLElement) {
    const container = contentEl.createDiv({ cls: 'onboarding-step' });

    container.createEl('h3', { text: 'Get Started' });
    container.createEl('p', {
      text: 'This wizard will help you set up Link Video Transcriber in just a few steps.',
    });

    const features = container.createEl('ul');
    features.createEl('li', { text: 'Auto-detect video links from 8+ platforms' });
    features.createEl('li', { text: 'Transcribe with OpenAI Whisper' });
    features.createEl('li', { text: 'Generate AI summaries' });
    features.createEl('li', { text: 'Create beautiful notes automatically' });

    container.createEl('p', {
      text: "Don't worry, you can change these settings later in the plugin settings.",
      cls: 'onboarding-note',
    });
  }

  /**
   * Step 1: API Keys
   */
  private displayApiKeysStep(contentEl: HTMLElement) {
    const container = contentEl.createDiv({ cls: 'onboarding-step' });

    container.createEl('h3', { text: 'API Keys Setup' });
    container.createEl('p', {
      text: 'You need at least a RapidAPI key to extract videos. All keys are optional but recommended.',
    });

    // RapidAPI Key
    new Setting(container)
      .setName('RapidAPI Key')
      .setDesc(
        'Required for video extraction. Get your key at https://rapidapi.com'
      )
      .addText((text) =>
        text
          .setPlaceholder('Enter your RapidAPI key')
          .setValue(this.tempSettings.rapidApiKey || this.plugin.settings.rapidApiKey || '')
          .onChange((value) => {
            this.tempSettings.rapidApiKey = value;
          })
      );

    // OpenAI API Key
    new Setting(container)
      .setName('OpenAI API Key')
      .setDesc('Required for Whisper transcription. Get your key at https://platform.openai.com')
      .addText((text) =>
        text
          .setPlaceholder('Enter your OpenAI API key')
          .setValue(this.tempSettings.openaiApiKey || this.plugin.settings.openaiApiKey || '')
          .onChange((value) => {
            this.tempSettings.openaiApiKey = value;
          })
      );

    // Gemini API Key (optional)
    new Setting(container)
      .setName('Google Gemini API Key (Optional)')
      .setDesc('For AI summaries with Gemini. Free tier available.')
      .addText((text) =>
        text
          .setPlaceholder('Enter your Gemini API key')
          .setValue(this.tempSettings.geminiApiKey || this.plugin.settings.geminiApiKey || '')
          .onChange((value) => {
            this.tempSettings.geminiApiKey = value;
          })
      );
  }

  /**
   * Step 2: Transcription Settings
   */
  private displayTranscriptionStep(contentEl: HTMLElement) {
    const container = contentEl.createDiv({ cls: 'onboarding-step' });

    container.createEl('h3', { text: 'Transcription Preferences' });

    // AI Summary
    new Setting(container)
      .setName('Enable AI Summaries')
      .setDesc('Generate summaries, key points, and action items using AI')
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.tempSettings.enableAiSummary ?? this.plugin.settings.enableAiSummary ?? true
          )
          .onChange((value) => {
            this.tempSettings.enableAiSummary = value;
          })
      );

    // AI Provider
    new Setting(container)
      .setName('AI Provider')
      .setDesc('Choose which AI provider to use for summaries')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('gemini', 'Google Gemini (Free)')
          .addOption('openai', 'OpenAI GPT')
          .addOption('claude', 'Anthropic Claude')
          .setValue(
            this.tempSettings.defaultAiProvider || this.plugin.settings.defaultAiProvider || 'gemini'
          )
          .onChange((value) => {
            this.tempSettings.defaultAiProvider = value;
          })
      );

    // Show confirmation
    new Setting(container)
      .setName('Show Confirmation Modal')
      .setDesc('Ask for confirmation before transcribing detected videos')
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.tempSettings.showConfirmationModal ??
              this.plugin.settings.showConfirmationModal ??
              true
          )
          .onChange((value) => {
            this.tempSettings.showConfirmationModal = value;
          })
      );
  }

  /**
   * Step 3: Organization
   */
  private displayOrganizationStep(contentEl: HTMLElement) {
    const container = contentEl.createDiv({ cls: 'onboarding-step' });

    container.createEl('h3', { text: 'Note Organization' });

    // Note folder
    new Setting(container)
      .setName('Transcript Folder')
      .setDesc('Where to save transcript notes')
      .addText((text) =>
        text
          .setPlaceholder('Transcripts')
          .setValue(this.tempSettings.noteFolder || this.plugin.settings.noteFolder || 'Transcripts')
          .onChange((value) => {
            this.tempSettings.noteFolder = value;
          })
      );

    // Template
    new Setting(container)
      .setName('Default Template')
      .setDesc('Choose how transcript notes are formatted')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('default', 'Default')
          .addOption('minimal', 'Minimal')
          .addOption('academic', 'Academic')
          .addOption('zettelkasten', 'Zettelkasten')
          .addOption('podcast', 'Podcast')
          .addOption('tutorial', 'Tutorial')
          .setValue(this.tempSettings.defaultTemplate || this.plugin.settings.defaultTemplate || 'default')
          .onChange((value) => {
            this.tempSettings.defaultTemplate = value;
          })
      );

    // Folder organization
    new Setting(container)
      .setName('Organize By')
      .setDesc('How to organize transcripts in subfolders')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('none', 'No subfolders')
          .addOption('platform', 'By Platform')
          .addOption('date', 'By Date')
          .addOption('author', 'By Author')
          .setValue(
            this.tempSettings.folderOrganization ||
              this.plugin.settings.folderOrganization ||
              'platform'
          )
          .onChange((value) => {
            this.tempSettings.folderOrganization = value;
          })
      );
  }

  /**
   * Step 4: Completion
   */
  private displayCompletionStep(contentEl: HTMLElement) {
    const container = contentEl.createDiv({ cls: 'onboarding-step' });

    container.createEl('h3', { text: '🎉 All Set!' });
    container.createEl('p', {
      text: 'Your Link Video Transcriber is configured and ready to use.',
    });

    const quickStart = container.createDiv({ cls: 'onboarding-quickstart' });
    quickStart.createEl('h4', { text: 'Quick Start Tips:' });

    const tips = quickStart.createEl('ul');
    tips.createEl('li', { text: '📋 Paste a video URL and it will be auto-detected' });
    tips.createEl('li', { text: '⌨️ Use Cmd/Ctrl+Shift+T to transcribe selected text' });
    tips.createEl('li', { text: '📊 View queue status with Cmd/Ctrl+Shift+Q' });
    tips.createEl('li', { text: '💰 Check costs with Cmd/Ctrl+Shift+C' });

    container.createEl('p', {
      text: 'You can access all settings anytime from the plugin settings panel.',
      cls: 'onboarding-note',
    });
  }

  /**
   * Add navigation buttons
   */
  private addNavigationButtons(contentEl: HTMLElement, step: number) {
    const buttonContainer = contentEl.createDiv({ cls: 'onboarding-buttons' });

    // Back button (except first step)
    if (step > 0) {
      const backBtn = buttonContainer.createEl('button', {
        text: 'Back',
        cls: 'mod-cta',
      });
      backBtn.addEventListener('click', () => {
        this.currentStep--;
        this.displayStep(this.currentStep);
      });
    }

    // Next/Finish button
    const nextBtn = buttonContainer.createEl('button', {
      text: step === this.totalSteps - 1 ? 'Finish' : 'Next',
      cls: 'mod-cta',
    });
    nextBtn.addEventListener('click', () => {
      if (step === this.totalSteps - 1) {
        // Finish - save settings and close
        this.saveAndClose();
      } else {
        // Next step
        this.currentStep++;
        this.displayStep(this.currentStep);
      }
    });

    // Skip button (except last step)
    if (step < this.totalSteps - 1) {
      const skipBtn = buttonContainer.createEl('button', {
        text: 'Skip Setup',
        cls: 'mod-muted',
      });
      skipBtn.addEventListener('click', () => {
        this.close();
      });
    }
  }

  /**
   * Save settings and close
   */
  private async saveAndClose() {
    // Merge temp settings with plugin settings
    Object.assign(this.plugin.settings, this.tempSettings);

    // Mark onboarding as complete
    this.plugin.settings.hasCompletedOnboarding = true;

    // Save settings
    await this.plugin.saveSettings();

    new Notice('✅ Setup complete! You can now start transcribing videos.');
    this.close();
  }
}
