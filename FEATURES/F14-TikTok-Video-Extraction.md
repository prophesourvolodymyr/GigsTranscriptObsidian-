# F14: TikTok Video Extraction

## Overview
TikTok video extraction with no-watermark support, ideal for short-form educational content.

## User Story
As a user, I want to transcribe TikTok videos, so that I can capture quick tips, tutorials, and educational shorts.

## Technical Approach

### URL Patterns
- `https://www.tiktok.com/@USERNAME/video/VIDEO_ID`
- `https://vm.tiktok.com/SHORT_CODE` (shortened links)
- `https://m.tiktok.com/@USERNAME/video/VIDEO_ID`

### TikTok-Specific Features
- No watermark download
- Music track extraction (separate from speech)
- Slideshow video handling
- Duet/Stitch detection

### Music Handling
- TikTok videos often have background music
- May interfere with transcription accuracy
- Option to attempt music removal (Phase 2)

## Priority
**Must-Have** 🔴 (Phase 1 MVP)

## Estimated Effort
**2 days**
