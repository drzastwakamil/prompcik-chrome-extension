<template>
  <!-- Main container that wraps both highlight and bubble -->
  <div
    v-if="anchorElementRef"
    ref="mainContainer"
    class="fnf-fact-check-wrapper"
    :style="mainContainerStyle"
    data-fnf-element="true"
  >
    <!-- Highlight box on top of the clicked element -->
    <div 
      class="fnf-persistent-highlight"
      :style="persistentHighlightStyle"
      data-fnf-element="true"
    ></div>
    
    <!-- Bubble positioned below the highlight -->
    <div 
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
</template>

<script setup>
import { ref, computed, unref, onMounted, onBeforeUnmount } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';

// Props
const props = defineProps({
  anchorElement: {
    type: Object, // DOM element
    default: null
  },
  text: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['close', 'learn-more', 'update:result', 'update:text']);

// Create a ref to track the anchor element
const anchorElementRef = ref(props.anchorElement);

// Use VueUse to track the element's bounding box (same as HoverHighlight)
const { 
  width: anchorWidth, 
  height: anchorHeight, 
  top: anchorTop, 
  left: anchorLeft,
  bottom: anchorBottom
} = useElementBounding(anchorElementRef, {
  windowResize: true,
  windowScroll: true,
  immediate: true
});

// Track window size for responsive positioning
const { width: windowWidth, height: windowHeight } = useWindowSize();

// State
const state = ref('loading'); // 'loading', 'result', 'error'
const loadingMessage = ref('Fact checking…');
const errorMessage = ref('');
const closeHover = ref(false);
const learnMoreHover = ref(false);
const overlayWidth = 480;
const tailHeight = 16;
const result = ref(null);
const analyzedText = ref('');

// Refs
const mainContainer = ref(null);
const bubbleContainer = ref(null);

// Computed styles
const highlightColor = computed(() => {
  if (!result.value) return '#6366f1'; // blue loading
  return result.value.flagged ? '#dc2626' : '#6b7280'; // red or gray
});

// Main container tracks the anchor element with fixed positioning
const borderOffset = 4;
const mainContainerStyle = computed(() => {
  if (!anchorElementRef.value) return { display: 'none' };
  
  return {
    position: 'fixed',
    top: `${Math.max(0, anchorTop.value - borderOffset)}px`,
    left: `${Math.max(0, anchorLeft.value - borderOffset)}px`,
    width: `${anchorWidth.value + borderOffset * 2}px`,
    height: `${anchorHeight.value + borderOffset * 2}px`,
    pointerEvents: 'none',
    zIndex: '999997'
  };
});

// Highlight positioned at the top of the main container
const persistentHighlightStyle = computed(() => {
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    border: `3px solid ${highlightColor.value}`,
    borderRadius: '8px',
    background: `${highlightColor.value}15`,
    boxShadow: `0 0 0 4px ${highlightColor.value}20`,
    transition: 'border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
    pointerEvents: 'none'
  };
});

// Calculate bubble left position (stored so tail can use it)
const bubbleLeftPosition = computed(() => {
  // Calculate where bubble should be horizontally
  // Center it under the highlight, but keep it within viewport
  const highlightCenterX = anchorWidth.value / 2;
  let bubbleLeft = highlightCenterX - (overlayWidth / 2);
  
  // Calculate absolute position in viewport to check bounds
  const absoluteBubbleLeft = anchorLeft.value - borderOffset + bubbleLeft;
  const margin = 10;
  
  // Adjust if bubble would go off screen
  if (absoluteBubbleLeft < margin) {
    bubbleLeft = margin - (anchorLeft.value - borderOffset);
  } else if (absoluteBubbleLeft + overlayWidth > windowWidth.value - margin) {
    bubbleLeft = (windowWidth.value - margin - overlayWidth) - (anchorLeft.value - borderOffset);
  }
  
  return bubbleLeft;
});

// Bubble wrapper positioned below the highlight within the main container
const bubbleWrapperStyle = computed(() => {
  const gap = tailHeight + 16;
  
  return {
    position: 'absolute',
    top: `${anchorHeight.value + borderOffset * 2 + gap}px`,
    left: `${bubbleLeftPosition.value}px`,
    width: `${overlayWidth}px`,
    pointerEvents: 'none',
    zIndex: '1'
  };
});

