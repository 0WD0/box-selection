<template>
  <div class="pdf-container" ref="pdfContainer" 
       @mousedown="$emit('selection-start', $event)" 
       @mousemove="$emit('selection-update', $event)" 
       @mouseup="$emit('selection-end', $event)">
    <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>

    <!-- 视觉块覆盖层 -->
    <div class="blocks-overlay" 
         :style="{ 
           width: '100%', 
           height: '100%'
         }">
      <!-- 每个视觉块 -->
      <template v-for="block in blocks" :key="block.id">
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
             @click="$emit('block-click', block.id)">
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
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, markRaw } from 'vue'

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

const pdfDoc = ref<any>(null)
const pdfCanvas = ref<HTMLCanvasElement>()
const pdfContainer = ref<HTMLElement>()
const canvasWidth = ref(0)
const canvasHeight = ref(0)

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
    left: bbox.x * scale + props.overlayDimensions.offsetX + centerOffsetX,
    top: bbox.y * scale + props.overlayDimensions.offsetY + centerOffsetY,
    width: bbox.width * scale,
    height: bbox.height * scale
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
  if (!pdfDoc.value || !pdfCanvas.value) return

  try {
    const page = await pdfDoc.value.getPage(num)
    const canvas = pdfCanvas.value
    const ctx = canvas.getContext('2d')!
    const viewport = page.getViewport({ scale: props.scale })

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
    emit('page-rendered', num)

    await nextTick()
    setTimeout(updateOverlayDimensions, 300)
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

onMounted(() => {
  loadPdf()
})
</script>

<style scoped>
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
</style> 