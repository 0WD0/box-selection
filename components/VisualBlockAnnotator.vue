<template>
  <div class="visual-block-annotator" @keydown="handleKeyDown" tabindex="0">
    <!-- PDF 渲染画布 -->
    <div class="pdf-container" ref="pdfContainer" 
         @mousedown="startSelection" 
         @mousemove="updateSelection" 
         @mouseup="endSelection">
      <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>

      <!-- 视觉块覆盖层 -->
      <div class="blocks-overlay" 
           :style="{ 
             width: '100%', 
             height: '100%'
           }">
        <!-- 每个视觉块 -->
        <template v-for="block in currentPageBlocks" :key="block.id">
          <div v-if="convertCoordinates(block.bbox)"
               class="visual-block"
               :class="{
                 'selected': selectedBlocks.includes(block.id),
                 'highlighted': highlightedBlock === block.id,
                 'current': currentBlock === block.id
               }"
               :style="{
                 left: convertCoordinates(block.bbox)?.left + 'px',
                 top: convertCoordinates(block.bbox)?.top + 'px',
                 width: convertCoordinates(block.bbox)?.width + 'px',
                 height: convertCoordinates(block.bbox)?.height + 'px'
               }"
               @click="toggleBlockSelection(block.id)">
            <div class="block-info">
              <span class="block-type">{{ block.type }}</span>
              <span class="block-id">#{{ block.id }}</span>
            </div>
          </div>
        </template>

        <!-- 选择框 -->
        <div v-if="selectionBox" class="selection-box" 
             :style="{
               left: selectionBox.x + 'px',
               top: selectionBox.y + 'px',
               width: selectionBox.width + 'px',
               height: selectionBox.height + 'px'
             }">
        </div>

        <!-- 区域边界框 -->
        <template v-for="region in regions" :key="region.id">
          <div v-if="convertCoordinates(region.bbox)"
               class="region-boundary"
               :style="{
                 left: convertCoordinates(region.bbox)?.left + 'px',
                 top: convertCoordinates(region.bbox)?.top + 'px',
                 width: convertCoordinates(region.bbox)?.width + 'px',
                 height: convertCoordinates(region.bbox)?.height + 'px'
               }">
            <div class="region-label">区域 #{{ region.id }}</div>
          </div>
        </template>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <!-- 页面控制 -->
      <UCard class="mb-4">
        <div class="flex items-center justify-between">
          <UButton @click="prevPage" :disabled="pageNum <= 1" variant="outline" size="sm">
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
            上一页
          </UButton>
          <span class="text-sm font-medium">第 {{ pageNum }} 页 / 共 {{ totalPages }} 页</span>
          <UButton @click="nextPage" :disabled="pageNum >= totalPages" variant="outline" size="sm">
            下一页
            <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </UButton>
        </div>
      </UCard>

      <!-- 选择信息 -->
      <UCard class="mb-4">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">选中的视觉块: {{ selectedBlocks.length }}</h3>
            <UBadge v-if="selectedBlocks.length > 0" color="primary">{{ selectedBlocks.length }}</UBadge>
          </div>
        </template>
        
        <div v-if="selectedBlocks.length > 0" class="space-y-2 mb-4">
          <div v-for="blockId in selectedBlocks" :key="blockId" class="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span class="text-sm">块 #{{ blockId }}</span>
            <UButton @click="removeFromSelection(blockId)" color="error" variant="ghost" size="xs">
              <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
            </UButton>
          </div>
        </div>
        
        <div class="flex gap-2">
          <UButton @click="createRegion" :disabled="selectedBlocks.length === 0" color="primary">
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            创建区域
          </UButton>
          <UButton @click="clearSelection" :disabled="selectedBlocks.length === 0" variant="outline">
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-1" />
            清除选择
          </UButton>
        </div>
      </UCard>

      <!-- 区域列表 -->
      <UCard class="mb-4">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">已创建的区域: {{ regions.length }}</h3>
            <UBadge v-if="regions.length > 0" color="success">{{ regions.length }}</UBadge>
          </div>
        </template>
        
        <div v-if="regions.length === 0" class="text-center py-4 text-gray-500">
          暂无区域，请先选择视觉块创建区域
        </div>
        
        <div v-else class="space-y-3">
          <UCard v-for="region in regions" :key="region.id" class="border border-gray-200">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-medium">区域 #{{ region.id }}</span>
                <UButton @click="deleteRegion(region.id)" color="error" variant="ghost" size="xs">
                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  删除
                </UButton>
              </div>
            </template>
            
            <div class="space-y-3">
              <UTextarea 
                v-model="region.annotation" 
                placeholder="添加批注..."
                @change="updateAnnotation(region.id, region.annotation)"
                :rows="2"
              />
              <div class="text-xs text-gray-500">
                包含 {{ region.blockIds.length }} 个视觉块
              </div>
            </div>
          </UCard>
        </div>
      </UCard>

      <!-- 键盘帮助 -->
      <UCard>
        <template #header>
          <h4 class="text-base font-semibold">键盘控制</h4>
        </template>
        
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <UKbd>h</UKbd><span>左移</span>
            <UKbd>j</UKbd><span>下移</span>
            <UKbd>k</UKbd><span>上移</span>
            <UKbd>l</UKbd><span>右移</span>
          </div>
          <div class="flex items-center gap-2">
            <UKbd>v</UKbd><span>切换选择模式</span>
          </div>
          <div class="flex items-center gap-2">
            <UKbd>Space</UKbd><span>切换当前块选择</span>
          </div>
          <div class="flex items-center gap-2">
            <UKbd>Esc</UKbd><span>退出选择模式</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, markRaw } from 'vue'
