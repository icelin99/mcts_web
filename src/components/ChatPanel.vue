<template>
  <div class="chat-panel">
    <div class="panel-header">
      <h2>Execution Process & Intermediate Results</h2>
    </div>
    
    <div class="step-list">
      <div v-for="step in steps" :key="step.id" class="step-item">
        <div 
          class="step-header" 
          @click="toggleStep(step)"
          :class="{ 'active': selectedStep && selectedStep.id === step.id }"
        >
          <div class="step-icon">
            <span v-if="step.type === 'iteration'">🌀</span>
            <span v-else>➡️</span>
          </div>
          <div class="step-title">
            <span v-if="step.type === 'iteration'">MCTS Iteration {{ step.iterationNumber }}</span>
            <span v-else>Simulation State: {{ step.state }} (Depth {{ step.depth }})</span>
          </div>
          <div class="step-toggle">
            <span v-if="expandedSteps[step.id]">▼</span>
            <span v-else>▶</span>
          </div>
        </div>
        
        <div v-if="expandedSteps[step.id]" class="step-content">
          <div class="step-content-preview">
            <pre>{{ getContentPreview(step.content) }}</pre>
            <div v-if="step.content.length > 300" class="show-more" @click="selectStep(step)">
              Show more...
            </div>
          </div>
          
          <div v-if="step.chartPaths && step.chartPaths.length > 0" class="chart-thumbnails">
            <div v-for="(chart, index) in step.chartPaths" :key="index" class="chart-thumbnail" @click="selectStep(step)">
              <img :src="chart" :alt="`Chart ${index + 1}`">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'ChatPanel',
  props: {
    steps: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select-step'],
  setup(props, { emit }) {
    const expandedSteps = ref({})
    const selectedStep = ref(null)
    
    // Initialize by expanding the first step
    watch(() => props.steps, (newSteps) => {
      if (newSteps.length > 0) {
        expandedSteps.value[newSteps[0].id] = true
      }
    }, { immediate: true })
    
    const toggleStep = (step) => {
      expandedSteps.value[step.id] = !expandedSteps.value[step.id]
      selectStep(step)
    }
    
    const selectStep = (step) => {
      selectedStep.value = step
      emit('select-step', step)
    }
    
    const getContentPreview = (content) => {
      if (content.length <= 300) {
        return content
      }
      return content.substring(0, 300) + '...'
    }
    
    return {
      expandedSteps,
      selectedStep,
      toggleStep,
      selectStep,
      getContentPreview
    }
  }
}
</script>

<style>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fafafa;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.step-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.step-item {
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: white;
}

.step-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background-color: #fff;
  transition: background-color 0.2s ease;
}

.step-header:hover {
  background-color: #f5f7fa;
}

.step-header.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.step-icon {
  margin-right: 12px;
  font-size: 18px;
}

.step-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.step-toggle {
  color: #999;
  font-size: 12px;
}

.step-content {
  padding: 0 12px 12px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
}

.step-content-preview {
  position: relative;
  margin: 12px 0;
  padding: 12px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-height: 200px;
  overflow-y: hidden;
}

.step-content-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.show-more {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(transparent, #f8f8f8 70%);
  text-align: center;
  cursor: pointer;
  color: #1890ff;
  font-weight: 500;
  font-size: 12px;
}

.show-more:hover {
  color: #40a9ff;
}

.chart-thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.chart-thumbnail {
  width: calc(50% - 4px);
  aspect-ratio: 4/3;
  cursor: pointer;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.chart-thumbnail:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>