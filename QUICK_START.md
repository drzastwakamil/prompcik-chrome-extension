# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Extension
```bash
npm run build
```

### 3. Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the **`dist/`** folder from this project

✅ Done! The extension is now active.

## 📁 What You Need to Know

### Project Structure
```
chrome_extension/
├── src/                    # Source code (Vue components)
├── dist/                   # Built extension (load this in Chrome)
├── package.json            # Dependencies
├── vite.config.js          # Build configuration
└── README_VUE.md          # Full documentation
```

### Development Workflow

**Watch Mode (Auto-rebuild on changes):**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
```

After building, reload the extension in Chrome:
- Go to `chrome://extensions/`
- Click the reload icon on your extension card
- Refresh the webpage you're testing on

## 🛠️ Making Changes

1. Edit Vue components in `src/components/`
2. Run `npm run build`
3. Reload extension in Chrome
4. Refresh the webpage

## 🎯 Testing the Extension

1. Navigate to any website (e.g., Twitter, Reddit, news sites)
2. Look for the floating toolbar in the top-right corner
3. Click **"🛡️ Fact-check"** button
4. Your cursor will change to a crosshair
5. Click on any text element on the page
6. A fact-check bubble will appear with results

## 📖 Key Files

| File | Purpose |
|------|---------|
| `src/components/FactCheckBubble.vue` | Result bubble UI |
| `src/components/FactCheckSidePanel.vue` | Detailed info panel |
| `src/components/FloatingToolbar.vue` | On-page toolbar |
| `src/content/main.js` | Content script logic |
| `background.js` | Background service worker |

## 🐛 Troubleshooting

**Extension won't load:**
- Make sure you selected the `dist/` folder, not the root folder
- Check that `npm run build` completed successfully

**Changes not showing:**
- Rebuild: `npm run build`
- Reload the extension in `chrome://extensions/`
- Refresh the webpage

**Build errors:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Make sure you're using Node.js v16 or higher

## 📚 Learn More

- [README_VUE.md](./README_VUE.md) - Detailed documentation
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - How we refactored from vanilla JS

## 🎓 Vue.js Resources

New to Vue? Check out:
- [Vue 3 Documentation](https://vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)

---

**Need help?** Check the browser console for errors or review the migration guide for detailed explanations.