import type { Bbox, MiddleJsonData } from '~/utils/pdf-parser'
import { bboxArrayToObject, isRectIntersect, calculateBoundingBox, parseMiddleJsonToBlocks } from '~/utils/pdf-parser'

// 响应式数据
const pdfDoc = ref<any>(null)
const pdfCanvas = ref<HTMLCanvasElement>()
const pdfContainer = ref<HTMLElement>()
const pageNum = ref(1)
const totalPages = ref(0)
const scale = ref(1.2)
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// 视觉块数据
const visualBlocks = ref<any[]>([])
const selectedBlocks = ref<number[]>([])
const highlightedBlock = ref<number | null>(null)
const currentBlock = ref<number | null>(null)
const regions = ref<any[]>([])

// 选择相关
const isSelecting = ref(false)
const selectionBox = ref<Bbox | null>(null)
const selectionMode = ref(false) // vim 选择模式
const selectionStart = ref<{ x: number, y: number } | null>(null)

// 当前页面的视觉块
const currentPageBlocks = computed(() => {
  return visualBlocks.value.filter(block => block.pageIndex === pageNum.value - 1)
})

// 初始化
onMounted(async () => {
  await loadPdfData()
  await loadPdf()
  setupKeyboardNavigation()
  setupOverlayListeners()
})

// 设置覆盖层监听器
const setupOverlayListeners = () => {
  // 监听窗口大小变化
  const handleResize = () => {
    updateOverlayDimensions()
  }
  window.addEventListener('resize', handleResize)

  // 使用 MutationObserver 监听 DOM 变化
  const observer = new MutationObserver(() => {
    setTimeout(updateOverlayDimensions, 100)
  })

  if (pdfContainer.value) {
    observer.observe(pdfContainer.value, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'width', 'height']
    })
  }

  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    observer.disconnect()
  })
}

// 原始MinerU数据
const mineruData = ref<MiddleJsonData | null>(null)

// 加载PDF数据
const loadPdfData = async () => {
  try {
    const response = await fetch('/data/middle.json')
    const data: MiddleJsonData = await response.json()
    mineruData.value = data
    
    const blocks = parseMiddleJsonToBlocks(data)
    visualBlocks.value = blocks.map((block, index) => ({
      ...block,
      id: index + 1,
      bbox: JSON.parse(block.bbox).reduce((bbox: any, val: number, i: number) => {
        if (i === 0) bbox.x = val
        else if (i === 1) bbox.y = val
        else if (i === 2) bbox.width = val
        else if (i === 3) bbox.height = val
        return bbox
      }, {}),
      // 保存原始页面信息
      pageInfo: data.pdf_info[block.pageIndex]
    }))
    
    console.log('已加载视觉块:', visualBlocks.value.length)
  } catch (error) {
    console.error('加载PDF数据失败:', error)
  }
}

