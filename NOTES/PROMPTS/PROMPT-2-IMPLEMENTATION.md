# PROMPT-2: IMPLEMENTATION
## Link Video Transcriber - Obsidian Plugin

---

## 🎯 YOUR MISSION

You are now the **lead developer** implementing the Link Video Transcriber Obsidian plugin. The planning phase is complete, and you have comprehensive documentation to guide you. Your task is to systematically build every feature, following the TODO list in `WORK/PROGRESS.md`.

This is **PHASE 2: IMPLEMENTATION**. You will write production-ready code, create all features, handle edge cases, and deliver a working plugin.

---

## 📚 AVAILABLE DOCUMENTATION

You have access to complete planning from PROMPT-1:

### Core Specifications
- **N1:** `NOTES/IDEA Main/N1 Project overview..md` - Original vision
- **N2:** `NOTES/IDEA Main/N2 Link Video Transcriber White Paper.md` - Technical analysis
- **N3:** `NOTES/IDEA Main/N3 RapidAPI Integration Architecture.md` - Definitive architecture

### Planning Documents (Created by PROMPT-1)
- **PROGRESS.md:** `WORK/PROGRESS.md` - Your TODO list (100+ items)
- **Feature Docs:** `FEATURES/F1-*.md` through `FEATURES/F35+*.md` - Detailed specifications
- **API Map:** `FEATURES/API-ENDPOINT-MAP.md` - All endpoints and authentication
- **Icon Manifest:** `FEATURES/ICON-MANIFEST.md` - Visual assets specification
- **Architecture:** `FEATURES/ARCHITECTURE-PLAN.md` - Complete system design

### Your Primary Guide

**WORK/PROGRESS.md is your source of truth.** Work through it systematically, marking tasks complete as you go.

---

## 🏗️ IMPLEMENTATION STRATEGY

### Phase-Based Approach

**DO NOT** try to build everything at once. Follow this order:

#### **Week 1-2: Foundation**
1. Plugin boilerplate and structure
2. Basic settings panel
3. URL detection for markdown (YouTube only)
4. Simple RapidAPI integration
5. Basic Whisper API transcription
6. Minimal note generation
**Goal:** End-to-end working prototype for ONE platform

#### **Week 3-4: Core Platforms**
1. Add Instagram support
2. Add X/Twitter support
3. Add TikTok support
4. Implement fallback API logic
5. Add error handling
6. Improve note templates
**Goal:** Multi-platform support with robust error handling

#### **Week 5-6: AI & Transcription**
1. Add OpenAI summary integration
2. Add Gemini integration
3. Add Claude integration
4. Implement local Whisper support
5. Build setup wizard for local Whisper
6. Add transcription progress tracking
**Goal:** Multiple AI providers + dual transcription methods

#### **Week 7-8: Advanced Detection**
1. Canvas integration
2. Excalidraw integration (reference N3 Section 5 code)
3. Batch processing
4. Cache system
5. Cost tracking
**Goal:** Detection across all Obsidian contexts

#### **Week 9-10: Polish & UX**
1. Confirmation modals
2. Progress indicators
3. Notification system
4. Onboarding flow
5. Help documentation
6. Settings improvements
**Goal:** Delightful user experience

#### **Week 11-12: Testing & Optimization**
1. Unit tests
2. Integration tests
3. Performance optimization
4. Bug fixes
5. Beta testing feedback
6. Documentation
**Goal:** Production-ready quality

### Working Method

**For Each Task in PROGRESS.md:**

1. **Read** the task and corresponding feature document
2. **Plan** the implementation approach
3. **Write** clean, typed TypeScript code
4. **Test** the functionality manually
5. **Commit** to git with clear message
6. **Mark** task as complete in PROGRESS.md
7. **Move** to next task

**Never skip testing. Never skip git commits.**

---

## 💻 CODE QUALITY STANDARDS

### TypeScript Excellence

