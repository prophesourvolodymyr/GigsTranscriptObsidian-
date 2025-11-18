import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './AIProvider';
import { SummaryResult, SummaryOptions } from '../types';

/**
 * Anthropic Claude AI Provider - Uses Claude Haiku or Sonnet for summaries
 */
export class ClaudeProvider implements AIProvider {
  readonly name = 'claude';
  private client: Anthropic;
  private debugMode: boolean;
  private model: string = 'claude-3-haiku-20240307'; // Default fast model

  constructor(apiKey: string, debugMode: boolean = false) {
    this.client = new Anthropic({ apiKey });
    this.debugMode = debugMode;
  }

  /**
   * Generate summary from transcript
   */
  async generateSummary(
    transcript: string,
    options: Partial<SummaryOptions>
  ): Promise<SummaryResult> {
    const style = options.style || 'concise';
    const includeKeyPoints = options.includeKeyPoints !== false;
    const includeQuotes = options.includeQuotes || false;
    const includeQuestions = options.includeQuestions || false;
    const includeChapters = options.includeChapters || false;

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(style, {
      includeKeyPoints,
      includeQuotes,
      includeQuestions,
      includeChapters,
    });

    // Build user prompt
    const userPrompt = `Please analyze the following transcript and provide a ${style} summary:\n\n${transcript}`;

    if (this.debugMode) {
      console.log('Claude: Generating summary', {
        model: this.model,
        style,
        transcriptLength: transcript.length,
      });
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const content = response.content[0];

      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const text = content.text;

      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;

      // Parse JSON response
      const parsed = JSON.parse(jsonText);

      const result: SummaryResult = {
        summary: parsed.summary || '',
        keyPoints: parsed.keyPoints || parsed.key_points || [],
        actionItems: parsed.actionItems || parsed.action_items || [],
        quotes: parsed.quotes || [],
        questions: parsed.questions || [],
        topics: parsed.topics || [],
        chapters: parsed.chapters || [],
        sentiment: parsed.sentiment || 'neutral',
      };

      if (this.debugMode) {
        console.log('Claude: Summary generated', {
          summaryLength: result.summary.length,
          keyPointsCount: result.keyPoints.length,
        });
      }

      return result;
    } catch (error) {
      if (this.debugMode) {
        console.error('Claude: Summary generation failed', error);
      }
      throw new Error(`Claude summary failed: ${error.message}`);
    }
  }

  /**
   * Build system prompt based on style and options
   */
  private buildSystemPrompt(
    style: string,
    options: {
      includeKeyPoints: boolean;
      includeQuotes: boolean;
      includeQuestions: boolean;
      includeChapters: boolean;
    }
  ): string {
    let prompt = 'You are an expert at analyzing and summarizing video transcripts. ';

    switch (style) {
      case 'concise':
        prompt += 'Provide a concise summary in 2-3 paragraphs. ';
        break;
      case 'detailed':
        prompt += 'Provide a comprehensive and detailed summary. ';
        break;
      case 'bullet-points':
        prompt += 'Provide a summary in clear bullet points. ';
        break;
      case 'academic':
        prompt += 'Provide a formal, academic-style summary. ';
        break;
    }

    prompt += '\n\nYour response MUST be valid JSON with the following structure:\n';
    prompt += '{\n';
    prompt += '  "summary": "The main summary text",\n';

    if (options.includeKeyPoints) {
      prompt += '  "key_points": ["Point 1", "Point 2", ...],\n';
    }

    if (options.includeQuotes) {
      prompt += '  "quotes": [{"text": "Quote text", "timestamp": 0}],\n';
    }

    if (options.includeQuestions) {
      prompt += '  "questions": ["Question 1", "Question 2", ...],\n';
    }

    if (options.includeChapters) {
      prompt += '  "chapters": [{"title": "Chapter 1", "start": 0, "summary": "..."}],\n';
    }

    prompt += '  "action_items": ["Action 1", "Action 2", ...],\n';
    prompt += '  "topics": ["Topic 1", "Topic 2", ...],\n';
    prompt += '  "sentiment": "positive" | "negative" | "neutral"\n';
    prompt += '}';

    return prompt;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      });
      return true;
    } catch (error) {
      if (this.debugMode) {
        console.error('Claude: Connection test failed', error);
      }
      return false;
    }
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Set model (claude-3-haiku-20240307, claude-3-5-sonnet-20241022)
   */
  setModel(model: string) {
    this.model = model;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
