# Build Configuration Fix

## Issue
Content scripts in Chrome extensions cannot use ES module imports directly. The error was:
```
Uncaught SyntaxError: Cannot use import statement outside a module
```

## Solution
We now use **two separate Vite configurations** to build different parts of the extension with appropriate formats:

### 1. Content Script (vite.config.js)
- **Format:** IIFE (Immediately Invoked Function Expression)
- **Inline:** All imports bundled into single file
- **Output:** `dist/content.js` (238 KB with Vue bundled in)
- **Why:** Content scripts run in page context and cannot use ES modules

### 2. Popup & Background (vite.config.popup.js)
- **Format:** ES modules
- **Code splitting:** Allowed (chunks)
- **Output:** `dist/popup.js`, `dist/background.js`
- **Why:** Popup and background can use ES modules

## Build Process

```bash
npm run build
```

This runs:
1. `npm run clean` - Clean dist folder
2. `npm run build:content` - Build content script as IIFE
3. `npm run build:popup` - Build popup & background as ES modules
4. `node scripts/post-build.js` - Fix paths and copy files

## File Sizes

| File | Size | Format | Contains |
|------|------|--------|----------|
| content.js | ~238 KB | IIFE | Vue runtime + all components |
| popup.js | ~175 KB | ES Module | Vue runtime + popup |
| background.js | ~2.7 KB | ES Module | Service worker |

## Key Changes

### Before (Broken)
- Single Vite config
- All files built as ES modules
- Content script had `import` statements
- ❌ Chrome rejected content script

### After (Working)
- Two Vite configs
- Content script built as IIFE (self-contained)
- Popup/background as ES modules
- ✅ Chrome loads successfully

## Technical Details

### IIFE Format
The content script now starts with:
```javascript
(function() {
  "use strict";
  // All Vue and component code here
  // No import statements
})();
```

### Module Format
Popup and background use:
```javascript
import { createApp } from 'vue';
// Normal ES imports work here
```

## Why Two Configs?

Chrome extension contexts have different capabilities:

| Context | ES Modules? | Dynamic Import? | Format Needed |
|---------|-------------|-----------------|---------------|
| Content Script | ❌ No | ❌ No | IIFE |
| Popup | ✅ Yes | ✅ Yes | ES Module |
| Background | ✅ Yes* | ✅ Yes | ES Module |
| Service Worker | ✅ Yes | ✅ Yes | ES Module |

*Requires `type: "module"` in manifest

## Development Workflow

### Watch Mode
```bash
npm run dev
```
Builds content first, then watches popup for changes.

### Production Build
```bash
npm run build
```
Builds everything fresh.

### Manual Builds
```bash
# Build only content script
npm run build:content

# Build only popup & background
npm run build:popup
```

## Troubleshooting

### Still getting import errors?
1. Check `dist/content.js` starts with `(function() {`
2. Verify `dist/content.js` is ~238 KB (Vue bundled in)
3. Rebuild: `npm run build`

### Popup not working?
1. Check `dist/popup.html` has relative paths (`./popup.js`)
2. Verify chunks are being loaded
3. Check browser console for errors

### Build fails?
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Benefits

✅ **Content script works** - IIFE format compatible with Chrome
✅ **Popup optimized** - Code splitting for faster loads
✅ **Clean separation** - Each context built appropriately
✅ **Single command** - `npm run build` handles everything

## File Structure

```
chrome_extension/
├── vite.config.js           # Content script config (IIFE)
├── vite.config.popup.js     # Popup/background config (ES)
├── src/
│   ├── content/main.js      # → dist/content.js (IIFE)
│   └── popup/main.js        # → dist/popup.js (ES)
├── background.js            # → dist/background.js (ES)
└── dist/
    ├── content.js           # 238 KB IIFE
    ├── popup.js             # 175 KB ES module
    ├── background.js        # 2.7 KB ES module
    └── manifest.json
```

---

**Last updated:** October 2024  
**Fix version:** 1.0.1