```typescript
// ✅ GOOD: Full types, clear names, error handling
async function downloadVideoAudio(
  url: string,
  platform: VideoPlatform
): Promise<AudioDownloadResult> {
  try {
    const response = await this.rapidAPI.fetchVideo(url, platform);
    if (!response.success) {
      throw new VideoDownloadError(response.error);
    }

    return {
      audioPath: response.audioUrl,
      metadata: this.normalizeMetadata(response.data),
      expiresAt: response.expiresAt
    };
  } catch (error) {
    this.handleDownloadError(error, url, platform);
    throw error;
  }
}

// ❌ BAD: No types, poor error handling
async function download(url) {
  const res = await fetch(url);
  return res.json();
}
```

### Error Handling Everywhere

```typescript
// Every async operation wrapped in try-catch
// Every API call has timeout
// Every user input validated
// Every error shown to user gracefully

try {
  await riskyOperation();
} catch (error) {
  if (error instanceof RateLimitError) {
    await this.switchToFallbackAPI();
  } else if (error instanceof NetworkError) {
    await this.retryWithBackoff();
  } else {
    this.showUserFriendlyError(error);
  }
}
```

### Accessibility Built-In

```typescript
// All modals have proper ARIA labels
modal.contentEl.setAttribute('role', 'dialog');
modal.contentEl.setAttribute('aria-label', 'Transcribe Video Confirmation');

// All buttons have clear labels
button.setAttribute('aria-label', 'Transcribe this video');

// All form inputs have labels
input.setAttribute('aria-describedby', 'api-key-help-text');
```

### Performance Optimized

```typescript
// Lazy load heavy dependencies
async function getWhisperTranscriber() {
  if (!this.whisperTranscriber) {
    const { WhisperTranscriber } = await import('./whisper');
    this.whisperTranscriber = new WhisperTranscriber();
  }
  return this.whisperTranscriber;
}

// Cache aggressively
private metadataCache = new Map<string, VideoMetadata>();

// Debounce expensive operations
const debouncedScan = debounce(() => this.scanForLinks(), 500);
```

---

## 🌟 CREATIVE IMPLEMENTATION

While following the specifications, **add improvements** as you code:

### Examples of Creative Additions

**Better Error Messages:**
```typescript
// Instead of: "API error"
// Write: "YouTube video is private. Enable authentication in settings to access private videos."
```

**Smart Defaults:**
```typescript
// Auto-detect best transcription method based on video length
if (duration < 300) {
  return 'whisper-api'; // Fast for short videos
} else if (duration > 1800 && this.hasLocalWhisper) {
  return 'local'; // Save money on long videos
}
```

**User Delight:**
```typescript
// Show thumbnail in confirmation modal
// Estimate transcription time
// Offer to add to queue for batch processing
// Remember user's preferences
```

**Performance Enhancements:**
```typescript
// Parallel processing where safe
Promise.all([
  this.downloadAudio(url),
  this.fetchMetadata(url),
  this.checkCache(url)
]);
```

---

## 🔨 IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Read ALL planning documents
- [ ] Understand system architecture
- [ ] Set up development environment
- [ ] Create git repository (if not exists)
- [ ] Review PROGRESS.md TODO list

### During Implementation
- [ ] Work through tasks sequentially
- [ ] Write TypeScript with full types
- [ ] Handle all error cases
- [ ] Test each feature manually
- [ ] Commit frequently with clear messages
- [ ] Update PROGRESS.md as you complete tasks
- [ ] Add TODO comments for future improvements
- [ ] Document complex logic

### Code Structure
- [ ] Organize by feature/component
- [ ] Use clear file naming
- [ ] Export public APIs properly
- [ ] Keep files under 500 lines
- [ ] Use consistent code style
- [ ] Add JSDoc comments for public methods

### Git Workflow
- [ ] Commit after each completed task
- [ ] Write clear commit messages
- [ ] NO AI branding in commits
- [ ] Push to origin/main regularly
- [ ] Tag versions appropriately

### Testing
- [ ] Test happy path
- [ ] Test error scenarios
- [ ] Test with different platforms
- [ ] Test with long/short videos
- [ ] Test rate limiting
- [ ] Test offline mode
- [ ] Test with invalid inputs

