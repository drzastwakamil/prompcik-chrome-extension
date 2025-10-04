// Content script - runs on every webpage
console.log('Fake News Filter Extension loaded');
// Feature flags
// - Backend analysis is now enabled
const FNF_BACKEND_ANALYSIS_ENABLED = true;

// Function to create and add an overlay element
function addOverlayElement(config = {}) {
  const {
    text = 'Extension Overlay',
    top = '20px',
    right = '20px',
    left,
    backgroundColor = 'rgba(59, 130, 246, 0.95)',
    color = '#ffffff',
    id = 'extension-overlay-' + Date.now()
  } = config;

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'extension-overlay';
  overlay.dataset.fnfElement = 'true';
  
  // Apply styles
  overlay.style.position = 'fixed';
  overlay.style.top = top;
  overlay.style.right = right;
  if (left !== undefined) {
    overlay.style.left = typeof left === 'number' ? left + 'px' : left;
    overlay.style.right = 'auto';
  }
  overlay.style.backgroundColor = backgroundColor;
  overlay.style.color = color;
  overlay.style.padding = '15px 20px';
  overlay.style.borderRadius = '8px';
  overlay.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  overlay.style.zIndex = '999999';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.cursor = 'move';
  overlay.style.userSelect = 'none';
  
  // Add content
  overlay.innerHTML = `
    <div data-fnf-element="true" style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
      <span data-fnf-element="true">${text}</span>
      <button data-fnf-element="true" class="close-overlay" style="
        background: transparent;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
      ">×</button>
    </div>
  `;
  
  // Add close functionality
  const closeBtn = overlay.querySelector('.close-overlay');
  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });
  
  // Make it draggable
  makeDraggable(overlay);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Mark all children as extension elements
  markAllChildrenAsExtensionElements(overlay);
  
  return overlay;
}

// Function to make element draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  element.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    element.style.right = 'auto';
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}


// --- Post extraction and analysis helpers ---
function isElementActuallyVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity || '1') === 0) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  if (rect.bottom < 0 || rect.top > (window.innerHeight || document.documentElement.clientHeight)) return false;
  return true;
}

// (removed) getCenterElement — no longer used

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


// (removed) getLargestVisibleArticleCandidate — auto post detection removed

// (removed) findLikelyPostContainer — auto post detection removed

