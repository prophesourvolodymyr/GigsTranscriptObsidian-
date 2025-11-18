# Architecture Plan
## Link Video Transcriber - System Design

**Last Updated:** 2025-01-18  
**Document Version:** 1.0

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      OBSIDIAN VAULT (USER)                       │
│  ┌────────────────┐  ┌───────────────┐  ┌───────────────────┐  │
│  │  Markdown      │  │    Canvas     │  │   Excalidraw      │  │
│  │    Files       │  │    Boards     │  │    Drawings       │  │
│  └────────┬───────┘  └───────┬───────┘  └────────┬──────────┘  │
│           │                   │                     │             │
│           └───────────────────┴─────────────────────┘             │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  LINK DETECTOR      │
                    │   (Event System)    │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
     ┌──────▼────────┐  ┌─────▼──────┐  ┌──────▼────────┐
     │  Markdown     │  │   Canvas   │  │  Excalidraw   │
     │   Detector    │  │  Detector  │  │   Detector    │
     └──────┬────────┘  └─────┬──────┘  └──────┬────────┘
            │                  │                  │
            └──────────────────┴──────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   URL PARSER &      │
                    │  PLATFORM ROUTER    │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                       │
 ┌──────▼────────┐    ┌───────▼────────┐    ┌────────▼────────┐
 │   Primary     │    │   Fallback     │    │   Specialized   │
 │  RapidAPI     │    │   RapidAPI     │    │    RapidAPI     │
 └──────┬────────┘    └───────┬────────┘    └────────┬────────┘
        │                      │                       │
        └──────────────────────┴───────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   VIDEO METADATA    │
                    │   & AUDIO EXTRACT   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  TRANSCRIPTION      │
                    │   ORCHESTRATOR      │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
         ┌──────▼────────┐            ┌──────▼────────┐
         │  Whisper API  │            │    Local      │
         │   (OpenAI)    │            │   Whisper     │
         └──────┬────────┘            └──────┬────────┘
                │                             │
                └──────────────┬──────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  TRANSCRIPT TEXT    │
                    │   (with timing)     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  AI PROCESSING      │
                    │   (Optional)        │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                       │
 ┌──────▼────────┐    ┌───────▼────────┐    ┌────────▼────────┐
 │    OpenAI     │    │     Gemini     │    │     Claude      │
 │   GPT-4o      │    │     Flash      │    │    Sonnet       │
 └──────┬────────┘    └───────┬────────┘    └────────┬────────┘
        │                      │                       │
        └──────────────────────┴───────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SUMMARY & KEY     │
                    │      POINTS         │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  TEMPLATE ENGINE    │
                    │   (Handlebars)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  NOTE GENERATOR     │
                    │  (Markdown)         │
                    └──────────┬──────────┘
                               │
┌──────────────────────────────┼─────────────────────────────────┐
│                    ┌─────────▼─────────┐                        │
│                    │   CREATE NOTE     │                        │
│                    │    IN VAULT       │                        │
│                    └───────────────────┘                        │
│                     OBSIDIAN VAULT                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Link Detection Layer
**Responsibility:** Detect video URLs across all Obsidian contexts

**Components:**
- `LinkDetector` (master)
- `MarkdownDetector`
- `CanvasDetector`
- `ExcalidrawDetector`
- `URLParser`
- `PlatformRouter`

**Technologies:**
- Obsidian Event API
- Regex pattern matching
- JSON parsing

---

### 2. API Integration Layer
**Responsibility:** Communicate with external services

**Components:**
- `RapidAPIClient` (primary video extraction)
- `FallbackOrchestrator` (API redundancy)
- `WhisperAPIClient` (OpenAI transcription)
- `OpenAIClient` (GPT summaries)
- `GeminiClient` (Google AI)
- `ClaudeClient` (Anthropic AI)
- `RequestQueue` (rate limiting)
- `RateLimiter` (usage tracking)

**Technologies:**
- `axios` or `node-fetch`
- Native Obsidian `requestUrl()`
- FormData for file uploads

