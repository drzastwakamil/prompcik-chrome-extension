// Content script - Vue.js refactored version
import { createApp, ref } from 'vue';
import FactCheckBubble from '@/components/FactCheckBubble.vue';
import FactCheckSidePanel from '@/components/FactCheckSidePanel.vue';
import FloatingToolbar from '@/components/FloatingToolbar.vue';
import NotificationToast from '@/components/NotificationToast.vue';
import HoverHighlight from '@/components/HoverHighlight.vue';

console.log('Fake News Filter Extension loaded (Vue.js version)');

const FNF_BACKEND_ANALYSIS_ENABLED = true;

// Create a container for Vue apps
const getOrCreateContainer = (id) => {
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.dataset.fnfElement = 'true';
    document.body.appendChild(container);
  }
  return container;
};

// Utility functions
function isElementActuallyVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity || '1') === 0) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  if (rect.bottom < 0 || rect.top > (window.innerHeight || document.documentElement.clientHeight)) return false;
  return true;
}

function findClosestMatchingAncestor(startEl, selectors) {
  let el = startEl;
  while (el && el !== document.body && el !== document.documentElement) {
    for (const sel of selectors) {
      if (el.matches && el.matches(sel)) return el;
    }
    el = el.parentElement;
  }
  return null;
}

function getVisibleTextFromElement(root) {
  if (!root) return '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (!isElementActuallyVisible(parent)) return NodeFilter.FILTER_REJECT;
      const trimmed = node.nodeValue.replace(/\s+/g, ' ').trim();
      if (!trimmed) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const parts = [];
  while (walker.nextNode()) {
    parts.push(walker.currentNode.nodeValue.replace(/\s+/g, ' ').trim());
  }
  return parts.join(' ').replace(/\s{2,}/g, ' ').trim();
}

function extractTextFromKnownContainer(container) {
  if (!container) return '';
  const innerSelectors = [
    'div[data-testid="tweetText"]', 'div[lang]',
    'div[dir="auto"]',
    'h1, h2, h3', '.md', 'p',
    '.feed-shared-update-v2__description-wrapper', 'span.break-words',
    '#content-text',
  ];
  for (const sel of innerSelectors) {
    const candidates = Array.from(container.querySelectorAll(sel));
    const texts = candidates
      .filter(isElementActuallyVisible)
      .map(getVisibleTextFromElement)
      .filter(Boolean);
    const combined = texts.join(' ').replace(/\s{2,}/g, ' ').trim();
    if (combined.length >= 80) return combined;
  }
  return getVisibleTextFromElement(container);
}

function isExtensionElement(el) {
  if (!el) return false;
  
  let current = el;
  while (current && current !== document.body && current !== document.documentElement) {
    if (current.className && typeof current.className === 'string') {
      if (current.className.includes('extension-overlay') ||
          current.className.includes('fnf-') ||
          current.className.includes('fact-check-panel')) {
        return true;
      }
    }
    
    if (current.id && typeof current.id === 'string') {
      if (current.id.includes('fnf-') || 
          current.id.includes('extension-overlay') ||
          current.id === 'fnf-toolbar') {
        return true;
      }
    }
    
    if (current.dataset && current.dataset.fnfElement) {
      return true;
    }
    
    current = current.parentElement;
  }
  
  return false;
}

// Persistent highlight management
let persistentHighlight = null;

function createPersistentHighlight(element, color = '#3b82f6') {
  removePersistentHighlight();
  
  const box = document.createElement('div');
  box.className = 'fnf-fc-persistent-highlight';
  box.dataset.fnfElement = 'true';
  box.style.position = 'absolute';
  box.style.zIndex = '999997';
  box.style.pointerEvents = 'none';
  box.style.border = `3px solid ${color}`;
  box.style.borderRadius = '8px';
  box.style.background = `${color}15`;
  box.style.boxShadow = `0 0 0 4px ${color}20`;
  box.style.transition = 'border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease';
  
  const updatePosition = () => {
    if (!element || !element.isConnected) {
      removePersistentHighlight();
      return;
    }
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    box.style.top = (rect.top + scrollY - 3) + 'px';
    box.style.left = (rect.left + scrollX - 3) + 'px';
    box.style.width = (rect.width + 6) + 'px';
    box.style.height = (rect.height + 6) + 'px';
  };
  
  updatePosition();
  document.body.appendChild(box);
  persistentHighlight = box;
  
  return box;
}

function removePersistentHighlight() {
  if (persistentHighlight && persistentHighlight.parentNode) {
    try { persistentHighlight.remove(); } catch (_) {}
  }
  persistentHighlight = null;
}

function updatePersistentHighlightColor(color, borderWidth = '3px') {
  if (persistentHighlight) {
    persistentHighlight.style.borderColor = color;
    persistentHighlight.style.borderWidth = borderWidth;
    persistentHighlight.style.boxShadow = `0 0 0 4px ${color}20`;
  }
}

// Selection mode state
let selectionMode = {
  active: false,
  highlightApp: null,
  highlightContainer: null,
  targetElRef: null,
  prevCursor: '',
  hoverEl: null,
  scrollTimeout: null,
};

