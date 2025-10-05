<template>
  <div>
    <!-- Floating Toolbar -->
    <FloatingToolbar 
      v-if="showToolbar"
      @fact-check="startFactCheckSelection"
      @close="unmountApp"
    />
    
    <!-- Unified Fact Check Highlight (hover + bubble in one) -->
    <FactCheckHighlight
      v-if="selectionMode.active"
      :active="true"
      :is-extension-element="isExtensionElement"
      :ref="el => factCheckHighlight.ref = el"
      @element-selected="handleElementSelection"
      @cancel="stopFactCheckSelection"
      @close="stopFactCheckSelection"
      @learn-more="handleLearnMore"
    />
    
    <!-- Side Panel -->
    <FactCheckSidePanel
      v-if="sidePanel.visible"
      :visible="true"
      :result="sidePanel.result"
      :text="sidePanel.text"
      :mode="sidePanel.mode"
      @close="closeSidePanel"
    />
    
    <!-- Notification Toast -->
    <NotificationToast
      v-if="notification.visible"
      :message="notification.message"
      :type="notification.type"
      @close="closeNotification"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import FloatingToolbar from './components/FloatingToolbar.vue';
import FactCheckHighlight from './components/FactCheckHighlight.vue';
import FactCheckSidePanel from './components/FactCheckSidePanel.vue';
import NotificationToast from './components/NotificationToast.vue';

// Props
const props = defineProps({
  onUnmount: Function
});

// State
const showToolbar = ref(true);

const selectionMode = reactive({
  active: false,
  prevCursor: ''
});

const factCheckHighlight = reactive({
  ref: null
});

const sidePanel = reactive({
  visible: false,
  result: null,
  text: '',
  mode: 'text'
});

const notification = reactive({
  visible: false,
  message: '',
  type: 'warning'
});

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

// Notification
function showNotification(message, type = 'warning') {
  notification.visible = true;
  notification.message = message;
  notification.type = type;
}

function closeNotification() {
  notification.visible = false;
}

// Selection mode
function startFactCheckSelection() {
  selectionMode.active = true;
  selectionMode.prevCursor = document.body.style.cursor;
  document.body.style.cursor = 'crosshair';
  console.log('[Selection Mode] Started');
}

function stopFactCheckSelection() {
  if (!selectionMode.active) return;
  
  selectionMode.active = false;
  document.body.style.cursor = selectionMode.prevCursor || '';
  console.log('[Selection Mode] Stopped');
}

// Element selection handler
async function handleElementSelection(target) {
  // Don't stop selection mode yet - let the component handle the transition
  
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
    stopFactCheckSelection();
    return;
  }
  
  console.log('Fact-checking clicked element:', target);
  console.log('Container element used for extraction:', container);
  console.log('Extracted text (sent to backend):', text);

  // Wait for next tick to ensure ref is set
  await new Promise(resolve => setTimeout(resolve, 0));
  
  if (factCheckHighlight.ref) {
    factCheckHighlight.ref.setState_Loading('Fact checking…');
    
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
        factCheckHighlight.ref.setState_Result(result, text);
      } else {
        console.error('Fact-check failed:', response);
        factCheckHighlight.ref.setState_Error(`Fact-check failed: ${response?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Fact-check exception:', err);
      factCheckHighlight.ref.setState_Error(`Fact-check error: ${String(err?.message || err)}`);
    }
  }
}

// Bubble handlers
function handleLearnMore({ result, text }) {
  stopFactCheckSelection();
  showSidePanel(result, text, 'text');
}

// Side panel handlers
function showSidePanel(result, text, mode = 'text') {
  sidePanel.visible = true;
  sidePanel.result = result;
  sidePanel.text = text;
  sidePanel.mode = mode;
}

function closeSidePanel() {
  sidePanel.visible = false;
  sidePanel.result = null;
  sidePanel.text = '';
  sidePanel.mode = 'text';
}

// App unmount
function unmountApp() {
  stopFactCheckSelection();
  if (props.onUnmount) {
    props.onUnmount();
  }
}

// Expose methods for external calls (URL monitoring)
defineExpose({
  showSidePanel
});
</script>
