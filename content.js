// Content script - runs on every webpage
console.log('DOM Reader & Overlay Extension loaded');

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

function getCenterElement() {
  const x = Math.floor(window.innerWidth / 2);
  const y = Math.floor(window.innerHeight / 2);
  return document.elementFromPoint(x, y);
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

function getUserSelectionText() {
  const sel = window.getSelection && window.getSelection();
  if (!sel || sel.rangeCount === 0) return '';
  const text = sel.toString().replace(/\s+/g, ' ').trim();
  return text;
}

function getLargestVisibleArticleCandidate() {
  const candidates = Array.from(document.querySelectorAll('article, [role="article"], .post, .feed, .story, .news, .card'));
  let best = null;
  let bestArea = 0;
  for (const el of candidates) {
    if (!isElementActuallyVisible(el)) continue;
    const rect = el.getBoundingClientRect();
    const width = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
    const height = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    const area = Math.max(0, width) * Math.max(0, height);
    if (area > bestArea) {
      bestArea = area;
      best = el;
    }
  }
  return best;
}

function findLikelyPostContainer() {
  const center = getCenterElement();
  const platformSelectors = [
    // X / Twitter
    'article[data-testid="tweet"]',
    'div[data-testid="tweet"]',
    // Facebook
    'div[role="article"]',
    'div[data-ad-preview] div[role="article"]',
    // Reddit
    'div[data-testid="post-container"]',
    '.Post',
    'shreddit-post',
    // LinkedIn
    'div.feed-shared-update-v2',
    'div.feed-shared-inline-show-more-text',
    // YouTube comments
    'ytd-comment-thread-renderer',
    // Generic
    'article',
    '[role="article"]'
  ];

  let container = null;
  if (center) {
    container = findClosestMatchingAncestor(center, platformSelectors);
  }
  if (!container) {
    container = getLargestVisibleArticleCandidate();
  }
  return container;
}

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

function extractLikelyPostText() {
  // 1) Use user selection if it's reasonably long
  const selection = getUserSelectionText();
  if (selection && selection.length >= 60) {
    return { text: selection, strategy: 'selection' };
  }
  // 2) Find a likely post container near viewport center
  const container = findLikelyPostContainer();
  const text = extractTextFromKnownContainer(container);
  if (text && text.length >= 60) {
    return { text, strategy: 'container' };
  }
  // 3) Fallback: grab visible paragraphs in the viewport center
  const fallback = getVisibleTextFromElement(document.body);
  return { text: fallback, strategy: 'fallback' };
}

async function analyzeCurrentVisiblePost() {
  const { text, strategy } = extractLikelyPostText();
  console.log('text', text, 'strategy', strategy)
  if (!text || text.length < 30) {
    console.error('FakeNewsFilter: no sufficient text found for analysis', { strategy });
    try {
      // Trigger background debugger injection for diagnostics
      await chrome.runtime.sendMessage({ action: 'debugExtraction', meta: { reason: 'NO_TEXT', url: location.href } });
    } catch (_) {}
    return { success: false, error: 'NO_TEXT' };
  }
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeText',
      text,
      url: window.location.href,
      source: `content-${strategy}`
    });
    if (response && response.success) {
      showAnalysisOverlay(response.result, text);
      return { success: true };
    }
    throw new Error(response?.error || 'Unknown error');
  } catch (error) {
    console.error('FakeNewsFilter: analysis error', { error: String(error) });
    try {
      await chrome.runtime.sendMessage({ action: 'debugExtraction', meta: { reason: 'ANALYSIS_ERROR', error: String(error), url: location.href } });
    } catch (_) {}
    return { success: false, error: error.message };
  }
}

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
  } else if (request.action === 'analyzeVisiblePost') {
    // Fire-and-forget: start analysis and ACK immediately
    (async () => { await analyzeCurrentVisiblePost(); })();
    sendResponse({ success: true, started: true });
    return false;
  } else if (request.action === 'getDiscoveryStatus') {
    try {
      const status = (window.__fnfPDS && typeof window.__fnfPDS.getStatus === 'function') ? window.__fnfPDS.getStatus() : { running: false };
      sendResponse({ success: true, status });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return false;
  } else if (request.action === 'getDiscoveredPosts') {
    try {
      const posts = (window.__fnfPDS && typeof window.__fnfPDS.getDiscoveredPosts === 'function') ? window.__fnfPDS.getDiscoveredPosts() : [];
      sendResponse({ success: true, data: posts });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return false;
  } else if (request.action === 'forceScan') {
    try {
      if (window.__fnfPDS && typeof window.__fnfPDS.scanInitialCandidates === 'function') {
        window.__fnfPDS.scanInitialCandidates(document);
      }
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

// Add a simple overlay on load as a demo
setTimeout(() => {
  addOverlayElement({
    text: '🎉 Extension Active! (Drag me)',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(59, 130, 246, 0.95)'
  });
  // Provide a quick action to analyze the visible post
  const action = document.createElement('button');
  action.textContent = '🛡️ Analyze visible post';
  action.style.background = 'transparent';
  action.style.border = '1px solid rgba(255,255,255,0.6)';
  action.style.color = '#fff';
  action.style.padding = '6px 8px';
  action.style.borderRadius = '6px';
  action.style.fontSize = '12px';
  action.style.marginTop = '8px';
  const container = addOverlayElement({
    text: '<strong>Fake News Filter</strong><br/><span style="font-size:12px; opacity:0.9;">Analyze what\'s on screen</span>',
    top: '60px',
    right: '20px',
    backgroundColor: 'rgba(16, 185, 129, 0.95)'
  });
  container.appendChild(action);
  action.addEventListener('click', () => analyzeCurrentVisiblePost());
}, 1000);

// ------------------------------------------------------------
// PostDiscoveryService — efficiently finds and queues new posts
// ------------------------------------------------------------
(function initPostDiscoveryService() {
  const CANDIDATE_SELECTORS = [
    'article[data-testid="tweet"]',
    'div[data-testid="tweet"]',
    'div[role="article"]',
    'div[data-ad-preview] div[role="article"]',
    'div[data-testid="post-container"]',
    '.Post',
    'shreddit-post',
    'div.feed-shared-update-v2',
    'div.feed-shared-inline-show-more-text',
    'ytd-comment-thread-renderer',
    'article',
    '[role="article"]'
  ];

  const DEBUG_PDS = true;
  function pdsLog(...args) {
    if (!DEBUG_PDS) return;
    try { console.log('FakeNewsFilter:PDS', ...args); } catch (_) {}
  }

  const MAX_INITIAL_CANDIDATES = 500;
  const MIN_TEXT_LENGTH = 60;
  const PROCESS_PER_IDLE = 2;

  const scheduleIdle = window.requestIdleCallback || function (cb, opts) {
    return setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), Math.min((opts && opts.timeout) || 300, 500));
  };
  const cancelIdle = window.cancelIdleCallback || clearTimeout;

  class PostDiscoveryService {
    constructor() {
      this.running = false;
      this.intersectionObserver = null;
      this.mutationObserver = null;
      this.observedElements = new WeakSet();
      this.enqueuedElements = new WeakSet();
      this.processedElements = new WeakSet();
      this.attemptCounts = new WeakMap();
      this.elementId = new WeakMap();
      this.nextId = 1;
      this.queue = [];
      this.results = [];
      this.pendingScanRoots = new Set();
      this.scanScheduled = false;
      this.idleHandle = null;

      this.onIntersect = this.onIntersect.bind(this);
      this.onMutations = this.onMutations.bind(this);
      this.processQueue = this.processQueue.bind(this);
      this.onUserClick = this.onUserClick.bind(this);
    }

    start() {
      if (this.running) return;
      this.running = true;
      try {
        this.intersectionObserver = new IntersectionObserver(this.onIntersect, {
          root: null,
          rootMargin: '0px 0px 200px 0px',
          threshold: [0.25, 0.5, 0.75]
        });
      } catch (_) {
        this.intersectionObserver = null;
      }
      pdsLog('start', { hasIntersectionObserver: !!this.intersectionObserver });

      try {
        this.mutationObserver = new MutationObserver(this.onMutations);
        this.mutationObserver.observe(document.body, { childList: true, subtree: true });
      } catch (_) {}

      pdsLog('initial scan kick-off');
      this.scanInitialCandidates(document);
      window.addEventListener('click', this.onUserClick, { capture: true, passive: true });
    }

    stop() {
      if (!this.running) return;
      this.running = false;
      try { this.intersectionObserver && this.intersectionObserver.disconnect(); } catch (_) {}
      try { this.mutationObserver && this.mutationObserver.disconnect(); } catch (_) {}
      window.removeEventListener('click', this.onUserClick, { capture: true });
      if (this.idleHandle) { try { cancelIdle(this.idleHandle); } catch (_) {} }
      this.idleHandle = null;
    }

    getStatus() {
      return {
        running: this.running,
        queueLength: this.queue.length,
        observedApprox: undefined,
        discoveredCount: this.results.length
      };
    }

    getDiscoveredPosts() {
      return this.results.slice();
    }

    ensureId(el) {
      let id = this.elementId.get(el);
      if (!id) {
        id = 'fnf-post-' + (this.nextId++);
        this.elementId.set(el, id);
        try { el.dataset.fnfId = id; } catch (_) {}
      }
      return id;
    }

    scanInitialCandidates(root) {
      try {
        const selector = CANDIDATE_SELECTORS.join(',');
        const all = Array.from((root || document).querySelectorAll(selector)).slice(0, MAX_INITIAL_CANDIDATES);
        for (const el of all) this.observeCandidate(el);
        pdsLog('scanInitialCandidates', { count: all.length });
      } catch (_) {}
    }

    onMutations(mutations) {
      let added = 0;
      for (const m of mutations) {
        m.addedNodes && m.addedNodes.forEach((node) => {
          if (!node || node.nodeType !== 1) return;
          this.pendingScanRoots.add(node);
          added++;
        });
      }
      pdsLog('mutations detected; scheduling scan', { addedApprox: added, pendingRoots: this.pendingScanRoots.size });
      this.scheduleScan();
    }

    scheduleScan() {
      if (this.scanScheduled) return;
      this.scanScheduled = true;
      pdsLog('scheduleScan');
      scheduleIdle(() => {
        try {
          const roots = Array.from(this.pendingScanRoots);
          this.pendingScanRoots.clear();
          const selector = CANDIDATE_SELECTORS.join(',');
          let count = 0;
          for (const root of roots) {
            try {
              if (root.matches && root.matches(selector)) this.observeCandidate(root);
            } catch (_) {}
            try {
              const found = root.querySelectorAll ? root.querySelectorAll(selector) : [];
              for (const el of Array.from(found)) {
                this.observeCandidate(el);
                count++;
                if (count >= MAX_INITIAL_CANDIDATES) break;
              }
            } catch (_) {}
            if (count >= MAX_INITIAL_CANDIDATES) break;
          }
          pdsLog('scan flushed', { newCandidates: count });
        } finally {
          this.scanScheduled = false;
        }
      }, { timeout: 800 });
    }

    observeCandidate(el) {
      if (!el || this.observedElements.has(el) || this.processedElements.has(el)) return;
      this.observedElements.add(el);
      if (this.intersectionObserver) {
        try { this.intersectionObserver.observe(el); } catch (_) {}
      } else {
        // Fallback: immediately enqueue if visible
        if (isElementActuallyVisible(el)) this.enqueue(el);
      }
      try { pdsLog('observeCandidate', { id: this.ensureId(el), tag: el.tagName }); } catch (_) {}
    }

    onIntersect(entries) {
      for (const entry of entries) {
        if (!entry || !entry.target) continue;
        const el = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          try { pdsLog('intersect', { id: this.ensureId(el), ratio: Number(entry.intersectionRatio.toFixed ? entry.intersectionRatio.toFixed(2) : entry.intersectionRatio) }); } catch (_) {}
          this.enqueue(el);
        }
      }
    }

    enqueue(el) {
      if (!el || this.enqueuedElements.has(el) || this.processedElements.has(el)) return;
      this.enqueuedElements.add(el);
      this.queue.push(el);
      try { pdsLog('enqueue', { id: this.ensureId(el), queueLength: this.queue.length }); } catch (_) {}
      this.scheduleProcessing();
    }

    scheduleProcessing() {
      if (this.idleHandle) return;
      pdsLog('scheduleProcessing');
      this.idleHandle = scheduleIdle(this.processQueue, { timeout: 1000 });
    }

    processQueue(deadline) {
      this.idleHandle = null;
      pdsLog('processQueue start', { queueLength: this.queue.length });
      let processedThisTurn = 0;
      try {
        while (this.queue.length > 0 && (processedThisTurn < PROCESS_PER_IDLE) && (deadline.timeRemaining ? (deadline.timeRemaining() > 8 || deadline.didTimeout) : true)) {
          const el = this.queue.shift();
          if (!el) continue;
          this.enqueuedElements.delete(el);
          if (this.processedElements.has(el)) continue;

          // Extract text from the container using existing helper
          let text = '';
          try { text = extractTextFromKnownContainer(el) || ''; } catch (_) { text = ''; }
          const attempts = (this.attemptCounts.get(el) || 0) + 1;
          this.attemptCounts.set(el, attempts);

          if (text && text.replace(/\s+/g, ' ').trim().length >= MIN_TEXT_LENGTH) {
            const id = this.ensureId(el);
            const cleaned = text.replace(/\s{2,}/g, ' ').trim();
            const snippet = cleaned.slice(0, 280) + (cleaned.length > 280 ? '…' : '');
            this.results.push({ id, text: cleaned, snippet, length: cleaned.length, url: window.location.href, ts: Date.now(), strategy: 'observer' });
            try { el.classList.add('fnf-processed'); } catch (_) {}
            this.processedElements.add(el);
            try { this.intersectionObserver && this.intersectionObserver.unobserve(el); } catch (_) {}
            pdsLog('processed', { id, length: cleaned.length });
            processedThisTurn++;
          } else {
            // Not enough text; allow one more attempt later when content expands
            if (attempts >= 2) {
              // Give up and stop observing to avoid repeated work
              try { this.intersectionObserver && this.intersectionObserver.unobserve(el); } catch (_) {}
              this.processedElements.add(el);
              try { pdsLog('giveup', { id: this.ensureId(el), attempts }); } catch (_) {}
            } else {
              try { pdsLog('insufficient text; will retry', { id: this.ensureId(el), attempts }); } catch (_) {}
            }
          }
        }
      } finally {
        if (this.queue.length > 0) {
          this.scheduleProcessing();
        }
        pdsLog('processQueue end', { remaining: this.queue.length, processedThisTurn });
      }
    }

    onUserClick(e) {
      try {
        const target = e.target;
        if (!target) return;
        const container = findClosestMatchingAncestor(target, CANDIDATE_SELECTORS) || null;
        if (container) {
          try { pdsLog('click enqueue', { id: this.ensureId(container) }); } catch (_) {}
          this.enqueue(container);
        }
      } catch (_) {}
    }
  }

  try {
    const service = new PostDiscoveryService();
    service.start();
    window.__fnfPDS = service;
    pdsLog('service initialized');
  } catch (e) {
    // Swallow errors; service is optional
  }
})();

