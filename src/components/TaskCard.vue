<template>
  <div class="task-card">
    <div class="card-header" @click="toggleExpand">
      <div class="task-icon">🔍</div>
      <div class="task-title">
        处理任务:
        <span class="task-id" v-if="displayId">{{ displayId }}</span>
      </div>
      <div class="expand-button">
        {{ isExpanded ? '▼' : '▶' }}
      </div>
    </div>
    <div class="card-content" v-if="isExpanded">
      <div class="markdown-content" v-html="formattedContent"></div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';

export default {
  name: 'TaskCard',
  props: {
    content: {
      type: String,
      required: true
    },
    taskId: {
      type: String,
      default: ''
    },
    initialExpanded: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isExpanded: this.initialExpanded
    };
  },
  computed: {
    // 尝试从内容中提取任务ID
    extractedTaskId() {
      // 匹配"任务ID: Comparison of product category preferences across different age groups"这种格式
      const idMatch = this.content.match(/任务ID: ([^"'\n]+)/);
      if (idMatch && idMatch[1]) {
        return idMatch[1].trim();
      }
      
      // 匹配"任务 'Comparison of product category preferences across different age groups'"这种格式
      const nameMatch = this.content.match(/任务\s+'([^']+)'/);
      if (nameMatch && nameMatch[1]) {
        return nameMatch[1].trim();
      }
      
      return '';
    },
    
    // 优先使用props传入的ID，其次使用从内容中提取的ID
    displayId() {
      return this.taskId || this.extractedTaskId;
    },
    
    formattedContent() {
      // 处理可能的markdown格式
      try {
        return marked(this.content);
      } catch (e) {
        return `<pre>${this.content}</pre>`;
      }
    }
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    }
  }
};
</script>

<style scoped>
.task-card {
  margin: 12px 0;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  background-color: #fafafa;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
}

.task-icon {
  font-size: 18px;
  margin-right: 8px;
}

.task-title {
  font-weight: 500;
  color: #666;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-id {
  font-size: 0.8em;
  color: #666;
  margin-left: 8px;
  font-weight: normal;
  max-width: 70%; /* 限制ID的最大宽度 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-button {
  color: #666;
  font-size: 14px;
  transition: transform 0.2s;
}

.card-content {
  padding: 16px;
  background-color: white;
  max-width: 100%;
  box-sizing: border-box;
}

.markdown-content {
  line-height: 1.6;
  color: #666;
  word-wrap: break-word;
  overflow-wrap: break-word;
  padding-right: 8px;
}

.markdown-content :deep(ul) {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-content :deep(li) {
  margin-bottom: 6px;
}

.markdown-content :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}
</style> 