<template>
  <div class="pdf-container" ref="pdfContainer" 
       @mousedown="handleMouseDown" 
       @mousemove="handleMouseMove" 
       @mouseup="handleMouseUp"
       @click="handleClick"
       @dblclick="handleDoubleClick"
       @contextmenu="handleContextMenu">
    
    <!-- 画布包装器，应用偏移变换 -->
    <div class="canvas-wrapper" :style="canvasTransformStyle">
      <!-- PDF 渲染层 -->
      <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
      
      <!-- 视觉块渲染层 -->
      <canvas ref="blocksCanvas" class="blocks-canvas"></canvas>
    </div>
    
    <!-- 交互层（仅用于框选框显示） -->
    <div class="interaction-layer">
      <!-- 选择框 -->
      <div v-if="selectionBox" class="selection-box" 
           :style="{
             left: (selectionBox.x + pdfStore.canvasOffset.x) + 'px',
             top: (selectionBox.y + pdfStore.canvasOffset.y) + 'px',
             width: selectionBox.width + 'px',
             height: selectionBox.height + 'px'
           }">
      </div>
      
      <!-- 悬浮提示 -->
      <div v-if="hoveredBlock" class="block-tooltip"
           :style="{
             left: tooltipPosition.x + 'px',
             top: tooltipPosition.y + 'px'
           }">
        <div class="tooltip-content">
          <div>类型: {{ hoveredBlock.type }}</div>
          <div>ID: #{{ hoveredBlock.id }}</div>
          <div>页面: {{ hoveredBlock.pageIndex + 1 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, markRaw, computed, watch, onUnmounted } from 'vue'
import { usePDFStore } from '~/stores'

interface Props {
  blocks: any[]
  selectedBlocks: number[]
  highlightedBlock: number | null
  currentBlock: number | null
  regions: any[]
  selectionBox: any
  pageNum: number
  scale: number
  overlayDimensions: any
  mineruData: any
}

interface Emits {
  'selection-start': [event: MouseEvent]
  'selection-update': [event: MouseEvent]
  'selection-end': [event: MouseEvent]
  'block-click': [blockId: number]
  'pdf-loaded': [pdf: any]
  'page-rendered': [pageNum: number]
  'overlay-updated': [dimensions: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 使用 PDF store
const pdfStore = usePDFStore()

const pdfDoc = ref<any>(null)
const pdfCanvas = ref<HTMLCanvasElement>()
const blocksCanvas = ref<HTMLCanvasElement>()
const pdfContainer = ref<HTMLElement>()
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// 交互状态
const isSelecting = ref(false)
const hoveredBlock = ref<any>(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const mousePosition = ref({ x: 0, y: 0 })

// 🖱️ 画布拖拽状态
const isPanning = ref(false)
const panStartPosition = ref({ x: 0, y: 0 })
const panStartScroll = ref({ x: 0, y: 0 })

// 视觉块坐标缓存
const blocksWithCoords = ref<any[]>([])

// 🖱️ 画布变换样式
const canvasTransformStyle = computed(() => ({
  transform: `translate(${pdfStore.canvasOffset.x}px, ${pdfStore.canvasOffset.y}px)`
}))

// 🎨 块类型颜色映射
const getBlockTypeColor = (type: string) => {
  const colors: Record<string, { fill: string; stroke: string }> = {
    'text': { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3b82f6' },      // 蓝色 - 文本
    'title': { fill: 'rgba(168, 85, 247, 0.15)', stroke: '#a855f7' },    // 紫色 - 标题
    'header': { fill: 'rgba(16, 185, 129, 0.15)', stroke: '#10b981' },   // 绿色 - 页眉
    'footer': { fill: 'rgba(107, 114, 128, 0.15)', stroke: '#6b7280' },  // 灰色 - 页脚
    'image': { fill: 'rgba(245, 158, 11, 0.15)', stroke: '#f59e0b' },    // 黄色 - 图片
    'table': { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444' },     // 红色 - 表格
    'list': { fill: 'rgba(34, 197, 94, 0.15)', stroke: '#22c55e' },      // 浅绿 - 列表
    'formula': { fill: 'rgba(147, 51, 234, 0.15)', stroke: '#9333ea' },  // 深紫 - 公式
    'default': { fill: 'rgba(156, 163, 175, 0.15)', stroke: '#9ca3af' }  // 默认灰色
  }
  return colors[type] || colors.default
}

// 坐标转换函数
const convertCoordinates = (bbox: { x: number, y: number, width: number, height: number }) => {
  if (props.overlayDimensions.width === 0 || !props.mineruData) return null

  const currentPageInfo = props.mineruData.pdf_info[props.pageNum - 1]
  if (!currentPageInfo) return null

  const [pageWidth, pageHeight] = currentPageInfo.page_size
  const scaleX = props.overlayDimensions.width / pageWidth
  const scaleY = props.overlayDimensions.height / pageHeight
  const scale = Math.min(scaleX, scaleY)

  const renderWidth = pageWidth * scale
  const renderHeight = pageHeight * scale
  const centerOffsetX = (props.overlayDimensions.width - renderWidth) / 2
  const centerOffsetY = (props.overlayDimensions.height - renderHeight) / 2

  return {
    left: bbox.x * scale + centerOffsetX,
    top: bbox.y * scale + centerOffsetY,
    width: bbox.width * scale,
    height: bbox.height * scale
  }
}

// 🎨 Canvas 绘制视觉块和区域
const drawBlocks = () => {
  if (!blocksCanvas.value) return
  
  console.log(`🎨 [Canvas] 开始绘制 ${props.blocks.length} 个视觉块和 ${props.regions.length} 个区域`)
  const startTime = performance.now()
  
  const canvas = blocksCanvas.value
  const ctx = canvas.getContext('2d')!
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 计算并缓存所有块的坐标
  blocksWithCoords.value = props.blocks.map(block => {
    const coords = convertCoordinates(block.bbox)
    return { ...block, coords }
  }).filter(block => block.coords)
  
  // 1. 首先绘制区域（作为背景层）
  drawRegions(ctx)
  
  // 2. 然后绘制视觉块
  drawVisualBlocks(ctx)
  
  const endTime = performance.now()
  console.log(`🎨 [Canvas] 完整绘制完成，耗时: ${(endTime - startTime).toFixed(2)}ms`)
}

// 🏛️ 绘制区域
const drawRegions = (ctx: CanvasRenderingContext2D) => {
  if (!props.regions.length) {
    console.log('🏛️ [Canvas] 没有区域需要绘制')
    return
  }
  
  console.log(`🏛️ [Canvas] 绘制 ${props.regions.length} 个区域:`, props.regions)
  
  props.regions.forEach((region, index) => {
    const coords = convertCoordinates(region.bbox)
    if (!coords) return
    
    // 区域背景
    ctx.fillStyle = 'rgba(220, 53, 69, 0.1)'
    ctx.fillRect(coords.left, coords.top, coords.width, coords.height)
    
    // 区域边框
    ctx.strokeStyle = '#dc3545'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5]) // 虚线边框
    ctx.strokeRect(coords.left, coords.top, coords.width, coords.height)
    ctx.setLineDash([]) // 重置线条样式
    
    // 区域标签背景
    const labelText = `区域 #${region.id}`
    const labelWidth = ctx.measureText(labelText).width + 16
    const labelHeight = 24
    
    ctx.fillStyle = '#dc3545'
    ctx.fillRect(coords.left, coords.top - labelHeight, labelWidth, labelHeight)
    
    // 区域标签文字
    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(labelText, coords.left + 8, coords.top - labelHeight / 2)
    
    // 如果有注释，显示注释预览
    if (region.annotation && region.annotation.trim()) {
      const annotationPreview = region.annotation.length > 20 
        ? region.annotation.substring(0, 20) + '...' 
        : region.annotation
      
      ctx.fillStyle = 'rgba(220, 53, 69, 0.9)'
      ctx.fillRect(coords.left, coords.top + coords.height, labelWidth, 20)
      
      ctx.fillStyle = 'white'
      ctx.font = '10px Arial'
      ctx.fillText(annotationPreview, coords.left + 8, coords.top + coords.height + 10)
    }
  })
}

// 📦 绘制视觉块
const drawVisualBlocks = (ctx: CanvasRenderingContext2D) => {
  blocksWithCoords.value.forEach(block => {
    const coords = block.coords!
    const isSelected = props.selectedBlocks.includes(block.id)
    const isHighlighted = props.highlightedBlock === block.id
    const isCurrent = props.currentBlock === block.id
    const isHovered = hoveredBlock.value?.id === block.id
    
    // 🎨 根据块类型获取颜色
    const typeColor = getBlockTypeColor(block.type)
    let fillStyle, strokeStyle, lineWidth, shadowBlur = 0
    
    if (isCurrent) {
      fillStyle = 'rgba(255, 193, 7, 0.4)'
      strokeStyle = '#ffc107'
      lineWidth = 4
      shadowBlur = 8
    } else if (isSelected) {
      fillStyle = 'rgba(40, 167, 69, 0.3)'
      strokeStyle = '#28a745'
      lineWidth = 3
      shadowBlur = 4
    } else if (isHighlighted || isHovered) {
      fillStyle = typeColor.fill.replace('0.15', '0.25') // 增加透明度
      strokeStyle = typeColor.stroke
      lineWidth = 2
      shadowBlur = 2
    } else {
      fillStyle = typeColor.fill
      strokeStyle = typeColor.stroke
      lineWidth = 1
    }
    
    // 设置阴影效果
    if (shadowBlur > 0) {
      ctx.shadowColor = strokeStyle
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
    }
    
    // 绘制块背景
    ctx.fillStyle = fillStyle
    ctx.fillRect(coords.left, coords.top, coords.width, coords.height)
    
    // 绘制块边框
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth
    ctx.strokeRect(coords.left, coords.top, coords.width, coords.height)
    
    // 重置阴影
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // 绘制块信息
    const shouldShowInfo = (isSelected || isHighlighted || isCurrent) && 
                          coords.width > 60 && coords.height > 20
    
    if (shouldShowInfo) {
      // 信息背景
      const infoText = `${block.type} #${block.id}`
      ctx.font = '10px Arial'
      const textWidth = ctx.measureText(infoText).width + 8
      const textHeight = 16
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(coords.left, coords.top - textHeight, textWidth, textHeight)
      
      // 信息文字
      ctx.fillStyle = 'white'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(infoText, coords.left + 4, coords.top - textHeight / 2)
    }
  })
}

// 🔍 根据坐标查找视觉块
const findBlockAtPosition = (x: number, y: number) => {
  return blocksWithCoords.value.find(block => {
    const coords = block.coords
    return x >= coords.left && x <= coords.left + coords.width &&
           y >= coords.top && y <= coords.top + coords.height
  })
}

// 🔍 查找位置处的区域
const findRegionAtPosition = (x: number, y: number) => {
  return props.regions.find(region => {
    const coords = convertCoordinates(region.bbox)
    if (!coords) return false
    
    return x >= coords.left && x <= coords.left + coords.width &&
           y >= coords.top && y <= coords.top + coords.height
  })
}

// 🖱️ 鼠标事件处理
const handleMouseDown = (event: MouseEvent) => {
  const rect = pdfContainer.value?.getBoundingClientRect()
  if (!rect) return
  
  mousePosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  // 检查是否是中键拖拽
  if (event.button === 1) { // 中键
    event.preventDefault()
    isPanning.value = true
    panStartPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
    panStartScroll.value = {
      x: pdfStore.canvasOffset.x,
      y: pdfStore.canvasOffset.y
    }
    
    // 改变鼠标样式
    if (pdfContainer.value) {
      pdfContainer.value.style.cursor = 'grabbing'
    }
    return
  }
  
  // 左键：检查是否点击了视觉块（用于记录，但不阻止框选）
  if (event.button === 0) {
    const clickedBlock = findBlockAtPosition(mousePosition.value.x, mousePosition.value.y)
    if (clickedBlock) {
      console.log('点击了视觉块:', clickedBlock.id)
    }
    
    // 检查是否点击了区域（用于记录，但不阻止框选）
    const clickedRegion = findRegionAtPosition(mousePosition.value.x, mousePosition.value.y)
    if (clickedRegion) {
      console.log('点击了区域:', clickedRegion.id)
    }
    
    // 开始框选
    isSelecting.value = true
    emit('selection-start', event)
  }
}

const handleMouseMove = (event: MouseEvent) => {
  const rect = pdfContainer.value?.getBoundingClientRect()
  if (!rect) return
  
  mousePosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  // 处理画布拖拽
  if (isPanning.value) {
    const deltaX = event.clientX - panStartPosition.value.x
    const deltaY = event.clientY - panStartPosition.value.y
    
    // 使用store更新画布偏移
    pdfStore.setCanvasOffset(
      panStartScroll.value.x + deltaX,
      panStartScroll.value.y + deltaY
    )
    return
  }
  
  if (isSelecting.value) {
    emit('selection-update', event)
  } else {
    // 更新悬浮块和区域
    const block = findBlockAtPosition(mousePosition.value.x, mousePosition.value.y)
    const region = findRegionAtPosition(mousePosition.value.x, mousePosition.value.y)
    
    if (block !== hoveredBlock.value) {
      hoveredBlock.value = block
      if (block) {
        tooltipPosition.value = {
          x: mousePosition.value.x + 10,
          y: mousePosition.value.y - 10
        }
      }
    }
    
    // 更新鼠标样式
    if (pdfContainer.value) {
      if (isPanning.value) {
        pdfContainer.value.style.cursor = 'grabbing'
      } else if (block || region) {
        pdfContainer.value.style.cursor = 'pointer'
      } else {
        pdfContainer.value.style.cursor = 'crosshair'
      }
    }
  }
}

const handleMouseUp = (event: MouseEvent) => {
  // 结束画布拖拽
  if (isPanning.value) {
    isPanning.value = false
    // 恢复鼠标样式
    if (pdfContainer.value) {
      pdfContainer.value.style.cursor = 'crosshair'
    }
    return
  }
  
  // 结束框选
  if (isSelecting.value) {
    isSelecting.value = false
    emit('selection-end', event)
  }
}

const handleClick = (event: MouseEvent) => {
  // 处理单击事件
}

const handleDoubleClick = (event: MouseEvent) => {
  // 双击重置画布偏移
  if (event.button === 0) { // 左键双击
    pdfStore.resetCanvasOffset()
  }
}

const handleContextMenu = (event: MouseEvent) => {
  // 阻止鼠标中键产生的右键菜单
  if (isPanning.value) {
    event.preventDefault()
  }
}

// 监听属性变化，重新绘制
watch([
  () => props.blocks, 
  () => props.regions,
  () => props.selectedBlocks, 
  () => props.highlightedBlock, 
  () => props.currentBlock, 
  () => props.overlayDimensions
], () => {
  nextTick(() => {
    drawBlocks()
  })
}, { deep: true })

// 加载PDF
const loadPdf = async () => {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const response = await fetch('/api/files/origin.pdf')
    const arrayBuffer = await response.arrayBuffer()
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    pdfDoc.value = markRaw(pdf)
    emit('pdf-loaded', pdf)

    await nextTick()
    if (pdfCanvas.value) {
      await renderPage(1)
    }
  } catch (error) {
    console.error('加载PDF失败:', error)
  }
}

// 渲染页面
const renderPage = async (num: number) => {
  if (!pdfDoc.value || !pdfCanvas.value || !blocksCanvas.value) return

  try {
    const page = await pdfDoc.value.getPage(num)
    const canvas = pdfCanvas.value
    const blocksCanvasEl = blocksCanvas.value
    const ctx = canvas.getContext('2d')!
    const viewport = page.getViewport({ scale: props.scale })

    // 设置PDF画布
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'
    
    // 设置视觉块画布（与PDF画布相同尺寸）
    blocksCanvasEl.width = viewport.width
    blocksCanvasEl.height = viewport.height
    blocksCanvasEl.style.width = viewport.width + 'px'
    blocksCanvasEl.style.height = viewport.height + 'px'

    canvasWidth.value = viewport.width
    canvasHeight.value = viewport.height

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    }

    await page.render(renderContext).promise
    emit('page-rendered', num)

    // 立即更新覆盖层尺寸
    await nextTick()
    updateOverlayDimensions()
    
    // 绘制视觉块
    setTimeout(() => {
      drawBlocks()
    }, 50)
  } catch (error) {
    console.error('渲染页面失败:', error)
  }
}

// 更新覆盖层尺寸
const updateOverlayDimensions = () => {
  if (!pdfContainer.value || !pdfCanvas.value) return

  const canvasRect = pdfCanvas.value.getBoundingClientRect()
  const containerRect = pdfContainer.value.getBoundingClientRect()

  const dimensions = {
    width: canvasRect.width,
    height: canvasRect.height,
    offsetX: canvasRect.left - containerRect.left,
    offsetY: canvasRect.top - containerRect.top
  }
  
  emit('overlay-updated', dimensions)
}

// 暴露方法
defineExpose({
  loadPdf,
  renderPage,
  updateOverlayDimensions
})

// 全局鼠标事件处理（处理拖拽时鼠标移出容器的情况）
const handleGlobalMouseMove = (event: MouseEvent) => {
  if (isPanning.value) {
    const deltaX = event.clientX - panStartPosition.value.x
    const deltaY = event.clientY - panStartPosition.value.y
    
    // 使用store更新画布偏移
    pdfStore.setCanvasOffset(
      panStartScroll.value.x + deltaX,
      panStartScroll.value.y + deltaY
    )
  }
}

const handleGlobalMouseUp = (event: MouseEvent) => {
  if (isPanning.value) {
    isPanning.value = false
    if (pdfContainer.value) {
      pdfContainer.value.style.cursor = 'crosshair'
    }
  }
}

onMounted(() => {
  loadPdf()
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleGlobalMouseMove)
  document.addEventListener('mouseup', handleGlobalMouseUp)
})

onUnmounted(() => {
  // 清理全局事件监听
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
})
</script>

<style scoped>
.pdf-container {
  position: relative;
  flex: 1;
  overflow: auto;
  background: #f5f5f5;
  cursor: crosshair;
  user-select: none; /* 防止拖拽时选择文本 */
}

.pdf-container:active {
  cursor: grabbing;
}

.canvas-wrapper {
  display: block;
  transition: transform 0.1s ease-out;
  transform-origin: 0 0;
  line-height: 0; /* 消除行高造成的间距 */
}

.pdf-canvas {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.blocks-canvas {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;
}

.interaction-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
}

.selection-box {
  position: absolute;
  border: 2px dashed #007bff;
  background: rgba(0, 123, 255, 0.1);
  pointer-events: none;
}

.block-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
  max-width: 200px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style> 