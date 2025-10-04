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

function getUserSelectionText() {
  const sel = window.getSelection && window.getSelection();
  if (!sel || sel.rangeCount === 0) return '';
  console.log('sel ', sel)
  const text = sel.toString().replace(/\s+/g, ' ').trim();
  return text;
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
};

// ------------------------------
// Text selection fact-check
// ------------------------------
let __textSelection = {
  button: null,
  lastSelection: null,
  timeoutId: null,
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
}

function stopFactCheckSelectionMode() {
  if (!__fcSelection.active) return;
  __fcSelection.active = false;
  window.removeEventListener('mousemove', onFcMouseMove, { capture: true });
  window.removeEventListener('click', onFcClick, { capture: true });
  window.removeEventListener('keydown', onFcKeyDown, { capture: true });
  try { document.body.style.cursor = __fcSelection.prevCursor || ''; } catch (_) {}
  if (__fcSelection.highlightBox && __fcSelection.highlightBox.parentNode) {
    try { __fcSelection.highlightBox.remove(); } catch (_) {}
  }
  __fcSelection.highlightBox = null;
  __fcSelection.hoverEl = null;
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

function onFcKeyDown(e) {
  if (!__fcSelection.active) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    stopFactCheckSelectionMode();
  }
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
  
  // Log the fact-checked HTML element and extracted text that will be sent to backend
  console.log('Fact-checking clicked element:', target);
  console.log('Container element used for extraction:', container);
  console.log('Extracted text (sent to backend):', text);
  console.log('Container HTML:', container.outerHTML);

  // Show loading overlay attached to the clicked element (absolute relative to element)
  try {
    const loadingHtml = `<div style="display:flex; align-items:center; gap:10px;"><div style="width:20px; height:20px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.8s linear infinite;"></div><span style="font-weight:600;">Fact checking…</span></div><style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;
    const loading = attachOverlayToElement(container, loadingHtml, { backgroundColor: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' });

    // Call background for analysis
    try {
      console.log('Sending fact-check request to background...');
      const response = await chrome.runtime.sendMessage({ action: 'analyzeText', text, url: window.location.href, source: 'selection-click' });
      console.log('Fact-check response from background:', response);
      
      try { loading.remove(); } catch (_) {}
      if (response && response.success) {
        // Show result attached to the element
        const result = response.result || {};
        console.log('Backend result:', result);
        const preview = (text || '').slice(0, 160) + ((text || '').length > 160 ? '…' : '');
        
        // Check if content is flagged as fake news
        const isFakeNews = result.flagged === true;
        const percentage = result.similarity ? Math.round(result.similarity * 100) : 0;
        const label = isFakeNews ? '⚠️ Fake News Alert!' : 'ℹ️ Not in Database';
        const summary = isFakeNews 
          ? `This content has been flagged as fake news (${percentage}% similarity).` 
          : 'This content is not in our fact-checking database.';
        const backgroundColor = isFakeNews ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
        const iconBg = isFakeNews ? 'rgba(254, 226, 226, 0.2)' : 'rgba(219, 234, 254, 0.2)';
        
        const html = `
          <div data-fnf-element="true" style="display:flex; align-items:flex-start; gap:12px;">
            <div data-fnf-element="true" style="
              width:42px;
              height:42px;
              border-radius:10px;
              background:${iconBg};
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:22px;
              flex-shrink:0;
            ">${isFakeNews ? '⚠️' : 'ℹ️'}</div>
            <div data-fnf-element="true" style="flex:1; min-width:0;">
              <strong data-fnf-element="true" style="font-size:16px; font-weight:700; display:block; margin-bottom:8px;">${label}</strong>
              <div data-fnf-element="true" style="font-size:13px; line-height:1.5; margin-bottom:12px; opacity:0.95;">${summary}</div>
              <div data-fnf-element="true" style="
                background:rgba(0,0,0,0.15);
                padding:10px;
                border-radius:6px;
                font-size:12px;
                line-height:1.4;
                font-style:italic;
                opacity:0.9;
                border-left:3px solid rgba(255,255,255,0.3);
                margin-bottom:12px;
              ">"${preview}"</div>
              <button data-fnf-element="true" class="fnf-element-learn-more-btn" style="
                background:rgba(255,255,255,0.9);
                border:none;
                color:${isFakeNews ? '#dc2626' : '#1e40af'};
                padding:10px 16px;
                border-radius:8px;
                font-size:13px;
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
        const overlay = attachOverlayToElement(container, html, { backgroundColor, isFakeNews });
        
        // Add Learn More button functionality
        const learnMoreBtn = overlay.querySelector('.fnf-element-learn-more-btn');
        if (learnMoreBtn) {
          learnMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.remove();
            showFactCheckSidePanel(result, text);
          });
        }
      } else {
        console.error('Fact-check failed:', response);
        attachOverlayToElement(container, `❌ Fact-check failed: ${response?.error || 'Unknown error'}`, { backgroundColor: 'rgba(239, 68, 68, 0.95)' });
      }
    } catch (err) {
      console.error('Fact-check exception:', err);
      try { loading.remove(); } catch (_) {}
      attachOverlayToElement(container, `❌ Fact-check error: ${String(err?.message || err)}`, { backgroundColor: 'rgba(239, 68, 68, 0.95)' });
    }
  } catch (errOuter) {
    console.error('Fact-check selection error', errOuter);
  }
}

