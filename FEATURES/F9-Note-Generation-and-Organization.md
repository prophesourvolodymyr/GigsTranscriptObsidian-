# F9: Note Generation and Organization

## Overview
Handles the creation, naming, and organization of transcript notes within the Obsidian vault, including folder management, file naming conventions, tag generation, and linking strategies.

## User Story
As a user, I want transcript notes to be automatically organized in my vault with consistent naming and proper location, so that I can easily find and reference them later.

## Technical Approach

### Note Creation Flow

```typescript
interface NoteGenerationOptions {
  template: string;
  folder?: string;
  filenamePattern: string;
  tagStrategy: 'auto' | 'manual' | 'none';
  linkStrategy: 'embed' | 'link' | 'none';
  openOnCreate: boolean;
}

class NoteGenerator {
  async createTranscriptNote(
    data: TemplateData,
    options: NoteGenerationOptions
  ): Promise<TFile> {
    // 1. Generate filename
    const filename = this.generateFilename(data, options.filenamePattern);

    // 2. Determine folder path
    const folderPath = this.determineFolderPath(data, options);

    // 3. Ensure folder exists
    await this.ensureFolderExists(folderPath);

    // 4. Generate note content from template
    const content = await this.templateEngine.render(options.template, data);

    // 5. Add auto-generated tags
    const finalContent = await this.addTags(content, data, options.tagStrategy);

    // 6. Create file
    const file = await this.vault.create(
      `${folderPath}/${filename}.md`,
      finalContent
    );

    // 7. Update source file with link
    if (options.linkStrategy !== 'none') {
      await this.addLinkToSourceFile(data.sourceFile, file, options.linkStrategy);
    }

    // 8. Open note if requested
    if (options.openOnCreate) {
      await this.workspace.openLinkText(file.path, '', false);
    }

    return file;
  }

  private generateFilename(data: TemplateData, pattern: string): string {
    // Replace pattern variables
    const replacements = {
      '{title}': this.sanitizeFilename(data.title),
      '{platform}': data.platform,
      '{author}': this.sanitizeFilename(data.author),
      '{date}': moment().format('YYYY-MM-DD'),
      '{timestamp}': moment().format('YYYYMMDDHHmmss'),
      '{duration}': this.formatDuration(data.duration),
      '{id}': data.videoId || this.generateId()
    };

    let filename = pattern;
    for (const [key, value] of Object.entries(replacements)) {
      filename = filename.replace(key, value);
    }

    // Handle duplicates
    filename = await this.ensureUniqueFilename(filename);

    return filename;
  }

  private determineFolderPath(
    data: TemplateData,
    options: NoteGenerationOptions
  ): string {
    if (options.folder === 'dynamic') {
      // Organize by platform
      return `Transcripts/${data.platform}`;
    } else if (options.folder === 'date') {
      // Organize by date
      return `Transcripts/${moment().format('YYYY/MM')}`;
    } else if (options.folder === 'author') {
      // Organize by content creator
      return `Transcripts/${this.sanitizeFolderName(data.author)}`;
    } else {
      // User-specified folder
      return options.folder || 'Transcripts';
    }
  }

  private async ensureFolderExists(path: string): Promise<void> {
    const parts = path.split('/');
    let currentPath = '';

    for (const part of parts) {
      currentPath += part;
      const folder = this.vault.getAbstractFileByPath(currentPath);

      if (!folder) {
        await this.vault.createFolder(currentPath);
      }

      currentPath += '/';
    }
  }
}
```

### File Naming Strategies

**Available Patterns:**
- `{title}` - Video title (sanitized)
- `{platform}` - Platform name
- `{author}` - Content creator
- `{date}` - YYYY-MM-DD
- `{timestamp}` - YYYYMMDDHHmmss
- `{id}` - Video ID from platform
- `{duration}` - HH-MM-SS

**Pre-built Patterns:**
```typescript
const namingPatterns = {
  'title-only': '{title}',
  'title-date': '{title} - {date}',
  'platform-title': '[{platform}] {title}',
  'author-title': '{author} - {title}',
  'date-title': '{date} - {title}',
  'zettelkasten': '{timestamp} {title}',
  'id-based': '{platform}-{id}'
};
```

### Tag Generation

```typescript
class TagGenerator {
  async generateTags(data: TemplateData, strategy: TagStrategy): Promise<string[]> {
    const tags: string[] = [];

    if (strategy === 'none') return tags;

    // Platform tag
    tags.push(`video/${data.platform}`);

    // Author tag
    if (data.author) {
      tags.push(`creator/${this.slugify(data.author)}`);
    }

    // Auto-detected topics
    if (data.topics) {
      tags.push(...data.topics.map(t => `topic/${this.slugify(t)}`));
    }

    // Language tag
    tags.push(`lang/${data.language}`);

    // Duration-based tag
    if (data.duration < 300) {
      tags.push('duration/short');
    } else if (data.duration < 1800) {
      tags.push('duration/medium');
    } else {
      tags.push('duration/long');
    }

    // AI-generated tags (if available)
    if (strategy === 'auto' && data.aiGeneratedTags) {
      tags.push(...data.aiGeneratedTags);
    }

    return this.deduplicateTags(tags);
  }
}
```

### Linking Strategies

**Embed Original Link:**
```markdown
Found video: https://youtube.com/watch?v=...

→ After transcription:

Found video: [[Transcript - Video Title]]
```

