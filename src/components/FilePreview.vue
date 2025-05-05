<template>
  <div class="file-preview-card" @click="openPreview">
    <div class="file-icon">{{ getFileIcon(fileType) }}</div>
    <div class="file-info">
      <div class="file-title">{{ fileName }}</div>
      <div class="file-description">{{ getFileDescription(fileType) }} • 点击查看</div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FilePreview',
  props: {
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      default: 'other'
    }
  },
  emits: ['preview'],
  setup(props, { emit }) {
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

    const getFileDescription = (type) => {
      const descriptions = {
        'markdown': 'Markdown文档',
        'report': '分析报告',
        'html': 'HTML页面',
        'image': '图片文件',
        'json': 'JSON数据',
        'csv': '数据表格',
        'other': '文件'
      };
      return descriptions[type] || descriptions.other;
    };

    const openPreview = () => {
      emit('preview', {
        fileName: props.fileName,
        filePath: props.filePath,
        fileType: props.fileType
      });
    };

    return {
      getFileIcon,
      getFileDescription,
      openPreview
    };
  }
});
</script>

<style scoped>
.file-preview-card {
  display: flex;
  align-items: center;
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-left: 3px solid #1890ff;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
  margin-bottom: 8px;
  opacity: 0.85;
}

.file-preview-card:hover {
  background-color: #f0f0f0;
  border-color: #d0d0d0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.file-icon {
  font-size: 20px;
  margin-right: 12px;
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-info {
  flex: 1;
  overflow: hidden;
}

.file-title {
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.file-description {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 