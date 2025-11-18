# F23: Markdown File Detection

## Overview
Real-time and on-open detection of video links in regular markdown files (primary and simplest detection context).

## User Story
As a user, I want the plugin to detect video links when I paste them into notes, so that I'm immediately offered transcription without manual triggers.

## Technical Approach

### Event Listeners
- `editor-paste`: Real-time paste detection
- `file-open`: Scan when opening files
- `vault.on('modify')`: Detect new links in saved files

### Implementation
```typescript
this.registerEvent(
  this.app.workspace.on('editor-paste', (evt: ClipboardEvent, editor: Editor) => {
    const pastedText = evt.clipboardData?.getData('text');
    if (pastedText) {
      this.detectAndOfferTranscription(pastedText, editor);
    }
  })
);
```

### User Preferences
- Enable/disable auto-detection
- Detection delay (debounce)
- Folder blacklist (don't detect in certain folders)
- Silent mode (detection without modal)

## Priority
**Must-Have** 🔴 (Core feature)

## Estimated Effort
**2-3 days**
