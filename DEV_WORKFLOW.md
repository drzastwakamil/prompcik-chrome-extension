# Development Workflow

## 🚀 Quick Start

### First Time Setup
```bash
npm install
npm run build
```

Then load the `dist/` folder in Chrome (`chrome://extensions/` → Load unpacked).

## 🔄 Development Modes

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

**What it does:**
1. Full clean build
2. Exits when done

**Best for:** Testing final build, deploying, or occasional changes

## 🔧 Chrome Extension Reload Workflow

Chrome extensions don't hot-reload automatically. Here's the workflow:

### After Making Code Changes:

#### If using `npm run dev` (watch mode):
1. ✅ **Build happens automatically** - Wait for "✓ built in Xms" message
2. **Reload extension in Chrome:**
   - Go to `chrome://extensions/`
   - Find "Fake News Filter"
   - Click the reload icon (🔄)
3. **Refresh the test webpage** (F5 or Cmd+R)
4. Test your changes

#### If using `npm run build`:
1. **Run build command:** `npm run build`
2. **Reload extension in Chrome:**
   - Go to `chrome://extensions/`
   - Find "Fake News Filter"
   - Click the reload icon (🔄)
3. **Refresh the test webpage** (F5 or Cmd+R)
4. Test your changes

## 📁 What Gets Rebuilt

| File Changed | Watch Mode Rebuilds? | Affects |
|--------------|---------------------|---------|
| `src/components/*.vue` | ✅ Yes (both) | Content script + Popup |
| `src/content/main.js` | ✅ Yes | Content script |
| `src/popup/*.vue` | ✅ Yes | Popup only |
| `background.js` | ✅ Yes | Service worker |
| `styles.css` | ⚠️ No* | Need manual rebuild |
| `manifest-dist.json` | ⚠️ No* | Need manual rebuild |

*For these files, stop watch mode, run `npm run build`, then restart watch mode.

## 🎯 Recommended Workflow

### Daily Development Session

```bash
# 1. Start watch mode in terminal
npm run dev

# 2. Make changes in your IDE
# (save files normally)

# 3. After each save:
#    - Wait for "✓ built in Xms"
#    - Go to chrome://extensions/
#    - Click reload on extension
#    - Refresh test webpage
#    - Test changes

# 4. When done, stop watch mode
# Press Ctrl+C in terminal
```

### Quick Fix Workflow

```bash
# 1. Make changes
# 2. Build once
npm run build

# 3. Reload extension in Chrome
# 4. Test
```

## 🐛 Debugging Tips

### Check Build Output
Watch mode shows each build:
```
vite v5.4.20 building for production...
✓ 15 modules transformed.
dist/content.js  238.38 kB
✓ built in 271ms
```

### Check Console Errors
- **Content script errors:** Open webpage → F12 → Console
- **Popup errors:** Right-click extension icon → Inspect popup
- **Background errors:** `chrome://extensions/` → Service worker → Inspect

### Force Full Rebuild
If something seems cached or broken:
```bash
# Stop watch mode (Ctrl+C)
npm run build
# Reload extension in Chrome
```

## 📊 Build Times

Approximate build times on standard hardware:

| Command | Time | When to Use |
|---------|------|-------------|
| `npm run build` | ~600ms | First build, final testing |
| Watch rebuild | ~250ms | Each file save during dev |

## 🔄 Component Hot Reload?

**Chrome extensions don't support hot module replacement (HMR)** like regular web apps because:
- Content scripts run in webpage context
- Can't dynamically reload without page refresh
- Extension context is isolated

So you'll always need to:
1. Wait for build
2. Reload extension
3. Refresh webpage

This is a Chrome extension limitation, not a Vue or Vite issue.

## 💡 Pro Tips

### 1. Use Multiple Terminals
```bash
# Terminal 1: Watch mode
npm run dev

# Terminal 2: Git commands, npm commands, etc.
git status
```

### 2. Keep Chrome Extensions Tab Open
Bookmark `chrome://extensions/` for quick access.

### 3. Use Browser DevTools
- Content script: F12 on webpage
- Popup: Right-click extension icon → Inspect
- Background: Extensions page → Service worker

### 4. Test on Different Sites
Content scripts run on all sites - test on:
- Twitter/X
- Reddit  
- News sites
- Your own test page

### 5. Watch Build Output
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

## 📈 Optimization Tips

### Faster Rebuilds
- Watch mode is faster than full builds (~250ms vs ~600ms)
- Only imports changed files rebuild
- Vite is already optimized for speed

### Reduce Reload Time
- Keep extension tab pinned
- Use keyboard shortcuts in Chrome
- Bookmark test pages

## 🎓 Learning Resources

- [Vite Build Docs](https://vitejs.dev/guide/build.html)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [Vue DevTools](https://devtools.vuejs.org/) (works in popup, not content scripts)

---

**TL;DR:** Run `npm run dev`, make changes, wait for build, reload extension in Chrome, refresh webpage, test. Repeat!