// 加载PDF
const loadPdf = async () => {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const response = await fetch('/data/origin.pdf')
    const arrayBuffer = await response.arrayBuffer()
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    pdfDoc.value = markRaw(pdf)
    totalPages.value = pdf.numPages

    await nextTick()
    if (pdfCanvas.value) {
      await renderPage(1)
    }
  } catch (error) {
    console.error('加载PDF失败:', error)
  }
}

// 覆盖层尺寸和偏移
const overlayDimensions = ref({ width: 0, height: 0, offsetX: 0, offsetY: 0 })

// 更新覆盖层尺寸
const updateOverlayDimensions = () => {
  if (!pdfContainer.value || !pdfCanvas.value) return

  const canvasRect = pdfCanvas.value.getBoundingClientRect()
  const containerRect = pdfContainer.value.getBoundingClientRect()

  overlayDimensions.value = {
    width: canvasRect.width,
    height: canvasRect.height,
    offsetX: canvasRect.left - containerRect.left,
    offsetY: canvasRect.top - containerRect.top
  }
}

// 坐标转换函数 - 将PDF坐标转换为显示坐标
const convertCoordinates = (bbox: { x: number, y: number, width: number, height: number }) => {
  if (overlayDimensions.value.width === 0 || !mineruData.value) return null

  // 获取当前页面的页面信息
  const currentPageInfo = mineruData.value.pdf_info[pageNum.value - 1]
  if (!currentPageInfo) return null

  // 从MinerU数据中获取页面尺寸
  const [pageWidth, pageHeight] = currentPageInfo.page_size

  // 计算缩放比例
  const scaleX = overlayDimensions.value.width / pageWidth
  const scaleY = overlayDimensions.value.height / pageHeight
  const scale = Math.min(scaleX, scaleY)

  // 计算实际渲染尺寸
  const renderWidth = pageWidth * scale
  const renderHeight = pageHeight * scale

  // 计算居中偏移
  const centerOffsetX = (overlayDimensions.value.width - renderWidth) / 2
  const centerOffsetY = (overlayDimensions.value.height - renderHeight) / 2

  return {
    left: bbox.x * scale + overlayDimensions.value.offsetX + centerOffsetX,
    top: bbox.y * scale + overlayDimensions.value.offsetY + centerOffsetY,
    width: bbox.width * scale,
    height: bbox.height * scale
  }
}

// 渲染页面
const renderPage = async (num: number) => {
  if (!pdfDoc.value || !pdfCanvas.value) return

  try {
    const page = await pdfDoc.value.getPage(num)
    const canvas = pdfCanvas.value
    const ctx = canvas.getContext('2d')!
    const viewport = page.getViewport({ scale: scale.value })

    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'

    canvasWidth.value = viewport.width
    canvasHeight.value = viewport.height

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    }

    await page.render(renderContext).promise
    pageNum.value = num

    // 延迟更新覆盖层尺寸，确保PDF已经渲染完成
    await nextTick()
    setTimeout(updateOverlayDimensions, 300)
  } catch (error) {
    console.error('渲染页面失败:', error)
  }
}

// 翻页
const prevPage = () => {
  if (pageNum.value > 1) {
    renderPage(pageNum.value - 1)
    setupKeyboardNavigation() // 重新设置键盘导航
  }
}

const nextPage = () => {
  if (pageNum.value < totalPages.value) {
    renderPage(pageNum.value + 1)
    setupKeyboardNavigation() // 重新设置键盘导航
  }
}

// 鼠标框选
const startSelection = (event: MouseEvent) => {
  if (selectionMode.value) return
  
  const rect = pdfContainer.value?.getBoundingClientRect()
  if (!rect) return

  isSelecting.value = true
  selectionStart.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  selectionBox.value = {
    x: selectionStart.value.x,
    y: selectionStart.value.y,
    width: 0,
    height: 0
  }
}

