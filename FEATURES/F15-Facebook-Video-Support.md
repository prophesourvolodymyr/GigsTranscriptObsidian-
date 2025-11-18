# F15: Facebook Video Support

## Overview
Facebook public video extraction (watch videos, public profile videos, public page videos).

## User Story
As a user, I want to transcribe public Facebook videos, so that I can capture content shared on the platform.

## Technical Approach

### URL Patterns
- `https://www.facebook.com/watch?v=VIDEO_ID`
- `https://www.facebook.com/USER/videos/VIDEO_ID`
- `https://www.facebook.com/reel/REEL_ID`

### Limitations (Phase 1)
- Public videos only
- No private profile content
- No group videos (requires membership)
- Age-restricted content may fail

### Access Challenges
- Facebook has strict privacy settings
- Many videos require login
- Phase 1: Public only
- Phase 2: Optional authentication

## Priority
**Should-Have** 🟡 (Phase 2)

## Estimated Effort
**3-4 days** (auth complexity)
