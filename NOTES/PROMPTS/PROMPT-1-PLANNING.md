# PROMPT-1: GENERAL PLANNING
## Link Video Transcriber - Obsidian Plugin

---

## 🎯 YOUR MISSION

You are the lead architect for the **Link Video Transcriber** Obsidian plugin. Your task is to create comprehensive planning documentation that will guide the entire development process from concept to production.

This is **PHASE 1: GENERAL PLANNING**. You will create all planning documents, feature specifications, TODO breakdowns, and technical architecture needed for successful implementation.

---

## 📚 PROJECT CONTEXT

### Project Overview

**What:** An Obsidian plugin that automatically detects video links from any platform (YouTube, Instagram, X/Twitter, TikTok, Facebook, Telegram), downloads and transcribes them using Whisper (API or local), and generates comprehensive notes with AI-powered summaries.

**Why:** Transform video content consumption into searchable, referenceable knowledge within Obsidian vaults. Enable users to capture insights from video content as easily as they do from text.

**Key Innovation:** Detection across ALL Obsidian contexts - markdown files, Canvas boards, and Excalidraw drawings.

### Core User Flow

```
User Pastes Video Link
    ↓
Plugin Detects URL Automatically
    ↓
Confirmation Modal: "Transcribe this video?"
    ↓
RapidAPI Extracts Video/Audio
    ↓
Whisper Transcribes (API or Local)
    ↓
AI Generates Summary (OpenAI/Gemini/Claude)
    ↓
Beautiful Note Created in Vault
    ↓
User Has Searchable Transcript
```

### Technical Foundation

**Video Extraction:** RapidAPI (unified API marketplace)
- Primary API: Auto Download All In One (FastSaverAPI)
- Fallback APIs for redundancy
- No local dependencies (yt-dlp, ffmpeg)

**Transcription:** Dual approach
- Whisper API (OpenAI) - Fast, cloud-based
- Local Whisper (whisper.cpp) - Privacy-focused, offline

**AI Processing:** Multi-provider support
- OpenAI (GPT-4o, GPT-4o-mini)
- Google Gemini (Flash, Pro)
- Anthropic Claude (Haiku, Sonnet)

**Platforms Supported (Phase 1):**
- ✅ YouTube (99% confidence)
- ✅ Instagram Reels (85% confidence)
- ✅ X/Twitter (95% confidence - major win!)
- ✅ TikTok (90% confidence)
- ✅ Bonus: Pinterest, Threads

### Reference Documents

The following documents contain the complete project specification:

**N1: Project Overview** (`NOTES/IDEA Main/N1 Project overview..md`)
- Original raw idea
- Core concept and vision

**N2: White Paper** (`NOTES/IDEA Main/N2 Link Video Transcriber White Paper.md`)
- 8,000+ word technical analysis
- Original architecture (local extraction approach)
- Platform analysis and challenges
- Obsidian plugin architecture
- Transcription strategies
- AI integration design

**N3: RapidAPI Architecture** (`NOTES/IDEA Main/N3 RapidAPI Integration Architecture.md`)
- 32,000+ word definitive specification
- RapidAPI-first approach (supersedes N2 extraction method)
- Complete platform coverage (10+ platforms)
- System architecture diagrams
- Excalidraw integration (with full implementation code)
- Cost analysis and pricing models
- Implementation roadmap (16-week plan)
- Security and privacy considerations

**Key Architectural Decisions:**
1. **RapidAPI** for video extraction (not local tools)
2. **Dual Whisper** support (API + Local)
3. **Multi-AI** providers for flexibility
4. **Template system** for note generation
5. **Three-tier API** strategy (Primary → Fallback → Specialized)

---

## 🎨 YOUR CREATIVE FREEDOM

You are **encouraged to think beyond the specifications**. While N1, N2, and N3 provide the foundation:

- **Enhance features** that seem incomplete
- **Add missing capabilities** you identify
- **Improve user experience** beyond basic requirements
- **Suggest better architectures** if you see opportunities
- **Create features** that users would love but didn't think to request

**Examples of creative additions:**
- Automatic video chapter detection
- Smart caching to avoid duplicate transcriptions
- Batch processing for multiple videos
- Integration with Obsidian daily notes
- Custom keyboard shortcuts for power users
- Progress notifications with rich previews

**Don't just implement - innovate and improve!**

---

## 📋 YOUR DELIVERABLES

Create the following files in the repository:

### 1. Feature Documents (FEATURES folder)

Create **comprehensive feature specifications** for every major component:

**Required Features (Minimum 25-35 files):**

