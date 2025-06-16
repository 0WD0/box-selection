<template>
  <div class="admin-container">
    <h1>📊 数据库管理面板</h1>
    
    <div class="admin-section">
      <h2>🗄️ 数据库初始化</h2>
      <p>从 middle.json 文件加载视觉块数据到数据库</p>
      <button @click="initializeDatabase" :disabled="loading" class="btn btn-primary">
        {{ loading ? '正在初始化...' : '初始化数据库' }}
      </button>
      <div v-if="initMessage" class="message" :class="initSuccess ? 'success' : 'error'">
        {{ initMessage }}
      </div>
    </div>

    <div class="admin-section">
      <h2>📋 数据统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>视觉块总数</h3>
          <div class="stat-number">{{ stats.totalBlocks }}</div>
        </div>
        <div class="stat-card">
          <h3>已创建区域</h3>
          <div class="stat-number">{{ stats.totalRegions }}</div>
        </div>
        <div class="stat-card">
          <h3>批注数量</h3>
          <div class="stat-number">{{ stats.totalAnnotations }}</div>
        </div>
      </div>
      <button @click="loadStats" class="btn btn-secondary">刷新统计</button>
    </div>

    <div class="admin-section">
      <h2>🔗 快速链接</h2>
      <div class="links">
        <NuxtLink to="/" class="btn btn-info">返回首页</NuxtLink>
        <NuxtLink to="/annotator" class="btn btn-success">批注系统</NuxtLink>
        <NuxtLink to="/read-all" class="btn btn-warning">PDF查看器</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 设置页面标题
useHead({
  title: '数据库管理面板'
})

const loading = ref(false)
const initMessage = ref('')
const initSuccess = ref(false)

const stats = ref({
  totalBlocks: 0,
  totalRegions: 0,
  totalAnnotations: 0
})

// 初始化数据库
const initializeDatabase = async () => {
  loading.value = true
  initMessage.value = ''
  
  try {
    const response = await $fetch('/api/init-db', {
      method: 'POST'
    })
    
    initMessage.value = response.message
    initSuccess.value = true
    await loadStats()
  } catch (error: any) {
    initMessage.value = `初始化失败: ${error.data?.message || error.message}`
    initSuccess.value = false
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    // 这里可以调用API获取统计数据
    // 暂时使用模拟数据
    const blocksResponse = await $fetch('/api/blocks')
    stats.value.totalBlocks = blocksResponse.blocks.length
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 页面加载时获取统计数据
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 40px;
  font-size: 2.5em;
}

.admin-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
}

.admin-section h2 {
  color: #34495e;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.admin-section p {
  color: #7f8c8d;
  margin-bottom: 20px;
  line-height: 1.6;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-right: 10px;
  margin-bottom: 10px;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.message {
  margin-top: 15px;
  padding: 12px 16px;
  border-radius: 6px;
  font-weight: 500;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 8px;
  text-align: center;
  border: 2px solid #e9ecef;
}

.stat-card h3 {
  color: #495057;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.stat-number {
  font-size: 2.5em;
  font-weight: 700;
  color: #007bff;
  margin: 0;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .admin-container {
    padding: 20px 15px;
  }
  
  h1 {
    font-size: 2em;
  }
  
  .admin-section {
    padding: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .links {
    flex-direction: column;
  }
  
  .btn {
    margin-right: 0;
    text-align: center;
  }
}
</style> 