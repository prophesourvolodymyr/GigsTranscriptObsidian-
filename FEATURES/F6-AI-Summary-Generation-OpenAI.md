# F6: AI Summary Generation (OpenAI)

## Overview
AI Summary Generation uses OpenAI's GPT models (GPT-4o, GPT-4o-mini) to process raw transcripts and generate intelligent summaries, key points, action items, and insights. This transforms verbose transcripts into digestible, actionable knowledge.

## User Story
As a user, I want AI to automatically summarize long video transcripts and extract key insights, so that I can quickly understand the content without reading through the entire transcript.

## Technical Approach

### GPT Model Selection

**GPT-4o-mini** (Default - Cost-Effective)
- Cost: $0.15/1M input tokens, $0.60/1M output tokens
- Speed: Fast (~2-3 seconds for summary)
- Quality: Excellent for most summaries
- Context: 128K tokens
- Use case: Daily transcripts, quick summaries

**GPT-4o** (Premium - Highest Quality)
- Cost: $2.50/1M input tokens, $10/1M output tokens
- Speed: Moderate (~5-8 seconds)
- Quality: Best-in-class
- Context: 128K tokens
- Use case: Critical content, detailed analysis

### Summary Generation Flow

```typescript
interface SummaryOptions {
  model: 'gpt-4o-mini' | 'gpt-4o';
  style: 'concise' | 'detailed' | 'academic' | 'bullet-points';
  includeTimestamps?: boolean;
  extractQuotes?: boolean;
  generateQuestions?: boolean;
  language?: string;
}

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems?: string[];
  quotes?: Quote[];
  questions?: string[];
  topics?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  estimatedReadTime: number;
}

class OpenAISummarizer {
  private apiKey: string;

  async generateSummary(
    transcript: string,
    metadata: VideoMetadata,
    options: SummaryOptions
  ): Promise<SummaryResult> {
    // 1. Prepare prompt
    const prompt = this.buildPrompt(transcript, metadata, options);

    // 2. Call OpenAI API
    const response = await this.callOpenAI({
      model: options.model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(options)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower = more focused
      maxTokens: 2000   // Generous for detailed summaries
    });

    // 3. Parse structured output
    const result = this.parseAIResponse(response);

    // 4. Post-process
    return this.enhanceResult(result, metadata);
  }

  private buildPrompt(
    transcript: string,
    metadata: VideoMetadata,
    options: SummaryOptions
  ): string {
    const context = `
Video Title: ${metadata.title}
Platform: ${metadata.platform}
Duration: ${this.formatDuration(metadata.duration)}
Author: ${metadata.author || 'Unknown'}

Transcript:
${transcript}
    `.trim();

    const instructions = this.getInstructions(options);

    return `${context}\n\n${instructions}`;
  }

  private getSystemPrompt(options: SummaryOptions): string {
    const basePrompt = `You are an expert at analyzing video transcripts and extracting key information.
Your summaries are clear, well-structured, and capture the essence of the content.`;

    const stylePrompts = {
      'concise': 'Keep summaries brief and to the point (2-3 paragraphs maximum).',
      'detailed': 'Provide comprehensive summaries with all important details.',
      'academic': 'Use formal, academic language and structure.',
      'bullet-points': 'Use bullet points and short phrases for easy scanning.'
    };

    return `${basePrompt}\n${stylePrompts[options.style]}`;
  }

  private getInstructions(options: SummaryOptions): string {
    let instructions = `Please analyze this video transcript and provide:\n\n`;

    instructions += `1. **Summary**: A ${options.style} summary of the main content\n`;
    instructions += `2. **Key Points**: 5-7 main takeaways (bullet points)\n`;

    if (options.extractQuotes) {
      instructions += `3. **Notable Quotes**: 2-3 impactful quotes with timestamps\n`;
    }

    if (options.generateQuestions) {
      instructions += `4. **Discussion Questions**: 3-5 questions for deeper understanding\n`;
    }

    instructions += `5. **Topics**: Main topics/themes covered\n`;
    instructions += `6. **Action Items**: Any actionable steps or recommendations mentioned\n\n`;

    instructions += `Format your response as JSON with these fields: summary, keyPoints, quotes, questions, topics, actionItems, sentiment`;

    return instructions;
  }

  private async callOpenAI(request: OpenAIRequest): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw await this.handleAPIError(response);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseAIResponse(response: string): SummaryResult {
    try {
      // Try to parse as JSON first
      const json = JSON.parse(response);
      return json;
    } catch {
      // Fallback: Parse structured text
      return this.parseStructuredText(response);
    }
  }
}
```

### Advanced Features

**Chapter Detection:**
```typescript
async detectChapters(
  transcript: string,
  segments: TranscriptSegment[]
): Promise<Chapter[]> {
  const prompt = `Analyze this transcript and identify natural chapter breaks.
For each chapter, provide:
- Start time (from timestamp)
- Title (descriptive, 3-5 words)
- Summary (1-2 sentences)

Transcript with timestamps:
${this.formatSegments(segments)}

Return as JSON array of chapters.`;

  const response = await this.callOpenAI({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  });

  return JSON.parse(response);
}
```

**Concept Extraction:**
```typescript
async extractConcepts(transcript: string): Promise<Concept[]> {
  const prompt = `Extract key concepts, terminology, and definitions from this transcript.
For each concept:
- Name: The term or concept
- Definition: Brief explanation
- Context: How it's used in the video
- Related: Related concepts mentioned

Focus on technical terms, important ideas, and novel concepts.`;

  // ... implementation
}
```