const updateSelection = (event: MouseEvent) => {
  if (!isSelecting.value || !selectionStart.value) return

  const rect = pdfContainer.value?.getBoundingClientRect()
  if (!rect) return

  const currentX = event.clientX - rect.left
  const currentY = event.clientY - rect.top

  selectionBox.value = {
    x: Math.min(selectionStart.value.x, currentX),
    y: Math.min(selectionStart.value.y, currentY),
    width: Math.abs(currentX - selectionStart.value.x),
    height: Math.abs(currentY - selectionStart.value.y)
  }
}

const endSelection = () => {
  if (!isSelecting.value || !selectionBox.value) return

  // 查找与选择框相交的视觉块
  const intersectingBlocks = currentPageBlocks.value.filter(block => {
    const convertedCoords = convertCoordinates(block.bbox)
    if (!convertedCoords) return false
    
    // 将转换后的坐标与选择框进行比较
    const blockRect = {
      x: convertedCoords.left,
      y: convertedCoords.top,
      width: convertedCoords.width,
      height: convertedCoords.height
    }
    
    return isRectIntersect(blockRect, selectionBox.value!)
  })

  // 添加到选择列表
  intersectingBlocks.forEach(block => {
    if (!selectedBlocks.value.includes(block.id)) {
      selectedBlocks.value.push(block.id)
    }
  })

  // 清理选择状态
  isSelecting.value = false
  selectionBox.value = null
  selectionStart.value = null
}

// 块选择
const toggleBlockSelection = (blockId: number) => {
  const index = selectedBlocks.value.indexOf(blockId)
  if (index === -1) {
    selectedBlocks.value.push(blockId)
  } else {
    selectedBlocks.value.splice(index, 1)
  }
}

const removeFromSelection = (blockId: number) => {
  const index = selectedBlocks.value.indexOf(blockId)
  if (index !== -1) {
    selectedBlocks.value.splice(index, 1)
  }
}

const clearSelection = () => {
  selectedBlocks.value = []
}

// 键盘导航
const setupKeyboardNavigation = () => {
  if (currentPageBlocks.value.length > 0) {
    currentBlock.value = currentPageBlocks.value[0].id
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  const blocks = currentPageBlocks.value

  if (event.key === 'v') {
    selectionMode.value = !selectionMode.value
    return
  }

  if (event.key === 'Escape') {
    selectionMode.value = false
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    if (currentBlock.value) {
      toggleBlockSelection(currentBlock.value)
    }
    return
  }

  // vim 导航
  if (['h', 'j', 'k', 'l'].includes(event.key) && blocks.length > 0) {
    event.preventDefault()
    
    if (!currentBlock.value) {
      currentBlock.value = blocks[0].id
      return
    }

    const currentBlockData = blocks.find(b => b.id === currentBlock.value)
    if (!currentBlockData) return

    let targetBlock = null
    const currentCenter = {
      x: currentBlockData.bbox.x + currentBlockData.bbox.width / 2,
      y: currentBlockData.bbox.y + currentBlockData.bbox.height / 2
    }

    switch (event.key) {
      case 'h': // 左
        targetBlock = blocks
          .filter(b => b.bbox.x + b.bbox.width < currentBlockData.bbox.x)
          .sort((a, b) => 
            Math.abs(a.bbox.y + a.bbox.height/2 - currentCenter.y) - 
            Math.abs(b.bbox.y + b.bbox.height/2 - currentCenter.y)
          )[0]
        break
      case 'l': // 右
        targetBlock = blocks
          .filter(b => b.bbox.x > currentBlockData.bbox.x + currentBlockData.bbox.width)
          .sort((a, b) => 
            Math.abs(a.bbox.y + a.bbox.height/2 - currentCenter.y) - 
            Math.abs(b.bbox.y + b.bbox.height/2 - currentCenter.y)
          )[0]
        break
      case 'k': // 上
        targetBlock = blocks
          .filter(b => b.bbox.y + b.bbox.height < currentBlockData.bbox.y)
          .sort((a, b) => 
            Math.abs(a.bbox.x + a.bbox.width/2 - currentCenter.x) - 
            Math.abs(b.bbox.x + b.bbox.width/2 - currentCenter.x)
          )[0]
        break
      case 'j': // 下
        targetBlock = blocks
          .filter(b => b.bbox.y > currentBlockData.bbox.y + currentBlockData.bbox.height)
          .sort((a, b) => 
            Math.abs(a.bbox.x + a.bbox.width/2 - currentCenter.x) - 
            Math.abs(b.bbox.x + b.bbox.width/2 - currentCenter.x)
          )[0]
        break
    }

    if (targetBlock) {
      currentBlock.value = targetBlock.id
      
      // 在选择模式下自动添加到选择列表
      if (selectionMode.value && !selectedBlocks.value.includes(targetBlock.id)) {
        selectedBlocks.value.push(targetBlock.id)
      }
    }
  }
}

// 区域管理
const createRegion = () => {
  if (selectedBlocks.value.length === 0) return

  const selectedBlockData = visualBlocks.value.filter(block => 
    selectedBlocks.value.includes(block.id)
  )
  
  const bbox = calculateBoundingBox(selectedBlockData.map(b => b.bbox))
  
  const newRegion = {
    id: regions.value.length + 1,
    blockIds: [...selectedBlocks.value],
    bbox,
    annotation: ''
  }
  
  regions.value.push(newRegion)
  selectedBlocks.value = []
}

const deleteRegion = (regionId: number) => {
  const index = regions.value.findIndex(r => r.id === regionId)
  if (index !== -1) {
    regions.value.splice(index, 1)
  }
}

const updateAnnotation = (regionId: number, annotation: string) => {
  const region = regions.value.find(r => r.id === regionId)
  if (region) {
    region.annotation = annotation
    // TODO: 保存到数据库
  }
}
</script>

<style scoped>
.visual-block-annotator {
  display: flex;
  height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
}

.pdf-container {
  position: relative;
  flex: 1;
  overflow: auto;
  background: #f5f5f5;
}

.pdf-canvas {
  display: block;
}

.blocks-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.visual-block {
  position: absolute;
  border: 2px solid transparent;
  background: rgba(0, 123, 255, 0.1);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
}

.visual-block:hover {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.2);
}

