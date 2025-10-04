# Fake News Filter Chrome Extension

A Chrome extension that helps users identify and fact-check potentially misleading content on webpages. Select or click on any text to verify its authenticity against a fact-checking database.

## Features

- 🛡️ **Fact-check Content**: Start a selection mode, hover to highlight, click an element to fact-check its text
- ✍️ **Text Selection Fact-check**: Select any text on a page to see a fact-check button
- 📋 **Context Menu**: Right-click selected text to analyze it with the Fake News Filter
- 🧰 **Floating Toolbar**: A small draggable toolbar appears on every page with quick access to fact-checking
- 🎨 **Visual Overlays**: Results are displayed in beautiful, draggable overlays with detailed information
- 📊 **Detailed Side Panel**: Click "Learn More" to see comprehensive fact-check analysis

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `chrome_extension` folder
5. The extension should now appear in your extensions list
6. **Important**: Refresh any open webpages for the extension to work on them

## Usage

### Floating Toolbar (Primary UX)
- Appears at the top-right of each page (draggable)
- Click "🛡️ Fact-check" to start selection mode (ESC to cancel)
- Results appear as overlays near the clicked element

### Extension Popup (Info-only)
- Shows basic info; all actions are available directly via the on-page toolbar

### Fact-check Flow (On-demand)
1. Click the popup button "🛡️ Fact-check (select element)"
2. Move the cursor to highlight an element and click it
3. A small overlay near the element shows: `Fact checking…`
4. The extension gathers visible text from the clicked area and sends it to the background for analysis
5. A mocked response is displayed in an overlay near the element, including a label, optional confidence, and a text snippet

Notes:
- No automatic scanning or analysis occurs; everything is user-initiated
- Loading overlay uses the exact text `Fact checking…` without spinner or branding
- Mocked backend responses are returned unless you enable a real backend

### How It Works

The extension provides multiple ways to fact-check content:

1. **Element Selection Mode**: Click the Fact-check button in the floating toolbar, then hover and click any element on the page
2. **Text Selection**: Simply select any text on the page and click the Fact-check button that appears
3. **Context Menu**: Right-click on selected text and choose "Analyze with Fake News Filter"

All methods send the content to the backend API for analysis and display results with confidence scores.

## File Structure

```
chrome_extension/
├── manifest.json       # Extension configuration
├── content.js          # Content script (runs on all pages)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── styles.css          # Overlay styles
└── README.md           # This file
```

## Note on Icons

The manifest references icon files (`icon16.png`, `icon48.png`, `icon128.png`) which are not included in this prototype. The extension will work without them, but you may see warnings in the console. To add icons:

1. Create PNG files with dimensions 16x16, 48x48, and 128x128 pixels
2. Name them `icon16.png`, `icon48.png`, and `icon128.png`
3. Place them in the root of the extension folder

## Technical Details

1. **Content Script**: `content.js` is injected into every webpage and provides fact-checking functionality
2. **Background Service Worker**: Handles API calls to the backend fact-checking service
3. **Text Extraction**: Smart extraction of visible text from various social media platforms (Twitter, Facebook, Reddit, LinkedIn, YouTube)
4. **Overlay System**: Creates absolutely positioned overlays with high z-index (999999) for results
5. **Selection Mode**: Draws a highlight box around hovered elements and extracts their text content
6. **Context Menu Integration**: Right-click menu option for quick fact-checking
7. **Draggable UI**: All overlays and toolbars can be dragged and repositioned

## Configuration

You can configure the backend URL:
1. The extension stores the backend URL in Chrome's sync storage
2. Default URL: `https://next-prompcik.vercel.app/api/evaluate`
3. The backend analyzes text and returns fact-check results with confidence scores

## Troubleshooting

### "Could not establish connection" Error
This means the content script hasn't loaded on the current page yet. **Solution**: Refresh the webpage and try again.

This happens when:
- You just installed the extension
- You just reloaded the extension
- The page was open before the extension was loaded

### Extension not working on certain pages
Chrome extensions have restrictions on:
- `chrome://` pages (settings, extensions, etc.)
- Chrome Web Store pages
- Some protected internal pages

Try it on regular websites like Google, GitHub, or any news site.

### Fact-check Tips
- For best results, select or click elements with substantial text content
- Press ESC to exit selection mode without clicking
- Text selections must be at least 10 characters to trigger the fact-check button
- The extension works best on social media posts, news articles, and comment sections

## Browser Compatibility

This extension uses Manifest V3 and is compatible with:
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## License

MIT License - Free to use and modify.

