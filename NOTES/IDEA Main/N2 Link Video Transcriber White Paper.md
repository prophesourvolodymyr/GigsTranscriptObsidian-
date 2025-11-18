# N2 Link Video Transcriber White Paper

## Executive Summary

The Link Video Transcriber is an ambitious Obsidian plugin concept that aims to revolutionize how users capture and process video content within their knowledge management workflow. The core vision is elegant: paste a video link from any major platform (YouTube, Instagram, X/Twitter, Telegram) anywhere in Obsidian—whether in a markdown file, canvas board, or Excalidraw drawing—and have the plugin automatically detect it, offer transcription, extract the video, transcribe it using Whisper (API or local), and create a new note with the full transcript ready for AI-powered processing.

This white paper provides a comprehensive technical analysis of what's required to build this plugin, the feasibility of each component, implementation approaches, and realistic assessments of challenges. The project represents a convergence of multiple complex systems: video platform APIs, audio extraction pipelines, speech-to-text processing, AI integration, and Obsidian's plugin architecture.

**Key Findings:**
- **Core Functionality:** Highly achievable with proper architecture
- **Platform Coverage:** YouTube (easy), Instagram/X (moderate), Telegram (challenging)
- **Transcription:** Both API and local Whisper are feasible with different trade-offs
- **AI Integration:** Straightforward with proper API key management
- **Main Challenges:** Video extraction DRM/authentication, rate limiting, local compute resources

The project is viable and would fill a genuine gap in the Obsidian ecosystem, though certain features will require careful scoping and phased implementation.

---

## 1. Platform Video Extraction Analysis

### 1.1 Technical Overview of Video Platform Architecture

Each video platform presents unique technical challenges for extraction. Understanding these is critical for building a robust solution.

### 1.2 YouTube

**Feasibility: ✅ HIGH**

YouTube is the most straightforward platform for several reasons:

**Extraction Method:**
- **Primary Tool:** `yt-dlp` (actively maintained fork of youtube-dl)
- **How it works:** yt-dlp reverse-engineers YouTube's player API to extract direct media URLs
- **Audio-only mode:** Can extract just the audio stream (m4a/webm) without downloading video, saving bandwidth and time
- **Quality selection:** Supports selecting audio quality (e.g., 128kbps for transcription is sufficient)

**Technical Implementation:**
```typescript
// Conceptual code structure
async function extractYouTubeAudio(videoUrl: string): Promise<AudioBuffer> {
  // Option 1: Use yt-dlp via child process
  const audioPath = await execYtDlp([
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '128K',
    '-o', tempAudioPath,
    videoUrl
  ]);

  // Option 2: Use yt-dlp wrapper libraries (if available for Electron/Node)
  // Option 3: Use YouTube Data API + direct stream extraction

  return readAudioFile(audioPath);
}
```

**Advantages:**
- No authentication required for public videos
- Reliable extraction methods that adapt to YouTube changes
- Extensive metadata available (title, description, chapters, duration)
- Subtitles/captions already available (could be used as fallback)

**Challenges:**
- YouTube actively fights downloaders (API changes frequently)
- Rate limiting on excessive requests
- Private/unlisted videos require authentication
- Age-restricted content needs handling

**Recommended Approach:**
Use `yt-dlp` as a Node.js child process with proper error handling and fallback strategies.

### 1.3 Instagram

**Feasibility: ⚠️ MODERATE**

Instagram is significantly more challenging due to Meta's aggressive anti-scraping measures.

**Extraction Method:**
- **Primary Tool:** `yt-dlp` (supports Instagram) or `instaloader`
- **Authentication:** Often required for reliable access
- **Rate Limiting:** Very aggressive, IP-based bans common

**Technical Challenges:**
1. **Login Requirement:** Most Instagram content requires authentication
   - Plugin needs secure credential storage
   - Session management with cookie handling
   - 2FA complications

2. **Stories vs Posts vs Reels:**
   - Different endpoints and extraction methods
   - Stories expire after 24 hours
   - Reels have different URL patterns

3. **DRM and Encryption:**
   - Some content uses additional protection layers
   - Private accounts require follow relationships

**Recommended Approach:**
```typescript
async function extractInstagramMedia(url: string, credentials?: InstagramAuth): Promise<MediaInfo> {
  // Phase 1: Public reels/posts only (no auth)
  if (isPublicReel(url)) {
    return extractPublicInstagram(url);
  }

  // Phase 2: Authenticated access (future enhancement)
  if (credentials && credentials.isValid()) {
    return extractAuthenticatedInstagram(url, credentials);
  }

  throw new Error('Instagram content requires authentication');
}
```

**Risk Assessment:**
- Medium risk of breaking due to API changes
- High risk of account bans if not careful with rate limiting
- User experience friction (requiring Instagram login)

**Realistic Scope for V1:**
Support public Reels only, add authenticated access in V2.

### 1.4 X (Twitter)

**Feasibility: ⚠️ MODERATE-DIFFICULT**

Twitter/X has become increasingly hostile to third-party access after Elon Musk's changes.

**Current State (2025):**
- Official API requires expensive subscription ($100-$5000/month for write access)
- Free tier extremely limited (500 tweets read/month)
- Video access through API is restricted
- Scraping is actively blocked

**Extraction Method:**
- **Legacy:** Twitter API v1.1/v2 with proper auth
- **Current Reality:** Must use scraping with `yt-dlp` or similar
- **Authentication:** Required for most content now

**Technical Implementation Options:**

**Option A: Official API (Expensive)**
```typescript
// Requires X API Pro subscription ($5000/month)
const twitterClient = new TwitterApi(bearerToken);
const tweet = await twitterClient.v2.singleTweet(tweetId, {
  'tweet.fields': 'attachments',
  'expansions': 'attachments.media_keys',
  'media.fields': 'variants,url'
});
```

**Option B: Scraping (Fragile but Free)**
```typescript
// Use yt-dlp or similar scraper
const videoUrl = await extractTwitterVideo(tweetUrl);
// High risk of breaking, requires maintenance
```

**Challenges:**
1. **Rate Limiting:** Extremely aggressive
2. **Authentication:** Required for viewing most content
3. **API Costs:** Prohibitive for indie plugin
4. **Video Quality:** Multiple variants, need selection logic
5. **Stability:** X changes policies frequently

**Recommended Approach:**
- **V1:** Basic support using yt-dlp scraping with clear warnings about fragility
- **V2:** Optional X API support for users with their own API keys
- **Documentation:** Clear explanation of limitations and when it might break

### 1.5 Telegram

**Feasibility: ⚠️ DIFFICULT**

Telegram presents unique challenges as it's primarily a messaging platform, not a video hosting service.

**Technical Context:**
- Telegram videos are hosted on Telegram's CDN
- Access requires Telegram client authentication
- No public video URLs like YouTube
- Content is often private/group-specific

**Extraction Method:**
- **Telegram API:** Official MTProto API
- **Bot API:** Limited, requires bot creation
- **Third-party libraries:** `telegram-dl`, `tdlib` (Telegram Database Library)

**Authentication Requirements:**
```typescript
// Telegram requires phone number authentication
const client = new TelegramClient(
  session,
  apiId,     // User must register app on my.telegram.org
  apiHash,   // Get credentials
  { connectionRetries: 5 }
);

await client.start({
  phoneNumber: async () => await getUserPhoneNumber(),
  password: async () => await getPassword(),
  phoneCode: async () => await getPhoneCode(),
  onError: (err) => console.error(err),
});
```

**Major Challenges:**
1. **Authentication Complexity:**
   - Requires phone number and 2FA
   - Session management
   - Security implications of storing Telegram sessions

2. **API Restrictions:**
   - Rate limits per API ID
   - Download limits
   - Flood wait errors

3. **Content Access:**
   - Private channels require membership
   - Messages might be deleted
   - Need message ID + channel ID from URL

4. **Library Size:**
   - TDLib is large (multiple MB)
   - Not ideal for Obsidian plugin bundle size

**Recommended Approach:**
- **V1:** Exclude Telegram support, mark as "future feature"
- **V2:** Add as experimental feature with:
  - User-provided API credentials
  - Clear setup documentation
  - Public channel support only
  - Warning about authentication requirements

**Realistic Assessment:**
Telegram support should be considered a "stretch goal" rather than core functionality. The authentication burden and complexity may outweigh the benefit for most users.

### 1.6 Platform Priority Recommendation

Based on feasibility analysis:

**Phase 1 (MVP):**
- ✅ YouTube (must-have, high ROI)
- ✅ Instagram Reels - public only (nice-to-have)

**Phase 2 (Enhancement):**
- ⚠️ X/Twitter (scraping-based, with disclaimers)
- ⚠️ Instagram full support (with authentication)

**Phase 3 (Advanced):**
- ❌ Telegram (complex, limited audience)
- 🔄 Additional platforms based on user demand (TikTok, Vimeo, etc.)

---

## 2. Obsidian Plugin Architecture

### 2.1 Plugin Development Foundation

Obsidian plugins run in an Electron environment with access to Node.js APIs. This is crucial because it means we can:
- Execute command-line tools (yt-dlp, ffmpeg)
- Access file system directly
- Make HTTP requests without CORS limitations
- Use native Node modules

**Plugin Structure:**
```typescript
import { Plugin, TFile, Notice } from 'obsidian';

export default class LinkVideoTranscriberPlugin extends Plugin {
  settings: VideoTranscriberSettings;

  async onload() {
    await this.loadSettings();

    // Register link detector
    this.registerLinkDetector();

    // Register commands
    this.addCommand({
      id: 'transcribe-video-link',
      name: 'Transcribe Video from Link',
      callback: () => this.transcribeCurrentLink()
    });

    // Add settings tab
    this.addSettingTab(new VideoTranscriberSettingTab(this.app, this));

    // Register context menu items
    this.registerContextMenus();
  }
}
```