.visual-block.selected {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.3);
}

.visual-block.current {
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.3);
  box-shadow: 0 0 0 2px #ffc107;
}

.block-info {
  position: absolute;
  top: -20px;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 2px;
  white-space: nowrap;
}

.selection-box {
  position: absolute;
  border: 2px dashed #007bff;
  background: rgba(0, 123, 255, 0.1);
  pointer-events: none;
}

.region-boundary {
  position: absolute;
  border: 3px solid #dc3545;
  background: rgba(220, 53, 69, 0.1);
  pointer-events: none;
}

.region-label {
  position: absolute;
  top: -25px;
  left: 0;
  background: #dc3545;
  color: white;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 3px;
}

.control-panel {
  width: 350px;
  background: white;
  border-left: 1px solid #ddd;
  padding: 20px;
  overflow-y: auto;
}

.page-controls {
  margin-bottom: 20px;
  text-align: center;
}

.page-controls button {
  margin: 0 10px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.page-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-info, .regions-list {
  margin-bottom: 30px;
}

.selection-info h3, .regions-list h3 {
  margin-bottom: 15px;
  color: #333;
}

.selected-blocks-list {
  margin-bottom: 15px;
}

.selected-block-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: #f8f9fa;
  margin-bottom: 5px;
  border-radius: 4px;
}

.selected-block-item button {
  padding: 2px 8px;
  font-size: 12px;
  border: 1px solid #dc3545;
  background: white;
  color: #dc3545;
  cursor: pointer;
  border-radius: 3px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn-primary {
  padding: 10px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.region-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: #f8f9fa;
}

.region-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.btn-danger {
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.region-annotation textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.region-blocks {
  margin-top: 10px;
  color: #666;
}

.keyboard-help {
  margin-top: 30px;
  padding: 15px;
  background: #e9ecef;
  border-radius: 8px;
}

.keyboard-help h4 {
  margin-bottom: 10px;
  color: #495057;
}

.keyboard-help ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.keyboard-help li {
  margin-bottom: 5px;
  font-size: 14px;
  color: #6c757d;
}

kbd {
  background: #495057;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-family: monospace;
}
</style> 