# Icon Manifest
## Link Video Transcriber - Visual Asset Specification

**Last Updated:** 2025-01-18  
**Document Version:** 1.0

---

## Plugin Icon (Primary)

### Ribbon Icon
**Purpose:** Main plugin icon in Obsidian's left sidebar  
**Location:** Obsidian ribbon (vertical toolbar)  
**Sizes Required:** 16x16, 24x24, 32x32 px  
**Format:** SVG (preferred) + PNG fallbacks  
**File:** `icon.svg`, `icon-16.png`, `icon-24.png`, `icon-32.png`

**Design Concept:**
- Microphone symbol with video play button overlay
- Clean, minimal design matching Obsidian aesthetic
- Theme-adaptive (works in light and dark modes)

**Color Palette:**
- Light mode: `#4A5568` (neutral gray)
- Dark mode: `#A0AEC0` (lighter gray)
- Accent: `#667EEA` (subtle purple)

**Icon Ideas:**
1. 🎙️ + ▶️ Microphone with play triangle
2. 📹 + 📝 Video camera with document
3. 🎬 + 📄 Clapperboard with transcript lines
4. Custom: Waveform entering document

---

## Status Icons

### Transcription States

**Detecting (Idle)**
- Icon: 🔍 Magnifying glass
- Color: Gray `#718096`
- Usage: When scanning for video links

**Downloading (Active)**
- Icon: ⬇️ Download arrow with progress
- Color: Blue `#4299E1`
- Animation: Pulsing or rotating
- Usage: Downloading audio from RapidAPI

**Transcribing (Processing)**
- Icon: 🎙️ Microphone with waves
- Color: Purple `#667EEA`
- Animation: Sound waves
- Usage: Whisper transcription in progress

**AI Processing (Thinking)**
- Icon: ✨ Sparkles or brain
- Color: Purple `#805AD5`
- Animation: Subtle sparkle
- Usage: AI summary generation

**Success (Complete)**
- Icon: ✅ Check mark
- Color: Green `#48BB78`
- Usage: Transcription completed successfully

**Error (Failed)**
- Icon: ⚠️ Warning triangle
- Color: Red `#F56565`
- Usage: Error occurred during process

**Rate Limited (Throttled)**
- Icon: ⏱️ Clock/timer
- Color: Orange `#ED8936`
- Usage: API rate limit reached

**Cost Warning (Budget)**
- Icon: 💰 Dollar sign
- Color: Orange `#F6AD55`
- Usage: Approaching budget limit

---

## Platform Badges

### YouTube
- Icon: ▶️ Red play button
- Color: `#FF0000` (YouTube red)
- Shape: Rounded rectangle
- Size: 20x20 px
- File: `platform-youtube.svg`

### Instagram
- Icon: 📷 Camera with gradient
- Color: Gradient `#F58529` → `#DD2A7B` → `#8134AF`
- Shape: Rounded square
- Size: 20x20 px
- File: `platform-instagram.svg`

### X (Twitter)
- Icon: 𝕏 or 🐦 Bird (legacy)
- Color: `#1DA1F2` (Twitter blue) or `#000000` (X black)
- Shape: Circle
- Size: 20x20 px
- File: `platform-twitter.svg`, `platform-x.svg`

### TikTok
- Icon: 🎵 Musical note
- Color: `#000000` with `#EE1D52` & `#69C9D0` accents
- Shape: Rounded square
- Size: 20x20 px
- File: `platform-tiktok.svg`

### Facebook
- Icon: f logo
- Color: `#1877F2` (Facebook blue)
- Shape: Rounded square
- Size: 20x20 px
- File: `platform-facebook.svg`

### Pinterest
- Icon: P badge
- Color: `#E60023` (Pinterest red)
- Shape: Circle
- Size: 20x20 px
- File: `platform-pinterest.svg`

### Threads
- Icon: @ symbol
- Color: `#000000` with gradient accent
- Shape: Circle
- Size: 20x20 px
- File: `platform-threads.svg`

---

## UI Element Icons

### Buttons

**Transcribe (Primary CTA)**
- Icon: 🎙️ Microphone
- Style: Filled circle button
- Color: Primary `#667EEA`
- Hover: `#5A67D8`
- Size: 32x32 px

**Cancel (Secondary)**
- Icon: ✕ X mark
- Style: Outlined button
- Color: Gray `#718096`
- Hover: Red `#F56565`
- Size: 24x24 px

**Settings (Gear)**
- Icon: ⚙️ Gear/cog
- Style: Outlined
- Color: Gray `#A0AEC0`
- Hover: `#667EEA`
- Size: 20x20 px

**Refresh (Circular Arrow)**
- Icon: 🔄 Circular arrow
- Style: Outlined
- Color: Gray `#718096`
- Hover: Blue `#4299E1`
- Size: 20x20 px
- Animation: Rotating on click

**Delete/Clear (Trash)**
- Icon: 🗑️ Trash can
- Style: Outlined
- Color: Gray `#718096`
- Hover: Red `#F56565`
- Size: 20x20 px

