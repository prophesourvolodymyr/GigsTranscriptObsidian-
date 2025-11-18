# N3 RapidAPI Integration Architecture
## Link Video Transcriber - Technical Documentation

---

## Document Purpose

This N3 document supersedes the N2 White Paper's approach to video extraction. Instead of using local tools like yt-dlp and ffmpeg, the Link Video Transcriber will leverage **RapidAPI's ecosystem** of video downloader APIs. This architectural shift dramatically simplifies deployment, eliminates platform-specific dependencies, and provides unified access to all major social media platforms through a single API marketplace.

This document serves as the **definitive technical architecture reference** for implementation. It contains no code examples except for the Excalidraw integration (the most complex component), focusing instead on architecture, workflows, API specifications, and integration strategies.

---

## Executive Summary: RapidAPI-First Architecture

### The Paradigm Shift

**N2 Approach (Deprecated):**
- Local yt-dlp installation and maintenance
- Platform-specific extraction logic
- FFmpeg dependency for audio processing
- Complex error handling for each platform
- Fragile due to platform API changes

**N3 Approach (Current):**
- ✅ Unified RapidAPI marketplace access
- ✅ Single authentication mechanism (RapidAPI key)
- ✅ Consistent API contracts across platforms
- ✅ Simplified error handling
- ✅ No local binary dependencies
- ✅ Automatic updates handled by API providers
- ✅ Pay-as-you-go scaling

### Core Architecture

```
User Pastes Link
    ↓
Link Detector (Obsidian Plugin)
    ↓
RapidAPI Request Router
    ↓
Platform-Specific API Endpoint
    ↓
Direct Audio/Video URL
    ↓
Audio Download
    ↓
Whisper Transcription (API or Local)
    ↓
AI Processing (OpenAI/Gemini/Claude)
    ↓
Obsidian Note Generation
```

### Why RapidAPI

1. **Unified Access**: Single API key, single billing, single interface for 10+ platforms
2. **Reliability**: Professional APIs with SLAs and uptime guarantees
3. **Maintenance-Free**: No need to update extraction logic when platforms change
4. **Scalability**: Starts free, scales to enterprise without infrastructure changes
5. **Compliance**: APIs handle legal aspects of video downloading
6. **Speed**: Cloud-optimized, faster than local extraction
7. **X/Twitter Support**: 100% reliable, unlike scraping methods

---

## 1. RapidAPI Platform Ecosystem

### 1.1 Available APIs Research Summary

Based on comprehensive market research, the following RapidAPI services provide optimal coverage:

#### Primary API: Auto Download All In One
**Provider:** coder2077 (FastSaverAPI)
**RapidAPI URL:** `https://rapidapi.com/coder2077/api/instagram-tiktok-youtube-downloader`

**Supported Platforms:**
- YouTube (videos, shorts)
- Instagram (Reels, Stories, Posts, IGTV)
- TikTok (videos, no watermark)
- Facebook (public videos)
- Twitter/X (videos, GIFs)
- Pinterest (video pins)
- Snapchat (public stories)
- Threads (videos)
- Likee (videos)

**Key Features:**
- Over 50 Telegram bots already use this API
- High-performance infrastructure
- Returns direct download URLs
- Supports audio extraction
- Metadata included (title, thumbnail, duration, author)
- No watermarks on supported platforms

**API Response Format:**
```json
{
  "status": "success",
  "url": "https://direct-download-url.com/video.mp4",
  "title": "Video Title",
  "thumbnail": "https://thumbnail-url.com/image.jpg",
  "duration": 180,
  "author": "Content Creator Name",
  "platform": "youtube",
  "audio_url": "https://direct-audio-url.com/audio.mp3"
}
```

**Pricing Tiers (Typical RapidAPI Structure):**
- **BASIC**: Free tier with rate limits (e.g., 100 requests/month)
- **PRO**: $25/month (~5,000 requests)
- **ULTRA**: $75/month (~25,000 requests)
- **MEGA**: $150/month (~100,000 requests)

*Note: Actual pricing must be confirmed on the API page*

#### Secondary API: All Social Media Video Downloader
**Provider:** keepsaveitapi
**RapidAPI URL:** `https://rapidapi.com/keepsaveitapi/api/all-social-media-video-downloader`

**Purpose:** Fallback/redundancy for primary API
**Supported Platforms:** Multiple (similar to primary)
**Use Case:** Switch to this if primary API has downtime or rate limiting

#### Platform-Specific APIs (For Enhanced Features)

**X/Twitter Video Downloader**
- **Provider:** hyoga
- **URL:** `https://rapidapi.com/hyoga/api/x-twitter-video-downloader2`
- **Special Features:** Stream support, quality selection
- **Use Case:** When primary API fails for X/Twitter content

**Telegram Stories Downloader**
- **Provider:** uzapishop
- **URL:** `https://rapidapi.com/uzapishop/api/telegram-stories-downloader-api`
- **Special Features:** Telegram-specific content
- **Use Case:** Phase 2/3 Telegram integration

**TikTok Video Downloader**
- **Provider:** elisbushaj2
- **URL:** `https://rapidapi.com/elisbushaj2/api/tiktok-video-downloader-api`
- **Special Features:** No watermark guarantee, music extraction
- **Use Case:** Enhanced TikTok support

### 1.2 API Selection Strategy

**Tier 1 (Primary):** Auto Download All In One
- Handles 90% of use cases
- Most comprehensive platform support
- Best price-to-feature ratio
- Proven reliability (50+ bots in production)

**Tier 2 (Fallback):** All Social Media Video Downloader
- Activates on primary API failure
- Provides redundancy
- Different infrastructure = higher uptime guarantee

**Tier 3 (Specialized):** Platform-specific APIs
- Used for edge cases
- Enhanced metadata
- Platform-specific features (e.g., TikTok music extraction)

**Selection Logic:**
1. Try Primary API
2. If error/rate limit → Try Fallback API
3. If both fail → Try platform-specific API
4. If all fail → Graceful error with user guidance

### 1.3 RapidAPI Authentication & Configuration

**Authentication Method:** API Key Header
**Header Format:**
```
X-RapidAPI-Key: user_api_key_here
X-RapidAPI-Host: api-specific-host.rapidapi.com
```

**Configuration Required in Plugin Settings:**
- Primary RapidAPI Key (required)
- Selected Primary API endpoint
- Enable/disable fallback APIs
- Rate limit awareness settings

**Security Considerations:**
- API keys stored encrypted in Obsidian settings
- Never logged or transmitted except to RapidAPI
- User controls key visibility
- Supports multiple keys for different tier limits

---

## 2. Complete Platform Coverage Analysis

### 2.1 YouTube

**Availability:** ✅ Fully Supported (Primary API + Specialized APIs)
**Confidence Level:** 99%
**Rate Limit Impact:** Low (YouTube content is most requested)

**What Works:**
- Regular videos (all lengths)
- YouTube Shorts
- Unlisted videos (if user has link)
- Age-restricted content (most cases)
- Live stream recordings
- Channel videos
- Playlist videos (individual extraction)

**What Doesn't Work:**
- Private videos (requires authentication)
- DRM-protected premium content
- Active livestreams (not downloadable)
- Deleted videos

**Metadata Available:**
- Video title
- Channel name
- Thumbnail (multiple resolutions)
- Duration
- Upload date
- View count
- Description
- Subtitles/captions (if available)
- Chapter markers (if set by creator)

**Audio Extraction:**
- Direct audio URL provided
- Formats: MP3, M4A, WebM
- Quality: Up to 320kbps
- Optimized for transcription (128kbps default)

**Implementation Notes:**
- YouTube is the highest priority platform
- Cache metadata to reduce API calls
- Support subtitle import as alternative to transcription
- Handle 4K/long videos (>2 hours) gracefully

### 2.2 Instagram

**Availability:** ✅ Fully Supported (Public Content)
**Confidence Level:** 85%
**Rate Limit Impact:** Medium

