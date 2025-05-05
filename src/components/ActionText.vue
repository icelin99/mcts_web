<template>
  <span v-html="processedText"></span>
</template>

<script>
export default {
  name: 'ActionText',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  computed: {
    processedText() {
      return this.highlightActionNames(this.text);
    }
  },
  methods: {
    highlightActionNames(text) {
      console.log("text----");
      
      // 特殊处理：如果包含"报告评估结果"，不论是否已有HTML标签都需要处理
      if (text.includes("📊") && text.includes("报告评估结果:")) {
        console.log("发现报告评估结果，进行特殊处理");
        
        // 提取总结部分的正则表达式，从"📊 报告评估结果"开始，到包含"加权总分"的行结束
        const summaryRegex = /(📊\s+报告评估结果:[\s\S]*?加权总分:.*?\d+\.\d+\/\d+)/;
        const match = text.match(summaryRegex);
        
        if (match) {
          // 找到总结部分
          const summaryText = match[1];
          const beforeSummary = text.substring(0, text.indexOf(summaryText));
          const afterSummary = text.substring(text.indexOf(summaryText) + summaryText.length);
          
          // 先移除总结文本中可能已有的标签
          let cleanSummaryText = summaryText.replace(/<[^>]*>/g, '');
          
          // 对总结部分应用样式
          const formattedSummary = cleanSummaryText.replace(
            /^(📊)\s+(报告评估结果):/m,
            '<h2>$1 <span class="report-title">$2</span>:</h2>'
          ).replace(
            /- ([^(:]*)(\s*\(\d+%\)):(.*?)(\d+\/\d+)/g,
            '<div class="result-item"><span class="result-title">- $1$2:</span>$3<span class="result-score">$4</span></div>'
          ).replace(
            /(✨ 加权总分: )(\d+\.\d+\/\d+)/g,
            '<div class="total-score">$1<span class="total-score-value">$2</span></div>'
          );
          
          // 组合最终结果
          let result = '';
          if (beforeSummary) {
            result += `<div class="analysis-section">${beforeSummary}</div>`;
          }
          
          result += `<div class="summary-section">${formattedSummary}</div>`;
          
          if (afterSummary) {
            result += `<div class="analysis-section">${afterSummary}</div>`;
          }
          
          console.log("处理后的结果:", result);
          return result;
        }
      }
      
      // 检查文本中是否已包含HTML标签
      const containsHtmlTags = /<span class="(action-tag|state-tag|summary-section|analysis-section)/.test(text);
      if (containsHtmlTags) {
        console.log("文本已包含HTML标签，直接返回");
        return text; // 已有标签情况直接返回原文
      }
      
      // 原有的检查逻辑，处理非总结部分
      // 检查是否包含总结部分
      if (text.includes("📊 报告评估结果:")) {
        // 分割文本，把总结部分提取出来
        const parts = text.split(/(📊 报告评估结果:.*)/s);
        if (parts.length >= 2) {
          let result = '';
          
          // 对前面的分析部分应用样式：字体小一点，灰一点
          if (parts[0]) {
            // 格式化前面的文本
            let analysisText = parts[0];
            // 转义HTML特殊字符
            analysisText = analysisText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            result += `<div class="analysis-section">${analysisText}</div>`;
          }
          
          // 对总结部分应用样式：字体大一点
          const summaryContent = parts[1].replace(
            /^(📊)\s+(报告评估结果):/m,
            '<h2>$1 <span class="report-title">$2</span>:</h2>'
          ).replace(
            /- ([^(:]*)(\s*\(\d+%\)):(.*?)(\d+\/\d+)/g,
            '<div class="result-item"><span class="result-title">- $1$2:</span>$3<span class="result-score">$4</span></div>'
          ).replace(
            /(✨ 加权总分: )(\d+\.\d+\/\d+)/g,
            '<div class="total-score">$1<span class="total-score-value">$2</span></div>'
          );
          
          result += `<div class="summary-section">${summaryContent}</div>`;
          console.log("jieguo",result);
          
          return result;
        }
      }
      
      // 先将HTML特殊字符转义
      let result = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // 单独处理文本中的"当前状态: XXX"，不分拆此短语
      let hasState = false;
      if (result.includes("当前状态:")) {
        const statePattern = /当前状态: ([A-Za-z0-9_.]+)/g;
        result = result.replace(statePattern, (match, state) => {
          hasState = true;
          return `<span class="state-tag">当前状态: ${state}</span>`;
        });
        
        if (hasState) {
          console.log("找到并处理了状态标签");
        }
      }
      
      // 特殊动作标签 - 为每个动作指定不同的类名
      const actionKeywords = [
        {action: 'Query2Chapters', className: 'action-query-chapters'},
        {action: 'ReviseVis', className: 'action-revise'}, 
        {action: 'Charts2Captions', className: 'action-charts-captions'}, 
        {action: 'Captions2Summaries', className: 'action-captions-summaries'}, 
        {action: 'Chapter2Tasks', className: 'action-chapter-tasks'}, 
        {action: 'Tasks2Charts', className: 'action-tasks-charts'}
      ];
      
      // 替换所有动作关键词
      for (const item of actionKeywords) {
        const regex = new RegExp(`\\b(${item.action})\\b`, 'g');
        result = result.replace(regex, `<span class="action-tag ${item.className}">$1</span>`);
      }
      
      // 高亮其他关键词
      const keywords = [
        'Finding', 'available action', 'Trying action',
        'MCTS search started', 'MCTS search completed', 
        'Iteration', 'Simulation', 'state', 'depth',
        'Selected action', 'Executing action', 'Found'
      ];
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        result = result.replace(regex, '<span class="highlight">$1</span>');
      });
      
      return result;
    }
  }
}
</script>

