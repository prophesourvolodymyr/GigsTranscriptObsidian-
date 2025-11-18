import { Notice } from 'obsidian';

/**
 * Error type classification
 */
export type ErrorType =
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'FILE_ERROR'
  | 'VALIDATION_ERROR'
  | 'TRANSCRIPTION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Error classification result
 */
export interface ClassifiedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
  retryDelay?: number;
  originalError: Error;
}

/**
 * Retry options
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
  retryableErrors?: ErrorType[];
}

/**
 * Error Handler - Classifies errors, provides user-friendly messages, and handles retries
 */
export class ErrorHandler {
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Classify error into specific types
   */
  classifyError(error: any): ClassifiedError {
    // Default classification
    let classified: ClassifiedError = {
      type: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      recoverable: false,
      retryable: false,
      originalError: error instanceof Error ? error : new Error(String(error)),
    };

    // Extract error message
    const errorMessage = error?.message || String(error);

    // Check for network errors
    if (
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('network') ||
      errorMessage.includes('NO_RESPONSE')
    ) {
      classified = {
        ...classified,
        type: 'NETWORK_ERROR',
        message: 'Network connection failed',
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        recoverable: true,
        retryable: true,
        retryDelay: 2000,
      };
    }

    // Check for authentication errors
    else if (
      errorMessage.includes('401') ||
      errorMessage.includes('INVALID_API_KEY') ||
      errorMessage.includes('Unauthorized')
    ) {
      classified = {
        ...classified,
        type: 'AUTH_ERROR',
        message: 'Authentication failed',
        userMessage: 'Invalid API key. Please check your settings.',
        recoverable: false,
        retryable: false,
      };
    }

    // Check for rate limit errors
    else if (
      errorMessage.includes('429') ||
      errorMessage.includes('RATE_LIMIT') ||
      errorMessage.includes('rate limit')
    ) {
      classified = {
        ...classified,
        type: 'RATE_LIMIT',
        message: 'Rate limit exceeded',
        userMessage: 'API rate limit exceeded. Please wait a moment and try again.',
        recoverable: true,
        retryable: true,
        retryDelay: 10000, // 10 seconds
      };
    }

    // Check for file errors
    else if (
      errorMessage.includes('ENOENT') ||
      errorMessage.includes('file not found') ||
      errorMessage.includes('FILE_ERROR') ||
      errorMessage.includes('FILE_TOO_LARGE')
    ) {
      classified = {
        ...classified,
        type: 'FILE_ERROR',
        message: 'File operation failed',
        userMessage: 'Unable to access or process the file. Please check the file path.',
        recoverable: false,
        retryable: false,
      };
    }

    // Check for validation errors
    else if (
      errorMessage.includes('INVALID') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('400')
    ) {
      classified = {
        ...classified,
        type: 'VALIDATION_ERROR',
        message: 'Invalid input',
        userMessage: 'Invalid input provided. Please check your settings.',
        recoverable: false,
        retryable: false,
      };
    }

    // Check for transcription errors
    else if (errorMessage.includes('TRANSCRIPTION_ERROR') || errorMessage.includes('Whisper')) {
      classified = {
        ...classified,
        type: 'TRANSCRIPTION_ERROR',
        message: 'Transcription failed',
        userMessage: 'Failed to transcribe audio. Please try again or use a different method.',
        recoverable: true,
        retryable: true,
        retryDelay: 3000,
      };
    }

    // Check for API errors
    else if (errorMessage.includes('API_ERROR') || errorMessage.includes('500')) {
      classified = {
        ...classified,
        type: 'API_ERROR',
        message: 'API request failed',
        userMessage: 'Server error. Please try again later.',
        recoverable: true,
        retryable: true,
        retryDelay: 5000,
      };
    }

    if (this.debugMode) {
      console.error('Classified Error:', classified);
    }

    return classified;
  }

  /**
   * Show user-friendly error notification
   */
  showError(error: any) {
    const classified = this.classifyError(error);
    new Notice(`❌ ${classified.userMessage}`, 5000);

    if (this.debugMode) {
      console.error('Error details:', classified);
    }
  }

  /**
   * Execute function with retry logic
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      exponentialBackoff = true,
      retryableErrors = ['NETWORK_ERROR', 'API_ERROR', 'RATE_LIMIT', 'TRANSCRIPTION_ERROR'],
    } = options;

    let lastError: any;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Try executing the function
        return await fn();
      } catch (error) {
        lastError = error;
        attempt++;

        // Classify error
        const classified = this.classifyError(error);

        // Check if error is retryable
        if (!classified.retryable || !retryableErrors.includes(classified.type)) {
          if (this.debugMode) {
            console.log('Error not retryable, throwing immediately');
          }
          throw error;
        }

        // Check if we've exhausted retries
        if (attempt > maxRetries) {
          if (this.debugMode) {
            console.log(`Max retries (${maxRetries}) exceeded`);
          }
          break;
        }

        // Calculate delay
        let delay = classified.retryDelay || baseDelay;

        if (exponentialBackoff) {
          delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        }

        // Show retry notification
        new Notice(
          `⚠️ ${classified.userMessage}\nRetrying in ${(delay / 1000).toFixed(1)}s... (Attempt ${attempt}/${maxRetries})`,
          delay
        );

        if (this.debugMode) {
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // All retries exhausted, throw last error
    const classified = this.classifyError(lastError);
    new Notice(`❌ ${classified.userMessage}\nAll retry attempts failed.`, 5000);

    throw lastError;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create error recovery action suggestions
   */
  getRecoveryActions(error: any): string[] {
    const classified = this.classifyError(error);
    const actions: string[] = [];

    switch (classified.type) {
      case 'NETWORK_ERROR':
        actions.push('Check your internet connection');
        actions.push('Verify firewall settings');
        actions.push('Try again in a few moments');
        break;

      case 'AUTH_ERROR':
        actions.push('Check your API key in settings');
        actions.push('Verify API key has correct permissions');
        actions.push('Generate a new API key if needed');
        break;

      case 'RATE_LIMIT':
        actions.push('Wait a few minutes before trying again');
        actions.push('Consider upgrading your API plan');
        actions.push('Use local Whisper instead of API');
        break;

      case 'FILE_ERROR':
        actions.push('Check file path is correct');
        actions.push('Verify file exists and is accessible');
        actions.push('Ensure sufficient disk space');
        break;

      case 'VALIDATION_ERROR':
        actions.push('Check video URL is valid');
        actions.push('Verify platform is supported');
        actions.push('Check plugin settings');
        break;

      case 'TRANSCRIPTION_ERROR':
        actions.push('Try using a different transcription method');
        actions.push('Check audio file quality');
        actions.push('Verify OpenAI API key is valid');
        break;

      case 'API_ERROR':
        actions.push('Wait a few moments and try again');
        actions.push('Check API status page');
        actions.push('Try using fallback API');
        break;

      default:
        actions.push('Try again');
        actions.push('Check plugin settings');
        actions.push('Report issue if problem persists');
    }

    return actions;
  }

  /**
   * Log error for debugging
   */
  logError(error: any, context?: string) {
    if (!this.debugMode) return;

    const classified = this.classifyError(error);

    console.group(`🐛 Error ${context ? `in ${context}` : ''}`);
    console.error('Type:', classified.type);
    console.error('Message:', classified.message);
    console.error('User Message:', classified.userMessage);
    console.error('Recoverable:', classified.recoverable);
    console.error('Retryable:', classified.retryable);
    console.error('Original Error:', classified.originalError);
    console.error('Stack:', classified.originalError.stack);
    console.groupEnd();
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