**Content Types Supported:**
- **Reels** (highest priority) - ✅ Excellent support
- **Posts** (single video posts) - ✅ Full support
- **Stories** (public stories) - ✅ 24-hour window
- **IGTV** (long-form videos) - ✅ Full support
- **Carousel videos** (multi-video posts) - ⚠️ First video only (API limitation)

**What Works:**
- Public profiles
- Public Reels
- Hashtag videos
- Explore page content
- Stories from public accounts (within 24h)

**What Doesn't Work:**
- Private account content (without authentication)
- Stories after 24-hour expiration
- Age-restricted content (some cases)
- Carousel multi-video extraction (API limitation)

**Authentication Options:**
- Phase 1: Public content only (no auth required)
- Phase 2: Optional Instagram login for private content
- Phase 3: Cookie-based session for full access

**Metadata Available:**
- Caption/description
- Author username
- Thumbnail
- Duration
- Like count (if public)
- Post date
- Hashtags
- Location (if tagged)

**Implementation Notes:**
- Prioritize Reels (90% of user requests)
- Clear messaging about private content limitations
- Offer "Request Authentication" for private content
- Cache public content aggressively

### 2.3 X (Twitter)

**Availability:** ✅ 100% Supported via RapidAPI
**Confidence Level:** 95%
**Rate Limit Impact:** Medium-High

**Major Improvement Over N2:**
The N2 approach flagged X/Twitter as "MODERATE-DIFFICULT" due to API costs and scraping fragility. **RapidAPI completely solves this problem** by providing stable, affordable access without scraping.

**What Works:**
- Video tweets (native uploads)
- Quote tweets with video
- Retweets with video
- Multiple videos in single tweet
- GIFs (converted to video)
- Twitter Spaces recordings (some APIs)
- Long-form videos

**What Doesn't Work:**
- Private/protected accounts (without auth)
- Deleted tweets
- Suspended accounts
- Age-restricted content (some cases)

**Quality Options:**
- Multiple quality levels available
- API returns all available variants
- Plugin can select best quality for transcription
- Audio-only extraction supported

**Metadata Available:**
- Tweet text
- Author handle and name
- Timestamp
- Engagement metrics (likes, retweets)
- Thread context (parent tweets)
- Hashtags and mentions

**Special Considerations:**
- X frequently changes policies - RapidAPI APIs adapt automatically
- Some APIs offer streaming instead of download
- Video quality varies (user-uploaded)
- GIFs treated as short videos

**Implementation Priority:** High (requested feature from N2)

### 2.4 TikTok

**Availability:** ✅ Excellent Support
**Confidence Level:** 90%
**Rate Limit Impact:** High (popular platform)

**Why TikTok Support Matters:**
- Massive educational content on TikTok
- Short-form video perfect for transcription
- Growing use in academic/professional contexts
- High user demand

**What Works:**
- Regular TikTok videos
- No watermark download
- Audio extraction (including music)
- Slideshow videos (image compilations)
- Duets and stitches
- Long-form videos (TikTok extended duration)

**What Doesn't Work:**
- Private account videos
- Age-restricted content
- Region-locked content (some cases)
- Deleted videos
- Live streams (not downloadable)

**Unique Features:**
- Watermark-free download
- Separate music track extraction
- High-quality video (up to 1080p)
- Author info and metrics

**Metadata Available:**
- Video description
- Author username and display name
- Music/sound information
- Hashtags
- Duration
- Engagement metrics
- Upload date

**Implementation Notes:**
- TikTok videos are short (15-180 seconds typically)
- Ideal for quick transcriptions
- Music track may interfere with transcription accuracy
- Consider offering music removal option

### 2.5 Facebook

**Availability:** ⚠️ Partial Support (Public Only)
**Confidence Level:** 70%
**Rate Limit Impact:** Medium

**What Works:**
- Public page videos
- Public profile videos
- Public group videos
- Watch videos (public)
- Reels (public)

**What Doesn't Work:**
- Private profile content
- Closed/secret group videos
- Age-restricted content
- Geo-blocked content
- Watch party content
- Live videos during stream

**Authentication Challenge:**
- Facebook heavily restricts content access
- API methods work better than scraping
- May require Facebook login for full access
- Complex permission model

**Implementation Strategy:**
- Phase 1: Public content only
- Phase 2: Optional Facebook authentication
- Clear user messaging about limitations
- Redirect to Facebook if content inaccessible

### 2.6 Telegram

**Availability:** ⚠️ Limited Support
**Confidence Level:** 60%
**Rate Limit Impact:** Low (niche use case)

**RapidAPI Telegram Solutions:**

**Telegram Stories Downloader API:**
- Specializes in Telegram stories
- Public channel support
- Limited private content access

**Telegram Media Downloader (Apify alternative):**
- Bulk download capability
- Channel message extraction
- Group content access (with membership)

**What Works:**
- Public channel videos
- Public group videos
- Forwarded videos (if from public source)
- Bot-shared content
- Stories from public profiles

**What Doesn't Work:**
- Private chat media (privacy-protected)
- Encrypted chat media
- Self-destructing media
- DRM-protected content

**Implementation Recommendation:**
- **Phase 1:** Exclude Telegram (too complex)
- **Phase 2:** Public channels only
- **Phase 3:** Experimental full support with user authentication
- Documentation: Clear explanation of Telegram limitations

**Alternative Approach:**
Allow users to manually download Telegram video and drag-drop into Obsidian, then trigger transcription on local file.

### 2.7 Additional Platforms (Bonus Support)

**Pinterest:**
- ✅ Supported by primary API
- Video pins downloadable
- Idea pins with video
- Low demand but easy to include

**Snapchat:**
- ⚠️ Public stories only
- Spotlight videos
- Limited API support
- Phase 2 feature

**Threads (Meta):**
- ✅ Supported by primary API
- Video posts
- Similar to Twitter/Instagram hybrid
- Emerging platform

**Likee:**
- ✅ Supported by some APIs
- Similar to TikTok
- Niche platform

**Vimeo:**
- ⚠️ May require separate API
- Professional video hosting
- Often has download restrictions
- Phase 3 consideration

**Dailymotion:**
- ⚠️ Separate API needed
- Less common
- Phase 3 consideration

### 2.8 Platform Priority Matrix

| Platform | Phase 1 (MVP) | Phase 2 | Phase 3 | User Demand | Technical Ease |
|----------|---------------|---------|---------|-------------|----------------|
| YouTube | ✅ Must-Have | - | - | ⭐⭐⭐⭐⭐ | ✅ Easy |
| Instagram | ✅ Must-Have | Enhanced | - | ⭐⭐⭐⭐ | ✅ Easy |
| X/Twitter | ✅ Must-Have | - | - | ⭐⭐⭐⭐ | ✅ Easy |
| TikTok | ✅ Must-Have | Enhanced | - | ⭐⭐⭐⭐ | ✅ Easy |
| Facebook | - | ✅ Public Only | Full Auth | ⭐⭐⭐ | ⚠️ Medium |
| Telegram | - | - | ✅ Experimental | ⭐⭐ | ❌ Hard |
| Pinterest | ✅ Bonus | - | - | ⭐ | ✅ Easy |
| Threads | ✅ Bonus | - | - | ⭐⭐ | ✅ Easy |
| Snapchat | - | ✅ Stories | - | ⭐ | ⚠️ Medium |
| Vimeo | - | - | ✅ Add | ⭐⭐ | ⚠️ Medium |

**Phase 1 Target:** YouTube + Instagram + X/Twitter + TikTok = 95% of use cases

---

