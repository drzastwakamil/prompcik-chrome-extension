# Installation Instructions

## ✅ The Extension is Ready!

Your Chrome extension has been successfully refactored to use Vue.js and is ready to install.

## 📦 What's in the `dist/` Folder

The `dist/` folder contains your built extension:
```
dist/
├── manifest.json       # Extension manifest
├── background.js       # Background service worker
├── content.js          # Content script (Vue-powered)
├── popup.html          # Popup HTML
├── popup.js            # Popup script (Vue-powered)
├── style.css           # Vue component styles
├── styles.css          # Animation styles
└── chunks/             # Vue runtime and shared code
    └── _plugin-vue_export-helper-*.js
```

## 🚀 Install in Chrome (3 Steps)

### Step 1: Open Chrome Extensions Page
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
   - Or click the menu (⋮) → More tools → Extensions

### Step 2: Enable Developer Mode
1. Look for the **"Developer mode"** toggle in the top-right corner
2. Turn it **ON**

### Step 3: Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to your project folder
3. Select the **`dist/`** folder (NOT the root folder!)
4. Click **"Select Folder"**

✅ **Done!** The extension is now installed and active.

## 🧪 Test the Extension

### Quick Test
1. Go to any website (e.g., https://twitter.com, https://reddit.com)
2. Look for a floating toolbar in the top-right corner
3. Click the **"🛡️ Fact-check"** button
4. Your cursor will turn into a crosshair
5. Click on any text element
6. A fact-check bubble will appear!

### Full Features Test
- ✅ Floating toolbar appears
- ✅ Fact-check mode activates
- ✅ Element highlighting works
- ✅ Bubble shows loading state
- ✅ Results display correctly
- ✅ "Learn More" opens side panel
- ✅ Popup opens when clicking extension icon

## 🔄 Updating the Extension

After making code changes:

1. **Rebuild:**
   ```bash
   npm run build
   ```

2. **Reload in Chrome:**
   - Go to `chrome://extensions/`
   - Find "Fake News Filter"
   - Click the reload icon (🔄)

3. **Refresh the test webpage**

## 🐛 Troubleshooting

### Extension won't load
**Problem:** Chrome shows an error when loading

**Solution:**
- Make sure you selected the `dist/` folder, not the root
- Check that `manifest.json` exists in `dist/`
- Run `npm run build` to ensure files are up to date

### Popup doesn't open
**Problem:** Clicking the extension icon does nothing

**Solution:**
- Check browser console for errors (F12)
- Verify `popup.html` and `popup.js` exist in `dist/`
- Reload the extension

### Toolbar doesn't appear on pages
**Problem:** No floating toolbar visible

**Solution:**
- Check that the webpage allows content scripts
- Open browser console (F12) and look for errors
- Verify `content.js` loaded (check Network tab)
- Try refreshing the page

### Fact-check doesn't work
**Problem:** Clicking elements does nothing

**Solution:**
- Check browser console for JavaScript errors
- Verify the backend URL in `background.js` is correct
- Check network tab for failed API calls

### Build fails
**Problem:** `npm run build` shows errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Try building again
npm run build
```

## 📊 Verify Installation

### Check Extension is Active
1. Go to `chrome://extensions/`
2. Find "Fake News Filter"
3. Ensure the toggle is **ON** (blue)
4. Should show version **1.0.0**

### Check Files Were Built
```bash
ls -la dist/
```

Should show:
- ✅ manifest.json
- ✅ background.js
- ✅ content.js
- ✅ popup.html & popup.js
- ✅ style.css & styles.css
- ✅ chunks/ directory

### Check Console for Errors
1. Open any webpage
2. Press F12 (open DevTools)
3. Go to Console tab
4. Look for: `"Fake News Filter Extension loaded (Vue.js version)"`
5. Should see **no errors** in red

## 🎉 Success!

If you see:
- ✅ Extension appears in Chrome toolbar
- ✅ Floating toolbar on webpages
- ✅ Console message: "Fake News Filter Extension loaded (Vue.js version)"
- ✅ No errors in console

**Congratulations!** Your Vue.js-powered extension is working perfectly!

## 📚 Next Steps

- Read [README_VUE.md](./README_VUE.md) for architecture details
- Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) to understand the refactoring
- Check [QUICK_START.md](./QUICK_START.md) for development workflow

---

**Need help?** Check the troubleshooting section or review the browser console for specific error messages.
