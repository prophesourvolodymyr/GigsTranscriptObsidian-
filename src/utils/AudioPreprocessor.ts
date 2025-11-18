import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

/**
 * Audio preprocessing options
 */
export interface AudioPreprocessingOptions {
  /**
   * Convert to specific format (mp3, wav, m4a)
   */
  outputFormat?: 'mp3' | 'wav' | 'm4a';

  /**
   * Target sample rate (e.g., 16000, 44100, 48000)
   */
  sampleRate?: number;

  /**
   * Convert to mono audio
   */
  convertToMono?: boolean;

  /**
   * Normalize audio volume
   */
  normalize?: boolean;

  /**
   * Apply noise reduction
   */
  reduceNoise?: boolean;

  /**
   * Target bitrate for compression (e.g., '128k', '192k')
   */
  bitrate?: string;

  /**
   * Maximum file size in MB (will compress to meet this)
   */
  maxFileSizeMB?: number;
}

/**
 * Audio file information
 */
export interface AudioInfo {
  format: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  size: number;
}

/**
 * Audio Preprocessor - Utilities for audio file preprocessing
 */
export class AudioPreprocessor {
  private debugMode: boolean;
  private tempDir: string;

  constructor(tempDir: string, debugMode: boolean = false) {
    this.tempDir = tempDir;
    this.debugMode = debugMode;
  }

  /**
   * Check if FFmpeg is available
   */
  async isFfmpegAvailable(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get audio file information
   */
  async getAudioInfo(audioPath: string): Promise<AudioInfo> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${audioPath}"`
      );

      const data = JSON.parse(stdout);
      const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');
      const format = data.format;

