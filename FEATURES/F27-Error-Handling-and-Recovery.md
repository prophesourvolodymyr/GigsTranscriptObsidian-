# F27: Error Handling and Recovery

## Overview
Comprehensive error handling with clear user messages, automatic recovery strategies, and graceful degradation.

## User Story
As a user, I want clear, actionable error messages when something goes wrong, and automatic recovery where possible, so that I understand what happened and how to fix it.

## Technical Approach

### Error Classification
```typescript
enum ErrorType {
  NETWORK_ERROR,
  API_KEY_INVALID,
  RATE_LIMIT_EXCEEDED,
  VIDEO_UNAVAILABLE,
  VIDEO_PRIVATE,
  TRANSCRIPTION_FAILED,
  AI_PROCESSING_FAILED,
  DISK_SPACE_ERROR,
  UNKNOWN_ERROR
}

class ErrorHandler {
  async handle(error: Error): Promise<ErrorResponse> {
    const classified = this.classifyError(error);

    const response = {
      type: classified.type,
      message: this.getUserMessage(classified),
      recoverable: classified.recoverable,
      actions: this.getRecoveryActions(classified)
    };

    if (response.recoverable) {
      return await this.attemptRecovery(classified);
    }

    return response;
  }

  private getUserMessage(error: ClassifiedError): string {
    const messages = {
      [ErrorType.API_KEY_INVALID]: 'API key is invalid. Please check your settings.',
      [ErrorType.RATE_LIMIT_EXCEEDED]: 'Rate limit reached. Trying backup API...',
      [ErrorType.VIDEO_PRIVATE]: 'This video is private and cannot be accessed.',
      [ErrorType.NETWORK_ERROR]: 'Network error. Check your connection and try again.',
      // ... more messages
    };

    return messages[error.type] || 'An unexpected error occurred.';
  }

  private getRecoveryActions(error: ClassifiedError): Action[] {
    switch (error.type) {
      case ErrorType.API_KEY_INVALID:
        return [
          { label: 'Open Settings', action: () => this.openSettings() },
          { label: 'Help', action: () => this.openHelp('api-keys') }
        ];

      case ErrorType.RATE_LIMIT_EXCEEDED:
        return [
          { label: 'Queue for Later', action: () => this.queueRequest() },
          { label: 'Use Local Whisper', action: () => this.switchToLocal() }
        ];

      case ErrorType.VIDEO_UNAVAILABLE:
        return [
          { label: 'Open Video', action: () => this.openInBrowser() },
          { label: 'Cancel', action: () => this.cancel() }
        ];

      default:
        return [{ label: 'Retry', action: () => this.retry() }];
    }
  }
}
```

### Retry Logic
- Exponential backoff (2s, 4s, 8s, 16s)
- Max 3 retries for network errors
- Immediate retry for transient errors
- No retry for permanent errors (404, 403)

### User Notifications
```
┌────────────────────────────────────────┐
│  ⚠️ Transcription Failed               │
│                                         │
│  Error: Rate limit exceeded            │
│                                         │
│  You've reached your RapidAPI limit    │
│  for this month (500/500 requests).    │
│                                         │
│  Options:                               │
│  • Wait until next month               │
│  • Upgrade your RapidAPI plan          │
│  • Use local file transcription        │
│                                         │
│  [Upgrade Plan] [Use Local] [Cancel]  │
└────────────────────────────────────────┘
```

## Priority
**Must-Have** 🔴

## Estimated Effort
**4-5 days**
