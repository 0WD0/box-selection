# PDF.js 技术文档

## 📖 概述

PDF.js 是 Mozilla 开发的一个用 JavaScript 编写的 PDF 渲染库，可以在浏览器中直接显示 PDF 文档，无需插件。

## 🏗️ 架构原理

### 核心组件

1. **主线程 (Main Thread)**
   - 负责 UI 渲染和用户交互
   - 管理 Canvas 绘制
   - 处理页面导航和缩放

2. **Worker 线程 (Worker Thread)**
   - 负责 PDF 解析和数据处理
   - 处理复杂的 PDF 格式解码
   - 避免阻塞主线程

3. **对象代理 (Object Proxy)**
   - 在主线程和 Worker 线程之间传递数据
   - 提供统一的 API 接口
   - 管理异步通信

### 工作流程

```
PDF 文件 → Worker 线程解析 → 对象代理 → 主线程渲染 → Canvas 显示
```

## ❌ 常见问题

### 1. "can't access private field or method: object is not the right class"

**问题原因：**
- PDF 对象被 Vue 响应式系统包装成 Proxy
- Worker 线程无法识别 Proxy 包装的对象
- 导致内部类型检查失败

**解决方案：**
```javascript
import { markRaw } from 'vue'

// 🔧 使用 markRaw 防止响应式包装
const pdf = await loadingTask.promise
pdfDoc.value = markRaw(pdf)
```

### 2. Worker 版本不匹配

**问题原因：**
- CDN Worker 文件版本与本地 pdfjs-dist 版本不一致
- 动态导入的 Worker 文件加载失败

**解决方案：**
```javascript
// ✅ 使用本地 Worker 文件
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// ❌ 避免使用 CDN (版本可能不匹配)
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/...'
```

### 3. SSR 状态不同步

**问题原因：**
- 服务端渲染时创建"假"PDF 对象
- 客户端水合时对象状态不一致
- Worker 线程无法识别服务端创建的对象

**解决方案：**
```vue
<template>
  <ClientOnly>
    <!-- PDF 组件 -->
  </ClientOnly>
</template>
```

## 🛠️ 最佳实践

### 1. Worker 配置

```javascript
// 方式1: 本地静态文件 (推荐)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// 方式2: 禁用 Worker (兼容性好，性能稍差)
pdfjsLib.GlobalWorkerOptions.workerSrc = false

// 方式3: CDN (可能有版本问题)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'
```

### 2. 文件加载

```javascript
// ✅ 推荐：使用 ArrayBuffer
const response = await fetch(pdfUrl)
const arrayBuffer = await response.arrayBuffer()
const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })

// ❌ 避免：直接使用 URL (可能有缓存问题)
// const loadingTask = pdfjsLib.getDocument(pdfUrl)
```

### 3. Vue 集成

```javascript
import { ref, markRaw } from 'vue'

const pdfDoc = ref(null)

const loadPdf = async () => {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  
  const response = await fetch(pdfUrl)
  const arrayBuffer = await response.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  
  // 🔧 关键：使用 markRaw 防止响应式包装
  pdfDoc.value = markRaw(pdf)
}
```

### 4. 页面渲染

```javascript
const renderPage = async (pageNumber) => {
  const page = await pdfDoc.value.getPage(pageNumber)
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const viewport = page.getViewport({ scale: 1.5 })
  
  canvas.width = viewport.width
  canvas.height = viewport.height
  
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  }
  
  await page.render(renderContext).promise
}
```

## 🔧 Worker 文件配置

### 获取 Worker 文件

```bash
# 从 node_modules 复制到 public 目录
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
```

### 为什么不能使用模块路径

```javascript
// ❌ 错误：浏览器无法解析模块路径
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs'

// ✅ 正确：使用静态资源路径
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
```

**原因：**
- Worker 需要独立的 HTTP URL
- 浏览器不能直接访问 npm 包内部文件
- 必须作为静态资源提供

## 🎯 完整示例

