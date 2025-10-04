<template>
  <div class="popup-container">
    <h1>🛡️ Fake News Filter</h1>
    
    <div class="button-group">
      <div class="info-text">
        Use the on-page toolbar to start Fact-check. This popup is info-only.
      </div>
    </div>
    
    <div class="result show">
      {{ statusMessage }}
    </div>
    
    <div class="footer">
      v1.0
    </div>
  </div>
</template>

<script>
export default {
  name: 'Popup',
  data() {
    return {
      statusMessage: 'Extension active — Use the floating toolbar or select text to fact-check content.'
    };
  },
  mounted() {
    console.log('Popup mounted');
    // Could query active tab status here if needed
  }
};
</script>

<style scoped>
.popup-container {
  width: 320px;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-sizing: border-box;
}

h1 {
  font-size: 20px;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-text {
  font-size: 13px;
  opacity: 0.95;
  line-height: 1.6;
}

.result {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}

.result.show {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.footer {
  margin-top: 20px;
  text-align: center;
  font-size: 11px;
  opacity: 0.8;
}
</style>
