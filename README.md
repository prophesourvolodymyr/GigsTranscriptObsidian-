# Link Video Transcriber

[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple)](https://obsidian.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Transform video links into beautifully formatted, searchable transcripts directly in your Obsidian vault.

Link Video Transcriber automatically detects video URLs in your notes, extracts audio, transcribes content using AI, and generates comprehensive notes with summaries, key points, and timestamps.

## ✨ Features

### 🎥 Multi-Platform Support
- **YouTube** (Videos, Shorts, Livestreams)
- **Instagram** (Reels, IGTV)
- **TikTok** (Videos)
- **X/Twitter** (Video posts)
- **Facebook** (Watch videos, Reels)
- **Pinterest** (Video pins)
- **Threads** (Video posts)
- **Telegram** (Channel videos)
- **Local Files** (MP4, MOV, AVI, MKV, WEBM, M4V, FLV, WMV)

### 🤖 AI-Powered Transcription
- **OpenAI Whisper API** - High-accuracy cloud transcription
- **Local Whisper** - Privacy-focused offline transcription (planned)
- **Smart chunking** for long videos (handles 25MB+ audio files)
- **Multi-language support** with automatic detection

### 📝 Intelligent Summaries
- **Multiple AI Providers**: OpenAI GPT-4o, Google Gemini, Anthropic Claude
- **Key points extraction**
- **Action items detection**
- **Notable quotes** with timestamps
- **Topic categorization**
- **Custom summary styles**: Concise, Detailed, Bullet Points, Academic

### 🎨 Customizable Templates
- **6 Built-in templates**: Default, Academic, Minimal, Zettelkasten, Podcast, Tutorial
- **Custom template support** with Handlebars
- **15+ template helpers** for formatting
- **Flexible frontmatter** configuration

### 🔍 Smart Detection
- **Automatic paste detection** - Transcribes when you paste a video URL
- **File scanning** - Detects links when opening notes
- **Canvas integration** - Scans Obsidian Canvas for video URLs
- **Excalidraw support** - Detects URLs in drawings
- **Folder blacklist** - Exclude specific folders with glob patterns

### 💼 Professional Features
- **Batch processing queue** with pause/resume
- **Progress tracking** with live updates
- **Cost calculator** for API usage
- **Rate limit protection** with automatic fallback
- **Smart retry** for failed transcriptions
- **Transcript caching** to avoid duplicate work
- **Export transcripts** to MD, TXT, JSON, CSV, HTML

### 🛠️ Developer-Friendly
- **Debug panel** with system diagnostics
- **Comprehensive error handling**
- **Onboarding wizard** for first-time setup
- **Notification preferences**
- **Extensive settings** for customization

---

## 📥 Installation

### From Obsidian Community Plugins (Recommended)

1. Open **Settings** → **Community Plugins**
2. Click **Browse** and search for "Link Video Transcriber"
3. Click **Install**
4. Enable the plugin

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/your-repo/link-video-transcriber/releases)
2. Extract the files to `{VaultFolder}/.obsidian/plugins/link-video-transcriber/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

---

## ⚙️ Setup Guide

### Step 1: Get API Keys

Link Video Transcriber requires API keys for video extraction and transcription:

#### Required APIs

1. **RapidAPI** (for video extraction)
   - Sign up at [RapidAPI.com](https://rapidapi.com)
   - Subscribe to "Auto Download All In One" API
   - Copy your API key

2. **OpenAI API** (for transcription)
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Create an API key
   - Add billing information (Whisper API costs ~$0.006/minute)

#### Optional APIs (for AI summaries)

- **Google Gemini** - Free tier available at [ai.google.dev](https://ai.google.dev)
- **Anthropic Claude** - Sign up at [console.anthropic.com](https://console.anthropic.com)

### Step 2: Configure Plugin

1. Open **Settings** → **Link Video Transcriber**
2. Enter your API keys in the **API Configuration** section
3. Choose your preferred **AI Provider** (Gemini recommended for free tier)
4. Configure **Note Generation** settings (folder, template, naming)
5. Adjust **Detection Settings** as needed

### Step 3: Test Transcription

1. Create a new note
2. Paste a video URL (e.g., `https://youtu.be/dQw4w9WgXcQ`)
3. Confirm transcription in the popup
4. Wait for processing to complete
5. Your transcript note will open automatically!

---

## 🚀 Usage

### Basic Usage

**Method 1: Paste Detection**
- Simply paste a video URL into any note
- Plugin automatically detects and offers to transcribe

