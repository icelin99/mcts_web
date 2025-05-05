<template>
  <div class="detail-panel" v-if="selectedStep">
    <div class="detail-header">
      <h2>{{ getStepTitle }}</h2>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    <div class="detail-content">
      <div class="detail-text">
        <pre>{{ selectedStep.content }}</pre>
      </div>
      
      <div v-if="selectedStep.chartPaths && selectedStep.chartPaths.length > 0" class="detail-charts">
        <h3>Charts</h3>
        <div class="detail-charts-grid">
          <div 
            v-for="(chartPath, index) in selectedStep.chartPaths" 
            :key="index" 
            class="detail-chart-item"
          >
            <div class="detail-chart-title">
              {{ getChartName(chartPath) }}
            </div>
            <div class="detail-chart-image">
              <img 
                :src="chartPath" 
                :alt="`Chart ${index + 1}`" 
                class="detail-chart-img"
                @click="$emit('open-full-screen', chartPath)"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailPanel',
  props: {
    selectedStep: {
      type: Object,
      default: null
    },
    getStepTitle: {
      type: Object,
      required: true
    },
    getChartName: {
      type: Function,
      required: true
    }
  },
  emits: ['close', 'open-full-screen']
}
</script>

<style scoped>
.detail-panel {
  position: fixed;
  top: 60px; /* Below header */
  right: 0;
  bottom: 0;
  width: 400px;
  background-color: white;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.detail-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #333;
}

.detail-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.detail-text {
  margin-bottom: 24px;
}

.detail-text pre {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 0;
}

.detail-charts h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
}

.detail-charts-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-chart-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-chart-title {
  font-size: 14px;
  font-weight: 500;
}

.detail-chart-image {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.detail-chart-img {
  width: 100%;
  cursor: pointer;
  transition: opacity 0.2s;
}

.detail-chart-img:hover {
  opacity: 0.9;
}
</style> 