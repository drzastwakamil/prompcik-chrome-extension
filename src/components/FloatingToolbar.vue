<template>
  <div 
    v-if="visible"
    ref="toolbar"
    id="fnf-toolbar"
    class="fnf-toolbar"
    data-fnf-element="true"
    :style="toolbarStyle"
  >
    <div 
      class="handle"
      @mousedown="startDrag"
      title="Drag to move"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="3" cy="3" r="1.5"/>
        <circle cx="9" cy="3" r="1.5"/>
        <circle cx="3" cy="9" r="1.5"/>
        <circle cx="9" cy="9" r="1.5"/>
      </svg>
    </div>
    <button 
      class="fact-btn"
      @click="handleFactCheck"
      title="Select element to fact-check"
    >
      <span class="icon">🛡️</span>
      <span class="text">Fact-check</span>
    </button>
    <button 
      class="close-btn"
      @click="onClose"
      title="Hide toolbar"
    >
      ×
    </button>
  </div>
</template>

<script>
export default {
  name: 'FloatingToolbar',
  emits: ['fact-check', 'close'],
  data() {
    return {
      visible: true,
      position: {
        top: 20,
        right: 20
      },
      isDragging: false,
      dragOffset: { x: 0, y: 0 }
    };
  },
  computed: {
    toolbarStyle() {
      return {
        position: 'fixed',
        top: `${this.position.top}px`,
        right: this.position.right !== null ? `${this.position.right}px` : 'auto',
        left: this.position.left !== null ? `${this.position.left}px` : 'auto',
        zIndex: '2147483647' // Maximum z-index value to ensure always on top
      };
    }
  },
  methods: {
    handleFactCheck() {
      this.$emit('fact-check');
    },
    onClose() {
      this.$emit('close');
    },
    startDrag(e) {
      this.isDragging = true;
      const toolbar = this.$refs.toolbar;
      const rect = toolbar.getBoundingClientRect();
      
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
      e.preventDefault();
    },
    onDrag(e) {
      if (!this.isDragging) return;
      
      this.position = {
        top: e.clientY - this.dragOffset.y,
        left: e.clientX - this.dragOffset.x,
        right: null
      };
    },
    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
    }
  },
  beforeUnmount() {
    if (this.isDragging) {
      this.stopDrag();
    }
  }
};
</script>

<style scoped>
.fnf-toolbar {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95));
  color: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px) saturate(120%);
  user-select: none;
  transition: box-shadow 0.2s ease;
}

.fnf-toolbar:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.handle {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  opacity: 0.6;
  padding: 4px;
  border-radius: 6px;
  transition: opacity 0.2s ease, background 0.2s ease;
  flex-shrink: 0;
}

.handle:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.handle svg {
  display: block;
  opacity: 0.8;
}

.fact-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
  flex-shrink: 0;
  min-width: 110px;
  justify-content: center;
}

.fact-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.fact-btn:active {
  transform: translateY(0);
}

.fact-btn .icon {
  font-size: 14px;
  line-height: 1;
}

.fact-btn .text {
  line-height: 1;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #fff;
  border: none;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  opacity: 0.6;
  transition: opacity 0.2s ease, background 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}
</style>
