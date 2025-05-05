<template>
  <div class="markdown-preview">
    <div class="markdown-header">
      <h3 class="markdown-title">{{ fileName }}</h3>
    </div>
    <div class="markdown-content" v-html="renderedContent"></div>
    <div v-if="isLoading" class="loading-indicator">加载中...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue';

// 将Markdown转换为HTML
const renderMarkdown = (text) => {
  try {
    // 尝试导入marked库
    let marked;
    try {
      marked = require('marked');
      // 使用marked库渲染
      return marked.parse(text);
    } catch (e) {
      // marked库未找到，使用简单格式化
      console.warn('marked库未找到，使用简单格式化');
      return simpleMarkdownToHtml(text);
    }
  } catch (e) {
    console.error('Markdown渲染失败:', e);
    return simpleMarkdownToHtml(text);
  }
};

// 简单的Markdown到HTML转换
const simpleMarkdownToHtml = (text) => {
  // 转义HTML
  let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // 处理标题
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // 处理列表
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>');
  
  // 处理段落
  html = html.replace(/\n\n/g, '</p><p>');
  
  // 处理代码块
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // 处理行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 处理斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 包装成段落
  html = '<p>' + html + '</p>';
  
  // 修复列表格式
  html = html.replace(/<\/li><p>/g, '</li>');
  html = html.replace(/<\/p><li>/g, '<li>');
  
  return html;
};

export default defineComponent({
  name: 'MarkdownPreview',
  props: {
    filePath: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const renderedContent = ref('');
    const isLoading = ref(true);
    const error = ref(null);

    const fetchMarkdownContent = async () => {
      try {
        isLoading.value = true;
        error.value = null;
        
        const response = await fetch(props.filePath);
        if (!response.ok) {
          throw new Error(`无法加载文件 (${response.status})`);
        }

        const markdownText = await response.text();
        
        // 使用renderMarkdown函数处理内容
        renderedContent.value = renderMarkdown(markdownText);
      } catch (err) {
        console.error('加载Markdown文件失败:', err);
        error.value = `加载失败: ${err.message}`;
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      fetchMarkdownContent();
    });

    watch(() => props.filePath, () => {
      fetchMarkdownContent();
    });

    return {
      renderedContent,
      isLoading,
      error
    };
  }
});
</script>

<style scoped>
.markdown-preview {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.markdown-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.markdown-title {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.markdown-content {
  flex: 1;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.7;
  padding-right: 10px;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #333;
}

.markdown-content :deep(p) {
  margin: 1em 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
}

.markdown-content :deep(code) {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.9em;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 16px;
  margin: 1em 0;
  color: #666;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
}

.markdown-content :deep(th) {
  background-color: #f6f8fa;
  font-weight: 500;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #888;
}

.error-message {
  text-align: center;
  padding: 20px;
  color: #e53935;
  background-color: #ffebee;
  border-radius: 4px;
  margin-top: 20px;
}
</style> 