function extractTextFromKnownContainer(container) {
  if (!container) return '';
  // Platform-specific inner text selectors to prioritize
  const innerSelectors = [
    // X / Twitter
    'div[data-testid="tweetText"]', 'div[lang]',
    // Facebook
    'div[dir="auto"]',
    // Reddit
    'h1, h2, h3', '.md', 'p',
    // LinkedIn
    '.feed-shared-update-v2__description-wrapper', 'span.break-words',
    // YouTube comments
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

// (removed) extractLikelyPostText — auto post detection removed

// (removed) analyzeCurrentVisiblePost — auto post detection removed

function showAnalysisOverlay(result, analyzedText) {
  const label = result?.label || result?.classification || 'Analysis Result';
  const confidence = typeof result?.confidence === 'number' ? (result.confidence * 100).toFixed(1) + '%' : (result?.score ? (Math.round(result.score * 1000) / 10) + '%' : undefined);
  const summary = result?.summary || result?.explanation || '';
  const titleLine = confidence ? `${label} (${confidence})` : label;
  const preview = (analyzedText || '').slice(0, 160) + ((analyzedText || '').length > 160 ? '…' : '');

  const contentHtml = `
    <div>
      <strong>🛡️ ${titleLine}</strong><br>
      ${summary ? `<div style="margin-top:6px; font-size:12px; line-height:1.4;">${summary}</div>` : ''}
      <div style="margin-top:8px; font-size:11px; opacity:0.85;">Snippet: ${preview}</div>
      ${!summary ? `<pre style="margin-top:8px; font-size:11px; white-space:pre-wrap;">${JSON.stringify(result, null, 2)}</pre>` : ''}
    </div>
  `;

  addOverlayElement({
    text: contentHtml,
    top: '60px',
    right: '20px',
    backgroundColor: 'rgba(30, 64, 175, 0.95)'
  });
}

// ------------------------------
// Helper function to mark all descendants as extension elements
// ------------------------------
function markAllChildrenAsExtensionElements(rootElement) {
  if (!rootElement) return;
  
  // Mark the root if it doesn't have the attribute
  if (!rootElement.dataset.fnfElement) {
    rootElement.dataset.fnfElement = 'true';
  }
  
  // Mark all descendants
  const allElements = rootElement.querySelectorAll('*');
  allElements.forEach(el => {
    el.dataset.fnfElement = 'true';
  });
}

// ------------------------------
// Helper function to check if element is part of extension UI
// ------------------------------
function isExtensionElement(el) {
  if (!el) return false;
  
  // Check the element itself and all ancestors
  let current = el;
  while (current && current !== document.body && current !== document.documentElement) {
    // Check by class name
    if (current.className && typeof current.className === 'string') {
      if (current.className.includes('extension-overlay') ||
          current.className.includes('fnf-') ||
          current.className.includes('fact-check-panel')) {
        return true;
      }
    }
    
    // Check by ID
    if (current.id && typeof current.id === 'string') {
      if (current.id.includes('fnf-') || 
          current.id.includes('extension-overlay') ||
          current.id === 'fnf-toolbar') {
        return true;
      }
    }
    
    // Check by data attribute
    if (current.dataset && current.dataset.fnfElement) {
      return true;
    }
    
    current = current.parentElement;
  }
  
  return false;
}

// ------------------------------
// Fact-check selection mode
// ------------------------------
let __fcSelection = {
  active: false,
  highlightBox: null,
  prevCursor: '',
  hoverEl: null,
  persistentHighlight: null, // Highlight for element being fact-checked
  scrollTimeout: null,
};


function startFactCheckSelectionMode() {
  try { stopFactCheckSelectionMode(); } catch (_) {}
  __fcSelection.active = true;
  __fcSelection.prevCursor = document.body.style.cursor;
  try { document.body.style.cursor = 'crosshair'; } catch (_) {}
  __fcSelection.highlightBox = createHighlightBox();
  window.addEventListener('mousemove', onFcMouseMove, { capture: true, passive: true });
  window.addEventListener('click', onFcClick, { capture: true, once: false });
  window.addEventListener('keydown', onFcKeyDown, { capture: true });
  window.addEventListener('scroll', onFcScroll, { capture: true, passive: true });
}

function stopFactCheckSelectionMode() {
  if (!__fcSelection.active) return;
  __fcSelection.active = false;
  window.removeEventListener('mousemove', onFcMouseMove, { capture: true });
  window.removeEventListener('click', onFcClick, { capture: true });
  window.removeEventListener('keydown', onFcKeyDown, { capture: true });
  window.removeEventListener('scroll', onFcScroll, { capture: true });
  try { document.body.style.cursor = __fcSelection.prevCursor || ''; } catch (_) {}
  if (__fcSelection.highlightBox && __fcSelection.highlightBox.parentNode) {
    try { __fcSelection.highlightBox.remove(); } catch (_) {}
  }
  __fcSelection.highlightBox = null;
  __fcSelection.hoverEl = null;
  if (__fcSelection.scrollTimeout) {
    clearTimeout(__fcSelection.scrollTimeout);
    __fcSelection.scrollTimeout = null;
  }
}

function removePersistentHighlight() {
  if (__fcSelection.persistentHighlight && __fcSelection.persistentHighlight.parentNode) {
    try { __fcSelection.persistentHighlight.remove(); } catch (_) {}
  }
  __fcSelection.persistentHighlight = null;
}

function updatePersistentHighlightColor(color, borderWidth = '3px') {
  if (__fcSelection.persistentHighlight) {
    __fcSelection.persistentHighlight.style.borderColor = color;
    __fcSelection.persistentHighlight.style.borderWidth = borderWidth;
    __fcSelection.persistentHighlight.style.boxShadow = `0 0 0 4px ${color}20`;
  }
}

function createHighlightBox() {
  const box = document.createElement('div');
  box.className = 'fnf-fc-highlight-box';
  box.dataset.fnfElement = 'true';
  box.style.position = 'fixed';
  box.style.zIndex = '999998';
  box.style.pointerEvents = 'none';
  box.style.border = '2px solid #22c55e';
  box.style.borderRadius = '6px';
  box.style.background = 'rgba(34, 197, 94, 0.08)';
  box.style.top = '0px';
  box.style.left = '0px';
  box.style.width = '0px';
  box.style.height = '0px';
  document.body.appendChild(box);
  return box;
}

function updateHighlightBoxForElement(el) {
  if (!__fcSelection.highlightBox) return;
  // Don't highlight extension UI elements
  if (!el || isExtensionElement(el)) {
    __fcSelection.highlightBox.style.width = '0px';
    __fcSelection.highlightBox.style.height = '0px';
    return;
  }
  const rect = el.getBoundingClientRect();
  __fcSelection.highlightBox.style.top = Math.max(0, rect.top - 2) + 'px';
  __fcSelection.highlightBox.style.left = Math.max(0, rect.left - 2) + 'px';
  __fcSelection.highlightBox.style.width = Math.max(0, rect.width + 4) + 'px';
  __fcSelection.highlightBox.style.height = Math.max(0, rect.height + 4) + 'px';
}

function onFcMouseMove(e) {
  if (!__fcSelection.active) return;
  const el = e.target;
  __fcSelection.hoverEl = el;
  updateHighlightBoxForElement(el);
}

function onFcScroll(e) {
  if (!__fcSelection.active) return;
  
  // Hide highlight immediately when scrolling
  if (__fcSelection.highlightBox) {
    __fcSelection.highlightBox.style.width = '0px';
    __fcSelection.highlightBox.style.height = '0px';
  }
  
  // Clear any pending timeout
  if (__fcSelection.scrollTimeout) {
    clearTimeout(__fcSelection.scrollTimeout);
  }
  
  // After scroll stops, update highlight if still hovering
  __fcSelection.scrollTimeout = setTimeout(() => {
    if (__fcSelection.active && __fcSelection.hoverEl) {
      updateHighlightBoxForElement(__fcSelection.hoverEl);
    }
  }, 150);
}

function onFcKeyDown(e) {
  if (!__fcSelection.active) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    stopFactCheckSelectionMode();
    removePersistentHighlight();
  }
}

function createPersistentHighlight(element, color = '#3b82f6') {
  // Remove any existing persistent highlight
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
  
  // Position relative to element
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
  __fcSelection.persistentHighlight = box;
  
  return box;
}

async function onFcClick(e) {
  if (!__fcSelection.active) return;
  
  // Don't fact-check extension UI elements
  if (isExtensionElement(e.target)) {
    console.log('Clicked on extension UI - ignoring');
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  const target = e.target;
  
  // Stop selection mode but don't remove hover highlight yet
  __fcSelection.active = false;
  window.removeEventListener('mousemove', onFcMouseMove, { capture: true });
  window.removeEventListener('click', onFcClick, { capture: true });
  window.removeEventListener('keydown', onFcKeyDown, { capture: true });
  window.removeEventListener('scroll', onFcScroll, { capture: true });
  try { document.body.style.cursor = __fcSelection.prevCursor || ''; } catch (_) {}
  
  // Remove the hover highlight box
  if (__fcSelection.highlightBox && __fcSelection.highlightBox.parentNode) {
    try { __fcSelection.highlightBox.remove(); } catch (_) {}
  }
  __fcSelection.highlightBox = null;

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
  
  // Log the fact-checked HTML element and extracted text that will be sent to backend
  console.log('Fact-checking clicked element:', target);
  console.log('Container element used for extraction:', container);
  console.log('Extracted text (sent to backend):', text);
  console.log('Container HTML:', container.outerHTML);

  // Create persistent highlight for the element being fact-checked (blue for loading state)
  createPersistentHighlight(container, '#3b82f6');
  
  // Create bubble and start in loading state
  try {
    const bubble = createBubble(container);
    if (!bubble) {
      console.error('Failed to create bubble');
      removePersistentHighlight();
      return;
    }
    
    // Set initial loading state
    bubble.setState_Loading('Fact checking…');
    
    // Setup close button to also remove persistent highlight
    bubble.onClose(() => {
      removePersistentHighlight();
    });

    // Call background for analysis
    try {
      console.log('Sending fact-check request to background...');
      const response = await chrome.runtime.sendMessage({ action: 'analyzeText', text, url: window.location.href, source: 'selection-click' });
      console.log('Fact-check response from background:', response);
      
      // Check if the request was cancelled while waiting for response
      if (bubble.isCancelled()) {
        console.log('Fact-check was cancelled by user');
        return;
      }
      
      if (response && response.success) {
        // Transition to result state (updates the same bubble)
        const result = response.result || {};
        console.log('Backend result:', result);
        
        // Update highlight color based on result
        const isFakeNews = result.flagged === true;
        const highlightColor = isFakeNews ? '#dc2626' : '#6b7280'; // Red for fake, gray for not found
        updatePersistentHighlightColor(highlightColor);
        
        bubble.setState_Result(result, text);
      } else {
        console.error('Fact-check failed:', response);
        // Keep gray highlight for errors
        updatePersistentHighlightColor('#6b7280');
        bubble.setState_Error(`Fact-check failed: ${response?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Fact-check exception:', err);
      
      // Check if the error was due to cancellation
      if (bubble.isCancelled()) {
        console.log('Fact-check was cancelled by user');
        return;
      }
      
      // Keep gray highlight for errors
      updatePersistentHighlightColor('#6b7280');
      bubble.setState_Error(`Fact-check error: ${String(err?.message || err)}`);
    }
  } catch (errOuter) {
    console.error('Fact-check selection error', errOuter);
    removePersistentHighlight();
  }
}

// ------------------------------
// Bubble Manager - Standardized bubble creation and state management
// ------------------------------
function createBubble(anchorElOrRect, options = {}) {
  // Support both element and rect as anchor
  let anchorRect;
  if (anchorElOrRect instanceof Element) {
    if (!anchorElOrRect.appendChild) return null;
    anchorRect = anchorElOrRect.getBoundingClientRect();
  } else if (anchorElOrRect && typeof anchorElOrRect === 'object') {
    // It's a rect object (from text selection)
    anchorRect = anchorElOrRect;
  } else {
    return null;
  }
  
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  // Create container for overlay + tail
  const container = document.createElement('div');
  container.className = 'fnf-attached-overlay-container';
  container.dataset.fnfElement = 'true';
  container.style.position = 'absolute';
  container.style.zIndex = '99999';
  container.style.pointerEvents = 'none';
  
  // Calculate position: bottom center of the anchor element
  const overlayWidth = 480;
  const tailHeight = 16;
  const gap = tailHeight + 16; // Gap = tail height + 16px padding = 32px total
  
  // Position container at bottom center of anchor element
  const centerX = anchorRect.left + scrollX + (anchorRect.width / 2);
  const bottomY = anchorRect.bottom + scrollY + gap;
  
  container.style.left = (centerX - overlayWidth / 2) + 'px';
  container.style.top = bottomY + 'px';
  container.style.width = overlayWidth + 'px';
  
  // Ensure it doesn't go off screen horizontally
  const viewportWidth = window.innerWidth;
  const containerLeft = parseFloat(container.style.left);
  const margin = 10;
  
  if (containerLeft < margin) {
    container.style.left = margin + 'px';
  } else if (containerLeft + overlayWidth > viewportWidth - margin) {
    container.style.left = (viewportWidth - overlayWidth - margin) + 'px';
  }
  
  // Create the tail (triangle pointing up)
  const tail = document.createElement('div');
  tail.className = 'fnf-overlay-tail';
  tail.dataset.fnfElement = 'true';
  tail.style.position = 'absolute';
  tail.style.top = '0px';
  tail.style.left = '50%';
  tail.style.transform = 'translateX(-50%) translateY(-100%)';
  tail.style.width = '0';
  tail.style.height = '0';
  tail.style.borderLeft = tailHeight + 'px solid transparent';
  tail.style.borderRight = tailHeight + 'px solid transparent';
  tail.style.borderBottom = tailHeight + 'px solid #6366f1';
  tail.style.filter = 'drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.15))';
  tail.style.transition = 'border-bottom-color 0.3s ease';
  
  // Create the overlay bubble
  const overlay = document.createElement('div');
  overlay.className = 'fnf-attached-overlay';
  overlay.dataset.fnfElement = 'true';
  overlay.style.position = 'relative';
  overlay.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
  overlay.style.color = '#ffffff';
  overlay.style.padding = '20px 22px';
  overlay.style.borderRadius = '16px';
  overlay.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.25)';
  overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.width = '100%';
  overlay.style.boxSizing = 'border-box';
  overlay.style.pointerEvents = 'auto';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.transition = 'background 0.3s ease';
  
  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'fnf-bubble-content-wrapper';
  contentWrapper.dataset.fnfElement = 'true';
  contentWrapper.style.display = 'flex';
  contentWrapper.style.alignItems = 'flex-start';
  contentWrapper.style.gap = '8px';
  contentWrapper.style.transition = 'opacity 0.2s ease';
  
  // Create content container
  const content = document.createElement('div');
  content.className = 'fnf-bubble-content';
  content.dataset.fnfElement = 'true';
  content.style.flex = '1';
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-overlay';
  closeBtn.dataset.fnfElement = 'true';
  closeBtn.innerHTML = '×';
  closeBtn.style.background = 'rgba(255,255,255,0.2)';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#fff';
  closeBtn.style.fontSize = '18px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.lineHeight = '1';
  closeBtn.style.flexShrink = '0';
  closeBtn.style.width = '26px';
  closeBtn.style.height = '26px';
  closeBtn.style.borderRadius = '5px';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.transition = 'background 0.2s';
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(255,255,255,0.3)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(255,255,255,0.2)';
  });
  
  // Assemble the bubble
  contentWrapper.appendChild(content);
  contentWrapper.appendChild(closeBtn);
  overlay.appendChild(contentWrapper);
  container.appendChild(tail);
  container.appendChild(overlay);
  
  // Append to body
  document.body.appendChild(container);
  
  // Mark all children as extension elements
  markAllChildrenAsExtensionElements(container);
  
  // Cancellation flag
  let cancelled = false;
  
  // Helper function to extract first color from gradient
  function extractColorFromGradient(backgroundColor) {
    let color = '#6366f1';
    if (backgroundColor && typeof backgroundColor === 'string') {
      if (backgroundColor.includes('gradient')) {
        const colorMatch = backgroundColor.match(/(?:deg,\s*|^gradient\([^,]*,\s*)(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\))/);
        if (colorMatch && colorMatch[1]) {
          color = colorMatch[1];
        } else {
          const anyColorMatch = backgroundColor.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/);
          if (anyColorMatch) color = anyColorMatch[0];
        }
      } else {
        color = backgroundColor;
      }
    }
    return color;
  }
  
  // Return bubble controller object with methods to update state
  return {
    // Update the bubble's content
    setContent(html) {
      // Don't update if cancelled
      if (cancelled) return;
      content.innerHTML = html;
      markAllChildrenAsExtensionElements(content);
    },
    
    // Update the bubble's background and tail color
    setStyle(backgroundColor) {
      // Don't update if cancelled
      if (cancelled) return;
      overlay.style.background = backgroundColor;
      const tailColor = extractColorFromGradient(backgroundColor);
      tail.style.borderBottomColor = tailColor;
    },
    
    // Transition to loading state
    setState_Loading(message = 'Fact checking…') {
      const loadingHtml = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:20px; height:20px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
          <span style="font-weight:600;">${message}</span>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      `;
      this.setContent(loadingHtml);
      this.setStyle('linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)');
    },
    
    // Transition to result state (fake news or not in database)
    setState_Result(result, text) {
      // Don't update if cancelled
      if (cancelled) return;
      
      const isFakeNews = result.flagged === true;
      const percentage = result.similarity ? Math.round(result.similarity * 100) : 0;
      const label = isFakeNews ? '⚠️ Fake News Alert!' : 'ℹ️ Not in Database';
      const summary = isFakeNews 
        ? `This content has been flagged as fake news (${percentage}% similarity).` 
        : 'This content is not in our fact-checking database.';
      const backgroundColor = isFakeNews ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      const iconBg = isFakeNews ? 'rgba(254, 226, 226, 0.2)' : 'rgba(229, 231, 235, 0.2)';
      const preview = (text || '').slice(0, 160) + ((text || '').length > 160 ? '…' : '');
      
      const html = `
        <div data-fnf-element="true" style="display:flex; align-items:flex-start; gap:16px;">
          <div data-fnf-element="true" style="
            min-width:48px;
            width:48px;
            height:48px;
            border-radius:12px;
            background:${iconBg};
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:26px;
            flex-shrink:0;
          ">${isFakeNews ? '⚠️' : 'ℹ️'}</div>
          <div data-fnf-element="true" style="flex:1; min-width:0;">
            <strong data-fnf-element="true" style="font-size:17px; font-weight:700; display:block; margin-bottom:10px; line-height:1.2;">${label}</strong>
            <div data-fnf-element="true" style="font-size:14px; line-height:1.6; margin-bottom:14px; opacity:0.95;">${summary}</div>
            <div data-fnf-element="true" style="
              background:rgba(0,0,0,0.15);
              padding:12px 14px;
              border-radius:8px;
              font-size:13px;
              line-height:1.5;
              font-style:italic;
              opacity:0.9;
              border-left:3px solid rgba(255,255,255,0.3);
              margin-bottom:14px;
            ">"${preview}"</div>
            <button data-fnf-element="true" class="fnf-element-learn-more-btn" style="
              background:rgba(255,255,255,0.95);
              border:none;
              color:${isFakeNews ? '#dc2626' : '#1e40af'};
              padding:11px 18px;
              border-radius:10px;
              font-size:14px;
              font-weight:700;
              cursor:pointer;
              width:100%;
              transition: all 0.2s;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 10px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.15)'">
              Learn More →
            </button>
          </div>
        </div>
      `;
      
      this.setContent(html);
      this.setStyle(backgroundColor);
      
      // Re-attach learn more button listener after content update
      const learnMoreBtn = content.querySelector('.fnf-element-learn-more-btn');
      if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.remove();
          showFactCheckSidePanel(result, text);
        });
      }
    },
    
    // Transition to error state
    setState_Error(errorMessage) {
      // Don't update if cancelled
      if (cancelled) return;
      
      const html = `❌ ${errorMessage}`;
      this.setContent(html);
      this.setStyle('linear-gradient(135deg, #ef4444 0%, #dc2626 100%)');
    },
    
    // Remove the bubble
    remove() {
      try { 
        container.remove(); 
      } catch (_) {}
    },
    
    // Cancel the operation
    cancel() {
      cancelled = true;
      this.remove();
    },
    
    // Check if cancelled
    isCancelled() {
      return cancelled;
    },
    
    // Add close button listener
    onClose(callback) {
      closeBtn.addEventListener('click', () => {
        cancelled = true;
        callback();
        this.remove();
      });
    }
  };
}


// Show side panel with full fact-check details
function showFactCheckSidePanel(result, text) {
  // Remove any existing panel
  const existingBackdrop = document.getElementById('fnf-fact-check-backdrop');
  const existingPanel = document.getElementById('fnf-fact-check-panel');
  if (existingBackdrop) existingBackdrop.remove();
  if (existingPanel) existingPanel.remove();
  
  const isFakeNews = result.flagged === true;
  const percentage = result.similarity ? Math.round(result.similarity * 100) : 0;
  const preview = text.slice(0, 200) + (text.length > 200 ? '…' : '');
  
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'fnf-fact-check-backdrop';
  backdrop.className = 'fnf-fact-check-panel-backdrop';
  backdrop.dataset.fnfElement = 'true';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 999999;
    animation: fnfFadeIn 0.3s ease;
  `;
  backdrop.addEventListener('click', () => hideFactCheckSidePanel());
  
  // Create side panel
  const panel = document.createElement('div');
  panel.id = 'fnf-fact-check-panel';
  panel.className = `fnf-fact-check-panel ${isFakeNews ? 'fnf-fake-news' : 'fnf-not-in-db'}`;
  panel.dataset.fnfElement = 'true';
  panel.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 400px;
    max-width: 90vw;
    background: white;
    box-shadow: -4px 0 24px rgba(0,0,0,0.2);
    z-index: 9999999;
    animation: fnfSlideIn 0.3s ease;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    border-left: 8px solid ${isFakeNews ? '#dc2626' : '#6b7280'};
  `;
  
  if (isFakeNews) {
    panel.innerHTML = `
      <div class="fnf-panel-header" style="padding:24px; border-bottom:1px solid #e5e7eb; background:linear-gradient(to bottom, #fef2f2, white);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="flex:1;">
            <div style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; background:#dc2626; color:white;">
              <span>⚠️</span>
              <span>Fake News</span>
            </div>
            <h2 style="font-size:24px; font-weight:800; color:#111827; margin:0 0 8px 0;">Alert!</h2>
            <p style="font-size:14px; color:#6b7280; margin:0;">Flagged by our system</p>
          </div>
          <button class="fnf-close-panel-btn" style="background:#f3f4f6; border:none; width:36px; height:36px; border-radius:8px; cursor:pointer; font-size:20px; display:flex; align-items:center; justify-content:center; color:#6b7280;">×</button>
        </div>
      </div>
      
      <div class="fnf-panel-body" style="flex:1; overflow-y:auto; padding:24px;">
        <div style="text-align:center; margin-bottom:32px;">
          <div style="width:160px; height:160px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:56px; font-weight:800; border:12px solid #dc2626; background:white; color:#dc2626; box-shadow:0 0 0 8px #fef2f2;">
            ${percentage}%
          </div>
          <div style="font-size:14px; color:#6b7280; font-weight:500;">Confidence Level</div>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px; font-weight:700; color:#111827; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
            <span>🔍</span>
            <span>What This Means</span>
          </h3>
          <div style="font-size:14px; line-height:1.6; color:#4b5563; padding:16px; background:#fef2f2; border-radius:8px; border-left:4px solid #dc2626;">
            This content has been flagged as fake news by our system. We strongly recommend not sharing or believing this information without verification from reliable sources.
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px; font-weight:700; color:#111827; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
            <span>📝</span>
            <span>Analyzed Content</span>
          </h3>
          <div style="font-size:13px; line-height:1.6; color:#4b5563; padding:16px; background:#fef2f2; border-radius:8px; border-left:4px solid #dc2626; font-style:italic;">
            "${preview}"
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px; font-weight:700; color:#111827; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
            <span>💡</span>
            <span>Recommendation</span>
          </h3>
          <div style="font-size:14px; line-height:1.6; color:#4b5563; padding:16px; background:#fef2f2; border-radius:8px; border-left:4px solid #dc2626;">
            Before sharing this content, verify it through multiple trusted news sources. Look for official statements or fact-checking organizations.
          </div>
        </div>
      </div>

      <div class="fnf-panel-footer" style="padding:24px; border-top:1px solid #e5e7eb; display:flex; gap:12px;">
        <button class="fnf-panel-btn-primary" style="flex:1; padding:12px 24px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; background:#dc2626; color:white;">Understood</button>
        <button class="fnf-panel-btn-secondary" style="flex:1; padding:12px 24px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; background:#f3f4f6; color:#374151;">Dismiss</button>
      </div>
    `;
  } else {
    panel.innerHTML = `
      <div class="fnf-panel-header" style="padding:24px; border-bottom:1px solid #e5e7eb; background:linear-gradient(to bottom, #f9fafb, white);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="flex:1;">
            <div style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; background:#6b7280; color:white;">
              <span>ℹ️</span>
              <span>Not Verified</span>
            </div>
            <h2 style="font-size:24px; font-weight:800; color:#111827; margin:0 0 8px 0;">Unknown Status</h2>
            <p style="font-size:14px; color:#6b7280; margin:0;">Not in our database</p>
          </div>
          <button class="fnf-close-panel-btn" style="background:#f3f4f6; border:none; width:36px; height:36px; border-radius:8px; cursor:pointer; font-size:20px; display:flex; align-items:center; justify-content:center; color:#6b7280;">×</button>
        </div>
      </div>
      
      <div class="fnf-panel-body" style="flex:1; overflow-y:auto; padding:24px;">
        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px; font-weight:700; color:#111827; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
            <span>📋</span>
            <span>Database Status</span>
          </h3>
          <div style="font-size:14px; line-height:1.6; color:#4b5563; padding:16px; background:#f9fafb; border-radius:8px; border-left:4px solid #6b7280;">
            This content is not currently in our fact-checking database. This doesn't mean it's true or false - we simply don't have information about it.
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px; font-weight:700; color:#111827; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
            <span>📝</span>
            <span>Analyzed Content</span>
          </h3>
          <div style="font-size:13px; line-height:1.6; color:#4b5563; padding:16px; background:#f9fafb; border-radius:8px; border-left:4px solid #6b7280; font-style:italic;">
            "${preview}"
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px; font-weight:700; color:#111827; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
            <span>💡</span>
            <span>What You Can Do</span>
          </h3>
          <div style="font-size:14px; line-height:1.6; color:#4b5563; padding:16px; background:#f9fafb; border-radius:8px; border-left:4px solid #6b7280;">
            Consider verifying this information through multiple trusted sources. Stay critical of what you read online and check the credibility of the source.
          </div>
        </div>
      </div>

      <div class="fnf-panel-footer" style="padding:24px; border-top:1px solid #e5e7eb; display:flex; gap:12px;">
        <button class="fnf-panel-btn-primary" style="flex:1; padding:12px 24px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; background:#6b7280; color:white;">Got It</button>
        <button class="fnf-panel-btn-secondary" style="flex:1; padding:12px 24px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; background:#f3f4f6; color:#374151;">Dismiss</button>
      </div>
    `;
  }
  
  // Append to body
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  
  // Mark all children as extension elements
  markAllChildrenAsExtensionElements(backdrop);
  markAllChildrenAsExtensionElements(panel);
  
  // Add event listeners
  const closeBtn = panel.querySelector('.fnf-close-panel-btn');
  const primaryBtn = panel.querySelector('.fnf-panel-btn-primary');
  const secondaryBtn = panel.querySelector('.fnf-panel-btn-secondary');
  
  closeBtn.addEventListener('click', hideFactCheckSidePanel);
  primaryBtn.addEventListener('click', hideFactCheckSidePanel);
  secondaryBtn.addEventListener('click', hideFactCheckSidePanel);
  
  // Add hover effects
  [primaryBtn, secondaryBtn].forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });
  });
}

