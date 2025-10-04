// Content script - runs on every webpage
console.log('DOM Reader & Overlay Extension loaded');
// Feature flags
// - Backend analysis is now enabled
const FNF_BACKEND_ANALYSIS_ENABLED = true;
// (removed) demo overlays & auto discovery flags

// Function to read DOM information
function readDOM() {
  const domInfo = {
    title: document.title,
    url: window.location.href,
    paragraphs: document.querySelectorAll('p').length,
    images: document.querySelectorAll('img').length,
    links: document.querySelectorAll('a').length,
    headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    forms: document.querySelectorAll('form').length,
  };
  
  console.log('DOM Analysis:', domInfo);
  return domInfo;
}

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
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
      <span>${text}</span>
      <button class="close-overlay" style="
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

// Function to add a DOM info overlay
function showDOMInfo() {
  const domInfo = readDOM();
  const infoText = `
    <div>
      <strong>DOM Info</strong><br>
      <div style="margin-top: 8px; font-size: 12px;">
        📄 Title: ${domInfo.title.substring(0, 30)}${domInfo.title.length > 30 ? '...' : ''}<br>
        📝 Paragraphs: ${domInfo.paragraphs}<br>
        🖼️ Images: ${domInfo.images}<br>
        🔗 Links: ${domInfo.links}<br>
        📋 Headings: ${domInfo.headings}<br>
        📋 Forms: ${domInfo.forms}
      </div>
    </div>
  `;
  
  addOverlayElement({
    text: infoText,
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(16, 185, 129, 0.95)'
  });
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
// Fact-check selection mode
// ------------------------------
let __fcSelection = {
  active: false,
  highlightBox: null,
  prevCursor: '',
  hoverEl: null,
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
  if (!el || el.classList?.contains('extension-overlay')) {
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
    const loading = attachOverlayToElement(container, 'Fact checking…', { backgroundColor: 'rgba(30, 64, 175, 0.95)' });

    // Call background for analysis
    try {
      const response = await chrome.runtime.sendMessage({ action: 'analyzeText', text, url: window.location.href, source: 'selection-click' });
      try { loading.remove(); } catch (_) {}
      if (response && response.success) {
        // Show result attached to the element
        const result = response.result || {};
        const preview = (text || '').slice(0, 160) + ((text || '').length > 160 ? '…' : '');
        
        // Check if content is flagged as fake news
        const isFakeNews = result.flagged === true;
        const label = isFakeNews ? '⚠️ Fake News Detected' : '✓ Content Verified';
        const summary = isFakeNews 
          ? 'This content has been flagged as potentially misleading or false information.' 
          : 'This content appears to be legitimate.';
        const backgroundColor = isFakeNews ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)';
        
        const html = `
          <div>
            <strong>${label}</strong><br>
            <div style=\"margin-top:6px; font-size:12px; line-height:1.4;\">${summary}</div>
            <div style=\"margin-top:8px; font-size:11px; opacity:0.85;\">Snippet: ${preview}</div>
          </div>
        `;
        attachOverlayToElement(container, html, { backgroundColor });
      } else {
        attachOverlayToElement(container, `❌ Fact-check failed: ${response?.error || 'Unknown error'}`, { backgroundColor: 'rgba(239, 68, 68, 0.95)' });
      }
    } catch (err) {
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
  overlay.style.position = 'absolute';
  overlay.style.top = options.top || '8px';
  overlay.style.right = options.right || '8px';
  overlay.style.backgroundColor = options.backgroundColor || 'rgba(30, 64, 175, 0.95)';
  overlay.style.color = '#ffffff';
  overlay.style.padding = '10px 12px';
  overlay.style.borderRadius = '10px';
  overlay.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
  overlay.style.zIndex = '99999';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.fontSize = '13px';
  overlay.style.maxWidth = '360px';
  overlay.style.pointerEvents = 'auto';
  overlay.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <div style="flex:1;">${html}</div>
      <button class="close-overlay" style="background:transparent; border:none; color:#fff; font-size:16px; cursor:pointer; line-height:1;">×</button>
    </div>
  `;
  const closeBtn = overlay.querySelector('.close-overlay');
  try { closeBtn.addEventListener('click', () => { try { overlay.remove(); } catch (_) {} }); } catch (_) {}
  try { anchorEl.appendChild(overlay); } catch (_) {
    try { document.body.appendChild(overlay); } catch (_) {}
  }
  return overlay;
}

// Function to fetch and display cat data
async function fetchAndDisplayCats() {
  try {
    // Show loading overlay
    const loadingOverlay = addOverlayElement({
      text: '🔄 Fetching cats...',
      top: '100px',
      right: '20px',
      backgroundColor: 'rgba(234, 179, 8, 0.95)'
    });

    // Delegate cross-origin fetch to background service worker
    const bgResponse = await chrome.runtime.sendMessage({ action: 'bgFetchCats' });
    
    // Remove loading overlay
    loadingOverlay.remove();
    
    // Create cat display overlay
    const catOverlay = document.createElement('div');
    catOverlay.className = 'extension-overlay cat-overlay';
    catOverlay.style.position = 'fixed';
    catOverlay.style.top = '100px';
    catOverlay.style.right = '20px';
    catOverlay.style.backgroundColor = 'rgba(139, 92, 246, 0.98)';
    catOverlay.style.color = '#ffffff';
    catOverlay.style.padding = '20px';
    catOverlay.style.borderRadius = '12px';
    catOverlay.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
    catOverlay.style.zIndex = '999999';
    catOverlay.style.fontFamily = 'Arial, sans-serif';
    catOverlay.style.maxWidth = '350px';
    catOverlay.style.cursor = 'move';
    
    if (!bgResponse?.success) {
      throw new Error(bgResponse?.error || 'Unknown background fetch error');
    }
    const catUrl = bgResponse.data?.image;
    const factText = bgResponse.data?.fact;

    catOverlay.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="margin: 0; font-size: 18px;">🐱 Random Cat</h3>
          <button class="close-overlay" style="
            background: transparent;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
          ">×</button>
        </div>
        <img src="${catUrl}" alt="Random cat" style="
          width: 100%;
          border-radius: 8px;
          max-height: 300px;
          object-fit: cover;
        ">
        <div style="
          background: rgba(255, 255, 255, 0.15);
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
        ">
          <strong>💡 Cat Fact:</strong><br>
          ${factText}
        </div>
        <div style="
          font-size: 11px;
          opacity: 0.8;
          text-align: center;
        ">
          Data from thecatapi.com & catfact.ninja
        </div>
      </div>
    `;
    
    // Add close functionality
    const closeBtn = catOverlay.querySelector('.close-overlay');
    closeBtn.addEventListener('click', () => {
      catOverlay.remove();
    });
    
    // Make it draggable
    makeDraggable(catOverlay);
    
    // Add to page
    document.body.appendChild(catOverlay);
    
    return { success: true, data: { image: catUrl, fact: factText } };
    
  } catch (error) {
    console.error('Error fetching cat data:', error);
    addOverlayElement({
      text: `❌ Error fetching cats: ${error.message}`,
      top: '100px',
      right: '20px',
      backgroundColor: 'rgba(239, 68, 68, 0.95)'
    });
    return { success: false, error: error.message };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'readDOM') {
    const domInfo = readDOM();
    sendResponse({ success: true, data: domInfo });
    return false; // Synchronous response
  } else if (request.action === 'addOverlay') {
    addOverlayElement(request.config);
    sendResponse({ success: true });
    return false; // Synchronous response
  } else if (request.action === 'showDOMInfo') {
    showDOMInfo();
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
  } else if (request.action === 'fetchCats') {
    // Support a fire-and-forget mode to avoid keeping the message channel open
    if (request.fireAndForget) {
      try {
        // Kick off the async work but ACK immediately
        fetchAndDisplayCats();
        sendResponse({ success: true, started: true });
      } catch (error) {
        // If anything synchronous goes wrong (unlikely), report it
        sendResponse({ success: false, error: error.message });
      }
      return false; // Synchronous ACK; do not keep channel open
    }

    // Default behavior: perform async work and respond when done
    (async () => {
      try {
        const result = await fetchAndDisplayCats();
        sendResponse(result);
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep channel open for async response
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

  // Make draggable using existing helper
  makeDraggable(toolbar);
}

