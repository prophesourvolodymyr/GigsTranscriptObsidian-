import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './AIProvider';
import { SummaryResult, SummaryOptions } from '../types';

/**
 * Google Gemini AI Provider - Uses Gemini Flash for summaries (free tier available)
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private debugMode: boolean;
  private model: string = 'gemini-1.5-flash'; // Default free model

  constructor(apiKey: string, debugMode: boolean = false) {
    this.client = new GoogleGenerativeAI(apiKey);
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

    // Build prompt
    const prompt = this.buildPrompt(transcript, style, {
      includeKeyPoints,
      includeQuotes,
      includeQuestions,
      includeChapters,
    });

    if (this.debugMode) {
      console.log('Gemini: Generating summary', {
        model: this.model,
        style,
        transcriptLength: transcript.length,
      });
    }

    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini');
      }

      // Extract JSON from response (Gemini might wrap it in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;

      // Parse JSON response
      const parsed = JSON.parse(jsonText);

      const summaryResult: SummaryResult = {
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
        console.log('Gemini: Summary generated', {
          summaryLength: summaryResult.summary.length,
          keyPointsCount: summaryResult.keyPoints.length,
        });
      }

      return summaryResult;
    } catch (error) {
      if (this.debugMode) {
        console.error('Gemini: Summary generation failed', error);
      }
      throw new Error(`Gemini summary failed: ${error.message}`);
    }
  }

  /**
   * Build prompt based on style and options
   */
  private buildPrompt(
    transcript: string,
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
    prompt += '}\n\n';

    prompt += `Transcript to analyze:\n\n${transcript}`;

    return prompt;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      await model.generateContent('Hello');
      return true;
    } catch (error) {
      if (this.debugMode) {
        console.error('Gemini: Connection test failed', error);
      }
      return false;
    }
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Set model (gemini-1.5-flash, gemini-1.5-pro)
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