### 2.2 Link Detection System

**Challenge:** Detecting video links across different Obsidian contexts (markdown, canvas, Excalidraw).

**Solution Architecture:**

#### 2.2.1 Markdown Files (Easiest)

Use Obsidian's editor API to monitor paste events and scan for URLs:

```typescript
class LinkDetector {
  private urlPatterns = {
    youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    instagram: /instagram\.com\/(reel|p)\/([a-zA-Z0-9_-]+)/,
    twitter: /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    telegram: /t\.me\/([a-zA-Z0-9_]+)\/(\d+)/
  };

  registerMarkdownPostProcessor() {
    // Monitor paste events
    this.plugin.registerEvent(
      this.app.workspace.on('editor-paste', (evt: ClipboardEvent, editor) => {
        const pastedText = evt.clipboardData?.getData('text');
        if (pastedText) {
          this.detectAndOfferTranscription(pastedText, editor);
        }
      })
    );

    // Scan existing content when file opens
    this.plugin.registerEvent(
      this.app.workspace.on('file-open', (file: TFile) => {
        if (file) {
          this.scanFileForLinks(file);
        }
      })
    );
  }

  async detectAndOfferTranscription(text: string, editor: Editor) {
    const links = this.extractVideoLinks(text);

    if (links.length > 0) {
      for (const link of links) {
        const shouldTranscribe = await this.showTranscriptionPrompt(link);
        if (shouldTranscribe) {
          await this.initiateTranscription(link, editor);
        }
      }
    }
  }

  extractVideoLinks(text: string): VideoLink[] {
    const links: VideoLink[] = [];

    for (const [platform, pattern] of Object.entries(this.urlPatterns)) {
      const matches = text.matchAll(new RegExp(pattern, 'g'));
      for (const match of matches) {
        links.push({
          url: match[0],
          platform: platform as VideoPlatform,
          id: match[1],
          rawMatch: match
        });
      }
    }

    return links;
  }
}
```

#### 2.2.2 Canvas/Boards (Moderate Difficulty)

Canvas nodes store text content that can be accessed via Obsidian's API:

```typescript
class CanvasLinkDetector {
  async scanCanvas(canvasFile: TFile) {
    // Canvas files are JSON
    const content = await this.app.vault.read(canvasFile);
    const canvasData = JSON.parse(content);

    // Iterate through nodes
    for (const node of canvasData.nodes) {
      if (node.type === 'text') {
        const links = this.detectLinks(node.text);
        if (links.length > 0) {
          // Mark node as having transcribable content
          this.highlightCanvasNode(node.id, links);
        }
      }
    }
  }

  // Add button overlay to canvas node
  addTranscribeButton(nodeId: string, link: VideoLink) {
    // Use Obsidian's canvas API to add UI elements
    const canvasView = this.app.workspace.getActiveViewOfType(Canvas);
    if (canvasView) {
      canvasView.addNodeButton(nodeId, {
        icon: 'microphone',
        tooltip: 'Transcribe video',
        callback: () => this.transcribeLink(link)
      });
    }
  }
}
```

**Challenges:**
- Canvas API is less documented
- Need to handle canvas file format updates
- UI overlay positioning might be tricky

#### 2.2.3 Excalidraw (Most Complex)

Excalidraw stores drawings in a special JSON format within markdown files.

```typescript
class ExcalidrawLinkDetector {
  async scanExcalidraw(file: TFile) {
    const content = await this.app.vault.read(file);

    // Excalidraw data is in a code block
    const excalidrawMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!excalidrawMatch) return;

    const drawingData = JSON.parse(excalidrawMatch[1]);

    // Check text elements
    for (const element of drawingData.elements) {
      if (element.type === 'text') {
        const links = this.detectLinks(element.text);
        if (links.length > 0) {
          // Add indicator near text element
          this.addTranscribeIndicator(file, element.id, links);
        }
      }
    }
  }

  // Integration with Excalidraw plugin
  async integrateWithExcalidrawPlugin() {
    // If Excalidraw plugin is installed, use its API
    const excalidrawPlugin = this.app.plugins.getPlugin('obsidian-excalidraw-plugin');
    if (excalidrawPlugin) {
      // Register for Excalidraw events
      excalidrawPlugin.on('drawing-updated', (drawingId) => {
        this.scanExcalidraw(drawingId);
      });
    }
  }
}
```

**Realistic Assessment:**
- Markdown detection: Straightforward and reliable
- Canvas detection: Feasible with some API exploration
- Excalidraw detection: Requires Excalidraw plugin integration; might be V2 feature

**Recommendation for V1:**
Focus on markdown files first. Add canvas support if time permits. Make Excalidraw support a community-requested feature for V2.

### 2.3 User Interaction Flow

The UX needs to be non-intrusive yet discoverable.

**Flow Design:**

```
User Pastes Link → Plugin Detects → Modal Appears
                                      ↓
                      "Transcribe this video?"
                      [Video Title]
                      [Platform Icon] [Duration: 15:30]

                      [Yes] [No] [Settings]
                                      ↓
                      Progress Indicator
                      "Downloading audio... 40%"
                      "Transcribing... 15%"
                                      ↓
                      New Note Created
                      "Transcript created: [[Video Title]]"
```

**Implementation:**

```typescript
class TranscriptionModal extends Modal {
  link: VideoLink;
  onConfirm: (options: TranscriptionOptions) => void;

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Transcribe Video?' });

    // Fetch video metadata
    const metadata = await this.fetchMetadata(this.link);

    // Show video preview
    const previewContainer = contentEl.createDiv('video-preview');
    previewContainer.createEl('img', {
      attr: { src: metadata.thumbnail }
    });

    const infoContainer = contentEl.createDiv('video-info');
    infoContainer.createEl('h3', { text: metadata.title });
    infoContainer.createEl('p', {
      text: `${metadata.platform} • ${formatDuration(metadata.duration)}`
    });

    // Options
    const optionsContainer = contentEl.createDiv('transcription-options');

    // Whisper source selection
    new Setting(optionsContainer)
      .setName('Transcription method')
      .addDropdown(dropdown => dropdown
        .addOption('api', 'OpenAI Whisper API')
        .addOption('local', 'Local Whisper')
        .setValue(this.plugin.settings.defaultWhisperSource)
      );

    // Language selection
    new Setting(optionsContainer)
      .setName('Audio language')
      .addDropdown(dropdown => dropdown
        .addOption('auto', 'Auto-detect')
        .addOption('en', 'English')
        .addOption('es', 'Spanish')
        // ... more languages
      );

    // Buttons
    const buttonContainer = contentEl.createDiv('button-container');

    const confirmButton = buttonContainer.createEl('button', {
      text: 'Transcribe',
      cls: 'mod-cta'
    });
    confirmButton.onclick = () => {
      this.onConfirm(this.gatherOptions());
      this.close();
    };

    const cancelButton = buttonContainer.createEl('button', {
      text: 'Cancel'
    });
    cancelButton.onclick = () => this.close();
  }
}
```

**Progress Tracking:**

```typescript
class TranscriptionProgress extends Notice {
  private progressBar: HTMLElement;
  private statusText: HTMLElement;

  constructor(message: string, timeout: number = 0) {
    super(message, timeout);
    this.addProgressUI();
  }

  updateProgress(stage: string, percent: number) {
    this.statusText.textContent = stage;
    this.progressBar.style.width = `${percent}%`;
  }

  setStage(stage: TranscriptionStage) {
    const messages = {
      'extracting': 'Extracting audio from video...',
      'transcribing': 'Transcribing audio...',
      'processing': 'Processing transcript...',
      'creating': 'Creating note...',
      'complete': 'Transcription complete!'
    };
    this.updateProgress(messages[stage], this.getStagePercent(stage));
  }
}
```

---

## 3. Transcription Engine Architecture

### 3.1 Whisper API Integration (OpenAI)

**Overview:**
OpenAI's Whisper API is a cloud-based speech-to-text service that offers excellent accuracy and supports 57 languages.

**Technical Specifications:**
- **Endpoint:** `https://api.openai.com/v1/audio/transcriptions`
- **Model:** `whisper-1`
- **File size limit:** 25 MB
- **Supported formats:** mp3, mp4, mpeg, mpga, m4a, wav, webm
- **Cost:** $0.006 per minute (as of 2025)
- **Speed:** Typically 1:4 ratio (15 minute video = ~4 minutes processing)

**Implementation:**

```typescript
class WhisperAPITranscriber {
  private apiKey: string;
  private endpoint = 'https://api.openai.com/v1/audio/transcriptions';

  async transcribe(audioFile: string, options: TranscriptionOptions): Promise<Transcript> {
    // Check file size
    const fileSize = await this.getFileSize(audioFile);
    if (fileSize > 25 * 1024 * 1024) {
      // Split file into chunks
      return await this.transcribeInChunks(audioFile, options);
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFile));
    formData.append('model', 'whisper-1');
    formData.append('language', options.language || 'en');
    formData.append('response_format', 'verbose_json'); // Get timestamps

    // Optional: prompt for context
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    // Make API request
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      text: result.text,
      segments: result.segments, // Timestamp data
      language: result.language,
      duration: result.duration
    };
  }

  // Handle large files by splitting
  async transcribeInChunks(audioFile: string, options: TranscriptionOptions): Promise<Transcript> {
    const chunks = await this.splitAudio(audioFile, 24 * 60 * 1000); // 24-minute chunks
    const transcripts: Transcript[] = [];

    for (let i = 0; i < chunks.length; i++) {
      this.emit('progress', {
        stage: 'transcribing',
        percent: (i / chunks.length) * 100,
        message: `Transcribing chunk ${i + 1}/${chunks.length}`
      });

      const chunk Transcript = await this.transcribe(chunks[i], options);
      transcripts.push(chunkTranscript);

      // Clean up chunk file
      await fs.unlink(chunks[i]);
    }

    // Merge transcripts
    return this.mergeTranscripts(transcripts);
  }

  // Split audio using FFmpeg
  async splitAudio(inputFile: string, chunkDurationMs: number): Promise<string[]> {
    const duration = await this.getAudioDuration(inputFile);
    const numChunks = Math.ceil(duration / chunkDurationMs);
    const chunkPaths: string[] = [];

    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDurationMs / 1000;
      const outputPath = `${inputFile}.chunk${i}.mp3`;

      await this.runFFmpeg([
        '-i', inputFile,
        '-ss', startTime.toString(),
        '-t', (chunkDurationMs / 1000).toString(),
        '-acodec', 'copy',
        outputPath
      ]);

      chunkPaths.push(outputPath);
    }

    return chunkPaths;
  }
}
```

