<template>
  <div>
    <!-- Full-page overlay backdrop (only in bubble mode) -->
    <div
      v-if="isVisible && currentElement && mode === 'bubble'"
      class="fnf-page-overlay"
      :style="pageOverlayStyle"
      data-fnf-element="true"
      @click="onClose"
    ></div>
    
    <div
      v-if="isVisible && currentElement"
      ref="mainContainer"
      class="fnf-fact-check-highlight"
      data-fnf-element="true"
      :style="mainContainerStyle"
    >
      <!-- Highlight box (always visible when component is active) -->
      <div 
        class="fnf-highlight-border"
        :style="highlightBorderStyle"
        data-fnf-element="true"
      ></div>
      
      <!-- Bubble (only visible after click) -->
      <div 
        v-if="mode === 'bubble'"
        ref="bubbleContainer"
        class="fnf-bubble-wrapper" 
        :style="bubbleWrapperStyle"
        data-fnf-element="true"
      >
        <!-- Tail (triangle pointing up) -->
        <div 
          class="fnf-overlay-tail" 
          :style="tailStyle"
          data-fnf-element="true"
        ></div>
        
        <!-- Bubble overlay -->
        <div 
          class="fnf-attached-overlay" 
          :style="overlayStyle"
          data-fnf-element="true"
        >
          <!-- Close Button (top-right) -->
          <button 
            class="close-overlay" 
            @click="onClose"
            @mouseenter="closeHover = true"
            @mouseleave="closeHover = false"
            :style="closeBtnStyle"
            data-fnf-element="true"
          >
            ×
          </button>
          
          <!-- Content -->
          <div class="fnf-bubble-content" data-fnf-element="true">
            <!-- Loading State -->
            <div v-if="state === 'loading'" style="display:flex; align-items:center; gap:10px;">
              <div class="spinner"></div>
              <span style="font-weight:600;">{{ loadingMessage }}</span>
            </div>
            
            <!-- Result State -->
            <div v-else-if="state === 'result'">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                <div :style="iconStyle">{{ icon }}</div>
                <strong style="font-size:18px; font-weight:700; line-height:1.2; flex:1;">
                  {{ resultLabel }}
                </strong>
              </div>
              <div style="font-size:14px; line-height:1.6; margin-bottom:16px; opacity:0.95;">
                {{ resultSummary }}
              </div>
              <div class="content-preview">
                "{{ contentPreview }}"
              </div>
              <button 
                class="learn-more-btn" 
                :style="learnMoreBtnStyle"
                @click="onLearnMore"
                @mouseenter="learnMoreHover = true"
                @mouseleave="learnMoreHover = false"
              >
                Learn More →
              </button>
            </div>
            
            <!-- Error State -->
            <div v-else-if="state === 'error'">
              ❌ {{ errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';

// Props
const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  isExtensionElement: {
    type: Function,
    default: () => false
  }
});

// Emits
const emit = defineEmits(['element-selected', 'cancel', 'close', 'learn-more']);

// Refs
const mainContainer = ref(null);
const bubbleContainer = ref(null);
const currentElement = ref(null);

// Mode: 'hover' (green highlight) or 'bubble' (showing fact-check result)
const mode = ref('hover');

// Bubble state
const state = ref('loading'); // 'loading', 'result', 'error'
const loadingMessage = ref('Fact checking…');
const errorMessage = ref('');
const result = ref(null);
const analyzedText = ref('');

// UI state
const closeHover = ref(false);
const learnMoreHover = ref(false);

// Constants
const borderOffset = 4;
const overlayWidth = 480;
const tailHeight = 16;
const minMargin = 10; // Minimum margin from viewport edges

// Track element bounding (same tracking for both hover and bubble!)
const { 
  width, 
  height, 
  top, 
  left
} = useElementBounding(currentElement, {
  windowResize: true,
  windowScroll: true,
  immediate: true
});

// Track window size
const { width: windowWidth, height: windowHeight } = useWindowSize();

// Bubble positioning state
const bubblePosition = ref('bottom'); // 'top', 'bottom', 'middle'
const bubbleHeight = ref(0); // Track actual bubble height

