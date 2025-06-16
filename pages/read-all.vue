<template>
  <div>
    <!-- 使用 ClientOnly 避免 SSR 问题 -->
    <ClientOnly>
      <div class="container">
        <h1>📄 原生 PDF.js 查看器</h1>

        <div class="back-nav">
          <NuxtLink to="/" class="back-btn">← 返回首页</NuxtLink>
        </div>

        <div class="info-section">
          <h3>🔧 原生PDF.js + markRaw修复</h3>
          <p>使用原生PDF.js库，结合 <code>markRaw()</code> 解决响应式包装问题。</p>
        </div>

        <!-- 翻页控制栏 -->
        <div class="page-controls">
          <button @click="prevPage" :disabled="pageNum <= 1 || loading" class="nav-btn prev-btn">
            上一页
          </button>

          <div class="page-info">
            <input v-model.number="pageNum" type="number" :min="1" :max="totalPages" :disabled="!pdfDoc || loading"
              class="page-input" @change="goToPage">
            <span class="page-separator">/</span>
            <span class="total-pages">{{ totalPages }}</span>
          </div>

          <button @click="nextPage" :disabled="pageNum >= totalPages || loading" class="nav-btn next-btn">
            下一页
          </button>

          <div class="zoom-controls">
            <button @click="zoomOut" :disabled="loading" class="zoom-btn">
              缩小
            </button>
            <span class="zoom-info">{{ Math.round(scale * 100) }}%</span>
            <button @click="zoomIn" :disabled="loading" class="zoom-btn">
              放大
            </button>
          </div>

          <a :href="pdfUrl" download="document.pdf" class="download-btn">
            下载
          </a>
        </div>

        <div class="status" v-if="currentStep">
          <p>{{ currentStep }}</p>
          <p v-if="error" class="error">{{ error }}</p>
        </div>

        <div class="canvas-section">
          <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
          <div v-if="loading" class="loading-overlay">
            <div class="spinner"></div>
            <p>{{ currentStep }}</p>
          </div>
        </div>

        <div class="overlay-section">
          <h3>🎨 覆盖层功能</h3>
          <div class="overlay-container" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
            <div v-for="overlay in overlays" :key="overlay.id" class="overlay-item" :style="{
              left: overlay.x + 'px',
              top: overlay.y + 'px',
              width: overlay.width + 'px',
              height: overlay.height + 'px'
            }" @click="removeOverlay(overlay.id)">
              {{ overlay.text }}
            </div>
          </div>
          <div class="overlay-controls">
            <button @click="addRandomOverlay" :disabled="!canvasWidth" class="btn btn-info">
              添加覆盖层
            </button>
            <button @click="clearOverlays" :disabled="overlays.length === 0" class="btn btn-warning">
              清除所有
            </button>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, markRaw } from 'vue'

// 设置页面标题
useHead({
  title: '原生 PDF.js 查看器'
})

// 响应式数据
const pdfDoc = ref<any>(null)
const pdfCanvas = ref<HTMLCanvasElement>()
const loading = ref(false)
const error = ref('')
const currentStep = ref('')
const pageNum = ref(1)
const totalPages = ref(0)
const scale = ref(1.5)
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// 覆盖层数据
const overlays = ref<Array<{
  id: number,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string
}>>([])

const pdfUrl = '/data/origin.pdf'

// 加载PDF
const loadPdf = async () => {
  try {
    loading.value = true
    error.value = ''
    currentStep.value = '正在加载PDF...'

    // 动态导入 PDF.js
    const pdfjsLib = await import('pdfjs-dist')

    // 设置Worker - 几种不同的方式
    // 方式1: 使用本地静态文件 (推荐)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    // 方式2: 使用CDN (可能有版本不匹配问题)
    // pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'

    // 方式3: 禁用Worker，在主线程运行 (性能较差但兼容性好)
    // pdfjsLib.GlobalWorkerOptions.workerSrc = false

    // ❌ 错误方式: 不能使用模块路径
    // pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs'

    // 获取PDF数据
    const response = await fetch(pdfUrl)
    const arrayBuffer = await response.arrayBuffer()

    // 创建PDF文档
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    // 🔧 关键修复：使用markRaw防止Vue响应式包装
    pdfDoc.value = markRaw(pdf)
    totalPages.value = pdf.numPages

    currentStep.value = `PDF加载成功，总页数: ${totalPages.value}`

    // 确保DOM更新
    await nextTick()

    // 自动渲染第一页
    if (pdfCanvas.value) {
      await renderPage(1)
    }

    loading.value = false

  } catch (err: any) {
    error.value = `加载失败: ${err.message}`
    currentStep.value = ''
    loading.value = false
  }
}

