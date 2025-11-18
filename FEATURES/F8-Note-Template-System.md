# F8: Note Template System

## Overview
The Note Template System provides flexible, customizable templates for generating transcript notes. Users can choose from pre-built templates or create custom ones using Handlebars syntax, ensuring that generated notes match their personal knowledge management workflow.

## User Story
As a user, I want to customize how transcript notes are formatted and organized, so that they integrate seamlessly with my existing note-taking system and personal preferences.

## Technical Approach

### Template Engine (Handlebars)

```typescript
import Handlebars from 'handlebars';

interface TemplateData {
  // Video metadata
  title: string;
  platform: string;
  author: string;
  url: string;
  thumbnail?: string;
  duration: number;
  uploadDate?: string;

  // Transcript data
  transcript: string;
  transcriptSegments?: TranscriptSegment[];
  language: string;
  wordCount: number;

  // AI-generated content
  summary?: string;
  keyPoints?: string[];
  actionItems?: string[];
  quotes?: Quote[];
  chapters?: Chapter[];
  topics?: string[];

  // Metadata
  transcribedAt: string;
  transcriptionMethod: 'api' | 'local';
  aiProvider?: string;
  tags?: string[];
  folder?: string;
}

class TemplateEngine {
  private handlebars: typeof Handlebars;
  private templates: Map<string, HandlebarsTemplateDelegate>;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
    this.loadBuiltInTemplates();
  }

  registerHelpers(): void {
    // Date formatting
    this.handlebars.registerHelper('formatDate', (date: string, format: string) => {
      return moment(date).format(format || 'YYYY-MM-DD HH:mm');
    });

    // Duration formatting
    this.handlebars.registerHelper('formatDuration', (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${minutes}:${secs.toString().padStart(2, '0')}`;
    });

    // Timestamp link
    this.handlebars.registerHelper('timestampLink', (url: string, seconds: number) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return `${url}&t=${Math.floor(seconds)}s`;
      }
      return url;
    });

    // Conditional helpers
    this.handlebars.registerHelper('if_exists', function(value, options) {
      return value ? options.fn(this) : options.inverse(this);
    });

    // List formatting
    this.handlebars.registerHelper('bulletList', (items: string[]) => {
      return items.map(item => `- ${item}`).join('\n');
    });

    // Truncate text
    this.handlebars.registerHelper('truncate', (text: string, length: number) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    });
  }

  async render(templateName: string, data: TemplateData): Promise<string> {
    const template = this.templates.get(templateName);

    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return template(data);
  }

  async loadTemplate(name: string, content: string): Promise<void> {
    const compiled = this.handlebars.compile(content);
    this.templates.set(name, compiled);
  }

  async loadFromFile(name: string, filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    await this.loadTemplate(name, content);
  }
}
```

### Built-In Templates

**Default Template:**
```handlebars
---
title: {{title}}
platform: {{platform}}
author: {{author}}
url: {{url}}
duration: {{formatDuration duration}}
transcribed: {{formatDate transcribedAt "YYYY-MM-DD HH:mm"}}
tags: {{#each tags}}#{{this}} {{/each}}
---

# {{title}}

**Platform:** {{platform}}
**Author:** {{author}}
**Duration:** {{formatDuration duration}}
**URL:** [Watch Video]({{url}})

{{#if_exists summary}}
## Summary

{{summary}}
{{/if_exists}}

{{#if_exists keyPoints}}
## Key Points

{{#each keyPoints}}
- {{this}}
{{/each}}
{{/if_exists}}

{{#if_exists actionItems}}
## Action Items

{{#each actionItems}}
- [ ] {{this}}
{{/each}}
{{/if_exists}}

## Transcript

{{transcript}}

---
*Transcribed using {{transcriptionMethod}}{{#if aiProvider}} • Summary by {{aiProvider}}{{/if}}*
</handlebars>
```

**Academic Template:**
```handlebars
---
type: lecture-notes
course:
professor: {{author}}
date: {{formatDate uploadDate "YYYY-MM-DD"}}
platform: {{platform}}
url: {{url}}
tags: #lecture #{{platform}}
---

# {{title}}

## Metadata
- **Instructor:** {{author}}
- **Platform:** {{platform}}
- **Duration:** {{formatDuration duration}}
- **Date Accessed:** {{formatDate transcribedAt "YYYY-MM-DD"}}

## Overview
{{#if summary}}
{{summary}}
{{else}}
*No summary available*
{{/if}}

## Learning Objectives
{{#if keyPoints}}
{{#each keyPoints}}
{{@index}}. {{this}}
{{/each}}
{{/if}}

## Detailed Notes

{{transcript}}

## Review Questions
{{#if questions}}
{{#each questions}}
{{@index}}. {{this}}
{{/each}}
{{/if}}

## References
- Primary Source: {{url}}
{{#if relatedVideos}}
{{#each relatedVideos}}
- {{this}}
{{/each}}
{{/if}}
</handlebars>
```

**Minimal Template:**
```handlebars
# {{title}}

{{url}}

{{#if summary}}
**Summary:** {{summary}}
{{/if}}

{{transcript}}
```

**Zettelkasten Template:**
```handlebars
---
id: {{timestamp}}
tags: {{#each tags}}#{{this}} {{/each}}
type: video-transcript
source: {{url}}
---

# {{title}}

## Metadata
- Author: [[{{author}}]]
- Platform: {{platform}}
- Date: {{formatDate transcribedAt "YYYY-MM-DD"}}

## Atomic Ideas

{{#each keyPoints}}
### Idea {{@index}}

{{this}}

**Source:** [{{../title}}]({{../url}})
**Timestamp:** {{timestampLink ../url @timestamp}}

{{/each}}

## Raw Transcript

{{transcript}}

## Connections

<!-- Link to related notes -->

## References

1. {{author}}. "{{title}}". *{{platform}}*. {{formatDate uploadDate "YYYY"}}.URL: {{url}}
</handlebars>
```

## Dependencies
- **Depends on**: F4/F5 (Transcription), F6/F7 (AI Processing)
- **Required APIs**: None
- **Obsidian APIs**: Vault API for note creation
- **External Libraries**: `handlebars`

## UI/UX Design

### Template Selection

```
┌────────────────────────────────────────────┐
│  📄 Select Note Template                   │
│                                             │
│  ● Default (Recommended)                   │
│    Balanced layout with summary and        │
│    transcript. Works for most users.       │
│    [Preview]                               │
│                                             │
│  ○ Academic                                │
│    Formatted for lecture notes with        │
│    learning objectives and citations.      │
│    [Preview]                               │
│                                             │
│  ○ Minimal                                 │
│    Bare-bones format with just title       │
│    and transcript.                         │
│    [Preview]                               │
│                                             │
│  ○ Zettelkasten                           │
│    Atomic note format for linking and      │
│    knowledge management.                   │
│    [Preview]                               │
│                                             │
│  ○ Custom Template...                      │
│    [Create New] [Manage Templates]         │
│                                             │
│  [Use Selected]  [Cancel]                  │
└────────────────────────────────────────────┘
```

### Template Editor

```
┌────────────────────────────────────────────┐
│  ✏️ Edit Template: "My Custom Template"   │
│                                             │
│  ┌──────────────────────────────────────┐ │
│  │ ---                                   │ │
│  │ title: {{title}}                     │ │
│  │ platform: {{platform}}               │ │
│  │ ---                                   │ │
│  │                                       │ │
│  │ # {{title}}                          │ │
│  │                                       │ │
│  │ {{summary}}                          │ │
│  │                                       │ │
│  │ ## Transcript                        │ │
│  │ {{transcript}}                       │ │
│  └──────────────────────────────────────┘ │
│                                             │
│  Variables: [Insert ▼]                     │
│  • {{title}} • {{author}} • {{url}}       │
│  • {{summary}} • {{keyPoints}} • more...  │
│                                             │
│  [Save] [Preview] [Cancel] [Documentation]│
└────────────────────────────────────────────┘
```

## Edge Cases

1. **Missing Data Fields**
   - Template references {{summary}} but no AI summary generated
   - Handle gracefully with conditional blocks
   - Show placeholder or hide section

2. **Very Long Transcripts**
   - Template might make note extremely long
   - Option to split into multiple notes
   - Collapsible sections in template

3. **Special Characters in Data**
   - Video title contains Markdown characters
   - Escape special characters automatically
   - Preserve intentional formatting

4. **Invalid Template Syntax**
   - User creates broken Handlebars template
   - Validate before saving
   - Show clear error messages with line numbers

5. **Template Version Updates**
   - Built-in template updated in plugin update
   - Preserve user customizations
   - Offer to migrate to new version

## Testing Strategy

### Unit Tests
```typescript
describe('TemplateEngine', () => {
  test('renders default template with all data', () => {
    const result = engine.render('default', fullTemplateData);
    expect(result).toContain(fullTemplateData.title);
    expect(result).toContain(fullTemplateData.summary);
    expect(result).toContain(fullTemplateData.transcript);
  });

  test('handles missing summary gracefully', () => {
    const dataWithoutSummary = { ...fullTemplateData, summary: undefined };
    const result = engine.render('default', dataWithoutSummary);
    expect(result).not.toContain('## Summary');
  });

  test('formatDuration helper works correctly', () => {
    expect(engine.helpers.formatDuration(3665)).toBe('1:01:05');
    expect(engine.helpers.formatDuration(125)).toBe('2:05');
  });

  test('validates template syntax', () => {
    const invalid = '{{title} {{unclosed';
    expect(() => engine.loadTemplate('test', invalid)).toThrow();
  });
});
```

### Integration Tests
- Render each built-in template with sample data
- Test with various data combinations
- Verify generated notes are valid Markdown
- Test custom template creation flow

## Implementation Complexity
**Medium**

- Handlebars integration: Easy
- Helper functions: Easy
- Template management: Medium
- UI for template editing: Medium

## Priority
**Must-Have** 🔴

Essential for generating usable notes from transcripts.

## Estimated Effort
**3-4 days**

- Day 1: Template engine setup + helpers
- Day 2: Built-in templates creation
- Day 3: Template management UI
- Day 4: Custom template editor + testing

## Implementation Notes

### Template Variable Documentation

Generate comprehensive docs for users:

```typescript
const templateVariables = {
  'Video Metadata': {
    title: 'Video title',
    platform: 'Platform name (youtube, instagram, etc.)',
    author: 'Content creator name',
    url: 'Original video URL',
    thumbnail: 'Thumbnail image URL',
    duration: 'Duration in seconds (use formatDuration helper)',
    uploadDate: 'Date video was uploaded (ISO 8601)'
  },
  'Transcript Data': {
    transcript: 'Full transcript text',
    transcriptSegments: 'Array of timestamped segments',
    language: 'Detected language code',
    wordCount: 'Number of words in transcript'
  },
  'AI Content': {
    summary: 'Generated summary',
    keyPoints: 'Array of key points',
    actionItems: 'Array of action items',
    quotes: 'Array of notable quotes',
    chapters: 'Array of detected chapters',
    topics: 'Array of main topics'
  }
};
```

### Template Marketplace (Future)

Allow users to share templates:

```typescript
class TemplateMarketplace {
  async browseTemplates(): Promise<Template[]> {
    return await fetch('https://templates.example.com/api/browse');
  }

  async installTemplate(templateId: string): Promise<void> {
    const template = await this.downloadTemplate(templateId);
    await this.engine.loadTemplate(template.name, template.content);
  }

  async publishTemplate(template: Template): Promise<void> {
    // Share with community
  }
}
```

### Future Enhancements
- Visual template builder (drag-drop)
- Template preview with live data
- Template versioning
- Template inheritance (extend base templates)
- Conditional sections based on platform
- Dynamic sections (show/hide based on data)
- Template validation and linting
- AI-assisted template generation