## 3. System Architecture & Data Flow

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        OBSIDIAN VAULT                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Markdown    │  │    Canvas    │  │  Excalidraw  │          │
│  │    Files     │  │    Boards    │  │   Drawings   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                   │
│                            │                                       │
│                    ┌───────▼────────┐                            │
│                    │ Link Detector  │                            │
│                    │   Component    │                            │
│                    └───────┬────────┘                            │
│                            │                                       │
└────────────────────────────┼───────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   URL Parser &   │
                    │ Platform Router  │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │YouTube  │        │Instagram│        │    X    │
    │  API    │        │   API   │        │   API   │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   RapidAPI Hub   │
                    │  (Unified Auth)  │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ Metadata│        │ Video   │        │  Audio  │
    │Extractor│        │Download │        │Extract  │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                    ┌────────▼─────────┐
                    │ Transcription    │
                    │   Orchestrator   │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
          ┌──────▼──────┐         ┌─────▼──────┐
          │Whisper API  │         │   Local    │
          │(OpenAI)     │         │  Whisper   │
          └──────┬──────┘         └─────┬──────┘
                 │                       │
                 └───────────┬───────────┘
                             │
                    ┌────────▼─────────┐
                    │  Transcript      │
                    │  Post-Processor  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  AI Processing   │
                    │   (Optional)     │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
          ┌──────▼──────┐    ┌──────────▼────────┐
          │   OpenAI    │    │  Gemini / Claude  │
          │  Summary    │    │     Summary       │
          └──────┬──────┘    └──────────┬────────┘
                 │                       │
                 └───────────┬───────────┘
                             │
                    ┌────────▼─────────┐
                    │  Note Generator  │
                    │   (Templates)    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Note Organizer  │
                    │ (Tags, Folders)  │
                    └────────┬─────────┘
                             │
┌────────────────────────────┼───────────────────────────────────┐
│                    ┌───────▼────────┐                          │
│                    │  Create Note   │                          │
│                    │   in Vault     │                          │
│                    └────────────────┘                          │
│                     OBSIDIAN VAULT                             │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

#### Link Detector Component
**Purpose:** Identify video links across all Obsidian contexts
**Inputs:** Pasted text, opened files, canvas nodes, Excalidraw elements
**Outputs:** Detected video links with platform identification
**Triggers:** Paste event, file open, canvas update, Excalidraw change

#### URL Parser & Platform Router
**Purpose:** Analyze URLs and route to correct API
**Inputs:** Raw video URLs
**Outputs:** Platform type, video ID, routing decision
**Logic:**
- Regex pattern matching for each platform
- Fallback detection for shortened URLs
- Multi-platform link handling
- Invalid URL rejection

#### RapidAPI Hub
**Purpose:** Unified API request management
**Functions:**
- Authentication injection
- Request queuing
- Rate limit management
- Error handling and retries
- Fallback API switching
- Response normalization

#### Metadata Extractor
**Purpose:** Parse API responses into standardized format
**Outputs:**
```
{
  platform: string,
  title: string,
  author: string,
  duration: number,
  thumbnail: string,
  description: string,
  uploadDate: string,
  videoUrl: string,
  audioUrl: string,
  metadata: object
}
```

#### Transcription Orchestrator
**Purpose:** Manage transcription workflow
**Functions:**
- Audio download management
- Whisper API vs Local decision
- Chunking for large files
- Progress tracking
- Error recovery

#### AI Processing
**Purpose:** Generate summaries and insights
**Functions:**
- Provider selection (OpenAI/Gemini/Claude)
- Summary generation
- Key point extraction
- Chapter detection
- Question generation

#### Note Generator
**Purpose:** Create formatted Obsidian notes
**Functions:**
- Template rendering
- Metadata injection
- Link formatting
- Tag generation
- Folder organization

### 3.3 Data Flow Sequences

#### Sequence 1: Simple YouTube Video Transcription

```
1. User pastes YouTube link in markdown file
2. Link Detector catches paste event
3. Regex identifies YouTube pattern
4. Confirmation modal appears
5. User confirms → Process initiated
6. RapidAPI request sent with YouTube URL
7. API returns metadata + audio URL
8. Audio file downloaded to temp directory
9. Whisper API called with audio file
10. Transcript received
11. (Optional) AI summary generated
12. Note template rendered
13. Note created in vault
14. Original file updated with link to transcript note
15. User notified of completion
16. Temp files cleaned up
```

**Timeline:** ~30-90 seconds for 10-minute video

#### Sequence 2: Instagram Reel with Local Whisper

```
1. User pastes Instagram Reel link
2. Link Detector identifies Instagram
3. Platform router selects Instagram API endpoint
4. RapidAPI request sent
5. API returns Reel metadata + video URL
6. Video downloaded, audio extracted
7. Audio quality checked (sufficient for transcription)
8. Local Whisper selected (privacy mode enabled)
9. Local Whisper transcription initiated
10. Progress tracked (slower than API)
11. Transcript received after processing
12. AI processing skipped (user preference)
13. Note generated with transcript only
14. Note created and opened
15. User reviews transcript
16. Temp files deleted
```

**Timeline:** ~2-5 minutes for 30-second Reel (local processing slower)

#### Sequence 3: X/Twitter Thread with Multiple Videos

```
1. User pastes three different tweet links
2. Link Detector identifies all three
3. Modal shows: "3 videos detected - transcribe all?"
4. User confirms batch processing
5. Queue created with 3 items
6. First tweet processed:
   - RapidAPI request
   - Metadata extraction
   - Audio download
   - Transcription
   - Note creation
7. Second tweet processed (parallel if API limits allow)
8. Third tweet processed
9. (Optional) Create thread summary note linking all three
10. User notified: "3 transcripts created"
11. Cleanup
```

**Timeline:** ~2-4 minutes for three short videos

#### Sequence 4: Error Recovery Flow

```
1. User pastes TikTok link
2. Link Detector identifies TikTok
3. RapidAPI request sent to primary API
4. PRIMARY API FAILS (rate limit exceeded)
5. System detects error
6. Fallback API attempted
7. Fallback API succeeds
8. Processing continues normally
9. User sees brief notice: "Using backup service"
10. Transcript completed
11. Note created with warning: "Primary API rate limited - consider upgrading plan"
```

**Timeline:** +10-20 seconds for fallback attempt

---

## 4. RapidAPI Integration Specifications

### 4.1 Request/Response Formats

#### Standard Request Pattern

**Endpoint Structure:**
```
POST https://{api-host}.rapidapi.com/download
```

**Headers:**
```
X-RapidAPI-Key: {user_api_key}
X-RapidAPI-Host: {api-host}.rapidapi.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://youtube.com/watch?v=VIDEO_ID",
  "format": "mp3",
  "quality": "128"
}
```

**Alternative Query Parameter Method:**
```
GET https://{api-host}.rapidapi.com/download?url={encoded_url}&format=mp3
```

#### Standard Response Format

**Success Response:**
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
    "expires_at": "2025-01-18T10:30:00Z",
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

**Error Response:**
```json
{
  "status": "error",
  "error": {
    "code": "VIDEO_UNAVAILABLE",
    "message": "This video is private or has been deleted",
    "details": "The requested video could not be accessed. Please check the URL and try again.",
    "retry": false
  }
}
```

#### Platform-Specific Variations

**Instagram Response:**
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

**TikTok Response:**
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

### 4.2 Error Handling Matrix

| Error Type | API Error Code | Plugin Action | User Message |
|------------|----------------|---------------|--------------|
| Rate Limit Exceeded | 429 | Switch to fallback API | "Rate limit reached, using backup service" |
| Invalid URL | 400 | Validate URL format | "Invalid video URL. Please check and try again." |
| Video Unavailable | 404 | Check platform directly | "Video not found. It may be private or deleted." |
| Private Content | 403 | Offer authentication | "This content is private. Enable authentication in settings?" |
| Geographic Restriction | 451 | Notify user | "This video is not available in your region." |
| Authentication Failed | 401 | Check API key | "RapidAPI key invalid. Please update in settings." |
| Service Unavailable | 503 | Retry with exponential backoff | "Service temporarily unavailable. Retrying..." |
| Timeout | 504 | Retry once, then fail | "Request timed out. Please try again." |
| Unknown Error | 500 | Log and report | "An unexpected error occurred. Please try again later." |

### 4.3 Rate Limiting Strategy

**User Awareness:**
- Display current API usage in settings
- Show remaining requests for current billing period
- Warning at 80% usage
- Block requests at 100% with upgrade prompt