// 渲染页面
const renderPage = async (num: number) => {
  if (!pdfDoc.value || !pdfCanvas.value) return

  try {
    loading.value = true
    currentStep.value = `正在渲染第 ${num} 页...`

    // 获取页面对象
    const page = await pdfDoc.value.getPage(num)

    const canvas = pdfCanvas.value
    const ctx = canvas.getContext('2d')!
    const viewport = page.getViewport({ scale: scale.value })

    // 设置canvas尺寸
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'

    // 更新覆盖层容器尺寸
    canvasWidth.value = viewport.width
    canvasHeight.value = viewport.height

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    }

    // 渲染到Canvas
    await page.render(renderContext).promise

    pageNum.value = num
    loading.value = false
    currentStep.value = '渲染完成'

  } catch (err: any) {
    error.value = `渲染失败: ${err.message}`
    currentStep.value = ''
    loading.value = false
  }
}

// 翻页功能
const prevPage = () => {
  if (pageNum.value > 1) {
    renderPage(pageNum.value - 1)
  }
}

const nextPage = () => {
  if (pageNum.value < totalPages.value) {
    renderPage(pageNum.value + 1)
  }
}

const goToPage = () => {
  if (pageNum.value >= 1 && pageNum.value <= totalPages.value) {
    renderPage(pageNum.value)
  }
}

// 缩放功能
const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 5.0)
  renderPage(pageNum.value)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.2, 0.3)
  renderPage(pageNum.value)
}

// 添加随机覆盖层
const addRandomOverlay = () => {
  const overlay = {
    id: Date.now(),
    x: Math.random() * (canvasWidth.value - 100),
    y: Math.random() * (canvasHeight.value - 50),
    width: 80 + Math.random() * 120,
    height: 30 + Math.random() * 40,
    text: `标注 ${overlays.value.length + 1}`
  }
  overlays.value.push(overlay)
}

// 移除覆盖层
const removeOverlay = (id: number) => {
  const index = overlays.value.findIndex(o => o.id === id)
  if (index > -1) {
    overlays.value.splice(index, 1)
  }
}

// 清除所有覆盖层
const clearOverlays = () => {
  overlays.value = []
}

onMounted(() => {
  // 自动加载PDF
  loadPdf()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

.back-nav {
  margin-bottom: 20px;
}

.back-btn {
  display: inline-block;
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #7f8c8d;
}

.info-section {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
}

.info-section h3 {
  margin-bottom: 10px;
}

.info-section code {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
}

/* 翻页控制栏样式 */
.page-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.nav-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  background: #3498db;
  color: white;
  min-width: 80px;
}

.nav-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 15px;
  border-radius: 8px;
  border: 2px solid #ecf0f1;
}

.page-input {
  width: 60px;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
}

.page-separator {
  color: #7f8c8d;
  font-weight: 600;
  font-size: 1.1em;
}

.total-pages {
  color: #2c3e50;
  font-weight: 600;
  min-width: 30px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 8px 15px;
  border-radius: 8px;
  border: 2px solid #ecf0f1;
}

.zoom-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: #f8f9fa;
  transition: all 0.2s;
}

.zoom-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.zoom-info {
  color: #2c3e50;
  font-weight: 600;
  min-width: 45px;
  text-align: center;
}

.download-btn {
  padding: 10px 20px;
  background: #27ae60;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.download-btn:hover {
  background: #229954;
  transform: translateY(-1px);
}

.status {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.error {
  color: #e74c3c;
  font-weight: 600;
}

.canvas-section {
  position: relative;
  margin-bottom: 30px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  padding: 20px;
  background: #f8f9fa;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.pdf-canvas {
  border: 1px solid #bdc3c7;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: block;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ecf0f1;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.overlay-section {
  margin-bottom: 30px;
}

.overlay-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.overlay-container {
  position: relative;
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  margin-bottom: 15px;
  min-height: 100px;
  background: rgba(52, 152, 219, 0.05);
}

.overlay-item {
  position: absolute;
  background: rgba(52, 152, 219, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 2px solid rgba(52, 152, 219, 1);
}

.overlay-item:hover {
  background: rgba(52, 152, 219, 1);
  transform: scale(1.05);
}

.overlay-controls {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }

  .page-controls {
    flex-direction: column;
    gap: 10px;
  }

  .page-controls>div {
    flex-direction: row;
  }

  .canvas-section {
    padding: 15px;
  }

  .overlay-controls {
    flex-direction: column;
  }
}
</style>