<style scoped>
/* 样式会自动应用到组件内 */
:deep(.action-tag) {
  display: inline-block;
  font-weight: 500;
  font-size: 0.9em;
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 2px;
  border-width: 1px;
  border-style: solid;
}

:deep(.action-revise) {
  background-color: #edf7ed;
  color: #0f766e;
  border-color: #d1e7dd;
}

:deep(.action-charts-captions) {
  background-color: #fff1f0;
  color: #cf1322;
  border-color: #ffccc7;
}

:deep(.action-captions-summaries) {
  background-color: #e6f4ff;
  color: #0958d9;
  border-color: #bae0ff;
}

:deep(.action-chapter-tasks) {
  background-color: #f6ffed;
  color: #389e0d;
  border-color: #d9f7be;
}

:deep(.action-query-chapters) {
  background-color: #fff7e6;
  color: #d46b08;
  border-color: #ffe7ba;
}

:deep(.action-tasks-charts) {
  background-color: #f9f0ff;
  color: #722ed1;
  border-color: #efdbff;
}

:deep(.highlight) {
  background-color: rgba(24, 144, 255, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
  color: #1890ff;
}

:deep(.state-tag) {
  display: inline-block;
  background-color: #f5f5f5;
  width: 100%;
  color: #595959;
  font-weight: 500;
  font-size: 0.95em;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  margin: 0 2px;
}

:deep(.analysis-section) {
  font-size: 0.92em;
  color: #777;
  margin-bottom: 16px;
  line-height: 1.5;
}

:deep(.summary-section) {
  font-size: 1.1em;
  font-weight: 500;
  color: #000;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

:deep(.summary-section h2) {
  font-size: 1.8em;
  margin-top: 12px;
  margin-bottom: 20px;
  color: #1890ff;
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(24, 144, 255, 0.2);
  padding: 5px 0;
  border-bottom: 2px solid rgba(24, 144, 255, 0.3);
}

:deep(.summary-section h3) {
  font-size: 1.5em;
  margin-top: 12px;
  margin-bottom: 16px;
  color: #1890ff;
  font-weight: 700;
}

:deep(.result-item) {
  margin-bottom: 14px;
  line-height: 1.5;
}

:deep(.result-title) {
  font-weight: 600;
  color: #333;
}

:deep(.result-score) {
  font-weight: 700;
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
}

:deep(.total-score) {
  margin-top: 20px;
  font-weight: 500;
  font-size: 1.1em;
}

:deep(.total-score-value) {
  font-weight: 700;
  color: #1890ff;
  font-size: 1.2em;
  background-color: rgba(24, 144, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

:deep(.report-title) {
  color: #000000;  /* 红色 */
  font-size: 1.2em;  /* 大字体 */
  font-weight: 600;  /* 最粗字体 */
  margin-top: 12px;
  margin-bottom: 20px;
  display: inline-block;
}

:deep(p), :deep(div:not(.summary-section):not(.result-item):not(.total-score)) {
  color: #777;
  font-size: 0.92em;
}
</style> 