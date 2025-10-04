<template>
  <div 
    ref="container"
    class="fnf-attached-overlay-container" 
    :style="containerStyle"
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
</template>

<script>
export default {
  name: 'FactCheckBubble',
  props: {
    anchorRect: {
      type: Object,
      required: true
    },
    text: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      state: 'loading', // 'loading', 'result', 'error'
      loadingMessage: 'Fact checking…',
      errorMessage: '',
      closeHover: false,
      learnMoreHover: false,
      overlayWidth: 480,
      tailHeight: 16,
      // Store result in data so it's reactive
      result: null,
      analyzedText: ''
    };
  },
  computed: {
    scrollX() {
      return window.pageXOffset || document.documentElement.scrollLeft;
    },
    scrollY() {
      return window.pageYOffset || document.documentElement.scrollTop;
    },
    containerStyle() {
      const gap = this.tailHeight + 16;
      const centerX = this.anchorRect.left + this.scrollX + (this.anchorRect.width / 2);
      const bottomY = this.anchorRect.bottom + this.scrollY + gap;
      
      let left = centerX - this.overlayWidth / 2;
      const viewportWidth = window.innerWidth;
      const margin = 10;
      
      if (left < margin) {
        left = margin;
      } else if (left + this.overlayWidth > viewportWidth - margin) {
        left = viewportWidth - this.overlayWidth - margin;
      }
      
      return {
        position: 'absolute',
        zIndex: '99999',
        pointerEvents: 'none',
        left: `${left}px`,
        top: `${bottomY}px`,
        width: `${this.overlayWidth}px`
      };
    },
    tailStyle() {
      return {
        position: 'absolute',
        top: '0px',
        left: '50%',
        transform: 'translateX(-50%) translateY(-100%)',
        width: '0',
        height: '0',
        borderLeft: `${this.tailHeight}px solid transparent`,
        borderRight: `${this.tailHeight}px solid transparent`,
        borderBottom: `${this.tailHeight}px solid ${this.tailColor}`,
        filter: 'drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.15))',
        transition: 'border-bottom-color 0.3s ease'
      };
    },
    overlayStyle() {
      return {
        position: 'relative',
        background: this.backgroundColor,
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
    },
    backgroundColor() {
      if (this.state === 'loading') {
        return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
      } else if (this.state === 'error') {
        return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      } else if (this.state === 'result') {
        return this.isFakeNews 
          ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
          : 'linear-gradient(135deg, #475569 0%, #334155 100%)';
      }
      return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    },
    tailColor() {
      const bg = this.backgroundColor;
      if (bg.includes('gradient')) {
        const match = bg.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/);
        return match ? match[0] : '#6366f1';
      }
      return bg;
    },
    isFakeNews() {
      return this.result?.flagged === true;
    },
    percentage() {
      // Use the higher value between similarity and confidence
      const similarity = this.result?.similarity || 0;
      const confidence = this.result?.confidence || 0;
      const maxScore = Math.max(similarity, confidence);
      return Math.round(maxScore * 100);
    },
    icon() {
      return this.isFakeNews ? '⚠️' : 'ℹ️';
    },
    resultLabel() {
      return this.isFakeNews ? 'Fake News Alert' : 'Not in Database';
    },
    resultSummary() {
      return this.isFakeNews 
        ? `This content has been flagged as fake news (${this.percentage}% confidence).`
        : 'This content is not in our fact-checking database.';
    },
    contentPreview() {
      const maxLen = 160;
      const textToUse = this.analyzedText || this.text;
      return textToUse.length > maxLen 
        ? textToUse.slice(0, maxLen) + '…' 
        : textToUse;
    },
    iconStyle() {
      const iconBg = this.isFakeNews ? 'rgba(254, 226, 226, 0.25)' : 'rgba(255, 255, 255, 0.2)';
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
        border: this.isFakeNews ? '2px solid rgba(254, 226, 226, 0.3)' : '2px solid rgba(255, 255, 255, 0.2)'
      };
    },
    learnMoreBtnStyle() {
      const color = this.isFakeNews ? '#dc2626' : '#475569';
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
        boxShadow: this.learnMoreHover ? '0 8px 20px rgba(0, 0, 0, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: this.learnMoreHover ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)'
      };
    },
    closeBtnStyle() {
      return {
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: this.closeHover ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
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
        boxShadow: this.closeHover ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
      };
    }
  },
  methods: {
    setState_Loading(message = 'Fact checking…') {
      this.state = 'loading';
      this.loadingMessage = message;
    },
    setState_Result(result, text) {
      console.log('[FactCheckBubble] setState_Result called with:', { result, text });
      console.log('[FactCheckBubble] result.flagged:', result?.flagged);
      console.log('[FactCheckBubble] result.confidence:', result?.confidence);
      
      this.state = 'result';
      // Store in component data so computed properties can access it
      this.result = result;
      this.analyzedText = text || this.text;
      
      console.log('[FactCheckBubble] After setting result, isFakeNews will be:', result?.flagged === true);
      
      // Also emit for parent if needed
      this.$emit('update:result', result);
      this.$emit('update:text', text);
    },
    setState_Error(message) {
      this.state = 'error';
      this.errorMessage = message;
    },
    onClose() {
      this.$emit('close');
    },
    onLearnMore() {
      this.$emit('learn-more', { result: this.result, text: this.analyzedText || this.text });
    }
  }
};
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
