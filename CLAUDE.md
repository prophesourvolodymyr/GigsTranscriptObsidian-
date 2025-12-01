# CLAUDE.md - AI Assistant Guide
## GigsTranscriptObsidian (Link Video Transcriber)

**Last Updated:** 2025-12-01
**Repository Version:** Early Development
**Purpose:** Comprehensive guide for AI assistants working with this codebase

---

## 🎯 Project Overview

### What This Project Is

**Link Video Transcriber** is an Obsidian plugin that automatically detects video links from any platform (YouTube, Instagram, X/Twitter, TikTok, Facebook, Telegram, etc.), downloads and transcribes them using Whisper (API or local), and generates comprehensive notes with AI-powered summaries.

**Key Innovation:** Detection across ALL Obsidian contexts:
- Markdown files
- Canvas boards
- Excalidraw drawings

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

### Technology Stack

**Core:**
- TypeScript 5.0+
- Obsidian API 1.4.0+
- Node.js (Electron environment)

**APIs & Services:**
- RapidAPI (video extraction - unified API marketplace)
- OpenAI Whisper API (transcription)
- OpenAI GPT-4o/GPT-4o-mini (AI processing)
- Google Gemini (Flash, Pro)
- Anthropic Claude (Haiku, Sonnet)

**Build Tools:**
- esbuild (bundling)
- ESLint (linting)
- Prettier (formatting)

---

## 📁 Repository Structure

```
GigsTranscriptObsidian-/
├── .obsidian/                    # Obsidian vault configuration
│   ├── plugins/                  # Community plugins used in this vault
│   │   ├── obsitermishell/       # Terminal integration
│   │   ├── obsidian-excalidraw-plugin/
│   │   ├── obsidian-kanban/
│   │   └── ... (other plugins)
│   ├── app.json                  # Obsidian app settings
│   └── core-plugins.json         # Core plugin config
│
├── NOTES/                        # Raw ideas and research
│   ├── IDEA Main/                # Core project ideas
│   │   ├── N1 Project overview..md       # Original concept
│   │   ├── N2 Link Video Transcriber White Paper.md  # 8,000+ word technical analysis
│   │   └── N3 RapidAPI Integration Architecture.md   # 32,000+ word definitive spec
│   └── PROMPTS/                  # Structured prompts for AI assistants
│       ├── PROMPT-1-PLANNING.md          # Phase 1: General Planning
│       ├── PROMPT-2-IMPLEMENTATION.md    # Phase 2: Implementation
│       ├── PROMPT-3-REFINEMENT.md        # Phase 3: Refinement
│       └── PROMPT-4-EXCELLENCE.md        # Phase 4: Excellence
│
├── FEATURES/                     # Feature specifications (F1, F2, F3, ...)
│   └── START WITH f1 when naming the theme.md
│
├── INSTRUCTIONS/                 # Development guides and workflows
│   ├── CODEBASE-Quick Start.md           # Quick start for AI assistants
│   ├── PROJECT-INIT-GUIDE.md             # New repo initialization
│   ├── GIT GUIDE.md                      # Git workflow conventions
│   ├── LINEAR_SYNC.md                    # Linear integration
│   ├── Notes Idea Sync.md                # Note synchronization
│   ├── PROMPTS WORKFLOW IDEA.md          # Prompt workflow documentation
│   └── vRELEASE.md                       # Release process
│
├── WORK/                         # Active working documents
│   ├── PROGRESS.md                       # Main progress tracker (UPDATE THIS!)
│   ├── GENERAL-AI-GUIDE.md               # General AI guidance
│   ├── USER GUIDE.md                     # User-facing guide (Obsitermishell)
│   └── USER TODO.md                      # User-focused todos
│
├── Automation.md                 # Automation scripts/workflows
├── README.md                     # Project README
└── CLAUDE.md                     # This file

```

---

## 🗺️ Navigation Guide

### Where to Find Information

