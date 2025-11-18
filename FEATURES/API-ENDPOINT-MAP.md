# API Endpoint Map
## Link Video Transcriber - Complete API Reference

**Last Updated:** 2025-01-18
**Document Version:** 1.0

---

## Table of Contents

1. [RapidAPI Endpoints](#rapidapi-endpoints)
2. [OpenAI Whisper API](#openai-whisper-api)
3. [OpenAI GPT API](#openai-gpt-api)
4. [Google Gemini API](#google-gemini-api)
5. [Anthropic Claude API](#anthropic-claude-api)
6. [Rate Limits & Pricing](#rate-limits--pricing)

---

## RapidAPI Endpoints

### Primary API: Auto Download All In One (FastSaverAPI)

**Provider:** coder2077  
**RapidAPI URL:** https://rapidapi.com/coder2077/api/instagram-tiktok-youtube-downloader  
**Base URL:** `https://instagram-tiktok-youtube-downloader.p.rapidapi.com`

#### Authentication

```http
X-RapidAPI-Key: {your_api_key}
X-RapidAPI-Host: instagram-tiktok-youtube-downloader.p.rapidapi.com
```

#### Endpoint: GET /download

**Description:** Download video/audio from supported platforms

**Request:**
```http
GET /download?url={video_url}&format=mp3&quality=128
```

**Query Parameters:**
- `url` (required): Full video URL
- `format` (optional): `mp3` | `mp4` | `best` (default: `best`)
- `quality` (optional): `128` | `192` | `320` (for audio, default: `128`)

**Example Request:**
```javascript
const options = {
  method: 'GET',
  url: 'https://instagram-tiktok-youtube-downloader.p.rapidapi.com/download',
  params: {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '128'
  },
  headers: {
    'X-RapidAPI-Key': 'YOUR_KEY_HERE',
    'X-RapidAPI-Host': 'instagram-tiktok-youtube-downloader.p.rapidapi.com'
  }
};
```

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "title": "How to Build an Obsidian Plugin",
    "author": "Developer Channel",
    "thumbnail": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
    "duration": 1245,
    "platform": "youtube",
    "download_url": "https://cdn.rapidapi.com/temp/audio_file.mp3",
    "video_url": "https://cdn.rapidapi.com/temp/video_file.mp4",
    "expires_at": "2025-01-18T16:30:00Z",
    "metadata": {
      "description": "Learn how to build your first Obsidian plugin...",
      "upload_date": "2025-01-15",
      "view_count": 15420,
      "likes": 342,
      "channel_id": "UC...",
      "tags": ["obsidian", "plugin", "tutorial"]
    }
  }
}
```

**Error Response (400/404/429):**
```json
{
  "status": "error",
  "error": {
    "code": "VIDEO_UNAVAILABLE",
    "message": "This video is private or has been deleted",
    "details": "The requested video could not be accessed.",
    "retry": false
  }
}
```

**Platform-Specific Responses:**

**Instagram Reel:**
```json
{
  "status": "success",
  "data": {
    "type": "reel",
    "caption": "Check out this amazing tutorial!",
    "username": "tech_creator",
    "download_url": "https://...",
    "thumbnail": "https://...",
    "duration": 42,
    "music": {
      "title": "Background Track",
      "artist": "Artist Name"
    }
  }
}
```

**TikTok Video:**
```json
{
  "status": "success",
  "data": {
    "download_url": "https://.../.mp4",
    "download_url_no_watermark": "https://.../_nw.mp4",
    "music_url": "https://.../audio.mp3",
    "description": "TikTok caption",
    "author": {
      "unique_id": "username",
      "nickname": "Display Name"
    },
    "statistics": {
      "play_count": 1500000,
      "like_count": 45000
    }
  }
}
```

**Rate Limits:**
- **BASIC (Free)**: 100-500 requests/month
- **PRO**: ~5,000 requests/month ($25/mo)
- **ULTRA**: ~25,000 requests/month ($75/mo)
- **MEGA**: ~100,000 requests/month ($150/mo)

---

### Fallback API: All Social Media Video Downloader

**Provider:** keepsaveitapi  
**Base URL:** `https://all-social-media-video-downloader.p.rapidapi.com`

#### Endpoint: POST /api/download

**Request:**
```javascript
{
  method: 'POST',
  url: 'https://all-social-media-video-downloader.p.rapidapi.com/api/download',
  headers: {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': 'YOUR_KEY',
    'X-RapidAPI-Host': 'all-social-media-video-downloader.p.rapidapi.com'
  },
  data: {
    url: 'https://youtube.com/watch?v=...'
  }
}
```

**Response:** Similar format to primary API

---

### Specialized APIs

#### X/Twitter Video Downloader

**Provider:** hyoga  
**Base URL:** `https://x-twitter-video-downloader2.p.rapidapi.com`

**Features:**
- Multiple quality variants
- Stream support
- Enhanced metadata

#### TikTok Video Downloader

**Provider:** elisbushaj2  
**Base URL:** `https://tiktok-video-downloader-api.p.rapidapi.com`

**Features:**
- Guaranteed no-watermark
- Music track extraction
- Enhanced TikTok metadata

---

## OpenAI Whisper API

**Base URL:** `https://api.openai.com/v1`

### Endpoint: POST /audio/transcriptions

**Description:** Transcribe audio to text using Whisper model

**Authentication:**
```http
Authorization: Bearer {your_openai_api_key}
```

**Request:**
```http
POST /audio/transcriptions
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (required): Audio file (< 25MB)
- `model` (required): `whisper-1`
- `language` (optional): ISO 639-1 language code (e.g., `en`, `es`)
- `prompt` (optional): Context to improve accuracy
- `response_format` (optional): `json` | `text` | `srt` | `vtt` | `verbose_json`
- `temperature` (optional): 0-1 (default: 0)

**Example Request:**
```javascript
const formData = new FormData();
formData.append('file', audioFileStream);
formData.append('model', 'whisper-1');
formData.append('language', 'en');
formData.append('response_format', 'verbose_json');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`
  },
  body: formData
});
```

**Success Response (verbose_json):**
```json
{
  "task": "transcribe",
  "language": "english",
  "duration": 1245.67,
  "text": "Welcome to this tutorial on building Obsidian plugins...",
  "segments": [
    {
      "id": 0,
      "seek": 0,
      "start": 0.0,
      "end": 4.5,
      "text": " Welcome to this tutorial on building Obsidian plugins.",
      "tokens": [50364, 2301, 281, 341, 10979, 322, ...],
      "temperature": 0.0,
      "avg_logprob": -0.25,
      "compression_ratio": 1.58,
      "no_speech_prob": 0.001
    }
  ]
}
```

**Text-only Response:**
```
Welcome to this tutorial on building Obsidian plugins. Today we'll cover...
```

**Pricing:**
- $0.006 per minute of audio
- Example: 10-minute video = $0.06
- Example: 60-minute lecture = $0.36

**Rate Limits:**
- 50 requests per minute
- File size limit: 25 MB
- Workaround: Chunk large files

**Supported Languages:** 57 languages including English, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Hindi, Portuguese, Russian, Italian, Dutch, Polish, Turkish, Vietnamese, Swedish, Norwegian, Danish, Finnish, Czech, Greek, Hebrew, Thai, Indonesian, Malay, Romanian, Ukrainian, Bulgarian, Croatian, Serbian, Slovak, Slovenian, Lithuanian, Latvian, Estonian, etc.

---

## OpenAI GPT API

**Base URL:** `https://api.openai.com/v1`

### Endpoint: POST /chat/completions

**Description:** Generate AI summaries and insights from transcripts

**Authentication:**
```http
Authorization: Bearer {your_openai_api_key}
```

**Request:**
```javascript
{
  method: 'POST',
  url: 'https://api.openai.com/v1/chat/completions',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  data: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at analyzing video transcripts...'
      },
      {
        role: 'user',
        content: 'Summarize this transcript: ...'
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  }
}
```

**Models Available:**
- **gpt-4o-mini**: Fast, cost-effective ($0.15/1M input, $0.60/1M output)
- **gpt-4o**: Highest quality ($2.50/1M input, $10/1M output)
- **gpt-4-turbo**: Legacy model

**Success Response:**
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"summary\": \"This video covers...\", \"keyPoints\": [...]}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 3500,
    "completion_tokens": 500,
    "total_tokens": 4000
  }
}
```

**Rate Limits:**
- 10,000 requests per minute (tier 1)
- 30,000 requests per minute (tier 2+)
- 200 requests per day (free tier)

---

## Google Gemini API

**Base URL:** `https://generativelanguage.googleapis.com/v1beta`

### Endpoint: POST /models/{model}:generateContent

**Description:** Generate content with Gemini models

**Authentication:**
```http
x-goog-api-key: {your_gemini_api_key}
```

**Models:**
- `gemini-1.5-flash`: Fast, free tier available
- `gemini-1.5-pro`: Higher quality, 1M token context

**Request:**
```javascript
{
  method: 'POST',
  url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey
  },
  data: {
    contents: [{
      parts: [{
        text: 'Summarize this transcript: ...'
      }]
    }]
  }
}
```

**Success Response:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "This video discusses..."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 3200,
    "candidatesTokenCount": 450,
    "totalTokenCount": 3650
  }
}
```

**Pricing:**
- **gemini-1.5-flash**: FREE (rate limited: 15 RPM, 1M TPM)
- **gemini-1.5-pro**: $1.25/1M input tokens, $5/1M output tokens

**Rate Limits (Free Tier):**
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day

---

## Anthropic Claude API

**Base URL:** `https://api.anthropic.com/v1`

