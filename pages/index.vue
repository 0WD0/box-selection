<template>
  <div class="container">
    <h1>📄 PDF 查看器</h1>
    <p class="subtitle">基于 PDF.js 的现代化 PDF 查看器，支持缩放、翻页和覆盖层功能</p>
    
    <div class="main-card">
      <div class="card-header">
        <div class="card-icon">🚀</div>
        <h2>PDF 查看器</h2>
      </div>
      
      <div class="card-content">
        <div class="features">
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span>使用 markRaw() 解决 Vue 响应式包装问题</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span>支持自由缩放（30% - 500%）</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span>现代化翻页控制栏</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span>完整的覆盖层功能</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span>响应式设计，支持移动端</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span>生产就绪，稳定可靠</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🆕</span>
            <span>基于视觉块的批注系统</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🎯</span>
            <span>支持鼠标框选和键盘控制</span>
          </div>
        </div>
        
        <div class="action-section">
          <NuxtLink to="/read-all" class="main-btn">
            <span class="btn-icon">📖</span>
            开始使用 PDF 查看器
          </NuxtLink>
          
          <NuxtLink to="/annotator" class="main-btn annotator-btn">
            <span class="btn-icon">✏️</span>
            视觉块批注系统
          </NuxtLink>
          
          <NuxtLink to="/admin" class="main-btn admin-btn">
            <span class="btn-icon">⚙️</span>
            数据库管理
          </NuxtLink>
        </div>
      </div>
    </div>
    
    <div class="tech-info">
      <h3>🔧 技术特点</h3>
      <div class="tech-grid">
        <div class="tech-item">
          <h4>markRaw() 修复</h4>
          <p>解决 Vue 响应式系统将 PDF 对象包装成 Proxy 导致 Worker 无法识别的问题</p>
        </div>
        <div class="tech-item">
          <h4>原生 PDF.js</h4>
          <p>使用原生 PDF.js 库，完全控制渲染过程，支持自定义功能开发</p>
        </div>
        <div class="tech-item">
          <h4>现代化 UI</h4>
          <p>精心设计的用户界面，提供最佳的用户体验</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 设置页面标题
useHead({
  title: 'PDF 查看器'
})
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 3em;
  font-weight: 700;
}

.subtitle {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 50px;
  font-size: 1.2em;
  line-height: 1.6;
}

.main-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 50px;
  border: 1px solid #e1e8ed;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.card-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.card-header h2 {
  font-size: 2.5em;
  font-weight: 700;
  margin: 0;
}

.card-content {
  padding: 40px;
}

.features {
  margin-bottom: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.feature-icon {
  margin-right: 15px;
  font-size: 1.2em;
}

.action-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.main-btn {
  display: inline-flex;
  align-items: center;
  gap: 15px;
  padding: 20px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-size: 1.3em;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.main-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1.5em;
}

.annotator-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
}

.annotator-btn:hover {
  box-shadow: 0 12px 35px rgba(40, 167, 69, 0.4);
}

.admin-btn {
  background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);
  box-shadow: 0 8px 25px rgba(111, 66, 193, 0.3);
}

.admin-btn:hover {
  box-shadow: 0 12px 35px rgba(111, 66, 193, 0.4);
}

.tech-info {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 40px;
  border-left: 4px solid #667eea;
}

.tech-info h3 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 1.8em;
  text-align: center;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.tech-item {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.tech-item h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.3em;
}

.tech-item p {
  color: #7f8c8d;
  line-height: 1.6;
  margin: 0;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .container {
    padding: 20px 15px;
  }
  
  h1 {
    font-size: 2.5em;
  }
  
  .card-header {
    padding: 30px 20px;
  }
  
  .card-header h2 {
    font-size: 2em;
  }
  
  .card-content {
    padding: 30px 20px;
  }
  
  .main-btn {
    padding: 15px 30px;
    font-size: 1.1em;
  }
  
  .tech-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .tech-info {
    padding: 30px 20px;
  }
}
</style> 