| Need | Location | Description |
|------|----------|-------------|
| **Project Overview** | `NOTES/IDEA Main/N1 Project overview..md` | Original raw idea and vision |
| **Technical Specification** | `NOTES/IDEA Main/N2...md` & `N3...md` | Complete technical analysis (33,000+ words) |
| **Current Tasks** | `WORK/PROGRESS.md` | Main progress tracker - UPDATE THIS! |
| **Feature Specs** | `FEATURES/F*.md` | Individual feature specifications |
| **Development Workflow** | `INSTRUCTIONS/` | All guides and procedures |
| **AI Work Phases** | `NOTES/PROMPTS/` | Structured prompts for each phase |
| **Quick Start** | `INSTRUCTIONS/CODEBASE-Quick Start.md` | Fast onboarding for AI assistants |
| **User Documentation** | `WORK/USER GUIDE.md` | End-user documentation |

### Key Reference Documents

1. **N1: Project Overview** - The original concept
2. **N2: White Paper** - 8,000+ word technical analysis with local extraction approach
3. **N3: RapidAPI Architecture** - 32,000+ word definitive spec (supersedes N2 extraction method)
   - Complete platform coverage (10+ platforms)
   - System architecture diagrams
   - Excalidraw integration with full implementation code
   - Cost analysis and pricing models
   - 16-week implementation roadmap
   - Security and privacy considerations

---

## 🔧 Development Conventions

### Feature Naming Convention

**Features are numbered sequentially starting with F1:**

```
F1: Video URL Detection System
F2: Platform Router and Identification
F3: RapidAPI Integration Layer
F4: Whisper API Transcription
...
F35+: Additional features
```

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

### Note Naming Convention

**Reference notes are numbered N1, N2, N3, etc.:**

- N1: Initial ideas and overview
- N2: Detailed white papers
- N3: Comprehensive specifications

### Prompt Workflow

The project uses a **4-phase structured approach** for AI-assisted development:

1. **PROMPT-1: PLANNING** - Create comprehensive planning documentation (25-35 feature docs, 100+ TODOs)
2. **PROMPT-2: IMPLEMENTATION** - Build the core functionality based on plans
3. **PROMPT-3: REFINEMENT** - Polish, optimize, and improve
4. **PROMPT-4: EXCELLENCE** - Final touches, testing, and release preparation

**Location:** `NOTES/PROMPTS/PROMPT-[N]-[PHASE].md`

---

## 🔄 Development Workflow

### Phase-Based Development

```
PHASE 1: PLANNING (Current Focus)
├── Read all reference documents (N1, N2, N3)
├── Create feature specifications (F1-F35+)
├── Build comprehensive TODO list (100+ items)
├── Document all APIs and endpoints
├── Design complete architecture
└── Prepare for implementation handoff

PHASE 2: IMPLEMENTATION
├── Set up plugin boilerplate
├── Implement core features (F1-F10)
├── Add platform support (F11-F20)
├── Build advanced features (F21-F30)
└── Create UI/UX components

PHASE 3: REFINEMENT
├── Fix bugs and edge cases
├── Optimize performance
├── Improve error handling
├── Enhance user experience
└── Add polish and animations

PHASE 4: EXCELLENCE
├── Comprehensive testing
├── Security audit
├── Accessibility improvements
├── Documentation completion
└── Release preparation
```

### Git Workflow

**Commit Strategy:**
- Frequent commits (after each completed task)
- Clear, descriptive messages
- **CRITICAL: NO AI BRANDING** (no "Claude", "AI", "Assistant" in commit messages)
- Push to `origin main` regularly

