<template>
    <div class="main-container">
      <div class="chat-container">
        
        <div class="chat-messages">
          <!-- User query bubble (right side) -->
          <div class="message-group user-message">
            <div class="message-content user-content">
              <div class="message-bubble user-bubble">
                <p>{{ query }}</p>
              </div>
              <div class="attachment-section" @click="toggleDatasetPreview">
                <div class="attachment-card">
                  <div class="attachment-icon">📊</div>
                  <div class="attachment-info">
                    <div class="attachment-name">shopping.csv</div>
                    <div class="attachment-meta">Dataset • Click to view</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="avatar user-avatar">
              <span class="avatar-icon">👤</span>
            </div>
          </div>
          
          <!-- AI response bubble (left side) -->
          <div class="message-group ai-message">
            <div class="avatar ai-avatar">
              <span class="avatar-icon">🌲</span>
            </div>
            <div class="message-content ai-content">
              <div class="message-bubble ai-bubble">
                <p>I'll analyze the differences between customers based on the shopping dataset.</p>
                
                <!-- Main AI response content -->
                <div class="ai-response-content">
                  <!-- 直接显示内容块 -->
                  <div v-for="(block, index) in displayedBlocks" :key="index" class="content-block">
                    <!-- Normal text content -->
                    <div v-if="block.type === 'text'" class="text-block">
                      <FileLinkDetector 
                        :content="block.content" 
                        @file-preview="selectFile" 
                      />
                    </div>
                    
                    <!-- Code block (clickable) -->
                    <div v-else-if="block.type === 'code'" 
                         class="code-block-preview"
                         @click="selectCodeBlock(block)">
                      <div class="code-block-icon">💻</div>
                      <div class="code-block-info">
                        <div class="code-block-title">{{ block.isJson ? 'JSON Data' : 'Code Block' }}</div>
                        <div class="code-block-preview-text">{{ getCodePreview(block.content) }}</div>
                      </div>
                    </div>
                    
                    <!-- 生成过程块（可折叠） -->
                    <StatusTimeline
                      v-else-if="block.type === 'status-group'"
                      :items="block.items"
                      :initialExpanded="block.expanded"
                    />
                    
                    <!-- 任务处理块（卡片式显示） -->
                    <TaskCard
                      v-else-if="block.type === 'task-block'"
                      :content="block.content"
                      :taskId="block.id"
                    />
                    
                    <!-- 文件预览组件 -->
                    <FilePreview
                      v-else-if="block.type === 'file'"
                      :fileName="block.fileName"
                      :filePath="block.filePath"
                      :fileType="block.fileType"
                      @preview="selectFile"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Code block detail panel -->
      <div class="detail-panel" v-if="selectedCodeBlock">
        <CodeBlock 
          :content="selectedCodeBlock.content"
          :isJson="selectedCodeBlock.isJson"
        />
        <button class="close-btn" @click="closeCodeDetail">×</button>
      </div>
      
      <!-- File preview panel -->
      <div class="detail-panel" v-if="selectedFile">
        <MarkdownPreview 
          v-if="selectedFile.fileType === 'markdown' || selectedFile.fileType === 'report'"
          :filePath="selectedFile.filePath"
          :fileName="selectedFile.fileName"
        />
        <iframe 
          v-else-if="selectedFile.fileType === 'html'"
          :src="selectedFile.filePath"
          class="html-preview"
          frameborder="0"
        ></iframe>
        <img 
          v-else-if="selectedFile.fileType === 'image'"
          :src="selectedFile.filePath"
          class="image-preview"
          alt="File preview"
        />
        <button class="close-btn" @click="closeFilePreview">×</button>
      </div>
      
      <!-- Dataset Preview Modal -->
      <DatasetPreview 
        v-if="isDatasetPreviewVisible" 
        :isLoading="isLoading"
        :datasetError="datasetError"
        :datasetHeaders="datasetHeaders"
        :datasetRows="datasetRows"
        @close="toggleDatasetPreview"
      />
      
      <!-- Fullscreen image preview -->
      <div v-if="fullScreenImage" class="fullscreen-overlay" @click="closeFullScreenImage">
        <div class="fullscreen-image-container">
          <img :src="fullScreenImage" alt="Fullscreen preview" class="fullscreen-image">
          <button class="close-button" @click.stop="closeFullScreenImage">×</button>
        </div>
      </div>
      
      <!-- 回到顶部按钮 -->
      <div class="back-to-top" v-show="showBackToTop" @click="scrollToTop">
        <div class="back-to-top-icon">↑</div>
      </div>

      <!-- 显示所有生成文件按钮 -->
      <div class="show-files-button" @click="scanIterationsDirectory">
        <div class="show-files-icon">📁</div>
        <div class="tooltip">扫描文件</div>
      </div>
      
      <!-- 跳过动画按钮 -->
      <div class="skip-animation-button" v-if="!isTypingComplete" @click="skipTypingAnimation">
        <div class="skip-animation-icon">⏭️</div>
        <div class="tooltip">跳过动画</div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted } from 'vue'
  import DatasetPreview from '@/components/chat/DatasetPreview.vue'
  import CodeBlock from '@/components/CodeBlock.vue'
  import StatusTimeline from '@/components/StatusTimeline.vue'
  import TaskCard from '@/components/TaskCard.vue'
  import MarkdownPreview from '@/components/MarkdownPreview.vue'
  import FilePreview from '@/components/FilePreview.vue'
  import FileLinkDetector from '@/components/FileLinkDetector.vue'
  
  export default {
    name: 'ChatPage',
    components: {
      DatasetPreview,
      CodeBlock,
      StatusTimeline,
      TaskCard,
      MarkdownPreview,
      FilePreview,
      FileLinkDetector
    },
    setup() {
      const query = ref("Analyze the difference between the customers")
      const isDatasetPreviewVisible = ref(false)
      const datasetHeaders = ref([])
      const datasetRows = ref([])
      const isLoading = ref(false)
      const datasetError = ref(null)
      const fullScreenImage = ref(null)
      const introContent = ref('')
      const contentBlocks = ref([]) // 全部内容块
      const displayedBlocks = ref([]) // 实际显示的内容块
      const isTypingComplete = ref(false) // 是否已完成打字
      const typingSpeed = ref(20) // 打字速度（毫秒/行），从100改为20使其更快
      const selectedCodeBlock = ref(null)
      const showBackToTop = ref(false)
      const selectedFile = ref(null)
      const generatedFiles = ref([])
      
      // 准备显示的内容单元（更细粒度的显示单位）
      const contentUnits = ref([]);
      const displayedUnits = ref([]);
      const currentUnitIndex = ref(0);
      // 保存定时器引用
      let typingIntervalRef = null;
      
      const selectCodeBlock = (block) => {
        selectedCodeBlock.value = block
      }
      
      const closeCodeDetail = () => {
        selectedCodeBlock.value = null
      }
      
      const getCodePreview = (code) => {
        if (code.length <= 80) {
          return code
        }
        return code.substring(0, 80) + '...'
      }
      
      const formatTextWithHighlights = (text) => {
        // 检查文本中是否包含标签
        const containsHTMLTags = /<span|<div|<p/i.test(text);
        if (containsHTMLTags) {
          console.log("文本已包含HTML标签，直接返回");
          return text; // 如果已包含HTML标签，直接返回，避免破坏已有标签
        }
        
        // 高亮关键词和短语
        const keywords = [
          'Finding', 'available action', 'Trying action',
          'MCTS search started', 'MCTS search completed', 
          'Iteration', 'Simulation', 'state', 'depth',
          'Selected action', 'Executing action', 'Found'
        ];
        
        // 转义HTML
        let result = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // 特殊动作标签 - 为每个动作指定不同的类名和匹配模式
        const actionKeywords = [
          {action: 'Query2Chapters', className: 'action-query-chapters'},
          {action: 'ReviseVis', className: 'action-revise'}, 
          {action: 'Charts2Captions', className: 'action-charts-captions'}, 
          {action: 'Captions2Summaries', className: 'action-captions-summaries'}, 
          {action: 'Chapter2Tasks', className: 'action-chapter-tasks'}, 
          {action: 'Tasks2Charts', className: 'action-tasks-charts'}
        ];
        
        // 使用最直接的字符串分割和连接方法处理每个动作名称
        for (const item of actionKeywords) {
          // 进行分割处理，处理一个动作名称出现多次的情况
          let parts = result.split(item.action);
          if (parts.length > 1) {
            // 说明找到了至少一个匹配
            console.log(`替换动作 ${item.action}, 出现 ${parts.length - 1} 次`);
            result = parts.join(`<span class="action-tag ${item.className}">${item.action}</span>`);
          }
        }
        
        // 高亮关键词
        keywords.forEach(keyword => {
          const regex = new RegExp(`(${keyword})`, 'gi');
          result = result.replace(regex, '<span class="highlight">$1</span>');
        });
        
        return result;
      };
      
      const openFullScreenImage = (imageSrc) => {
        fullScreenImage.value = imageSrc
      }
  
      const closeFullScreenImage = () => {
        fullScreenImage.value = null
      }
      
      const toggleDatasetPreview = async () => {
        isDatasetPreviewVisible.value = !isDatasetPreviewVisible.value
        
        // Load dataset on first open
        if (isDatasetPreviewVisible.value && datasetRows.value.length === 0) {
          await loadDataset()
        }
      }
      
      const loadDataset = async () => {
        isLoading.value = true
        datasetError.value = null
        try {
          const response = await fetch('/storyteller/dataset/shopping.csv')
          if (!response.ok) {
            throw new Error(`Failed to load dataset (${response.status})`)
          }
          
          const csvText = await response.text()
          const lines = csvText.split('\n').filter(line => line.trim() !== '')
          
          if (lines.length > 0) {
            datasetHeaders.value = lines[0].split(',').map(h => h.trim())
            
            // Only load up to 100 rows for performance
            const maxRows = Math.min(lines.length - 1, 100)
            datasetRows.value = lines.slice(1, maxRows + 1).map(line => 
              line.split(',').map(cell => cell.trim())
            )
          }
        } catch (error) {
          console.error('Error loading dataset:', error)
          datasetError.value = error.message
        } finally {
          isLoading.value = false
        }
      }
  
      onMounted(async () => {
        try {
          // 添加滚动监听
          window.addEventListener('scroll', handleScroll)
          
          // Read log.txt file
          const response = await fetch('/storyteller/output/log.txt')
          const logContent = await response.text()
          
          // 测试: 在内容中添加带样式的状态信息
          const styledContent = logContent
            .replace(
              /当前状态: ([A-Za-z0-9_.]+)/g, 
              '<div class="state-wrapper"><span class="state-tag">当前状态: $1</span></div>'
            );
          
          // 直接提取并解析整个日志内容
          introContent.value = styledContent
          parseContentBlocks(styledContent)
          
          // 检查是否存在代码块，如果有则在控制台输出
          if (contentBlocks.value.some(block => block.type === 'code')) {
            console.log('发现代码块:', contentBlocks.value.filter(block => block.type === 'code').length)
          } else {
            console.log('未找到代码块')
          }
          
          // 立即执行文件扫描
          console.log("页面加载完成，自动执行文件扫描");
          setTimeout(() => {
            scanIterationsDirectory();
          }, 1000); // 延迟1秒执行，确保其他内容已加载完成
          
        } catch (error) {
          console.error('Failed to load log file:', error)
        }
      })
  
      onUnmounted(() => {
        // 移除滚动监听
        window.removeEventListener('scroll', handleScroll);
        
        // 清除打字机效果的定时器
        if (typingIntervalRef) {
          clearInterval(typingIntervalRef);
        }
      })
  
      // 处理滚动事件，显示/隐藏回到顶部按钮
      const handleScroll = () => {
        // 当页面滚动超过300px时显示回到顶部按钮
        showBackToTop.value = window.scrollY > 300
      }
  
      // 将解析好的内容块逐步显示出来
      const startTypingAnimation = () => {
        // 如果还没准备内容单元，先准备
        if (contentUnits.value.length === 0) {
          prepareContentUnits();
        }
        
        // 如果动画已完成或没有内容，直接返回
        if (isTypingComplete.value || contentUnits.value.length === 0) {
          return null;
        }
        
        // 智能滚动控制
        let shouldAutoScroll = true; // 默认自动滚动
        
        // 添加滚动事件检测用户是否在底部
        const scrollHandler = () => {
          // 检查用户是否滚动到接近底部
          const scrollPosition = window.scrollY + window.innerHeight;
          const nearBottom = document.body.scrollHeight - scrollPosition < 100;
        
          // 更新自动滚动状态
          shouldAutoScroll = nearBottom;
          
          // 如果已经在底部，添加标志"关注底部"
          if (nearBottom) {
            console.log("用户在底部，启用自动滚动");
          } else {
            console.log("用户不在底部，暂停自动滚动");
          }
        };
        
        // 添加滚动监听
        window.addEventListener('scroll', scrollHandler);
        
        // 初始检查一次
        scrollHandler();
        
        // 从当前位置继续显示
        const typingInterval = setInterval(() => {
          if (currentUnitIndex.value < contentUnits.value.length) {
            // 添加下一个内容单元
            processNextContentUnit();
            
            // 更新索引
            currentUnitIndex.value++;
            
            // 根据用户位置决定是否自动滚动
            if (shouldAutoScroll) {
              setTimeout(() => {
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: 'smooth'
                });
              }, 50);
            }
          } else {
            // 全部显示完毕，清除定时器和事件监听
            clearInterval(typingInterval);
            window.removeEventListener('scroll', scrollHandler);
            isTypingComplete.value = true;
            typingIntervalRef = null;
            
            // 动画完成后扫描iterations目录下的文件
            setTimeout(() => {
              scanIterationsDirectory();
            }, 500);
          }
        }, typingSpeed.value);
        
        // 保存定时器引用，以便可以在组件卸载时清除
        typingIntervalRef = typingInterval;
        return typingInterval;
      }
  
      // 处理下一个内容单元
      const processNextContentUnit = () => {
        const unit = contentUnits.value[currentUnitIndex.value];
        
        // 根据单元类型进行不同处理
        if (unit.type === 'line') {
          // 普通文本行
          displayedUnits.value.push(unit);
          
          // 基于当前内容单元构建要显示的内容块
          rebuildDisplayedBlocks();
        } else if (unit.type === 'block-start') {
          // 块开始标记，创建一个新块
          displayedUnits.value.push(unit);
        } else if (unit.type === 'block-line') {
          // 块内的行
          displayedUnits.value.push(unit);
          
          // 更新对应块的内容
          rebuildDisplayedBlocks();
        } else if (unit.type === 'block-end') {
          // 块结束标记
          displayedUnits.value.push(unit);
          rebuildDisplayedBlocks();
          
          // 在块结束时，如果是代码块，自动在右侧展示
          const lastBlock = displayedBlocks.value[displayedBlocks.value.length - 1];
          if (lastBlock && lastBlock.type === 'code') {
            // 自动展示代码块在右侧面板
            selectCodeBlock(lastBlock);
          }
        } else if (unit.type === 'whole-block') {
          // 整块显示的内容
          displayedUnits.value.push(unit);
          rebuildDisplayedBlocks();
          
          // 如果是整块显示的代码块，也在右侧展示
          const lastBlock = displayedBlocks.value[displayedBlocks.value.length - 1];
          if (lastBlock && lastBlock.type === 'code') {
            // 自动展示代码块在右侧面板
            selectCodeBlock(lastBlock);
          }
        }
      };
  
      // 基于已显示的内容单元重建显示块
      const rebuildDisplayedBlocks = () => {
        // 创建一个新的块数组
        const blocks = [];
        
        // 当前正在构建的块
        let currentBlock = null;
        let currentBlockLines = [];
        
        // 遍历所有已显示的单元
        displayedUnits.value.forEach(unit => {
          if (unit.type === 'line') {
            // 普通文本行，作为文本块添加
            blocks.push({
              type: 'text',
              content: unit.content
            });
          } else if (unit.type === 'block-start') {
            // 块开始，记录当前块类型和属性
            currentBlock = unit.block;
            currentBlockLines = [];
          } else if (unit.type === 'block-line') {
            // 块内容行，添加到当前块
            currentBlockLines.push(unit.content);
          } else if (unit.type === 'block-end') {
            // 块结束，将当前块添加到块数组
            if (currentBlock) {
              const block = { ...currentBlock };
              block.content = currentBlockLines.join('\n');
              blocks.push(block);
              currentBlock = null;
              currentBlockLines = [];
            }
          } else if (unit.type === 'whole-block') {
            // 整块显示的内容
            blocks.push(unit.block);
          }
        });
        
        // 更新显示的块
        displayedBlocks.value = blocks;
      };
        
      // 跳过打字效果，直接显示所有内容
      const skipTypingAnimation = () => {
        if (typingIntervalRef) {
          clearInterval(typingIntervalRef);
        }
        
        // 直接显示所有内容块
        displayedBlocks.value = [...contentBlocks.value];
        isTypingComplete.value = true;
        currentUnitIndex.value = contentUnits.value.length;
        
        // 立即执行文件扫描
        console.log("跳过动画，立即执行文件扫描");
        scanIterationsDirectory();
        
        // 关闭可能显示的代码块，以便后续显示report.md
        if (selectedCodeBlock.value) {
          setTimeout(() => {
            closeCodeDetail();
          }, 500);
        }
      };
  
      // 将大块内容拆分成更小的显示单元
      const prepareContentUnits = () => {
        contentUnits.value = [];
        
        // 遍历所有内容块
        contentBlocks.value.forEach(block => {
          if (block.type === 'text') {
            // 文本块按行拆分
            const lines = block.content.split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                contentUnits.value.push({
                  type: 'line',
                  content: line,
                  parentType: 'text'
                });
              }
            });
          } else if (block.type === 'task-block' || block.type === 'code') {
            // 特殊块也按行拆分
            const lines = block.content.split('\n');
            
            // 先添加一个开始标记
            contentUnits.value.push({
              type: 'block-start',
              blockType: block.type,
              block: block
            });
            
            // 逐行添加内容
            lines.forEach(line => {
              contentUnits.value.push({
                type: 'block-line',
                content: line,
                parentType: block.type
              });
            });
            
            // 添加结束标记
            contentUnits.value.push({
              type: 'block-end',
              blockType: block.type
            });
          } else {
            // 其他类型的块作为整体添加
            contentUnits.value.push({
              type: 'whole-block',
              block: block
            });
            }
        });
      };
  
      // 在parseContentBlocks函数的末尾调用打字机效果
      const parseContentBlocks = (content) => {
        console.log("开始解析内容块，内容长度:", content.length);
        
        // 清空之前的文件列表
        generatedFiles.value = [];
        
        // 待解析处理的内容
        let filteredContent = content;
        
        // 跟踪已识别的特殊区域
        const markers = [];
        
        // 用于记录任务块覆盖的位置
        const coveredPositions = {};
        
        // 识别任务块边界
        const taskBlockRegex = /==== Start of Task Block: ([a-zA-Z0-9-]+) ====([\s\S]*?)==== End of Task Block: \1 ====/g;
        let taskMatch;
        
        while ((taskMatch = taskBlockRegex.exec(filteredContent)) !== null) {
          const taskId = taskMatch[1];
          const taskContent = taskMatch[2].trim();
          const startIndex = taskMatch.index;
          const endIndex = taskMatch.index + taskMatch[0].length;
          
          // 记录这个任务块的起止位置
          markers.push({
            type: 'task-block',
            id: taskId,
            content: taskContent,
            start: startIndex,
            end: endIndex
          });
          
          // 标记任务块覆盖的所有位置
          for (let i = startIndex; i < endIndex; i++) {
            coveredPositions[i] = true;
          }
        }
        
        // 识别代码块
        const codeBlockRegex = /```(?:(?:(json))|(?:[a-zA-Z]*))\n([\s\S]*?)```/g;
        let codeMatch;
        
        while ((codeMatch = codeBlockRegex.exec(filteredContent)) !== null) {
          const isJson = !!codeMatch[1]; // 检查是否是json代码块
          const codeContent = codeMatch[2];
          const startIndex = codeMatch.index;
          const endIndex = codeMatch.index + codeMatch[0].length;
          
          // 记录代码块位置
            markers.push({
            type: 'code',
            content: codeContent,
            isJson,
            start: startIndex,
            end: endIndex
          });
        }
        
        // 识别状态组
        const statusListRegex = /(- \[.*?\] .*(?:\n {2,}[^\n]+)*(?:\n(?:- \[.*?\] .*(?:\n {2,}[^\n]+)*))+)/g;
        let statusMatch;
        
        while ((statusMatch = statusListRegex.exec(filteredContent)) !== null) {
          const statusContent = statusMatch[0];
          const startIndex = statusMatch.index;
          const endIndex = statusMatch.index + statusMatch[0].length;
          
          // 解析状态列表项
          const statusItemRegex = /- \[(.*?)\] (.*?)(?:\n|$)(?:\n {2,}([^\n]+))?/g;
          const statusItems = [];
          let statusItemMatch;
          
          // 重置lastIndex以便从statusContent的开头开始搜索
          statusItemRegex.lastIndex = 0;
          
          while ((statusItemMatch = statusItemRegex.exec(statusContent)) !== null) {
            const status = statusItemMatch[1].trim() === 'x' ? 'done' : 
                          statusItemMatch[1].trim() === '~' ? 'abandoned' : 'pending';
            
            statusItems.push({
              status,
              text: statusItemMatch[2],
              detail: statusItemMatch[3] || ''
            });
          }
          
          // 如果至少有2个状态项，才添加为状态组
          if (statusItems.length >= 2) {
            markers.push({
              type: 'status-group',
              items: statusItems,
              start: startIndex,
              end: endIndex
            });
          }
        }
        
        // 最终内容块数组
        let blocks = [];
        
        // 先添加所有任务块
        for (const marker of markers.filter(m => m.type === 'task-block')) {
          blocks.push({
            type: 'task-block',
            id: marker.id,
            content: marker.content,
            position: marker.start
          });
        }
        
        // 添加所有非任务块标记
        for (const marker of markers.filter(m => m.type !== 'task-block')) {
          // 检查该标记是否在任务块覆盖的区域内
          let isInsideTaskBlock = false;
          // 检查标记的中心点是否在任务块内，或者大部分内容是否在任务块内
          const markerLength = marker.end - marker.start;
          let coveredCount = 0;
          
          for (let i = marker.start; i < marker.end; i++) {
            if (coveredPositions[i]) {
              coveredCount++;
            }
          }
          
          // 如果超过70%的内容在任务块内，则认为它是任务块的一部分
          if (coveredCount / markerLength > 0.7) {
            isInsideTaskBlock = true;
            // 输出日志，记录过滤掉的代码块内容
            if (marker.type === 'code') {
              console.log('过滤掉任务块内的代码块:', marker.content.substring(0, 50) + (marker.content.length > 50 ? '...' : ''));
            }
          }
          
          // 如果不在任务块内，才添加到blocks中
          if (!isInsideTaskBlock) {
          if (marker.type === 'code') {
            blocks.push({
              type: 'code',
              content: marker.content,
              isJson: marker.isJson,
              position: marker.start
            });
          } else if (marker.type === 'status-group') {
            blocks.push({
              type: 'status-group',
              items: marker.items,
              expanded: false,
              position: marker.start
            });
            }
          }
        }
        
        // 处理文本间隙：将未被任何标记覆盖的内容作为文本块添加
        let textStart = 0;
        let inText = false;
        
        for (let i = 0; i < filteredContent.length; i++) {
          // 检查当前位置是否被任何标记覆盖
          let isMarked = false;
          for (const marker of markers) {
            if (i >= marker.start && i < marker.end) {
              isMarked = true;
              break;
            }
          }
          
          // 如果没有被标记，且不是任务块区域，则为普通文本
          if (!isMarked && !coveredPositions[i]) {
            if (!inText) {
              // 开始一个新的文本块
              textStart = i;
              inText = true;
            }
          } else if (inText) {
            // 结束当前文本块
            const textContent = filteredContent.substring(textStart, i).trim();
            if (textContent) {
              blocks.push({
                type: 'text',
                content: textContent,
                position: textStart
              });
            }
            inText = false;
          }
        }
        
        // 处理最后一个可能的文本块
        if (inText) {
          const textContent = filteredContent.substring(textStart).trim();
          if (textContent) {
            blocks.push({
              type: 'text',
              content: textContent,
              position: textStart
            });
          }
        }
        
        // 按照原始位置排序所有内容块
        blocks.sort((a, b) => {
          const posA = a.position !== undefined ? a.position : Infinity;
          const posB = b.position !== undefined ? b.position : Infinity;
          return posA - posB;
        });
        
        // 去除位置信息（不需要传递给UI）
        blocks = blocks.map(item => {
          // eslint-disable-next-line no-unused-vars
          const { position, ...rest } = item;
          return rest;
        });
        
        // 添加总结日志
        const blockTypeCounts = blocks.reduce((counts, block) => {
          counts[block.type] = (counts[block.type] || 0) + 1;
          return counts;
        }, {});
        
        console.log("解析完成，内容块总数:", blocks.length);
        console.log("各类型块数量:", blockTypeCounts);
        
        contentBlocks.value = blocks;
        
        // 启动打字机效果
        if (typingIntervalRef) {
          clearInterval(typingIntervalRef);
        }
        typingIntervalRef = startTypingAnimation();
      }
  
      const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
  
      // 选择文件进行预览
      const selectFile = (file) => {
        console.log(`预览文件: ${file.fileName}, 类型: ${file.fileType}, 路径: ${file.filePath}`);
        
        // 对于图片文件，先检查是否存在
        if (file.fileType === 'image') {
          checkAndPreviewImage(file);
        } else {
          selectedFile.value = file;
        }
        
        // 如果已经打开了代码块详情，则关闭它
        if (selectedCodeBlock.value) {
          selectedCodeBlock.value = null;
        }
      }
  
      // 检查图片是否存在并预览
      const checkAndPreviewImage = (file) => {
        // 先检查原始URL格式 storyteller/output/iterations/iteration_X/charts/
        // const originalUrlPattern = /storyteller\/output\/iterations\/iteration_\d+\/charts\//;
        
        // 尝试的路径数组
        const pathsToTry = [
          file.filePath, // 原始路径
          `/${file.filePath}`, // 添加前导斜杠
          `/storyteller/output/iterations/iteration_1/charts/${file.fileName}`, // 最可能的路径
          `/storyteller/output/iterations/iteration_2/charts/${file.fileName}`,
          `/storyteller/output/iterations/iteration_3/charts/${file.fileName}`,
          `/storyteller/output/visualizations/${file.fileName}`,
          `/storyteller/output/images/${file.fileName}`,
          `/storyteller/output/charts/${file.fileName}`
        ];
        
        console.log(`尝试加载图片: ${file.fileName}，共${pathsToTry.length}个可能路径`);
        tryLoadImage(pathsToTry, 0, file);
      }
  
      // 递归尝试加载不同路径的图片
      const tryLoadImage = (paths, index, file) => {
        if (index >= paths.length) {
          // 所有路径都尝试过了，显示错误
          console.error(`无法加载图片，所有路径都失败: ${file.fileName}`);
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          // 图片加载成功
          console.log(`图片在替代路径加载成功: ${paths[index]}`);
          file.filePath = paths[index]; // 更新文件路径
          selectedFile.value = file;
        };
        img.onerror = () => {
          // 尝试下一个路径
          tryLoadImage(paths, index + 1, file);
        };
        img.src = paths[index];
      }
  
      // 关闭文件预览
      const closeFilePreview = () => {
        selectedFile.value = null
      }
  
      // 在动画完成后扫描显示iterations目录下的所有文件
      const scanIterationsDirectory = async () => {
        console.log("开始扫描本地目录下的文件...");
        
        // 清空当前文件列表
        generatedFiles.value = [];
        
        // 结果数组
        const foundFiles = [];
        
        try {
          // 要扫描的目录 - 这些路径用于fetch请求 - 减少路径数量，只扫描高优先级目录
          const highPriorityPaths = [
            "/storyteller/output/iterations/iteration_1/charts",
            "/storyteller/output/iterations/iteration_1/reports",
            "/storyteller/output/iterations/iteration_2/charts",
            "/storyteller/output/iterations/iteration_3/charts"
          ];
          
          // 创建一个工具函数，用于带超时的获取文件
          const fetchWithTimeout = async (url, options = {}, timeout = 1000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            
            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal
              });
              clearTimeout(id);
              return response;
            } catch (error) {
              clearTimeout(id);
              throw error;
            }
          };
          
          // 直接尝试常见的报告文件 - 最高优先级
          const commonReportFiles = [
            "/storyteller/output/iterations/iteration_1/reports/report.md",
            "/storyteller/output/iterations/iteration_1/report.md",
            "/storyteller/output/iterations/iteration_1/reports/summary.md",
            "/storyteller/output/iterations/iteration_2/reports/report.md"
          ];
          
          // 并行检查报告文件
          const reportFilePromises = commonReportFiles.map(async (filePath) => {
            try {
              const response = await fetchWithTimeout(filePath, { method: 'HEAD' }, 800);
              if (response.ok) {
                console.log(`找到报告文件: ${filePath}`);
                const fileName = filePath.split('/').pop();
                foundFiles.push({
                  fileName,
                  filePath,
                  fileType: 'markdown',
                  priority: 1 // 高优先级
                });
                return true;
              }
            } catch (err) {
              // 忽略错误
            }
            return false;
          });
          
          // 等待所有报告文件检查完成
          await Promise.all(reportFilePromises);
          
          // 常见的图表文件
          const commonChartFiles = [
            "/storyteller/output/iterations/iteration_1/charts/Comparison of purchase amount by gender.png",
            "/storyteller/output/iterations/iteration_1/charts/Comparison of product category preferences across different age groups.png",
            "/storyteller/output/iterations/iteration_1/charts/Analysis of correlation between purchase amount and previous purchases.png",
            "/storyteller/output/iterations/iteration_1/charts/Customer segmentation based on purchase behavior.png",
            "/storyteller/output/iterations/iteration_1/charts/AgeDistribution.png",
            "/storyteller/output/iterations/iteration_1/charts/GenderDistribution.png",
            "/storyteller/output/iterations/iteration_1/charts/PurchaseAmountDistribution.png",
            "/storyteller/output/iterations/iteration_1/charts/CategoryPreference.png",
            "/storyteller/output/iterations/iteration_1/charts/CustomerSegmentation.png"
          ];
          
          // 并行检查常见图表文件
          const chartFilePromises = commonChartFiles.map(async (filePath) => {
            try {
              const response = await fetchWithTimeout(filePath, { method: 'HEAD' }, 800);
              if (response.ok) {
                console.log(`找到图表文件: ${filePath}`);
                const fileName = filePath.split('/').pop();
                foundFiles.push({
                  fileName,
                  filePath,
                  fileType: 'image',
                  priority: 2 // 次高优先级
                });
                return true;
              }
            } catch (err) {
              // 忽略错误
            }
            return false;
          });
          
          // 等待所有图表文件检查完成
          await Promise.all(chartFilePromises);
          
          // 如果已经找到了足够的文件（至少1个报告和3个图表），则直接返回结果
          const foundReports = foundFiles.filter(f => f.fileType === 'markdown').length;
          const foundCharts = foundFiles.filter(f => f.fileType === 'image').length;
          
          if (foundReports >= 1 && foundCharts >= 3) {
            console.log("已找到足够的文件，跳过后续扫描");
          } else {
            // 如果没有找到足够的文件，则继续扫描常见目录
            // 仅在前面的快速扫描没有找到足够文件时执行
            
            // 并行扫描所有高优先级目录
            const scanPromises = highPriorityPaths.map(dirPath => {
              return scanHighPriorityDirectory(dirPath, foundFiles);
            });
            
            await Promise.all(scanPromises);
          }
        } catch (err) {
          console.error("扫描过程中发生错误:", err);
        }
        
        // 如果找到了文件，添加到生成文件列表并显示
        if (foundFiles.length > 0) {
          console.log(`总共找到 ${foundFiles.length} 个文件`);
          
          // 去除重复文件
          const uniqueFiles = [];
          const seenPaths = new Set();
          
          for (const file of foundFiles) {
            if (!seenPaths.has(file.filePath)) {
              seenPaths.add(file.filePath);
              uniqueFiles.push(file);
            }
          }
          
          // 按优先级和文件类型排序
          uniqueFiles.sort((a, b) => {
            // 首先按优先级排序
            const priorityA = a.priority || 999;
            const priorityB = b.priority || 999;
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            
            // 其次按文件类型排序
            const typeOrder = { 'markdown': 1, 'image': 2, 'html': 3, 'json': 4, 'csv': 5, 'text': 6, 'other': 7 };
            const typeA = typeOrder[a.fileType] || 999;
            const typeB = typeOrder[b.fileType] || 999;
            return typeA - typeB;
          });
          
          // 更新生成文件列表
          generatedFiles.value = uniqueFiles;
          
          // 创建内容块显示找到的文件
          const fileDisplayBlock = {
            type: 'text',
            content: `## 扫描结果\n共找到 ${uniqueFiles.length} 个文件:`
          };
          
          // 移除现有的扫描结果和文件块
          contentBlocks.value = contentBlocks.value.filter(
            block => !(
              (block.type === 'text' && 
               (block.content.includes('扫描结果') || block.content.includes('文件 ('))) || 
              block.type === 'file'
            )
          );
          
          // 添加标题块
          contentBlocks.value.push(fileDisplayBlock);
          
          // 分类文件
          const imageFiles = uniqueFiles.filter(file => file.fileType === 'image');
          const docFiles = uniqueFiles.filter(file => ['markdown', 'html', 'text'].includes(file.fileType));
          const dataFiles = uniqueFiles.filter(file => ['json', 'csv'].includes(file.fileType));
          const otherFiles = uniqueFiles.filter(file => 
            !['image', 'markdown', 'html', 'text', 'json', 'csv'].includes(file.fileType)
          );
          
          // 先添加文档文件（优先级最高）
          if (docFiles.length > 0) {
            contentBlocks.value.push({
              type: 'text',
              content: `### 文档文件 (${docFiles.length}个)`
            });
            
            for (const file of docFiles) {
              contentBlocks.value.push({
                type: 'file',
                fileName: file.fileName,
                filePath: file.filePath,
                fileType: file.fileType
              });
            }
            
            // 自动在右侧显示report.md文件
            setTimeout(() => {
              // 寻找report.md文件
              const reportFile = docFiles.find(file => 
                file.fileName.toLowerCase() === 'report.md' || 
                file.fileName.toLowerCase().includes('report') && file.fileType === 'markdown'
              );
              
              if (reportFile) {
                console.log('找到report.md文件，自动显示在右侧面板', reportFile);
                selectFile(reportFile);
              } else {
                // 如果没有找到report.md，尝试找任何markdown文件
                const anyMarkdown = docFiles.find(file => file.fileType === 'markdown');
                if (anyMarkdown) {
                  console.log('未找到report.md文件，显示第一个可用的Markdown文件', anyMarkdown);
                  selectFile(anyMarkdown);
                }
              }
            }, 500); // 减少延迟时间
          }
          
          // 添加图片文件
          if (imageFiles.length > 0) {
            contentBlocks.value.push({
              type: 'text',
              content: `### 图片文件 (${imageFiles.length}个)`
            });
            
            for (const file of imageFiles) {
              contentBlocks.value.push({
                type: 'file',
                fileName: file.fileName,
                filePath: file.filePath,
                fileType: file.fileType
              });
            }
          }
          
          // 添加数据文件
          if (dataFiles.length > 0) {
            contentBlocks.value.push({
              type: 'text',
              content: `### 数据文件 (${dataFiles.length}个)`
            });
            
            for (const file of dataFiles) {
              contentBlocks.value.push({
                type: 'file',
                fileName: file.fileName,
                filePath: file.filePath,
                fileType: file.fileType
              });
            }
          }
          
          // 添加其他文件
          if (otherFiles.length > 0) {
            contentBlocks.value.push({
              type: 'text',
              content: `### 其他文件 (${otherFiles.length}个)`
            });
            
            for (const file of otherFiles) {
              contentBlocks.value.push({
                type: 'file',
                fileName: file.fileName,
                filePath: file.filePath,
                fileType: file.fileType
              });
            }
          }
          
          // 更新显示的块
          displayedBlocks.value = [...contentBlocks.value];
        } else {
          console.log("没有找到任何文件");
          
          // 添加一个提示块
          const errorBlock = {
            type: 'text',
            content: '## 扫描结果\n未找到任何文件。请检查文件路径是否正确，或者尝试其他路径。'
          };
          
          // 移除现有的扫描结果和文件块
          contentBlocks.value = contentBlocks.value.filter(
            block => !(
              (block.type === 'text' && 
               (block.content.includes('扫描结果') || block.content.includes('文件 ('))) || 
              block.type === 'file'
            )
          );
          
          contentBlocks.value.push(errorBlock);
          
          // 更新显示的块
          displayedBlocks.value = [...contentBlocks.value];
        }
      };
      
      // 扫描高优先级目录 - 只扫描最有可能存在的文件类型
      const scanHighPriorityDirectory = async (dirPath, foundFiles) => {
        // 根据目录路径选择适当的文件类型
        let fileTypes = [];
        if (dirPath.includes('charts')) {
          fileTypes = ['png', 'jpg', 'svg']; // 图表目录主要检查图片文件
        } else if (dirPath.includes('reports')) {
          fileTypes = ['md', 'html']; // 报告目录主要检查文档文件
        } else {
          fileTypes = ['md', 'html', 'png', 'jpg']; // 其他目录检查多种类型
        }
        
        // 生成要检查的文件名数组 - 减少尝试的文件数量
        const filesToCheck = [];
        
        // 添加常见的索引和报告文件
        if (fileTypes.includes('md') || fileTypes.includes('html')) {
          filesToCheck.push(...[
            'report.md', 'summary.md', 'analysis.md',
            'index.html', 'report.html'
          ].filter(f => fileTypes.includes(f.split('.').pop())));
        }
        
        // 添加常见的数字序号图表文件
        if (fileTypes.includes('png') || fileTypes.includes('jpg') || fileTypes.includes('svg')) {
          // 只检查前5个数字序号
          for (let i = 1; i <= 5; i++) {
            for (const ext of fileTypes.filter(t => ['png', 'jpg', 'svg'].includes(t))) {
              filesToCheck.push(`chart_${i}.${ext}`);
              filesToCheck.push(`figure_${i}.${ext}`);
            }
          }
        }
        
        // 并行检查所有文件
        const fetchPromises = filesToCheck.map(async (fileName) => {
          const filePath = `${dirPath}/${fileName}`;
          try {
            const response = await fetchWithTimeout(filePath, { method: 'HEAD' }, 800);
            if (response.ok) {
              console.log(`找到文件: ${filePath}`);
              // 确定文件类型
              const ext = fileName.split('.').pop().toLowerCase();
              let fileType = detectFileType(ext);
              
              // 添加到找到的文件列表
              foundFiles.push({
                fileName,
                filePath,
                fileType,
                priority: fileType === 'markdown' ? 1 : (fileType === 'image' ? 2 : 3)
              });
              return true;
            }
          } catch (err) {
            // 忽略错误
          }
          return false;
        });
        
        // 等待所有检查完成
        await Promise.all(fetchPromises);
      };
      
      // 并设置一个带超时的fetch工具函数
      const fetchWithTimeout = async (url, options = {}, timeout = 1000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          clearTimeout(id);
          return response;
        } catch (error) {
          clearTimeout(id);
          throw error;
        }
      };
      
      // 根据扩展名检测文件类型
      const detectFileType = (ext) => {
        if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
          return 'image';
        } else if (ext === 'md') {
          return 'markdown';
        } else if (ext === 'html') {
          return 'html';
        } else if (['json', 'csv'].includes(ext)) {
          return ext;
        } else if (ext === 'txt') {
          return 'text';
        } else {
          return 'other';
        }
      };
  
      return {
        query,
        isDatasetPreviewVisible,
        datasetHeaders,
        datasetRows,
        isLoading,
        datasetError,
        fullScreenImage,
        introContent,
        contentBlocks,
        displayedBlocks,
        isTypingComplete,
        typingSpeed,
        selectedCodeBlock,
        selectCodeBlock,
        closeCodeDetail,
        getCodePreview,
        formatTextWithHighlights,
        openFullScreenImage,
        closeFullScreenImage,
        toggleDatasetPreview,
        loadDataset,
        showBackToTop,
        scrollToTop,
        skipTypingAnimation,
        selectedFile,
        selectFile,
        closeFilePreview,
        scanIterationsDirectory
      }
    }
  }
  </script>
  
  <style scoped>
  /* Main container */
  .main-container {
    display: flex;
    flex: 1;
    position: relative;
    overflow: hidden;
    height: calc(100vh - 60px);
  }
  
  /* Chat container styles */
  .chat-container {
    width: 56%;
    overflow-y: auto;
    padding: 10px;
    box-sizing: border-box;
    scroll-behavior: smooth;
    scroll-padding: 24px;
  }
  
  .chat-messages {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .message-group {
    display: flex;
    width: 100%;
    margin-bottom: 8px;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .user-avatar {
    background-color: #f0f0f0;
    color: #666;
    margin-left: 16px;
  }
  
  .ai-avatar {
    background-color: transparent;
    color: #1890ff;
    margin-right: 16px;
  }
  
  .avatar-icon {
    font-size: 20px;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .user-content {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .ai-content {
    margin-right: auto;
    width: auto;
    max-width: 100%;
  }
  
  .message-bubble {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 8px;
    position: relative;
  }
  
  .user-bubble {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-bottom-right-radius: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .ai-bubble {
    background-color: transparent;
    padding: 0;
    border: none;
    margin-bottom: 0;
  }
  
  .ai-bubble > p {
    color: #333;
    font-size: 1em;
    margin-bottom: 16px;
  }
  
  /* AI response content styling */
  .ai-response-content {
    margin-top: 8px;
    color: #777;
    font-size: 0.92em;
  }
  
  .content-block {
    margin-bottom: 8px;
  }
  
  .text-block {
    white-space: pre-line;
    line-height: 1.6;
    color: #777;
  }
  
  .attachment-section {
    margin-top: 8px;
    align-self: flex-end;
  }
  
  .attachment-card {
    display: flex;
    align-items: center;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    max-width: 300px;
  }
  
  .attachment-card:hover {
    background-color: #f9f9f9;
    border-color: #d0d0d0;
  }
  
  .attachment-icon {
    font-size: 24px;
    margin-right: 12px;
    color: #1890ff;
  }
  
  .attachment-info {
    flex: 1;
  }
  
  .attachment-name {
    font-weight: 500;
    color: #333;
    margin-bottom: 2px;
  }
  
  .attachment-meta {
    font-size: 12px;
    color: #666;
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
  
  /* Detail panel fixed position styles */
  .detail-panel {
    position: fixed;
    top: 70px; /* 考虑头部标题栏高度 */
    right: 0;
    bottom: 20px;
    width: 43%; 
    background-color: white;
    border-left: 1px solid #e0e0e0;
    border-radius: 10px;
    overflow-y: auto;
    z-index: 10;
    display: flex;
    flex-direction: column;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
    padding: 24px; /* 从16px增加到24px，增加右侧内边距 */
  }
  
  .detail-panel .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
    z-index: 15;
  }
  
  .detail-panel .close-btn:hover {
    color: #333;
  }
  
  /* 恢复左侧代码块预览样式 */
  .code-block-preview {
    display: flex;
    align-items: center;
    background-color: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-left: 3px solid #1890ff;
    border-radius: 4px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px; /* 从12px减少到8px */
    margin-bottom: 8px; /* 从12px减少到8px */
    opacity: 0.85;
  }
  
  .code-block-preview:hover {
    background-color: #f0f0f0;
    border-color: #d0d0d0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .code-block-icon {
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
  
  .code-block-info {
    flex: 1;
    overflow: hidden;
  }
  
  .code-block-title {
    font-weight: 500;
    color: #666;
    margin-bottom: 4px;
  }
  
  .code-block-preview-text {
    font-family: monospace;
    font-size: 12px;
    color: #999;
    white-space: pre-line;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 40px;
    line-height: 1.4;
  }
  
  @media (max-width: 1024px) {
    .chat-container {
      width: 100%;
    }
    
    .detail-panel {
      display: none; /* 小屏幕上隐藏详情面板 */
    }
  }
  
  /* 增加滚动条样式使其更易于控制 */
  .chat-container::-webkit-scrollbar {
    width: 12px;
  }
  
  .chat-container::-webkit-scrollbar-track {
    background: #f8f8f8;
    border-radius: 6px;
  }
  
  .chat-container::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 6px;
    border: 3px solid #f8f8f8;
  }
  
  .chat-container::-webkit-scrollbar-thumb:hover {
    background: #aaa;
  }
  
  .highlight {
    background-color: rgba(24, 144, 255, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: 500;
    color: #1890ff;
  }
  
  /* 动作标签样式 */
  .action-tag {
    display: inline-block;
    font-weight: 500;
    font-size: 0.9em;
    padding: 2px 8px;
    border-radius: 4px;
    margin: 0 2px;
    border-width: 1px;
    border-style: solid;
  }
  
  /* 测试区域样式 */
  .test-area {
    padding: 16px;
    margin: 10px 0;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 16px;
  }
  
  /* 为每个动作定义不同的颜色 */
  .action-revise {
    background-color: #edf7ed;
    color: #0f766e;
    border-color: #d1e7dd;
  }
  
  .action-charts-captions {
    background-color: #fff1f0;
    color: #cf1322;
    border-color: #ffccc7;
  }
  
  .action-captions-summaries {
    background-color: #e6f4ff;
    color: #0958d9;
    border-color: #bae0ff;
  }
  
  .action-chapter-tasks {
    background-color: #f6ffed;
    color: #389e0d;
    border-color: #d9f7be;
  }
  
  .action-query-chapters {
    background-color: #fff7e6;
    color: #d46b08;
    border-color: #ffe7ba;
  }
  
  .action-tasks-charts {
    background-color: #f9f0ff;
    color: #722ed1;
    border-color: #efdbff;
  }
  
  /* 测试状态标签样式 */
  .state-wrapper {
    display: inline-block;
    margin: 2px 0;
  }
  
  .state-tag {
    display: inline-block;
    background-color: #f5f5f5;
    color: #595959;
    font-weight: 500;
    font-size: 0.95em;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #d9d9d9;
    margin: 0 2px;
  }
  
  /* 回到顶部按钮 */
  .back-to-top {
    position: fixed;
    top: 80px; /* 改为顶部位置 */
    right: 20px;
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    transition: all 0.3s;
    z-index: 100; /* 确保按钮在其他元素上方 */
  }
  
  .back-to-top:hover {
    background-color: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .back-to-top-icon {
    font-size: 20px;
    color: #1890ff; /* 蓝色图标 */
    font-weight: bold;
  }
  
  .html-preview {
    width: 100%;
    height: 100%;
    border: none;
  }
  
  .image-preview {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    margin: 0 auto;
    display: block;
    padding: 20px;
    background-color: #f8f8f8;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  /* 显示所有生成文件按钮 */
  .show-files-button {
    position: fixed;
    top: 130px; /* 调整位置以避免与按钮重叠 */
    right: 20px;
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    transition: all 0.3s;
    z-index: 100;
  }

  .show-files-button:hover {
    background-color: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .show-files-button:hover .tooltip {
    opacity: 1;
    transform: translateX(-100%) translateY(-50%);
  }

  .show-files-icon {
    font-size: 20px;
    color: #1890ff;
    font-weight: bold;
  }
  
  .tooltip {
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateX(-80%) translateY(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    transition: all 0.3s;
    pointer-events: none;
  }
  
  .tooltip:after {
    content: '';
    position: absolute;
    top: 50%;
    right: -4px;
    transform: translateY(-50%);
    border-width: 4px 0 4px 4px;
    border-style: solid;
    border-color: transparent transparent transparent rgba(0, 0, 0, 0.7);
  }

  /* 跳过动画按钮 */
  .skip-animation-button {
    position: fixed;
    top: 180px; /* 位于文件按钮下方 */
    right: 20px;
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    transition: all 0.3s;
    z-index: 100;
  }

  .skip-animation-button:hover {
    background-color: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .skip-animation-button:hover .tooltip {
    opacity: 1;
    transform: translateX(-100%) translateY(-50%);
  }

  .skip-animation-icon {
    font-size: 20px;
    color: #ff4d4f; /* 红色图标，更显眼 */
    font-weight: bold;
  }
  </style>