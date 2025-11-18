import Handlebars from 'handlebars';
import { TemplateData } from '../types';
import moment from 'moment';

/**
 * Template Engine - Renders transcript notes using Handlebars templates
 */
export class TemplateEngine {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers() {
    // Format date helper
    this.handlebars.registerHelper('formatDate', (date: string, format: string = 'YYYY-MM-DD') => {
      if (!date) return '';
      return moment(date).format(format);
    });

    // Format duration helper (seconds to HH:MM:SS or MM:SS)
    this.handlebars.registerHelper('formatDuration', (seconds: number) => {
      if (!seconds || seconds === 0) return '00:00';

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    });

    // Timestamp link helper (for Obsidian video timestamp links)
    this.handlebars.registerHelper('timestampLink', (seconds: number, url: string) => {
      if (!seconds || !url) return '';

      const formatted = this.handlebars.helpers.formatDuration(seconds);

      // Check platform for timestamp format
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return `[${formatted}](${url}&t=${Math.floor(seconds)}s)`;
      }

      // Default format
      return `[${formatted}](${url}#t=${Math.floor(seconds)})`;
    });

    // Uppercase helper
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Title case helper
    this.handlebars.registerHelper('titlecase', (str: string) => {
      if (!str) return '';
      return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    });

    // Truncate helper
    this.handlebars.registerHelper('truncate', (str: string, length: number = 100) => {
      if (!str) return '';
      if (str.length <= length) return str;
      return str.substring(0, length) + '...';
    });

    // Platform icon helper
    this.handlebars.registerHelper('platformIcon', (platform: string) => {
      const icons: Record<string, string> = {
        youtube: '▶️',
        instagram: '📷',
        twitter: '𝕏',
        tiktok: '🎵',
        facebook: 'f',
        pinterest: 'P',
        threads: '@',
        telegram: '✈️',
      };
      return icons[platform.toLowerCase()] || '🎥';
    });

    // Word count helper
    this.handlebars.registerHelper('wordCount', (text: string) => {
      if (!text) return 0;
      return text.split(/\s+/).filter((word) => word.length > 0).length;
    });

    // Reading time helper (assuming 200 words per minute)
    this.handlebars.registerHelper('readingTime', (text: string) => {
      if (!text) return '0 min';
      const words = text.split(/\s+/).filter((word) => word.length > 0).length;
      const minutes = Math.ceil(words / 200);
      return `${minutes} min`;
    });

    // List helper (convert array to bullet points)
    this.handlebars.registerHelper('list', (items: string[], prefix: string = '-') => {
      if (!items || !Array.isArray(items) || items.length === 0) return '';
      return items.map((item) => `${prefix} ${item}`).join('\n');
    });

