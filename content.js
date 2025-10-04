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
        const percentage = result.percentage || 0;
        const label = isFakeNews ? '⚠️ Fake News Alert!' : 'ℹ️ Not in Database';
        const summary = isFakeNews 
          ? `This content has been flagged as fake news (${percentage}% confidence).` 
          : 'This content is not in our fact-checking database.';
        const backgroundColor = isFakeNews ? 'rgba(220, 38, 38, 0.95)' : 'rgba(107, 114, 128, 0.95)';
        
        const html = `
          <div>
            <strong style="font-size:15px;">${label}</strong><br>
            <div style=\"margin-top:6px; font-size:13px; line-height:1.4;\">${summary}</div>
            <div style=\"margin-top:12px; font-size:11px; opacity:0.85; font-style:italic; border-top:1px solid rgba(255,255,255,0.2); padding-top:8px;\">\"${preview}\"</div>
            <button class="fnf-element-learn-more-btn" style="
              margin-top:12px;
              background:rgba(255,255,255,0.2);
              border:1px solid rgba(255,255,255,0.3);
              color:#fff;
              padding:8px 16px;
              border-radius:6px;
              font-size:12px;
              font-weight:600;
              cursor:pointer;
              width:100%;
              transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
              Learn More →
            </button>
          </div>
        `;
        const overlay = attachOverlayToElement(container, html, { backgroundColor });
        
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

// ------------------------------
// Text selection fact-check functions
// ------------------------------
function createTextSelectionButton() {
  const button = document.createElement('button');
  button.id = 'fnf-text-selection-button';
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
  overlay.style.padding = '12px 16px';
  overlay.style.borderRadius = '10px';
  overlay.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
  overlay.style.zIndex = '999999';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.fontSize = '13px';
  overlay.style.maxWidth = '400px';
  overlay.style.minWidth = '250px';
  overlay.style.pointerEvents = 'auto';
  overlay.innerHTML = content;
  
  document.body.appendChild(overlay);
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
      const percentage = result.percentage || 0;
      
      // Different messaging based on fake news status
      const label = isFakeNews ? '⚠️ Fake News Alert!' : 'ℹ️ Not in Database';
      const summary = isFakeNews 
        ? `This content has been flagged as fake news (${percentage}% confidence).` 
        : 'This content is not in our fact-checking database.';
      const backgroundColor = isFakeNews ? 'rgba(220, 38, 38, 0.95)' : 'rgba(107, 114, 128, 0.95)';
      
      const resultContent = `
        <div style="display:flex; align-items:flex-start; gap:10px;">
          <div style="flex:1;">
            <strong style="font-size:15px;">${label}</strong><br>
            <div style="margin-top:6px; font-size:13px; line-height:1.4;">${summary}</div>
            <div style="margin-top:12px; font-size:11px; opacity:0.85; font-style:italic; border-top:1px solid rgba(255,255,255,0.2); padding-top:8px;">"${preview}"</div>
            <button class="fnf-learn-more-btn" style="
              margin-top:12px;
              background:rgba(255,255,255,0.2);
              border:1px solid rgba(255,255,255,0.3);
              color:#fff;
              padding:8px 16px;
              border-radius:6px;
              font-size:12px;
              font-weight:600;
              cursor:pointer;
              width:100%;
              transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
              Learn More →
            </button>
          </div>
          <button class="close-overlay" style="background:transparent; border:none; color:#fff; font-size:18px; cursor:pointer; line-height:1; flex-shrink:0;">×</button>
        </div>
      `;
      
      const resultOverlay = createTextOverlayAbsolute(rect, resultContent, backgroundColor);
      
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
  const percentage = result.percentage || 0;
  const preview = text.slice(0, 200) + (text.length > 200 ? '…' : '');
  
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'fnf-fact-check-backdrop';
  backdrop.className = 'fnf-fact-check-panel-backdrop';
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
  const loadingOverlay = createTextOverlayAbsolute(rect, '🔄 Fact checking...', 'rgba(30, 64, 175, 0.95)');
  
  // Perform fact check
  performTextFactCheck(text, rect, loadingOverlay);
}

// Initialize text selection listeners
function initTextSelectionFactCheck() {
  // Listen for text selection
  document.addEventListener('mouseup', (e) => {
    // Don't interfere with clicking our own button
    if (e.target?.id === 'fnf-text-selection-button') return;
    
    // Small delay to ensure selection is complete
    setTimeout(() => handleTextSelection(), 10);
  });
  
  // Also listen to selection change for keyboard selection
  document.addEventListener('selectionchange', () => {
    handleTextSelection();
  });
  
  // Hide button when clicking elsewhere
  document.addEventListener('mousedown', (e) => {
    if (e.target?.id === 'fnf-text-selection-button') return;
    
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

