<template>
  <div class="status-group-block">
    <div class="status-group-header" @click="toggleExpanded">
      <div class="status-group-icon">📋</div>
      <div class="status-group-title">
        <span v-if="items.length > 0 && items[0].content">{{ getDisplayTitle(items[0].content) }}</span>
        <span class="step-count">({{ Math.floor(items.length / 2) }}步)</span>
      </div>
      <div class="status-group-toggle">{{ expanded ? 'collapse' : 'expand' }}</div>
    </div>
    <div v-if="expanded" class="status-timeline">
      <div class="timeline-container">
        <div class="timeline-line"></div>
        <div v-for="(item, itemIndex) in items" :key="itemIndex" class="status-item">
          <div class="status-marker" :class="{ 'completed': item.status === 'generated' }"></div>
          <div class="status-content">
            <div class="status-icon">
              <span v-if="item.status === 'generating'">⏳</span>
              <span v-else-if="item.status === 'generated'"></span>
            </div>
            <div class="status-text">{{ item.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatusTimeline',
  props: {
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    initialExpanded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      expanded: this.initialExpanded
    }
  },
  methods: {
    toggleExpanded() {
      this.expanded = !this.expanded
    },
    getDisplayTitle(content) {
      // 显示完整的内容，包括"🔍 正在生成xxx"
      return content;
    }
  }
}
</script>

<style scoped>
/* 生成状态组块样式 */
.status-group-block {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.status-group-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background-color: #f0f0f0;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.status-group-header:hover {
  background-color: #e8e8e8;
}

.status-group-icon {
  margin-right: 8px;
  font-size: 16px;
  color: #666;
}

.status-group-title {
  flex: 1;
  font-weight: 500;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-count {
  margin-left: 8px;
  font-size: 12px;
  color: #666;
}

.status-group-toggle {
  font-size: 12px;
  color: #1890ff;
  margin-left: 8px;
}

/* 时间线容器和样式 */
.status-timeline {
  padding: 16px;
}

.timeline-container {
  position: relative;
  padding-left: 24px;
}

.timeline-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 8px;
  width: 2px;
  background-color: #e0e0e0;
}

.status-item {
  position: relative;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-marker {
  position: absolute;
  left: -24px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #1890ff;
  border: 2px solid #fff;
  z-index: 2;
}

.status-marker.completed {
  background-color: #52c41a;
}

.status-content {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 6px;
  padding: 8px 12px;
  width: 100%;
}

.status-icon {
  margin-right: 8px;
  font-size: 14px;
}

.status-text {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #666;
}
</style> 