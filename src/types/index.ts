/**
 * Type definitions for Link Video Transcriber plugin
 */

// ============================================================================
// Platform Types
// ============================================================================

export type VideoPlatform =
  | 'youtube'
  | 'instagram'
  | 'twitter'
  | 'tiktok'
  | 'facebook'
  | 'pinterest'
  | 'threads'
  | 'telegram';

export interface VideoMetadata {
  // Core metadata
  title: string;
  author: string;
  authorId?: string;
  platform: VideoPlatform;
  url: string;
  videoId: string;

  // Media info
  thumbnail?: string;
  duration: number; // seconds
  uploadDate?: string;
  description?: string;

  // Engagement metrics
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;

  // Content classification
  category?: string;
  tags?: string[];
  language?: string;

  // URLs
  downloadUrl?: string;
  audioUrl?: string;

  // Platform-specific metadata
  platformMetadata?: Record<string, any>;
}

// ============================================================================
// Transcription Types
// ============================================================================

export type TranscriptionMethod = 'api' | 'local';

export interface TranscriptSegment {
  id: number;
  start: number; // seconds
  end: number;
  text: string;
  tokens?: number[];
  temperature?: number;
  avgLogprob?: number;
  compressionRatio?: number;
  noSpeechProb?: number;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptSegment[];
}

export interface TranscriptionOptions {
  method: TranscriptionMethod;
  language?: string;
  prompt?: string;
  temperature?: number;
}

// ============================================================================
// AI Provider Types
// ============================================================================

export type AIProviderName = 'openai' | 'gemini' | 'claude';

export type SummaryStyle = 'concise' | 'detailed' | 'bullet-points' | 'academic';

export interface SummaryOptions {
  provider: AIProviderName;
  style: SummaryStyle;
  includeKeyPoints: boolean;
  includeQuotes: boolean;
  includeQuestions: boolean;
  includeChapters: boolean;
}

export interface Quote {
  text: string;
  timestamp?: number;
  speaker?: string;
}

export interface Chapter {
  title: string;
  start: number;
  end?: number;
  summary?: string;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems?: string[];
  quotes?: Quote[];
  questions?: string[];
  topics?: string[];
  chapters?: Chapter[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// ============================================================================
// Plugin Settings Types
// ============================================================================

export interface LinkVideoTranscriberSettings {
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
  defaultAiProvider: AIProviderName;
  enableAiSummary: boolean;
  aiSummaryStyle: SummaryStyle;
  includeKeyPoints: boolean;
  includeQuotes: boolean;
  includeQuestions: boolean;
  includeChapters: boolean;

  // Note Generation
  defaultTemplate: string;
  noteFolder: string;
  folderOrganization: 'platform' | 'date' | 'author' | 'custom';
  customFolderPath: string;
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

export const DEFAULT_SETTINGS: LinkVideoTranscriberSettings = {
  // API Configuration
  rapidApiKey: '',
  openaiApiKey: '',
  geminiApiKey: '',
  claudeApiKey: '',

  // Transcription Settings
  transcriptionMethod: 'auto',
  whisperApiEnabled: false,
  localWhisperEnabled: false,
  whisperModelPath: '',
  whisperModel: 'base',

  // AI Provider Settings
  defaultAiProvider: 'gemini',
  enableAiSummary: true,
  aiSummaryStyle: 'concise',
  includeKeyPoints: true,
  includeQuotes: false,
  includeQuestions: false,
  includeChapters: false,

  // Note Generation
  defaultTemplate: 'default',
  noteFolder: 'Transcripts',
  folderOrganization: 'platform',
  customFolderPath: '',
  filenamePattern: '{title} - {date}',
  tagStrategy: 'auto',
  linkStrategy: 'link',
  openNoteOnCreate: true,

  // Detection Settings
  autoDetectMarkdown: true,
  autoDetectCanvas: false,
  autoDetectExcalidraw: false,
  detectionDelay: 500,
  showConfirmationModal: true,

  // Performance
  maxConcurrentTranscriptions: 2,
  cacheTranscripts: true,
  cacheDuration: 30,

  // Privacy
  privacyMode: false,
  deleteAudioAfterTranscription: true,
  saveAudioFiles: false,
  audioFileLocation: '',

  // Advanced
  debugMode: false,
  customApiEndpoint: '',
  proxyUrl: '',
};

// ============================================================================
// Template Types
// ============================================================================

export interface TemplateData {
  // Video metadata
  title: string;
  platform: string;
  author: string;
  url: string;
  thumbnail?: string;
  duration: number;
  uploadDate?: string;
  videoId: string;

  // Transcript data
  transcript: string;
  transcriptSegments?: TranscriptSegment[];
  language: string;
  wordCount: number;

  // AI-generated content
  summary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  quotes?: Quote[];
  chapters?: Chapter[];
  topics?: string[];

  // Metadata
  transcribedAt: string;
  transcriptionMethod: TranscriptionMethod;
  aiProvider?: AIProviderName;
  tags?: string[];
  folder?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface DetectedVideoLink {
  url: string;
  platform: VideoPlatform;
  videoId: string;
  context: 'markdown' | 'canvas' | 'excalidraw';
  sourceFile?: string;
  position?: {
    line?: number;
    ch?: number;
  };
}

// ============================================================================
// Progress Types
// ============================================================================

export type ProgressStage =
  | 'detecting'
  | 'fetching-metadata'
  | 'downloading-audio'
  | 'transcribing'
  | 'ai-processing'
  | 'creating-note'
  | 'complete';

export interface ProgressUpdate {
  stage: ProgressStage;
  percent: number;
  message?: string;
  details?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class TranscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

// ============================================================================
// API Response Types
// ============================================================================

export interface RapidAPIResponse {
  status: 'success' | 'error';
  data?: {
    title: string;
    author?: string;
    thumbnail?: string;
    duration: number;
    platform: string;
    download_url?: string;
    audio_url?: string;
    video_url?: string;
    expires_at?: string;
    metadata?: Record<string, any>;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
    retry: boolean;
  };
}
