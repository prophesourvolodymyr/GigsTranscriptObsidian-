# F11: YouTube Video Extraction

## Overview
YouTube-specific implementation for extracting video metadata and audio using RapidAPI, handling YouTube URLs, Shorts, and various URL formats.

## User Story
As a user, I want to transcribe YouTube videos from any URL format (standard, shorts, youtu.be), so that I can easily capture educational content and tutorials.

## Technical Approach

### URL Pattern Matching
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

### RapidAPI Integration
Primary API: Auto Download All In One
- Endpoint: `/download?url={youtube_url}&format=mp3`
- Returns: title, author, thumbnail, duration, audio_url

### YouTube-Specific Features
- Chapter detection from description
- Subtitle import as alternative to transcription
- Playlist detection (future feature)
- Live stream recording support

## Priority
**Must-Have** 🔴 (Phase 1 MVP)

## Estimated Effort
**2-3 days**
