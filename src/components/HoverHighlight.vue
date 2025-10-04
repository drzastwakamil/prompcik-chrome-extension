<template>
  <div
    v-if="visible && targetEl"
    ref="highlightBox"
    class="fnf-hover-highlight"
    data-fnf-element="true"
    :style="highlightStyle"
  ></div>
</template>

<script setup>
import { ref, computed, unref } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';

// Props
const props = defineProps({
  targetEl: {
    type: Object, // This is a ref object passed from parent
    default: null
  },
  visible: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#22c55e' // green
  },
  borderWidth: {
    type: Number,
    default: 2
  }
});

const highlightBox = ref(null);

// Since targetEl is already a ref from the parent, we can use it directly
// useElementBounding accepts refs, so we just pass props.targetEl
const { 
  width, 
  height, 
  top, 
  left
} = useElementBounding(() => unref(props.targetEl), {
  windowResize: true,
  windowScroll: true,
  immediate: true
});

// Track window size for additional reactive updates
const { width: windowWidth, height: windowHeight } = useWindowSize();

// Computed style for the highlight box
const highlightStyle = computed(() => {
  const targetElement = unref(props.targetEl);
  
  if (!targetElement || !props.visible) {
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
</script>

<style scoped>
.fnf-hover-highlight {
  /* Styles are applied via inline styles for dynamic values */
}
</style>