// Visibility
const isVisible = computed(() => props.active && currentElement.value !== null);

// Highlight color - changes based on mode and state
const highlightColor = computed(() => {
  if (mode.value === 'hover') {
    return '#3b82f6'; // blue for hover (same as validating)
  }
  // Bubble mode
  if (!result.value) return '#6366f1'; // blue loading
  
  // Map status to colors
  const status = result.value.status;
  if (status === 'fake') return '#dc2626'; // red
  if (status === 'true') return '#22c55e'; // green
  if (status === 'unsure') return '#f59e0b'; // yellow/amber
  if (status === 'no_data') return '#3b82f6'; // blue (better contrast)
  
  return '#3b82f6'; // default blue
});

// Page overlay style - full-page backdrop with hole for highlighted element
const pageOverlayStyle = computed(() => {
  if (!currentElement.value) return {};
  
  // Calculate the hole coordinates (the highlighted element position with border offset)
  const holeTop = Math.max(0, top.value - borderOffset);
  const holeLeft = Math.max(0, left.value - borderOffset);
  const holeRight = holeLeft + width.value + borderOffset * 2;
  const holeBottom = holeTop + height.value + borderOffset * 2;
  
  // Create a clip-path that covers everything except the highlighted area
  // Uses evenodd fill rule: outer rectangle (viewport) minus inner rectangle (hole)
  const clipPath = `polygon(
    evenodd,
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${holeLeft}px ${holeTop}px,
    ${holeLeft}px ${holeBottom}px,
    ${holeRight}px ${holeBottom}px,
    ${holeRight}px ${holeTop}px,
    ${holeLeft}px ${holeTop}px
  )`;
  
  return {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    clipPath: clipPath,
    WebkitClipPath: clipPath,
    zIndex: '999996',
    pointerEvents: 'auto',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
    animation: 'fnf-fade-in 0.3s ease'
  };
});

// Main container style - tracks the element with fixed positioning
const mainContainerStyle = computed(() => {
  if (!currentElement.value) return { display: 'none' };
  
  return {
    position: 'fixed',
    top: `${Math.max(0, top.value - borderOffset)}px`,
    left: `${Math.max(0, left.value - borderOffset)}px`,
    width: `${width.value + borderOffset * 2}px`,
    height: `${height.value + borderOffset * 2}px`,
    pointerEvents: 'none',
    // In bubble mode, highlight must be ABOVE overlay (999996), so use 999998
    // In hover mode, also keep it high
    zIndex: mode.value === 'hover' ? '999998' : '999998'
  };
});

// Highlight border style - always visible
const highlightBorderStyle = computed(() => {
  const borderWidth = mode.value === 'hover' ? 2 : 3;
  
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    border: `${borderWidth}px solid ${highlightColor.value}`,
    borderRadius: mode.value === 'hover' ? '6px' : '8px',
    background: `${highlightColor.value}${mode.value === 'hover' ? '14' : '15'}`,
    boxShadow: mode.value === 'bubble' ? `0 0 0 4px ${highlightColor.value}20` : 'none',
    transition: mode.value === 'bubble' 
      ? 'border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, border-radius 0.2s ease'
      : 'none',
    pointerEvents: 'none'
  };
});

// Calculate available space in each direction
const availableSpace = computed(() => {
  const highlightTop = top.value - borderOffset;
  const highlightLeft = left.value - borderOffset;
  const highlightBottom = highlightTop + height.value + borderOffset * 2;
  const highlightRight = highlightLeft + width.value + borderOffset * 2;
  
  return {
    top: highlightTop - minMargin,
    bottom: windowHeight.value - highlightBottom - minMargin,
    left: highlightLeft - minMargin,
    right: windowWidth.value - highlightRight - minMargin
  };
});

// Determine best bubble position based on available space
const calculateBestPosition = () => {
  const space = availableSpace.value;
  const estimatedBubbleHeight = bubbleHeight.value || 200; // Use actual or estimate
  
  // Priority: bottom > top > middle
  // Check if bubble fits below
  if (space.bottom >= estimatedBubbleHeight) {
    return 'bottom';
  }
  
  // Check if bubble fits above
  if (space.top >= estimatedBubbleHeight) {
    return 'top';
  }
  
  // If neither top nor bottom has enough space, position in middle (vertically centered)
  return 'middle';
};