**Advantages:**
- ✅ No local compute requirements
- ✅ Fast processing (cloud GPUs)
- ✅ Excellent accuracy
- ✅ Multi-language support out of box
- ✅ Timestamps included
- ✅ Simple API

**Disadvantages:**
- ❌ Costs money (though cheap)
- ❌ Requires internet connection
- ❌ Privacy concerns (audio sent to OpenAI)
- ❌ Rate limits
- ❌ 25MB file size limit (requires chunking)

### 3.2 Local Whisper Integration

**Overview:**
Local Whisper uses OpenAI's open-source Whisper models running on the user's machine. This requires more setup but offers privacy and no ongoing costs.

**Model Options:**

| Model | Size | RAM Required | Speed (Relative) | Accuracy |
|-------|------|--------------|------------------|----------|
| tiny  | 75 MB | ~1 GB | 32x realtime | Fair |
| base  | 142 MB | ~1 GB | 16x realtime | Good |
| small | 466 MB | ~2 GB | 6x realtime | Better |
| medium | 1.5 GB | ~5 GB | 2x realtime | Very Good |
| large | 2.9 GB | ~10 GB | 1x realtime | Best |

**Implementation Approaches:**

#### Approach A: whisper.cpp (C++ Implementation)

Most practical for desktop applications, compiled binaries with good performance.

```typescript
class LocalWhisperTranscriber {
  private whisperBinPath: string;
  private modelPath: string;

  async transcribe(audioFile: string, options: TranscriptionOptions): Promise<Transcript> {
    // Check if Whisper is installed
    if (!await this.isWhisperInstalled()) {
      throw new Error('Local Whisper not found. Please configure in settings.');
    }

    // Prepare command
    const args = [
      '-m', this.modelPath,
      '-f', audioFile,
      '-l', options.language || 'auto',
      '-of', 'json', // Output format: JSON
      '--output-dir', this.getTempDir()
    ];

    // Add optional arguments
    if (options.translate) {
      args.push('--translate'); // Translate to English
    }

    if (options.timestamps) {
      args.push('--timestamps');
    }

    // Execute whisper.cpp
    const result = await this.executeCommand(this.whisperBinPath, args, {
      onProgress: (percent: number) => {
        this.emit('progress', {
          stage: 'transcribing',
          percent: percent
        });
      }
    });

    // Parse JSON output
    const outputFile = `${this.getTempDir()}/transcription.json`;
    const transcriptData = JSON.parse(await fs.readFile(outputFile, 'utf-8'));

    return this.parseWhisperOutput(transcriptData);
  }

  async checkInstallation(): Promise<InstallationStatus> {
    return {
      installed: await this.isWhisperInstalled(),
      version: await this.getWhisperVersion(),
      modelAvailable: await this.isModelDownloaded(),
      modelPath: this.modelPath
    };
  }

  // Guide user through setup
  async setupWizard(): Promise<void> {
    const platform = process.platform;

    // Show platform-specific instructions
    const instructions = this.getInstallationInstructions(platform);

    // Offer to download whisper.cpp binary
    const shouldDownload = await this.confirmDownload();
    if (shouldDownload) {
      await this.downloadWhisperBinary(platform);
    }

    // Model selection
    const model = await this.selectModel();
    await this.downloadModel(model);
  }

  async downloadModel(modelName: string): Promise<void> {
    const modelUrl = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${modelName}.bin`;
    const modelPath = path.join(this.getModelsDir(), `ggml-${modelName}.bin`);

    // Download with progress
    await this.downloadFile(modelUrl, modelPath, (progress) => {
      this.emit('download-progress', {
        model: modelName,
        percent: progress
      });
    });

    this.settings.whisperModelPath = modelPath;
    await this.saveSettings();
  }
}
```

#### Approach B: Python Whisper (Original OpenAI Implementation)

Requires Python environment, but more features and better maintained.

```typescript
class PythonWhisperTranscriber {
  async transcribe(audioFile: string, options: TranscriptionOptions): Promise<Transcript> {
    // Check Python and whisper installation
    await this.ensurePythonEnvironment();

    // Create Python script
    const scriptPath = await this.createTranscriptionScript({
      audioFile,
      modelName: options.modelSize || 'base',
      language: options.language,
      outputFormat: 'json'
    });

    // Execute Python script
    const result = await this.executePython(scriptPath);

    return JSON.parse(result);
  }

  async ensurePythonEnvironment(): Promise<void> {
    // Check Python
    const pythonVersion = await this.checkPython();
    if (!pythonVersion) {
      throw new Error('Python 3.8+ required for local Whisper');
    }

    // Check if whisper is installed
    const whisperInstalled = await this.checkPythonPackage('openai-whisper');
    if (!whisperInstalled) {
      await this.offerWhisperInstallation();
    }
  }

  async offerWhisperInstallation(): Promise<void> {
    const install = await this.confirm(
      'OpenAI Whisper not found',
      'Would you like to install it? (requires pip)'
    );

    if (install) {
      await this.executePython(['-m', 'pip', 'install', 'openai-whisper']);
    }
  }
}
```

**Comparison:**

| Aspect | whisper.cpp | Python Whisper |
|--------|-------------|----------------|
| Setup Difficulty | Moderate | Easy (if Python installed) |
| Performance | Faster | Slower |
| Dependencies | None (standalone binary) | Python + PyTorch |
| Model Loading | Fast | Slow first load |
| Maintenance | Less actively updated | Official OpenAI repo |
| Size | Small (~MB) | Large (PyTorch ~GB) |

**Recommendation:**
Offer both options, but guide users toward whisper.cpp for better user experience. Provide Python option for advanced users who already have Python environments.

### 3.3 Transcription Strategy: API vs Local Decision Tree

```typescript
class TranscriptionOrchestrator {
  async determineTranscriptionMethod(
    videoInfo: VideoMetadata,
    userPreferences: Settings
  ): Promise<TranscriptionMethod> {

    // User explicitly set preference
    if (userPreferences.preferredMethod === 'always-api') {
      return this.useAPI();
    }
    if (userPreferences.preferredMethod === 'always-local') {
      return this.useLocal();
    }

    // Smart decision based on context
    if (userPreferences.preferredMethod === 'auto') {
      return await this.autoSelect(videoInfo, userPreferences);
    }
  }

  async autoSelect(video: VideoMetadata, settings: Settings): Promise<TranscriptionMethod> {
    // Factors to consider:
    const factors = {
      duration: video.duration,
      hasInternet: await this.checkInternet(),
      hasAPIKey: !!settings.openaiApiKey,
      localInstalled: await this.isLocalWhisperInstalled(),
      cpuPower: await this.estimateLocalPerformance(),
      privacy: settings.privacyMode
    };

    // Privacy mode = always local
    if (factors.privacy && factors.localInstalled) {
      return { method: 'local', reason: 'privacy mode' };
    }

    // No API key = must use local
    if (!factors.hasAPIKey) {
      if (factors.localInstalled) {
        return { method: 'local', reason: 'no API key' };
      } else {
        throw new Error('No transcription method available');
      }
    }

    // Short videos (< 10 min) = API (faster, cheaper)
    if (factors.duration < 600 && factors.hasInternet) {
      return { method: 'api', reason: 'short video, API is faster' };
    }

    // Long videos + good CPU = local (save money)
    if (factors.duration > 1800 && factors.cpuPower > 0.7 && factors.localInstalled) {
      return { method: 'local', reason: 'long video, save API costs' };
    }

    // Default to API if available
    if (factors.hasAPIKey && factors.hasInternet) {
      return { method: 'api', reason: 'default choice' };
    }

    // Fallback to local
    return { method: 'local', reason: 'fallback' };
  }
}
```

---

## 4. AI Integration Layer

### 4.1 Multi-Provider AI Architecture

The plugin should support multiple AI providers (OpenAI, Google Gemini, Anthropic Claude) for transcript processing. This gives users flexibility and avoids vendor lock-in.

**Unified AI Interface:**

```typescript
interface AIProvider {
  name: string;
  isConfigured(): boolean;
  summarize(transcript: string, options: SummaryOptions): Promise<string>;
  extract(transcript: string, query: string): Promise<string>;
  chat(transcript: string, userMessage: string, history: Message[]): Promise<string>;
}

class AIProviderManager {
  private providers: Map<string, AIProvider>;

  constructor() {
    this.providers = new Map();
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('claude', new ClaudeProvider());
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.isConfigured());
  }

  async executeAITask(
    providerId: string,
    task: AITask
  ): Promise<AIResponse> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider ${providerId} not configured`);
    }

    switch (task.type) {
      case 'summarize':
        return await provider.summarize(task.transcript, task.options);
      case 'extract':
        return await provider.extract(task.transcript, task.query);
      case 'chat':
        return await provider.chat(task.transcript, task.message, task.history);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }
}
```

### 4.2 OpenAI Integration

