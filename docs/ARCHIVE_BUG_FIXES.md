# Historical Bug Fixes Archive

This file contains documentation of bugs that were fixed during the refactoring process.
These are kept for historical reference.

---

## Bug Fix: Flagged Results Not Showing as Fake News

### 🐛 The Bug

When the backend returned:
```json
{
  "flagged": true,
  "confidence": 0.65,
  "reasoning": "The post exactly matches an item in the database..."
}
```

The bubble was showing **"ℹ️ Not in Database"** (gray) instead of **"⚠️ Fake News Alert!"** (red).

### 🔍 Root Cause

The `FactCheckBubble.vue` component had a **reactivity issue**:

Props were not being updated - the component was using props that never changed value.

### ✅ The Fix

**Moved `result` from props to data** so it can be updated reactively:

```javascript
// FactCheckBubble.vue (FIXED)
data() {
  return {
    result: null,           // ← Now in data (reactive)
    analyzedText: ''
  };
},
methods: {
  setState_Result(result, text) {
    this.result = result;          // ← Updates component data
    this.analyzedText = text;
    this.$emit('update:result', result);
  }
}
```

**Status:** ✅ Fixed (October 2024)

---

## Build Configuration Fix

### Issue
Content scripts in Chrome extensions cannot use ES module imports directly. The error was:
```
Uncaught SyntaxError: Cannot use import statement outside a module
```

### Solution
We now use **two separate Vite configurations** to build different parts of the extension:

1. **Content Script (vite.config.js)** - IIFE format (all imports bundled)
2. **Popup & Background (vite.config.popup.js)** - ES modules with code splitting

### Key Changes

#### Before (Broken)
- Single Vite config
- All files built as ES modules
- Content script had `import` statements
- ❌ Chrome rejected content script

#### After (Working)
- Two Vite configs
- Content script built as IIFE (self-contained)
- Popup/background as ES modules
- ✅ Chrome loads successfully

**Status:** ✅ Fixed (October 2024)