// Calculate bubble left position (centered horizontally on the highlight)
const bubbleLeftPosition = computed(() => {
  const highlightCenterX = width.value / 2;
  let bubbleLeft = highlightCenterX - (overlayWidth / 2);
  
  // Calculate absolute position in viewport to check bounds
  const absoluteBubbleLeft = left.value - borderOffset + bubbleLeft;
  
  // Adjust if bubble would go off screen horizontally
  if (absoluteBubbleLeft < minMargin) {
    bubbleLeft = minMargin - (left.value - borderOffset);
  } else if (absoluteBubbleLeft + overlayWidth > windowWidth.value - minMargin) {
    bubbleLeft = (windowWidth.value - minMargin - overlayWidth) - (left.value - borderOffset);
  }
  
  return bubbleLeft;
});

// Calculate bubble top position for middle placement (fixed position in viewport)
const bubbleTopPositionMiddle = computed(() => {
  const estimatedBubbleHeight = bubbleHeight.value || 200;
  const highlightTop = top.value - borderOffset;
  
  // Position bubble at a fixed vertical position in viewport (centered or from top)
  // Calculate the target position in viewport coordinates
  let targetViewportTop;
  
  // Try to center in viewport
  const viewportCenter = windowHeight.value / 2;
  targetViewportTop = viewportCenter - (estimatedBubbleHeight / 2);
  
  // Ensure it stays within margins
  if (targetViewportTop < minMargin) {
    targetViewportTop = minMargin;
  } else if (targetViewportTop + estimatedBubbleHeight > windowHeight.value - minMargin) {
    targetViewportTop = windowHeight.value - minMargin - estimatedBubbleHeight;
  }
  
  // Convert from viewport coordinates to position relative to the highlight container
  const bubbleTop = targetViewportTop - highlightTop;
  
  return bubbleTop;
});

// Bubble wrapper positioned dynamically based on best position
const bubbleWrapperStyle = computed(() => {
  const gap = tailHeight + 16;
  const pos = bubblePosition.value;
  
  let style = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '1',
    overflow: 'visible', // Ensure tail is not clipped
    left: `${bubbleLeftPosition.value}px`,
    width: `${overlayWidth}px`
  };
  
  if (pos === 'bottom') {
    // Position below the highlight
    style.top = `${height.value + borderOffset * 2 + gap}px`;
  } else if (pos === 'top') {
    // Position above the highlight
    style.bottom = `${height.value + borderOffset * 2 + gap}px`;
  } else if (pos === 'middle') {
    // Position vertically centered in viewport
    style.top = `${bubbleTopPositionMiddle.value}px`;
  }
  
  return style;
});

// Tail positioned and oriented based on bubble position
const tailStyle = computed(() => {
  const pos = bubblePosition.value;
  const highlightCenterX = width.value / 2;
  const tailLeft = highlightCenterX - bubbleLeftPosition.value;
  
  let style = {
    position: 'absolute',
    width: '0',
    height: '0',
    transition: 'border-color 0.3s ease',
    left: `${tailLeft}px`
  };
  
  // Determine tail direction based on position mode
  let tailPointsUp = true; // default: tail points up
  
  if (pos === 'bottom') {
    // Bubble is below highlight, tail points up
    tailPointsUp = true;
  } else if (pos === 'top') {
    // Bubble is above highlight, tail points down
    tailPointsUp = false;
  } else if (pos === 'middle') {
    // For middle mode, check if bubble is above or below the highlight
    const highlightTop = top.value - borderOffset;
    const highlightCenterY = highlightTop + (height.value + borderOffset * 2) / 2;
    const bubbleTop = highlightTop + bubbleTopPositionMiddle.value;
    const bubbleCenterY = bubbleTop + (bubbleHeight.value || 200) / 2;
    
    // If bubble center is above highlight center, tail points down
    tailPointsUp = bubbleCenterY > highlightCenterY;
  }
  
  if (tailPointsUp) {
    // Tail points up (bubble is below highlight)
    style.top = `0px`;
    style.transform = 'translateX(-50%) translateY(-100%)';
    style.borderLeft = `${tailHeight}px solid transparent`;
    style.borderRight = `${tailHeight}px solid transparent`;
    style.borderBottom = `${tailHeight}px solid ${tailColor.value}`;
  } else {
    // Tail points down (bubble is above highlight)
    style.bottom = `-32px`;
    style.transform = 'translateX(-50%) translateY(100%)';
    style.borderLeft = `${tailHeight}px solid transparent`;
    style.borderRight = `${tailHeight}px solid transparent`;
    style.borderTop = `${tailHeight}px solid ${tailColor.value}`;
  }
  
  return style;
});