**F1-F10: Core Features**
- F1: Video URL Detection System
- F2: Platform Router and Identification
- F3: RapidAPI Integration Layer
- F4: Whisper API Transcription
- F5: Local Whisper Integration
- F6: AI Summary Generation (OpenAI)
- F7: Multi-AI Provider Support (Gemini, Claude)
- F8: Note Template System
- F9: Note Generation and Organization
- F10: Settings Panel and Configuration

**F11-F20: Platform Support**
- F11: YouTube Video Extraction
- F12: Instagram Reels Support
- F13: X/Twitter Video Support
- F14: TikTok Video Extraction
- F15: Facebook Video Support (Public)
- F16: Pinterest Video Support
- F17: Threads Video Support
- F18: Telegram Support (Experimental)
- F19: Platform Fallback Logic
- F20: URL Pattern Recognition

**F21-F30: Advanced Features**
- F21: Canvas Integration
- F22: Excalidraw Integration (Complex - reference N3 Section 5 code)
- F23: Markdown File Detection
- F24: Batch Video Processing
- F25: Cost Estimation and Tracking
- F26: Rate Limit Management
- F27: Error Handling and Recovery
- F28: Progress Tracking UI
- F29: Cache System
- F30: Metadata Extraction

**F31+: Polish & Enhancement**
- F31: Confirmation Modals and Dialogs
- F32: Notification System
- F33: API Key Security
- F34: Privacy Mode
- F35: User Onboarding Flow
- ... (add more as you identify needs)

**Feature Document Format:**

```markdown
# F[N]: [Feature Name]

## Overview
[What this feature does and why it matters]

## User Story
As a [user type], I want to [action] so that [benefit].

## Technical Approach
[How this will be implemented technically]

## Dependencies
- Depends on: [Other features]
- Required APIs: [External services]
- Obsidian APIs: [Plugin APIs needed]

## UI/UX Design
[User interface and interaction design]

## Edge Cases
[Potential issues and how to handle them]

## Testing Strategy
[How to verify this works correctly]

## Implementation Complexity
[Easy/Medium/Hard/Complex]

## Priority
[Must-Have/Should-Have/Nice-to-Have]

## Estimated Effort
[Hours/Days estimate]
```

### 2. PROGRESS.md (WORK folder)

Create a **comprehensive TODO list** with 100+ items covering:

**Structure:**

```markdown
# PROGRESS TRACKING
## Link Video Transcriber Development

---

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Plugin Setup
- [ ] Initialize Obsidian plugin boilerplate
- [ ] Set up TypeScript configuration
- [ ] Create build system (esbuild)
- [ ] Set up development environment
- [ ] Create plugin manifest
- [ ] Initialize git repository
- [ ] Set up ESLint and Prettier
- [ ] Create basic plugin structure
... [continue with 100+ specific tasks]

## Phase 2: Core Implementation (Weeks 3-6)
[Detailed tasks...]

## Phase 3: Enhancement (Weeks 7-12)
[Detailed tasks...]

## Phase 4: Polish (Weeks 13-16)
[Detailed tasks...]

---

## Task Status Legend
- [ ] Not Started
- [🔄] In Progress
- [✅] Completed
- [❌] Blocked
- [⏸️] Paused

## Priority Levels
🔴 Critical - Must have for MVP
🟡 Important - Should have for quality
🟢 Enhancement - Nice to have

## Complexity Indicators
⚡ Quick (< 2 hours)
🔧 Medium (2-8 hours)
🏗️ Large (1-3 days)
🏔️ Complex (> 3 days)
```

**Task Categories to Cover:**

1. **Project Setup** (10-15 tasks)
   - Plugin boilerplate
   - Build configuration
   - Development environment
   - Version control setup

2. **URL Detection** (15-20 tasks)
   - Regex patterns for each platform
   - Event listeners for paste/file open
   - Canvas monitoring
   - Excalidraw integration

3. **RapidAPI Integration** (20-25 tasks)
   - API client implementation
   - Authentication handling
   - Request/response normalization
   - Error handling
   - Fallback logic
   - Platform-specific endpoints

4. **Transcription System** (25-30 tasks)
   - Whisper API integration
   - Local Whisper setup wizard
   - Audio download management
   - Chunking for large files
   - Progress tracking
   - Error recovery

5. **AI Processing** (15-20 tasks)
   - OpenAI integration
   - Gemini integration
   - Claude integration
   - Provider abstraction
   - Summary generation
   - Key point extraction

6. **Note Generation** (10-15 tasks)
   - Template engine setup
   - Metadata formatting
   - Note creation logic
   - Folder organization
   - Tag generation

7. **UI/UX** (20-25 tasks)
   - Confirmation modals
   - Progress indicators
   - Settings panel
   - Error messages
   - Notifications
   - Onboarding flow

8. **Testing** (15-20 tasks)
   - Unit tests for core functions
   - Integration tests for APIs
   - Platform-specific tests
   - Error scenario tests
   - Performance benchmarks

