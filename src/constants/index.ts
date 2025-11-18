/**
 * Plugin constants
 */

export const PLUGIN_NAME = 'Link Video Transcriber';
export const PLUGIN_ID = 'link-video-transcriber';

// API URLs
export const RAPIDAPI_BASE_URL =
  'https://instagram-tiktok-youtube-downloader.p.rapidapi.com';
export const RAPIDAPI_FALLBACK_URL =
  'https://all-social-media-video-downloader.p.rapidapi.com';

export const OPENAI_API_BASE = 'https://api.openai.com/v1';
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const CLAUDE_API_BASE = 'https://api.anthropic.com/v1';

// API Settings
export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const CHUNK_DURATION_SECONDS = 20 * 60; // 20 minutes
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 2000;

// Cost estimates (USD)
export const WHISPER_COST_PER_MINUTE = 0.006;
export const RAPIDAPI_COST_PER_REQUEST = 0.002;

// Cache settings
export const DEFAULT_CACHE_DURATION_DAYS = 30;
export const METADATA_CACHE_DURATION_DAYS = 7;

// File paths
export const DEFAULT_TRANSCRIPTS_FOLDER = 'Transcripts';
export const TEMP_AUDIO_FOLDER = '.transcriber-temp';

// Progress stages
export const PROGRESS_STAGES = {
  DETECTING: 'Detecting video platform...',
  FETCHING_METADATA: 'Fetching video information...',
  DOWNLOADING_AUDIO: 'Downloading audio...',
  TRANSCRIBING: 'Transcribing audio...',
  AI_PROCESSING: 'Generating AI summary...',
  CREATING_NOTE: 'Creating note...',
  COMPLETE: 'Complete!',
};

// Naming patterns
export const FILENAME_PATTERNS = {
  'title-only': '{title}',
  'title-date': '{title} - {date}',
  'platform-title': '[{platform}] {title}',
  'author-title': '{author} - {title}',
  'date-title': '{date} - {title}',
  zettelkasten: '{timestamp} {title}',
  'id-based': '{platform}-{id}',
};

// Template names
export const TEMPLATE_NAMES = {
  DEFAULT: 'default',
  ACADEMIC: 'academic',
  MINIMAL: 'minimal',
  ZETTELKASTEN: 'zettelkasten',
};

// Error messages
export const ERROR_MESSAGES = {
  NO_API_KEY: 'API key not configured. Please add your RapidAPI key in settings.',
  INVALID_URL: 'Invalid video URL. Please check the URL and try again.',
  VIDEO_UNAVAILABLE: 'Video not found. It may be private or deleted.',
  RATE_LIMIT: 'Rate limit reached. Please try again later or upgrade your API plan.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TRANSCRIPTION_FAILED: 'Transcription failed. Please try again.',
  NO_AUDIO: 'Could not extract audio from video.',
};

// Keyboard shortcuts
export const DEFAULT_HOTKEYS = {
  TRANSCRIBE_CLIPBOARD: 'Ctrl+Shift+T',
  PASTE_AND_TRANSCRIBE: 'Ctrl+Shift+V',
  OPEN_QUEUE: 'Ctrl+Shift+Q',
};

// UI Constants
export const MODAL_WIDTH = 600;
export const PROGRESS_UPDATE_INTERVAL_MS = 500;
export const NOTIFICATION_DURATION_MS = 5000;

export * from './patterns';
