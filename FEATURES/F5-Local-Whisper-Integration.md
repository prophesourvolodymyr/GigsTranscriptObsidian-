# F5: Local Whisper Integration

## Overview
Local Whisper Integration enables users to transcribe videos using OpenAI's Whisper models running directly on their machine via whisper.cpp. This provides a privacy-focused, cost-free alternative to the Whisper API, ideal for users who want complete data control or have limited internet connectivity.

## User Story
As a privacy-conscious user, I want to transcribe videos locally on my computer without sending audio to cloud services, so that sensitive content never leaves my machine and I avoid ongoing API costs.

## Technical Approach

### whisper.cpp Implementation

**Why whisper.cpp:**
- Standalone C++ binary (no Python dependencies)
- Fast CPU/GPU inference
- Small binary size (~5-10 MB)
- Cross-platform (Windows, macOS, Linux)
- Active maintenance and optimization
- Metal (Mac), CUDA (NVIDIA), OpenCL support

**Model Options:**

| Model | Size | RAM | Speed | Accuracy | Use Case |
|-------|------|-----|-------|----------|----------|
| tiny | 75 MB | 1 GB | 32x | Fair | Quick drafts, testing |
| base | 142 MB | 1 GB | 16x | Good | Daily use, short videos |
| small | 466 MB | 2 GB | 6x | Better | Balanced quality/speed |
| medium | 1.5 GB | 5 GB | 2x | Very Good | High quality needed |
| large-v3 | 2.9 GB | 10 GB | 1x | Best | Critical accuracy |

### Setup Wizard Flow

```typescript
class LocalWhisperSetup {
  async runSetupWizard(): Promise<void> {
    // Step 1: Welcome
    await this.showWelcome();

    // Step 2: Check system requirements
    const systemCheck = await this.checkSystem();
    if (!systemCheck.meetsRequirements) {
      await this.showSystemWarning(systemCheck);
    }

    // Step 3: Install whisper.cpp
    const installChoice = await this.offerInstallation();
    if (installChoice === 'auto') {
      await this.downloadWhisperBinary();
    } else if (installChoice === 'manual') {
      await this.showManualInstructions();
    }

    // Step 4: Select and download model
    const model = await this.selectModel();
    await this.downloadModel(model);

    // Step 5: Test transcription
    await this.runTest();

    // Step 6: Save configuration
    await this.saveSettings();
  }

  async checkSystem(): Promise<SystemCheck> {
    return {
      os: process.platform,
      arch: process.arch,
      ramGB: os.totalmem() / (1024**3),
      cpuCores: os.cpus().length,
      gpuAvailable: await this.detectGPU(),
      diskSpaceGB: await this.getAvailableDiskSpace(),
      meetsRequirements: true // Calculate based on above
    };
  }

  async downloadWhisperBinary(): Promise<void> {
    const platform = process.platform;
    const arch = process.arch;

    const downloadUrl = this.getWhisperDownloadURL(platform, arch);

    await this.downloadFile(downloadUrl, this.getWhisperPath(), {
      onProgress: (percent) => {
        this.emit('download-progress', {
          item: 'whisper.cpp',
          percent
        });
      }
    });

    // Make executable on Unix
    if (platform !== 'win32') {
      await fs.chmod(this.getWhisperPath(), 0o755);
    }
  }

  async downloadModel(modelName: string): Promise<void> {
    const modelUrl = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${modelName}.bin`;
    const modelPath = path.join(this.getModelsDir(), `ggml-${modelName}.bin`);

    // Check if already downloaded
    if (await this.fileExists(modelPath)) {
      const useExisting = await this.confirm(
        'Model already exists',
        'Use existing model or re-download?'
      );
      if (useExisting) return;
    }

    await this.downloadFile(modelUrl, modelPath, {
      onProgress: (percent, downloadedMB, totalMB) => {
        this.emit('download-progress', {
          item: `Model: ${modelName}`,
          percent,
          downloaded: downloadedMB,
          total: totalMB
        });
      }
    });
  }
}
```

### Transcription Execution

```typescript
class LocalWhisperTranscriber {
  private whisperPath: string;
  private modelPath: string;

