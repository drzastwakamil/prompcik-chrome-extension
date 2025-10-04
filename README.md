# DOM Reader & Overlay Chrome Extension

A prototype Chrome extension that can read the DOM of any webpage and add absolutely positioned overlay elements.

## Features

- 📖 **Read DOM**: Analyzes the current page and extracts information (title, paragraphs, images, links, headings, forms)
- 🎨 **Add Overlays**: Injects custom absolutely positioned elements on top of the webpage
- 🔄 **Draggable**: All overlays are draggable so you can reposition them
- 💬 **Interactive Popup**: Control panel to trigger different actions
- 🐱 **API Integration**: Fetches data from external APIs (The Cat API & Cat Facts) and displays it in the DOM
- 🛡️ **On-demand Fact-check**: Start a selection mode, hover to highlight, click an element to fact-check its text; shows a loading overlay and a mocked result
 - 🧰 **Floating Toolbar**: A small draggable toolbar appears on every page with a Fact-check button

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `chrome_extension` folder
5. The extension should now appear in your extensions list
6. **Important**: Refresh any open webpages for the extension to work on them

## Usage

### Automatic Demo
Security requirement: automatic overlays are disabled by default. You can enable them for development by setting `FNF_DEMO_OVERLAYS_ENABLED = true` in `content.js`.

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

### Programmatic Usage

The content script exposes these message handlers:

```javascript
// Read DOM
chrome.tabs.sendMessage(tabId, { action: 'readDOM' }, (response) => {
  console.log(response.data); // DOM info object
});

// Add custom overlay
chrome.tabs.sendMessage(tabId, { 
  action: 'addOverlay',
  config: {
    text: 'Your text',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    color: '#ffffff'
  }
});

// Show DOM info overlay
chrome.tabs.sendMessage(tabId, { action: 'showDOMInfo' });
```

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

## How It Works

1. **Content Script**: `content.js` is injected into every webpage and has access to the page's DOM
2. **DOM Reading**: The script queries the DOM for various elements and counts them
3. **Overlay Creation**: Creates absolutely positioned `div` elements with high z-index (999999)
4. **Message Passing**: Uses Chrome's messaging API to communicate between popup and content script
5. **Selection Mode**: The content script draws a non-interactive highlight box around the hovered element and anchors overlays near the clicked element
6. **Floating Toolbar**: Injected by the content script on page load; draggable handle and close option
5. **Draggable Logic**: Implements mouse event handlers to allow dragging overlays

## Customization

You can easily customize the overlays by modifying the `addOverlayElement` function in `content.js`:

- Change default colors
- Modify positioning
- Add more interactive features
- Change styling and animations
 - Overlays can be positioned via `top`/`right` or `top`/`left` (added for element anchoring)

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

### Fact-check selection mode tips
- If nothing happens after clicking an element, try clicking a text-rich area (the extension prioritizes visible text extraction)
- Press ESC to exit selection mode without clicking

## Browser Compatibility

This extension uses Manifest V3 and is compatible with:
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## License

This is a prototype for demonstration purposes.

