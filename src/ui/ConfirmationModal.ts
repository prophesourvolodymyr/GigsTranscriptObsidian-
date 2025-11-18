import { App, Modal, Setting } from 'obsidian';
import { DetectedVideoLink } from '../types';
import { getPlatformInfo } from '../constants';

/**
 * Confirmation Modal - Shows detected video and asks user to confirm transcription
 */
export class ConfirmationModal extends Modal {
  private link: DetectedVideoLink;
  private onConfirm: (confirmed: boolean) => void;

  constructor(app: App, link: DetectedVideoLink, onConfirm: (confirmed: boolean) => void) {
    super(app);
    this.link = link;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Title
    contentEl.createEl('h2', { text: '📹 Video Link Detected' });

    // Platform info
    const platformInfo = getPlatformInfo(this.link.platform);
    const infoContainer = contentEl.createDiv('video-info');

    infoContainer.createEl('p', {
      text: `Platform: ${platformInfo.icon} ${platformInfo.name}`,
      cls: 'platform-badge',
    });

    infoContainer.createEl('p', {
      text: `Video ID: ${this.link.videoId}`,
      cls: 'video-id',
    });

    // URL preview
    const urlContainer = contentEl.createDiv('url-preview');
    urlContainer.createEl('strong', { text: 'URL: ' });
    urlContainer.createEl('span', { text: this.truncateUrl(this.link.url) });

    // Context info
    if (this.link.sourceFile) {
      contentEl.createEl('p', {
        text: `Source: ${this.link.sourceFile}`,
        cls: 'source-file',
      });
    }

    // Spacing
    contentEl.createEl('div', { cls: 'modal-spacer' });

    // Options
    contentEl.createEl('h3', { text: 'Transcription Options' });

    const optionsContainer = contentEl.createDiv('transcription-options');

    // Transcription method
    new Setting(optionsContainer)
      .setName('Transcription method')
      .setDesc('Choose how to transcribe this video')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('auto', 'Auto (smart selection)')
          .addOption('api', 'Whisper API (fast)')
          .addOption('local', 'Local Whisper (private)')
          .setValue('auto')
      );

    // AI summary
    new Setting(optionsContainer)
      .setName('Generate AI summary')
      .setDesc('Create summary and key points using AI')
      .addToggle((toggle) => toggle.setValue(true));

    // Buttons
    const buttonContainer = contentEl.createDiv('modal-button-container');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const transcribeBtn = buttonContainer.createEl('button', {
      text: 'Transcribe',
      cls: 'mod-cta',
    });
    transcribeBtn.addEventListener('click', () => {
      this.onConfirm(true);
      this.close();
    });

    const cancelBtn = buttonContainer.createEl('button', {
      text: 'Cancel',
    });
    cancelBtn.addEventListener('click', () => {
      this.onConfirm(false);
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private truncateUrl(url: string, maxLength: number = 60): string {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  }
}