```typescript
class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async summarize(transcript: string, options: SummaryOptions): Promise<string> {
    const systemPrompt = this.buildSummaryPrompt(options);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini', // Cost-effective default
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.formatTranscript(transcript) }
        ],
        max_tokens: options.maxLength || 1000,
        temperature: 0.3 // Lower temperature for factual summaries
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async extract(transcript: string, query: string): Promise<string> {
    const systemPrompt = `You are an expert at extracting specific information from video transcripts.
The user will provide a transcript and ask a specific question.
Extract the relevant portion of the transcript that answers their question.
Include surrounding context if helpful. Quote the transcript directly.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use stronger model for extraction
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Transcript:\n\n${transcript}\n\nQuestion: ${query}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private buildSummaryPrompt(options: SummaryOptions): string {
    let prompt = 'You are an expert at summarizing video transcripts. ';

    switch (options.style) {
      case 'brief':
        prompt += 'Create a brief 2-3 sentence summary highlighting the main points.';
        break;
      case 'detailed':
        prompt += 'Create a detailed summary with key points, arguments, and conclusions. Use bullet points.';
        break;
      case 'academic':
        prompt += 'Create an academic-style summary with methodology, findings, and implications.';
        break;
      default:
        prompt += 'Create a clear, concise summary of the main ideas.';
    }

    if (options.includeTimestamps) {
      prompt += ' Include timestamps for key moments.';
    }

    if (options.focusAreas && options.focusAreas.length > 0) {
      prompt += ` Focus particularly on: ${options.focusAreas.join(', ')}.`;
    }

    return prompt;
  }
}
```

### 4.3 Google Gemini Integration

```typescript
class GeminiProvider implements AIProvider {
  name = 'Google Gemini';
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async summarize(transcript: string, options: SummaryOptions): Promise<string> {
    const modelName = options.model || 'gemini-2.0-flash-exp';

    const prompt = this.buildSummaryPrompt(options, transcript);

    const response = await fetch(
      `${this.baseUrl}/models/${modelName}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: options.maxLength || 1000,
          }
        })
      }
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  // Gemini has excellent long-context support
  async summarizeLongTranscript(transcript: string, options: SummaryOptions): Promise<string> {
    // Gemini 1.5 Pro supports up to 1M tokens
    // Can handle very long transcripts without chunking
    return await this.summarize(transcript, {
      ...options,
      model: 'gemini-1.5-pro-latest'
    });
  }
}
```

### 4.4 Claude (Anthropic) Integration

```typescript
class ClaudeProvider implements AIProvider {
  name = 'Anthropic Claude';
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  async summarize(transcript: string, options: SummaryOptions): Promise<string> {
    const systemPrompt = this.buildSummaryPrompt(options);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-haiku-20240307', // Fast and cheap
        max_tokens: options.maxLength || 1000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: this.formatTranscript(transcript)
        }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }

  async extract(transcript: string, query: string): Promise<string> {
    // Claude excels at precise extraction tasks
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Best model for complex tasks
        max_tokens: 2000,
        system: 'You are an expert at extracting precise information from transcripts.',
        messages: [{
          role: 'user',
          content: `Here is a video transcript:\n\n${transcript}\n\nPlease find and extract the part that answers this question: ${query}\n\nProvide the relevant quote and explain the context.`
        }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }
}
```

### 4.5 AI Feature Implementation

**Summary Generation UI:**

```typescript
class TranscriptAIPanel {
  private transcript: Transcript;
  private aiManager: AIProviderManager;

  render(containerEl: HTMLElement) {
    // Provider selection
    const providerSection = containerEl.createDiv('ai-provider-selection');
    const providerDropdown = new Setting(providerSection)
      .setName('AI Provider')
      .addDropdown(dropdown => {
        const providers = this.aiManager.getAvailableProviders();
        providers.forEach(provider => {
          dropdown.addOption(provider.name.toLowerCase(), provider.name);
        });
      });

    // Quick actions
    const actionsSection = containerEl.createDiv('ai-quick-actions');
    actionsSection.createEl('h3', { text: 'Quick Actions' });

    // Summary buttons
    const summaryButtons = actionsSection.createDiv('summary-buttons');
    this.createActionButton(summaryButtons, 'Brief Summary', async () => {
      await this.generateSummary({ style: 'brief' });
    });
    this.createActionButton(summaryButtons, 'Detailed Summary', async () => {
      await this.generateSummary({ style: 'detailed' });
    });
    this.createActionButton(summaryButtons, 'Key Quotes', async () => {
      await this.extractKeyQuotes();
    });

    // Custom query
    const querySection = containerEl.createDiv('ai-custom-query');
    querySection.createEl('h3', { text: 'Ask About This Video' });

    const queryInput = querySection.createEl('textarea', {
      placeholder: 'What would you like to know about this video?'
    });

    const queryButton = querySection.createEl('button', {
      text: 'Extract Answer',
      cls: 'mod-cta'
    });
    queryButton.onclick = async () => {
      const query = queryInput.value;
      await this.extractAnswer(query);
    };
  }

  async generateSummary(options: SummaryOptions) {
    const providerId = this.getSelectedProvider();

    // Show loading state
    const loadingNotice = new Notice('Generating summary...', 0);

    try {
      const summary = await this.aiManager.executeAITask(providerId, {
        type: 'summarize',
        transcript: this.transcript.text,
        options: options
      });

      // Insert summary into note
      await this.insertSummary(summary, options.style);

      loadingNotice.hide();
      new Notice('Summary generated!');

    } catch (error) {
      loadingNotice.hide();
      new Notice(`Error: ${error.message}`);
    }
  }

  async insertSummary(summary: string, style: string) {
    const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
    if (!editor) return;

    const summarySection = `\n\n## ${this.getSummaryTitle(style)}\n\n${summary}\n\n`;

    // Find insertion point (after transcript title but before transcript)
    const content = editor.getValue();
    const transcriptHeaderPos = content.indexOf('## Full Transcript');

    if (transcriptHeaderPos > 0) {
      editor.replaceRange(summarySection, {
        line: editor.offsetToPos(transcriptHeaderPos).line,
        ch: 0
      });
    } else {
      // Insert at cursor
      editor.replaceSelection(summarySection);
    }
  }
}
```

**Smart Features:**

```typescript
class SmartTranscriptFeatures {
  // Automatic chapter detection using AI
  async detectChapters(transcript: Transcript, provider: AIProvider): Promise<Chapter[]> {
    const prompt = `Analyze this video transcript and identify natural chapter breaks.
For each chapter, provide:
1. A descriptive title
2. Start timestamp
3. One-sentence summary

Transcript:
${transcript.text}

Format your response as JSON array:
[{"title": "...", "timestamp": "00:00", "summary": "..."}]`;

    const response = await provider.chat(transcript.text, prompt, []);
    const chapters = JSON.parse(response);

    return chapters;
  }

  // Generate study questions
  async generateStudyQuestions(transcript: Transcript, provider: AIProvider): Promise<string[]> {
    const prompt = `Based on this video transcript, generate 5-7 thought-provoking study questions that would help someone deeply understand the material. Questions should require reflection, not just recall.`;

    const response = await provider.chat(transcript.text, prompt, []);
    return this.parseQuestions(response);
  }

  // Extract action items
  async extractActionItems(transcript: Transcript, provider: AIProvider): Promise<ActionItem[]> {
    const prompt = `Extract any action items, tasks, recommendations, or next steps mentioned in this video. Format as a checklist.`;

    const response = await provider.chat(transcript.text, prompt, []);
    return this.parseActionItems(response);
  }