**Method 2: Command Palette**
- `Cmd/Ctrl + P` → "Transcribe video from clipboard"
- Or use hotkey: `Cmd/Ctrl + Shift + V`

**Method 3: Selection**
- Select text containing video URL
- `Cmd + P` → "Transcribe video from selection"
- Or use hotkey: `Cmd/Ctrl + Shift + T`

### Batch Transcription

1. Open queue: `Cmd/Ctrl + Shift + Q`
2. Add multiple video URLs to the queue
3. Queue processes videos sequentially
4. Pause/resume as needed

### Canvas Integration

1. Add video URLs to text nodes in Canvas
2. Run command: "Scan Canvas for videos"
3. Select videos to transcribe
4. Transcripts link back to Canvas nodes

### Local Video Files

**Direct Transcription:**
1. Open any MP4/video file in Obsidian
2. Run command: "Transcribe current local video file"
3. Audio extracted and transcribed automatically

**Embedded Videos:**
1. Embed video in note: `![[lecture.mp4]]` or `![](video.mp4)`
2. Run command: "Scan current file for local video embeds"
3. All embedded videos transcribed

**Excalidraw Integration:**
1. Reference videos in Excalidraw drawings
2. Videos automatically detected and can be transcribed
3. Supports both text references and embedded files

**Requirements:**
- FFmpeg must be installed on your system
- Maximum file size: 500MB (for processing efficiency)
- Supported formats: MP4, MOV, AVI, MKV, WEBM, M4V, FLV, WMV

### Cost Management

- View costs: `Cmd/Ctrl + Shift + C`
- See per-API breakdown
- Track monthly spending
- Export cost reports to CSV

---

## 🎯 Platform Support Details

| Platform | Status | Features | Notes |
|----------|--------|----------|-------|
| YouTube | ✅ Excellent | Full metadata, thumbnails, chapters | Best support |
| Instagram | ✅ Good | Reels, IGTV, Stories | Requires RapidAPI |
| TikTok | ✅ Excellent | Videos, audio extraction | Full support |
| X/Twitter | ✅ Excellent | Video tweets | Full support |
| Facebook | ⚠️ Moderate | Watch videos, Reels | Limited metadata |
| Pinterest | ✅ Good | Video pins | Basic support |
| Threads | ✅ Good | Video posts | Basic support |
| Telegram | 🧪 Experimental | Channel videos | Limited testing |
| **Local Files** | ✅ **Excellent** | **MP4, MOV, AVI, MKV, WEBM, M4V** | **Requires FFmpeg** |

---

## ⚡ Template System

### Built-in Templates

- **Default** - Standard format with all sections
- **Academic** - Formal structure with citations
- **Minimal** - Clean, compact format
- **Zettelkasten** - Atomic notes with links
- **Podcast** - Episode-style format
- **Tutorial** - Step-by-step instruction format

### Custom Templates

Create custom templates using Handlebars syntax:

```handlebars
---
title: {{title}}
author: {{author}}
platform: {{platform}}
tags: {{#each tags}}{{this}} {{/each}}
---

# {{title}}

**Author:** {{author}}
**Platform:** {{platform}}
**Duration:** {{formatDuration duration}}
**URL:** [Watch Video]({{url}})

## Summary

{{summary}}

## Key Points

{{#each keyPoints}}
- {{this}}
{{/each}}

## Full Transcript

{{transcript}}
```

### Available Helpers

- `{{formatDuration duration}}` - Format seconds as HH:MM:SS
- `{{formatDate date}}` - Format date
- `{{timestampLink timestamp}}` - Create clickable timestamp
- `{{wordCount text}}` - Count words
- Plus 10+ more helpers

---

## 📊 Configuration Options

### API Configuration
- RapidAPI key
- OpenAI API key
- Gemini API key (optional)
- Claude API key (optional)

### Transcription
- Method: Auto / Always API / Always Local
- Whisper model selection
- Language preferences

### AI Summaries
- Provider selection
- Summary style
- Include key points
- Include quotes
- Include questions
- Include chapters

### Note Generation
- Default template
- Output folder
- Folder organization (by platform/date/author)
- Filename pattern
- Tag strategy
- Link strategy
- Auto-open notes

### Detection
- Auto-detect in Markdown files
- Auto-detect in Canvas
- Auto-detect in Excalidraw
- Detection delay
- Show confirmation modal
- Folder blacklist

