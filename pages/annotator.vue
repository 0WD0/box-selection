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
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
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

// 优化：只获取必要的响应式数据，避免过度使用 storeToRefs
const pdfDoc = computed(() => pdfStore.pdfDoc)
const pageNum = computed(() => pdfStore.currentPage)
const totalPages = computed(() => pdfStore.totalPages)
const scale = computed(() => pdfStore.scale)
const overlayDimensions = computed(() => pdfStore.overlayDimensions)
const currentPageBlocks = computed(() => pdfStore.currentPageBlocks)

const selectedBlocks = computed(() => annotationStore.selectedBlocks)
const highlightedBlock = computed(() => annotationStore.highlightedBlock)
const currentBlock = computed(() => annotationStore.currentBlock)
// 🎯 只显示当前页面的区域
const regions = computed(() => {
  return annotationStore.getCurrentPageRegions(pdfStore.currentPage)
})
const isSelecting = computed(() => annotationStore.isSelecting)
const selectionBox = computed(() => annotationStore.selectionBox)
const selectionMode = computed(() => annotationStore.selectionMode)

// 添加缺失的响应式数据
const mineruData = computed(() => pdfStore.mineruData)
const visualBlocks = computed(() => pdfStore.visualBlocks)
const selectionStart = computed(() => annotationStore.selectionStart)

// 防抖翻页操作
let pageChangeTimeout: NodeJS.Timeout | null = null

// 初始化
onMounted(async () => {
  // 加载 PDF 数据
  await pdfStore.loadPDFData()
  
  // 加载当前页面的区域数据
  await annotationStore.loadCurrentPageRegions(pdfStore.currentPage)
  
  // 设置键盘导航
  setupKeyboardNavigation()
  
})

// 加载PDF数据 - 现在使用 store 的方法
const loadPdfData = async () => {
  // 使用 store 的 loadPDFData 方法
  await pdfStore.loadPDFData()
}

// PDF 事件处理 - 使用 store 方法
const onPdfLoaded = (pdf: any) => {
  pdfStore.setPDFDoc(pdf)
}

const onPageRendered = (num: number) => {
  // 只在必要时设置键盘导航
  if (currentPageBlocks.value.length > 0 && !annotationStore.currentBlock) {
    setupKeyboardNavigation()
  }
}

const onOverlayUpdated = (dimensions: any) => {
  pdfStore.updateOverlayDimensions(dimensions)
}

// 防抖翻页操作
const nextPageWithDebounce = async () => {
  // 清除之前的定时器
  if (pageChangeTimeout) {
    clearTimeout(pageChangeTimeout)
  }
  
  pdfStore.nextPage()
  
  // 防抖渲染
  pageChangeTimeout = setTimeout(async () => {
    await pdfViewer.value.renderPage(pdfStore.currentPage)
    await annotationStore.loadCurrentPageRegions(pdfStore.currentPage)
  }, 50) // 50ms 防抖
}

const prevPageWithDebounce = async () => {
  // 清除之前的定时器
  if (pageChangeTimeout) {
    clearTimeout(pageChangeTimeout)
  }
  
  pdfStore.prevPage()
  
  // 防抖渲染
  pageChangeTimeout = setTimeout(async () => {
    await pdfViewer.value.renderPage(pdfStore.currentPage)
    await annotationStore.loadCurrentPageRegions(pdfStore.currentPage)
  }, 50) // 50ms 防抖
}

// 原有的翻页方法保持不变，用于键盘导航
const nextPage = async () => {
  pdfStore.nextPage()
  await pdfViewer.value.renderPage(pdfStore.currentPage)
  await annotationStore.loadCurrentPageRegions(pdfStore.currentPage)
}

const prevPage = async () => {
  pdfStore.prevPage()
  await pdfViewer.value.renderPage(pdfStore.currentPage)
  await annotationStore.loadCurrentPageRegions(pdfStore.currentPage)
}

const goToPage = async (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    pdfStore.goToPage(page)
    
    // 等待 PDF 查看器渲染完成
    if (pdfViewer.value) {
      try {
        await pdfViewer.value.renderPage(pdfStore.currentPage)
        await annotationStore.loadCurrentPageRegions(pdfStore.currentPage)
      } catch (error) {
        console.error('渲染页面失败:', error)
      }
    }
  }
}

// 鼠标框选 - 使用 store 方法
const startSelection = (event: MouseEvent) => {
  if (selectionMode.value) return
  
  const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect()
  if (!rect) return

  // 考虑画布偏移
  const canvasOffset = pdfStore.canvasOffset
  const start = {
    x: event.clientX - rect.left - canvasOffset.x,
    y: event.clientY - rect.top - canvasOffset.y
  }
  
  annotationStore.startSelection(start)
}

const updateSelection = (event: MouseEvent) => {
  if (!isSelecting.value || !selectionStart.value) return

  const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect()
  if (!rect) return

  // 考虑画布偏移
  const canvasOffset = pdfStore.canvasOffset
  const current = {
    x: event.clientX - rect.left - canvasOffset.x,
    y: event.clientY - rect.top - canvasOffset.y
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
    annotationStore.toggleBlockSelection(block.id)
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
  // 只在没有当前块或当前块不在当前页面时才设置
  const currentPageBlockIds = currentPageBlocks.value.map(b => b.id)
  const hasValidCurrentBlock = currentBlock.value && currentPageBlockIds.includes(currentBlock.value)
  
  if (currentPageBlocks.value.length > 0 && !hasValidCurrentBlock) {
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

const deleteRegion = async (regionId: number) => {
  await annotationStore.deleteRegion(regionId)
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