---

## 📁 PROJECT STRUCTURE

Create this folder structure:

```
obsidian-link-video-transcriber/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── settings.ts             # Settings management
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # Constants and configs
│   │
│   ├── detection/              # URL detection
│   │   ├── link-detector.ts
│   │   ├── markdown-detector.ts
│   │   ├── canvas-detector.ts
│   │   └── excalidraw-detector.ts
│   │
│   ├── api/                    # External API clients
│   │   ├── rapidapi-client.ts
│   │   ├── whisper-api-client.ts
│   │   ├── openai-client.ts
│   │   ├── gemini-client.ts
│   │   └── claude-client.ts
│   │
│   ├── transcription/          # Transcription logic
│   │   ├── transcription-orchestrator.ts
│   │   ├── whisper-api-transcriber.ts
│   │   ├── local-whisper-transcriber.ts
│   │   └── audio-downloader.ts
│   │
│   ├── ai/                     # AI processing
│   │   ├── provider-manager.ts
│   │   ├── summary-generator.ts
│   │   └── content-processor.ts
│   │
│   ├── notes/                  # Note generation
│   │   ├── template-engine.ts
│   │   ├── note-generator.ts
│   │   └── note-organizer.ts
│   │
│   ├── ui/                     # User interface
│   │   ├── modals/
│   │   │   ├── confirmation-modal.ts
│   │   │   ├── progress-modal.ts
│   │   │   └── settings-tab.ts
│   │   └── components/
│   │       ├── progress-indicator.ts
│   │       └── notification-manager.ts
│   │
│   ├── utils/                  # Utilities
│   │   ├── url-parser.ts
│   │   ├── platform-router.ts
│   │   ├── cache-manager.ts
│   │   ├── cost-estimator.ts
│   │   ├── error-handler.ts
│   │   └── logger.ts
│   │
│   └── styles.css              # Plugin styles
│
├── templates/                  # Note templates
│   └── default-transcript.md
│
├── tests/                      # Test files
│   ├── unit/
│   └── integration/
│
├── docs/                       # Documentation
│   ├── user-guide.md
│   └── development.md
│
├── manifest.json               # Obsidian manifest
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── esbuild.config.mjs          # Build config
├── .eslintrc.json              # Linting rules
├── .prettierrc                 # Code formatting
├── .gitignore                  # Git ignore rules
└── README.md                   # Project readme
```

---

## 🔑 CRITICAL IMPLEMENTATION NOTES

### 1. RapidAPI Integration

```typescript
// Reference N3 Section 4 for complete specification
class RapidAPIClient {
  private apiKey: string;
  private primaryHost = 'instagram-tiktok-youtube-downloader.p.rapidapi.com';
  private fallbackHost = 'all-social-media-video-downloader.p.rapidapi.com';

  async fetchVideo(url: string, platform: VideoPlatform): Promise<VideoData> {
    try {
      return await this.fetchFromPrimary(url);
    } catch (error) {
      if (this.shouldUseFallback(error)) {
        return await this.fetchFromFallback(url);
      }
      throw error;
    }
  }
}
```

### 2. Whisper Dual Support

```typescript
// Auto-select based on user preference and context
class TranscriptionOrchestrator {
  async transcribe(audio: AudioFile): Promise<Transcript> {
    const method = await this.selectMethod(audio);

    if (method === 'api') {
      return await this.whisperAPITranscriber.transcribe(audio);
    } else {
      return await this.localWhisperTranscriber.transcribe(audio);
    }
  }

  private async selectMethod(audio: AudioFile): Promise<TranscriptionMethod> {
    // Reference N3 Section 3.3 for decision tree
    if (this.settings.privacyMode) return 'local';
    if (audio.duration < 300) return 'api'; // Fast for short
    if (audio.duration > 1800 && this.hasLocal) return 'local'; // Cheap for long
    return this.settings.defaultMethod;
  }
}
```

