# Fake News Filter - Vue.js Version

This Chrome extension has been refactored to use Vue.js for better maintainability and cleaner component architecture.

## Architecture

The extension is now built with:
- **Vue 3** for reactive UI components
- **Vite** for fast bundling and HMR during development
- **Component-based architecture** replacing manual DOM manipulation

## Project Structure

```
chrome_extension/
├── src/
│   ├── components/          # Vue components
│   │   ├── FactCheckBubble.vue      # Fact-check result bubble
│   │   ├── FactCheckSidePanel.vue   # Detailed side panel
│   │   ├── FloatingToolbar.vue      # On-page toolbar
│   │   └── NotificationToast.vue    # Toast notifications
│   ├── content/
│   │   └── main.js          # Content script entry point
│   └── popup/
│       ├── Popup.vue        # Popup component
│       └── main.js          # Popup entry point
├── dist/                    # Built files (loaded by Chrome)
│   ├── manifest.json        # Extension manifest
│   ├── styles.css           # Global styles
│   ├── background.js        # Service worker (built)
│   ├── content.js           # Content script (built)
│   ├── popup.js             # Popup script (built)
│   ├── popup.html           # Popup HTML (built)
│   └── chunks/              # Code split chunks
├── background.js            # Background service worker (source)
├── popup.html               # Popup HTML template
├── manifest.json            # Source manifest (for reference)
├── vite.config.js           # Vite build configuration
└── package.json             # Dependencies and scripts
```

## Development

### Install Dependencies

```bash
npm install
```

### Build for Development (with watch mode)

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

### Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` directory from this project

### Making Changes

1. Edit Vue components in `src/components/`
2. The build system will automatically rebuild
3. Reload the extension in Chrome to see changes

## Components

### FactCheckBubble.vue
Displays fact-check results in a floating bubble attached to the selected element.
- **States**: loading, result, error
- **Features**: Draggable, animated transitions, learn more button

### FactCheckSidePanel.vue
Shows detailed fact-check information in a slide-out panel.
- **Features**: Confidence circle, reasoning, recommendations

### FloatingToolbar.vue
Persistent toolbar for quick access to fact-checking.
- **Features**: Draggable, minimal UI

### NotificationToast.vue
Toast notifications for user feedback.
- **Types**: info, warning, error, success

## Key Improvements Over Plain JavaScript

1. **Reactive State Management**: Vue's reactivity eliminates manual DOM updates
2. **Component Reusability**: Each UI element is a self-contained component
3. **Cleaner Code**: Template syntax is more readable than innerHTML strings
4. **Better Performance**: Virtual DOM efficiently updates only what changed
5. **Type Safety**: Better IDE support and autocomplete
6. **Maintainability**: Separated concerns (template, logic, styles)

## Chrome Extension Considerations

- Components use Teleport to inject into page DOM
- All elements marked with `data-fnf-element="true"` to avoid conflicts
- Build system creates isolated bundles for each entry point
- Content script runs in isolated world but shares DOM with page
- CSP-compliant (no eval, no inline scripts in manifest v3)

## Troubleshooting

### Extension not loading
- Make sure you're loading the `dist/` directory, not the root
- Check that `npm run build` completed successfully

### Changes not showing
- Rebuild with `npm run build`
- Click the reload icon for the extension in Chrome
- Refresh the webpage where you're testing

### Vue DevTools
Vue DevTools won't work in content scripts by default due to Chrome's isolated worlds. Consider using console logging for debugging.