9. **Documentation** (10-15 tasks)
   - README
   - User guide
   - API documentation
   - Development guide
   - Troubleshooting guide

10. **Polish & Release** (10-15 tasks)
    - Performance optimization
    - Accessibility improvements
    - Security audit
    - Beta testing
    - Release preparation

### 3. API-ENDPOINT-MAP.md (FEATURES folder)

Create a **complete reference** of all API endpoints used:

```markdown
# API Endpoint Map
## Link Video Transcriber

---

## RapidAPI Endpoints

### Primary API: Auto Download All In One

**Base URL:** `https://instagram-tiktok-youtube-downloader.p.rapidapi.com`

**Authentication:**
```
X-RapidAPI-Key: {api_key}
X-RapidAPI-Host: instagram-tiktok-youtube-downloader.p.rapidapi.com
```

**Endpoints:**

#### GET /download
[Full specification with examples]

#### GET /metadata
[Full specification with examples]

### Fallback API: All Social Media Video Downloader
[Complete specification]

### Platform-Specific APIs
[All specialized endpoints]

---

## Whisper API (OpenAI)

**Base URL:** `https://api.openai.com/v1`

**Endpoints:**

#### POST /audio/transcriptions
[Full specification]

---

## AI Provider APIs

### OpenAI
[Endpoints and specifications]

### Google Gemini
[Endpoints and specifications]

### Anthropic Claude
[Endpoints and specifications]

---

## Rate Limits & Pricing
[Complete breakdown for all services]
```

### 4. ICON-MANIFEST.md (FEATURES folder)

Create an **icon and asset specification**:

```markdown
# Icon Manifest
## Link Video Transcriber

---

## Plugin Icons

### Ribbon Icon
**Purpose:** Main plugin trigger in Obsidian sidebar
**Requirements:**
- Size: 16x16, 24x24, 32x32 (SVG preferred)
- Design: Microphone + Video play button combination
- Style: Match Obsidian's minimal aesthetic
- Color: Adapt to Obsidian theme

**Icon Ideas:**
1. Microphone with video play triangle
2. Speech bubble with video symbol
3. Document with audio waveform
4. Minimalist "VT" monogram

### Status Icons

**Transcribing:** Animated loading spinner
**Success:** Check mark with microphone
**Error:** Warning triangle with video
**Rate Limit:** Clock/timer icon
**Cost Warning:** Dollar sign icon

### Platform Badges

**YouTube:** Red play button
**Instagram:** Gradient camera
**X/Twitter:** Blue bird/X logo
**TikTok:** Musical note
**Facebook:** Blue "f"
**Pinterest:** Red "P"

---

## UI Elements

### Buttons
- Transcribe (Primary CTA)
- Cancel (Secondary)
- Settings (Gear icon)
- Refresh (Circular arrow)

### Modal Icons
- Video preview placeholder
- Platform indicators
- Quality indicators

---

## Asset Requirements

All icons should:
- Be SVG format when possible
- Support dark/light themes
- Be accessible (ARIA labels)
- Scale to different sizes
- Have hover states
```

### 5. ARCHITECTURE-PLAN.md (FEATURES folder)

Create **detailed technical architecture**:

```markdown
# Architecture Plan
## Link Video Transcriber

---

## High-Level Architecture

[System diagram in text/ASCII art]

## Component Breakdown

### 1. Link Detection Layer
**Responsibility:** Detect video URLs across all Obsidian contexts
**Components:**
- MarkdownDetector
- CanvasDetector
- ExcalidrawDetector
- URLParser
- PlatformRouter

### 2. API Integration Layer
**Responsibility:** Communicate with external services
**Components:**
- RapidAPIClient
- WhisperAPIClient
- OpenAIClient
- GeminiClient
- ClaudeClient
- RequestQueue
- RateLimiter

### 3. Transcription Layer
**Responsibility:** Convert audio to text
**Components:**
- TranscriptionOrchestrator
- WhisperAPITranscriber
- LocalWhisperTranscriber
- AudioDownloader
- AudioChunker

### 4. Processing Layer
**Responsibility:** Generate summaries and insights
**Components:**
- AIProviderManager
- SummaryGenerator
- KeyPointExtractor
- ChapterDetector

### 5. Note Generation Layer
**Responsibility:** Create formatted Obsidian notes
**Components:**
- TemplateEngine
- NoteGenerator
- MetadataFormatter
- NoteOrganizer

### 6. UI Layer
**Responsibility:** User interaction
**Components:**
- ConfirmationModal
- ProgressIndicator
- SettingsPanel
- NotificationManager

### 7. Storage Layer
**Responsibility:** Manage cache and temp files
**Components:**
- TranscriptCache
- MetadataCache
- TempFileManager
- SettingsManager