    // If equals helper
    this.handlebars.registerHelper('ifeq', function (this: any, a: any, b: any, options: any) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // If not equals helper
    this.handlebars.registerHelper('ifnoteq', function (this: any, a: any, b: any, options: any) {
      if (a !== b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Or helper
    this.handlebars.registerHelper('or', (a: any, b: any) => {
      return a || b;
    });

    // And helper
    this.handlebars.registerHelper('and', (a: any, b: any) => {
      return a && b;
    });
  }

  /**
   * Render template with data
   */
  render(templateString: string, data: TemplateData): string {
    try {
      const template = this.handlebars.compile(templateString);
      return template(data);
    } catch (error) {
      console.error('Template rendering error:', error);
      throw new Error(`Failed to render template: ${error.message}`);
    }
  }

  /**
   * Compile template for reuse
   */
  compile(templateString: string): HandlebarsTemplateDelegate<TemplateData> {
    return this.handlebars.compile(templateString);
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, template: string) {
    this.handlebars.registerPartial(name, template);
  }

  /**
   * Unregister a partial template
   */
  unregisterPartial(name: string) {
    this.handlebars.unregisterPartial(name);
  }

  /**
   * Get all built-in templates
   */
  getBuiltInTemplates(): Record<string, string> {
    return {
      default: this.getDefaultTemplate(),
      minimal: this.getMinimalTemplate(),
      academic: this.getAcademicTemplate(),
      zettelkasten: this.getZettelkastenTemplate(),
      podcast: this.getPodcastTemplate(),
      tutorial: this.getTutorialTemplate(),
    };
  }

  /**
   * Default template
   */
  private getDefaultTemplate(): string {
    return `---
title: {{title}}
platform: {{platform}}
author: {{author}}
url: {{url}}
transcribed: {{transcribedAt}}
tags: {{#if tags}}{{#each tags}}#{{this}} {{/each}}{{else}}#transcript{{/if}}
---

# {{platformIcon platform}} {{title}}

> **Author:** {{author}}
> **Platform:** {{uppercase platform}}
> **Duration:** {{formatDuration duration}}
> **Transcribed:** {{formatDate transcribedAt "MMMM Do, YYYY"}}

{{#if thumbnail}}
![Thumbnail]({{thumbnail}})
{{/if}}

## 📝 Summary

{{#if summary}}
{{summary}}
{{else}}
*No summary available*
{{/if}}

{{#if keyPoints}}
## 🔑 Key Points

{{list keyPoints "-"}}
{{/if}}

{{#if actionItems}}
## ✅ Action Items

{{list actionItems "- [ ]"}}
{{/if}}

{{#if quotes}}
## 💬 Notable Quotes

{{#each quotes}}
> {{this.text}}
{{#if this.timestamp}}
> — at {{formatDuration this.timestamp}}
{{/if}}

{{/each}}
{{/if}}

{{#if topics}}
## 🏷️ Topics

{{#each topics}}#{{this}} {{/each}}
{{/if}}

## 📄 Full Transcript

{{transcript}}

---

**Source:** [{{title}}]({{url}})
**Transcription Method:** {{uppercase transcriptionMethod}}
{{#if aiProvider}}**AI Provider:** {{uppercase aiProvider}}{{/if}}
**Word Count:** {{wordCount}}
**Reading Time:** {{readingTime transcript}}
`;
  }

  /**
   * Minimal template
   */
  private getMinimalTemplate(): string {
    return `# {{title}}

{{author}} · {{formatDuration duration}} · {{formatDate transcribedAt "YYYY-MM-DD"}}

{{#if summary}}
{{summary}}
{{/if}}

---

{{transcript}}

[Source]({{url}})
`;
  }

  /**
   * Academic template
   */
  private getAcademicTemplate(): string {
    return `---
title: "{{title}}"
author: {{author}}
date: {{formatDate transcribedAt "YYYY-MM-DD"}}
source: {{url}}
type: transcript
---

# {{title}}

**Metadata:**
- **Author/Speaker:** {{author}}
- **Platform:** {{uppercase platform}}
- **Duration:** {{formatDuration duration}}
- **Date Accessed:** {{formatDate transcribedAt "MMMM D, YYYY"}}
- **URL:** {{url}}

## Abstract

{{#if summary}}
{{summary}}
{{else}}
*Summary pending*
{{/if}}

## Key Concepts

{{#if keyPoints}}
{{#each keyPoints}}
1. {{this}}
{{/each}}
{{else}}
*To be analyzed*
{{/if}}

{{#if topics}}
## Themes

{{#each topics}}
- **{{this}}**
{{/each}}
{{/if}}

## Full Transcription

{{transcript}}

## References

{{author}}. ({{formatDate uploadDate "YYYY, MMMM D"}}). *{{title}}* [Video]. {{titlecase platform}}. {{url}}

---

*Transcribed: {{formatDate transcribedAt "MMMM D, YYYY"}}*
*Method: {{titlecase transcriptionMethod}}*
*Words: {{wordCount}}*
`;
  }

  /**
   * Zettelkasten template
   */
  private getZettelkastenTemplate(): string {
    return `# {{title}}

**ID:** {{videoId}}
**Created:** {{formatDate transcribedAt "YYYYMMDDHHmm"}}
**Tags:** {{#if tags}}{{#each tags}}#{{this}} {{/each}}{{else}}#transcript #{{platform}}{{/if}}

---

## Context

- **Source:** [{{title}}]({{url}})
- **Author:** [[{{author}}]]
- **Platform:** {{uppercase platform}}
- **Duration:** {{formatDuration duration}}

## Main Ideas

{{#if keyPoints}}
{{#each keyPoints}}
- {{this}}
{{/each}}
{{else}}
{{truncate transcript 500}}
{{/if}}

## Notes

{{#if summary}}
{{summary}}
{{/if}}

## Related

- [[]]

## Quotes

{{#if quotes}}
{{#each quotes}}
> {{this.text}} ^{{../videoId}}-{{@index}}

{{/each}}
{{/if}}

---

## Full Transcript

{{transcript}}

---

**Links:** {{url}}
**Processed:** {{formatDate transcribedAt "YYYY-MM-DD HH:mm"}}
`;
  }

  /**
   * Podcast template
   */
  private getPodcastTemplate(): string {
    return `---
title: {{title}}
podcast: {{author}}
date: {{formatDate uploadDate "YYYY-MM-DD"}}
duration: {{formatDuration duration}}
tags: #podcast {{#if tags}}{{#each tags}}#{{this}} {{/each}}{{/if}}
---

# 🎙️ {{title}}

**Podcast:** {{author}}
**Episode:** {{title}}
**Duration:** {{formatDuration duration}}
**Listen:** [{{platform}}]({{url}})

{{#if thumbnail}}
![[{{thumbnail}}]]
{{/if}}

## 📝 Show Notes

{{#if summary}}
{{summary}}
{{else}}
*Add show notes here*
{{/if}}

{{#if keyPoints}}
## 🎯 Key Takeaways

{{list keyPoints "-"}}
{{/if}}

{{#if chapters}}
## ⏱️ Chapters

{{#each chapters}}
- {{timestampLink this.start ../url}} - {{this.title}}
{{#if this.summary}}
  {{this.summary}}
{{/if}}
{{/each}}
{{/if}}

{{#if quotes}}
## 💡 Highlights

{{#each quotes}}
> {{this.text}}
{{#if this.timestamp}}
> [{{formatDuration this.timestamp}}]({{../url}}#t={{this.timestamp}})
{{/if}}

{{/each}}
{{/if}}

{{#if actionItems}}
## ✅ Action Items

{{list actionItems "- [ ]"}}
{{/if}}

## 📄 Full Transcript

{{transcript}}

---

**Transcribed:** {{formatDate transcribedAt "MMMM D, YYYY"}}
`;
  }

  /**
   * Tutorial template
   */
  private getTutorialTemplate(): string {
    return `# 📚 {{title}}

> **Instructor:** {{author}}
> **Platform:** {{uppercase platform}}
> **Duration:** {{formatDuration duration}}
> **Video:** [Watch on {{titlecase platform}}]({{url}})

{{#if thumbnail}}
![]({{thumbnail}})
{{/if}}

## 🎯 What You'll Learn

{{#if keyPoints}}
{{list keyPoints "-"}}
{{else}}
{{truncate transcript 300}}
{{/if}}

{{#if summary}}
## 📝 Overview

{{summary}}
{{/if}}

{{#if chapters}}
## 📑 Table of Contents

{{#each chapters}}
{{add @index 1}}. [{{this.title}}](#{{lowercase (replace this.title " " "-")}}) - {{formatDuration this.start}}
{{/each}}

{{#each chapters}}
## {{this.title}}

⏱️ **Timestamp:** {{timestampLink this.start ../url}}

{{#if this.summary}}
{{this.summary}}
{{/if}}

{{/each}}
{{/if}}

{{#if actionItems}}
## ✅ Steps to Follow

{{#each actionItems}}
- [ ] {{this}}
{{/each}}
{{/if}}

{{#if quotes}}
## 💡 Important Notes

{{#each quotes}}
> {{this.text}}

{{/each}}
{{/if}}

## 📄 Full Transcript

{{transcript}}

---

**Tags:** {{#if tags}}{{#each tags}}#{{this}} {{/each}}{{else}}#tutorial #{{platform}}{{/if}}
**Source:** {{url}}
**Transcribed:** {{formatDate transcribedAt "YYYY-MM-DD"}}
`;
  }
}