  async transcribe(
    audioPath: string,
    options: LocalTranscriptionOptions
  ): Promise<TranscriptionResult> {
    // Prepare command arguments
    const args = [
      '-m', this.modelPath,
      '-f', audioPath,
      '-l', options.language || 'auto',
      '-t', options.threads || this.getOptimalThreadCount(),
      '-ot', 'json', // Output format: JSON
      '--output-dir', this.getTempDir()
    ];

    // Performance optimizations
    if (options.useGPU && await this.hasGPU()) {
      args.push('-gpu');
    }

    // Quality settings
    if (options.translate) {
      args.push('--translate'); // Translate to English
    }

    if (options.timestamps === 'word') {
      args.push('--max-len', '1'); // Word-level timestamps
    }

    // Execute whisper.cpp
    const process = spawn(this.whisperPath, args);

    // Monitor progress
    await this.monitorProgress(process, (progress) => {
      this.emit('progress', {
        stage: 'transcribing-local',
        percent: progress,
        speed: this.calculateSpeed(progress)
      });
    });

    // Wait for completion
    await this.waitForProcess(process);

    // Read output file
    const outputFile = path.join(this.getTempDir(), 'transcription.json');
    const result = JSON.parse(await fs.readFile(outputFile, 'utf-8'));

    return this.parseWhisperOutput(result);
  }

  private getOptimalThreadCount(): number {
    const cpus = os.cpus().length;
    // Leave 1-2 cores free for system
    return Math.max(1, cpus - 2);
  }

  private async hasGPU(): Promise<boolean> {
    // Check for CUDA, Metal, or OpenCL
    if (process.platform === 'darwin') {
      // macOS always has Metal
      return true;
    }
    // Check for NVIDIA GPU
    return await this.detectNVIDIA();
  }