**Technical Implementation:**
- Local rate limit counter (synced with API)
- Request queue with priority system
- Batch request optimization
- Cache responses to minimize API calls

**Optimization Techniques:**
1. **Metadata Caching:** Store video metadata for 7 days
2. **Duplicate Detection:** Warn user if video already transcribed
3. **Batch Processing:** Allow user to queue multiple videos, process during off-peak
4. **Smart Fallback:** Use cheaper APIs for simple metadata requests

### 4.4 API Response Normalization

**Purpose:** Different APIs return different formats - normalize to single schema

**Normalized Format:**
```typescript
interface NormalizedVideoData {
  platform: VideoPlatform;

  // Core fields (required)
  title: string;
  downloadUrl: string;
  audioUrl?: string;
  duration: number;

  // Metadata (optional but recommended)
  author: string;
  authorId?: string;
  thumbnail: string;
  description?: string;
  uploadDate?: string;

  // Platform-specific
  platformMetadata: {
    [key: string]: any;
  };

  // Internal
  apiSource: string; // Which API provided this data
  retrievedAt: Date;
  expiresAt?: Date; // Download URL expiration
}
```

**Normalization Rules:**
- Missing fields → `undefined` (not null or empty string)
- Date formats → ISO 8601
- Duration → seconds (integer)
- URLs → absolute, validated
- Platform names → lowercase, standardized

---

## 5. Excalidraw Integration (Complex Implementation)

### 5.1 Why Excalidraw is Complex

Unlike markdown (plain text) and Canvas (JSON with accessible API), **Excalidraw presents unique challenges:**

1. **Data Format:** Excalidraw drawings are stored as JSON within markdown code blocks
2. **Plugin Dependency:** Requires Excalidraw plugin to be installed
3. **Element Detection:** Must parse drawing elements to find text containing URLs
4. **UI Integration:** Adding buttons/indicators to specific drawing elements
5. **Real-time Updates:** Detecting changes in active drawings
6. **Coordinate System:** Positioning UI elements in Excalidraw's canvas space

### 5.2 Excalidraw Data Structure

**File Format:**
```markdown
# Drawing Title

Regular markdown content here...

## Excalidraw Data

excalidraw-plugin: parsed
tags: [excalidraw]

\`\`\`json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "element_id_123",
      "type": "text",
      "x": 100,
      "y": 200,
      "width": 300,
      "height": 50,
      "text": "Check this video: https://youtube.com/watch?v=abc123",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top"
    },
    {
      "id": "element_id_456",
      "type": "rectangle",
      "x": 50,
      "y": 150,
      "width": 400,
      "height": 100
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff"
  }
}
\`\`\`

%%
# Drawing Data
\`\`\`compressed-json
[compressed drawing data]
\`\`\`
%%
```

### 5.3 Detection Strategy

**Approach 1: Passive File Scanning**
- Scan Excalidraw files when opened
- Parse JSON data
- Extract text elements
- Search for video URLs
- Store detected links for user action

**Approach 2: Active Drawing Monitoring (Complex)**
- Hook into Excalidraw plugin events
- Monitor real-time element additions
- Detect paste events in text elements
- Immediate URL detection and prompt

**Recommended for V1:** Approach 1 (Passive)
**Future Enhancement:** Approach 2 (Active)

### 5.4 Implementation Code (The Only Code in N3)

This is the most complex part of the system, requiring deep integration with Excalidraw's plugin API.

