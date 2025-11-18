# F1: Video URL Detection System

## Overview
The Video URL Detection System is the foundational component that monitors user activity across all Obsidian contexts (markdown files, Canvas boards, Excalidraw drawings) to automatically identify when video links are pasted or present in content. This system acts as the entry point for the entire transcription workflow.

## User Story
As an Obsidian user, I want the plugin to automatically detect when I paste a video link anywhere in my vault, so that I'm immediately offered the option to transcribe it without having to manually trigger the process.

## Technical Approach

### Detection Contexts

**1. Markdown Files (Primary)**
- Monitor `editor-paste` events in real-time
- Scan file content on `file-open` events
- Regex pattern matching for all supported platforms
- Immediate user notification on detection

**2. Canvas Boards (Secondary)**
- Parse Canvas JSON data structure
- Scan text nodes for video URLs
- Monitor canvas file modifications
- Batch detection for multiple links

**3. Excalidraw Drawings (Complex)**
- Parse Excalidraw JSON within markdown code blocks
- Extract text from `text` type elements
- Integrate with Excalidraw plugin events (if available)
- Modal-based link presentation

### URL Pattern Recognition

**Platform Patterns:**
- **YouTube**: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`
- **Instagram**: `instagram.com/reel/`, `instagram.com/p/`, `instagram.com/tv/`
- **X/Twitter**: `twitter.com/*/status/`, `x.com/*/status/`
- **TikTok**: `tiktok.com/@*/video/`, `vm.tiktok.com/`
- **Facebook**: `facebook.com/watch`, `facebook.com/*/videos/`
- **Pinterest**: `pinterest.com/pin/`
- **Threads**: `threads.net/@*/post/`

### Detection Flow

```
User Action (Paste/Open/Edit)
    ↓
Event Listener Triggered
    ↓
Extract Text Content
    ↓
Run Platform Regex Patterns
    ↓
Match Found?
    ↓ Yes
Extract Video Metadata (URL, Platform, ID)
    ↓
Show Confirmation Modal
    ↓
User Confirms → Initiate Transcription
```

## Dependencies
- **Depends on**: None (entry point)
- **Required APIs**: None at this stage
- **Obsidian APIs**:
  - `workspace.on('editor-paste')`
  - `workspace.on('file-open')`
  - `vault.on('modify')`
  - `metadataCache.getFileCache()`

## UI/UX Design

### Confirmation Modal
```
┌─────────────────────────────────────────┐
│  📹 Video Link Detected                 │
│                                          │
│  [Thumbnail Preview]                     │
│                                          │
│  Title: "How to Build Obsidian Plugins" │
│  Platform: YouTube • Duration: 15:30    │
│  Author: Developer Channel              │
│                                          │
│  ✓ Transcribe with Whisper API         │
│  ✓ Generate AI summary                  │
│                                          │
│  [ Transcribe ]  [ Not Now ]  [Settings]│
└─────────────────────────────────────────┘
```

### Toast Notification
For non-intrusive detection:
```
🎬 3 video links detected in current file
[Review Links] [Dismiss]
```

## Edge Cases

1. **Multiple Links in Single Paste**
   - Detect all links
   - Show batch transcription modal
   - Allow selective transcription

2. **Already Transcribed Videos**
   - Check cache for existing transcripts
   - Offer to open existing note or re-transcribe
   - Show last transcription date

3. **Invalid/Broken Links**
   - Validate URL format before showing modal
   - Test URL accessibility (optional)
   - Clear error message if link is broken

4. **Shortened URLs**
   - Expand bit.ly, t.co, etc.
   - Detect platform after expansion
   - Cache expanded URLs

5. **Private/Restricted Content**
   - Detect when API returns 403/404
   - Inform user about restrictions
   - Offer authentication setup

6. **Non-Video URLs**
   - Filter out links to channel pages
   - Ignore playlist URLs (unless batch feature enabled)
   - Skip URLs without video content

## Testing Strategy

### Unit Tests
- Test each platform regex pattern with valid URLs
- Test with invalid URLs (should return no matches)
- Test with multiple URLs in single text
- Test with malformed URLs

### Integration Tests
- Paste event detection in live editor
- File open scanning
- Canvas JSON parsing
- Excalidraw JSON parsing

### Manual Test Cases
- [ ] Paste YouTube link in markdown → Modal appears
- [ ] Paste Instagram Reel → Correct platform detected
- [ ] Paste multiple links → Batch modal shows all
- [ ] Open file with existing links → Scan and detect
- [ ] Paste shortened URL → Expands and detects
- [ ] Canvas with video link → Detection works
- [ ] Excalidraw text with link → Modal appears
- [ ] Invalid URL → No modal, no error
- [ ] Already transcribed link → Shows existing note

## Implementation Complexity
**Medium**

- Regex patterns: Easy
- Event listeners: Easy
- Canvas parsing: Medium
- Excalidraw integration: Complex
- Multiple context handling: Medium

## Priority
**Must-Have** 🔴

This is the entry point for the entire plugin. Without reliable detection, no other features can function.

## Estimated Effort
**3-5 days**

- Day 1: Markdown detection + regex patterns
- Day 2: Modal UI + confirmation flow
- Day 3: Canvas integration
- Day 4: Excalidraw integration
- Day 5: Edge cases + testing

## Implementation Notes

### Performance Considerations
- Regex should be compiled once at plugin load
- Cache detection results to avoid re-scanning
- Debounce paste events (100ms) to avoid multiple triggers
- Lazy load modal components

### Settings Integration
- Toggle detection on/off per context (markdown, canvas, excalidraw)
- Set detection delay (immediate vs delayed)
- Choose notification style (modal vs toast)
- Blacklist specific folders from auto-detection

### Future Enhancements
- Browser extension integration (detect links in browser)
- Clipboard monitoring (background detection)
- Smart context: detect if note is about videos
- Learning: remember user preferences per platform