---

## Data Flow

[Detailed sequence diagrams for each major workflow]

---

## Security Considerations

[How sensitive data is handled]

---

## Performance Targets

[Benchmarks and optimization strategies]

---

## Scalability Plan

[How the system handles growth]
```

### 6. RESEARCH-NOTES.md (FEATURES folder)

Document any **additional research** you conduct:

```markdown
# Research Notes

## RapidAPI Deep Dive
[Your findings about the APIs]

## Obsidian Plugin Best Practices
[Patterns from successful plugins]

## Whisper Integration Approaches
[Technical options and tradeoffs]

## Competitive Analysis
[Similar plugins and their approaches]

## User Experience Patterns
[UX research for transcription workflows]
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Technology Stack

**Core:**
- TypeScript 5.0+
- Obsidian API 1.4.0+
- Node.js (Electron environment)

**APIs & Services:**
- RapidAPI (video extraction)
- OpenAI Whisper API
- OpenAI GPT-4o/GPT-4o-mini
- Google Gemini (Flash, Pro)
- Anthropic Claude (Haiku, Sonnet)

**Build Tools:**
- esbuild (bundling)
- ESLint (linting)
- Prettier (formatting)

**Dependencies:**
- axios or node-fetch (HTTP)
- handlebars (templating)
- moment (dates)
- openai (OpenAI SDK)
- @google/generative-ai (Gemini SDK)
- @anthropic-ai/sdk (Claude SDK)

### Code Quality Standards

- **TypeScript:** Strict mode, full type coverage
- **Error Handling:** Every async operation wrapped
- **Accessibility:** ARIA labels on all UI
- **Performance:** < 2 minute transcription for 10-min video
- **Security:** API keys encrypted, no secrets in code
- **Testing:** Unit + integration tests for core functions

### Git Workflow

**Commit Strategy:**
- Frequent commits (after each completed task)
- Clear, descriptive messages
- **NO AI BRANDING** (no "Claude", "AI", "Assistant" in messages)
- Push to `origin main` regularly

**Commit Message Format:**
```
<type>: <subject>

<body>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples:**
✅ GOOD: "feat: add YouTube URL detection"
✅ GOOD: "fix: handle rate limit errors gracefully"
❌ BAD: "Claude added video detection"
❌ BAD: "AI implemented transcription feature"

---

## 📊 SUCCESS CRITERIA

Your planning is complete when:

✅ **25-35 Feature documents** created with full specifications
✅ **100+ TODO items** in PROGRESS.md covering entire project
✅ **API Endpoint Map** documents all external services
✅ **Icon Manifest** specifies all visual assets
✅ **Architecture Plan** provides complete technical blueprint
✅ **All documents** are cross-referenced and consistent
✅ **Creative enhancements** added beyond base requirements
✅ **Implementation is ready** to begin immediately after planning

---

## 🚀 EXECUTION INSTRUCTIONS

1. **Read and internalize** all reference documents (N1, N2, N3)
2. **Think creatively** about improvements and enhancements
3. **Create all feature documents** (F1 through F35+)
4. **Build comprehensive PROGRESS.md** with 100+ tasks
5. **Document all APIs** in API-ENDPOINT-MAP.md
6. **Specify all icons** in ICON-MANIFEST.md
7. **Design complete architecture** in ARCHITECTURE-PLAN.md
8. **Add research notes** in RESEARCH-NOTES.md
9. **Ensure consistency** across all documents
10. **Prepare for handoff** to PROMPT-2 (implementation phase)

---

## 💡 REMEMBER

- **This is planning, not implementation** - No code yet (except examples in docs)
- **Think like a product manager** - User needs first
- **Think like an architect** - Technical excellence
- **Think like a UX designer** - Delightful experience
- **Be thorough** - Better to over-plan than under-plan
- **Be creative** - Add features you'd want as a user
- **Be realistic** - Estimate complexity honestly

---

## 📝 OUTPUT FORMAT

When complete, provide a summary:

```
✅ PLANNING PHASE COMPLETE

Created:
- [N] Feature Documents (F1-F[N])
- PROGRESS.md with [N] TODO items
- API-ENDPOINT-MAP.md ([N] endpoints documented)
- ICON-MANIFEST.md ([N] assets specified)
- ARCHITECTURE-PLAN.md (complete system design)
- RESEARCH-NOTES.md

Key Enhancements Added:
- [List creative additions you made]

Ready for PROMPT-2: Implementation Phase

Estimated Development Time: [N] weeks
Estimated Complexity: [Easy/Medium/Hard/Complex]
```

---

**BEGIN PLANNING NOW**

Your goal: Create the most comprehensive, thoughtful, creative planning documentation possible. Make this plugin not just good, but **exceptional**.