function attachOverlayToElement(anchorEl, html, options = {}) {
  if (!anchorEl || !anchorEl.appendChild) return { remove() {} };
  // Ensure the anchor is a positioned container so absolute children attach relative to it
  try {
    const cs = window.getComputedStyle(anchorEl);
    if (cs && cs.position === 'static') {
      anchorEl.dataset.fnfPrevPosition = anchorEl.style.position || '';
      anchorEl.style.position = 'relative';
    }
  } catch (_) {}
  const overlay = document.createElement('div');
  overlay.className = 'fnf-attached-overlay';
  overlay.dataset.fnfElement = 'true';
  overlay.style.position = 'absolute';
  overlay.style.top = options.top || '8px';
  overlay.style.right = options.right || '8px';
  overlay.style.background = options.backgroundColor || 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
  overlay.style.color = '#ffffff';
  overlay.style.padding = '16px 18px';
  overlay.style.borderRadius = '14px';
  overlay.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
  overlay.style.zIndex = '99999';
  overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  overlay.style.fontSize = '13px';
  overlay.style.maxWidth = '420px';
  overlay.style.pointerEvents = 'auto';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.innerHTML = `
    <div data-fnf-element="true" style="display:flex; align-items:flex-start; gap:8px;">
      <div data-fnf-element="true" style="flex:1;">${html}</div>
      <button data-fnf-element="true" class="close-overlay" style="
        background:rgba(255,255,255,0.2);
        border:none;
        color:#fff;
        font-size:18px;
        cursor:pointer;
        line-height:1;
        flex-shrink:0;
        width:26px;
        height:26px;
        border-radius:5px;
        display:flex;
        align-items:center;
        justify-content:center;
        transition: background 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
    </div>
  `;
  const closeBtn = overlay.querySelector('.close-overlay');
  try { closeBtn.addEventListener('click', () => { try { overlay.remove(); } catch (_) {} }); } catch (_) {}
  try { anchorEl.appendChild(overlay); } catch (_) {
    try { document.body.appendChild(overlay); } catch (_) {}
  }
  // Mark all children as extension elements
  markAllChildrenAsExtensionElements(overlay);
  return overlay;
}

// ------------------------------
// Text selection fact-check functions
// ------------------------------
function createTextSelectionButton() {
  const button = document.createElement('button');
  button.id = 'fnf-text-selection-button';
  button.dataset.fnfElement = 'true';
  button.innerHTML = '🛡️ Fact-check';
  button.style.position = 'fixed';
  button.style.zIndex = '999999';
  button.style.background = '#2563eb';
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '8px';
  button.style.padding = '8px 12px';
  button.style.fontSize = '13px';
  button.style.fontFamily = 'Arial, sans-serif';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
  button.style.display = 'none';
  button.style.pointerEvents = 'auto';
  button.style.transition = 'opacity 0.2s, transform 0.2s';
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
  
  button.addEventListener('click', handleTextSelectionFactCheck);
  
  document.body.appendChild(button);
  return button;
}