```typescript
/**
 * Excalidraw Integration Module
 * Handles video link detection within Excalidraw drawings
 */

import { TFile, Plugin } from 'obsidian';
import { ExcalidrawElement, ExcalidrawTextElement } from '@zsviczian/obsidian-excalidraw-plugin/ExcalidrawAutomate';

interface ExcalidrawData {
  type: string;
  version: number;
  source: string;
  elements: ExcalidrawElement[];
  appState: any;
}

interface DetectedVideoLink {
  url: string;
  platform: string;
  elementId: string;
  elementText: string;
  position: { x: number; y: number };
  filePathassword: string;
}

export class ExcalidrawVideoDetector {
  private plugin: Plugin;
  private excalidrawPlugin: any;
  private detectedLinks: Map<string, DetectedVideoLink[]> = new Map();

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  /**
   * Initialize Excalidraw integration
   * Checks if Excalidraw plugin is installed and available
   */
  async initialize(): Promise<boolean> {
    // Wait for Excalidraw plugin to load
    await this.waitForExcalidrawPlugin();

    if (!this.excalidrawPlugin) {
      console.warn('Excalidraw plugin not found - Excalidraw integration disabled');
      return false;
    }

    // Register event listeners
    this.registerExcalidrawEvents();

    return true;
  }

  /**
   * Wait for Excalidraw plugin to be available
   */
  private async waitForExcalidrawPlugin(maxWait: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      // @ts-ignore - Excalidraw plugin may not have types
      this.excalidrawPlugin = this.plugin.app.plugins.plugins['obsidian-excalidraw-plugin'];

      if (this.excalidrawPlugin) {
        console.log('Excalidraw plugin detected');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Register event listeners for Excalidraw files
   */
  private registerExcalidrawEvents(): void {
    // Listen for file opens
    this.plugin.registerEvent(
      this.plugin.app.workspace.on('file-open', async (file: TFile) => {
        if (file && this.isExcalidrawFile(file)) {
          await this.scanExcalidrawFile(file);
        }
      })
    );

    // Listen for file modifications
    this.plugin.registerEvent(
      this.plugin.app.vault.on('modify', async (file: TFile) => {
        if (this.isExcalidrawFile(file)) {
          await this.scanExcalidrawFile(file);
        }
      })
    );
  }

  /**
   * Check if file is an Excalidraw drawing
   */
  private isExcalidrawFile(file: TFile): boolean {
    if (!file) return false;

    // Check file extension
    if (file.extension === 'excalidraw') return true;

    // Check frontmatter for excalidraw-plugin tag
    const cache = this.plugin.app.metadataCache.getFileCache(file);
    if (cache?.frontmatter?.['excalidraw-plugin']) return true;

    return false;
  }

  /**
   * Scan an Excalidraw file for video links
   */
  async scanExcalidrawFile(file: TFile): Promise<DetectedVideoLink[]> {
    try {
      const content = await this.plugin.app.vault.read(file);
      const drawingData = this.parseExcalidrawData(content);

      if (!drawingData) {
        return [];
      }

      const links = this.extractLinksFromElements(drawingData.elements, file.path);

      // Store detected links
      if (links.length > 0) {
        this.detectedLinks.set(file.path, links);
        await this.showDetectionNotification(file, links);
      }

      return links;
    } catch (error) {
      console.error('Error scanning Excalidraw file:', error);
      return [];
    }
  }

  /**
   * Parse Excalidraw JSON data from file content
   */
  private parseExcalidrawData(content: string): ExcalidrawData | null {
    try {
      // Extract JSON from code block
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) return null;

      const data = JSON.parse(jsonMatch[1]);

      // Validate structure
      if (data.type !== 'excalidraw' || !Array.isArray(data.elements)) {
        return null;
      }

      return data as ExcalidrawData;
    } catch (error) {
      console.error('Failed to parse Excalidraw data:', error);
      return null;
    }
  }

  /**
   * Extract video links from Excalidraw elements
   */
  private extractLinksFromElements(
    elements: ExcalidrawElement[],
    filePath: string
  ): DetectedVideoLink[] {
    const links: DetectedVideoLink[] = [];

    // URL patterns for video platforms
    const patterns = {
      youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
      instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(reel|p)\/([a-zA-Z0-9_-]+)/g,
      twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/g,
      tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/g,
    };

    for (const element of elements) {
      // Only process text elements
      if (element.type !== 'text') continue;

      const textElement = element as ExcalidrawTextElement;
      const text = textElement.text || '';

      // Search for each platform pattern
      for (const [platform, pattern] of Object.entries(patterns)) {
        pattern.lastIndex = 0; // Reset regex
        let match;

        while ((match = pattern.exec(text)) !== null) {
          links.push({
            url: match[0],
            platform: platform,
            elementId: element.id,
            elementText: text,
            position: { x: element.x, y: element.y },
            filePath: filePath
          });
        }
      }
    }

    return links;
  }

  /**
   * Show notification when links are detected
   */
  private async showDetectionNotification(
    file: TFile,
    links: DetectedVideoLink[]
  ): Promise<void> {
    const count = links.length;
    const platforms = [...new Set(links.map(l => l.platform))].join(', ');

    // Create notification with action buttons
    const notice = new Notice(
      `Found ${count} video link${count > 1 ? 's' : ''} (${platforms}) in ${file.name}`,
      10000
    );

    // Add transcribe button to notice (if Obsidian supports interactive notices)
    // Alternative: Show modal with link list and transcribe buttons
    await this.showTranscribeModal(file, links);
  }

  /**
   * Show modal with detected links and transcribe options
   */
  private async showTranscribeModal(
    file: TFile,
    links: DetectedVideoLink[]
  ): Promise<void> {
    const { ExcalidrawLinkModal } = await import('./ExcalidrawLinkModal');

    const modal = new ExcalidrawLinkModal(
      this.plugin.app,
      links,
      async (selectedLinks: DetectedVideoLink[]) => {
        // Trigger transcription for selected links
        for (const link of selectedLinks) {
          await this.plugin.transcribeVideoLink(link.url, {
            source: 'excalidraw',
            sourceFile: file.path,
            elementId: link.elementId
          });
        }
      }
    );

    modal.open();
  }

  /**
   * Add visual indicator to Excalidraw element (Advanced)
   * This requires deep integration with Excalidraw's rendering
   */
  async addTranscribeIndicator(
    filePath: string,
    elementId: string
  ): Promise<void> {
    if (!this.excalidrawPlugin) return;

    try {
      // Get Excalidraw API
      const excalidrawAPI = this.excalidrawPlugin.excalidrawAPI;
      if (!excalidrawAPI) return;

      // Get current view
      const view = this.plugin.app.workspace.getActiveViewOfType(ExcalidrawView);
      if (!view || view.file?.path !== filePath) return;

      // Add a small icon/indicator near the element
      // This is pseudo-code - actual implementation depends on Excalidraw API
      const element = excalidrawAPI.getElement(elementId);
      if (element) {
        // Create indicator element (e.g., small icon)
        const indicator = {
          type: 'image',
          x: element.x + element.width + 10,
          y: element.y,
          width: 20,
          height: 20,
          fileId: 'transcribe-icon',
          // Metadata to identify this as our indicator
          customData: {
            type: 'video-transcribe-indicator',
            targetElement: elementId
          }
        };

        excalidrawAPI.addElement(indicator);
      }
    } catch (error) {
      console.error('Failed to add Excalidraw indicator:', error);
    }
  }

  /**
   * Get detected links for a specific file
   */
  getDetectedLinks(filePath: string): DetectedVideoLink[] {
    return this.detectedLinks.get(filePath) || [];
  }

  /**
   * Clear detected links cache
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      this.detectedLinks.delete(filePath);
    } else {
      this.detectedLinks.clear();
    }
  }
}

/**
 * Modal for displaying detected links and transcription options
 */
export class ExcalidrawLinkModal extends Modal {
  private links: DetectedVideoLink[];
  private onConfirm: (selected: DetectedVideoLink[]) => Promise<void>;
  private selectedLinks: Set<string> = new Set();

  constructor(
    app: App,
    links: DetectedVideoLink[],
    onConfirm: (selected: DetectedVideoLink[]) => Promise<void>
  ) {
    super(app);
    this.links = links;
    this.onConfirm = onConfirm;

    // Select all by default
    links.forEach(link => this.selectedLinks.add(link.url));
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Video Links Detected in Drawing' });

    contentEl.createEl('p', {
      text: `Found ${this.links.length} video link${this.links.length > 1 ? 's' : ''} in your Excalidraw drawing. Select which ones to transcribe:`
    });

    // Create link list
    const linkList = contentEl.createDiv('excalidraw-link-list');

    for (const link of this.links) {
      const linkItem = linkList.createDiv('link-item');

      // Checkbox
      const checkbox = linkItem.createEl('input', { type: 'checkbox' });
      checkbox.checked = this.selectedLinks.has(link.url);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.selectedLinks.add(link.url);
        } else {
          this.selectedLinks.delete(link.url);
        }
      });

      // Platform icon/badge
      const platformBadge = linkItem.createSpan({ cls: 'platform-badge' });
      platformBadge.textContent = link.platform.toUpperCase();
      platformBadge.style.backgroundColor = this.getPlatformColor(link.platform);

      // URL preview
      const urlPreview = linkItem.createDiv('url-preview');
      urlPreview.textContent = this.truncateUrl(link.url);
      urlPreview.title = link.url;

      // Element context
      const context = linkItem.createDiv('element-context');
      context.textContent = `From text: "${this.truncateText(link.elementText)}"`;
      context.style.fontSize = '0.9em';
      context.style.color = 'var(--text-muted)';
    }

    // Action buttons
    const buttonContainer = contentEl.createDiv('button-container');

    const transcribeButton = buttonContainer.createEl('button', {
      text: `Transcribe Selected (${this.selectedLinks.size})`,
      cls: 'mod-cta'
    });
    transcribeButton.onclick = async () => {
      const selected = this.links.filter(link => this.selectedLinks.has(link.url));
      await this.onConfirm(selected);
      this.close();
    };

    const cancelButton = buttonContainer.createEl('button', {
      text: 'Cancel'
    });
    cancelButton.onclick = () => this.close();
  }

  private getPlatformColor(platform: string): string {
    const colors = {
      youtube: '#FF0000',
      instagram: '#E4405F',
      twitter: '#1DA1F2',
      tiktok: '#000000',
      facebook: '#1877F2'
    };
    return colors[platform] || '#888888';
  }

  private truncateUrl(url: string, maxLength: number = 50): string {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  }

  private truncateText(text: string, maxLength: number = 60): string {
    const cleaned = text.replace(/\n/g, ' ').trim();
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
  }
}
```

### 5.5 Excalidraw Integration Workflow

**User Workflow:**
1. User creates Excalidraw drawing
2. Adds text element with video URL
3. Plugin detects URL when file is saved/modified
4. Modal appears: "Video links detected"
5. User selects links to transcribe
6. Transcription proceeds normally
7. Transcript note is created
8. (Optional) Add link back to Excalidraw drawing

**Technical Workflow:**
1. File modification event triggered
2. Check if file is Excalidraw type
3. Parse JSON from markdown code block
4. Iterate through `elements` array
5. Filter for `type: "text"` elements
6. Run regex patterns on text content
7. Collect matches with element metadata
8. Cache detected links
9. Show user notification/modal
10. Await user selection
11. Trigger transcription for selected links

### 5.6 Excalidraw Limitations & Workarounds

**Limitations:**
- **No Real-Time Detection:** Must save file to trigger detection
- **No Direct UI Integration:** Cannot add clickable buttons within drawing
- **Coordinate Complexity:** Positioning indicators requires calculation
- **Plugin Dependency:** Requires Excalidraw plugin installed

**Workarounds:**
- **Periodic Scanning:** Scan active drawing every 30 seconds (configurable)
- **Sidebar Panel:** Show detected links in Obsidian sidebar instead of in-drawing UI
- **Ribbon Icon:** Add "Scan Current Drawing" command
- **Auto-Scan Toggle:** User can enable/disable automatic scanning

**Phase 1 Implementation:**
- Passive scanning on file open/save
- Modal-based link selection
- No visual indicators within drawing

**Phase 2 Enhancement:**
- Active monitoring with polling
- Sidebar panel with live link list
- Visual indicators (if Excalidraw API allows)

**Phase 3 Advanced:**
- Deep Excalidraw API integration
- In-drawing UI elements
- Right-click context menu on text elements

---

## 6. Cost Analysis & Pricing Strategy

### 6.1 API Cost Breakdown

