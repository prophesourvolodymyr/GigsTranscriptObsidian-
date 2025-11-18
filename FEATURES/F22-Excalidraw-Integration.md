# F22: Excalidraw Integration (Complex)

## Overview
Detection of video links within Excalidraw drawings, the most technically complex detection context. Full implementation code provided in N3 Section 5.

## User Story
As a user, I want to transcribe videos referenced in my Excalidraw drawings, so that I can capture content linked in my visual diagrams and sketches.

## Technical Approach

### Excalidraw Data Format
Excalidraw drawings stored as JSON within markdown code blocks:
```markdown
# Drawing

excalidraw-plugin: parsed

\`\`\`json
{
  "type": "excalidraw",
  "elements": [
    {
      "type": "text",
      "text": "Video: https://youtube.com/watch?v=abc123",
      "x": 100,
      "y": 200
    }
  ]
}
\`\`\`
```

### Implementation Reference
**Complete implementation provided in N3 document, Section 5:**
- `ExcalidrawVideoDetector` class (full code)
- `ExcalidrawLinkModal` class (full code)
- Detection workflow
- Event handling
- Modal presentation

### Detection Strategy
**Phase 1: Passive Scanning**
- Scan on file open
- Parse JSON from code block
- Extract text elements
- Detect URLs
- Show modal with detected links

**Phase 2: Active Monitoring** (Future)
- Real-time detection
- Excalidraw plugin event integration
- Visual indicators in drawing

## Dependencies
- Excalidraw plugin by @zsviczian
- Complex JSON parsing
- Event integration with third-party plugin

## Priority
**Should-Have** 🟡 (Phase 2-3)

## Estimated Effort
**5-7 days** (most complex integration)

## Implementation Notes
- Reference N3 Section 5 for complete code examples
- Test thoroughly with Excalidraw plugin installed
- Graceful degradation if plugin not available