function positionTextSelectionButton(selection) {
  if (!__textSelection.button || !selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  if (rect.width === 0 && rect.height === 0) {
    hideTextSelectionButton();
    return;
  }
  
  // Position button at the end of the selection, slightly below
  const buttonWidth = 120; // approximate button width
  let left = rect.right - buttonWidth / 2;
  let top = rect.bottom + 8;
  
  // Keep button on screen
  const margin = 10;
  if (left < margin) left = margin;
  if (left + buttonWidth > window.innerWidth - margin) {
    left = window.innerWidth - buttonWidth - margin;
  }
  if (top + 40 > window.innerHeight) {
    // Show above selection if not enough space below
    top = rect.top - 40;
  }
  
  __textSelection.button.style.left = left + 'px';
  __textSelection.button.style.top = top + 'px';
  __textSelection.button.style.display = 'block';
}

function hideTextSelectionButton() {
  if (__textSelection.button) {
    __textSelection.button.style.display = 'none';
  }
}

function handleTextSelection() {
  // Clear any pending timeout
  if (__textSelection.timeoutId) {
    clearTimeout(__textSelection.timeoutId);
  }
  
  // Small delay to allow selection to settle
  __textSelection.timeoutId = setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (!selectedText || selectedText.length < 10) {
      hideTextSelectionButton();
      __textSelection.lastSelection = null;
      return;
    }
    
    // Check if selection is within extension UI
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
      
      if (isExtensionElement(element)) {
        console.log('Selection is within extension UI - ignoring');
        hideTextSelectionButton();
        __textSelection.lastSelection = null;
        return;
      }
    }
    
    // Create button if it doesn't exist
    if (!__textSelection.button) {
      __textSelection.button = createTextSelectionButton();
    }
    
    __textSelection.lastSelection = {
      text: selectedText,
      selection: selection
    };
    
    positionTextSelectionButton(selection);
  }, 150);
}

// Helper function to create an overlay with absolute positioning (scrolls with content)
function createTextOverlayAbsolute(rect, content, backgroundColor) {
  const overlay = document.createElement('div');
  overlay.className = 'fnf-text-result-overlay fnf-text-overlay-absolute';
  overlay.dataset.fnfElement = 'true';
  overlay.style.position = 'absolute';
  
  // Calculate absolute position relative to document
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  const left = Math.max(10, rect.left + scrollX);
  const top = rect.bottom + scrollY + 8;
  
  overlay.style.left = left + 'px';
  overlay.style.top = top + 'px';
  overlay.style.backgroundColor = backgroundColor;
  overlay.style.color = '#ffffff';
  overlay.style.padding = '20px 24px';
  overlay.style.borderRadius = '16px';
  overlay.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
  overlay.style.zIndex = '999999';
  overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.maxWidth = '460px';
  overlay.style.minWidth = '320px';
  overlay.style.pointerEvents = 'auto';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.innerHTML = content;
  
  document.body.appendChild(overlay);
  
  // Mark all children as extension elements
  markAllChildrenAsExtensionElements(overlay);
  
  return overlay;
}