**Append Link:**
```markdown
Original note content...

---
## Video Transcripts
- [[Transcript - Video Title]] - YouTube, 15:30
```

**Inline Link:**
```markdown
Check out this tutorial: https://youtube.com/watch?v=...

→

Check out this tutorial: [[Transcript - Video Title|link]]
```

## Dependencies
- **Depends on**: F8 (Template System)
- **Required APIs**: None
- **Obsidian APIs**: Vault API, Workspace API
- **External Libraries**: moment.js

## UI/UX Design

### Organization Settings

```
┌────────────────────────────────────────────┐
│  📁 Note Organization                      │
│                                             │
│  Folder Location:                           │
│  ● Transcripts/{platform}                  │
│  ○ Transcripts/{date}                      │
│  ○ Transcripts/{author}                    │
│  ○ Custom: [__________________]            │
│                                             │
│  File Naming Pattern:                       │
│  [Presets ▼] {title} - {date}              │
│                                             │
│  Preview:                                   │
│  "Building Obsidian Plugins - 2025-01-18"  │
│                                             │
│  Tags:                                      │
│  ☑ Auto-generate platform tags             │
│  ☑ Add author tags                         │
│  ☑ Include AI-detected topics              │
│  ☐ Use hierarchical tags (topic/subtopic) │
│                                             │
│  After Creation:                            │
│  ☑ Open note automatically                 │
│  ☑ Link from source location               │
│  Link style: [Embed ▼]                     │
│                                             │
│  [Save Settings]                           │
└────────────────────────────────────────────┘
```

## Edge Cases

1. **Duplicate Filenames**
   - Append number: "Title", "Title 2", "Title 3"
   - Timestamp suffix: "Title-153045"
   - Prompt user to choose

2. **Invalid Characters in Filename**
   - Sanitize: `?` `*` `/` `\` `<` `>` `|` `"` `:`
   - Replace with dash or remove
   - Preserve readability

3. **Very Long Titles**
   - Truncate at sensible length (100 chars)
   - Preserve complete words
   - Add ellipsis if truncated

4. **Folder Doesn't Exist**
   - Create folders recursively
   - Handle permission errors
   - Fallback to root if fails

5. **Source File No Longer Exists**
   - Skip linking step
   - Log warning
   - Continue with note creation

## Testing Strategy

### Unit Tests
```typescript
describe('NoteGenerator', () => {
  test('generates filename from pattern', () => {
    const data = { title: 'Test Video', date: '2025-01-18' };
    const filename = generator.generateFilename(data, '{title} - {date}');
    expect(filename).toBe('Test Video - 2025-01-18');
  });

  test('sanitizes invalid characters', () => {
    const filename = generator.sanitizeFilename('Test: Video? *Title*');
    expect(filename).toBe('Test - Video - Title');
  });

  test('handles duplicate filenames', async () => {
    await vault.create('Test.md', 'content');
    const unique = await generator.ensureUniqueFilename('Test');
    expect(unique).toBe('Test 2');
  });

  test('creates nested folders', async () => {
    await generator.ensureFolderExists('Transcripts/YouTube/2025');
    expect(vault.getAbstractFileByPath('Transcripts/YouTube/2025')).toBeTruthy();
  });
});
```

### Integration Tests
- Create notes in various folder structures
- Test all naming patterns
- Verify tag generation
- Test linking strategies
- Handle edge cases

## Implementation Complexity
**Medium**

- File creation: Easy
- Folder management: Easy
- Naming patterns: Medium
- Tag generation: Medium
- Linking strategies: Medium

## Priority
**Must-Have** 🔴

Essential for creating organized, findable notes.

## Estimated Effort
**3-4 days**

- Day 1: File creation + folder management
- Day 2: Naming patterns + sanitization
- Day 3: Tag generation
- Day 4: Linking strategies + UI

## Implementation Notes

### Folder Organization Strategies

```typescript
const organizationStrategies = {
  byPlatform: (data: TemplateData) => `Transcripts/${data.platform}`,
  byAuthor: (data: TemplateData) => `Transcripts/${data.author}`,
  byDate: (data: TemplateData) => `Transcripts/${moment().format('YYYY/MM')}`,
  byTopic: (data: TemplateData) => `Transcripts/${data.topics[0] || 'Uncategorized'}`,
  flat: (data: TemplateData) => 'Transcripts',
  custom: (data: TemplateData) => this.settings.customFolderPath
};
```

### Smart Duplicate Handling

```typescript
class DuplicateHandler {
  async handleDuplicate(filename: string): Promise<string> {
    const existingFile = this.vault.getAbstractFileByPath(`${filename}.md`);

    if (!existingFile) return filename;

    // Check if it's the same video
    const existingContent = await this.vault.read(existingFile);
    const existingUrl = this.extractUrl(existingContent);

    if (existingUrl === this.currentVideoUrl) {
      // Offer to open existing instead
      const useExisting = await this.confirm(
        'Already transcribed',
        'This video was already transcribed. Open existing note?'
      );

      if (useExisting) {
        throw new ExistingTranscriptFound(existingFile.path);
      }
    }

    // Generate unique filename
    return this.appendNumber(filename);
  }
}
```

### Future Enhancements
- MOC (Map of Content) auto-generation
- Daily note integration
- Dataview query generation
- Graph view optimization (reduce clutter)
- Bulk organization tools
- Note archiving after time period
- Automatic cleanup of orphaned transcripts