// Create Vue-based highlight box
function createHighlightBox() {
  const container = getOrCreateContainer('fnf-hover-highlight-container');
  
  // Create a reactive ref to hold the target element
  const targetElRef = ref(null);
  
  // Pass the ref to the component
  const app = createApp(HoverHighlight, {
    targetEl: targetElRef,
    visible: true,
    color: '#22c55e',
    borderWidth: 2
  });
  
  app.mount(container);
  
  return { app, container, targetElRef };
}

// Update target element for highlight (Vue component will reactively update position)
function updateHighlightBoxForElement(el) {
  if (!selectionMode.targetElRef) return;
  
  // Check if element should be highlighted
  if (!el || isExtensionElement(el) || el.tagName === 'IMG' || el.tagName === 'image' || 
      el.tagName === 'svg' || el.tagName === 'SVG' || el instanceof SVGElement) {
    // Clear the target element ref
    selectionMode.targetElRef.value = null;
    return;
  }
  
  // Update the ref - this will trigger VueUse's reactive tracking
  selectionMode.targetElRef.value = el;
}

function onMouseMove(e) {
  if (!selectionMode.active) return;
  const el = e.target;
  selectionMode.hoverEl = el;
  updateHighlightBoxForElement(el);
}

function onScroll(e) {
  if (!selectionMode.active) return;
  
  // VueUse's useElementBounding handles scroll automatically
  // Just update after a brief delay for performance
  if (selectionMode.scrollTimeout) {
    clearTimeout(selectionMode.scrollTimeout);
  }
  
  selectionMode.scrollTimeout = setTimeout(() => {
    if (selectionMode.active && selectionMode.hoverEl) {
      updateHighlightBoxForElement(selectionMode.hoverEl);
    }
  }, 100);
}

function onResize() {
  if (!selectionMode.active) return;
  
  // VueUse's useElementBounding handles window resize automatically
  // This is just a fallback to ensure immediate update
  if (selectionMode.hoverEl) {
    updateHighlightBoxForElement(selectionMode.hoverEl);
  }
}

function onKeyDown(e) {
  if (!selectionMode.active) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    stopFactCheckSelectionMode();
    removePersistentHighlight();
  }
}

// Show notification toast
function showNotification(message, type = 'warning') {
  const container = getOrCreateContainer('fnf-notification-container');
  const app = createApp(NotificationToast, {
    message,
    type,
    onClose: () => {
      app.unmount();
      if (container.parentNode) {
        container.remove();
      }
    }
  });
  
  app.mount(container);
}