// Tail positioned to point at the center of the highlight
const tailStyle = computed(() => {
  // The tail should point at the center of the highlight (relative to main container)
  const highlightCenterX = anchorWidth.value / 2;
  // Calculate tail position relative to bubble's left edge
  const tailLeft = highlightCenterX - bubbleLeftPosition.value;
  
  return {
    position: 'absolute',
    top: '0px',
    left: `${tailLeft}px`,
    transform: 'translateX(-50%) translateY(-100%)',
    width: '0',
    height: '0',
    borderLeft: `${tailHeight}px solid transparent`,
    borderRight: `${tailHeight}px solid transparent`,
    borderBottom: `${tailHeight}px solid ${tailColor.value}`,
    filter: 'drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.15))',
    transition: 'border-bottom-color 0.3s ease'
  };
});

const overlayStyle = computed(() => {
  return {
    position: 'relative',
    background: backgroundColor.value,
    color: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    backdropFilter: 'blur(10px)',
    transition: 'background 0.3s ease'
  };
});

const backgroundColor = computed(() => {
  if (state.value === 'loading') {
    return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
  } else if (state.value === 'error') {
    return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  } else if (state.value === 'result') {
    return isFakeNews.value 
      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
      : 'linear-gradient(135deg, #475569 0%, #334155 100%)';
  }
  return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
});

const tailColor = computed(() => {
  const bg = backgroundColor.value;
  if (bg.includes('gradient')) {
    const match = bg.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/);
    return match ? match[0] : '#6366f1';
  }
  return bg;
});

const isFakeNews = computed(() => {
  return result.value?.flagged === true;
});

const percentage = computed(() => {
  // Use the higher value between similarity and confidence
  const similarity = result.value?.similarity || 0;
  const confidence = result.value?.confidence || 0;
  const maxScore = Math.max(similarity, confidence);
  return Math.round(maxScore * 100);
});

const icon = computed(() => {
  return isFakeNews.value ? '⚠️' : 'ℹ️';
});

const resultLabel = computed(() => {
  return isFakeNews.value ? 'Fake News Alert' : 'Not in Database';
});

const resultSummary = computed(() => {
  return isFakeNews.value 
    ? `This content has been flagged as fake news (${percentage.value}% confidence).`
    : 'This content is not in our fact-checking database.';
});

const contentPreview = computed(() => {
  const maxLen = 160;
  const textToUse = analyzedText.value || props.text;
  return textToUse.length > maxLen 
    ? textToUse.slice(0, maxLen) + '…' 
    : textToUse;
});

const iconStyle = computed(() => {
  const iconBg = isFakeNews.value ? 'rgba(254, 226, 226, 0.25)' : 'rgba(255, 255, 255, 0.2)';
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
    border: isFakeNews.value ? '2px solid rgba(254, 226, 226, 0.3)' : '2px solid rgba(255, 255, 255, 0.2)'
  };
});

const learnMoreBtnStyle = computed(() => {
  const color = isFakeNews.value ? '#dc2626' : '#475569';
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

// Methods - exposed for the parent to call
const setState_Loading = (message = 'Fact checking…') => {
  state.value = 'loading';
  loadingMessage.value = message;
};

const setState_Result = (resultData, text) => {
  console.log('[FactCheckBubble] setState_Result called with:', { result: resultData, text });
  console.log('[FactCheckBubble] result.flagged:', resultData?.flagged);
  console.log('[FactCheckBubble] result.confidence:', resultData?.confidence);
  
  state.value = 'result';
  // Store in component data so computed properties can access it
  result.value = resultData;
  analyzedText.value = text || props.text;
  
  console.log('[FactCheckBubble] After setting result, isFakeNews will be:', resultData?.flagged === true);
  
  // Also emit for parent if needed
  emit('update:result', resultData);
  emit('update:text', text);
};

const setState_Error = (message) => {
  state.value = 'error';
  errorMessage.value = message;
};

const onClose = () => {
  emit('close');
};

const onLearnMore = () => {
  emit('learn-more', { result: result.value, text: analyzedText.value || props.text });
};

// Expose methods for parent components to call
defineExpose({
  setState_Loading,
  setState_Result,
  setState_Error
});
</script>

<style scoped>
.fnf-bubble-content {
  width: 100%;
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
