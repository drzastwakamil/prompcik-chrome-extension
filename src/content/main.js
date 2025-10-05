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
  
  console.log('[App] Mounted successfully', {
    hasComponentInstance: !!appComponentInstance,
    hasShowSidePanel: !!(appComponentInstance && appComponentInstance.showSidePanel),
    exposedMethods: appComponentInstance ? Object.keys(appComponentInstance).filter(k => typeof appComponentInstance[k] === 'function') : []
  });
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
  
  // Clean up all CSS classes that might be left behind
  document.body.classList.remove('fnf-selection-mode-active');
  
  appInstance = null;
  appContainer = null;
  appComponentInstance = null;
  
  console.log('[App] Unmounted and CSS classes cleaned');
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
  
  console.log('[URL Monitor] URL changed, remounting app:', url);
  currentCheckedURL = url;
  
  // Always clean up CSS classes first
  document.body.classList.remove('fnf-selection-mode-active');
  
  // Always remount app on URL change to refresh state
  if (appInstance) {
    console.log('[URL Monitor] Unmounting existing app');
    performUnmount();
  }
  
  // Mount fresh app instance
  console.log('[URL Monitor] Mounting fresh app');
  mountApp();
  
  // Wait for app to be ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'checkURL', 
      url 
    });
    
    console.log('[URL Monitor] Response:', response);
    
    if (response && response.success && response.result) {
      const result = response.result;
      
      // Show sidebar if URL is flagged as fake or has high similarity
      const shouldWarn = result.status === 'fake' || result.warning === true || result.similarity >= 0.8;
      
      if (shouldWarn) {
        console.log('[URL Monitor] Warning detected, showing sidebar', { result });
        
        // Show sidebar through the app
        console.log('[URL Monitor] Checking appComponentInstance:', {
          exists: !!appComponentInstance,
          hasMethod: !!(appComponentInstance && appComponentInstance.showSidePanel),
          type: typeof appComponentInstance
        });
        
        if (appComponentInstance && appComponentInstance.showSidePanel) {
          console.log('[URL Monitor] Calling showSidePanel with:', { result, url, mode: 'url' });
          appComponentInstance.showSidePanel(result, url, 'url');
        } else {
          console.error('[URL Monitor] Cannot show side panel - method not available');
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

// Function to manually remount app (useful for debugging or manual refresh)
function remountApp() {
  console.log('[Manual] Remounting app');
  
  // Clean up CSS classes first
  document.body.classList.remove('fnf-selection-mode-active');
  
  if (appInstance) {
    performUnmount();
  }
  mountApp();
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
  
  if (request.action === 'remountApp') {
    try {
      remountApp();
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