**RapidAPI Typical Pricing (per API):**

| Tier | Monthly Cost | Requests/Month | Cost per Request | Best For |
|------|--------------|----------------|------------------|----------|
| BASIC | $0 | 100-500 | $0 | Personal testing |
| PRO | $25 | 5,000-10,000 | $0.0025-$0.005 | Individual users |
| ULTRA | $75 | 25,000-50,000 | $0.0015-$0.003 | Power users |
| MEGA | $150 | 100,000+ | $0.0015 or less | Teams/heavy use |

**Whisper API Pricing (OpenAI):**
- **Cost:** $0.006 per minute of audio
- **Example:** 10-minute video = $0.06
- **Example:** 60-minute lecture = $0.36
- **Example:** 100 videos/month (avg 15 min) = $9.00

**AI Processing Costs (per video):**

| Provider | Model | Input Cost | Output Cost | Summary Cost (est.) |
|----------|-------|------------|-------------|---------------------|
| OpenAI | GPT-4o-mini | $0.15/1M tokens | $0.60/1M tokens | $0.005-$0.02 |
| OpenAI | GPT-4o | $2.50/1M tokens | $10/1M tokens | $0.05-$0.15 |
| Google | Gemini Flash | Free (rate limited) | Free | $0 |
| Google | Gemini Pro | $1.25/1M tokens | $5/1M tokens | $0.01-$0.05 |
| Anthropic | Claude Haiku | $0.25/1M tokens | $1.25/1M tokens | $0.002-$0.01 |
| Anthropic | Claude Sonnet | $3/1M tokens | $15/1M tokens | $0.05-$0.20 |

### 6.2 User Cost Scenarios

**Scenario 1: Light User (Student)**
- **Usage:** 20 videos/month, avg 15 minutes each
- **Platform:** YouTube, Instagram
- **Processing:** Whisper API + GPT-4o-mini

**Monthly Costs:**
- RapidAPI: $0 (BASIC tier sufficient)
- Whisper: 20 × 15 min × $0.006 = $1.80
- AI Summary: 20 × $0.01 = $0.20
- **Total: ~$2.00/month**

**Scenario 2: Regular User (Content Curator)**
- **Usage:** 100 videos/month, avg 10 minutes each
- **Platform:** All supported platforms
- **Processing:** Whisper API + Gemini Flash (free)

**Monthly Costs:**
- RapidAPI: $25 (PRO tier needed)
- Whisper: 100 × 10 min × $0.006 = $6.00
- AI Summary: $0 (Gemini Flash free tier)
- **Total: ~$31/month**

**Scenario 3: Power User (Researcher)**
- **Usage:** 500 videos/month, avg 20 minutes each
- **Platform:** All platforms + Telegram experimental
- **Processing:** Mix of API and Local Whisper + Claude Sonnet

**Monthly Costs:**
- RapidAPI: $75 (ULTRA tier)
- Whisper: 250 × 20 min × $0.006 = $30 (50% use local to save costs)
- AI Summary: 500 × $0.08 = $40
- **Total: ~$145/month**

**Cost Reduction with Local Whisper:**
- 500 videos × 20 min × $0.006 = $60 saved
- Tradeoff: Slower processing, requires local compute

**Scenario 4: Enterprise/Team (Media Company)**
- **Usage:** 2,000 videos/month, avg 30 minutes each
- **Platform:** All platforms
- **Processing:** Local Whisper for privacy + GPT-4o for quality

**Monthly Costs:**
- RapidAPI: $150 (MEGA tier)
- Whisper: $0 (100% local)
- AI Summary: 2,000 × $0.10 = $200
- **Total: ~$350/month**

### 6.3 Cost Optimization Strategies

**For Plugin Users:**

1. **Hybrid Approach:**
   - Short videos (< 5 min): Whisper API (fast)
   - Long videos (> 30 min): Local Whisper (economical)
   - Automatic switching saves 40-60% on transcription

2. **Selective AI Processing:**
   - Only summarize videos you'll reference later
   - Skip AI for quick transcripts
   - Use free Gemini Flash for casual summaries

3. **Cache Aggressively:**
   - Store video metadata for 30 days
   - Detect duplicate transcription requests
   - Reuse existing transcripts when possible

4. **Batch Processing:**
   - Queue videos during the day
   - Process overnight during free/off-peak hours
   - Reduce rate limit overage charges

5. **Platform Awareness:**
   - YouTube has free captions (use as alternative)
   - Instagram/TikTok videos are typically short (cheaper)
   - Telegram requires premium API (evaluate necessity)

**For Plugin Developer:**

1. **API Key Pooling (Advanced):**
   - Offer managed API service
   - Pool user requests
   - Negotiate bulk pricing with RapidAPI
   - Pass savings to users

2. **Freemium Model:**
   - Bundle basic RapidAPI access
   - User brings own Whisper API key
   - Premium tier: managed service with higher limits

3. **Partnership Opportunities:**
   - Partner with RapidAPI for referral commission
   - Negotiate dedicated API tier for plugin users
   - Bulk licensing for educational institutions

### 6.4 Pricing Recommendations for Users

**Recommended Tiers:**

| User Type | RapidAPI Tier | Whisper Method | AI Provider | Monthly Budget |
|-----------|---------------|----------------|-------------|----------------|
| Student | BASIC (Free) | Local or API | Gemini Flash | $0-$5 |
| Individual | PRO ($25) | API | GPT-4o-mini | $30-$50 |
| Professional | ULTRA ($75) | Hybrid | Claude Haiku | $80-$120 |
| Team/Enterprise | MEGA ($150) | Local | GPT-4o | $200-$500 |

**Cost-Benefit Analysis:**
- **Time Saved:** 30 min manual transcription per 10-min video
- **Value Created:** Searchable knowledge base
- **ROI:** If time worth > $20/hour, plugin pays for itself with 5 videos/month

---

## 7. Implementation Roadmap (Revised for RapidAPI)

### 7.1 Phase 1: MVP (4-6 Weeks)

**Goal:** Core functionality with YouTube, Instagram, X/Twitter, TikTok

**Week 1-2: Foundation**
- [ ] Set up Obsidian plugin boilerplate
- [ ] Implement RapidAPI authentication system
- [ ] Create settings panel with API key configuration
- [ ] Build URL detector for markdown files
- [ ] Implement platform regex patterns

**Week 3-4: Video Extraction**
- [ ] Integrate primary RapidAPI (Auto Download All In One)
- [ ] Implement request/response handling
- [ ] Build metadata extraction and normalization
- [ ] Add error handling and retry logic
- [ ] Create download manager for audio files

**Week 5-6: Transcription & Notes**
- [ ] Integrate Whisper API (OpenAI)
- [ ] Implement audio processing pipeline
- [ ] Build note template system
- [ ] Create note generator with metadata
- [ ] Add progress tracking UI
- [ ] Implement basic testing

**Deliverable:** Working plugin for YouTube + Instagram + X + TikTok with Whisper API transcription

### 7.2 Phase 2: Enhancement (4-6 Weeks)

**Week 7-8: Multi-Provider**
- [ ] Add fallback API support
- [ ] Implement API switching logic
- [ ] Add rate limit tracking
- [ ] Build cost estimation feature
- [ ] Create usage analytics dashboard

**Week 9-10: Local Whisper**
- [ ] Integrate whisper.cpp wrapper
- [ ] Build setup wizard for local Whisper
- [ ] Implement automatic method selection
- [ ] Add progress tracking for local processing
- [ ] Create performance optimization

**Week 11-12: AI Integration**
- [ ] Integrate OpenAI for summaries
- [ ] Add Google Gemini support
- [ ] Add Anthropic Claude support
- [ ] Build AI feature panel in notes
- [ ] Implement batch AI processing

**Deliverable:** Multi-API support, local Whisper, multiple AI providers

### 7.3 Phase 3: Advanced Features (3-4 Weeks)

**Week 13-14: Canvas Integration**
- [ ] Implement Canvas file detection
- [ ] Build Canvas node scanner
- [ ] Add Canvas-specific UI elements
- [ ] Create batch processing for Canvas links

