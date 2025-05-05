<template>
  <div class="code-block-card" :class="{ 'collapsed': isCollapsed }">
    <div class="code-block-header">
      <div class="code-block-title">
        <div class="code-icon">💻</div>
        <div class="code-type">{{ codeType }}</div>
      </div>
      <div class="code-block-actions">
        <button class="collapse-btn" @click="toggleCollapse">
          {{ isCollapsed ? 'expand' : 'collapse' }}
        </button>
      </div>
    </div>
    <div class="code-block-content" v-if="!isCollapsed">
      <pre><code>{{ content }}</code></pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CodeBlock',
  props: {
    content: {
      type: String,
      required: true
    },
    isJson: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isCollapsed: false
    }
  },
  computed: {
    codeType() {
      if (this.isJson) {
        return 'JSON Data'
      }
      return 'Code'
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed
    }
  }
}
</script>

<style scoped>
.code-block-card {
  background-color: #f8f8f8;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 16px;
  margin-top: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  top: 20px;
}

.code-block-card.collapsed {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #e0e0e0;
}

.code-block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #333333;
}

.code-icon {
  font-size: 16px;
}

.code-type {
  font-size: 14px;
}

.code-block-actions {
  display: flex;
  gap: 8px;
}

.collapse-btn {
  background: none;
  border: none;
  color: #666666;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.collapse-btn:hover {
  background-color: #f0f0f0;
  color: #333333;
}

.code-block-content {
  padding: 16px;
  overflow-x: auto;
}

.code-block-content pre {
  margin: 0;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style> 