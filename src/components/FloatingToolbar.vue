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
      title="Drag"
    >
      ⠿
    </div>
    <div class="title">Tools</div>
    <button 
      class="fact-btn"
      @click="onFactCheck"
      title="Start Fact-check (select element)"
    >
      🛡️ Fact-check
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
        zIndex: '999999',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        background: 'rgba(17, 24, 39, 0.85)',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: '10px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
        backdropFilter: 'saturate(120%) blur(4px)',
        userSelect: 'none'
      };
    }
  },
  methods: {
    onFactCheck() {
      this.$emit('fact-check');
    },
    onClose() {
      this.visible = false;
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
}

.handle {
  cursor: move;
  opacity: 0.9;
  font-size: 14px;
}

.title {
  font-size: 12px;
  opacity: 0.9;
}

.fact-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.fact-btn:hover {
  background: #1d4ed8;
}

.close-btn {
  background: transparent;
  color: #fff;
  border: none;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
}

.close-btn:hover {
  opacity: 0.7;
}
</style>
