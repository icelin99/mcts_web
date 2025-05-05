<template>
  <div class="app">
    <header class="app-header">
      <h1>MCTS</h1>
    </header>
    
    <ChatPage />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import ChatPage from './pages/ChatPage.vue'

export default defineComponent({
  name: 'App',
  components: {
    ChatPage
  }
})
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #333;
  background-color: #f5f5f5;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-top: 60px; /* 为固定的标题栏留出空间 */
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #333333;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.app-header h1 {
  font-size: 20px;
  font-weight: 500;
}
</style>
