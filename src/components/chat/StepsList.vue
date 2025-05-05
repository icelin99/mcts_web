<template>
  <div class="steps-container">
    <div class="steps-header">
      <h3>Execution steps</h3>
      <button class="toggle-all-btn" @click="$emit('toggle-all-steps')">
        {{ allStepsExpanded ? 'Collapse all' : 'Expand all' }}
      </button>
    </div>
    <div class="steps-list">
      <div v-for="step in steps" :key="step.id" class="step-item">
        <div class="step-header" @click="$emit('toggle-step', step)">
          <div class="step-icon">
            <span v-if="step.type === 'iteration'">🌀</span>
            <span v-else>➡️</span>
          </div>
          <div class="step-title">
            <span v-if="step.type === 'iteration'">MCTS Iteration {{ step.iterationNumber }}</span>
            <span v-else>Simulation: {{ step.state }}</span>
          </div>
          <div class="step-expand-icon">
            {{ expandedSteps[step.id] ? '▼' : '▶' }}
          </div>
        </div>
        <div v-if="expandedSteps[step.id]" class="step-content">
          <div class="step-text">
            {{ getContentPreview(step.content) }}
          </div>
          <div v-if="step.chartPaths && step.chartPaths.length > 0" class="charts-grid">
            <div 
              v-for="(chartPath, index) in step.chartPaths" 
              :key="index" 
              class="chart-card"
              @click="$emit('select-step', step)"
            >
              <img :src="chartPath" :alt="`Chart ${index + 1}`" class="chart-thumbnail">
              <div class="chart-name">{{ getChartName(chartPath) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StepsList',
  props: {
    steps: {
      type: Array,
      required: true
    },
    expandedSteps: {
      type: Object,
      required: true
    },
    allStepsExpanded: {
      type: Boolean,
      required: true
    },
    getContentPreview: {
      type: Function,
      required: true
    }
  },
  emits: ['toggle-step', 'toggle-all-steps', 'select-step'],
  setup() {
    const getChartName = (chartPath) => {
      const parts = chartPath.split('/')
      return parts[parts.length - 1]
    }

    return {
      getChartName
    }
  }
}
</script>

<style scoped>
.steps-container {
  margin-top: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.steps-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.toggle-all-btn {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
}

.toggle-all-btn:hover {
  text-decoration: underline;
}

.steps-list {
  max-height: 600px;
  overflow-y: auto;
}

.step-item {
  border-bottom: 1px solid #e0e0e0;
}

.step-item:last-child {
  border-bottom: none;
}

.step-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.step-header:hover {
  background-color: #f9f9f9;
}

.step-icon {
  margin-right: 12px;
  font-size: 16px;
}

.step-title {
  flex: 1;
  font-size: 14px;
}

.step-expand-icon {
  color: #999;
  font-size: 12px;
}

.step-content {
  padding: 16px;
  background-color: #fafafa;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.step-text {
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.chart-card {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  background-color: white;
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.chart-thumbnail {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-bottom: 1px solid #f0f0f0;
}

.chart-name {
  padding: 8px;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 