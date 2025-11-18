import OpenAI from 'openai';
import { TranscriptionResult, TranscriptSegment, TranscriptionOptions } from '../types';
import { Notice } from 'obsidian';
import { createReadStream, statSync } from 'fs';
import { MAX_FILE_SIZE_MB } from '../constants';

/**
 * Whisper API Transcriber - Uses OpenAI Whisper API for transcription
 */
export class WhisperAPITranscriber {
  private client: OpenAI;
  private debugMode: boolean;

  constructor(apiKey: string, debugMode: boolean = false) {
    this.client = new OpenAI({ apiKey });
    this.debugMode = debugMode;
  }

  /**
   * Transcribe audio file using Whisper API
   */
  async transcribe(
    audioFilePath: string,
    options: Partial<TranscriptionOptions> = {}
  ): Promise<TranscriptionResult> {
    try {
      // Check file size
      const fileSize = this.getFileSize(audioFilePath);
      const fileSizeMB = fileSize / (1024 * 1024);

      if (this.debugMode) {
        console.log('Whisper API: Starting transcription', {
          file: audioFilePath,
          sizeMB: fileSizeMB.toFixed(2),
          options,
        });
      }

      // If file is larger than 25MB, need to chunk it
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        new Notice(`⚠️ Large file (${fileSizeMB.toFixed(1)}MB). This may take longer...`);
        // TODO: Implement chunking in future iteration
        // For now, throw error
        throw new Error(
          `File size (${fileSizeMB.toFixed(1)}MB) exceeds Whisper API limit (${MAX_FILE_SIZE_MB}MB). Please use local Whisper for large files.`
        );
      }

      // Create file stream
      const fileStream = createReadStream(audioFilePath);

      // Call Whisper API
      const startTime = Date.now();
      const response = await this.client.audio.transcriptions.create({
        file: fileStream as any,
        model: 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        temperature: options.temperature || 0,
        response_format: 'verbose_json',
      });

      const duration = (Date.now() - startTime) / 1000;

      if (this.debugMode) {
        console.log('Whisper API: Transcription complete', {
          duration: `${duration.toFixed(2)}s`,
          textLength: response.text.length,
        });
      }

      // Parse response
      return this.parseResponse(response);
    } catch (error) {
      return this.handleError(error, audioFilePath);
    }
  }

  /**
   * Parse Whisper API response
   */
  private parseResponse(response: any): TranscriptionResult {
    const result: TranscriptionResult = {
      text: response.text || '',
      language: response.language,
      duration: response.duration,
    };

    // Parse segments if available
    if (response.segments && Array.isArray(response.segments)) {
      result.segments = response.segments.map((seg: any, index: number) => ({
        id: seg.id || index,
        start: seg.start || 0,
        end: seg.end || 0,
        text: seg.text || '',
        tokens: seg.tokens,
        temperature: seg.temperature,
        avgLogprob: seg.avg_logprob,
        compressionRatio: seg.compression_ratio,
        noSpeechProb: seg.no_speech_prob,
      }));
    }

    return result;
  }

  /**
   * Get file size in bytes
   */
  private getFileSize(filePath: string): number {
    try {
      const stats = statSync(filePath);
      return stats.size;
    } catch (error) {
      if (this.debugMode) {
        console.error('Failed to get file size:', error);
      }
      throw new Error(`Failed to read audio file: ${filePath}`);
    }
  }

  /**
   * Handle transcription errors
   */
  private handleError(error: any, audioFilePath: string): never {
    let errorMessage = 'Transcription failed';
    let errorCode = 'TRANSCRIPTION_ERROR';

    if (error.response) {
      // OpenAI API error
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          errorMessage = 'Invalid audio file or parameters';
          errorCode = 'INVALID_FILE';
          break;
        case 401:
          errorMessage = 'Invalid OpenAI API key. Please check your settings.';
          errorCode = 'INVALID_API_KEY';
          break;
        case 413:
          errorMessage = 'Audio file too large (max 25MB)';
          errorCode = 'FILE_TOO_LARGE';
          break;
        case 429:
          errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
          errorCode = 'RATE_LIMIT';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'OpenAI server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
          break;
        default:
          errorMessage = data?.error?.message || `API error (${status})`;
          errorCode = 'API_ERROR';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = 'TRANSCRIPTION_ERROR';
    }

    if (this.debugMode) {
      console.error('Whisper API Error:', {
        code: errorCode,
        message: errorMessage,
        file: audioFilePath,
        error,
      });
    }

    // Show user notification
    new Notice(`❌ ${errorMessage}`);

    throw new Error(`[${errorCode}] ${errorMessage}`);
  }

  /**
   * Estimate transcription cost
   */
  estimateCost(durationSeconds: number): number {
    // Whisper API costs $0.006 per minute
    const COST_PER_MINUTE = 0.006;
    const minutes = durationSeconds / 60;
    return minutes * COST_PER_MINUTE;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Just check if we can access the API
      // We can't test without an actual audio file
      // So we'll just verify the API key is set
      return !!this.client.apiKey;
    } catch (error) {
      if (this.debugMode) {
        console.error('Whisper API connection test failed:', error);
      }
      return false;
    }
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'en', // English
      'es', // Spanish
      'fr', // French
      'de', // German
      'it', // Italian
      'pt', // Portuguese
      'nl', // Dutch
      'pl', // Polish
      'ru', // Russian
      'ja', // Japanese
      'ko', // Korean
      'zh', // Chinese
      'ar', // Arabic
      'tr', // Turkish
      'hi', // Hindi
      // ... Whisper supports 99+ languages
      'auto', // Auto-detect
    ];
  }
}