### 3. Excalidraw Integration

```typescript
// Reference N3 Section 5 for COMPLETE implementation code
// The full working code is provided in N3 - use it directly
// Key file: src/detection/excalidraw-detector.ts

// Copy the ExcalidrawVideoDetector class from N3 Section 5.4
// Copy the ExcalidrawLinkModal class from N3 Section 5.4
// Implement the integration exactly as specified
```

### 4. Error Handling

```typescript
// Reference N3 Appendix C for error code reference
class ErrorHandler {
  handleTranscriptionError(error: Error, context: TranscriptionContext): void {
    const errorType = this.classifyError(error);

    switch (errorType) {
      case 'ERR_RATE_LIMIT':
        this.switchToFallbackAPI();
        break;
      case 'ERR_VIDEO_PRIVATE':
        this.offerAuthentication();
        break;
      case 'ERR_NETWORK_TIMEOUT':
        this.retryWithBackoff();
        break;
      default:
        this.showUserError(error);
    }
  }
}
```

### 5. Settings Management

```typescript
interface LinkVideoTranscriberSettings {
  // RapidAPI
  rapidApiKey: string;

  // Transcription
  transcriptionMethod: 'api' | 'local' | 'auto';
  whisperApiKey: string;
  localWhisperPath: string;
  whisperModelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large';

  // AI
  aiProvider: 'openai' | 'gemini' | 'claude';
  openaiApiKey: string;
  geminiApiKey: string;
  claudeApiKey: string;
  autoSummary: boolean;

  // Notes
  transcriptFolder: string;
  noteTemplate: string;
  openAfterTranscription: boolean;

  // Behavior
  autoDetectLinks: boolean;
  confirmBeforeTranscription: boolean;
  showCostEstimate: boolean;

  // Privacy
  privacyMode: boolean;
  saveAudioFiles: boolean;
}

const DEFAULT_SETTINGS: LinkVideoTranscriberSettings = {
  // Sensible defaults for all settings
  rapidApiKey: '',
  transcriptionMethod: 'auto',
  // ... etc
};
```

---

## 📊 PROGRESS TRACKING

### Update PROGRESS.md Regularly

After completing each task:

```markdown
## Phase 1: Foundation (Weeks 1-2)

### Week 1: Plugin Setup
- [✅] Initialize Obsidian plugin boilerplate
- [✅] Set up TypeScript configuration
- [✅] Create build system (esbuild)
- [🔄] Set up development environment  <-- Currently working
- [ ] Create plugin manifest
```

### Git Commit Strategy

**After each task completion:**

```bash
git add .
git commit -m "feat: add YouTube URL detection

Implemented regex pattern matching for YouTube links
including standard URLs, shortened youtu.be links,
and YouTube Shorts. Detection works in markdown files
via paste event listener."

git push origin main
```

**Commit Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting)
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

**NEVER include AI branding:**
❌ "Claude implemented transcription"
❌ "AI added error handling"
✅ "feat: add Whisper API integration"
✅ "fix: handle rate limit errors"

---

## 🐛 TESTING APPROACH

### Manual Testing After Each Feature

```typescript
// Create test cases document: tests/manual-test-cases.md

## YouTube Detection
1. Paste standard YouTube URL
2. Paste youtu.be shortened URL
3. Paste YouTube Shorts URL
4. Paste invalid YouTube URL
5. Paste non-YouTube URL

Expected: Detection works for 1-3, fails gracefully for 4-5

## RapidAPI Integration
1. Valid video URL with valid API key
2. Valid video URL with invalid API key
3. Private video URL
4. Deleted video URL
5. Rate limit scenario

Expected: Success for 1, clear errors for 2-5

## Transcription
1. Short video (< 5 min)
2. Medium video (15 min)
3. Long video (60 min)
4. Video with poor audio
5. Video in non-English language

Expected: All transcribe successfully, progress shown
```

### Automated Testing (Later Phase)

