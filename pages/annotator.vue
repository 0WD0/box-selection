<template>
  <AppLayout>
    <template #header>
      <AppHeader 
        title="视觉块批注系统" 
        icon="✏️"
        subtitle="智能PDF批注和区域管理"
        :breadcrumbs="[
          { label: '功能', to: '/' },
          { label: '视觉块批注系统' }
        ]"
      >
        <template #actions>
          <PageControls
            :current-page="pageNum"
            :total-pages="totalPages"
            :disabled="!pdfDoc"
            @prev="prevPage"
            @next="nextPage"
            @goto="goToPage"
          />
        </template>
      </AppHeader>
    </template>

    <div class="flex h-[calc(100vh-80px)]" @keydown="handleKeyDown" tabindex="0">
      <!-- PDF 查看器区域 -->
      <PDFViewer
        ref="pdfViewer"
        :blocks="currentPageBlocks"
        :selected-blocks="selectedBlocks"
        :highlighted-block="highlightedBlock"
        :current-block="currentBlock"
        :regions="regions"
        :selection-box="selectionBox"
        :page-num="pageNum"
        :scale="scale"
        :overlay-dimensions="overlayDimensions"
        :mineru-data="mineruData"
        @selection-start="startSelection"
        @selection-update="updateSelection"
        @selection-end="endSelection"
        @block-click="toggleBlockSelection"
        @pdf-loaded="onPdfLoaded"
        @page-rendered="onPageRendered"
        @overlay-updated="onOverlayUpdated"
      />

      <!-- 控制面板 -->
      <AppSidebar>
        <!-- 视觉块选择面板 -->
        <BlockSelectionPanel
          :selected-blocks="selectedBlocks"
          @remove-block="removeFromSelection"
          @create-region="createRegion"
          @clear-selection="clearSelection"
        />

        <!-- 区域管理面板 -->
        <RegionPanel
          :regions="regions"
          @delete-region="deleteRegion"
          @update-annotation="updateAnnotation"
        />

        <!-- 键盘帮助 -->
        <KeyboardHelp :selection-mode="selectionMode" />
      </AppSidebar>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Bbox, MiddleJsonData } from '~/utils/pdf-parser'
import { bboxArrayToObject, isRectIntersect, calculateBoundingBox, parseMiddleJsonToBlocks } from '~/utils/pdf-parser'

// 设置页面标题
useHead({
  title: '视觉块批注系统'
})

// 响应式数据
const pdfDoc = ref<any>(null)
const pdfViewer = ref()
const pageNum = ref(1)
const totalPages = ref(0)
const scale = ref(1.2)

// 视觉块数据
const visualBlocks = ref<any[]>([])
const selectedBlocks = ref<number[]>([])
const highlightedBlock = ref<number | null>(null)
const currentBlock = ref<number | null>(null)
const regions = ref<any[]>([])

// 选择相关
const isSelecting = ref(false)
const selectionBox = ref<Bbox | null>(null)
const selectionMode = ref(false)
const selectionStart = ref<{ x: number, y: number } | null>(null)

// 覆盖层尺寸
const overlayDimensions = ref({ width: 0, height: 0, offsetX: 0, offsetY: 0 })

// 原始MinerU数据
const mineruData = ref<MiddleJsonData | null>(null)

// 当前页面的视觉块
const currentPageBlocks = computed(() => {
  return visualBlocks.value.filter(block => block.pageIndex === pageNum.value - 1)
})

// 初始化
onMounted(async () => {
  await loadPdfData()
  setupKeyboardNavigation()
})

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
      pageInfo: data.pdf_info[block.pageIndex]
    }))
    
    console.log('已加载视觉块:', visualBlocks.value.length)
  } catch (error) {
    console.error('加载PDF数据失败:', error)
  }
}

// PDF 事件处理
const onPdfLoaded = (pdf: any) => {
  pdfDoc.value = pdf
  totalPages.value = pdf.numPages
}

const onPageRendered = (num: number) => {
  pageNum.value = num
  setupKeyboardNavigation()
}

const onOverlayUpdated = (dimensions: any) => {
  overlayDimensions.value = dimensions
}

// 翻页
const prevPage = () => {
  if (pageNum.value > 1 && pdfViewer.value) {
    pdfViewer.value.renderPage(pageNum.value - 1)
  }
}

const nextPage = () => {
  if (pageNum.value < totalPages.value && pdfViewer.value) {
    pdfViewer.value.renderPage(pageNum.value + 1)
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && pdfViewer.value) {
    pdfViewer.value.renderPage(page)
  }
}

// 鼠标框选
const startSelection = (event: MouseEvent) => {
  if (selectionMode.value) return
  
  const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect()
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

  const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect()
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
    // 这里需要实现坐标转换和相交检测
    // 简化处理，实际需要根据具体的坐标转换逻辑
    return true // 临时返回true
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

<style>
/* 确保页面可以接收键盘事件 */
.visual-block-annotator {
  outline: none;
}
</style> 