---

### 3. Transcription Layer
**Responsibility:** Convert audio to text

**Components:**
- `TranscriptionOrchestrator` (method selection)
- `WhisperAPITranscriber` (cloud)
- `LocalWhisperTranscriber` (local)
- `AudioDownloader` (RapidAPI → local file)
- `AudioChunker` (split large files)
- `TranscriptMerger` (combine chunks)

**Technologies:**
- OpenAI Whisper API
- whisper.cpp (local binary)
- FFmpeg (audio processing)
- Child process spawning

---

### 4. AI Processing Layer
**Responsibility:** Generate summaries and insights

**Components:**
- `AIProviderManager` (abstraction)
- `OpenAIProvider`
- `GeminiProvider`
- `ClaudeProvider`
- `SummaryGenerator`
- `KeyPointExtractor`
- `ChapterDetector`
- `ConceptExtractor`

**Technologies:**
- OpenAI SDK
- Google Generative AI SDK
- Anthropic SDK
- Custom prompt engineering

---

### 5. Note Generation Layer
**Responsibility:** Create formatted Obsidian notes

**Components:**
- `TemplateEngine` (Handlebars)
- `NoteGenerator`
- `MetadataFormatter`
- `TagGenerator`
- `NoteOrganizer`
- `FilenameGenerator`

**Technologies:**
- Handlebars.js
- Obsidian Vault API
- moment.js (dates)

---

### 6. UI Layer
**Responsibility:** User interaction

**Components:**
- `ConfirmationModal`
- `ProgressModal`
- `SettingsPanel`
- `BatchQueueUI`
- `ErrorModal`
- `NotificationManager`

**Technologies:**
- Obsidian Modal API
- Obsidian Setting API
- Custom CSS

---

### 7. Storage Layer
**Responsibility:** Manage cache and persistence

**Components:**
- `TranscriptCache` (in-memory + disk)
- `MetadataCache`
- `TempFileManager`
- `SettingsManager`
- `UsageTracker` (costs & stats)

**Technologies:**
- localStorage (settings)
- IndexedDB (cache)
- File system (temp files)

---

## Data Flow Diagram

### Complete Transcription Flow

```
1. User Action
   ↓
2. Event Listener Triggered
   ↓
3. Extract Text from Context
   ↓
4. Run URL Pattern Matching
   ↓
5. Identify Platform
   ↓
6. Show Confirmation Modal
   │   ├─ Display video metadata preview
   │   ├─ Show cost estimate
   │   └─ Collect user preferences
   ↓
7. User Confirms
   ↓
8. Request Video Metadata (RapidAPI)
   │   ├─ Try Primary API
   │   ├─ If fail → Try Fallback
   │   └─ If fail → Try Specialized
   ↓
9. Download Audio File
   │   └─ Save to temp directory
   ↓
10. Select Transcription Method
    │   ├─ Check user preference
    │   ├─ Consider video length
    │   ├─ Check availability
    │   └─ Decide: API or Local
    ↓
11a. [API Path]              11b. [Local Path]
     Call Whisper API              Spawn whisper.cpp
     ↓                             ↓
     Upload audio                  Monitor progress
     ↓                             ↓
     Receive transcript            Parse output
     ↓                             ↓
     ├──────────────┬─────────────┤
                    ↓
12. Parse Transcript
    │   ├─ Extract text
    │   ├─ Extract timestamps
    │   └─ Calculate statistics
    ↓
13. [Optional] AI Processing
    │   ├─ Select AI provider
    │   ├─ Generate summary
    │   ├─ Extract key points
    │   ├─ Identify chapters
    │   └─ Generate tags
    ↓
14. Render Template
    │   ├─ Load template
    │   ├─ Inject data
    │   └─ Format markdown
    ↓
15. Generate Filename
    │   ├─ Apply pattern
    │   ├─ Sanitize characters
    │   └─ Check for duplicates
    ↓
16. Determine Folder
    │   ├─ Check organization strategy
    │   └─ Create folders if needed
    ↓
17. Create Note File
    │   ├─ Write to vault
    │   └─ Add metadata
    ↓
18. [Optional] Link from Source
    │   ├─ Update original file
    │   └─ Replace URL with link
    ↓
19. Cache Results
    │   ├─ Save metadata
    │   └─ Mark as transcribed
    ↓
20. Cleanup
    │   ├─ Delete temp audio
    │   └─ Clear memory
    ↓
21. Notify User
    │   ├─ Show success message
    │   ├─ Display cost
    │   └─ Open note (optional)
    ↓
22. Update Statistics
    │   ├─ Track usage
    │   ├─ Record cost
    │   └─ Log metrics
```

