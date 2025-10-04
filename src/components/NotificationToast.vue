<template>
  <teleport to="body">
    <div 
      v-if="visible"
      class="fnf-notification-toast"
      :class="typeClass"
      data-fnf-element="true"
    >
      {{ message }}
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'NotificationToast',
  props: {
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info', // 'info', 'warning', 'error', 'success'
      validator: (value) => ['info', 'warning', 'error', 'success'].includes(value)
    },
    duration: {
      type: Number,
      default: 3000
    }
  },
  data() {
    return {
      visible: false,
      timeout: null
    };
  },
  computed: {
    typeClass() {
      return `fnf-toast-${this.type}`;
    }
  },
  methods: {
    show() {
      this.visible = true;
      
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      this.timeout = setTimeout(() => {
        this.hide();
      }, this.duration);
    },
    hide() {
      this.visible = false;
      this.$emit('close');
    }
  },
  mounted() {
    this.show();
  },
  beforeUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
};
</script>

<style scoped>
.fnf-notification-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999999;
  animation: fnfToastFadeIn 0.3s ease;
}

.fnf-toast-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.fnf-toast-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.fnf-toast-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.fnf-toast-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

@keyframes fnfToastFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
