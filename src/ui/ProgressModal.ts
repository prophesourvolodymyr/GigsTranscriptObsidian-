import { App, Modal } from 'obsidian';
import { ProgressStage, ProgressUpdate } from '../types';

/**
 * Progress Modal - Shows real-time transcription progress
 */
export class ProgressModal extends Modal {
  private currentStage: ProgressStage = 'detecting';
  private currentPercent: number = 0;
  private currentMessage: string = '';
  private currentDetails: string = '';

  private headerEl: HTMLElement;
  private stageEl: HTMLElement;
  private progressBarEl: HTMLElement;
  private progressFillEl: HTMLElement;
  private percentEl: HTMLElement;
  private messageEl: HTMLElement;
  private detailsEl: HTMLElement;
  private cancelCallback?: () => void;

  constructor(app: App, private videoTitle: string = 'Video') {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('link-video-transcriber-progress');

    // Header
    this.headerEl = contentEl.createEl('h2', {
      text: '🎬 Transcribing Video',
      cls: 'progress-header',
    });

    // Video title
    contentEl.createEl('p', {
      text: this.videoTitle,
      cls: 'progress-video-title',
    });

    // Stage indicator
    this.stageEl = contentEl.createDiv({ cls: 'progress-stage' });

    // Progress bar container
    const progressContainer = contentEl.createDiv({ cls: 'progress-bar-container' });

    this.progressBarEl = progressContainer.createDiv({ cls: 'progress-bar' });
    this.progressFillEl = this.progressBarEl.createDiv({ cls: 'progress-fill' });

    // Percentage
    this.percentEl = contentEl.createEl('p', {
      text: '0%',
      cls: 'progress-percent',
    });

    // Message
    this.messageEl = contentEl.createEl('p', {
      text: 'Initializing...',
      cls: 'progress-message',
    });

    // Details
    this.detailsEl = contentEl.createEl('p', {
      text: '',
      cls: 'progress-details',
    });

    // Cancel button
    const buttonContainer = contentEl.createDiv({ cls: 'progress-button-container' });
    const cancelBtn = buttonContainer.createEl('button', {
      text: 'Cancel',
      cls: 'mod-warning',
    });
    cancelBtn.addEventListener('click', () => {
      if (this.cancelCallback) {
        this.cancelCallback();
      }
      this.close();
    });

    // Apply initial state
    this.updateUI();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Update progress
   */
  update(update: ProgressUpdate) {
    this.currentStage = update.stage;
    this.currentPercent = update.percent;

    if (update.message) {
      this.currentMessage = update.message;
    }

    if (update.details !== undefined) {
      this.currentDetails = update.details || '';
    }

    this.updateUI();
  }

  /**
   * Update UI elements
   */
  private updateUI() {
    // Update stage
    const stageInfo = this.getStageInfo(this.currentStage);
    this.stageEl.setText(`${stageInfo.icon} ${stageInfo.label}`);

    // Update progress bar
    this.progressFillEl.style.width = `${this.currentPercent}%`;

    // Update percentage
    this.percentEl.setText(`${Math.round(this.currentPercent)}%`);

    // Update message
    if (this.currentMessage) {
      this.messageEl.setText(this.currentMessage);
    }

    // Update details
    if (this.currentDetails) {
      this.detailsEl.setText(this.currentDetails);
      this.detailsEl.style.display = 'block';
    } else {
      this.detailsEl.style.display = 'none';
    }

    // Update header if complete
    if (this.currentStage === 'complete') {
      this.headerEl.setText('✅ Transcription Complete!');
    }
  }

  /**
   * Get stage info (icon and label)
   */
  private getStageInfo(stage: ProgressStage): { icon: string; label: string } {
    const stageInfo: Record<ProgressStage, { icon: string; label: string }> = {
      detecting: { icon: '🔍', label: 'Detecting video...' },
      'fetching-metadata': { icon: '📥', label: 'Fetching metadata...' },
      'downloading-audio': { icon: '⬇️', label: 'Downloading audio...' },
      transcribing: { icon: '🎙️', label: 'Transcribing audio...' },
      'ai-processing': { icon: '✨', label: 'Generating summary...' },
      'creating-note': { icon: '📝', label: 'Creating note...' },
      complete: { icon: '✅', label: 'Complete!' },
    };

    return stageInfo[stage] || { icon: '⏳', label: 'Processing...' };
  }

  /**
   * Set cancel callback
   */
  onCancel(callback: () => void) {
    this.cancelCallback = callback;
  }

  /**
   * Complete and close modal
   */
  complete() {
    this.update({
      stage: 'complete',
      percent: 100,
      message: 'Transcription completed successfully!',
    });

    // Auto-close after 2 seconds
    setTimeout(() => {
      this.close();
    }, 2000);
  }

  /**
   * Show error and close
   */
  error(message: string) {
    this.headerEl.setText('❌ Transcription Failed');
    this.messageEl.setText(message);
    this.progressFillEl.style.backgroundColor = 'var(--text-error)';
  }

  /**
   * Set video title
   */
  setVideoTitle(title: string) {
    this.videoTitle = title;
  }
}