**Week 15-16: Excalidraw Integration**
- [ ] Implement Excalidraw detector (code from Section 5)
- [ ] Build link extraction from drawings
- [ ] Create detection modal
- [ ] Add sidebar panel for detected links
- [ ] Implement auto-scan toggle

**Week 17: Polish**
- [ ] Comprehensive error messages
- [ ] Onboarding flow for new users
- [ ] Documentation and help system
- [ ] Performance optimization
- [ ] User testing and feedback

**Deliverable:** Full platform support, all detection contexts, polished UX

### 7.4 Phase 4: Community & Experimental (Ongoing)

**Features:**
- [ ] Telegram integration (experimental)
- [ ] Facebook video support (with auth)
- [ ] Vimeo support
- [ ] Local AI models (when available)
- [ ] Collaborative features
- [ ] Study tools (flashcards, questions)
- [ ] Video timestamp navigation
- [ ] Batch folder processing

**Deliverable:** Community-requested features, experimental capabilities

---

## 8. Technical Requirements & Dependencies

### 8.1 Obsidian Plugin Dependencies

**Required:**
- `obsidian`: ^1.4.0 (Obsidian API)
- Node.js runtime (provided by Electron)
- TypeScript: ^5.0.0

**RapidAPI Integration:**
- `axios` or `node-fetch`: HTTP requests
- No SDK required (direct REST API calls)

**Whisper Integration:**
- `openai`: ^4.20.0 (for Whisper API)
- `fluent-ffmpeg` (for local audio processing if needed)

**AI Providers:**
- `openai`: ^4.20.0
- `@google/generative-ai`: ^0.1.0
- `@anthropic-ai/sdk`: ^0.9.0

**Utilities:**
- `handlebars`: ^4.7.8 (template rendering)
- `moment`: ^2.29.4 (date formatting)

**Excalidraw (Optional):**
- Requires `obsidian-excalidraw-plugin` installed by user
- No direct dependency, runtime detection

### 8.2 External Services Required

**Mandatory:**
- RapidAPI account + API key
- OpenAI API key (for Whisper API or GPT)

**Optional (at least one AI provider):**
- Google AI Studio API key (Gemini)
- Anthropic API key (Claude)

**Optional (local processing):**
- whisper.cpp binary (auto-downloaded or user-provided)
- Local compute resources (CPU/GPU for Whisper)

### 8.3 System Requirements

**Minimum:**
- Obsidian 1.4.0+
- Internet connection (for API calls)
- 4GB RAM
- 500MB free disk space (for temp files)

**Recommended:**
- Obsidian 1.5.0+
- Fast internet (for large video downloads)
- 8GB+ RAM (for local Whisper)
- 2GB+ free disk space

**For Local Whisper:**
- 8GB+ RAM (16GB for large models)
- Modern multi-core CPU or GPU
- 5GB+ disk space (for models)

### 8.4 Plugin Size Budget

**Target:** < 5 MB plugin bundle

**Breakdown:**
- Plugin code: ~500 KB
- Dependencies (bundled): ~3 MB
- Assets (icons, templates): ~100 KB
- Documentation: ~200 KB
- **Total:** ~4 MB (within budget)

**Large Dependencies (Not Bundled):**
- Whisper models (downloaded separately)
- FFmpeg binary (optional, downloaded if needed)

---

## 9. Security & Privacy Considerations

### 9.1 API Key Security

**Storage:**
- Encrypted using Electron's `safeStorage` API
- OS-level keychain integration (macOS Keychain, Windows Credential Manager)
- Fallback: Obfuscated storage (not true encryption)

**Transmission:**
- HTTPS only (enforced)
- API keys never logged
- Not included in error reports
- User-controlled visibility in settings

**Best Practices:**
- Prompt user to use environment variables (advanced)
- Support .env file for API keys (optional)
- Clear documentation on key security

### 9.2 Data Privacy

**What Leaves User's Machine:**
- Video URLs (sent to RapidAPI)
- Audio files (sent to Whisper API if using API method)
- Transcripts (sent to AI providers for summaries)

**What Stays Local:**
- All Obsidian notes and files
- Plugin settings
- Cache data
- Transcripts (stored in vault)

**Privacy Modes:**

**Standard Mode:**
- RapidAPI for extraction
- Whisper API for transcription
- AI providers for summaries

**Privacy Mode:**
- RapidAPI for extraction (unavoidable)
- Local Whisper for transcription (no audio upload)
- Skip AI summaries OR use local AI (future)

**Extreme Privacy Mode:**
- Manual video download
- Local file input (drag-drop)
- Local Whisper only
- No AI processing

### 9.3 Content Security

**Sensitive Content Handling:**
- Detect keywords indicating private content
- Confirm before processing
- Option to disable auto-scan for specific folders
- Automatic cleanup of temporary audio files

**Audio File Management:**
- Temp files deleted immediately after transcription
- User option to save audio files (disabled by default)
- Clear indication when audio is retained

**Transcript Storage:**
- All transcripts stored locally in Obsidian vault
- User has full control over notes
- No cloud backup unless user configures it

### 9.4 Compliance & Legal

**GDPR Considerations:**
- No personal data collected by plugin
- API keys are user-provided
- Video URLs are user-initiated
- Third-party APIs (RapidAPI, OpenAI) have own policies

**Copyright & Fair Use:**
- Plugin facilitates transcription, not distribution
- Users responsible for copyright compliance
- Transcripts for personal knowledge management (fair use)
- No video redistribution features

**Terms of Service:**
- Users must comply with platform ToS (YouTube, Instagram, etc.)
- RapidAPI handles legal aspects of extraction
- Plugin documentation includes legal disclaimers

**Recommendations:**
- Add legal disclaimer in plugin README
- Link to platform ToS in settings
- Educate users on fair use
- No commercial use encouragement

---

## 10. Testing & Quality Assurance

### 10.1 Testing Strategy

**Unit Tests:**
- URL pattern matching (all platforms)
- Metadata normalization
- Error handling logic
- API response parsing
- Template rendering

**Integration Tests:**
- RapidAPI request/response cycles
- Whisper API transcription
- AI provider integration
- Note creation in vault
- Settings persistence

**End-to-End Tests:**
- Full workflow: URL → Transcript → Note
- Error recovery scenarios
- Multi-platform handling
- Fallback API switching

**Manual Testing Checklist:**
- [ ] YouTube: Standard video, Shorts, long video (>1hr)
- [ ] Instagram: Public Reel, Post, Story
- [ ] X/Twitter: Video tweet, multiple videos, GIF
- [ ] TikTok: Standard video, no-watermark download
- [ ] Error scenarios: Invalid URL, private content, deleted video
- [ ] Rate limiting: Exceed limits, fallback activation
- [ ] Local Whisper: Setup, transcription, model switching
- [ ] AI summaries: All providers, different options
- [ ] Canvas: Link detection, batch processing
- [ ] Excalidraw: Text element detection, modal workflow
- [ ] Settings: Save/load, API key validation, cost tracking

### 10.2 Performance Benchmarks

**Target Performance:**
- URL detection: < 100ms
- RapidAPI request: < 3 seconds
- Audio download (5 min video): < 10 seconds
- Whisper API (5 min audio): < 30 seconds
- Local Whisper (5 min, base model): < 60 seconds
- AI summary generation: < 10 seconds
- Note creation: < 1 second
- **Total (5 min video, API mode): 1-2 minutes**

**Optimization Targets:**
- Parallel processing where possible
- Efficient caching strategies
- Lazy loading of components
- Minimal impact on Obsidian performance

### 10.3 Error Scenarios & Handling