function hideFactCheckSidePanel() {
  const backdrop = document.getElementById('fnf-fact-check-backdrop');
  const panel = document.getElementById('fnf-fact-check-panel');
  if (backdrop) backdrop.remove();
  if (panel) panel.remove();
}



// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addOverlay') {
    addOverlayElement(request.config);
    sendResponse({ success: true });
    return false; // Synchronous response
  } else if (request.action === 'startFactCheckSelection') {
    try {
      startFactCheckSelectionMode();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return false;
  }
  return false; // Default: synchronous
});

// Listen for analysis results triggered via background context menu
chrome.runtime.onMessage.addListener((request) => {
  if (request?.action === 'analysisResult') {
    showAnalysisOverlay(request.payload?.result);
  } else if (request?.action === 'analysisError') {
    console.error('FakeNewsFilter: analysisError event', { message: request.payload?.message });
  } else if (request?.action === 'debugInfo') {
    // No longer showing overlay; preserve for compatibility if sent from older background
    console.error('FakeNewsFilter: debugInfo', request.payload);
  }
});

// (removed) demo overlays and auto analyze button

// (removed) PostDiscoveryService — automatic post discovery disabled

// --------------------------------------
// Persistent floating toolbar (on-page)
// --------------------------------------
(function initFloatingToolbar() {
  try { if (window.__fnfToolbarInit) return; window.__fnfToolbarInit = true; } catch (_) {}
  try {
    // Avoid injecting on restricted contexts without body
    if (!document || !document.body) return;
    createToolbarOverlay();
  } catch (_) {}
})();