**Commit Message Format:**
```
<type>: <subject>

<body>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples:**

✅ **GOOD:**
```
feat: add YouTube URL detection
fix: handle rate limit errors gracefully
docs: update API endpoint documentation
```

❌ **BAD:**
```
Claude added video detection
AI implemented transcription feature
Assistant fixed the bug
```

### Progress Tracking

**ALWAYS update `WORK/PROGRESS.md` after completing tasks!**

Use these status indicators:
- `[ ]` Not Started
- `[🔄]` In Progress
- `[✅]` Completed
- `[❌]` Blocked
- `[⏸️]` Paused

Priority levels:
- 🔴 Critical - Must have for MVP
- 🟡 Important - Should have for quality
- 🟢 Enhancement - Nice to have

Complexity indicators:
- ⚡ Quick (< 2 hours)
- 🔧 Medium (2-8 hours)
- 🏗️ Large (1-3 days)
- 🏔️ Complex (> 3 days)

---

## 🏗️ Architecture Overview

### Key Architectural Decisions

1. **RapidAPI** for video extraction (not local tools like yt-dlp)
2. **Dual Whisper** support (API + Local)
3. **Multi-AI** providers for flexibility (OpenAI, Gemini, Claude)
4. **Template system** for customizable note generation
5. **Three-tier API** strategy (Primary → Fallback → Specialized)

### Component Layers

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer                            │
│  (Modals, Progress, Settings, Notifications)            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                Link Detection Layer                      │
│  (Markdown, Canvas, Excalidraw Detection)               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              API Integration Layer                       │
│  (RapidAPI, Whisper, OpenAI, Gemini, Claude)           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│             Transcription Layer                          │
│  (Whisper API, Local Whisper, Audio Processing)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Processing Layer                            │
│  (AI Summary, Key Points, Chapter Detection)           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Note Generation Layer                          │
│  (Templates, Formatting, Organization)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│               Storage Layer                              │
│  (Cache, Metadata, Settings, Temp Files)               │
└─────────────────────────────────────────────────────────┘
```

### Platform Support (Phase 1)

- ✅ YouTube (99% confidence)
- ✅ Instagram Reels (85% confidence)
- ✅ X/Twitter (95% confidence - major win!)
- ✅ TikTok (90% confidence)
- ✅ Facebook (Public videos)
- ✅ Pinterest, Threads (Bonus)
- ⚠️ Telegram (Experimental)

---

## 💻 Code Quality Standards

### TypeScript Style

- **Strict mode enabled** (`strict: true`)
- **Full type coverage** - No `any` types without justification
- **Prefer interfaces** over types for public APIs
- **Use async/await** over raw Promises
- **Event handlers**: Arrow functions to preserve `this` context

### Naming Conventions

- **Classes**: PascalCase (e.g., `TerminalView`, `VideoExtractor`)
- **Methods**: camelCase (e.g., `spawnTerminal`, `detectVideoUrl`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `VIEW_TYPE_TERMINAL`, `MAX_RETRIES`)
- **Private members**: Prefix with `_` (e.g., `_ptyProcess`, `_apiClient`)

### Error Handling

- **Always handle errors** - Every async operation wrapped in try/catch
- **User-friendly messages** - Show clear, actionable errors to users
- **Logging** - Console.error with context for debugging
- **Graceful degradation** - Plugin shouldn't crash on single failures
- **Rate limit handling** - Exponential backoff and user notification

### Security Best Practices

- **API keys encrypted** - Never store in plain text
- **No secrets in code** - Use environment variables or secure storage
- **Validate inputs** - Sanitize all user-provided data
- **No arbitrary code execution** from markdown
- **Privacy mode** - Option to avoid cloud services
- **Secure temp files** - Clean up after processing

### Performance Targets

- **< 2 minutes** transcription for 10-minute video (Whisper API)
- **< 100ms** URL detection latency
- **< 500ms** modal display time
- **Efficient caching** - Don't re-transcribe same videos
- **Lazy loading** - Only load components when needed

---

## 🧪 Testing Strategy

### Testing Categories

1. **Unit Tests** - Core functions and utilities
2. **Integration Tests** - API interactions and workflows
3. **Platform Tests** - Each video platform individually
4. **Error Scenario Tests** - Rate limits, network failures, invalid URLs
5. **Performance Benchmarks** - Transcription speed, memory usage

### Test Checklist

**URL Detection:**
- [ ] Detects YouTube URLs in markdown
- [ ] Detects Instagram URLs in Canvas
- [ ] Detects TikTok URLs in Excalidraw
- [ ] Handles multiple URLs in single document
- [ ] Ignores non-video URLs

**RapidAPI Integration:**
- [ ] Successful video extraction
- [ ] Fallback logic works
- [ ] Rate limit handling
- [ ] Error recovery
- [ ] Platform-specific edge cases

**Transcription:**
- [ ] Whisper API transcription
- [ ] Local Whisper integration
- [ ] Audio chunking for large files
- [ ] Progress tracking accuracy
- [ ] Error handling for failed transcriptions

