# F24: Batch Video Processing

## Overview
Process multiple video links simultaneously with queue management, progress tracking, and intelligent scheduling.

## User Story
As a user, I want to queue multiple videos for transcription and have them processed automatically, so that I can efficiently transcribe my entire research backlog.

## Technical Approach

### Queue Management
```typescript
class TranscriptionQueue {
  private queue: TranscriptionTask[] = [];
  private active: TranscriptionTask[] = [];
  private maxConcurrent = 2; // Configurable

  async add(task: TranscriptionTask): Promise<void> {
    this.queue.push(task);
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.active.length < this.maxConcurrent) {
      const task = this.queue.shift();
      this.active.push(task);
      this.processTask(task);
    }
  }
}
```

### Batch Operations
- Select multiple links in modal
- Transcribe all videos in a folder
- Process videos from a list in a note
- Schedule for overnight processing

### UI
```
┌────────────────────────────────────────┐
│  📋 Batch Transcription Queue          │
│                                         │
│  ✅ Video 1 (Complete) - 2:15          │
│  🔄 Video 2 (Transcribing...) - 45%   │
│  ⏳ Video 3 (Queued) - 10:30          │
│  ⏳ Video 4 (Queued) - 5:45           │
│                                         │
│  Progress: 2/4 complete                │
│  Est. Time Remaining: 8 minutes        │
│  Total Cost: $0.18                     │
│                                         │
│  [Pause] [Cancel All] [Details]       │
└────────────────────────────────────────┘
```

## Priority
**Should-Have** 🟡 (Phase 2)

## Estimated Effort
**4-5 days**