// Perform the actual fact check and display results
async function performTextFactCheck(text, rect, loadingOverlay) {
  try {
    console.log('Sending fact-check request to background...');
    const response = await chrome.runtime.sendMessage({ 
      action: 'analyzeText', 
      text, 
      url: window.location.href, 
      source: 'text-selection' 
    });
    console.log('Fact-check response from background:', response);
    
    loadingOverlay.remove();
    
    if (response && response.success) {
      const result = response.result || {};
      console.log('Backend result:', result);
      const preview = text.slice(0, 120) + (text.length > 120 ? '…' : '');
      
      const isFakeNews = result.flagged === true;
      const percentage = result.similarity ? Math.round(result.similarity * 100) : 0;
      
      // Different messaging based on fake news status
      const label = isFakeNews ? '⚠️ Fake News Alert!' : 'ℹ️ Not in Database';
      const summary = isFakeNews 
        ? `This content has been flagged as fake news (${percentage}% similarity).` 
        : 'This content is not in our fact-checking database.';
      const backgroundColor = isFakeNews ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
      const iconBg = isFakeNews ? 'rgba(254, 226, 226, 0.2)' : 'rgba(219, 234, 254, 0.2)';
      
      const resultContent = `
        <div data-fnf-element="true" style="display:flex; align-items:flex-start; gap:16px;">
          <div data-fnf-element="true" style="
            width:48px;
            height:48px;
            border-radius:12px;
            background:${iconBg};
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:24px;
            flex-shrink:0;
          ">${isFakeNews ? '⚠️' : 'ℹ️'}</div>
          <div data-fnf-element="true" style="flex:1; min-width:0;">
            <div data-fnf-element="true" style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px;">
              <strong data-fnf-element="true" style="font-size:18px; font-weight:700; line-height:1.3;">${label}</strong>
              <button data-fnf-element="true" class="close-overlay" style="
                background:rgba(255,255,255,0.2);
                border:none;
                color:#fff;
                font-size:20px;
                cursor:pointer;
                line-height:1;
                flex-shrink:0;
                width:28px;
                height:28px;
                border-radius:6px;
                display:flex;
                align-items:center;
                justify-content:center;
                transition: background 0.2s;
              " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
            </div>
            <div data-fnf-element="true" style="font-size:14px; line-height:1.6; margin-bottom:16px; opacity:0.95;">${summary}</div>
            <div data-fnf-element="true" style="
              background:rgba(0,0,0,0.15);
              padding:12px;
              border-radius:8px;
              font-size:13px;
              line-height:1.5;
              font-style:italic;
              opacity:0.9;
              border-left:3px solid rgba(255,255,255,0.3);
              margin-bottom:16px;
            ">"${preview}"</div>
            <button data-fnf-element="true" class="fnf-learn-more-btn" style="
              background:rgba(255,255,255,0.9);
              border:none;
              color:${isFakeNews ? '#dc2626' : '#1e40af'};
              padding:12px 20px;
              border-radius:10px;
              font-size:14px;
              font-weight:700;
              cursor:pointer;
              width:100%;
              transition: all 0.2s;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)'">
              Learn More →
            </button>
          </div>
        </div>
      `;
      
      const resultOverlay = createTextOverlayAbsolute(rect, resultContent, isFakeNews ? '#dc2626' : '#3b82f6');
      resultOverlay.style.background = backgroundColor;
      
      const closeBtn = resultOverlay.querySelector('.close-overlay');
      closeBtn.addEventListener('click', () => {
        resultOverlay.remove();
      });
      
      const learnMoreBtn = resultOverlay.querySelector('.fnf-learn-more-btn');
      learnMoreBtn.addEventListener('click', () => {
        resultOverlay.remove();
        showFactCheckSidePanel(result, text);
      });
      
    } else {
      console.error('Fact-check failed:', response);
      const errorContent = `❌ Fact-check failed: ${response?.error || 'Unknown error'}`;
      const errorOverlay = createTextOverlayAbsolute(rect, errorContent, 'rgba(239, 68, 68, 0.95)');
      
      setTimeout(() => {
        errorOverlay.remove();
      }, 5000);
    }
  } catch (err) {
    console.error('Fact-check exception:', err);
    loadingOverlay.remove();
    
    const errorContent = `❌ Fact-check error: ${String(err?.message || err)}`;
    const errorOverlay = createTextOverlayAbsolute(rect, errorContent, 'rgba(239, 68, 68, 0.95)');
    
    setTimeout(() => {
      errorOverlay.remove();
    }, 5000);
  }
  
  // Clear the text selection
  const selection = window.getSelection();
  if (selection && selection.removeAllRanges) {
    selection.removeAllRanges();
  }
  __textSelection.lastSelection = null;
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

async function handleTextSelectionFactCheck(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!__textSelection.lastSelection) return;
  
  const text = __textSelection.lastSelection.text;
  const selection = __textSelection.lastSelection.selection;
  
  console.log('Fact-checking selected text:', text);
  
  // Hide the button immediately
  hideTextSelectionButton();
  
  // Get the selection range and its bounding rect
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Create loading overlay with absolute positioning
  const loadingHtml = `<div style="display:flex; align-items:center; gap:12px;"><div style="width:24px; height:24px; border:3px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.8s linear infinite;"></div><span style="font-weight:600; font-size:15px;">Fact checking…</span></div><style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;
  const loadingOverlay = createTextOverlayAbsolute(rect, loadingHtml, '#6366f1');
  loadingOverlay.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
  
  // Perform fact check
  performTextFactCheck(text, rect, loadingOverlay);
}

// Initialize text selection listeners
function initTextSelectionFactCheck() {
  // Listen for text selection
  document.addEventListener('mouseup', (e) => {
    // Don't interfere with extension UI
    if (e.target?.id === 'fnf-text-selection-button' || isExtensionElement(e.target)) return;
    
    // Small delay to ensure selection is complete
    setTimeout(() => handleTextSelection(), 10);
  });
  
  // Also listen to selection change for keyboard selection
  document.addEventListener('selectionchange', () => {
    handleTextSelection();
  });
  
  // Hide button when clicking elsewhere
  document.addEventListener('mousedown', (e) => {
    // Don't interfere with extension UI
    if (e.target?.id === 'fnf-text-selection-button' || isExtensionElement(e.target)) return;
    
    // Check if there's still a selection
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      if (!selectedText) {
        hideTextSelectionButton();
        __textSelection.lastSelection = null;
      }
    }, 10);
  });
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

// --------------------------------------
// Initialize text selection fact-check
// --------------------------------------
(function initTextSelection() {
  try { if (window.__fnfTextSelectionInit) return; window.__fnfTextSelectionInit = true; } catch (_) {}
  try {
    if (!document || !document.body) return;
    initTextSelectionFactCheck();
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

