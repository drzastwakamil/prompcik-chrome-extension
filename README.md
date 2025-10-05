# Tarcza Fact-Check - Chrome Extension

🛡️ **Ochrona przed dezinformacją** - rozszerzenie Chrome do weryfikacji treści w czasie rzeczywistym. 

A Chrome extension that protects against disinformation by verifying content in real-time. Part of the Tarcza ecosystem connecting citizens, experts, and institutions to combat fake news. **Powered by Vue.js!**

## 🎯 Features

- 🛡️ **Real-time fact-checking** - Click on any element to verify information instantly
- 🎨 **Beautiful UI** - Modern, animated interface with smooth transitions
- 🔍 **Smart element detection** - Intelligent content extraction and highlighting
- 📊 **AI-powered analysis** - Confidence scores and detailed verification
- ⚡ **Lightning fast** - Built with Vue.js for optimal performance
- 🔧 **Draggable toolbar** - Floating toolbar for easy access
- 🌐 **Integration with Tarcza platform** - Connect to the national fact-checking network

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
   - Click the extension icon or the toolbar's "Fact-check" button
   - Select any text element on the page
   - Get instant AI-powered fact-checking results!
   - On first install, you'll see the Tarcza welcome page: https://tarcza-factcheck.vercel.app/

### For Developers

```bash
# Install dependencies
npm install

# Development mode (auto-rebuild on changes)
npm run dev

# Production build
npm run build
```

📚 **Development guide:** See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

## 📁 Project Structure

```
chrome_extension/
├── src/                          # Vue.js source code
│   ├── components/              # Vue components
│   │   ├── FactCheckBubble.vue
│   │   ├── FactCheckSidePanel.vue
│   │   ├── FloatingToolbar.vue
│   │   └── NotificationToast.vue
│   ├── content/                 # Content script entry
│   │   └── main.js
│   └── popup/                   # Extension popup
│       ├── Popup.vue
│       └── main.js
├── dist/                        # Built extension (gitignored)
├── docs/                        # Documentation
│   ├── DEVELOPMENT.md          # Development workflow guide
│   ├── MIGRATION.md            # Refactoring documentation
│   └── ARCHIVE_BUG_FIXES.md   # Historical bug fixes
├── scripts/
│   └── post-build.js           # Post-build processing
├── background.js               # Background service worker
├── popup.html                  # Popup HTML template
├── styles.css                  # Global styles
├── manifest-dist.json          # Manifest template
├── vite.config.js             # Content build config (IIFE)
├── vite.config.popup.js       # Popup build config (ES modules)
└── package.json               # Dependencies
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

📖 **Learn more:** See [docs/MIGRATION.md](./docs/MIGRATION.md)

## 📖 Documentation

- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Complete development workflow guide
- **[docs/MIGRATION.md](./docs/MIGRATION.md)** - Detailed refactoring explanation and architecture
- **[docs/ARCHIVE_BUG_FIXES.md](./docs/ARCHIVE_BUG_FIXES.md)** - Historical bug fixes

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
- **Architecture:** Component-based with two-config build system (IIFE for content, ES modules for popup/background)

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

📖 **More help:** See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) troubleshooting section

## 📄 License

Copyright © 2024. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainer.

## 📞 Support

For issues or questions:
1. Check the [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) troubleshooting section
2. Review browser console for errors
3. Check that the backend API is accessible

---

**Version:** 1.0.0  
**Last Updated:** October 2024  
**Built with:** Vue.js, Vite, Chrome Extension APIs