// Overlay style
const overlayStyle = computed(() => {
  return {
    position: 'relative',
    background: backgroundColor.value,
    color: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    backdropFilter: 'blur(10px)',
    transition: 'background 0.3s ease',
    overflow: 'visible' // Ensure tail is not clipped
  };
});

// Background color based on state
const backgroundColor = computed(() => {
  if (state.value === 'loading') {
    return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
  } else if (state.value === 'error') {
    return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  } else if (state.value === 'result') {
    const status = result.value?.status;
    if (status === 'fake') {
      return 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'; // red
    } else if (status === 'true') {
      return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'; // green
    } else if (status === 'unsure') {
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; // yellow/amber
    } else if (status === 'no_data') {
      return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'; // blue (better contrast)
    }
    return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'; // default blue
  }
  return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
});

// Tail color - simplified to match highlight color
const tailColor = computed(() => {
  return highlightColor.value;
});

// Result computed properties
const isFakeNews = computed(() => result.value?.status === 'fake');

const percentage = computed(() => {
  const similarity = result.value?.similarity || 0;
  const confidence = result.value?.confidence || 0;
  const maxScore = Math.max(similarity, confidence);
  return Math.round(maxScore * 100);
});

const icon = computed(() => {
  const status = result.value?.status;
  if (status === 'fake') return '⚠️';
  if (status === 'true') return '✅';
  if (status === 'unsure') return '❓';
  return 'ℹ️'; // no_data or default
});

const resultLabel = computed(() => {
  const status = result.value?.status;
  if (status === 'fake') return 'Fake News Alert';
  if (status === 'true') return 'Verified Content';
  if (status === 'unsure') return 'Uncertain';
  return 'Not in Database'; // no_data or default
});

const resultSummary = computed(() => {
  const status = result.value?.status;
  if (status === 'fake') {
    return `This content has been flagged as fake news (${percentage.value}% confidence).`;
  } else if (status === 'true') {
    return `This content has been verified as true (${percentage.value}% confidence).`;
  } else if (status === 'unsure') {
    return `We're uncertain about this content (${percentage.value}% confidence). Please verify with additional sources.`;
  }
  return 'This content is not in our fact-checking database.';
});

const contentPreview = computed(() => {
  const maxLen = 160;
  const textToUse = analyzedText.value;
  return textToUse && textToUse.length > maxLen 
    ? textToUse.slice(0, maxLen) + '…' 
    : textToUse || '';
});

const iconStyle = computed(() => {
  const status = result.value?.status;
  let iconBg = 'rgba(255, 255, 255, 0.2)';
  let iconBorder = '2px solid rgba(255, 255, 255, 0.2)';
  
  if (status === 'fake') {
    iconBg = 'rgba(254, 226, 226, 0.25)';
    iconBorder = '2px solid rgba(254, 226, 226, 0.3)';
  } else if (status === 'true') {
    iconBg = 'rgba(187, 247, 208, 0.25)';
    iconBorder = '2px solid rgba(187, 247, 208, 0.3)';
  } else if (status === 'unsure') {
    iconBg = 'rgba(254, 243, 199, 0.25)';
    iconBorder = '2px solid rgba(254, 243, 199, 0.3)';
  }
  
  return {
    minWidth: '40px',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: iconBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: '0',
    border: iconBorder
  };
});

