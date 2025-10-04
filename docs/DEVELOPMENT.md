# Development Guide

Complete guide for developing and maintaining the Fake News Filter extension.

## 🚀 Quick Start

### First Time Setup
```bash
npm install
npm run build
```

Then load the `dist/` folder in Chrome (`chrome://extensions/` → Enable Developer Mode → Load unpacked).

## 🔄 Development Workflow

### Option 1: Watch Mode (Recommended for Active Development)

```bash
npm run dev
```

**What it does:**
1. Performs full build first
2. Watches BOTH content script and popup for changes
3. Auto-rebuilds when you save files
4. Keeps running until you stop it (Ctrl+C)

**When files change:**
- ✅ Auto-rebuilds immediately
- ⚠️ You still need to reload the extension in Chrome
- ⚠️ You still need to refresh the test webpage

**Best for:** Actively coding with frequent changes

### Option 2: Manual Build (Recommended for Testing)

```bash
npm run build
```

**Best for:** Testing final build, deploying, or occasional changes

## 🔧 Chrome Extension Reload Workflow

Chrome extensions don't hot-reload automatically. Here's the workflow:

### After Making Code Changes:

1. **Build happens automatically** (if using `npm run dev`) or run `npm run build`
2. **Reload extension in Chrome:**
   - Go to `chrome://extensions/`
   - Find "Fake News Filter"
   - Click the reload icon (🔄)
3. **Refresh the test webpage** (F5 or Cmd+R)
4. Test your changes

## 📁 Project Structure

```
chrome_extension/
├── src/
│   ├── components/          # Vue components
│   │   ├── FactCheckBubble.vue
│   │   ├── FactCheckSidePanel.vue
│   │   ├── FloatingToolbar.vue
│   │   └── NotificationToast.vue
│   ├── content/            # Content script entry
│   │   └── main.js
│   └── popup/              # Extension popup
│       ├── main.js
│       └── Popup.vue
├── dist/                   # Built extension (gitignored)
├── docs/                   # Documentation
├── scripts/
│   └── post-build.js      # Post-build processing
├── background.js          # Background service worker
├── popup.html             # Popup HTML template
├── styles.css             # Global styles
├── manifest-dist.json     # Manifest template
├── vite.config.js         # Content script build config (IIFE)
├── vite.config.popup.js   # Popup/background build config (ES modules)
└── package.json
```

## 🏗️ Build System

### Two-Config Architecture

We use **two separate Vite configurations** for different extension contexts:

#### 1. Content Script (`vite.config.js`)
- **Format:** IIFE (Immediately Invoked Function Expression)
- **Output:** `dist/content.js` (~238 KB with Vue bundled)
- **Why:** Content scripts cannot use ES module imports in Chrome

#### 2. Popup & Background (`vite.config.popup.js`)
- **Format:** ES modules with code splitting
- **Output:** `dist/popup.js`, `dist/background.js`
- **Why:** Popup and background can use ES modules

### Build Commands

```bash
# Full build (recommended)
npm run build

# Build only content script
npm run build:content

# Build only popup & background
npm run build:popup

# Clean build artifacts
npm run clean
```

## 📦 What Gets Built

| Source File | Output | Format | Size |
|------------|--------|--------|------|
| `src/content/main.js` + components | `dist/content.js` | IIFE | ~238 KB |
| `src/popup/main.js` + components | `dist/popup.js` | ES Module | ~175 KB |
| `background.js` | `dist/background.js` | ES Module | ~3 KB |
| `manifest-dist.json` | `dist/manifest.json` | JSON | <1 KB |
| `styles.css` | `dist/styles.css` | CSS | <5 KB |
| `popup.html` | `dist/popup.html` | HTML | <1 KB |

## 🐛 Debugging

### Console Access

- **Content script errors:** Open webpage → F12 → Console
- **Popup errors:** Right-click extension icon → Inspect popup
- **Background errors:** `chrome://extensions/` → Service worker → Inspect

### Common Issues

#### Extension won't load
- Ensure you selected the `dist/` folder
- Run `npm run build` first

#### Changes not showing
- Rebuild with `npm run build`
- Reload extension in Chrome (🔄 button)
- Refresh the webpage

#### Build errors
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Force Full Rebuild
```bash
# Stop watch mode (Ctrl+C if running)
npm run clean
npm run build
# Reload extension in Chrome
```

## 🧪 Testing

### Manual Testing Workflow

1. Load the extension in Chrome
2. Navigate to any website (Twitter, Reddit, news sites, etc.)
3. Look for the floating toolbar
4. Click "🛡️ Fact-check"
5. Click on any text element
6. Verify the bubble shows results correctly
7. Click "Learn More" to test the side panel

### Test Different Scenarios

- **Fake news result**: Backend returns `flagged: true`
- **Not in database**: Backend returns `flagged: false`
- **Context menu**: Right-click selected text → "Analyze with Fake News Filter"
- **Different websites**: Test on various sites with different layouts

## 💡 Pro Tips

### 1. Use Multiple Terminals
```bash
# Terminal 1: Watch mode
npm run dev

# Terminal 2: Git commands, other tasks
git status
```

### 2. Keep Chrome Extensions Tab Open
Bookmark `chrome://extensions/` for quick access to reload button.

### 3. Component Development
- Vue components in `src/components/` are shared by both content script and popup
- Changes to components require rebuilding both bundles
- Use Vue DevTools in popup (not available in content scripts)

### 4. Watch Build Output
The terminal shows what's rebuilding:
```
✓ 15 modules transformed.  # Content script
✓ 12 modules transformed.  # Popup
```

## 🚫 Common Mistakes

### ❌ Forgetting to Reload Extension
**Symptom:** Changes don't appear  
**Fix:** Always reload extension in Chrome after rebuild

### ❌ Not Refreshing Webpage
**Symptom:** Content script changes don't appear  
**Fix:** Refresh the test webpage after reloading extension

### ❌ Editing dist/ Files Directly
**Symptom:** Changes disappear on next build  
**Fix:** Only edit `src/` files, never `dist/`

### ❌ Multiple Watch Processes
**Symptom:** Build errors or slow performance  
**Fix:** Stop all watch processes (Ctrl+C) before starting new one

## 📊 Performance

### Build Times
- Full build: ~600ms
- Watch mode rebuild: ~250ms

### Bundle Sizes
- Content script: ~238 KB (includes Vue runtime)
- Popup: ~175 KB (includes Vue runtime)
- Background: ~3 KB

## 🔧 Configuration

### Backend URL
Edit `background.js`:
```javascript
const DEFAULT_BACKEND_URL = 'https://tarcza-factcheck.vercel.app/api/evaluate';
```

### Manifest Permissions
Edit `manifest-dist.json` to modify:
- Permissions
- Host permissions
- Content script matching patterns

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

**TL;DR:** Run `npm run dev`, make changes, wait for build, reload extension, refresh webpage, test. Repeat!
