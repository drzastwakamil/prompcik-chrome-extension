# DOM Reader & Overlay Chrome Extension

A prototype Chrome extension that can read the DOM of any webpage and add absolutely positioned overlay elements.

## Features

- 📖 **Read DOM**: Analyzes the current page and extracts information (title, paragraphs, images, links, headings, forms)
- 🎨 **Add Overlays**: Injects custom absolutely positioned elements on top of the webpage
- 🔄 **Draggable**: All overlays are draggable so you can reposition them
- ✨ **Auto-load**: Automatically shows a demo overlay when loaded
- 💬 **Interactive Popup**: Control panel to trigger different actions
- 🐱 **API Integration**: Fetches data from external APIs (The Cat API & Cat Facts) and displays it in the DOM

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `chrome_extension` folder
5. The extension should now appear in your extensions list
6. **Important**: Refresh any open webpages for the extension to work on them

## Usage

### Automatic Demo
- Once installed, navigate to any webpage
- After ~1 second, you'll see a blue overlay appear saying "🎉 Extension Active! (Drag me)"
- You can drag this overlay anywhere on the page
- Click the × button to close it

### Extension Popup
Click the extension icon in the toolbar to open the control panel:

1. **Read DOM Info**: Extracts and displays DOM statistics in the popup
2. **Add Custom Overlay**: Creates a new overlay with random color at a random position
3. **Show DOM Stats**: Creates a green overlay on the page showing DOM statistics
4. **🐱 Fetch Random Cat**: Fetches a random cat image and fact from external APIs and displays them on the page

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
5. **Draggable Logic**: Implements mouse event handlers to allow dragging overlays

## Customization

You can easily customize the overlays by modifying the `addOverlayElement` function in `content.js`:

- Change default colors
- Modify positioning
- Add more interactive features
- Change styling and animations

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

## Browser Compatibility

This extension uses Manifest V3 and is compatible with:
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## License

This is a prototype for demonstration purposes.

