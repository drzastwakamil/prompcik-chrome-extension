// Content script - Vue.js refactored version
import { createApp } from 'vue';
import App from '@/App.vue';

console.log('Fake News Filter Extension loaded (Vue.js version)');

// Single app instance management
let appInstance = null;
let appContainer = null;
let appComponentInstance = null;

// Mount the main app
function mountApp() {
  // If already mounted, just log and return
  if (appInstance) {
    console.log('[App] Already mounted, skipping');
    return;
  }
  
  // Create container
  appContainer = document.createElement('div');
  appContainer.id = 'fnf-app-root';
  appContainer.dataset.fnfElement = 'true';
  document.body.appendChild(appContainer);
  
  // Create and mount app with unmount handler
  appInstance = createApp(App, {
    onUnmount: () => {
      performUnmount();
    }
  });
  appComponentInstance = appInstance.mount(appContainer);
  
  console.log('[App] Mounted successfully');
}

// Unmount the main app (internal function to avoid circular calls)
function performUnmount() {
  if (!appInstance) {
    console.log('[App] Not mounted');
    return;
  }
  
  try {
    appInstance.unmount();
  } catch (e) {
    console.warn('Error unmounting app:', e);
  }
  
  if (appContainer && appContainer.parentNode) {
    appContainer.remove();
  }
  
  appInstance = null;
  appContainer = null;
  appComponentInstance = null;
  
  console.log('[App] Unmounted');
}

// URL monitoring for automatic checks
let currentCheckedURL = '';
let urlCheckTimeout = null;

async function checkCurrentURL() {
  const url = window.location.href;
  
  // Don't check the same URL twice
  if (url === currentCheckedURL) {
    return;
  }
  
  console.log('[URL Monitor] Checking URL:', url);
  currentCheckedURL = url;
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'checkURL', 
      url 
    });
    
    console.log('[URL Monitor] Response:', response);
    
    if (response && response.success && response.result) {
      const result = response.result;
      
      // Show sidebar if warning is true (URL has high similarity)
      if (result.warning === true) {
        console.log('[URL Monitor] Warning detected, mounting app and showing sidebar');
        
        // Mount app if not already mounted
        if (!appInstance) {
          mountApp();
        }
        
        // Show sidebar through the app
        if (appComponentInstance && appComponentInstance.showSidePanel) {
          appComponentInstance.showSidePanel(result, url, 'url');
        }
      } else {
        console.log('[URL Monitor] No warning, URL is safe');
      }
    }
  } catch (error) {
    console.error('[URL Monitor] Error checking URL:', error);
  }
}

function startURLMonitoring() {
  // Check on initial load
  setTimeout(() => checkCurrentURL(), 1000);
  
  // Monitor URL changes (for SPAs)
  let lastURL = window.location.href;
  
  const urlObserver = new MutationObserver(() => {
    const currentURL = window.location.href;
    if (currentURL !== lastURL) {
      lastURL = currentURL;
      
      // Debounce URL checks
      if (urlCheckTimeout) {
        clearTimeout(urlCheckTimeout);
      }
      
      urlCheckTimeout = setTimeout(() => {
        checkCurrentURL();
      }, 500);
    }
  });
  
  // Observe changes in the document (for SPA navigation)
  urlObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also listen to popstate for back/forward navigation
  window.addEventListener('popstate', () => {
    if (urlCheckTimeout) {
      clearTimeout(urlCheckTimeout);
    }
    urlCheckTimeout = setTimeout(() => {
      checkCurrentURL();
    }, 500);
  });
  
  console.log('[URL Monitor] Started monitoring');
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showToolbar') {
    try {
      mountApp();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return false;
  }
  return false;
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only start URL monitoring, toolbar will be shown when user clicks extension icon
    startURLMonitoring();
  });
} else {
  // Only start URL monitoring, toolbar will be shown when user clicks extension icon
  startURLMonitoring();
}
