# F21: Canvas Integration

## Overview
Detection and transcription of video links within Obsidian Canvas boards, allowing users to transcribe videos referenced in their visual thinking spaces.

## User Story
As a user, I want to transcribe videos linked in my Canvas boards, so that I can capture content referenced in my visual projects and mind maps.

## Technical Approach

### Canvas File Structure
Canvas files are JSON:
```json
{
  "nodes": [
    {
      "id": "node-123",
      "type": "text",
      "text": "Check out: https://youtube.com/watch?v=abc123",
      "x": 100,
      "y": 200
    }
  ],
  "edges": []
}
```

### Detection Flow
1. Monitor canvas file modifications
2. Parse JSON structure
3. Extract text from text nodes
4. Scan for video URLs
5. Show batch transcription modal
6. Create notes and optionally link back to canvas

### UI Integration
- Add small indicator icon on nodes with videos
- Right-click context menu: "Transcribe videos in this node"
- Batch processing for multiple videos in canvas

## Dependencies
- Canvas plugin (built-in to Obsidian)
- F1 (URL Detection)
- F2 (Platform Router)

## Priority
**Should-Have** 🟡 (Phase 2-3)

## Estimated Effort
**4-5 days**