---

## Technology Stack

### Core
- **Language:** TypeScript 5.0+
- **Runtime:** Node.js (Electron)
- **Framework:** Obsidian Plugin API 1.4.0+

### APIs & Services
- **Video Extraction:** RapidAPI (multiple providers)
- **Transcription:** OpenAI Whisper API, whisper.cpp
- **AI Processing:** OpenAI GPT-4o, Google Gemini, Anthropic Claude

### Libraries
- **HTTP Requests:** axios or node-fetch
- **Templating:** handlebars
- **Date/Time:** moment.js
- **AI SDKs:** openai, @google/generative-ai, @anthropic-ai/sdk

### Build Tools
- **Bundler:** esbuild
- **Linter:** ESLint
- **Formatter:** Prettier
- **Type Checking:** TypeScript compiler

---

## Security Considerations

### API Key Protection
- Encrypt at rest using Electron safeStorage
- Never log API keys
- Mask in UI (show only last 4 chars)
- Clear from memory after use

### Data Privacy
- Audio files deleted immediately after transcription
- No telemetry or data collection
- All processing local or via explicit user APIs
- Privacy mode for complete local processing

### Network Security
- HTTPS only for all API calls
- Validate SSL certificates
- Timeout long requests
- Sanitize user inputs

---

## Performance Targets

### Response Times
- URL detection: < 100ms
- RapidAPI request: < 3s
- Audio download (5 min video): < 10s
- Whisper API (5 min): < 30s
- Local Whisper (5 min, base): < 60s
- AI summary: < 10s
- Note creation: < 1s

**Total (5 min video, API mode): 1-2 minutes**

### Resource Usage
- Memory: < 200 MB (idle), < 500 MB (active transcription)
- Disk: < 5 MB plugin, < 5 GB models (local Whisper)
- CPU: Minimal (except local Whisper: 50-80%)
- Network: Dependent on video length

### Scalability
- Support 10+ concurrent API requests
- Handle videos up to 2 hours
- Process batch queues of 50+ videos
- Cache up to 1000 transcript metadata entries

---

## Testing Strategy

### Unit Tests
- URL pattern matching (all platforms)
- Platform identification
- API response normalization
- Template rendering
- Error classification
- Cost calculations

### Integration Tests
- Full transcription flow
- API fallback switching
- Local Whisper integration
- Note generation
- Cache persistence

### End-to-End Tests
- User workflow simulation
- Multi-platform testing
- Error recovery scenarios
- Performance benchmarks

---

## Deployment Architecture

### Plugin Bundle
```
link-video-transcriber/
├── main.js (bundled code)
├── manifest.json
├── styles.css
├── assets/
│   └── icons/
└── README.md
```

### External Dependencies
- User-provided API keys
- Optional: Local Whisper installation
- Optional: FFmpeg for audio processing

---

## Monitoring & Logging

### What to Log
- Plugin lifecycle events (load/unload)
- API requests/responses (sanitized)
- Transcription start/complete
- Errors and exceptions
- Performance metrics

### What NOT to Log
- API keys
- User content (transcripts)
- Personal information
- Obsidian vault paths

### Debug Mode
- Enable verbose logging
- Log all HTTP requests
- Save API responses
- Track timing for each step

---

**Architecture Approved By:** Development Team  
**Status:** Design Complete ✅  
**Next Phase:** Implementation
