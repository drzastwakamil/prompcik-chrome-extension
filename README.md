# Fake News Filter - Chrome Extension

A Chrome extension that helps users fact-check content on any webpage to identify potentially misleading information. **Now powered by Vue.js!**

## 🎯 Features

- 🛡️ **Fact-check any content** - Click on any element to verify information
- 🎨 **Beautiful UI** - Modern, animated interface with smooth transitions
- 🔍 **Element highlighting** - Visual feedback during selection
- 📊 **Detailed results** - Confidence scores and detailed analysis
- ⚡ **Fast & responsive** - Built with Vue.js for optimal performance
- 🔧 **Draggable toolbar** - Floating toolbar for easy access

## 🚀 Quick Start

### For Users (Install the Extension)

1. **Build the extension:**
   ```bash
   npm install
   npm run build
   ```

2. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

3. **Start using:**
   - Visit any website
   - Click the toolbar's "Fact-check" button
   - Select any text element
   - Get instant fact-checking results!

📖 **Detailed instructions:** See [INSTALL.md](./INSTALL.md)

### For Developers

```bash
# Install dependencies
npm install

# Development mode (auto-rebuild on changes)
npm run dev

# Production build
npm run build
```

📚 **Development guide:** See [QUICK_START.md](./QUICK_START.md)

## 📁 Project Structure

```
chrome_extension/
├── src/                          # Vue.js source code
│   ├── components/              # Vue components
│   │   ├── FactCheckBubble.vue
│   │   ├── FactCheckSidePanel.vue
│   │   ├── FloatingToolbar.vue
│   │   └── NotificationToast.vue
│   ├── content/                 # Content script
│   └── popup/                   # Extension popup
├── dist/                        # Built extension (load this in Chrome)
├── background.js                # Background service worker
├── vite.config.js              # Build configuration
└── package.json                # Dependencies
```

## 🏗️ Architecture

This extension is built with:
- **Vue 3** - Modern reactive UI framework
- **Vite** - Fast build tool
- **Chrome Extension Manifest V3** - Latest extension standard

### Key Components

1. **FactCheckBubble** - Shows fact-check results in a bubble overlay
2. **FactCheckSidePanel** - Detailed information panel
3. **FloatingToolbar** - On-page toolbar for quick access
4. **NotificationToast** - User notifications

## 🔄 Recent Refactoring

This extension was recently refactored from vanilla JavaScript to Vue.js:
- ✅ **Reduced complexity** - From 1256 lines of DOM manipulation to clean Vue components
- ✅ **Better maintainability** - Component-based architecture
- ✅ **Improved DX** - Better tooling and developer experience
- ✅ **Same functionality** - All features preserved

📖 **Learn more:** See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) and [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)

## 📖 Documentation

- **[INSTALL.md](./INSTALL.md)** - Installation instructions
- **[QUICK_START.md](./QUICK_START.md)** - Get started in 3 steps
- **[README_VUE.md](./README_VUE.md)** - Vue.js architecture overview
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Detailed refactoring explanation
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - Summary of changes

## 🛠️ Development

### Prerequisites
- Node.js v16 or higher
- npm or yarn
- Google Chrome

### Build Commands

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Preview (optional)
npm run preview
```

### Making Changes

1. Edit Vue components in `src/components/`
2. Run `npm run build`
3. Reload the extension in Chrome (`chrome://extensions/`)
4. Refresh the test webpage

## 🧪 Testing

1. Load the extension in Chrome
2. Navigate to any website (Twitter, Reddit, news sites, etc.)
3. Look for the floating toolbar
4. Click "🛡️ Fact-check"
5. Click on any text element
6. Verify the bubble shows results correctly
7. Click "Learn More" to test the side panel

## 🔧 Configuration

### Backend URL
The fact-checking backend URL can be configured in `background.js`:
```javascript
const DEFAULT_BACKEND_URL = 'https://tarcza-factcheck.vercel.app/api/evaluate';
```

### Permissions
Required permissions are defined in `manifest-dist.json`:
- `activeTab` - Access current tab
- `scripting` - Inject content scripts
- `contextMenus` - Right-click menu
- `storage` - Store settings

## 📝 Tech Stack

- **Frontend:** Vue 3.4.21
- **Build Tool:** Vite 5.2.0
- **Extension Type:** Manifest V3
- **Language:** JavaScript (ES modules)
- **Styling:** Scoped CSS with animations

## 🐛 Troubleshooting

### Extension won't load
- Ensure you selected the `dist/` folder
- Run `npm run build` first

### Changes not showing
- Rebuild with `npm run build`
- Reload extension in Chrome
- Refresh the webpage

### Build errors
```bash
rm -rf node_modules
npm install
npm run build
```

📖 **More help:** See [INSTALL.md](./INSTALL.md) troubleshooting section

## 📄 License

Copyright © 2024. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainer.

## 📞 Support

For issues or questions:
1. Check the [INSTALL.md](./INSTALL.md) troubleshooting section
2. Review browser console for errors
3. Check that the backend API is accessible

---

**Version:** 1.0.0  
**Last Updated:** October 2024  
**Built with:** Vue.js, Vite, Chrome Extension APIs