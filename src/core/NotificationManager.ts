import { Notice } from 'obsidian';

/**
 * Notification level
 */
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  showSuccess: boolean;
  showWarnings: boolean;
  showErrors: boolean;
  showProgress: boolean;
  duration: number; // in milliseconds
  quietMode: boolean; // Suppress all except errors
}

/**
 * Notification Manager - Controls notification display with user preferences
 */
export class NotificationManager {
  private preferences: NotificationPreferences;
  private debugMode: boolean;

  constructor(preferences?: Partial<NotificationPreferences>, debugMode: boolean = false) {
    this.debugMode = debugMode;
    this.preferences = {
      enabled: true,
      showSuccess: true,
      showWarnings: true,
      showErrors: true,
      showProgress: true,
      duration: 4000,
      quietMode: false,
      ...preferences,
    };
  }

  /**
   * Show notification with level
   */
  show(message: string, level: NotificationLevel = 'info', duration?: number): void {
    // Check if notifications are enabled
    if (!this.preferences.enabled) {
      return;
    }

    // Check quiet mode (only show errors)
    if (this.preferences.quietMode && level !== 'error') {
      return;
    }

    // Check level-specific preferences
    if (level === 'success' && !this.preferences.showSuccess) return;
    if (level === 'warning' && !this.preferences.showWarnings) return;
    if (level === 'error' && !this.preferences.showErrors) return;

    // Format message with icon
    const formattedMessage = this.formatMessage(message, level);

    // Show notice
    const effectiveDuration = duration ?? this.preferences.duration;
    new Notice(formattedMessage, effectiveDuration);

    if (this.debugMode) {
      console.log(`Notification [${level}]:`, message);
    }
  }

  /**
   * Show info notification
   */
  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show success notification
   */
  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show error notification
   */
  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show progress notification
   */
  progress(message: string, duration?: number): void {
    if (!this.preferences.showProgress) return;
    this.show(message, 'info', duration);
  }

  /**
   * Format message with emoji icon
   */
  private formatMessage(message: string, level: NotificationLevel): string {
    const icons: Record<NotificationLevel, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    return `${icons[level]} ${message}`;
  }

  /**
   * Update preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...preferences,
    };

    if (this.debugMode) {
      console.log('Notification preferences updated:', this.preferences);
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Enable all notifications
   */
  enableAll(): void {
    this.preferences.enabled = true;
    this.preferences.showSuccess = true;
    this.preferences.showWarnings = true;
    this.preferences.showErrors = true;
    this.preferences.showProgress = true;
    this.preferences.quietMode = false;
  }

  /**
   * Disable all notifications except errors
   */
  enableQuietMode(): void {
    this.preferences.quietMode = true;
  }

  /**
   * Disable quiet mode
   */
  disableQuietMode(): void {
    this.preferences.quietMode = false;
  }

  /**
   * Completely disable all notifications
   */
  disableAll(): void {
    this.preferences.enabled = false;
  }

  /**
   * Set notification duration
   */
  setDuration(duration: number): void {
    this.preferences.duration = duration;
  }

  /**
   * Check if level is enabled
   */
  isLevelEnabled(level: NotificationLevel): boolean {
    if (!this.preferences.enabled) return false;
    if (this.preferences.quietMode && level !== 'error') return false;

    switch (level) {
      case 'success':
        return this.preferences.showSuccess;
      case 'warning':
        return this.preferences.showWarnings;
      case 'error':
        return this.preferences.showErrors;
      default:
        return true;
    }
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}
