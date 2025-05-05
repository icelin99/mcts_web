<template>
  <div class="file-link-detector">
    <!-- 使用动态引用处理文本点击 -->
    <div ref="contentContainer" @click="handleTextClick"></div>
    
    <!-- 显示找到的文件链接 -->
    <div v-if="detectedFiles.length > 0" class="detected-files">
      <div class="files-section-title">相关文件:</div>
      <div class="file-links">
        <div 
          v-for="(file, index) in detectedFiles" 
          :key="index"
          class="file-link"
          @click="openFile(file)"
        >
          <span class="file-icon">{{ getFileIcon(file.fileType) }}</span>
          <span class="file-name">{{ file.fileName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue';

export default defineComponent({
  name: 'FileLinkDetector',
  props: {
    content: {
      type: String,
      required: true
    }
  },
  emits: ['file-preview'],
  setup(props, { emit }) {
    const detectedFiles = ref([]);
    const contentContainer = ref(null);
    
    // 文件类型图标映射
    const getFileIcon = (type) => {
      const icons = {
        'markdown': '📝',
        'report': '📊',
        'html': '🌐',
        'image': '🖼️',
        'json': '📋',
        'csv': '📈',
        'other': '📄'
      };
      return icons[type] || icons.other;
    };
    
    // 更新内容显示
    const updateContent = () => {
      if (!contentContainer.value) return;
      
      let text = props.content;
      
      // 检查文本中是否已包含HTML标签
      const containsHtmlTags = /<[^>]+>/.test(text);
      if (containsHtmlTags) {
        contentContainer.value.innerHTML = text;
        return;
      }
      
      // 转义HTML特殊字符
      text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // 文件路径高亮处理
      detectedFiles.value.forEach(file => {
        // 为文件路径添加高亮样式
        const escapedPath = file.originalMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedPath, 'g');
        text = text.replace(regex, `<span class="file-path-highlight" data-file-index="${detectedFiles.value.indexOf(file)}">${file.originalMatch}</span>`);
      });
      
      contentContainer.value.innerHTML = text;
    };
    
    // 文本点击处理
    const handleTextClick = (event) => {
      // 检查是否点击了文件路径高亮区域
      if (event.target.classList.contains('file-path-highlight')) {
        const fileIndex = parseInt(event.target.dataset.fileIndex);
        if (!isNaN(fileIndex) && fileIndex >= 0 && fileIndex < detectedFiles.value.length) {
          openFile(detectedFiles.value[fileIndex]);
        }
      }
    };
    
    // 检测文本中的文件路径
    const detectFilePaths = async () => {
      // 清空旧的检测结果
      detectedFiles.value = [];
      
      const content = props.content;
      
      // 更精确的文件模式匹配 - 只有特定前缀才识别文件
      const filePatterns = [
        {
          // 匹配storyteller/output路径
          pattern: /storyteller\/output(?:\/[\w.-]+)*\/([^/\s,，.。]+\.\w+)/g,
          type: 'auto'
        },
        {
          // 匹配iterations路径
          pattern: /iterations\/([^/\s,，.。]+\.\w+)/g,
          type: 'auto'
        },
        {
          // 匹配"已保存到"后面的文件路径
          pattern: /已保存到\s*(?:\/[\w.-]+)*\/([^/\s,，.。]+\.\w+)/g,
          type: 'auto'
        },
        {
          // 匹配"generated:"后面的文件
          pattern: /generated:\s*([a-zA-Z0-9_-]+\.\w+)/gi,
          type: 'auto'
        }
      ];
      
      const foundFiles = [];
      
      // 逐行检查文件引用
      const lines = content.split('\n');
      lines.forEach(line => {
        filePatterns.forEach(({ pattern, type }) => {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            if (match[1]) {
              const fileName = match[1].trim().replace(/[,，.。"']/g, '');
              const basePath = '/storyteller/output/';
              const filePath = `${basePath}${fileName}`;
              
              // 确定文件类型
              let fileType = type;
              if (type === 'auto') {
                const ext = fileName.split('.').pop().toLowerCase();
                switch (ext) {
                  case 'md': fileType = 'markdown'; break;
                  case 'html': fileType = 'html'; break;
                  case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': fileType = 'image'; break;
                  case 'json': fileType = 'json'; break;
                  case 'csv': fileType = 'csv'; break;
                  default: fileType = 'other';
                }
              }
              
              // 添加到找到的文件列表
              if (!foundFiles.some(f => f.fileName === fileName)) {
                foundFiles.push({
                  fileName,
                  filePath,
                  fileType,
                  originalMatch: match[0]
                });
              }
            }
          }
          // 重置正则表达式状态，避免下次循环问题
          pattern.lastIndex = 0;
        });
      });
      
      // 检查文件是否存在
      for (const file of foundFiles) {
        try {
          const response = await fetch(file.filePath, { method: 'HEAD' });
          if (response.ok) {
            detectedFiles.value.push(file);
            console.log(`确认文件存在: ${file.filePath}`);
          }
        } catch (err) {
          console.error(`检查文件存在性失败: ${file.filePath}`, err);
        }
      }
      
      // 检测完成后更新内容显示
      updateContent();
    };
    
    // 打开文件预览
    const openFile = (file) => {
      emit('file-preview', file);
    };
    
    // 观察内容变化
    watch(() => props.content, () => {
      detectFilePaths();
    });
    
    // 组件挂载时检测文件路径
    onMounted(() => {
      detectFilePaths();
    });
    
    // 检测完成后更新内容
    watch(detectedFiles, () => {
      updateContent();
    });
    
    return {
      contentContainer,
      detectedFiles,
      getFileIcon,
      openFile,
      handleTextClick
    };
  }
});
</script>

<style scoped>
.file-link-detector {
  position: relative;
}

.detected-files {
  margin-top: 12px;
  border-top: 1px solid #eee;
  padding-top: 8px;
}

.files-section-title {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.file-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-link {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-link:hover {
  background-color: #e8e8e8;
  border-color: #d0d0d0;
}

.file-icon {
  margin-right: 6px;
}

.file-name {
  color: #1890ff;
}

:deep(.file-path-highlight) {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
}
</style> 