function createToolbarOverlay() {
  if (document.getElementById('fnf-toolbar')) return;
  const toolbar = document.createElement('div');
  toolbar.id = 'fnf-toolbar';
  toolbar.dataset.fnfElement = 'true';
  toolbar.style.position = 'fixed';
  toolbar.style.top = '20px';
  toolbar.style.right = '20px';
  toolbar.style.zIndex = '999999';
  toolbar.style.display = 'flex';
  toolbar.style.gap = '8px';
  toolbar.style.alignItems = 'center';
  toolbar.style.background = 'rgba(17, 24, 39, 0.85)';
  toolbar.style.color = '#fff';
  toolbar.style.padding = '8px 10px';
  toolbar.style.borderRadius = '10px';
  toolbar.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
  toolbar.style.backdropFilter = 'saturate(120%) blur(4px)';
  toolbar.style.userSelect = 'none';

  const title = document.createElement('div');
  title.textContent = 'Tools';
  title.style.fontSize = '12px';
  title.style.opacity = '0.9';

  const factBtn = document.createElement('button');
  factBtn.title = 'Start Fact-check (select element)';
  factBtn.textContent = '🛡️ Fact-check';
  factBtn.style.background = '#2563eb';
  factBtn.style.color = '#fff';
  factBtn.style.border = 'none';
  factBtn.style.borderRadius = '8px';
  factBtn.style.padding = '6px 8px';
  factBtn.style.fontSize = '12px';
  factBtn.style.cursor = 'pointer';

  factBtn.addEventListener('click', () => {
    startFactCheckSelectionMode();
  });

  const handle = document.createElement('div');
  handle.textContent = '⠿';
  handle.title = 'Drag';
  handle.style.cursor = 'move';
  handle.style.opacity = '0.9';
  handle.style.fontSize = '14px';

  const closeBtn = document.createElement('button');
  closeBtn.title = 'Hide toolbar';
  closeBtn.textContent = '×';
  closeBtn.style.background = 'transparent';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '16px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.lineHeight = '1';

  closeBtn.addEventListener('click', () => {
    try { toolbar.remove(); } catch (_) {}
  });

  toolbar.appendChild(handle);
  toolbar.appendChild(title);
  toolbar.appendChild(factBtn);
  toolbar.appendChild(closeBtn);
  document.body.appendChild(toolbar);

  // Mark all children as extension elements
  markAllChildrenAsExtensionElements(toolbar);

  // Make draggable using existing helper
  makeDraggable(toolbar);
}