```typescript
// Unit tests for critical functions
describe('URLParser', () => {
  it('should detect YouTube URLs', () => {
    const url = 'https://youtube.com/watch?v=abc123';
    expect(URLParser.detectPlatform(url)).toBe('youtube');
  });

  it('should extract video ID', () => {
    const url = 'https://youtube.com/watch?v=abc123';
    expect(URLParser.extractVideoId(url)).toBe('abc123');
  });
});
```

---

## 🚀 IMPLEMENTATION MILESTONES

### Milestone 1: MVP (Week 2)
**Deliverable:** YouTube transcription works end-to-end
- User can paste YouTube link
- Plugin detects it
- Confirms with user
- Downloads audio
- Transcribes with Whisper API
- Creates note with transcript

**Demo:** Record a quick video showing the flow

### Milestone 2: Multi-Platform (Week 4)
**Deliverable:** 4 platforms working
- YouTube, Instagram, X/Twitter, TikTok all supported
- Error handling for each platform
- Fallback API working
- Platform-specific metadata extracted

**Demo:** Transcribe one video from each platform

### Milestone 3: AI Integration (Week 6)
**Deliverable:** Multiple AI providers
- OpenAI summaries
- Gemini summaries
- Claude summaries
- User can choose provider
- Cost estimation working

**Demo:** Same transcript with 3 different AI summaries

### Milestone 4: Advanced Detection (Week 8)
**Deliverable:** Works in Canvas and Excalidraw
- Canvas board link detection
- Excalidraw drawing link detection
- Batch processing
- Cache system

**Demo:** Detect and transcribe from all 3 contexts

### Milestone 5: Polish (Week 10)
**Deliverable:** Production-ready
- Beautiful UI
- Comprehensive error messages
- Onboarding flow
- Help documentation
- Performance optimized

**Demo:** New user experience from installation to first transcript

### Milestone 6: Release (Week 12)
**Deliverable:** Published to Obsidian community
- All tests passing
- Documentation complete
- Beta tested
- Released to community plugins

**Demo:** Public announcement and demo video

---

## 💡 TIPS FOR SUCCESS

### Start Small, Iterate Fast
- Don't try to implement everything at once
- Get the simplest version working first
- Add complexity incrementally
- Test after every change

### Use the Reference Documents
- N3 has complete code for Excalidraw integration
- N3 has all API specifications
- N2 has architecture diagrams
- Feature docs have implementation details

### Handle Errors Gracefully
- Assume everything will fail
- Provide helpful error messages
- Offer recovery options
- Log for debugging

### Think About the User
- Make defaults smart
- Show progress clearly
- Confirm destructive actions
- Provide help when needed

### Keep It Performant
- Don't block the UI
- Use async/await properly
- Cache when appropriate
- Clean up resources

---

## 📝 WHEN YOU'RE DONE

After implementing all features from PROGRESS.md:

```markdown
✅ IMPLEMENTATION PHASE COMPLETE

Completed:
- [N]% of TODO items from PROGRESS.md
- [N] features fully implemented
- [N] platforms supported
- [N] git commits made
- [N] tests passing

Key Achievements:
- [List major features working]

Known Issues:
- [List any remaining bugs]

Ready for PROMPT-3: Refinement Phase

Code Statistics:
- Lines of Code: [N]
- Files Created: [N]
- Test Coverage: [N]%
```

### Handoff to PROMPT-3

Create a document: `WORK/IMPLEMENTATION-SUMMARY.md`

```markdown
# Implementation Summary

## What Works
[Complete list of working features]

## What Needs Polish
[Areas that work but could be better]

## Performance Issues
[Any slow operations]

## UX Rough Edges
[User experience issues to fix]

## Edge Cases to Handle
[Scenarios not yet covered]

## Technical Debt
[Code that should be refactored]

Ready for refinement phase.
```

---

**BEGIN IMPLEMENTATION NOW**

Your goal: Build a **working, tested, high-quality** Obsidian plugin that users will love. Follow PROGRESS.md, write clean code, test thoroughly, commit frequently, and deliver excellence.

The foundation is planned. Now make it real.