### Performance
- Max concurrent transcriptions
- Cache transcripts
- Cache duration

### Privacy
- Privacy mode (minimal metadata)
- Delete audio after transcription
- Save audio files

---

## 🐛 Troubleshooting

### "Invalid API key" Error

**Problem:** API authentication failed

**Solutions:**
1. Verify API key is copied correctly (no extra spaces)
2. Check API key hasn't expired
3. Ensure billing is set up (for paid APIs)
4. Test API key in Debug Panel

### Transcription Fails

**Problem:** Video transcription errors out

**Solutions:**
1. Check Debug Panel for detailed error
2. Verify video URL is accessible
3. Try fallback API in settings
4. Check rate limits in Debug Panel
5. Enable retry for failed transcriptions

### No Videos Detected

**Problem:** Plugin doesn't detect pasted URLs

**Solutions:**
1. Enable auto-detection in settings
2. Check folder blacklist settings
3. Verify URL format is correct
4. Try manually using command palette

### Audio File Too Large

**Problem:** "Audio file exceeds 25MB limit"

**Solutions:**
1. Plugin automatically chunks large files
2. Enable audio preprocessing in settings
3. Adjust compression settings
4. For very long videos (>2 hours), transcription is split automatically

### High API Costs

**Problem:** Unexpected API charges

**Solutions:**
1. Check Cost Calculator for breakdown
2. Enable transcript caching
3. Use Gemini (free tier) for summaries
4. Set up budget alerts in settings
5. Export cost reports monthly

### Local Video Files Won't Transcribe

**Problem:** Error when transcribing MP4/local video files

**Solutions:**
1. Install FFmpeg on your system:
   - **Windows**: Download from ffmpeg.org or use `choco install ffmpeg`
   - **macOS**: Run `brew install ffmpeg`
   - **Linux**: Run `sudo apt-get install ffmpeg` (Ubuntu/Debian)
2. Restart Obsidian after installing FFmpeg
3. Check file size (max 500MB)
4. Verify file format is supported (MP4, MOV, AVI, MKV, WEBM, M4V, FLV, WMV)
5. Check Debug Panel for detailed error messages

---

## 🎨 Advanced Usage

### Folder Blacklist with Glob Patterns

Exclude folders from auto-detection:

```
.obsidian
.trash
Templates
Archive/*
Daily Notes/**/*.md
```

### Custom Frontmatter

Configure what metadata appears in note frontmatter:

```yaml
---
title: {{title}}
author: {{author}}
platform: {{platform}}
duration: {{duration}}
transcribed: {{formatDate transcribedAt}}
cost: {{estimatedCost}}
tags: {{generateTags metadata 10}}
---
```

### Batch Export

Export all transcripts from a folder:

1. Right-click folder → "Export Transcripts"
2. Choose format (MD, JSON, CSV, HTML)
3. Select output location
4. Transcripts are exported with metadata

---

## 🔒 Privacy & Security

- **API Keys**: Stored locally in Obsidian vault
- **Audio Files**: Temporarily downloaded, auto-deleted after transcription
- **Transcripts**: Cached locally for 30 days (configurable)
- **Privacy Mode**: Disables metadata collection
- **No Telemetry**: Plugin does not collect usage data

---

## 💰 Pricing

Link Video Transcriber is **free and open-source**. However, it requires API access:

- **RapidAPI**: ~$10-30/month (varies by plan)
- **OpenAI Whisper**: ~$0.006/minute of audio
- **Gemini**: Free tier available (60 requests/minute)
- **Claude**: Pay-as-you-go pricing

**Estimated costs for moderate use:**
- 10 videos/day (~30min each): ~$18/month (Whisper + RapidAPI)
- Using free Gemini tier for summaries: $0/month additional

---

## 🛣️ Roadmap

- [ ] Local Whisper integration (privacy-focused)
- [ ] Speaker diarization
- [ ] Subtitle import
- [ ] Real-time transcription for livestreams
- [ ] Mobile app optimization
- [ ] Template marketplace
- [ ] Multi-language UI

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/your-repo/link-video-transcriber
cd link-video-transcriber
npm install
npm run dev
```

### Building

```bash
npm run build
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Obsidian Team** - For the amazing platform
- **OpenAI** - Whisper API
- **Google** - Gemini AI
- **Anthropic** - Claude AI
- **Community Contributors** - Thank you!

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/link-video-transcriber/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/link-video-transcriber/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/link-video-transcriber/wiki)

---

**Made with ❤️ for the Obsidian community**
