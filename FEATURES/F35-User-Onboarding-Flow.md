# F35: User Onboarding Flow

## Overview
First-run experience guiding new users through plugin setup, API key configuration, and initial test transcription.

## User Story
As a new user, I want clear guidance on setting up the plugin, so that I can start transcribing videos quickly without confusion.

## Technical Approach

### Onboarding Steps
1. **Welcome Screen**: Overview of plugin features
2. **API Setup**: Guide through RapidAPI key setup
3. **Transcription Method**: Choose Whisper API or Local
4. **AI Provider**: Optional AI summary setup
5. **Test Transcription**: Transcribe a short test video
6. **Completion**: Summary and next steps

### UI Flow
```
┌────────────────────────────────────────────┐
│  👋 Welcome to Link Video Transcriber!    │
│                                             │
│  Transform video content into searchable   │
│  notes automatically.                       │
│                                             │
│  ✨ Features:                               │
│  • Transcribe from 10+ platforms          │
│  • AI-powered summaries                    │
│  • Local or cloud processing               │
│                                             │
│  This setup wizard will help you:          │
│  1. Configure API keys (5 min)            │
│  2. Choose transcription method            │
│  3. Test your first transcription          │
│                                             │
│  [Get Started] [Skip Setup] [Learn More]  │
└────────────────────────────────────────────┘
```

## Priority
**Should-Have** 🟡

## Estimated Effort
**4-5 days**