### Endpoint: POST /messages

**Description:** Generate content with Claude models

**Authentication:**
```http
x-api-key: {your_claude_api_key}
anthropic-version: 2023-06-01
```

**Models:**
- `claude-3-haiku-20240307`: Fast, economical
- `claude-3-5-sonnet-20240620`: Balanced quality/speed
- `claude-3-opus-20240229`: Highest quality

**Request:**
```javascript
{
  method: 'POST',
  url: 'https://api.anthropic.com/v1/messages',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  data: {
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: 'Summarize this transcript: ...'
      }
    ]
  }
}
```

**Success Response:**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "This video provides..."
    }
  ],
  "model": "claude-3-5-sonnet-20240620",
  "usage": {
    "input_tokens": 3400,
    "output_tokens": 520
  }
}
```

**Pricing:**
- **Haiku**: $0.25/1M input, $1.25/1M output
- **Sonnet**: $3/1M input, $15/1M output
- **Opus**: $15/1M input, $75/1M output

**Rate Limits:**
- Varies by tier
- Tier 1: 50 requests/minute, 40K tokens/minute
- Tier 2+: Higher limits based on usage

---

## Rate Limits & Pricing Summary

### Monthly Cost Scenarios

**Light User (20 videos/month, 15 min avg):**
- RapidAPI: $0 (free tier)
- Whisper: $1.80
- AI (Gemini Flash): $0
- **Total: ~$2/month**

**Regular User (100 videos/month, 10 min avg):**
- RapidAPI: $25 (PRO)
- Whisper: $6.00
- AI (Gemini Flash): $0
- **Total: ~$31/month**

**Power User (500 videos/month, 20 min avg):**
- RapidAPI: $75 (ULTRA)
- Whisper: $30 (50% local)
- AI (Claude Sonnet): $40
- **Total: ~$145/month**

### Cost Optimization Tips

1. **Use Gemini Flash** for summaries (free)
2. **Local Whisper** for videos > 30 min
3. **Cache** metadata to reduce API calls
4. **Batch process** during off-peak
5. **YouTube subtitles** when available (free)

---

## Error Codes Reference

### RapidAPI Errors
- `400` Bad Request - Invalid URL format
- `401` Unauthorized - Invalid API key
- `403` Forbidden - Private content
- `404` Not Found - Video doesn't exist
- `429` Too Many Requests - Rate limit exceeded
- `451` Unavailable - Geo-restricted
- `500` Internal Server Error - Retry
- `503` Service Unavailable - Temporary outage

### OpenAI Errors
- `invalid_api_key` - Check API key
- `insufficient_quota` - Add payment method
- `rate_limit_exceeded` - Wait and retry
- `context_length_exceeded` - Reduce input size

### Gemini Errors
- `PERMISSION_DENIED` - Invalid API key
- `RESOURCE_EXHAUSTED` - Rate limit
- `INVALID_ARGUMENT` - Check request format

### Claude Errors
- `invalid_api_key` - Check API key
- `overloaded_error` - Retry with backoff
- `rate_limit_error` - Wait before retry

---

## Testing Endpoints

### Recommended Test Videos

**YouTube Short (< 1 min):**
- URL: `https://youtube.com/shorts/dQw4w9WgXcQ`
- Use for quick API tests

**YouTube Standard (5-10 min):**
- URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Use for full workflow testing

**Instagram Reel:**
- Use recent public reel
- Test Instagram-specific metadata

**TikTok:**
- Use trending public video
- Test no-watermark download

---

## API Key Setup Guide

### RapidAPI
1. Visit https://rapidapi.com
2. Create free account
3. Subscribe to "Auto Download All In One"
4. Copy API key from dashboard

### OpenAI
1. Visit https://platform.openai.com
2. Create account, add payment method
3. Generate API key
4. Set usage limits (recommended)

### Gemini
1. Visit https://ai.google.dev
2. Get API key (free tier available)
3. No payment required for free tier

### Claude
1. Visit https://console.anthropic.com
2. Create account, add payment
3. Generate API key
4. Start with tier 1

---

**Document Maintained By:** Development Team
**Next Review:** After Phase 1 implementation
