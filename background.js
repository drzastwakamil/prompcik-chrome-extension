// Background service worker (MV3) - handles cross-origin fetches and analysis

chrome.runtime.onInstalled.addListener(() => {
  // Optional: initialization
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === 'bgFetchCats') {
    (async () => {
      try {
        const imgResp = await fetch('https://api.thecatapi.com/v1/images/search?limit=1');
        if (!imgResp.ok) throw new Error(`Image fetch failed: ${imgResp.status}`);
        const images = await imgResp.json();

        const factResp = await fetch('https://catfact.ninja/fact');
        if (!factResp.ok) throw new Error(`Fact fetch failed: ${factResp.status}`);
        const fact = await factResp.json();

        sendResponse({ success: true, data: { image: images?.[0]?.url, fact: fact?.fact } });
      } catch (error) {
        sendResponse({ success: false, error: error?.message || String(error) });
      }
    })();
    return true; // async response
  }
});

// Observe web requests for debugging per docs
try {
  const filter = { urls: [
    'https://api.thecatapi.com/*',
    'https://catfact.ninja/*'
  ] };

  chrome.webRequest.onBeforeRequest.addListener((details) => {
    console.debug('onBeforeRequest', details.method, details.url);
  }, filter);

  chrome.webRequest.onCompleted.addListener((details) => {
    console.debug('onCompleted', details.statusCode, details.url);
  }, filter);

  chrome.webRequest.onErrorOccurred.addListener((details) => {
    console.warn('onErrorOccurred', details.error, details.url);
  }, filter);
} catch (e) {
  // noop: webRequest requires permissions; ignore if unavailable
}

// Background service worker (MV3)
// - Handles API calls to the backend
// - Provides context menu to analyze selected text

const DEFAULT_BACKEND_URL = 'https://your-backend.example.com/api/analyze';
const FNF_BACKEND_ANALYSIS_ENABLED = false; // Disable backend until available

// Chrome Debugger protocol version
const DEBUG_PROTOCOL_VERSION = '1.3';

async function callBackendAnalyze({ text, url, source }) {
  if (!FNF_BACKEND_ANALYSIS_ENABLED) {
    // Stubbed response for development
    return {
      label: 'Preview only',
      summary: 'Backend disabled — returning stub.',
      confidence: 0.0,
      source
    };
  }
  const backendUrl = (await chrome.storage?.sync?.get?.('backendUrl'))?.backendUrl || DEFAULT_BACKEND_URL;
  const body = { text, pageUrl: url, source };
  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Backend error ${response.status}: ${errorText || response.statusText}`);
  }
  return await response.json();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-selection',
    title: 'Analyze with Fake News Filter',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'analyze-selection') return;
  try {
    const selectionText = info.selectionText?.trim();
    if (!selectionText) return;
    const result = await callBackendAnalyze({ text: selectionText, url: tab?.url, source: 'contextMenu' });
    if (tab?.id != null) {
      chrome.tabs.sendMessage(tab.id, { action: 'analysisResult', payload: { result, origin: 'contextMenu' } });
    }
  } catch (error) {
    if (tab?.id != null) {
      chrome.tabs.sendMessage(tab.id, { action: 'analysisError', payload: { message: error.message, origin: 'contextMenu' } });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'debugExtraction') {
    const tabId = sender?.tab?.id;
    if (tabId == null) {
      sendResponse?.({ success: false, error: 'No tabId available for debugger attach' });
      return false;
    }
    (async () => {
      const target = { tabId };
      try {
        await chrome.debugger.attach(target, DEBUG_PROTOCOL_VERSION);
      } catch (e) {
        // If DevTools is already attached, just report failure.
        sendResponse?.({ success: false, error: String(e) });
        return;
      }

      try {
        // Enable basic domains and Debugger domain
        await chrome.debugger.sendCommand(target, 'Runtime.enable');
        await chrome.debugger.sendCommand(target, 'DOM.enable');
        await chrome.debugger.sendCommand(target, 'Debugger.enable');

        // Inject console.error diagnostics and trigger a pause. User can open DevTools to inspect.
        await chrome.debugger.sendCommand(target, 'Runtime.evaluate', {
          expression: `(() => {
            try {
              const meta = ${JSON.stringify(message?.meta || {})};
              const x = Math.floor(window.innerWidth / 2);
              const y = Math.floor(window.innerHeight / 2);
              const center = document.elementFromPoint(x, y);
              const selection = window.getSelection && window.getSelection();
              const selectionLen = selection ? (selection + '').replace(/\\s+/g, ' ').trim().length : 0;
              const candidates = Array.from(document.querySelectorAll('article, [role=\\"article\\"], .post, .feed, .story, .news, .card'));
              const visibleCandidates = candidates.filter(el => {
                const st = window.getComputedStyle(el);
                if (st.visibility === 'hidden' || st.display === 'none' || parseFloat(st.opacity || '1') === 0) return false;
                const r = el.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
              }).length;
              const centerPath = [];
              let el = center;
              for (let i = 0; el && i < 5; i++) { centerPath.push(el.tagName || el.nodeName); el = el.parentElement; }
              const payload = { meta, viewport: { w: window.innerWidth, h: window.innerHeight }, selectionLen, centerTagChain: centerPath, candidateCount: candidates.length, visibleCandidateCount: visibleCandidates, url: location.href, title: document.title };
              console.error('FakeNewsFilter analyze failure — open DevTools (Cmd+Option+I) to inspect', payload);
              debugger;
            } catch (err) {
              console.error('FakeNewsFilter debug injection failed', String(err));
            }
          })()`,
          includeCommandLineAPI: false,
          returnByValue: false,
          awaitPromise: false
        });
        sendResponse?.({ success: true });
      } catch (error) {
        // Fall back to logging if evaluate fails
        try {
          await chrome.debugger.sendCommand(target, 'Runtime.evaluate', {
            expression: `console.error('FakeNewsFilter debugger attach failed', ${JSON.stringify(JSON.stringify({ error: String(error), meta: message?.meta || {} }))})`,
            includeCommandLineAPI: false,
            returnByValue: false
          });
        } catch (_) {}
        sendResponse?.({ success: false, error: String(error) });
      } finally {
        try { await chrome.debugger.detach(target); } catch (_) {}
      }
    })();
    return true; // async
  }

  if (message?.action === 'analyzeText') {
    (async () => {
      try {
        const result = await callBackendAnalyze({ text: message.text, url: message.url, source: message.source || 'content' });
        sendResponse({ success: true, result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // keep channel open
  }
  return false;
});