const learnMoreBtnStyle = computed(() => {
  const status = result.value?.status;
  let color = '#2563eb'; // default blue
  
  if (status === 'fake') color = '#dc2626'; // red
  else if (status === 'true') color = '#16a34a'; // green
  else if (status === 'unsure') color = '#d97706'; // amber
  else if (status === 'no_data') color = '#2563eb'; // blue
  
  return {
    background: 'rgba(255,255,255,0.98)',
    color: color,
    border: 'none',
    borderRadius: '12px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
    marginTop: '16px',
    boxShadow: learnMoreHover.value ? '0 8px 20px rgba(0, 0, 0, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: learnMoreHover.value ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)'
  };
});

const closeBtnStyle = computed(() => {
  return {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: closeHover.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    width: '32px',
    height: '32px',
    padding: '0',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '24px',
    lineHeight: '1',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    zIndex: '10',
    boxShadow: closeHover.value ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
  };
});

// Event handlers
const onMouseMove = (e) => {
  if (!props.active || mode.value === 'bubble') return;
  
  const el = e.target;
  
  // Skip extension elements, images, and SVGs
  if (props.isExtensionElement(el) || 
      el.tagName === 'IMG' || 
      el.tagName === 'image' || 
      el.tagName === 'svg' || 
      el.tagName === 'SVG' || 
      el instanceof SVGElement) {
    if (mode.value === 'hover') {
      currentElement.value = null;
    }
    return;
  }
  
  currentElement.value = el;
};