---

## Modal Icons

### Video Preview Placeholder
- Icon: 📹 Video camera or film strip
- Size: 120x67 px (16:9 ratio)
- Color: Gray `#E2E8F0`
- Usage: When thumbnail unavailable

### Platform Indicators
- Small versions of platform badges
- Size: 16x16 px
- Location: Next to video title in modals

### Quality Indicators
- HD: Badge with "HD"
- 4K: Badge with "4K"
- Audio: 🔊 Speaker icon
- Size: 16x16 px

---

## Progress Indicators

### Progress Bar
- Height: 4px
- Color (empty): `#E2E8F0`
- Color (filled): `#667EEA`
- Animation: Smooth transition
- Rounded ends: 2px radius

### Spinner (Loading)
- Type: Circular rotating spinner
- Size: 24x24 px, 48x48 px (modal)
- Color: `#667EEA`
- Animation: Continuous rotation (1s)
- Style: Obsidian's native spinner or custom

### Percentage Display
- Font: Monospace
- Size: 14px
- Color: `#4A5568`
- Format: "65%"

---

## Notification Icons

### Toast Notifications

**Info (ℹ️)**
- Icon: Information circle
- Color: Blue `#4299E1`
- Usage: General information

**Success (✅)**
- Icon: Check mark in circle
- Color: Green `#48BB78`
- Usage: Operation completed

**Warning (⚠️)**
- Icon: Exclamation in triangle
- Color: Orange `#ED8936`
- Usage: Warnings (rate limits, costs)

**Error (❌)**
- Icon: X mark in circle
- Color: Red `#F56565`
- Usage: Errors and failures

---

## Badge Icons

### Feature Badges

**NEW**
- Text: "NEW"
- Color: Blue `#4299E1`
- Shape: Rounded rectangle
- Size: Auto width × 16px height
- Usage: Highlight new features

**BETA**
- Text: "BETA"
- Color: Orange `#ED8936`
- Shape: Rounded rectangle
- Size: Auto width × 16px height
- Usage: Experimental features

**PRO**
- Text: "PRO"
- Color: Purple `#805AD5`
- Shape: Rounded rectangle
- Size: Auto width × 16px height
- Usage: Premium features

---

## Asset File Structure

```
assets/
├── icons/
│   ├── icon.svg (main plugin icon)
│   ├── icon-16.png
│   ├── icon-24.png
│   ├── icon-32.png
│   ├── status/
│   │   ├── downloading.svg
│   │   ├── transcribing.svg
│   │   ├── processing.svg
│   │   ├── success.svg
│   │   ├── error.svg
│   │   └── rate-limit.svg
│   ├── platforms/
│   │   ├── youtube.svg
│   │   ├── instagram.svg
│   │   ├── twitter.svg
│   │   ├── tiktok.svg
│   │   ├── facebook.svg
│   │   ├── pinterest.svg
│   │   └── threads.svg
│   └── ui/
│       ├── microphone.svg
│       ├── cancel.svg
│       ├── settings.svg
│       ├── refresh.svg
│       └── trash.svg
└── images/
    └── video-placeholder.png
```

---

## Design Guidelines

### Consistency
- All icons follow Obsidian's visual language
- Consistent line weights (2px)
- Consistent corner radius (2-3px)
- Consistent spacing and padding

### Accessibility
- Sufficient color contrast (WCAG AA)
- Icons work in grayscale
- Text labels for all interactive icons
- ARIA labels in code

### Scalability
- SVG format for infinite scaling
- Icons work at any size
- Clear at minimum size (16x16)
- No fine details that disappear when small

### Theme Adaptation
- Icons adapt to light/dark themes
- Use CSS variables for colors
- Test in both themes
- Neutral colors preferred

---

## Implementation Notes

### CSS Variables for Theme Support
```css
:root {
  --icon-primary: #667EEA;
  --icon-success: #48BB78;
  --icon-error: #F56565;
  --icon-warning: #ED8936;
  --icon-neutral: #718096;
}

.theme-dark {
  --icon-neutral: #A0AEC0;
}
```

### Icon Loading
```typescript
// Dynamically load platform icon
function getPlatformIcon(platform: string): string {
  return `assets/icons/platforms/${platform}.svg`;
}

// Status icon with animation
function showStatusIcon(status: TranscriptionStatus): void {
  const icon = document.createElement('div');
  icon.className = `status-icon status-${status}`;
  icon.innerHTML = getStatusIcon(status);
  return icon;
}
```

---

## Future Enhancements

### Animated Icons
- Lottie animations for key states
- Microphone waves during transcription
- Progress ring around icons
- Smooth state transitions

### Custom Icon Set
- Unique icon design for brand identity
- Professionally designed icon pack
- Consistent visual language
- Premium feel

### Accessibility Improvements
- High contrast mode icons
- Reduced motion alternatives
- Larger touch targets (mobile)
- Improved screen reader support

---

**Created For:** Link Video Transcriber Plugin  
**Design Status:** Specification Complete  
**Implementation:** Pending Phase 1
