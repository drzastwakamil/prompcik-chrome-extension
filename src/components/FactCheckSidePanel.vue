<template>
  <teleport to="body">
    <!-- Backdrop -->
    <div 
      v-if="visible"
      :style="backdropStyle"
      @click="onClose"
      data-fnf-element="true"
    ></div>
    
    <!-- Side Panel -->
    <div 
      v-if="visible"
      :style="panelStyle"
      data-fnf-element="true"
    >
      <!-- Header -->
      <div :style="headerStyle">
        <div style="flex: 1;">
          <div :style="badgeStyle">
            <span>{{ badgeIcon }}</span>
            <span>{{ badgeText }}</span>
          </div>
          <h2 :style="titleStyle">
            {{ title }}
          </h2>
          <p :style="subtitleStyle">{{ subtitle }}</p>
        </div>
        <button 
          :style="closeBtnStyle"
          @click="onClose"
          @mouseenter="closeHover = true"
          @mouseleave="closeHover = false"
        >
          ×
        </button>
      </div>
      
      <!-- Body -->
      <div :style="bodyStyle">
        <!-- Confidence Circle (for fake news) -->
        <div v-if="isFakeNews" :style="percentageDisplayStyle">
          <div :style="percentageCircleStyle">
            {{ percentage }}%
          </div>
          <div :style="percentageLabelStyle">Confidence Level</div>
        </div>
        
        <!-- What This Means -->
        <div :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>{{ isFakeNews ? '🔍' : '📋' }}</span>
            <span>{{ isFakeNews ? 'What This Means' : 'Database Status' }}</span>
          </h3>
          <div :style="infoContentStyle">
            {{ mainMessage }}
          </div>
        </div>
        
        <!-- Analysis Reasoning -->
        <div v-if="reasoning" :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>🧠</span>
            <span>Analysis Reasoning</span>
          </h3>
          <div :style="infoContentStyle">
            {{ reasoning }}
          </div>
        </div>
        
        <!-- Analyzed Content -->
        <div :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>📝</span>
            <span>Analyzed Content</span>
          </h3>
          <div :style="{ ...infoContentStyle, fontStyle: 'italic' }">
            "{{ contentPreview }}"
          </div>
        </div>
        
        <!-- Recommendation -->
        <div :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>💡</span>
            <span>{{ isFakeNews ? 'Recommendation' : 'What You Can Do' }}</span>
          </h3>
          <div :style="infoContentStyle">
            {{ recommendation }}
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div :style="footerStyle">
        <button 
          :style="primaryBtnStyle"
          @click="onClose"
          @mouseenter="primaryHover = true"
          @mouseleave="primaryHover = false"
        >
          {{ primaryBtnText }}
        </button>
        <button 
          :style="secondaryBtnStyle"
          @click="onClose"
          @mouseenter="secondaryHover = true"
          @mouseleave="secondaryHover = false"
        >
          Dismiss
        </button>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'FactCheckSidePanel',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    result: {
      type: Object,
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      primaryHover: false,
      secondaryHover: false,
      closeHover: false
    };
  },
  mounted() {
    console.log('[FactCheckSidePanel] Mounted with props:', {
      visible: this.visible,
      result: this.result,
      text: this.text
    });
  },
  computed: {
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
    reasoning() {
      return this.result?.reasoning || '';
    },
    contentPreview() {
      return this.text.length > 200 ? this.text.slice(0, 200) + '…' : this.text;
    },
    panelClass() {
      return this.isFakeNews ? 'fnf-fake-news' : 'fnf-not-in-db';
    },
    badgeIcon() {
      return this.isFakeNews ? '⚠️' : 'ℹ️';
    },
    badgeText() {
      return this.isFakeNews ? 'Fake News' : 'Not Verified';
    },
    title() {
      return this.isFakeNews ? 'Alert!' : 'Unknown Status';
    },
    subtitle() {
      return this.isFakeNews ? 'Flagged by our system' : 'Not in our database';
    },
    mainMessage() {
      if (this.isFakeNews) {
        return `This content has been flagged as fake news by our system with ${this.percentage}% confidence. We strongly recommend not sharing or believing this information without verification from reliable sources.`;
      }
      return 'This content is not currently in our fact-checking database. This doesn\'t mean it\'s true or false - we simply don\'t have information about it.';
    },
    recommendation() {
      if (this.isFakeNews) {
        return 'Before sharing this content, verify it through multiple trusted news sources. Look for official statements or fact-checking organizations.';
      }
      return 'Consider verifying this information through multiple trusted sources. Stay critical of what you read online and check the credibility of the source.';
    },
    primaryBtnText() {
      return this.isFakeNews ? 'Understood' : 'Got It';
    },
    // Colors
    borderColor() {
      return this.isFakeNews ? '#dc2626' : '#6b7280';
    },
    bgColor() {
      return this.isFakeNews ? '#fef2f2' : '#f9fafb';
    },
    // Panel styles
    backdropStyle() {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 999999
      };
    },
    panelStyle() {
      return {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        maxWidth: '90vw',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
        zIndex: 9999999,
        animation: 'fnfSlideIn 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
        borderLeft: `8px solid ${this.borderColor}`
      };
    },
    headerStyle() {
      return {
        padding: '24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: this.isFakeNews ? 'linear-gradient(to bottom, #fef2f2, white)' : 'linear-gradient(to bottom, #f9fafb, white)'
      };
    },
    badgeStyle() {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '12px',
        background: this.borderColor,
        color: 'white'
      };
    },
    titleStyle() {
      return {
        fontSize: '24px',
        fontWeight: '800',
        color: '#111827',
        margin: '0 0 8px 0'
      };
    },
    subtitleStyle() {
      return {
        fontSize: '14px',
        color: '#6b7280',
        margin: '0'
      };
    },
    closeBtnStyle() {
      return {
        background: this.closeHover ? '#e5e7eb' : '#f3f4f6',
        border: 'none',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        color: this.closeHover ? '#111827' : '#6b7280'
      };
    },
    bodyStyle() {
      return {
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
      };
    },
    percentageDisplayStyle() {
      return {
        textAlign: 'center',
        marginBottom: '32px'
      };
    },
    percentageCircleStyle() {
      return {
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: '56px',
        fontWeight: '800',
        border: `12px solid ${this.borderColor}`,
        background: 'white',
        color: this.borderColor,
        boxShadow: `0 0 0 8px ${this.bgColor}`
      };
    },
    percentageLabelStyle() {
      return {
        fontSize: '14px',
        color: '#6b7280',
        fontWeight: '500'
      };
    },
    infoSectionStyle() {
      return {
        marginBottom: '24px'
      };
    },
    infoTitleStyle() {
      return {
        fontSize: '16px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 12px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      };
    },
    infoContentStyle() {
      return {
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#4b5563',
        padding: '16px',
        borderRadius: '8px',
        borderLeft: `4px solid ${this.borderColor}`,
        background: this.bgColor
      };
    },
    footerStyle() {
      return {
        padding: '24px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px'
      };
    },
    primaryBtnStyle() {
      return {
        flex: 1,
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        background: this.borderColor,
        color: 'white',
        transform: this.primaryHover ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: this.primaryHover ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.2s'
      };
    },
    secondaryBtnStyle() {
      return {
        flex: 1,
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        background: '#f3f4f6',
        color: '#374151',
        transform: this.secondaryHover ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: this.secondaryHover ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.2s'
      };
    }
  },
  methods: {
    onClose() {
      this.$emit('close');
    }
  }
};
</script>

<style>
/* Keep only animations as they can't be inlined */
@keyframes fnfSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
