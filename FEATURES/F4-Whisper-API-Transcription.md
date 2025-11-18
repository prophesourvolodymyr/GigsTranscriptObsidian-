# F4: Whisper API Transcription

## Overview
The Whisper API Transcription component integrates with OpenAI's cloud-based Whisper API to convert video audio into accurate text transcripts. This is the primary transcription method offering fast, accurate, multi-language transcription without requiring local compute resources.

## User Story
As a user, I want to quickly transcribe videos using OpenAI's Whisper API, so that I can get high-quality transcripts without needing powerful hardware or dealing with local software installation.

## Technical Approach

### OpenAI Whisper API Specifications

**Endpoint:** `https://api.openai.com/v1/audio/transcriptions`
**Model:** `whisper-1`
**Cost:** $0.006 per minute of audio
**File Limit:** 25 MB per request
**Supported Formats:** mp3, mp4, mpeg, mpga, m4a, wav, webm
**Languages:** 57 languages supported
**Speed:** ~4x realtime (15-minute video = ~4 minutes processing)

### Transcription Flow

```typescript
interface TranscriptionOptions {
  language?: string; // ISO 639-1 code (e.g., 'en', 'es')
  prompt?: string; // Context to improve accuracy
  responseFormat?: 'json' | 'text' | 'srt' | 'vtt' | 'verbose_json';
  temperature?: number; // 0-1, sampling temperature
}

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptSegment[]; // With timestamps
}

interface TranscriptSegment {
  id: number;
  seek: number;
  start: number; // seconds
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avgLogprob: number;
  compressionRatio: number;
  noSpeechProb: number;
}

class WhisperAPITranscriber {
  private apiKey: string;

  async transcribe(
    audioFilePath: string,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    // 1. Validate file size
    const fileSize = await this.getFileSize(audioFilePath);
    if (fileSize > 25 * 1024 * 1024) {
      return await this.transcribeInChunks(audioFilePath, options);
    }

    // 2. Prepare multipart form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    if (options.language) {
      formData.append('language', options.language);
    }

    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    // 3. Make API request
    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      }
    );

    // 4. Handle response
    if (!response.ok) {
      throw await this.handleAPIError(response);
    }

    const result = await response.json();

    // 5. Track usage and cost
    await this.trackUsage(result.duration, options.language);

    return result;
  }
}
```

### Handling Large Files (>25MB)

**Chunking Strategy:**
1. Split audio into 20-minute segments (safe buffer under 25MB)
2. Transcribe each chunk sequentially
3. Merge transcripts with proper timing offsets
4. Use last sentence of chunk N as prompt for chunk N+1 (continuity)

```typescript
async transcribeInChunks(
  audioPath: string,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const chunks = await this.splitAudio(audioPath, 20 * 60); // 20 min chunks
  const transcripts: TranscriptionResult[] = [];
  let cumulativeTime = 0;

  for (let i = 0; i < chunks.length; i++) {
    // Use end of previous transcript as context
    const contextPrompt = i > 0
      ? this.extractLastSentence(transcripts[i - 1].text)
      : options.prompt;

    const chunkResult = await this.transcribe(chunks[i], {
      ...options,
      prompt: contextPrompt
    });

    // Adjust timestamps
    chunkResult.segments = chunkResult.segments?.map(seg => ({
      ...seg,
      start: seg.start + cumulativeTime,
      end: seg.end + cumulativeTime
    }));

    transcripts.push(chunkResult);
    cumulativeTime += chunkResult.duration;

    // Progress update
    this.emit('progress', {
      stage: 'transcribing',
      current: i + 1,
      total: chunks.length,
      percent: ((i + 1) / chunks.length) * 100
    });

    // Cleanup chunk file
    await fs.unlink(chunks[i]);
  }

  return this.mergeTranscripts(transcripts);
}
```

### Audio Preparation

Before sending to Whisper API:
1. **Format Conversion**: Convert to MP3 if not already
2. **Quality Optimization**: 128kbps is sufficient for speech
3. **Compression**: Reduce file size without losing clarity
4. **Validation**: Ensure audio is not corrupted

```typescript
async prepareAudio(rawAudioPath: string): Promise<string> {
  const outputPath = `${rawAudioPath}.prepared.mp3`;

  // Use FFmpeg to optimize audio
  await this.ffmpeg([
    '-i', rawAudioPath,
    '-ar', '16000',        // 16kHz sample rate (Whisper optimal)
    '-ac', '1',            // Mono
    '-ab', '128k',         // 128kbps bitrate
    '-acodec', 'libmp3lame',
    outputPath
  ]);

  // Verify output file
  const outputSize = await this.getFileSize(outputPath);
  if (outputSize === 0) {
    throw new Error('Audio preparation failed: output file is empty');
  }

  return outputPath;
}
```

## Dependencies
- **Depends on**: F3 (RapidAPI Integration for audio download)
- **Required APIs**: OpenAI API key
- **Obsidian APIs**: None
- **External Libraries**:
  - `form-data` for multipart uploads
  - FFmpeg for audio processing (optional, for optimization)

## UI/UX Design

### Transcription Progress

```
┌─────────────────────────────────────────┐
│  🎙️ Transcribing Audio...              │
│                                          │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  65%        │
│                                          │
│  Processing chunk 2 of 3                │
│  Estimated time remaining: 1 minute     │
│                                          │
│  Language: English (auto-detected)      │
│  Duration: 15:30                        │
│  Cost: $0.09                            │
│                                          │
│  [Cancel]                               │
└─────────────────────────────────────────┘
```

### Language Selection

