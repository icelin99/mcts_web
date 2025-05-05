<template>
  <div class="dataset-modal">
    <div class="dataset-container">
      <div class="dataset-header">
        <h2>Dataset Preview: shopping.csv</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="dataset-content">
        <div v-if="isLoading" class="dataset-loading">
          <div class="loading-spinner"></div>
          <div>Loading dataset...</div>
        </div>
        
        <div v-else-if="datasetError" class="dataset-error">
          <div class="error-icon">⚠️</div>
          <div class="error-message">{{ datasetError }}</div>
        </div>
        
        <div v-else-if="datasetHeaders.length > 0" class="dataset-table-wrapper">
          <table class="dataset-table">
            <thead>
              <tr>
                <th v-for="(header, index) in datasetHeaders" :key="index">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in datasetRows" :key="rowIndex">
                <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="dataset-empty">
          No data available
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DatasetPreview',
  props: {
    isLoading: {
      type: Boolean,
      required: true
    },
    datasetError: {
      type: String,
      default: null
    },
    datasetHeaders: {
      type: Array,
      required: true
    },
    datasetRows: {
      type: Array,
      required: true
    }
  },
  emits: ['close']
}
</script>

<style scoped>
.dataset-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dataset-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  height: 80%;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.dataset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.dataset-header h2 {
  margin: 0;
  font-size: 20px;
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

.dataset-content {
  flex: 1;
  padding: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dataset-loading, 
.dataset-error, 
.dataset-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 36px;
}

.error-message {
  text-align: center;
  max-width: 400px;
}

.dataset-table-wrapper {
  overflow: auto;
  height: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.dataset-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.dataset-table th,
.dataset-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.dataset-table th {
  background-color: #f5f5f5;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 10;
}

.dataset-table tbody tr:hover {
  background-color: #f9f9f9;
}

.dataset-table td {
  white-space: nowrap;
}
</style> 