# ArchiGram.ai - Pre-Launch Assets Guide

## Required Assets for Product Hunt

### 1. Logo (Required)
- **Format:** PNG or GIF
- **Size:** 240x240 pixels (square)
- **Location:** `public/icon-512.png` (resize to 240x240)
- **Status:** ✅ Ready (purple gradient favicon)

### 2. Gallery Images (5 Required)
Screenshots that showcase your product's key features.

#### Screenshot 1: Hero Shot - Main Editor
**What to capture:**
- Full browser view of the main editor
- Show split view with code on left, diagram on right
- Use an impressive diagram (microservices architecture)
- Dark theme looks best

**How to take:**
```bash
# Use Chrome DevTools
1. Open https://archigram-ai.vercel.app
2. Press F12 → Device Toolbar → Responsive → 1440x900
3. Load a complex diagram (use Uber System Flow template)
4. Screenshot the full viewport
```

#### Screenshot 2: AI Chat in Action
**What to capture:**
- Show the AI Copilot panel open
- Display a user prompt and AI response
- Show the generated code appearing

**Steps:**
1. Open AI Copilot panel
2. Type: "Create a payment processing system with Stripe"
3. Wait for response
4. Screenshot with prompt and result visible

#### Screenshot 3: Vision AI Feature
**What to capture:**
- Show the "Scan Image" modal
- Include before (whiteboard photo) and after (generated code)
- Highlight the magic of image-to-code

**Steps:**
1. Click "Scan Image" button
2. Upload a whiteboard architecture sketch
3. Show the generated Mermaid code
4. Screenshot the transformation

#### Screenshot 4: Architectural Audit
**What to capture:**
- Show the Audit modal with results
- Display risk scores and recommendations
- Highlight security analysis

**Steps:**
1. Load a diagram with some architectural issues
2. Click "Audit" button
3. Wait for AI analysis
4. Screenshot the audit results

#### Screenshot 5: Community Gallery
**What to capture:**
- Show the Community Gallery with shared diagrams
- Display variety of diagram types
- Show like counts and fork buttons

**Steps:**
1. Click "Community" in sidebar
2. Ensure gallery has diverse diagrams
3. Screenshot the gallery view

---

## 3. Demo GIF (Highly Recommended)
**Specifications:**
- **Duration:** 15-30 seconds
- **Size:** Max 3MB
- **Resolution:** 800x600 or higher
- **Format:** GIF

### Recording Script

```
Scene 1 (0-5s): Show empty editor
Scene 2 (5-15s): Type prompt in AI chat:
  "Create a microservices e-commerce architecture
   with API gateway, user service, product service,
   cart service, and payment processing"
Scene 3 (15-25s): Show AI generating code in real-time
Scene 4 (25-30s): Zoom in on the rendered diagram
```

### How to Record

**Option 1: Using macOS Screen Recording**
```bash
# Press Cmd+Shift+5
# Select "Record Selected Portion"
# Draw rectangle around browser
# Click Record
# Perform the demo
# Click Stop
# Convert to GIF using:
ffmpeg -i recording.mov -vf "fps=15,scale=800:-1" -c:v gif demo.gif
```

**Option 2: Using Kap (Recommended)**
```bash
brew install --cask kap
# Open Kap
# Select browser area
# Record
# Export as GIF (15fps, 800px width)
```

**Option 3: Using LICEcap**
```bash
# Download from https://www.cockos.com/licecap/
# Position over browser
# Set to 15fps
# Record directly to GIF
```

---

## 4. Product Hunt Thumbnail
**Specifications:**
- **Size:** 1270x760 pixels
- **Format:** PNG or JPG
- **Content:** Product name + tagline + key visual

### Design Template

```
┌─────────────────────────────────────────────────┐
│                                                 │
│     [Logo]  ArchiGram.ai                       │
│                                                 │
│     "Describe your architecture.               │
│      AI draws it."                             │
│                                                 │
│     [Screenshot of diagram]                    │
│                                                 │
│     ───────────────────────                    │
│     Open Source • AI-Powered • Free            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Create using:**
- Figma (free): figma.com
- Canva (free): canva.com
- Or screenshot + annotations

---

## 5. Social Media Assets

### Twitter Card Image
- **Size:** 1200x675 pixels
- **Use:** `public/og-image.png` ✅ Ready

### LinkedIn Image
- **Size:** 1200x627 pixels
- **Use:** Same as og-image

---

## Asset Checklist

| Asset | Size | Status | Location |
|-------|------|--------|----------|
| Logo (square) | 240x240 | ✅ | `public/icon-512.png` |
| Screenshot 1: Editor | 1440x900 | ⏳ | To create |
| Screenshot 2: AI Chat | 1440x900 | ⏳ | To create |
| Screenshot 3: Vision AI | 1440x900 | ⏳ | To create |
| Screenshot 4: Audit | 1440x900 | ⏳ | To create |
| Screenshot 5: Gallery | 1440x900 | ⏳ | To create |
| Demo GIF | 800x600, <3MB | ⏳ | To create |
| OG Image | 1200x630 | ✅ | `public/og-image.png` |
| Favicon | Multi-size | ✅ | `public/favicon.ico` |

---

## Quick Commands

### Take Screenshots with Puppeteer
```javascript
// screenshot.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://archigram-ai.vercel.app');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-hero.png' });
  await browser.close();
})();
```

### Optimize Images
```bash
# Install imageoptim-cli
brew install imageoptim-cli

# Optimize all PNGs
imageoptim *.png

# Or use squoosh.app for manual optimization
```

### Convert Video to GIF
```bash
# High quality GIF from video
ffmpeg -i input.mov -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 output.gif
```

---

## Tips for Great Screenshots

1. **Use Dark Theme** - Looks more professional
2. **Show Real Data** - Use meaningful diagram examples
3. **Clean Browser** - Hide bookmarks bar, use incognito
4. **Highlight Features** - Add subtle annotations if needed
5. **Consistent Size** - All screenshots same dimensions
6. **High DPI** - Use 2x resolution if possible

---

## Launch Day Reminder

Before launch, verify:
- [ ] All 5 screenshots uploaded to Product Hunt
- [ ] Demo GIF shows key workflow
- [ ] Logo is crisp and clear
- [ ] OG image displays correctly on social preview
- [ ] All links work (demo, GitHub, docs)
