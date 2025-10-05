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
          <div :style="percentageLabelStyle">{{ isURLMode ? 'Poziom podobieństwa' : 'Poziom pewności' }}</div>
        </div>
        
        <!-- What This Means -->
        <div :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>{{ isURLMode ? '🌐' : '🔍' }}</span>
            <span>{{ isURLMode ? 'Analiza URL' : 'Analiza treści' }}</span>
          </h3>
          <div :style="infoContentStyle">
            {{ mainMessage }}
          </div>
        </div>
        
        <!-- Matched URL (only in URL mode) -->
        <div v-if="isURLMode && matchedURL" :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>🔗</span>
            <span>Dopasowany URL</span>
          </h3>
          <div :style="{ ...infoContentStyle, fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }">
            {{ matchedURL }}
          </div>
        </div>
        
        <!-- Analysis Reasoning (only in text mode) -->
        <div v-if="!isURLMode && reasoning" :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>🧠</span>
            <span>Uzasadnienie analizy</span>
          </h3>
          <div :style="infoContentStyle">
            {{ reasoning }}
          </div>
        </div>
        
        <!-- Analyzed Content / Current URL -->
        <div :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>{{ isURLMode ? '🌐' : '📝' }}</span>
            <span>{{ isURLMode ? 'Aktualny URL' : 'Analizowana treść' }}</span>
          </h3>
          <div :style="{ ...infoContentStyle, fontStyle: isURLMode ? 'normal' : 'italic', fontFamily: isURLMode ? 'monospace' : 'inherit', fontSize: isURLMode ? '13px' : '14px', wordBreak: isURLMode ? 'break-all' : 'normal' }">
            {{ isURLMode ? contentPreview : `"${contentPreview}"` }}
          </div>
        </div>
        
        <!-- Recommendation -->
        <div :style="infoSectionStyle">
          <h3 :style="infoTitleStyle">
            <span>💡</span>
            <span>{{ isFakeNews ? 'Rekomendacja' : 'Co możesz zrobić' }}</span>
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
          Zamknij
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
      if (status === 'fake') return this.isURLMode ? 'URL fałszywych wiadomości' : 'Fałszywe wiadomości';
      if (status === 'true') return this.isURLMode ? 'Zweryfikowany URL' : 'Zweryfikowane';
      if (status === 'unsure') return this.isURLMode ? 'Niepewny URL' : 'Niepewne';
      return this.isURLMode ? 'Nieznany URL' : 'Nie w bazie danych';
    },
    title() {
      const status = this.contentStatus;
      if (this.isURLMode) {
        if (status === 'fake') return 'Ostrzeżenie: URL fałszywych wiadomości!';
        if (status === 'true') return 'Zweryfikowany bezpieczny URL';
        if (status === 'unsure') return 'Niepewny status URL';
        return 'URL nie w bazie danych';
      }
      if (status === 'fake') return 'Alert: Fałszywe wiadomości!';
      if (status === 'true') return 'Zweryfikowana treść';
      if (status === 'unsure') return 'Niepewny status';
      return 'Nie w bazie danych';
    },
    subtitle() {
      const status = this.contentStatus;
      if (this.isURLMode) {
        if (status === 'fake') return 'Oznaczony jako fałszywe wiadomości w naszej bazie danych';
        if (status === 'true') return 'Potwierdzony jako prawdziwy';
        if (status === 'unsure') return 'Niepewny - zweryfikuj przed zaufaniem';
        return 'Brak dostępnych informacji';
      }
      if (status === 'fake') return 'Oznaczony jako fałszywe wiadomości w naszej bazie danych';
      if (status === 'true') return 'Potwierdzony jako dokładny';
      if (status === 'unsure') return 'Niepewny - zweryfikuj przed zaufaniem';
      return 'Brak dostępnych informacji';
    },
    matchedURL() {
      return this.result?.matchedUrl || '';
    },
    mainMessage() {
      const status = this.contentStatus;
      
      if (this.isURLMode) {
        const matchInfo = this.matchedURL ? ` Dopasowany URL to: ${this.matchedURL}.` : '';
        
        if (status === 'fake') {
          return `Ten URL został oznaczony jako fałszywe wiadomości w naszej bazie danych z ${this.percentage}% podobieństwem.${matchInfo} Zdecydowanie zalecamy nie ufać temu źródłu ani udostępniać treści z niego.`;
        } else if (status === 'true') {
          return `Ten URL został zweryfikowany jako prawdziwe źródło wiadomości w naszej bazie danych z ${this.percentage}% podobieństwem.${matchInfo} To jest zaufane źródło informacji.`;
        } else if (status === 'unsure') {
          return `Nie jesteśmy pewni co do tego URL (${this.percentage}% podobieństwa).${matchInfo} Źródło jest niejednoznaczne lub brakuje wystarczającej weryfikacji. Proszę zweryfikować wiarygodność przed zaufaniem lub udostępnieniem.`;
        }
        return 'Ten URL nie znajduje się w naszej bazie danych. To nie oznacza, że jest godny zaufania lub niegodny - po prostu nie mamy o nim informacji. Zawsze weryfikuj wiarygodność źródeł przed udostępnieniem danych osobowych.';
      }
      
      if (status === 'fake') {
        return `Ta treść została oznaczona jako fałszywe wiadomości w naszej bazie danych z ${this.percentage}% pewnością. Zdecydowanie zalecamy nie udostępniać ani nie wierzyć w te informacje bez weryfikacji z wiarygodnych źródeł.`;
      } else if (status === 'true') {
        return `Ta treść została zweryfikowana jako prawdziwa z ${this.percentage}% pewnością. Nasza baza danych potwierdza, że te informacje nie są fałszywymi wiadomościami.`;
      } else if (status === 'unsure') {
        return `Nie jesteśmy pewni co do tej treści (${this.percentage}% pewności). Informacje są niejednoznaczne lub brakuje wystarczającej weryfikacji. Proszę sprawdzić wiele wiarygodnych źródeł przed udostępnieniem.`;
      }
      return 'Ta treść nie znajduje się w naszej bazie danych. To nie oznacza, że jest prawdziwa lub fałszywa - po prostu nie mamy o niej informacji. Zawsze weryfikuj informacje przed udostępnieniem.';
    },
    recommendation() {
      const status = this.contentStatus;
      
      if (this.isURLMode) {
        if (status === 'fake') {
          return 'Nie ufaj temu źródłu. Unikaj udostępniania treści z tego URL i nie wprowadzaj żadnych wrażliwych informacji. Dokładnie zweryfikuj URL i rozważ użycie oficjalnych, zaufanych źródeł wiadomości.';
        } else if (status === 'true') {
          return 'To wydaje się być prawdziwym źródłem wiadomości. Jednak zawsze zachowuj zdrowy sceptycyzm i sprawdzaj ważne informacje w wielu źródłach.';
        } else if (status === 'unsure') {
          return 'Zachowaj ostrożność z tym źródłem. Dokładnie zweryfikuj URL, sprawdź HTTPS i błędy pisowni, oraz sprawdź ważne informacje w zaufanych źródłach przed udostępnieniem.';
        }
        return 'Zawsze weryfikuj URL przed zaufaniem treści lub wprowadzeniem danych osobowych. Szukaj HTTPS, sprawdź pisownię domeny i zachowaj ostrożność wobec podejrzanych URL.';
      }
      
      if (status === 'fake') {
        return 'Nie udostępniaj tej treści. Zweryfikuj ją przez wiele zaufanych źródeł wiadomości i szukaj oficjalnych oświadczeń lub organizacji sprawdzających fakty przed uwierzeniem lub rozpowszechnianiem tych informacji.';
      } else if (status === 'true') {
        return 'Chociaż ta treść wydaje się zweryfikowana jako prawdziwa, zawsze zachowuj zdrowy sceptycyzm. Sprawdzaj informacje w wielu źródłach przy podejmowaniu ważnych decyzji.';
      } else if (status === 'unsure') {
        return 'Zachowaj ostrożność z tą treścią. Zweryfikuj przez wiele niezależnych i zaufanych źródeł przed zaakceptowaniem lub udostępnieniem tych informacji.';
      }
      return 'Rozważ zweryfikowanie tych informacji przez wiele zaufanych źródeł. Zachowaj krytyczne podejście do tego, co czytasz online i zawsze sprawdzaj wiarygodność źródeł.';
    },
    primaryBtnText() {
      const status = this.contentStatus;
      if (status === 'fake') return 'Rozumiem';
      if (status === 'true') return 'Rozumiem';
      if (status === 'unsure') return 'Zanotowane';
      return 'Rozumiem';
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