| Scenario | Detection | Recovery | User Experience |
|----------|-----------|----------|-----------------|
| Invalid API key | API 401 response | Prompt to update key | Clear error + settings link |
| Rate limit exceeded | API 429 response | Switch to fallback API | Transparent fallback |
| Video unavailable | API 404 response | Check platform directly | Helpful error message |
| Network timeout | Request timeout | Retry with backoff | Progress indicator update |
| Large file (>25MB) | Check size before upload | Chunk audio file | Automatic, inform user |
| Corrupted audio | Whisper error | Retry download | Error with retry option |
| AI provider down | API error | Skip AI or use alt provider | Continue without summary |
| Disk space full | Write error | Cleanup temp files | Clear error message |

---

## 11. Future Enhancements & Roadmap

### 11.1 Short-Term (Next 6 Months)

**Enhanced AI Features:**
- Automatic chapter detection using AI
- Key concept extraction and glossary generation
- Study question generation from transcripts
- Action item extraction
- Sentiment analysis for content

**Workflow Improvements:**
- Batch folder processing (transcribe all videos in a folder)
- Scheduled transcription (queue for overnight)
- Template marketplace (community templates)
- Custom AI prompts (user-defined)
- Transcript editing UI (correct errors)

**Platform Expansion:**
- Vimeo support
- Dailymotion support
- Reddit video support
- LinkedIn video support

### 11.2 Mid-Term (6-12 Months)

**Local AI Models:**
- Integration with LLM.js or similar
- Fully offline summarization
- Privacy-first AI processing
- Custom model support

**Advanced Features:**
- Multi-language transcript translation
- Speaker diarization (identify speakers)
- Embedded video player with timestamp sync
- Collaborative transcript editing
- Anki/Spaced-repetition flashcard generation

**Enterprise Features:**
- Team accounts with shared API keys
- Centralized transcript repository
- Access controls and permissions
- Usage analytics dashboard
- Batch API optimization

### 11.3 Long-Term Vision (12+ Months)

**AI-Powered Knowledge Graph:**
- Automatic linking between related transcripts
- Concept mapping across videos
- Knowledge synthesis from multiple sources
- Intelligent recommendations

**Platform Evolution:**
- Standalone web service (Obsidian-optional)
- Mobile app support
- Real-time transcription (livestreams)
- Video generation from notes (reverse workflow)

**Community Ecosystem:**
- Public transcript marketplace
- Collaborative annotation
- Shared knowledge bases
- Educational institution partnerships

---

## 12. Conclusion: The RapidAPI Advantage

### 12.1 Why RapidAPI Changes Everything

The shift from local extraction tools (N2 approach) to RapidAPI (N3 approach) fundamentally transforms the plugin's viability:

**Technical Advantages:**
1. **No Platform-Specific Maintenance:** RapidAPI providers update extraction logic when platforms change
2. **Unified Authentication:** Single API key for all platforms
3. **Reliable X/Twitter Support:** 100% available, no scraping fragility
4. **Simplified Deployment:** No binaries to bundle or maintain
5. **Automatic Scaling:** Pay-as-you-go from free to enterprise

**User Experience Advantages:**
1. **Faster Setup:** No local tool installation
2. **Cross-Platform:** Works on Windows, Mac, Linux identically
3. **Consistent Errors:** Standardized error handling
4. **Better Performance:** Cloud-optimized infrastructure
5. **Predictable Costs:** Clear pricing tiers

**Development Advantages:**
1. **Faster Development:** Focus on features, not extraction logic
2. **Easier Testing:** Mock APIs for unit tests
3. **Reduced Complexity:** Fewer dependencies
4. **Better Documentation:** RapidAPI provides API docs
5. **Community Support:** Large RapidAPI developer community

### 12.2 Remaining Challenges

**Costs:** Users must pay for API access (mitigated by free tiers)
**Internet Dependency:** Requires connectivity (acceptable for cloud-first users)
**API Reliability:** Dependent on third-party uptime (mitigated by fallbacks)
**Privacy:** Video URLs sent to RapidAPI (mitigated by local Whisper option)

**None of these challenges outweigh the benefits.**

### 12.3 Recommended Next Steps

1. **Validate API Access:** Create RapidAPI account, test primary API
2. **Build Prototype:** Implement MVP with single platform (YouTube)
3. **User Testing:** Early feedback from Obsidian community
4. **Iterate:** Refine based on real-world usage
5. **Launch:** Release Phase 1 to Obsidian plugin marketplace

### 12.4 Success Metrics

**Phase 1 Success:**
- 100+ active users within 30 days
- 95%+ transcription success rate
- < 2 minute average processing time
- < 5% error rate
- Positive community feedback

**Long-Term Success:**
- 10,000+ active users
- Featured in Obsidian community highlights
- Sustainable pricing model
- Active contributor community
- Educational institution adoption

---

## Appendix A: API Endpoint Reference

### Primary API: Auto Download All In One

**Base URL:** `https://instagram-tiktok-youtube-downloader.p.rapidapi.com`

**Endpoints:**

**GET /download**
- **Description:** Download video/audio from supported platforms
- **Parameters:**
  - `url` (required): Video URL
  - `format` (optional): `mp3` | `mp4` | `best`
  - `quality` (optional): `128` | `192` | `320` (for audio)
- **Response:** Video metadata + download URLs

**GET /metadata**
- **Description:** Fetch video metadata without downloading
- **Parameters:**
  - `url` (required): Video URL
- **Response:** Title, author, thumbnail, duration, etc.

### Fallback API: All Social Media Video Downloader

**Base URL:** `https://all-social-media-video-downloader.p.rapidapi.com`

**Endpoints:**

**POST /api/download**
- **Description:** Extract video from any supported platform
- **Body:** `{ "url": "video_url" }`
- **Response:** Download URL + metadata

---

## Appendix B: Platform URL Patterns

```typescript
const VIDEO_PATTERNS = {
  youtube: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ],
    extractId: (url: string) => {
      const match = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }
  },

  instagram: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/stories\/([a-zA-Z0-9_.-]+)\/(\d+)/
    ],
    extractId: (url: string) => {
      const match = url.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
  },

  twitter: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/status\/(\d+)/
    ],
    extractId: (url: string) => {
      const match = url.match(/status\/(\d+)/);
      return match ? match[1] : null;
    }
  },

  tiktok: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?vm\.tiktok\.com\/([a-zA-Z0-9]+)/
    ],
    extractId: (url: string) => {
      const match = url.match(/video\/(\d+)/);
      return match ? match[1] : null;
    }
  },

  facebook: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/watch\/?\?v=(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^\/]+\/videos\/(\d+)/
    ],
    extractId: (url: string) => {
      const match = url.match(/(?:v=|videos\/)(\d+)/);
      return match ? match[1] : null;
    }
  }
};
```

---

## Appendix C: Error Code Reference

| Code | Type | Cause | Resolution |
|------|------|-------|------------|
| ERR_INVALID_URL | Validation | URL format invalid | Validate URL before API call |
| ERR_PLATFORM_UNSUPPORTED | Validation | Platform not supported | Check platform whitelist |
| ERR_API_KEY_MISSING | Configuration | No API key configured | Prompt user for API key |
| ERR_API_KEY_INVALID | Authentication | API key rejected | Verify key in settings |
| ERR_RATE_LIMIT | RateLimit | Request quota exceeded | Switch to fallback or queue |
| ERR_VIDEO_PRIVATE | Access | Content is private | Inform user, offer auth |
| ERR_VIDEO_DELETED | Access | Content no longer exists | Inform user, no retry |
| ERR_NETWORK_TIMEOUT | Network | Request took too long | Retry with backoff |
| ERR_DOWNLOAD_FAILED | Download | Audio/video download failed | Retry download |
| ERR_WHISPER_FAILED | Transcription | Whisper API error | Retry or suggest local |
| ERR_AI_FAILED | AI Processing | AI provider error | Skip AI or use alternative |
| ERR_DISK_SPACE | System | Insufficient disk space | Cleanup temp files |
| ERR_UNKNOWN | System | Unexpected error | Log and report |

---

**Document Version:** 1.0
**Last Updated:** 2025-01-18
**Next Review:** After Phase 1 completion

---

*This N3 document represents the complete architectural specification for the Link Video Transcriber plugin using RapidAPI. Implementation should follow this documentation as the authoritative reference.*
