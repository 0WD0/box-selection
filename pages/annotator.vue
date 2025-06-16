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
import type { Bbox } from '~/utils/pdf-parser'
import { usePDFStore, useAnnotationStore, useUIStore } from '~/stores'

// 设置页面标题
useHead({
  title: '视觉块批注系统'
})

// 使用 Pinia stores
const pdfStore = usePDFStore()
const annotationStore = useAnnotationStore()
const uiStore = useUIStore()

// PDF 查看器引用
const pdfViewer = ref()

// 从 stores 获取响应式数据
const {
  pdfDoc,
  currentPage: pageNum,
  totalPages,
  scale,
  visualBlocks,
  overlayDimensions,
  mineruData,
  currentPageBlocks
} = storeToRefs(pdfStore)

const {
  selectedBlocks,
  highlightedBlock,
  currentBlock,
  regions,
  isSelecting,
  selectionBox,
  selectionMode,
  selectionStart
} = storeToRefs(annotationStore)

// 初始化
onMounted(async () => {
  // 加载 PDF 数据
  await pdfStore.loadPDFData()
  
  // 加载区域数据
  await annotationStore.loadRegions()
  
  // 设置键盘导航
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

// PDF 事件处理 - 使用 store 方法
const onPdfLoaded = (pdf: any) => {
  pdfStore.setPDFDoc(pdf)
}

const onPageRendered = (num: number) => {
  pdfStore.setCurrentPage(num)
  setupKeyboardNavigation()
}

const onOverlayUpdated = (dimensions: any) => {
  pdfStore.updateOverlayDimensions(dimensions)
}

// 翻页 - 使用 store 方法
const prevPage = () => {
  if (pdfStore.canGoPrev && pdfViewer.value) {
    pdfViewer.value.renderPage(pageNum.value - 1)
  }
}

const nextPage = () => {
  if (pdfStore.canGoNext && pdfViewer.value) {
    pdfViewer.value.renderPage(pageNum.value + 1)
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && pdfViewer.value) {
    pdfViewer.value.renderPage(page)
  }
}

// 鼠标框选 - 使用 store 方法
const startSelection = (event: MouseEvent) => {
  if (selectionMode.value) return
  
  const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect()
  if (!rect) return

  const start = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  annotationStore.startSelection(start)
}

const updateSelection = (event: MouseEvent) => {
  if (!isSelecting.value || !selectionStart.value) return

  const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect()
  if (!rect) return

  const current = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  annotationStore.updateSelection(current)
}

const endSelection = () => {
  if (!isSelecting.value || !selectionBox.value) return

  // 使用 store 中的相交检测方法
  const intersectingBlocks = annotationStore.findIntersectingBlocks(
    currentPageBlocks.value,
    overlayDimensions.value,
    mineruData.value,
    pageNum.value
  )

  // 添加到选择列表
  intersectingBlocks.forEach(block => {
    annotationStore.addBlockToSelection(block.id)
  })

  // 清理选择状态
  annotationStore.endSelection()
}

// 块选择 - 使用 store 方法
const toggleBlockSelection = (blockId: number) => {
  annotationStore.toggleBlockSelection(blockId)
}

const removeFromSelection = (blockId: number) => {
  annotationStore.removeBlockFromSelection(blockId)
}

const clearSelection = () => {
  annotationStore.clearSelection()
}

// 键盘导航 - 使用 store 方法
const setupKeyboardNavigation = () => {
  if (currentPageBlocks.value.length > 0) {
    annotationStore.setCurrentBlock(currentPageBlocks.value[0].id)
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  const blocks = currentPageBlocks.value

  if (event.key === 'v') {
    annotationStore.toggleSelectionMode()
    return
  }

  if (event.key === 'Escape') {
    annotationStore.toggleSelectionMode()
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    if (currentBlock.value) {
      annotationStore.toggleBlockSelection(currentBlock.value)
    }
    return
  }

  // vim 导航
  if (['h', 'j', 'k', 'l'].includes(event.key) && blocks.length > 0) {
    event.preventDefault()
    
    if (!currentBlock.value) {
      annotationStore.setCurrentBlock(blocks[0].id)
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
      annotationStore.setCurrentBlock(targetBlock.id)
      
      if (selectionMode.value && !selectedBlocks.value.includes(targetBlock.id)) {
        annotationStore.addBlockToSelection(targetBlock.id)
      }
    }
  }
}

// 区域管理 - 使用 store 方法
const createRegion = async () => {
  await annotationStore.createRegion()
}

const deleteRegion = (regionId: number) => {
  annotationStore.deleteRegion(regionId)
}

const updateAnnotation = (regionId: number, annotation: string) => {
  annotationStore.updateRegionAnnotation(regionId, annotation)
}
</script>

<style>
/* 确保页面可以接收键盘事件 */
.visual-block-annotator {
  outline: none;
}
</style> 