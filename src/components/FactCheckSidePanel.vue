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
        <!-- Confidence Circle (shown for all statuses except no_data) -->
        <div v-if="contentStatus !== 'no_data'" :style="percentageDisplayStyle">
          <div :style="percentageCircleStyle">
            {{ percentage }}%
          </div>
          <div :style="percentageLabelStyle">{{ isURLMode ? 'Similarity Level' : 'Confidence Level' }}</div>
        </div>
        
        <!-- What This Means -->
        <div :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>{{ isURLMode ? '🌐' : '🔍' }}</span>
            <span>{{ isURLMode ? 'URL Analysis' : 'Content Analysis' }}</span>
          </h3>
          <div :style="infoContentStyle">
            {{ mainMessage }}
          </div>
        </div>
        
        <!-- Matched URL (only in URL mode) -->
        <div v-if="isURLMode && matchedURL" :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>🔗</span>
            <span>Matched URL</span>
          </h3>
          <div :style="{ ...infoContentStyle, fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }">
            {{ matchedURL }}
          </div>
        </div>
        
        <!-- Analysis Reasoning (only in text mode) -->
        <div v-if="!isURLMode && reasoning" :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>🧠</span>
            <span>Analysis Reasoning</span>
          </h3>
          <div :style="infoContentStyle">
            {{ reasoning }}
          </div>
        </div>
        
        <!-- Analyzed Content / Current URL -->
        <div :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>{{ isURLMode ? '🌐' : '📝' }}</span>
            <span>{{ isURLMode ? 'Current URL' : 'Analyzed Content' }}</span>
          </h3>
          <div :style="{ ...infoContentStyle, fontStyle: isURLMode ? 'normal' : 'italic', fontFamily: isURLMode ? 'monospace' : 'inherit', fontSize: isURLMode ? '13px' : '14px', wordBreak: isURLMode ? 'break-all' : 'normal' }">
            {{ isURLMode ? contentPreview : `"${contentPreview}"` }}
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
    },
    mode: {
      type: String,
      default: 'text', // 'text' for text analysis, 'url' for URL check
      validator: (value) => ['text', 'url'].includes(value)
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
      text: this.text,
      mode: this.mode
    });
  },
  computed: {
    isURLMode() {
      return this.mode === 'url';
    },
    isFakeNews() {
      // Only return true if status is explicitly "fake"
      return this.result?.status === 'fake';
    },
    contentStatus() {
      return this.result?.status || 'no_data';
    },
    percentage() {
      if (this.isURLMode) {
        // For URL mode, use similarity from response
        return Math.round((this.result?.similarity || 0) * 100);
      }
      // Use the higher value between similarity and confidence
      const similarity = this.result?.similarity || 0;
      const confidence = this.result?.confidence || 0;
      const maxScore = Math.max(similarity, confidence);
      return Math.round(maxScore * 100);
    },
    reasoning() {
      if (this.isURLMode) {
        // URL mode doesn't have reasoning, use message instead
        return this.result?.message || '';
      }
      return this.result?.reasoning || '';
    },
    contentPreview() {
      if (this.isURLMode) {
        return this.text; // In URL mode, text is the URL itself
      }
      return this.text.length > 200 ? this.text.slice(0, 200) + '…' : this.text;
    },
    panelClass() {
      return this.isFakeNews ? 'fnf-fake-news' : 'fnf-not-in-db';
    },
    badgeIcon() {
      const status = this.contentStatus;
      if (status === 'fake') return '⚠️';
      if (status === 'true') return '✅';
      if (status === 'unsure') return '❓';
      return 'ℹ️';
    },
    badgeText() {
      const status = this.contentStatus;
      if (status === 'fake') return this.isURLMode ? 'Fake News URL' : 'Fake News';
      if (status === 'true') return this.isURLMode ? 'Verified URL' : 'Verified';
      if (status === 'unsure') return this.isURLMode ? 'Uncertain URL' : 'Uncertain';
      return this.isURLMode ? 'Unknown URL' : 'Not In Database';
    },
    title() {
      const status = this.contentStatus;
      if (this.isURLMode) {
        if (status === 'fake') return 'Warning: Fake News URL!';
        if (status === 'true') return 'Verified Safe URL';
        if (status === 'unsure') return 'Uncertain URL Status';
        return 'URL Not In Database';
      }
      if (status === 'fake') return 'Alert: Fake News!';
      if (status === 'true') return 'Verified Content';
      if (status === 'unsure') return 'Uncertain Status';
      return 'Not In Database';
    },
    subtitle() {
      const status = this.contentStatus;
      if (this.isURLMode) {
        if (status === 'fake') return 'Marked as fake news in our database';
        if (status === 'true') return 'Confirmed as legitimate';
        if (status === 'unsure') return 'Uncertain - verify before trusting';
        return 'No information available';
      }
      if (status === 'fake') return 'Marked as fake news in our database';
      if (status === 'true') return 'Confirmed as accurate';
      if (status === 'unsure') return 'Uncertain - verify before trusting';
      return 'No information available';
    },
    matchedURL() {
      return this.result?.matchedUrl || '';
    },
    mainMessage() {
      const status = this.contentStatus;
      
      if (this.isURLMode) {
        const matchInfo = this.matchedURL ? ` The matched URL is: ${this.matchedURL}.` : '';
        
        if (status === 'fake') {
          return `This URL has been marked as fake news in our database with ${this.percentage}% similarity.${matchInfo} We strongly recommend not trusting this source or sharing content from it.`;
        } else if (status === 'true') {
          return `This URL has been verified as a legitimate news source in our database with ${this.percentage}% similarity.${matchInfo} This is a trusted source of information.`;
        } else if (status === 'unsure') {
          return `We're uncertain about this URL (${this.percentage}% similarity).${matchInfo} The source is ambiguous or lacks sufficient verification. Please verify the credibility before trusting or sharing.`;
        }
        return 'This URL is not in our database. This doesn\'t mean it\'s trustworthy or untrustworthy - we simply don\'t have information about it. Always verify the credibility of sources before sharing personal information.';
      }
      
      if (status === 'fake') {
        return `This content has been marked as fake news in our database with ${this.percentage}% confidence. We strongly recommend not sharing or believing this information without verification from reliable sources.`;
      } else if (status === 'true') {
        return `This content has been verified as legitimate with ${this.percentage}% confidence. Our database confirms this information as non-fake news.`;
      } else if (status === 'unsure') {
        return `We're uncertain about this content (${this.percentage}% confidence). The information is ambiguous or lacks sufficient verification. Please check multiple reliable sources before sharing.`;
      }
      return 'This content is not in our database. This doesn\'t mean it\'s true or false - we simply don\'t have information about it. Always verify information before sharing.';
    },
    recommendation() {
      const status = this.contentStatus;
      
      if (this.isURLMode) {
        if (status === 'fake') {
          return 'Do not trust this source. Avoid sharing content from this URL and do not enter any sensitive information. Verify the URL carefully and consider using official, trusted news sources instead.';
        } else if (status === 'true') {
          return 'This appears to be a legitimate news source. However, always maintain healthy skepticism and cross-reference important information with multiple sources.';
        } else if (status === 'unsure') {
          return 'Exercise caution with this source. Verify the URL carefully, check for HTTPS and spelling mistakes, and cross-reference any important information with trusted sources before sharing.';
        }
        return 'Always verify URLs before trusting content or entering personal information. Look for HTTPS, check the domain spelling, and be cautious of suspicious URLs.';
      }
      
      if (status === 'fake') {
        return 'Do not share this content. Verify it through multiple trusted news sources and look for official statements or fact-checking organizations before believing or spreading this information.';
      } else if (status === 'true') {
        return 'While this content appears verified as legitimate, always maintain healthy skepticism. Cross-reference with multiple sources when making important decisions.';
      } else if (status === 'unsure') {
        return 'Exercise caution with this content. Verify through multiple independent and trusted sources before accepting or sharing this information.';
      }
      return 'Consider verifying this information through multiple trusted sources. Stay critical of what you read online and always check the credibility of sources.';
    },
    primaryBtnText() {
      const status = this.contentStatus;
      if (status === 'fake') return 'Understood';
      if (status === 'true') return 'Got It';
      if (status === 'unsure') return 'Noted';
      return 'Got It';
    },
    // Colors
    borderColor() {
      const status = this.contentStatus;
      if (status === 'fake') return '#dc2626'; // red
      if (status === 'true') return '#22c55e'; // green
      if (status === 'unsure') return '#f59e0b'; // yellow/amber
      return '#6b7280'; // gray (no_data)
    },
    bgColor() {
      const status = this.contentStatus;
      if (status === 'fake') return '#fef2f2'; // red bg
      if (status === 'true') return '#f0fdf4'; // green bg
      if (status === 'unsure') return '#fffbeb'; // yellow/amber bg
      return '#f9fafb'; // gray bg (no_data)
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
      const status = this.contentStatus;
      let bgGradient = 'linear-gradient(to bottom, #f9fafb, white)'; // default gray for no_data
      
      if (status === 'fake') {
        bgGradient = 'linear-gradient(to bottom, #fef2f2, white)'; // red
      } else if (status === 'true') {
        bgGradient = 'linear-gradient(to bottom, #f0fdf4, white)'; // green
      } else if (status === 'unsure') {
        bgGradient = 'linear-gradient(to bottom, #fffbeb, white)'; // yellow
      }
      
      return {
        padding: '24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: bgGradient
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
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: '36px',
        fontWeight: '700',
        border: `8px solid ${this.borderColor}`,
        background: 'white',
        color: this.borderColor,
        boxShadow: `0 0 0 6px ${this.bgColor}`
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
        background: this.bgColor,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        wordBreak: 'break-word'
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