  // Identify key concepts
  async identifyKeyConcepts(transcript: Transcript, provider: AIProvider): Promise<Concept[]> {
    const prompt = `Identify the key concepts, terms, or ideas explained in this video. For each concept:
1. Name
2. Brief definition from the video
3. Timestamp where it's explained

This will be used to create a glossary.`;

    const response = await provider.chat(transcript.text, prompt, []);
    return this.parseConcepts(response);
  }
}
```

### 4.6 Cost Estimation & Management

```typescript
class CostEstimator {
  // API costs as of 2025
  private costs = {
    whisper: { perMinute: 0.006 },
    openai: {
      'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
      'gpt-4o-mini': { input: 0.150 / 1_000_000, output: 0.600 / 1_000_000 }
    },
    gemini: {
      'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Free tier
      'gemini-1.5-pro': { input: 1.25 / 1_000_000, output: 5.00 / 1_000_000 }
    },
    claude: {
      'claude-3-haiku': { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
      'claude-3-5-sonnet': { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 }
    }
  };

  estimateTranscriptionCost(durationMinutes: number, method: string): number {
    if (method === 'local') return 0;
    return durationMinutes * this.costs.whisper.perMinute;
  }

  estimateAICost(transcriptLength: number, operation: string, provider: string, model: string): number {
    const tokenCount = this.estimateTokens(transcriptLength);
    const outputTokens = this.estimateOutputTokens(operation);

    const pricing = this.costs[provider]?.[model];
    if (!pricing) return 0;

    return (tokenCount * pricing.input) + (outputTokens * pricing.output);
  }

  async showCostEstimate(videoInfo: VideoMetadata, settings: Settings): Promise<boolean> {
    const transcriptionCost = this.estimateTranscriptionCost(
      videoInfo.duration / 60,
      settings.transcriptionMethod
    );

    const modal = new Modal(this.app);
    modal.titleEl.setText('Cost Estimate');

    const { contentEl } = modal;
    contentEl.createEl('p', {
      text: `Video duration: ${formatDuration(videoInfo.duration)}`
    });
    contentEl.createEl('p', {
      text: `Transcription cost: $${transcriptionCost.toFixed(3)}`
    });

    if (settings.autoSummary) {
      const summaryCost = this.estimateAICost(
        videoInfo.estimatedTranscriptLength,
        'summary',
        settings.aiProvider,
        settings.aiModel
      );
      contentEl.createEl('p', {
        text: `Summary cost: $${summaryCost.toFixed(3)}`
      });
    }

    const totalCost = transcriptionCost + (settings.autoSummary ? summaryCost : 0);
    contentEl.createEl('h3', {
      text: `Total: $${totalCost.toFixed(3)}`
    });

    // Proceed button
    return await new Promise(resolve => {
      const buttonContainer = contentEl.createDiv('button-container');

      buttonContainer.createEl('button', { text: 'Proceed', cls: 'mod-cta' })
        .onclick = () => { modal.close(); resolve(true); };

      buttonContainer.createEl('button', { text: 'Cancel' })
        .onclick = () => { modal.close(); resolve(false); };
    });
  }
}
```

---

## 5. Note Generation & Organization

### 5.1 Transcript Note Template

The generated notes should be well-structured, searchable, and useful.

**Default Template:**

```markdown
---
video_url: {{url}}
platform: {{platform}}
title: {{title}}
duration: {{duration}}
transcribed_date: {{date}}
transcription_method: {{method}}
language: {{language}}
tags: [video, transcript, {{platform}}]
---

# {{title}}

## Metadata

- **Source:** [{{platform}}]({{url}})
- **Duration:** {{duration_formatted}}
- **Transcribed:** {{date}}
- **Language:** {{language}}

{{#if thumbnail}}
![Video Thumbnail]({{thumbnail}})
{{/if}}

{{#if description}}
## Description

{{description}}
{{/if}}

{{#if summary}}
## AI Summary

{{summary}}
{{/if}}

{{#if chapters}}
## Chapters

{{#each chapters}}
- **[{{timestamp}}]({{url}}?t={{seconds}})** - {{title}}
  {{#if summary}}
  > {{summary}}
  {{/if}}
{{/each}}
{{/if}}

## Full Transcript

{{#if timestamps}}
{{#each segments}}
**[{{timestamp}}]({{url}}?t={{seconds}})** {{text}}

{{/each}}
{{#else}}
{{transcript_text}}
{{/if}}

---

## Actions

- [ ] Review transcript
- [ ] Extract key insights
- [ ] Tag related notes
- [ ] Create summary note

## Related Notes

<!-- Link to related notes here -->

---

*Transcribed with Link Video Transcriber plugin*
*{{#if api_used}}API Cost: ${{cost}}{{else}}Local Whisper{{/if}}*
```

### 5.2 Template System Implementation

```typescript
class TranscriptNoteGenerator {
  private templateEngine: Handlebars;

  async generateNote(
    videoInfo: VideoMetadata,
    transcript: Transcript,
    aiContent?: AIContent
  ): Promise<string> {
    // Load user template or use default
    const template = await this.loadTemplate();

    // Prepare template data
    const data = {
      url: videoInfo.url,
      platform: videoInfo.platform,
      title: this.sanitizeTitle(videoInfo.title),
      duration: videoInfo.duration,
      duration_formatted: formatDuration(videoInfo.duration),
      date: moment().format('YYYY-MM-DD HH:mm'),
      method: transcript.method,
      language: transcript.language,
      thumbnail: videoInfo.thumbnail,
      description: videoInfo.description,

      // Transcript content
      transcript_text: transcript.text,
      segments: this.formatSegments(transcript.segments),
      timestamps: transcript.segments && transcript.segments.length > 0,

      // AI-generated content
      summary: aiContent?.summary,
      chapters: aiContent?.chapters,
      key_points: aiContent?.keyPoints,

      // Metadata
      cost: transcript.cost,
      api_used: transcript.method === 'api'
    };

    // Render template
    const noteContent = this.templateEngine.compile(template)(data);

    return noteContent;
  }

  async createNote(content: string, videoInfo: VideoMetadata): Promise<TFile> {
    // Determine note location
    const noteFolder = this.settings.transcriptFolder || 'Transcripts';
    await this.ensureFolderExists(noteFolder);

    // Generate filename
    const fileName = this.generateFileName(videoInfo);
    const filePath = `${noteFolder}/${fileName}.md`;

    // Check if file already exists
    if (await this.app.vault.adapter.exists(filePath)) {
      const shouldOverwrite = await this.confirmOverwrite(fileName);
      if (!shouldOverwrite) {
        // Generate unique filename
        filePath = await this.getUniqueFilePath(noteFolder, fileName);
      }
    }

    // Create note
    const file = await this.app.vault.create(filePath, content);

    // Open note
    if (this.settings.openAfterTranscription) {
      await this.app.workspace.getLeaf().openFile(file);
    }

    return file;
  }

  generateFileName(videoInfo: VideoMetadata): string {
    let fileName = videoInfo.title;

    // Sanitize filename
    fileName = fileName
      .replace(/[\\/:*?"<>|]/g, '') // Remove invalid characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length

    // Add prefix if configured
    if (this.settings.fileNamePrefix) {
      fileName = `${this.settings.fileNamePrefix} ${fileName}`;
    }

    // Add date if configured
    if (this.settings.includeDataInFileName) {
      const date = moment().format('YYYY-MM-DD');
      fileName = `${date} ${fileName}`;
    }

    return fileName;
  }

  formatSegments(segments: TranscriptSegment[]): FormattedSegment[] {
    return segments.map(segment => ({
      timestamp: this.formatTimestamp(segment.start),
      seconds: Math.floor(segment.start),
      text: segment.text.trim()
    }));
  }

  formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}
```

### 5.3 Advanced Organization Features

```typescript
class TranscriptOrganizer {
  // Automatically tag based on content
  async autoTag(transcript: Transcript, aiProvider: AIProvider): Promise<string[]> {
    const prompt = `Analyze this transcript and suggest 3-5 relevant tags/categories.
Consider the topic, domain, type of content (tutorial, lecture, interview, etc.).
Return only the tags as a comma-separated list.

Transcript: ${transcript.text.substring(0, 2000)}...`;

    const response = await aiProvider.chat(transcript.text, prompt, []);
    return response.split(',').map(tag => tag.trim().toLowerCase());
  }

  // Link to existing notes
  async findRelatedNotes(transcript: Transcript): Promise<TFile[]> {
    // Extract key terms
    const keyTerms = await this.extractKeyTerms(transcript.text);

    // Search vault for notes containing these terms
    const relatedNotes: TFile[] = [];
    const allFiles = this.app.vault.getMarkdownFiles();

    for (const file of allFiles) {
      const content = await this.app.vault.read(file);
      const relevance = this.calculateRelevance(content, keyTerms);

      if (relevance > 0.5) {
        relatedNotes.push(file);
      }
    }

    // Sort by relevance
    return relatedNotes.slice(0, 10);
  }

  // Create backlinks to related notes
  async insertBacklinks(noteFile: TFile, relatedNotes: TFile[]) {
    const content = await this.app.vault.read(noteFile);

    // Find "Related Notes" section
    const relatedSection = '## Related Notes';
    const relatedSectionPos = content.indexOf(relatedSection);

    if (relatedSectionPos === -1) return;

    // Generate backlinks
    const backlinks = relatedNotes
      .map(file => `- [[${file.basename}]]`)
      .join('\n');

    // Insert backlinks
    const newContent = content.replace(
      relatedSection,
      `${relatedSection}\n\n${backlinks}`
    );

    await this.app.vault.modify(noteFile, newContent);
  }
}
```

---

## 6. User Experience & Settings

### 6.1 Plugin Settings Interface

```typescript
interface VideoTranscriberSettings {
  // Video platforms
  enabledPlatforms: {
    youtube: boolean;
    instagram: boolean;
    twitter: boolean;
    telegram: boolean;
  };

  // Transcription
  transcriptionMethod: 'api' | 'local' | 'auto';
  whisperApiKey: string;
  localWhisperPath: string;
  whisperModelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  defaultLanguage: string;

  // AI Processing
  aiProvider: 'openai' | 'gemini' | 'claude';
  openaiApiKey: string;
  geminiApiKey: string;
  claudeApiKey: string;
  aiModel: string;
  autoSummary: boolean;
  autoChapters: boolean;

  // Note generation
  transcriptFolder: string;
  noteTemplate: string;
  fileNamePrefix: string;
  includeDateInFileName: boolean;
  openAfterTranscription: boolean;

  // Behavior
  autoDetectLinks: boolean;
  confirmBeforeTranscription: boolean;
  showCostEstimate: boolean;
  maxVideoDuration: number; // minutes, 0 = unlimited

  // Privacy
  privacyMode: boolean; // Prefer local processing
  saveAudioFiles: boolean;
  logTranscriptions: boolean;
}

class VideoTranscriberSettingTab extends PluginSettingTab {
  plugin: LinkVideoTranscriberPlugin;

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Platform Settings
    containerEl.createEl('h2', { text: 'Supported Platforms' });

    new Setting(containerEl)
      .setName('YouTube')
      .setDesc('Enable transcription for YouTube videos')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enabledPlatforms.youtube)
        .onChange(async (value) => {
          this.plugin.settings.enabledPlatforms.youtube = value;
          await this.plugin.saveSettings();
        }));

    // ... similar for other platforms

    // Transcription Settings
    containerEl.createEl('h2', { text: 'Transcription' });

    new Setting(containerEl)
      .setName('Transcription method')
      .setDesc('Choose between API, local Whisper, or automatic selection')
      .addDropdown(dropdown => dropdown
        .addOption('api', 'Whisper API (OpenAI)')
        .addOption('local', 'Local Whisper')
        .addOption('auto', 'Automatic (smart selection)')
        .setValue(this.plugin.settings.transcriptionMethod)
        .onChange(async (value) => {
          this.plugin.settings.transcriptionMethod = value as any;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show/hide relevant settings
        }));

    // API Key (conditional)
    if (this.plugin.settings.transcriptionMethod === 'api' ||
        this.plugin.settings.transcriptionMethod === 'auto') {
      new Setting(containerEl)
        .setName('OpenAI API Key')
        .setDesc('Required for Whisper API transcription')
        .addText(text => text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.whisperApiKey)
          .onChange(async (value) => {
            this.plugin.settings.whisperApiKey = value;
            await this.plugin.saveSettings();
          }));

      // Test API key button
      new Setting(containerEl)
        .setName('Test API Connection')
        .setDesc('Verify your API key works')
        .addButton(button => button
          .setButtonText('Test')
          .onClick(async () => {
            await this.testWhisperAPI();
          }));
    }

    // Local Whisper settings (conditional)
    if (this.plugin.settings.transcriptionMethod === 'local' ||
        this.plugin.settings.transcriptionMethod === 'auto') {

      new Setting(containerEl)
        .setName('Local Whisper Setup')
        .setDesc('Configure local Whisper installation')
        .addButton(button => button
          .setButtonText('Setup Wizard')
          .onClick(async () => {
            await this.openWhisperSetupWizard();
          }));

      new Setting(containerEl)
        .setName('Whisper model size')
        .setDesc('Larger models are more accurate but slower')
        .addDropdown(dropdown => dropdown
          .addOption('tiny', 'Tiny (fastest, least accurate)')
          .addOption('base', 'Base (balanced)')
          .addOption('small', 'Small (good quality)')
          .addOption('medium', 'Medium (better quality, slower)')
          .addOption('large', 'Large (best quality, slowest)')
          .setValue(this.plugin.settings.whisperModelSize)
          .onChange(async (value) => {
            this.plugin.settings.whisperModelSize = value as any;
            await this.plugin.saveSettings();
          }));
    }

    // AI Provider Settings
    containerEl.createEl('h2', { text: 'AI Processing' });

    new Setting(containerEl)
      .setName('AI Provider')
      .setDesc('Choose your preferred AI provider for summaries and extraction')
      .addDropdown(dropdown => dropdown
        .addOption('openai', 'OpenAI')
        .addOption('gemini', 'Google Gemini')
        .addOption('claude', 'Anthropic Claude')
        .setValue(this.plugin.settings.aiProvider)
        .onChange(async (value) => {
          this.plugin.settings.aiProvider = value as any;
          await this.plugin.saveSettings();
          this.display();
        }));

    // API keys for selected provider
    this.displayAIProviderSettings(containerEl);

    // Auto-processing options
    new Setting(containerEl)
      .setName('Auto-generate summary')
      .setDesc('Automatically create an AI summary after transcription')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoSummary)
        .onChange(async (value) => {
          this.plugin.settings.autoSummary = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Auto-detect chapters')
      .setDesc('Use AI to identify chapter breaks in long videos')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoChapters)
        .onChange(async (value) => {
          this.plugin.settings.autoChapters = value;
          await this.plugin.saveSettings();
        }));

    // Note Generation
    containerEl.createEl('h2', { text: 'Note Generation' });

    new Setting(containerEl)
      .setName('Transcript folder')
      .setDesc('Where to save transcript notes')
      .addText(text => text
        .setPlaceholder('Transcripts')
        .setValue(this.plugin.settings.transcriptFolder)
        .onChange(async (value) => {
          this.plugin.settings.transcriptFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Open after transcription')
      .setDesc('Automatically open the transcript note when complete')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.openAfterTranscription)
        .onChange(async (value) => {
          this.plugin.settings.openAfterTranscription = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Edit note template')
      .setDesc('Customize the transcript note template')
      .addButton(button => button
        .setButtonText('Edit Template')
        .onClick(async () => {
          await this.openTemplateEditor();
        }));

    // Behavior
    containerEl.createEl('h2', { text: 'Behavior' });

    new Setting(containerEl)
      .setName('Auto-detect links')
      .setDesc('Automatically detect video links when pasted')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoDetectLinks)
        .onChange(async (value) => {
          this.plugin.settings.autoDetectLinks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Confirm before transcription')
      .setDesc('Show confirmation dialog before starting transcription')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.confirmBeforeTranscription)
        .onChange(async (value) => {
          this.plugin.settings.confirmBeforeTranscription = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show cost estimate')
      .setDesc('Display estimated API costs before transcription')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showCostEstimate)
        .onChange(async (value) => {
          this.plugin.settings.showCostEstimate = value;
          await this.plugin.saveSettings();
        }));

    // Privacy
    containerEl.createEl('h2', { text: 'Privacy & Storage' });

    new Setting(containerEl)
      .setName('Privacy mode')
      .setDesc('Prefer local processing when possible (requires local Whisper)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.privacyMode)
        .onChange(async (value) => {
          this.plugin.settings.privacyMode = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Save audio files')
      .setDesc('Keep extracted audio files after transcription (for debugging)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.saveAudioFiles)
        .onChange(async (value) => {
          this.plugin.settings.saveAudioFiles = value;
          await this.plugin.saveSettings();
        }));
  }

  async testWhisperAPI(): Promise<void> {
    const notice = new Notice('Testing Whisper API...', 0);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.plugin.settings.whisperApiKey}`
        }
      });

      notice.hide();

      if (response.ok) {
        new Notice('✅ API key is valid!');
      } else {
        new Notice('❌ API key is invalid');
      }
    } catch (error) {
      notice.hide();
      new Notice(`❌ Error: ${error.message}`);
    }
  }
}
```

---

## 7. Technical Implementation Challenges & Solutions

### 7.1 Challenge: Video Download & Extraction

**Problem:** Downloading videos and extracting audio streams is complex and platform-dependent.

**Solution:**

```typescript
class VideoExtractor {
  private ytDlpPath: string;

  async extractAudio(url: string, platform: VideoPlatform): Promise<string> {
    // Ensure yt-dlp is available
    await this.ensureYtDlp();

    // Prepare output path
    const outputPath = path.join(this.getTempDir(), `${Date.now()}.mp3`);

    // Build yt-dlp command
    const args = [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '128K',
      '--no-playlist', // Don't download entire playlists
      '--no-warnings',
      '--progress', // Enable progress output
      '-o', outputPath,
      url
    ];

    // Add platform-specific options
    if (platform === 'instagram') {
      // Instagram might need cookies
      args.push('--cookies-from-browser', 'chrome');
    }

    // Execute with progress tracking
    await this.executeWithProgress(this.ytDlpPath, args, (progress) => {
      this.emit('extraction-progress', progress);
    });

    return outputPath;
  }

  async ensureYtDlp(): Promise<void> {
    // Check if yt-dlp exists
    if (await this.isYtDlpInstalled()) {
      // Check if update is needed
      await this.checkForUpdates();
      return;
    }

    // Not installed - offer to download
    const shouldInstall = await this.confirmInstallation();
    if (shouldInstall) {
      await this.downloadYtDlp();
    } else {
      throw new Error('yt-dlp is required for video extraction');
    }
  }

  async downloadYtDlp(): Promise<void> {
    const platform = process.platform;
    const urls = {
      'win32': 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
      'darwin': 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
      'linux': 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'
    };

    const url = urls[platform];
    if (!url) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const binPath = path.join(this.getBinDir(), 'yt-dlp');

    // Download
    await this.downloadFile(url, binPath, (progress) => {
      this.emit('download-progress', {
        tool: 'yt-dlp',
        percent: progress
      });
    });

    // Make executable (Unix-like systems)
    if (platform !== 'win32') {
      await fs.chmod(binPath, 0o755);
    }

    this.ytDlpPath = binPath;
  }
}
```

### 7.2 Challenge: Large File Handling

**Problem:** Long videos create large audio files that might exceed API limits or take too long to process.

**Solution: Chunking Strategy**

```typescript
class AudioChunker {
  async processLargeAudio(audioPath: string, maxSizeMB: number = 24): Promise<Transcript> {
    const fileSize = await this.getFileSize(audioPath);
    const sizeMB = fileSize / (1024 * 1024);

    if (sizeMB <= maxSizeMB) {
      // File is small enough, process directly
      return await this.transcriber.transcribe(audioPath);
    }

    // Need to chunk
    const duration = await this.getAudioDuration(audioPath);
    const chunkDuration = (duration * maxSizeMB) / sizeMB;

    // Split into chunks
    const chunks = await this.splitAudio(audioPath, chunkDuration);

    // Transcribe each chunk
    const transcripts: Transcript[] = [];
    for (let i = 0; i < chunks.length; i++) {
      this.emit('progress', {
        stage: 'transcribing',
        chunk: i + 1,
        totalChunks: chunks.length
      });

      const chunkTranscript = await this.transcriber.transcribe(chunks[i]);

      // Adjust timestamps
      chunkTranscript.segments = chunkTranscript.segments.map(seg => ({
        ...seg,
        start: seg.start + (i * chunkDuration),
        end: seg.end + (i * chunkDuration)
      }));

      transcripts.push(chunkTranscript);

      // Clean up chunk
      await fs.unlink(chunks[i]);
    }

    // Merge transcripts
    return this.mergeTranscripts(transcripts);
  }

  mergeTranscripts(transcripts: Transcript[]): Transcript {
    return {
      text: transcripts.map(t => t.text).join(' '),
      segments: transcripts.flatMap(t => t.segments),
      language: transcripts[0].language,
      duration: transcripts.reduce((sum, t) => sum + t.duration, 0)
    };
  }
}
```

### 7.3 Challenge: API Rate Limiting

**Problem:** Hitting API rate limits with multiple transcriptions or AI requests.

**Solution: Queue System**

```typescript
class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private rateLimits = {
    whisper: { maxPerMinute: 50, currentCount: 0 },
    openai: { maxPerMinute: 60, currentCount: 0 },
    gemini: { maxPerMinute: 100, currentCount: 0 }
  };

  async enqueue(request: TranscriptionRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      const service = this.getServiceForRequest(item.request);

      // Check rate limit
      if (this.rateLimits[service].currentCount >= this.rateLimits[service].maxPerMinute) {
        // Wait until rate limit resets
        await this.waitForRateLimit(service);
      }

      // Process request
      try {
        const result = await this.executeRequest(item.request);
        this.rateLimits[service].currentCount++;
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Remove from queue
      this.queue.shift();
    }

    this.processing = false;
  }

  private async waitForRateLimit(service: string): Promise<void> {
    // Wait 60 seconds for rate limit to reset
    await new Promise(resolve => setTimeout(resolve, 60000));
    this.rateLimits[service].currentCount = 0;
  }
}
```

### 7.4 Challenge: Error Handling & Recovery

**Problem:** Many things can go wrong (network errors, invalid URLs, DRM, etc.).

**Solution: Robust Error Handling**

```typescript
class TranscriptionErrorHandler {
  async handleTranscriptionError(error: Error, context: TranscriptionContext): Promise<void> {
    // Classify error
    const errorType = this.classifyError(error);

    switch (errorType) {
      case 'network':
        // Retry with backoff
        return await this.retryWithBackoff(context);

      case 'authentication':
        // Prompt for credentials
        new Notice('Authentication required. Please check settings.');
        // Guide user to settings
        this.openSettings();
        break;

      case 'rate_limit':
        // Queue for later
        new Notice('Rate limit reached. Request queued.');
        await this.queue.enqueue(context.request);
        break;

      case 'file_too_large':
        // Offer chunking
        const useChunking = await this.confirmChunking();
        if (useChunking) {
          return await this.transcribeWithChunking(context);
        }
        break;

      case 'unsupported_platform':
        new Notice(`Platform not supported: ${context.platform}`);
        break;

      case 'drm_protected':
        new Notice('This video is DRM-protected and cannot be transcribed.');
        break;

      case 'private_content':
        new Notice('This content is private. Authentication required.');
        break;

      default:
        // Generic error
        new Notice(`Error: ${error.message}`);
        console.error('Transcription error:', error);
    }
  }

  classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('auth') || message.includes('login')) {
      return 'authentication';
    }
    if (message.includes('rate') || message.includes('limit')) {
      return 'rate_limit';
    }
    if (message.includes('too large') || message.includes('size')) {
      return 'file_too_large';
    }
    if (message.includes('drm') || message.includes('protected')) {
      return 'drm_protected';
    }
    if (message.includes('private') || message.includes('permission')) {
      return 'private_content';
    }

    return 'unknown';
  }

  async retryWithBackoff(context: TranscriptionContext, attempt: number = 1): Promise<void> {
    const maxAttempts = 3;
    const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff

    if (attempt > maxAttempts) {
      throw new Error('Max retry attempts reached');
    }

    new Notice(`Retrying... (attempt ${attempt}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, backoffMs));

    try {
      return await this.transcriber.transcribe(context);
    } catch (error) {
      return await this.retryWithBackoff(context, attempt + 1);
    }
  }
}
```

---

## 8. Performance & Optimization

### 8.1 Caching Strategy

**Problem:** Re-transcribing the same video is wasteful.

**Solution: Transcript Cache**

```typescript
class TranscriptCache {
  private cacheDir: string;

  async getCached(videoUrl: string): Promise<Transcript | null> {
    const cacheKey = this.getCacheKey(videoUrl);
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);

    if (await fs.pathExists(cachePath)) {
      // Check if cache is still valid (e.g., < 30 days old)
      const stats = await fs.stat(cachePath);
      const ageMs = Date.now() - stats.mtimeMs;
      const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days

      if (ageMs < maxAgeMs) {
        const cached = await fs.readJSON(cachePath);
        return cached;
      } else {
        // Cache expired, delete it
        await fs.remove(cachePath);
      }
    }

    return null;
  }

  async setCached(videoUrl: string, transcript: Transcript): Promise<void> {
    const cacheKey = this.getCacheKey(videoUrl);
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);

    await fs.ensureDir(this.cacheDir);
    await fs.writeJSON(cachePath, transcript);
  }

  getCacheKey(url: string): string {
    // Create deterministic hash of URL
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  async clearCache(): Promise<void> {
    await fs.emptyDir(this.cacheDir);
    new Notice('Transcript cache cleared');
  }

  async getCacheSize(): Promise<number> {
    const files = await fs.readdir(this.cacheDir);
    let totalSize = 0;

    for (const file of files) {
      const stats = await fs.stat(path.join(this.cacheDir, file));
      totalSize += stats.size;
    }

    return totalSize;
  }
}
```

### 8.2 Memory Management

**Problem:** Processing large audio files can consume significant memory.

**Solution: Streaming & Cleanup**

```typescript
class MemoryManager {
  private tempFiles: Set<string> = new Set();

  async processWithCleanup<T>(
    processor: () => Promise<T>,
    tempFiles: string[]
  ): Promise<T> {
    // Track temp files
    tempFiles.forEach(file => this.tempFiles.add(file));

    try {
      const result = await processor();
      return result;
    } finally {
      // Always clean up, even if error occurred
      await this.cleanupTempFiles(tempFiles);
    }
  }

  async cleanupTempFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        if (await fs.pathExists(file)) {
          await fs.remove(file);
        }
        this.tempFiles.delete(file);
      } catch (error) {
        console.warn(`Failed to delete temp file: ${file}`, error);
      }
    }
  }

  async cleanup All(): Promise<void> {
    await this.cleanupTempFiles(Array.from(this.tempFiles));
  }

  // Monitor memory usage
  monitorMemory(): void {
    if (process.memoryUsage) {
      const used = process.memoryUsage();
      console.log('Memory usage:', {
        rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`
      });

      // Warn if memory usage is high
      if (used.heapUsed > 1024 * 1024 * 1024) { // 1GB
        new Notice('High memory usage detected. Consider closing other apps.');
      }
    }
  }
}
```

---

## 9. Security & Privacy Considerations

### 9.1 API Key Management

**Problem:** Storing API keys securely.

**Solution: Encrypted Storage**

```typescript
import { safeStorage } from 'electron';

class SecureSettingsManager {
  async saveAPIKey(service: string, apiKey: string): Promise<void> {
    if (safeStorage.isEncryptionAvailable()) {
      // Use OS keychain
      const encrypted = safeStorage.encryptString(apiKey);
      await this.storage.set(`${service}_api_key`, encrypted.toString('base64'));
    } else {
      // Fallback to obfuscated storage
      const obfuscated = this.obfuscate(apiKey);
      await this.storage.set(`${service}_api_key`, obfuscated);
    }
  }

  async getAPIKey(service: string): Promise<string | null> {
    const stored = await this.storage.get(`${service}_api_key`);
    if (!stored) return null;

    if (safeStorage.isEncryptionAvailable()) {
      const buffer = Buffer.from(stored, 'base64');
      return safeStorage.decryptString(buffer);
    } else {
      return this.deobfuscate(stored);
    }
  }

  // Simple obfuscation (not encryption!)
  private obfuscate(text: string): string {
    return Buffer.from(text).toString('base64');
  }

  private deobfuscate(text: string): string {
    return Buffer.from(text, 'base64').toString('utf-8');
  }
}
```

### 9.2 Privacy Mode

**Problem:** Users may not want to send audio to third-party APIs.

**Solution: Local-First Option**

```typescript
class PrivacyManager {
  enforcePrivacyMode(settings: Settings): TranscriptionOptions {
    if (settings.privacyMode) {
      return {
        transcriptionMethod: 'local',
        aiProcessing: 'local', // Future: local AI models
        cacheLocally: true,
        sendTelemetry: false
      };
    }

    return settings.defaultOptions;
  }

  async warnAboutPrivacy(operation: string): Promise<boolean> {
    if (this.settings.privacyMode && operation.includes('api')) {
      return await this.confirm(
        'Privacy Warning',
        'This operation will send data to a third-party API. Continue?'
      );
    }
    return true;
  }
}
```

### 9.3 Content Security

**Problem:** Downloaded videos might contain sensitive information.

**Solution: Automatic Cleanup & User Control**

```typescript
class ContentSecurityManager {
  async handleSensitiveContent(videoInfo: VideoMetadata): Promise<void> {
    // Check for indicators of sensitive content
    if (this.isSensitive(videoInfo)) {
      const proceed = await this.confirmSensitiveContent();
      if (!proceed) {
        throw new Error('User cancelled transcription of sensitive content');
      }
    }

    // Always clean up audio files unless explicitly saved
    if (!this.settings.saveAudioFiles) {
      this.registerForCleanup(videoInfo.audioPath);
    }
  }

  isSensitive(videoInfo: VideoMetadata): boolean {
    const sensitiveKeywords = ['private', 'confidential', 'internal', 'nda'];
    const title = videoInfo.title.toLowerCase();

    return sensitiveKeywords.some(keyword => title.includes(keyword));
  }
}
```

---

## 10. What's Possible vs. What's Not

### 10.1 Definitely Possible ✅

1. **YouTube Transcription**
   - Full support with high reliability
   - Both API and local Whisper options
   - Metadata extraction, thumbnails, chapters
   - Expected success rate: 95%+

2. **Basic Instagram Support**
   - Public Reels without authentication
   - Expected success rate: 70%

3. **Multi-AI Provider Integration**
   - OpenAI, Gemini, Claude all feasible
   - Summary and extraction features
   - Cost-effective implementation

4. **Local Whisper Integration**
   - Using whisper.cpp for good performance
   - Multiple model sizes
   - Privacy-friendly option

5. **Rich Note Generation**
   - Customizable templates
   - Automatic tagging and organization
   - Timestamp linking

### 10.2 Moderately Difficult ⚠️

1. **Full Instagram Support**
   - Requires authentication (complex UX)
   - Fragile due to Meta's anti-scraping
   - Expected success rate: 50-60%

2. **X/Twitter Support**
   - API is expensive ($5000/month for full access)
   - Scraping is fragile and breaks often
   - Expected success rate: 40-50%

3. **Canvas/Excalidraw Integration**
   - APIs are less documented
   - Requires integration with other plugins
   - Success depends on API stability

4. **Very Long Videos (2+ hours)**
   - Requires chunking strategy
   - More expensive with API
   - Local Whisper may take hours to process

### 10.3 Very Difficult / Not Realistic ❌

1. **Telegram Full Support**
   - Authentication complexity too high
   - Library size concerns
   - Recommendation: Exclude from V1, consider for V2

2. **Live Video Transcription**
   - Real-time processing not feasible with current architecture
   - Would require streaming API support

3. **DRM-Protected Content**
   - Technically impossible to extract
   - Legal concerns

4. **Private Social Media Content**
   - Requires complex OAuth flows
   - Privacy and ethical concerns
   - High maintenance burden

5. **Video Generation from Transcript**
   - Reverse direction not in scope
   - Extremely complex

### 10.4 Future Possibilities 🔮

1. **Local AI Models**
   - LLM.js or similar for local summarization
   - Would enable fully offline workflow
   - Timeline: 6-12 months as local models improve

2. **Collaborative Transcripts**
   - Multi-user editing of transcripts
   - Requires sync infrastructure
   - Timeline: Phase 3+

3. **Auto-Flashcard Generation**
   - Generate Anki/spaced-repetition cards from transcripts
   - Integration with study plugins
   - Timeline: Phase 2

4. **Video Timestamp Navigation**
   - Embed video player in Obsidian
   - Click timestamps to jump to video position
   - Timeline: Phase 2

---

## 11. Implementation Roadmap

### Phase 1: MVP (Core Functionality)

**Goal:** Basic transcription working for YouTube with one AI provider

**Features:**
- ✅ YouTube link detection in markdown files
- ✅ Video metadata extraction
- ✅ Whisper API transcription
- ✅ Basic note generation with transcript
- ✅ OpenAI integration for summaries
- ✅ Settings panel with API key configuration

**Timeline:** 4-6 weeks

**Success Criteria:**
- User can paste YouTube link
- Get transcription within 2 minutes (for 10-min video)
- Generate readable note with summary

### Phase 2: Enhancement (Multi-Platform & Local)

**Goal:** Add more platforms and local Whisper support

**Features:**
- ✅ Instagram Reels support (public only)
- ✅ Local Whisper integration (whisper.cpp)
- ✅ Multiple AI providers (Gemini, Claude)
- ✅ Advanced note templates
- ✅ Cost estimation
- ✅ Caching system

**Timeline:** 4-6 weeks

**Success Criteria:**
- 3 platforms supported
- Local option available
- User can choose AI provider

### Phase 3: Polish (UX & Advanced Features)

**Goal:** Make it production-ready and delightful to use

**Features:**
- ✅ Canvas integration
- ✅ Auto-chapter detection
- ✅ Key concepts extraction
- ✅ Study questions generation
- ✅ Better error handling
- ✅ Progress indicators
- ✅ Queue system for batch processing

**Timeline:** 3-4 weeks

**Success Criteria:**
- Smooth user experience
- Handles edge cases gracefully
- Professional polish

### Phase 4: Community (Optional)

**Goal:** Community-requested features

**Features:**
- ⚠️ Excalidraw integration
- ⚠️ X/Twitter support (with disclaimers)
- ⚠️ Telegram support (experimental)
- 🔮 Local AI models
- 🔮 Collaborative features
- 🔮 Advanced customization

**Timeline:** Ongoing

**Success Criteria:**
- Address top user requests
- Maintain high quality

---

## 12. Technical Stack & Dependencies

### 12.1 Core Dependencies

```json
{
  "dependencies": {
    // Obsidian
    "obsidian": "^1.4.0",

    // Video extraction
    "yt-dlp-wrap": "^2.3.0",  // Wrapper for yt-dlp

    // Audio processing
    "fluent-ffmpeg": "^2.1.2",
    "@ffmpeg-installer/ffmpeg": "^1.1.0",

    // AI providers
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "@google/generative-ai": "^0.1.0",

    // Utilities
    "axios": "^1.6.0",
    "form-data": "^4.0.0",
    "handlebars": "^4.7.8",
    "moment": "^2.29.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/fluent-ffmpeg": "^2.1.21",
    "typescript": "^5.0.0",
    "esbuild": "^0.19.0"
  }
}
```

### 12.2 External Tools (Downloaded by Plugin)

- **yt-dlp**: Video extraction (auto-downloaded)
- **ffmpeg**: Audio processing (bundled or auto-downloaded)
- **whisper.cpp** (optional): Local transcription (user setup)

### 12.3 Bundle Size Considerations

- Target: < 5 MB plugin size
- Heavy dependencies: Consider dynamic loading
- Consider bundling vs. runtime download

---

## 13. Testing Strategy

### 13.1 Unit Tests

```typescript
describe('LinkDetector', () => {
  it('should detect YouTube URLs', () => {
    const detector = new LinkDetector();
    const text = 'Check out https://youtube.com/watch?v=dQw4w9WgXcQ';
    const links = detector.extractVideoLinks(text);

    expect(links).toHaveLength(1);
    expect(links[0].platform).toBe('youtube');
    expect(links[0].id).toBe('dQw4w9WgXcQ');
  });

  it('should handle multiple links', () => {
    const detector = new LinkDetector();
    const text = `
      YouTube: https://youtube.com/watch?v=abc123
      Instagram: https://instagram.com/reel/xyz789
    `;
    const links = detector.extractVideoLinks(text);

    expect(links).toHaveLength(2);
  });
});

describe('TranscriptCache', () => {
  it('should cache and retrieve transcripts', async () => {
    const cache = new TranscriptCache();
    const url = 'https://youtube.com/watch?v=test';
    const transcript = { text: 'Test transcript' };

    await cache.setCached(url, transcript);
    const retrieved = await cache.getCached(url);

    expect(retrieved).toEqual(transcript);
  });
});
```

### 13.2 Integration Tests

```typescript
describe('YouTubeTranscription', () => {
  it('should transcribe a short video', async () => {
    // Use a known test video
    const url = 'https://youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo"

    const transcriber = new VideoTranscriber();
    const result = await transcriber.transcribe(url);

    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.language).toBe('en');
  }, 60000); // 60 second timeout
});
```

### 13.3 Manual Testing Checklist

- [ ] YouTube: Regular video
- [ ] YouTube: Long video (>1 hour)
- [ ] YouTube: Video with chapters
- [ ] YouTube: Private video (should fail gracefully)
- [ ] Instagram: Public Reel
- [ ] Error handling: Invalid URL
- [ ] Error handling: Network offline
- [ ] API key: Invalid key
- [ ] Local Whisper: Not installed
- [ ] Settings: Save and load correctly
- [ ] Note generation: Template works
- [ ] AI summary: Each provider
- [ ] Cache: Works correctly
- [ ] Performance: Large video

---

## 14. Documentation Plan

### 14.1 User Documentation

**README.md:**
- Quick start guide
- Installation instructions
- Basic usage examples
- Screenshots

**Wiki/Docs:**
- Detailed setup guide
- Platform-specific notes
- Troubleshooting
- FAQ
- Advanced features guide

**In-Plugin Help:**
- Setup wizards
- Contextual help tooltips
- Error messages with solutions

### 14.2 Developer Documentation

**Architecture.md:**
- System design overview
- Component interaction diagrams
- Data flow

**Contributing.md:**
- Development setup
- Code style guide
- PR process

**API.md:**
- Plugin API for extensions
- Hooks and events

---

## 15. Conclusion

The Link Video Transcriber plugin is a technically feasible and valuable addition to the Obsidian ecosystem. The core functionality—YouTube transcription with Whisper and AI summarization—is straightforward to implement and would provide immediate value to users.

### Key Takeaways:

**Strengths:**
- Strong use case: Video content consumption is ubiquitous
- Technical feasibility: Core components are well-established
- Multiple AI providers: Flexibility and future-proofing
- Privacy options: Local Whisper addresses privacy concerns

**Challenges:**
- Platform diversity: Each platform has unique obstacles
- Rate limiting: API costs and limits need management
- User experience: Setup complexity must be minimized
- Maintenance: Video platform APIs change frequently

**Realistic Scope for V1:**
- Focus on YouTube (95% of use cases)
- Whisper API first, local Whisper in V2
- One AI provider initially (OpenAI)
- Markdown file detection only

**Expansion for V2:**
- Instagram Reels
- Canvas integration
- Multiple AI providers
- Local Whisper option
- Advanced features (chapters, key concepts, etc.)

**Success Factors:**
1. Excellent UX for the common case (YouTube)
2. Clear setup process with helpful error messages
3. Transparent cost estimation
4. Privacy-conscious design
5. Regular updates to handle platform changes

The project should start with a focused MVP that does YouTube transcription excellently, then expand based on user feedback and demand. This approach balances ambition with pragmatism, ensuring a high-quality release while leaving room for future growth.

---

**Next Steps:**

1. Validate approach with small prototype
2. Test video extraction reliability
3. Benchmark transcription performance
4. Design settings UX mockups
5. Begin Phase 1 implementation

Total estimated time to V1 release: **8-10 weeks** of focused development.

---

*This white paper serves as the technical foundation for the Link Video Transcriber plugin. It should be treated as a living document, updated as implementation reveals new insights or challenges.*
