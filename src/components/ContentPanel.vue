<template>
  <div 
    class="content-panel" 
    :class="{ 'visible': selectedStep }"
  >
    <div v-if="selectedStep" class="content-container">
      <div class="content-header">
        <h2>{{ getStepTitle }}</h2>
      </div>

      <div class="content-body">
        <div class="step-details">
          <div class="step-info">
            <div class="info-row">
              <span class="info-label">Type:</span>
              <span class="info-value">{{ selectedStep.type === 'iteration' ? 'MCTS Iteration' : 'Simulation State' }}</span>
            </div>
            <div v-if="selectedStep.type === 'iteration'" class="info-row">
              <span class="info-label">Iteration:</span>
              <span class="info-value">{{ selectedStep.iterationNumber }}</span>
            </div>
            <div v-else class="info-row">
              <span class="info-label">State:</span>
              <span class="info-value">{{ selectedStep.state }}</span>
            </div>
            <div v-if="selectedStep.type !== 'iteration'" class="info-row">
              <span class="info-label">Depth:</span>
              <span class="info-value">{{ selectedStep.depth }}</span>
            </div>
          </div>

          <div class="step-content-preview">
            <pre>{{ selectedStep.content }}</pre>
          </div>
        </div>

        <div v-if="selectedStep.chartPaths && selectedStep.chartPaths.length > 0" class="charts-section">
          <h3>Generated Charts</h3>
          
          <div class="charts-grid">
            <div v-for="(chart, index) in selectedStep.chartPaths" :key="index" class="chart-card">
              <div class="chart-card-header">
                <span class="chart-number">Chart {{ index + 1 }}</span>
                <span class="chart-path">{{ getChartName(chart) }}</span>
              </div>
              <div class="chart-image-container">
                <img :src="chart" :alt="`Chart ${index + 1}`" class="chart-image" @click="openFullScreenImage(chart)">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-message">
        <div class="empty-icon">📊</div>
        <h3>Select a step to view details</h3>
        <p>Choose a step from the left panel to view its details and generated charts</p>
      </div>
    </div>

    <!-- Fullscreen image preview -->
    <div v-if="fullScreenImage" class="fullscreen-overlay" @click="closeFullScreenImage">
      <div class="fullscreen-image-container">
        <img :src="fullScreenImage" alt="Fullscreen preview" class="fullscreen-image">
        <button class="close-button" @click.stop="closeFullScreenImage">×</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ContentPanel',
  props: {
    selectedStep: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const fullScreenImage = ref(null)

    const getStepTitle = computed(() => {
      if (!props.selectedStep) return ''
      
      if (props.selectedStep.type === 'iteration') {
        return `MCTS Iteration ${props.selectedStep.iterationNumber}`
      } else {
        return `Simulation State: ${props.selectedStep.state} (Depth ${props.selectedStep.depth})`
      }
    })

    const getChartName = (chartPath) => {
      const parts = chartPath.split('/')
      return parts[parts.length - 1]
    }

    const openFullScreenImage = (imageSrc) => {
      fullScreenImage.value = imageSrc
    }

    const closeFullScreenImage = () => {
      fullScreenImage.value = null
    }

    return {
      fullScreenImage,
      getStepTitle,
      getChartName,
      openFullScreenImage,
      closeFullScreenImage
    }
  }
}
</script>

<style>
.content-panel {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.content-panel.visible {
  transform: translateX(0);
  opacity: 1;
}

.content-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
}

.content-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.step-details {
  margin-bottom: 32px;
}

.step-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  min-width: 180px;
}

.info-label {
  font-weight: 500;
  color: #666;
  margin-right: 8px;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.step-content-preview {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f8f8f8;
  padding: 0;
  overflow: hidden;
}

.step-content-preview pre {
  margin: 0;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.charts-section {
  margin-top: 32px;
}

.charts-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.chart-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-card-header {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-number {
  font-weight: 600;
  color: #333;
}

.chart-path {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.chart-image-container {
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-image {
  max-width: 100%;
  max-height: 400px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.chart-image:hover {
  transform: scale(1.02);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f9f9f9;
}

.empty-message {
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-message h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.empty-message p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

/* Fullscreen image preview */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.fullscreen-image-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border: 2px solid #fff;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.close-button {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 40px;
  height: 40px;
  background-color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #333;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.close-button:hover {
  background-color: #f0f0f0;
}
</style>