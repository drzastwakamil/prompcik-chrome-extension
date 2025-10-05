<template>
  <div
    v-if="isVisible && currentElement"
    ref="highlightBox"
    class="fnf-hover-highlight"
    data-fnf-element="true"
    :style="highlightStyle"
  ></div>
</template>

<script setup>
import { ref, computed, unref, onMounted, onBeforeUnmount } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';

// Props
const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#22c55e' // green
  },
  borderWidth: {
    type: Number,
    default: 2
  },
  isExtensionElement: {
    type: Function,
    default: () => false
  }
});

// Emits
const emit = defineEmits(['element-selected']);

const highlightBox = ref(null);
const currentElement = ref(null);
const isVisible = computed(() => props.active && currentElement.value !== null);

// Track element bounding
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

// Event handlers
const onMouseMove = (e) => {
  if (!props.active) return;
  
  const el = e.target;
  
  // Skip extension elements, images, and SVGs
  if (props.isExtensionElement(el) || 
      el.tagName === 'IMG' || 
      el.tagName === 'image' || 
      el.tagName === 'svg' || 
      el.tagName === 'SVG' || 
      el instanceof SVGElement) {
    currentElement.value = null;
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
  
  // Emit custom DOM event for programmatic component mounting
  if (highlightBox.value && highlightBox.value.parentElement) {
    const customEvent = new CustomEvent('element-selected', {
      detail: { element: e.target },
      bubbles: true
    });
    highlightBox.value.parentElement.dispatchEvent(customEvent);
  }
  
  // Also emit Vue event
  emit('element-selected', e.target);
};

const onKeyDown = (e) => {
  if (!props.active) return;
  
  if (e.key === 'Escape') {
    e.preventDefault();
    currentElement.value = null;
    
    // Emit custom DOM event
    if (highlightBox.value && highlightBox.value.parentElement) {
      const customEvent = new CustomEvent('cancel', {
        bubbles: true
      });
      highlightBox.value.parentElement.dispatchEvent(customEvent);
    }
    
    // Also emit Vue event
    emit('cancel');
  }
};

// Computed style for the highlight box
const highlightStyle = computed(() => {
  if (!currentElement.value || !props.active) {
    return {
      display: 'none'
    };
  }
  
  // Calculate box position with border offset
  const boxTop = Math.max(0, top.value - props.borderWidth);
  const boxLeft = Math.max(0, left.value - props.borderWidth);
  const boxWidth = Math.max(0, width.value + props.borderWidth * 2);
  const boxHeight = Math.max(0, height.value + props.borderWidth * 2);
  
  return {
    position: 'fixed',
    top: `${boxTop}px`,
    left: `${boxLeft}px`,
    width: `${boxWidth}px`,
    height: `${boxHeight}px`,
    pointerEvents: 'none',
    zIndex: '999998',
    border: `${props.borderWidth}px solid ${props.color}`,
    borderRadius: '6px',
    background: `${props.color}14`, // 8% opacity
    transition: 'none', // Instant updates for smooth tracking
    display: 'block'
  };
});

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
});

// Watch for active prop changes to add/remove event listeners
import { watch } from 'vue';
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
  }
});
</script>

<style scoped>
/* All styles are applied via inline computed styles for dynamic positioning */
</style>