```
┌─────────────────────────────────────────┐
│  Select Transcription Language          │
│                                          │
│  ● Auto-detect (recommended)            │
│  ○ English                              │
│  ○ Spanish                              │
│  ○ French                               │
│  ○ German                               │
│  ○ [More languages...]                  │
│                                          │
│  ℹ️ Auto-detect works for 57 languages  │
│                                          │
│  [Continue]  [Cancel]                   │
└─────────────────────────────────────────┘
```

### Cost Estimate

Before transcription:
```
📊 Transcription Cost Estimate

Video Duration: 45:30
Estimated Cost: $0.27

Your Plan: OpenAI Pay-as-you-go
This Month: $2.14 / ~$5 budgeted

[Proceed] [Use Local Whisper] [Cancel]
```

## Edge Cases

1. **File Too Large (>25MB)**
   - Automatically chunk audio
   - Show chunking progress
   - Seamlessly merge results

2. **API Rate Limit**
   - Detect 429 response
   - Wait and retry with exponential backoff
   - Offer to queue transcription for later

3. **Poor Audio Quality**
   - Whisper will do its best
   - Warn user if `noSpeechProb` is high
   - Suggest trying different audio source

4. **Network Failure Mid-Transcription**
   - Save progress (completed chunks)
   - Resume from last successful chunk
   - Don't re-transcribe already done segments

5. **Invalid API Key**
   - Clear error message
   - Link to API key settings
   - Offer local Whisper as alternative

6. **Non-Speech Audio (Music Only)**
   - Detect low speech probability
   - Warn user that transcription may be nonsensical
   - Option to cancel

## Testing Strategy

### Unit Tests
```typescript
describe('WhisperAPITranscriber', () => {
  test('prepares audio file correctly', async () => {
    const prepared = await transcriber.prepareAudio('test.wav');
    expect(prepared).toMatch(/\.mp3$/);
    const stats = await fs.stat(prepared);
    expect(stats.size).toBeLessThan(25 * 1024 * 1024);
  });

  test('chunks large file appropriately', async () => {
    const largeFile = 'large-audio.mp3'; // 50 MB
    const chunks = await transcriber.splitAudio(largeFile, 20 * 60);
    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      const size = await fs.stat(chunk).then(s => s.size);
      expect(size).toBeLessThan(25 * 1024 * 1024);
    }
  });

  test('merges chunked transcripts correctly', () => {
    const chunks = [
      { text: 'First part.', duration: 600, segments: [...] },
      { text: 'Second part.', duration: 600, segments: [...] }
    ];
    const merged = transcriber.mergeTranscripts(chunks);
    expect(merged.text).toBe('First part. Second part.');
    expect(merged.duration).toBe(1200);
  });
});
```

### Integration Tests
- Test with real OpenAI API key
- Transcribe short test audio (30 seconds)
- Verify response format
- Test different languages
- Test file size limit handling

### Manual Testing
- [ ] Short video (< 5 min) → Fast transcription
- [ ] Long video (> 30 min) → Chunking works
- [ ] Multiple languages → Auto-detect works
- [ ] Poor audio quality → Handles gracefully
- [ ] Network interruption → Resumes correctly
- [ ] Invalid API key → Clear error

## Implementation Complexity
**Medium**

- API integration: Easy
- File handling: Medium
- Chunking logic: Medium
- Progress tracking: Easy
- Error recovery: Medium

## Priority
**Must-Have** 🔴

Primary transcription method for most users.

## Estimated Effort
**4-5 days**

- Day 1: Core API integration
- Day 2: File preparation + chunking
- Day 3: Progress tracking + UI
- Day 4: Error handling + retry logic
- Day 5: Testing + optimization

## Implementation Notes

### Performance Optimization

**Parallel Chunk Processing:**
For users with multiple videos:
```typescript
class BatchTranscriber {
  async transcribeMultiple(videos: Video[]): Promise<Transcript[]> {
    const chunks = videos.flatMap(v => this.getChunks(v));

    // Process up to 3 chunks in parallel
    const results = await Promise.allSettled(
      chunks.map(chunk => this.transcribe(chunk))
    );

    return results.map(r => r.status === 'fulfilled' ? r.value : null);
  }
}
```

**Caching:**
- Cache transcripts for 30 days
- Check cache before API call
- Offer to use cached version if video already transcribed

### Quality Enhancements

**Context Prompts:**
```typescript
const contextPrompts = {
  technical: 'This is a technical tutorial about programming and software development.',
  educational: 'This is an educational lecture from a university course.',
  podcast: 'This is a podcast conversation between multiple speakers.',
  music: 'This audio contains music with lyrics.'
};

// Let user select or auto-detect context
const prompt = userContext || this.detectContext(videoMetadata);
```

**Language Hints:**
```typescript
// Improve accuracy for code-switching
const multilingualPrompt = 'This video contains English with occasional Spanish phrases.';

// Technical vocabulary
const technicalPrompt = 'Common terms: API, database, authentication, Obsidian, plugin.';
```

### Cost Management

**Budget Tracking:**
```typescript
class CostTracker {
  async recordTranscription(duration: number): Promise<void> {
    const cost = duration / 60 * 0.006; // $0.006 per minute
    await this.addToBudget('whisper-api', cost);

    if (this.isNearBudgetLimit()) {
      this.warnUser('⚠️ Approaching monthly transcription budget');
    }
  }

  getMonthlySpend(): number {
    return this.getBudgetUsage('whisper-api', 'current-month');
  }
}
```

**Smart Recommendations:**
```
💡 Cost Saving Tip
Videos over 30 minutes cost less with local Whisper.
This video (45 min) would cost $0.27 via API vs $0 locally.

[Switch to Local] [Continue with API] [Don't show again]
```

### Future Enhancements
- Whisper API v2 support (when released)
- Speaker diarization (identify who is speaking)
- Automatic punctuation improvement
- Custom vocabulary injection
- Real-time streaming transcription
- Subtitle format export (SRT, VTT)
