# F12: Instagram Reels Support

## Overview
Instagram Reel extraction with support for public reels, posts with videos, and IGTV content.

## User Story
As a user, I want to transcribe Instagram Reels and video posts, so that I can capture short-form educational and inspirational content.

## Technical Approach

### URL Patterns
- `https://www.instagram.com/reel/SHORTCODE/`
- `https://www.instagram.com/p/SHORTCODE/` (if video)
- `https://www.instagram.com/tv/SHORTCODE/`

### Limitations (Phase 1)
- Public content only
- No private account support
- 24-hour limit for stories

### Authentication (Phase 2)
- Optional Instagram login
- Cookie-based session
- Enhanced access to private content

## Priority
**Must-Have** 🔴 (Phase 1 MVP)

## Estimated Effort
**2-3 days**