## Dependencies
- **Depends on**: F4 or F5 (Transcription)
- **Required APIs**: OpenAI API key
- **Obsidian APIs**: None
- **External Libraries**: `openai` SDK (optional)

## UI/UX Design

### Summary Generation Options

```
┌────────────────────────────────────────────┐
│  📝 Generate AI Summary                    │
│                                             │
│  Style:                                     │
│  ● Concise (2-3 paragraphs)               │
│  ○ Detailed (comprehensive)                │
│  ○ Bullet Points (easy scan)               │
│  ○ Academic (formal)                       │
│                                             │
│  Include:                                   │
│  ☑ Key takeaways                          │
│  ☑ Action items                           │
│  ☑ Notable quotes                         │
│  ☑ Discussion questions                   │
│  ☐ Chapter detection                      │
│                                             │
│  AI Model:                                  │
│  ● GPT-4o-mini (Fast, ~$0.01)             │
│  ○ GPT-4o (Best quality, ~$0.05)          │
│                                             │
│  [Generate Summary]  [Skip]                │
└────────────────────────────────────────────┘
```

### Summary Preview

```
┌────────────────────────────────────────────┐
│  ✅ Summary Generated                      │
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📝 Summary                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  This video explores the fundamentals of   │
│  Obsidian plugin development, covering...  │
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✨ Key Points                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • Obsidian plugins use TypeScript         │
│  • Events drive most functionality         │
│  • Settings panel is essential            │
│  ...                                        │
│                                             │
│  [Add to Note]  [Regenerate]  [Edit]       │
└────────────────────────────────────────────┘
```

## Edge Cases

1. **Very Long Transcripts (>100K tokens)**
   - Chunk transcript intelligently
   - Summarize each chunk
   - Meta-summary of summaries
   - Preserve coherence across chunks

2. **Low-Quality Transcripts**
   - Detect poor transcription (many [inaudible])
   - Prompt AI to work with uncertainty
   - Note limitations in summary

3. **Non-English Content**
   - Detect transcript language
   - Generate summary in same language
   - Option to translate summary to English

4. **Highly Technical Content**
   - Preserve technical accuracy
   - Don't oversimplify jargon
   - Include glossary of terms

5. **Multiple Speakers**
   - Identify different viewpoints
   - Attribute key points to speakers
   - Summarize dialogue structure

## Testing Strategy

### Unit Tests
```typescript
describe('OpenAISummarizer', () => {
  test('builds prompt with all metadata', () => {
    const prompt = summarizer.buildPrompt(transcript, metadata, options);
    expect(prompt).toContain(metadata.title);
    expect(prompt).toContain('Key Points');
  });

  test('parses JSON response correctly', () => {
    const response = '{"summary": "...", "keyPoints": [...]}';
    const result = summarizer.parseAIResponse(response);
    expect(result.summary).toBeDefined();
    expect(result.keyPoints).toBeArray();
  });

  test('handles malformed AI response', () => {
    const response = 'Not JSON at all...';
    const result = summarizer.parseAIResponse(response);
    expect(result).toBeDefined(); // Fallback parsing
  });
});
```

### Integration Tests
- Test with real OpenAI API
- Various transcript lengths
- Different content types
- Multiple languages
- Edge case transcripts

### Quality Assessment
```typescript
// Manual quality checks
const qualityTests = [
  {
    transcript: shortTechnicalTranscript,
    expectedKeywords: ['API', 'database', 'authentication'],
    minKeyPoints: 3
  },
  {
    transcript: longNarrativeTranscript,
    expectedStructure: 'chronological',
    includesQuotes: true
  }
];
```

## Implementation Complexity
**Medium**

- API integration: Easy
- Prompt engineering: Medium
- Response parsing: Medium
- Quality assurance: Hard

## Priority
**Should-Have** 🟡

Significantly enhances value but transcript alone is useful.

## Estimated Effort
**3-4 days**

- Day 1: Core API integration
- Day 2: Prompt engineering + testing
- Day 3: Advanced features (chapters, concepts)
- Day 4: UI + polish

## Implementation Notes

### Prompt Engineering Best Practices

**Few-Shot Examples:**
```typescript
const systemPrompt = `You are a transcript summarizer.

Example:
Input: "Today we're going to talk about React hooks..."
Output: {
  "summary": "Introduction to React hooks, covering useState and useEffect...",
  "keyPoints": ["useState manages component state", ...]
}

Now summarize the following:`;
```

**Chain-of-Thought:**
```typescript
const prompt = `Before summarizing, first:
1. Identify the main topic
2. List key sections
3. Note any conclusions or action items

Then provide your summary based on this analysis.`;
```

### Cost Optimization

```typescript
class CostOptimizer {
  async generateSummary(transcript: string): Promise<SummaryResult> {
    // Use cheaper model for simple transcripts
    const complexity = this.assessComplexity(transcript);

    const model = complexity < 0.5 ? 'gpt-4o-mini' : 'gpt-4o';

    // Compress transcript if very long
    if (transcript.length > 50000) {
      transcript = await this.extractKeySegments(transcript);
    }

    return await this.summarizer.generate(transcript, { model });
  }

  private assessComplexity(transcript: string): number {
    const factors = {
      length: transcript.length,
      technicalTerms: this.countTechnicalTerms(transcript),
      sentenceComplexity: this.analyzeSentences(transcript),
      topicDiversity: this.countTopics(transcript)
    };

    return this.calculateComplexityScore(factors);
  }
}
```

### Future Enhancements
- Custom summary templates
- Multi-pass summarization (rough → refined)
- Comparative summaries (compare multiple videos)
- Study guide generation
- Flashcard creation
- Mind map generation