```vue
<template>
  <div>
    <ClientOnly>
      <div class="pdf-viewer">
        <div class="controls">
          <button @click="prevPage" :disabled="pageNum <= 1">上一页</button>
          <span>{{ pageNum }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="pageNum >= totalPages">下一页</button>
        </div>
        <canvas ref="pdfCanvas"></canvas>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue'

const pdfDoc = ref(null)
const pdfCanvas = ref(null)
const pageNum = ref(1)
const totalPages = ref(0)
const scale = ref(1.5)

const loadPdf = async () => {
  try {
    // 动态导入 PDF.js
    const pdfjsLib = await import('pdfjs-dist')
    
    // 设置 Worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    
    // 加载 PDF
    const response = await fetch('/data/document.pdf')
    const arrayBuffer = await response.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    // 🔧 关键修复：使用 markRaw 防止响应式包装
    pdfDoc.value = markRaw(pdf)
    totalPages.value = pdf.numPages
    
    // 渲染第一页
    await renderPage(1)
  } catch (error) {
    console.error('PDF 加载失败:', error)
  }
}

const renderPage = async (num) => {
  if (!pdfDoc.value || !pdfCanvas.value) return
  
  try {
    const page = await pdfDoc.value.getPage(num)
    const canvas = pdfCanvas.value
    const ctx = canvas.getContext('2d')
    const viewport = page.getViewport({ scale: scale.value })
    
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    pageNum.value = num
  } catch (error) {
    console.error('页面渲染失败:', error)
  }
}

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

onMounted(() => {
  loadPdf()
})
</script>

<style scoped>
.pdf-viewer {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  justify-content: center;
}

canvas {
  border: 1px solid #ddd;
  max-width: 100%;
  display: block;
  margin: 0 auto;
}
</style>
```

## 🚀 性能优化

### 1. 缩放优化

```javascript
// 避免频繁重新渲染
const debouncedRender = debounce(renderPage, 300)

const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 5.0)
  debouncedRender(pageNum.value)
}
```

### 2. 内存管理

```javascript
// 清理页面对象
const cleanup = () => {
  if (pdfDoc.value) {
    pdfDoc.value.destroy()
    pdfDoc.value = null
  }
}

onUnmounted(() => {
  cleanup()
})
```

### 3. 预加载

```javascript
// 预加载相邻页面
const preloadPages = async (currentPage) => {
  const preloadPromises = []
  
  // 预加载前一页和后一页
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages.value, currentPage + 1); i++) {
    if (i !== currentPage) {
      preloadPromises.push(pdfDoc.value.getPage(i))
    }
  }
  
  await Promise.all(preloadPromises)
}
```

## 🔍 调试技巧

### 1. 检查对象类型

```javascript
const checkPdfObject = (pdf) => {
  console.log('PDF 对象类型:', typeof pdf)
  console.log('构造函数:', pdf.constructor?.name)
  console.log('是否为 Proxy:', pdf.toString().includes('Proxy'))
  console.log('Transport 状态:', pdf._transport?.destroyed)
}
```

### 2. Worker 状态监控

```javascript
const checkWorkerStatus = () => {
  console.log('Worker 配置:', pdfjsLib.GlobalWorkerOptions.workerSrc)
  console.log('Worker 状态:', pdfDoc.value?._worker)
}
```

### 3. 错误处理

```javascript
const handlePdfError = (error) => {
  if (error.message.includes("can't access private field")) {
    console.error('Proxy 包装问题，需要使用 markRaw()')
  } else if (error.message.includes('worker')) {
    console.error('Worker 配置问题，检查 workerSrc 设置')
  } else {
    console.error('其他 PDF 错误:', error)
  }
}
```

## 📚 参考资源

- [PDF.js 官方文档](https://mozilla.github.io/pdf.js/)
- [PDF.js GitHub](https://github.com/mozilla/pdf.js)
- [Vue 3 markRaw 文档](https://vuejs.org/api/reactivity-advanced.html#markraw)
- [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## 🎯 总结

使用 PDF.js 在 Vue 3 项目中的关键点：

1. **使用 `markRaw()`** - 防止 Vue 响应式包装
2. **本地 Worker 文件** - 避免版本不匹配
3. **ClientOnly 包装** - 避免 SSR 问题
4. **ArrayBuffer 加载** - 更好的兼容性
5. **适当的错误处理** - 提升用户体验

遵循这些最佳实践，可以构建稳定可靠的 PDF 查看器应用。