// Click handler for fact-checking
async function onFactCheckClick(e) {
  if (!selectionMode.active) return;
  
  if (isExtensionElement(e.target)) {
    console.log('Clicked on extension UI - ignoring');
    return;
  }
  
  if (e.target.tagName === 'IMG' || e.target.tagName === 'image' || e.target.tagName === 'svg' || e.target.tagName === 'SVG' || e.target instanceof SVGElement) {
    console.log('Clicked on image/SVG - ignoring');
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  const target = e.target;
  
  // Stop selection mode using the proper function
  stopFactCheckSelectionMode();

  // Extract text from clicked element
  let container = target;
  try {
    const platformSelectors = [
      'article[data-testid="tweet"]', 'div[data-testid="tweet"]',
      'div[role="article"]', 'div[data-ad-preview] div[role="article"]',
      'div[data-testid="post-container"]', '.Post', 'shreddit-post',
      'div.feed-shared-update-v2', 'div.feed-shared-inline-show-more-text',
      'ytd-comment-thread-renderer', 'article', '[role="article"]'
    ];
    const maybe = findClosestMatchingAncestor(target, platformSelectors);
    if (maybe) container = maybe;
  } catch (_) {}
  
  const text = (extractTextFromKnownContainer(container) || getVisibleTextFromElement(container) || '').trim();
  
  if (!text || text.length === 0) {
    console.log('No text found in element - cannot fact-check');
    showNotification('⚠️ Cannot fact-check: No text found in element', 'warning');
    return;
  }
  
  console.log('Fact-checking clicked element:', target);
  console.log('Container element used for extraction:', container);
  console.log('Extracted text (sent to backend):', text);

  // Create persistent highlight
  createPersistentHighlight(container, '#3b82f6');
  
  // Create bubble
  try {
    const anchorRect = container.getBoundingClientRect();
    const bubbleContainer = getOrCreateContainer('fnf-bubble-container');
    
    const app = createApp(FactCheckBubble, {
      anchorRect: {
        left: anchorRect.left,
        top: anchorRect.top,
        right: anchorRect.right,
        bottom: anchorRect.bottom,
        width: anchorRect.width,
        height: anchorRect.height
      },
      text: text,
      onClose: () => {
        removePersistentHighlight();
        app.unmount();
        if (bubbleContainer.parentNode) {
          bubbleContainer.remove();
        }
      },
      onLearnMore: ({ result, text }) => {
        // Close bubble and show side panel
        app.unmount();
        if (bubbleContainer.parentNode) {
          bubbleContainer.remove();
        }
        showFactCheckSidePanel(result, text);
      }
    });
    
    const instance = app.mount(bubbleContainer);
    
    // Start loading
    instance.setState_Loading('Fact checking…');
    
    // Call background for analysis
    try {
      console.log('Sending fact-check request to background...');
      const response = await chrome.runtime.sendMessage({ 
        action: 'analyzeText', 
        text, 
        url: window.location.href, 
        source: 'selection-click' 
      });
      console.log('Fact-check response from background:', response);
      
      if (response && response.success) {
        const result = response.result || {};
        console.log('Backend result:', result);
        
        // Update highlight color
        const isFakeNews = result.flagged === true;
        const highlightColor = isFakeNews ? '#dc2626' : '#6b7280';
        updatePersistentHighlightColor(highlightColor);
        
        instance.setState_Result(result, text);
      } else {
        console.error('Fact-check failed:', response);
        updatePersistentHighlightColor('#6b7280');
        instance.setState_Error(`Fact-check failed: ${response?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Fact-check exception:', err);
      updatePersistentHighlightColor('#6b7280');
      instance.setState_Error(`Fact-check error: ${String(err?.message || err)}`);
    }
  } catch (errOuter) {
    console.error('Fact-check selection error', errOuter);
    removePersistentHighlight();
  }
}

function startFactCheckSelectionMode() {
  try { stopFactCheckSelectionMode(); } catch (_) {}
  selectionMode.active = true;
  selectionMode.prevCursor = document.body.style.cursor;
  try { document.body.style.cursor = 'crosshair'; } catch (_) {}
  
  // Create Vue-based highlight box
  const { app, container, targetElRef } = createHighlightBox();
  selectionMode.highlightApp = app;
  selectionMode.highlightContainer = container;
  selectionMode.targetElRef = targetElRef;
  
  window.addEventListener('mousemove', onMouseMove, { capture: true, passive: true });
  window.addEventListener('click', onFactCheckClick, { capture: true, once: false });
  window.addEventListener('keydown', onKeyDown, { capture: true });
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', onResize, { passive: true });
}

function stopFactCheckSelectionMode() {
  if (!selectionMode.active) return;
  selectionMode.active = false;
  window.removeEventListener('mousemove', onMouseMove, { capture: true });
  window.removeEventListener('click', onFactCheckClick, { capture: true });
  window.removeEventListener('keydown', onKeyDown, { capture: true });
  window.removeEventListener('scroll', onScroll, { capture: true });
  window.removeEventListener('resize', onResize);
  try { document.body.style.cursor = selectionMode.prevCursor || ''; } catch (_) {}
  
  // Clean up Vue highlight box
  if (selectionMode.highlightApp) {
    try {
      selectionMode.highlightApp.unmount();
    } catch (e) {
      console.warn('Error unmounting highlight app:', e);
    }
  }
  if (selectionMode.highlightContainer && selectionMode.highlightContainer.parentNode) {
    try {
      selectionMode.highlightContainer.remove();
    } catch (e) {
      console.warn('Error removing highlight container:', e);
    }
  }
  
  selectionMode.highlightApp = null;
  selectionMode.highlightContainer = null;
  selectionMode.targetElRef = null;
  selectionMode.hoverEl = null;
  
  if (selectionMode.scrollTimeout) {
    clearTimeout(selectionMode.scrollTimeout);
    selectionMode.scrollTimeout = null;
  }
}

// Side panel management
let sidePanelApp = null;

function showFactCheckSidePanel(result, text, mode = 'text') {
  console.log('[showFactCheckSidePanel] Called with:', { result, text, mode });
  
  // Remove existing panel
  hideFactCheckSidePanel();
  
  const container = getOrCreateContainer('fnf-side-panel-container');
  console.log('[showFactCheckSidePanel] Container created:', container);
  
  sidePanelApp = createApp(FactCheckSidePanel, {
    visible: true,
    result,
    text,
    mode,
    onClose: () => {
      hideFactCheckSidePanel();
    }
  });
  
  sidePanelApp.mount(container);
  console.log('[showFactCheckSidePanel] App mounted successfully');
}

function hideFactCheckSidePanel() {
  if (sidePanelApp) {
    sidePanelApp.unmount();
    sidePanelApp = null;
    
    const container = document.getElementById('fnf-side-panel-container');
    if (container && container.parentNode) {
      container.remove();
    }
  }
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
        console.log('[URL Monitor] Warning detected, showing sidebar');
        showFactCheckSidePanel(result, url, 'url');
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

// Initialize floating toolbar
function initFloatingToolbar() {
  if (!document || !document.body) return;
  
  const container = getOrCreateContainer('fnf-toolbar-container');
  
  const app = createApp(FloatingToolbar, {
    onFactCheck: () => {
      startFactCheckSelectionMode();
    }
  });
  
  app.mount(container);
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startFactCheckSelection') {
    try {
      startFactCheckSelectionMode();
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
    initFloatingToolbar();
    startURLMonitoring();
  });
} else {
  initFloatingToolbar();
  startURLMonitoring();
}