**AI Processing:**
- [ ] OpenAI summary generation
- [ ] Gemini integration
- [ ] Claude integration
- [ ] Provider switching
- [ ] Cost estimation accuracy

**Note Generation:**
- [ ] Template rendering
- [ ] Metadata formatting
- [ ] Folder organization
- [ ] Tag generation
- [ ] Duplicate handling

---

## 🎨 UI/UX Guidelines

### Design Principles

1. **Minimal Friction** - One click to transcribe after pasting link
2. **Transparency** - Show cost estimates and progress
3. **Forgiveness** - Undo/cancel operations, confirm destructive actions
4. **Accessibility** - ARIA labels, keyboard navigation, screen reader support
5. **Consistency** - Match Obsidian's design language

### Modal Design

**Confirmation Modal:**
```
┌─────────────────────────────────────────┐
│  Transcribe Video?                      │
├─────────────────────────────────────────┤
│  [Video Thumbnail]                      │
│                                         │
│  Title: "Amazing Video Title"           │
│  Platform: YouTube                      │
│  Duration: 10:24                        │
│  Estimated Cost: $0.05                  │
│                                         │
│  [ Cancel ]  [ Transcribe → ]           │
└─────────────────────────────────────────┘
```

**Progress Indicator:**
```
┌─────────────────────────────────────────┐
│  Transcribing Video...                  │
├─────────────────────────────────────────┤
│  ✓ Video downloaded                     │
│  ⏳ Transcribing audio... 67%           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  ⏸ Generating summary...                │
│  ⏸ Creating note...                     │
│                                         │
│  [ Cancel ]                             │
└─────────────────────────────────────────┘
```

---

## 🚨 Common Pitfalls & Solutions

### Issue: API Rate Limits

**Problem:** Too many requests to RapidAPI or Whisper API
**Solution:**
- Implement request queue with rate limiting
- Show user-friendly "rate limit reached" messages
- Suggest waiting or upgrading plan
- Cache results to avoid duplicate requests

### Issue: Large Video Files

**Problem:** Videos too large for Whisper API (25MB limit)
**Solution:**
- Chunk audio into segments
- Process in parallel when possible
- Show progress for each chunk
- Reassemble transcript in correct order

### Issue: Platform URL Changes

**Problem:** Video platforms change URL patterns
**Solution:**
- Use flexible regex patterns
- Log unmatched URLs for analysis
- Easy configuration for pattern updates
- Test suite with real URLs

### Issue: Obsidian Context Detection

**Problem:** Missing video URLs in Canvas or Excalidraw
**Solution:**
- Listen to appropriate Obsidian events
- Parse JSON structures for embedded content
- Test across all three contexts regularly
- See N3 Section 5 for Excalidraw implementation code

### Issue: API Key Security

**Problem:** Storing API keys securely in Obsidian
**Solution:**
- Use Obsidian's built-in secure storage
- Never log API keys
- Validate keys on settings save
- Clear keys on plugin uninstall option

---

## 📚 Essential Resources

### Obsidian Development

- **Obsidian Plugin Docs:** https://docs.obsidian.md/Plugins/Getting+started
- **Obsidian API Types:** https://github.com/obsidianmd/obsidian-api
- **Sample Plugins:** https://github.com/obsidianmd/obsidian-sample-plugin

### API Documentation

- **RapidAPI Marketplace:** https://rapidapi.com/
- **OpenAI Whisper API:** https://platform.openai.com/docs/api-reference/audio
- **OpenAI GPT API:** https://platform.openai.com/docs/api-reference/chat
- **Google Gemini:** https://ai.google.dev/docs
- **Anthropic Claude:** https://docs.anthropic.com/

### Tools & Libraries

- **esbuild:** https://esbuild.github.io/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **node-fetch:** https://github.com/node-fetch/node-fetch
- **axios:** https://axios-http.com/docs/intro

---

## 🎯 Getting Started as an AI Assistant

### First Steps

1. **Read this document** thoroughly
2. **Read reference documents** in this order:
   - `NOTES/IDEA Main/N1 Project overview..md`
   - `INSTRUCTIONS/CODEBASE-Quick Start.md`
   - `NOTES/PROMPTS/PROMPT-1-PLANNING.md` (for current phase)