const onClick = (e) => {
  if (!props.active) return;
  
  // Skip extension elements, images, and SVGs
  if (props.isExtensionElement(e.target) ||
      e.target.tagName === 'IMG' || 
      e.target.tagName === 'image' || 
      e.target.tagName === 'svg' || 
      e.target.tagName === 'SVG' || 
      e.target instanceof SVGElement) {
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  // Transition from hover to bubble mode
  mode.value = 'bubble';
  
  // Calculate best position for bubble
  updateBubblePosition();
  
  // Emit element selected
  emit('element-selected', e.target);
};

const onKeyDown = (e) => {
  if (!props.active) return;
  
  if (e.key === 'Escape') {
    e.preventDefault();
    
    if (mode.value === 'bubble') {
      onClose();
    } else {
      currentElement.value = null;
      emit('cancel');
    }
  }
};

// Update bubble position based on available space
const updateBubblePosition = () => {
  bubblePosition.value = calculateBestPosition();
  console.log('[Bubble] Position calculated:', bubblePosition.value);
  
  // Schedule bubble measurement after render
  setTimeout(() => {
    measureBubbleHeight();
  }, 50);
};

// Measure actual bubble height once rendered
const measureBubbleHeight = () => {
  if (bubbleContainer.value) {
    const rect = bubbleContainer.value.getBoundingClientRect();
    bubbleHeight.value = rect.height;
    console.log('[Bubble] Measured height:', bubbleHeight.value);
    
    // Recalculate position if needed based on actual height
    const newPosition = calculateBestPosition();
    if (newPosition !== bubblePosition.value) {
      console.log('[Bubble] Repositioning from', bubblePosition.value, 'to', newPosition);
      bubblePosition.value = newPosition;
    }
  }
};

// Methods - exposed for parent to call
const setState_Loading = (message = 'Fact checking…') => {
  state.value = 'loading';
  loadingMessage.value = message;
};

const setState_Result = (resultData, text) => {
  console.log('[FactCheckHighlight] setState_Result called with:', { result: resultData, text });
  state.value = 'result';
  result.value = resultData;
  analyzedText.value = text;
  
  // Remeasure and reposition after content changes
  setTimeout(() => {
    measureBubbleHeight();
  }, 100);
};

const setState_Error = (message) => {
  state.value = 'error';
  errorMessage.value = message;
};

const onClose = () => {
  // Reset to hover mode
  mode.value = 'hover';
  state.value = 'loading';
  result.value = null;
  analyzedText.value = '';
  currentElement.value = null;
  bubbleHeight.value = 0;
  emit('close');
};

const onLearnMore = () => {
  emit('learn-more', { result: result.value, text: analyzedText.value });
};

const resetToHoverMode = () => {
  mode.value = 'hover';
  state.value = 'loading';
  result.value = null;
  analyzedText.value = '';
  currentElement.value = null;
  bubbleHeight.value = 0;
};

// Lifecycle hooks
onMounted(() => {
  if (props.active) {
    window.addEventListener('mousemove', onMouseMove, { capture: true, passive: true });
    window.addEventListener('click', onClick, { capture: true });
    window.addEventListener('keydown', onKeyDown, { capture: true });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove, { capture: true });
  window.removeEventListener('click', onClick, { capture: true });
  window.removeEventListener('keydown', onKeyDown, { capture: true });
  // Ensure scroll is restored on unmount
  enableBodyScroll();
});

// Watch for active prop changes
watch(() => props.active, (newActive) => {
  if (newActive) {
    window.addEventListener('mousemove', onMouseMove, { capture: true, passive: true });
    window.addEventListener('click', onClick, { capture: true });
    window.addEventListener('keydown', onKeyDown, { capture: true });
  } else {
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
    window.removeEventListener('click', onClick, { capture: true });
    window.removeEventListener('keydown', onKeyDown, { capture: true });
    currentElement.value = null;
    mode.value = 'hover';
    // Restore scroll when component becomes inactive
    enableBodyScroll();
  }
});

// Watch for mode changes to enable/disable scroll
watch(() => mode.value, (newMode) => {
  if (newMode === 'bubble') {
    disableBodyScroll();
    updateBubblePosition();
  } else {
    enableBodyScroll();
  }
});

// Watch for window size changes to reposition bubble
watch([windowWidth, windowHeight], () => {
  if (mode.value === 'bubble') {
    console.log('[Bubble] Window resized, recalculating position');
    updateBubblePosition();
  }
});

// Watch for element position changes (scroll, etc.)
watch([top, left, width, height], () => {
  if (mode.value === 'bubble') {
    // Debounce to avoid too many recalculations
    updateBubblePosition();
  }
});

// Scroll prevention by consuming scroll events
function preventScroll(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function disableBodyScroll() {
  // Prevent scroll via mouse wheel
  window.addEventListener('wheel', preventScroll, { passive: false, capture: true });
  // Prevent scroll via touch
  window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
  // Prevent scroll via keyboard (arrow keys, page up/down, space)
  window.addEventListener('keydown', preventScrollKeys, { passive: false, capture: true });
  
  console.log('[Scroll] Disabled scrolling via event blocking');
}

function enableBodyScroll() {
  // Remove scroll prevention listeners
  window.removeEventListener('wheel', preventScroll, { capture: true });
  window.removeEventListener('touchmove', preventScroll, { capture: true });
  window.removeEventListener('keydown', preventScrollKeys, { capture: true });
  
  console.log('[Scroll] Enabled scrolling');
}

// Prevent scroll keys (arrows, page up/down, space, home, end)
// But allow Escape key for closing
const scrollKeys = {
  32: true, // space
  33: true, // page up
  34: true, // page down
  35: true, // end
  36: true, // home
  37: true, // left arrow
  38: true, // up arrow
  39: true, // right arrow
  40: true  // down arrow
};

function preventScrollKeys(e) {
  // Allow Escape key to work (keyCode 27)
  if (e.keyCode === 27) {
    return;
  }
  
  if (scrollKeys[e.keyCode]) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

// Expose methods for parent components to call
defineExpose({
  setState_Loading,
  setState_Result,
  setState_Error,
  resetToHoverMode
});
</script>

<style scoped>
.fnf-bubble-content {
  width: 100%;
}

.fnf-page-overlay {
  animation: fnf-fade-in 0.3s ease;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fnf-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.content-preview {
  background: rgba(0,0,0,0.2);
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  font-style: italic;
  opacity: 0.9;
  border-left: 3px solid rgba(255,255,255,0.4);
  margin-bottom: 0;
}

.learn-more-btn {
  font-family: inherit;
}
</style>
