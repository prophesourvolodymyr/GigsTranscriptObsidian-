# F28: Progress Tracking UI

## Overview
Real-time progress indicators for all long-running operations with detailed status updates and time estimates.

## User Story
As a user, I want to see detailed progress when videos are being transcribed, so that I know the system is working and can estimate completion time.

## Technical Approach

### Progress States
```typescript
enum ProgressStage {
  DETECTING_URL = 'Detecting video platform...',
  FETCHING_METADATA = 'Fetching video information...',
  DOWNLOADING_AUDIO = 'Downloading audio...',
  TRANSCRIBING = 'Transcribing audio...',
  AI_PROCESSING = 'Generating summary...',
  CREATING_NOTE = 'Creating note...',
  COMPLETE = 'Complete!'
}

class ProgressTracker {
  private stage: ProgressStage;
  private percent: number;
  private details: string;

  update(stage: ProgressStage, percent: number, details?: string): void {
    this.stage = stage;
    this.percent = percent;
    this.details = details;
    this.render();
  }

  render(): void {
    // Update UI with current progress
  }
}
```

### UI Components
**Progress Modal:**
```
┌─────────────────────────────────────────┐
│  🎙️ Transcribing Video                 │
│                                          │
│  [Thumbnail]                             │
│                                          │
│  How to Build Obsidian Plugins          │
│  YouTube • 15:30                        │
│                                          │
│  ━━━━━━━━━━━━━━━━░░░░░░░ 65%          │
│                                          │
│  Stage: Transcribing audio...           │
│  Chunk 2 of 3                           │
│  Time elapsed: 2:15                     │
│  Est. remaining: 1:05                   │
│                                          │
│  Cost so far: $0.04                     │
│                                          │
│  [Minimize] [Cancel]                    │
└─────────────────────────────────────────┘
```

**Toast Notifications:**
```
📹 Transcription started: Video Title
🎙️ Transcribing... 45%
✅ Transcription complete! [[Video Title]]
```

### Background Processing
- Allow minimizing progress modal
- Show status in status bar
- System notification on completion
- Activity log for batch operations

## Priority
**Must-Have** 🔴

## Estimated Effort
**3-4 days**