      return {
        format: format.format_name,
        duration: parseFloat(format.duration),
        sampleRate: parseInt(audioStream.sample_rate),
        channels: audioStream.channels,
        bitrate: parseInt(format.bit_rate),
        size: parseInt(format.size),
      };
    } catch (error) {
      throw new Error(`Failed to get audio info: ${error.message}`);
    }
  }

  /**
   * Preprocess audio file
   */
  async preprocessAudio(
    inputPath: string,
    outputPath: string,
    options: AudioPreprocessingOptions = {}
  ): Promise<string> {
    if (!(await this.isFfmpegAvailable())) {
      throw new Error(
        'FFmpeg is not available. Please install FFmpeg to use audio preprocessing features.'
      );
    }

    // Get input audio info
    const audioInfo = await this.getAudioInfo(inputPath);

    if (this.debugMode) {
      console.log('Input audio info:', audioInfo);
      console.log('Preprocessing options:', options);
    }

    // Build FFmpeg command
    const ffmpegArgs: string[] = ['-i', `"${inputPath}"`];

    // Sample rate
    if (options.sampleRate) {
      ffmpegArgs.push('-ar', options.sampleRate.toString());
    }

    // Convert to mono
    if (options.convertToMono) {
      ffmpegArgs.push('-ac', '1');
    }

    // Normalize audio
    if (options.normalize) {
      ffmpegArgs.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
    }

    // Noise reduction (simple highpass and lowpass filter)
    if (options.reduceNoise) {
      const filterComplex = options.normalize
        ? '-af loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=200,lowpass=f=3000'
        : '-af highpass=f=200,lowpass=f=3000';
      ffmpegArgs.push(filterComplex);
    }

    // Bitrate
    if (options.bitrate) {
      ffmpegArgs.push('-b:a', options.bitrate);
    } else if (options.maxFileSizeMB) {
      // Calculate required bitrate to meet max file size
      const targetBitrate = Math.floor(
        (options.maxFileSizeMB * 8 * 1024 * 1024) / audioInfo.duration
      );
      ffmpegArgs.push('-b:a', `${targetBitrate}`);
    }

    // Output format
    const ext = options.outputFormat || 'mp3';
    const finalOutputPath = outputPath.endsWith(`.${ext}`)
      ? outputPath
      : `${outputPath}.${ext}`;

    // Add output path
    ffmpegArgs.push('-y', `"${finalOutputPath}"`);

    // Execute FFmpeg
    const command = `ffmpeg ${ffmpegArgs.join(' ')}`;

    if (this.debugMode) {
      console.log('FFmpeg command:', command);
    }

    try {
      await execAsync(command);

      if (this.debugMode) {
        const outputInfo = await this.getAudioInfo(finalOutputPath);
        console.log('Output audio info:', outputInfo);
      }

      return finalOutputPath;
    } catch (error) {
      throw new Error(`FFmpeg processing failed: ${error.message}`);
    }
  }

  /**
   * Optimize audio for Whisper API (16kHz mono MP3)
   */
  async optimizeForWhisper(inputPath: string): Promise<string> {
    const outputPath = path.join(
      this.tempDir,
      `whisper_optimized_${Date.now()}.mp3`
    );

    return await this.preprocessAudio(inputPath, outputPath, {
      outputFormat: 'mp3',
      sampleRate: 16000,
      convertToMono: true,
      normalize: true,
      bitrate: '64k',
    });
  }

  /**
   * Split audio file into chunks
   */
  async splitAudio(
    inputPath: string,
    chunkDurationSeconds: number
  ): Promise<string[]> {
    if (!(await this.isFfmpegAvailable())) {
      throw new Error('FFmpeg is not available');
    }

    const audioInfo = await this.getAudioInfo(inputPath);
    const numChunks = Math.ceil(audioInfo.duration / chunkDurationSeconds);
    const outputPaths: string[] = [];

    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDurationSeconds;
      const outputPath = path.join(
        this.tempDir,
        `chunk_${i}_${Date.now()}.mp3`
      );

      const command = `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${chunkDurationSeconds} -acodec copy -y "${outputPath}"`;

      if (this.debugMode) {
        console.log(`Creating chunk ${i + 1}/${numChunks}:`, command);
      }

      await execAsync(command);
      outputPaths.push(outputPath);
    }

    if (this.debugMode) {
      console.log(`Split audio into ${numChunks} chunks`);
    }

    return outputPaths;
  }

  /**
   * Extract audio from video file
   */
  async extractAudioFromVideo(
    videoPath: string,
    outputPath?: string
  ): Promise<string> {
    if (!(await this.isFfmpegAvailable())) {
      throw new Error('FFmpeg is not available');
    }

    const output =
      outputPath || path.join(this.tempDir, `extracted_audio_${Date.now()}.mp3`);

    const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 192k -y "${output}"`;

    if (this.debugMode) {
      console.log('Extracting audio:', command);
    }

    await execAsync(command);
    return output;
  }

  /**
   * Check if file size exceeds limit
   */
  exceedsFileSize(filePath: string, maxSizeMB: number): boolean {
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    return fileSizeMB > maxSizeMB;
  }

  /**
   * Compress audio to meet file size limit
   */
  async compressToSize(inputPath: string, maxSizeMB: number): Promise<string> {
    const audioInfo = await this.getAudioInfo(inputPath);

    // Calculate required bitrate
    const targetBitrate = Math.floor(
      (maxSizeMB * 8 * 1024 * 1024) / audioInfo.duration
    );

    const outputPath = path.join(
      this.tempDir,
      `compressed_${Date.now()}.mp3`
    );

    if (this.debugMode) {
      console.log(`Compressing to ${maxSizeMB}MB with bitrate ${targetBitrate}bps`);
    }

    return await this.preprocessAudio(inputPath, outputPath, {
      outputFormat: 'mp3',
      bitrate: `${targetBitrate}`,
      convertToMono: true,
    });
  }

  /**
   * Clean up temporary files
   */
  cleanupTempFiles(filePaths: string[]): void {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);

          if (this.debugMode) {
            console.log('Deleted temp file:', filePath);
          }
        }
      } catch (error) {
        if (this.debugMode) {
          console.error('Failed to delete temp file:', filePath, error);
        }
      }
    }
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
