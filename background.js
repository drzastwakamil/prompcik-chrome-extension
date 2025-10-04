// Background service worker (MV3)
// - Handles API calls to the backend
// - Provides context menu to analyze selected text

const DEFAULT_BACKEND_URL = 'https://next-prompcik.vercel.app/api/evaluate';
const FNF_BACKEND_ANALYSIS_ENABLED = true; // Backend is now available


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
  const body = { text };
  
  console.log('Calling backend:', backendUrl);
  console.log('Request body:', body);
  
  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Backend error response:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      url: backendUrl
    });
    throw new Error(`Backend error ${response.status}: ${errorText || response.statusText}`);
  }
  
  const result = await response.json();
  console.log('Backend response:', result);
  return result;
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