3. **Check current status** in `WORK/PROGRESS.md`
4. **Understand the workflow** from the phase you're in
5. **Begin work** following the structured approach

### When You Start a Task

1. **Update** `WORK/PROGRESS.md` to mark task as `[🔄] In Progress`
2. **Read** relevant feature specifications (F#)
3. **Plan** your approach before coding
4. **Implement** following code quality standards
5. **Test** your implementation
6. **Commit** with clear, non-AI-branded messages
7. **Update** `WORK/PROGRESS.md` to mark task as `[✅] Completed`

### When You're Stuck

1. **Check** reference documents (N1, N2, N3) for guidance
2. **Review** similar implementations in FEATURES/
3. **Consult** this CLAUDE.md for conventions
4. **Ask** the user for clarification if needed
5. **Document** the blocker in PROGRESS.md with `[❌]`

### Creative Freedom

You are **encouraged to think beyond the specifications**:
- Enhance features that seem incomplete
- Add missing capabilities you identify
- Improve user experience beyond basic requirements
- Suggest better architectures if you see opportunities
- Create features that users would love

**Examples:**
- Automatic video chapter detection
- Smart caching to avoid duplicate transcriptions
- Batch processing for multiple videos
- Integration with Obsidian daily notes
- Custom keyboard shortcuts for power users

---

## 🔐 Security & Privacy

### Sensitive Data Handling

**API Keys:**
- Store using Obsidian's secure storage API
- Never log keys (even partially)
- Validate before using
- Option to clear on uninstall

**Video Content:**
- Clean up temp files after processing
- Don't cache sensitive videos without permission
- Privacy mode: Skip AI processing if requested
- Local Whisper option for complete privacy

**User Data:**
- Minimal data collection
- No telemetry without explicit consent
- Clear data retention policies
- Easy data export/deletion

---

## 📈 Performance Optimization

### Optimization Strategies

1. **Lazy Loading** - Load components only when needed
2. **Efficient Caching** - Cache transcripts, metadata, API responses
3. **Parallel Processing** - Process multiple chunks simultaneously
4. **Debouncing** - Don't trigger detection on every keystroke
5. **Resource Cleanup** - Clear temp files and cancel pending requests

### Memory Management

- Clean up event listeners on plugin unload
- Clear caches periodically (configurable)
- Stream large files instead of loading into memory
- Cancel in-progress operations when user navigates away

---

## 🐛 Debugging Tips

### Enable Debug Logging

Add debug mode in settings to show:
- API request/response details
- URL detection triggers
- Transcription progress
- Performance metrics

### Common Debug Scenarios

**URL Not Detected:**
1. Check regex patterns match URL format
2. Verify event listeners are registered
3. Test in all three contexts (Markdown, Canvas, Excalidraw)

**Transcription Fails:**
1. Verify API key is valid
2. Check audio file format compatibility
3. Ensure file size within limits
4. Review rate limit status

**Note Not Created:**
1. Check template syntax
2. Verify vault permissions
3. Ensure target folder exists
4. Review metadata formatting

---

## 📝 Documentation Requirements

### What to Document

**In Code:**
- Public APIs and interfaces
- Complex algorithms and logic
- Non-obvious decisions
- Security considerations
- Performance implications

**In Feature Specs:**
- User stories and workflows
- Technical approach
- Edge cases and handling
- Testing strategies

**In README:**
- Installation instructions
- Quick start guide
- Feature overview
- Troubleshooting

---

## ✅ Definition of Done

A task is complete when:

- ✅ Implementation matches feature specification
- ✅ Code follows style guide and conventions
- ✅ Error handling is comprehensive
- ✅ Edge cases are handled
- ✅ Performance is acceptable
- ✅ Security is maintained
- ✅ Accessibility is preserved
- ✅ Tests pass (when applicable)
- ✅ Documentation is updated
- ✅ Commit message is clear and non-AI-branded
- ✅ `WORK/PROGRESS.md` is updated

---

## 🎓 Learning Resources

### Understanding Obsidian Plugins

**Key Concepts:**
- Plugin lifecycle (onload, onunload)
- View types and custom views
- Event system and listeners
- Settings and configuration
- Workspace and file management
- Modal and notice UI components

### Understanding Video Processing

**Key Concepts:**
- Video streaming protocols
- Audio extraction and formats
- Transcription APIs and accuracy
- Chunking strategies for large files
- Rate limiting and quotas
- Cost optimization

---

## 🚀 Quick Command Reference

### Useful Obsidian API Commands

```typescript
// Get vault root
this.app.vault.adapter.getBasePath()

// Create new file
this.app.vault.create(path, content)

// Read file
this.app.vault.read(file)

// Listen to events
this.registerEvent(this.app.workspace.on('file-open', callback))

// Show notice
new Notice('Message here')

// Open modal
new SampleModal(this.app).open()

// Get active file
this.app.workspace.getActiveFile()

// Get metadata
this.app.metadataCache.getFileCache(file)
```

---

## 📋 Checklists

### Before Starting Work

- [ ] Read this CLAUDE.md completely
- [ ] Review relevant reference docs (N1, N2, N3)
- [ ] Check current phase in PROMPTS/
- [ ] Review WORK/PROGRESS.md for context
- [ ] Understand the current task's feature spec
- [ ] Plan your approach

### Before Committing

- [ ] Code follows style guide
- [ ] Error handling is complete
- [ ] Security considerations addressed
- [ ] Performance is acceptable
- [ ] No console.log statements left
- [ ] No commented-out code
- [ ] Commit message is clear and non-AI-branded
- [ ] WORK/PROGRESS.md is updated

### Before Pushing

- [ ] All tests pass
- [ ] No merge conflicts
- [ ] Branch is up to date
- [ ] Documentation is current
- [ ] No secrets in code
- [ ] Feature specifications updated if needed

---

## 🎁 Tips for Success

### Do's

✅ **READ** reference documents thoroughly before starting
✅ **UPDATE** PROGRESS.md frequently
✅ **COMMIT** often with clear messages
✅ **TEST** your implementations
✅ **DOCUMENT** complex logic
✅ **ASK** when requirements are unclear
✅ **INNOVATE** beyond basic specifications
✅ **THINK** about user experience
✅ **CONSIDER** edge cases and errors
✅ **OPTIMIZE** for performance

### Don'ts

❌ **DON'T** use AI branding in commits ("Claude added...", "AI implemented...")
❌ **DON'T** skip error handling
❌ **DON'T** hardcode values that should be configurable
❌ **DON'T** ignore security considerations
❌ **DON'T** leave debug code or console.logs
❌ **DON'T** implement without understanding the spec
❌ **DON'T** forget to update documentation
❌ **DON'T** create features without user value
❌ **DON'T** sacrifice code quality for speed
❌ **DON'T** assume - verify and test

---

## 📞 Getting Help

### When You Need Clarification

1. **Check** this CLAUDE.md first
2. **Review** reference documents (N1, N2, N3)
3. **Read** the phase-specific prompt (PROMPT-[N])
4. **Consult** feature specifications
5. **Ask** the user with specific questions

### Reporting Issues

When encountering problems:
1. Describe what you were trying to do
2. Show what happened (error messages, unexpected behavior)
3. Explain what you expected to happen
4. List what you've tried so far
5. Ask specific questions about how to proceed

---

## 🎉 You're Ready!

You now have a comprehensive understanding of:
- ✅ Project purpose and goals
- ✅ Repository structure and organization
- ✅ Development workflow and phases
- ✅ Code quality standards and conventions
- ✅ Architecture and design patterns
- ✅ Testing and debugging strategies
- ✅ Security and privacy considerations
- ✅ Documentation requirements

**Your mission:** Help build an exceptional Obsidian plugin that transforms how users interact with video content in their knowledge management workflow.

**Remember:** Be thorough, be creative, be thoughtful. Make something users will love.

**Good luck and happy coding!** 🚀

---

**Last Updated:** 2025-12-01
**Version:** 1.0.0
**Maintained By:** Project Team
**Questions?** Check the INSTRUCTIONS/ folder or ask the user
