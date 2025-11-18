# F34: Privacy Mode

## Overview
Privacy-focused mode that uses local Whisper, skips AI processing, and keeps all data local without cloud uploads.

## User Story
As a privacy-conscious user, I want a mode where no audio or transcript data leaves my machine, so that I can transcribe sensitive content.

## Technical Approach
- Force local Whisper transcription
- Skip AI summary generation
- No cloud API calls except video metadata
- Clear indicators when privacy mode is active

## Priority
**Should-Have** 🟡

## Estimated Effort
**2 days**