  private async monitorProgress(
    process: ChildProcess,
    onProgress: (percent: number) => void
  ): Promise<void> {
    let currentPercent = 0;

    process.stderr?.on('data', (data) => {
      const output = data.toString();

      // Parse whisper.cpp progress output
      // Format: "[00:01:30.000 --> 00:01:35.000]  text here"
      const progressMatch = output.match(/\[(\d{2}):(\d{2}):(\d{2})/);

      if (progressMatch) {
        const [_, hours, minutes, seconds] = progressMatch;
        const currentTime = parseInt(hours) * 3600 +
                           parseInt(minutes) * 60 +
                           parseInt(seconds);

        const percent = (currentTime / this.audioDuration) * 100;

        if (percent > currentPercent) {
          currentPercent = percent;
          onProgress(Math.min(percent, 99));
        }
      }
    });
  }
}
```

## Dependencies
- **Depends on**: F3 (RapidAPI for audio download)
- **Required APIs**: None (fully local)
- **Obsidian APIs**: None
- **External Dependencies**:
  - whisper.cpp binary (auto-downloaded)
  - Whisper model files (auto-downloaded)
  - FFmpeg (for audio preprocessing)

## UI/UX Design

### Setup Wizard

**Step 1: Welcome**
```
┌────────────────────────────────────────────┐
│  🎙️ Local Whisper Setup                   │
│                                             │
│  Transcribe videos privately on your       │
│  computer without cloud services.          │
│                                             │
│  Requirements:                              │
│  ✓ 2+ GB RAM (4 GB recommended)           │
│  ✓ 1-5 GB disk space (depending on model) │
│  ✓ Internet (for initial setup only)      │
│                                             │
│  Benefits:                                  │
│  • Complete privacy - audio never uploads  │
│  • No ongoing costs                        │
│  • Works offline                           │
│  • Faster for long videos (with good CPU) │
│                                             │
│  [Continue]  [Cancel]                      │
└────────────────────────────────────────────┘
```

**Step 2: Model Selection**
```
┌────────────────────────────────────────────┐
│  Select Whisper Model                       │
│                                             │
│  ● base (142 MB) - Recommended             │
│    • Fast: 10-min video in ~1 min          │
│    • Good accuracy for most content        │
│    • Low memory usage (1 GB)              │
│                                             │
│  ○ small (466 MB) - Better Quality         │
│    • Moderate speed: 10-min video in ~2min │
│    • Higher accuracy                       │
│    • Moderate memory (2 GB)                │
│                                             │
│  ○ medium (1.5 GB) - High Quality          │
│    • Slower: 10-min video in ~5 min        │
│    • Very good accuracy                    │
│    • High memory (5 GB)                    │
│                                             │
│  ℹ️ You can change models later in settings│
│                                             │
│  [Download & Continue]  [Back]             │
└────────────────────────────────────────────┘
```

**Step 3: Download Progress**
```
┌────────────────────────────────────────────┐
│  Downloading whisper.cpp...                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%          │
│  Complete (8.2 MB)                         │
│                                             │
│  Downloading model: base                    │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░  45%          │
│  64 MB / 142 MB                            │
│  Speed: 2.1 MB/s • ETA: 37s                │
│                                             │
│  [Pause]  [Cancel]                         │
└────────────────────────────────────────────┘
```

**Step 4: Test Transcription**
```
┌────────────────────────────────────────────┐
│  ✅ Setup Complete!                        │
│                                             │
│  Running test transcription...              │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░  67%          │
│                                             │
│  Test audio (5 seconds):                    │
│  "Welcome to Obsidian. This is a test."    │
│                                             │
│  ✓ Transcription successful!               │
│  • Speed: 8x realtime                      │
│  • Quality: Excellent                      │
│  • GPU: Detected (Metal)                   │
│                                             │
│  [Finish Setup]                            │
└────────────────────────────────────────────┘
```

### Transcription Progress

```
┌─────────────────────────────────────────┐
│  🎙️ Transcribing Locally...             │
│                                          │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░  52%       │
│                                          │
│  Time: 00:05:23 / 00:10:30              │
│  Speed: 4.2x realtime                   │
│  ETA: 1 minute remaining                │
│                                          │
│  Model: base                            │
│  Using: GPU (Metal)                     │
│  Threads: 6 of 8 cores                  │
│                                          │
│  💰 Cost: $0.00 (saved $0.06)           │
│                                          │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

## Edge Cases

1. **Insufficient RAM**
   - Detect before transcription
   - Suggest smaller model
   - Offer to use Whisper API instead

2. **Model File Corruption**
   - Verify checksum after download
   - Re-download if corrupted
   - Keep backup of working model

3. **Binary Not Executable**
   - Auto-set permissions on Unix
   - Provide manual instructions if fails
   - Check for antivirus blocking

4. **Very Long Videos (>2 hours)**
   - Warn about processing time
   - Estimate time based on benchmark
   - Option to use API for long videos

5. **Background Processing**
   - Allow transcription while Obsidian is minimized
   - Send system notification on completion
   - Save partial progress if interrupted

6. **Multiple Simultaneous Transcriptions**
   - Queue requests (one at a time)
   - Show queue status
   - Prioritize user-initiated requests

## Testing Strategy

### Unit Tests
```typescript
describe('LocalWhisperTranscriber', () => {
  test('detects optimal thread count', () => {
    const threads = transcriber.getOptimalThreadCount();
    expect(threads).toBeLessThanOrEqual(os.cpus().length);
    expect(threads).toBeGreaterThan(0);
  });

  test('validates model file exists', async () => {
    const valid = await transcriber.validateModel('base');
    expect(valid).toBeDefined();
  });

  test('parses progress output correctly', () => {
    const output = '[00:01:30.000 --> 00:01:35.000]  Hello world';
    const progress = transcriber.parseProgress(output, 300); // 5 min total
    expect(progress).toBeCloseTo(30, 1); // ~30%
  });
});
```

### Integration Tests
- Test full transcription with each model
- Verify output format matches API format
- Test GPU acceleration if available
- Test cancellation and resume
- Measure performance benchmarks

### Manual Testing
- [ ] Complete setup wizard on fresh install
- [ ] Download each model size
- [ ] Transcribe 5-min video → Check speed
- [ ] Transcribe 30-min video → Check memory
- [ ] Cancel mid-transcription → Cleanup works
- [ ] Run multiple transcriptions → Queue works
- [ ] Compare quality: tiny vs base vs small

## Implementation Complexity
**High**

- Binary management: Medium
- Process spawning: Medium
- Progress monitoring: Hard
- Cross-platform support: Hard
- GPU detection: Hard

## Priority
**Should-Have** 🟡

Important for privacy-conscious users and cost-sensitive users, but Whisper API can serve as primary method.

## Estimated Effort
**7-10 days**

- Day 1-2: Setup wizard UI
- Day 3-4: Binary download + installation
- Day 5-6: Transcription execution + progress monitoring
- Day 7-8: Cross-platform testing
- Day 9: GPU support
- Day 10: Polish + documentation

## Implementation Notes

### Performance Benchmarks

Target performance (base model):
- **CPU (Intel i7)**: 8-10x realtime
- **GPU (Metal/M1)**: 15-20x realtime
- **GPU (NVIDIA 3060)**: 20-30x realtime

### Model Management

```typescript
class ModelManager {
  private models = ['tiny', 'base', 'small', 'medium', 'large-v3'];

  async downloadModel(name: string): Promise<void> {
    const url = this.getModelURL(name);
    const path = this.getModelPath(name);

    // Resume support
    const existingSize = await this.getFileSize(path);

    await this.downloadFile(url, path, {
      resumeFrom: existingSize,
      onProgress: this.updateProgress,
      verify: true // Checksum validation
    });
  }

  async switchModel(newModel: string): Promise<void> {
    if (!await this.isModelDownloaded(newModel)) {
      await this.downloadModel(newModel);
    }

    this.settings.whisperModel = newModel;
    await this.saveSettings();
  }

  async deleteUnusedModels(): Promise<void> {
    const current = this.settings.whisperModel;
    const allModels = await this.getDownloadedModels();

    for (const model of allModels) {
      if (model !== current) {
        await this.deleteModel(model);
      }
    }
  }
}
```

### Smart Method Selection

```typescript
class TranscriptionMethodSelector {
  shouldUseLocal(context: TranscriptionContext): boolean {
    const factors = {
      videoLength: context.duration,
      hasLocalWhisper: this.isLocalInstalled(),
      hasGoodCPU: this.benchmarkScore > 0.7,
      privacyMode: this.settings.privacyMode,
      hasInternet: this.isOnline(),
      apiCost: context.duration / 60 * 0.006
    };

    // Privacy mode → always local
    if (factors.privacyMode && factors.hasLocalWhisper) {
      return true;
    }

    // No internet → must use local
    if (!factors.hasInternet) {
      return factors.hasLocalWhisper;
    }

    // Long video + good CPU → local is better
    if (factors.videoLength > 1800 && factors.hasGoodCPU) {
      return true;
    }

    // Short video → API is faster
    if (factors.videoLength < 600) {
      return false;
    }

    // Default to API
    return false;
  }
}
```

### Future Enhancements
- Whisper.cpp updates auto-detection
- Fine-tuned models for specific domains
- Multiple model support (switch based on language)
- Distilled models for faster processing
- CPU instruction optimization (AVX2, AVX-512)
- Distributed processing (use multiple machines)
