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
import type { Bbox } from '~/utils/pdf-parser'
import { usePDFStore, useAnnotationStore, useUIStore } from '~/stores'
import { perfMonitor, measureAsyncOperation } from '~/utils/performance-monitor'

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
const regions = computed(() => annotationStore.regions)
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
  
  // 加载区域数据
  await annotationStore.loadRegions()
  
  // 设置键盘导航
  setupKeyboardNavigation()
  
  // 添加性能监控快捷键
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault()
      perfMonitor.printAllStats()
      perfMonitor.detectBrowserOptimization()
    }
  })
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
  
  // 立即更新页码，但延迟渲染
  console.log(`➡️ [Annotator] 开始下一页操作`)
  const totalStartTime = performance.now()
  
  console.log(`📖 [Annotator] 从第 ${pdfStore.currentPage} 页切换到第 ${pdfStore.currentPage + 1} 页`)
  
  // 🔍 详细监控 Store 操作
  console.log(`🏪 [Store] 开始详细性能分析`)
  
  // 1. 监控 nextPage 调用
  const nextPageStart = performance.now()
  pdfStore.nextPage()
  const nextPageEnd = performance.now()
  console.log(`🏪 [Store] nextPage() 耗时: ${(nextPageEnd - nextPageStart).toFixed(2)}ms`)
  
  // 2. 监控 currentPageBlocks getter
  const blocksStart = performance.now()
  const blocks = pdfStore.currentPageBlocks
  const blocksEnd = performance.now()
  console.log(`🏪 [Store] currentPageBlocks getter 耗时: ${(blocksEnd - blocksStart).toFixed(2)}ms, 块数量: ${blocks.length}`)
  
  // 3. 监控其他 computed 属性
  const computedStart = performance.now()
  const page = pdfStore.currentPage
  const total = pdfStore.totalPages
  const overlay = pdfStore.overlayDimensions
  const computedEnd = performance.now()
  console.log(`🏪 [Store] 其他 computed 属性耗时: ${(computedEnd - computedStart).toFixed(2)}ms`)
  
  // 4. 监控 Vue 响应式更新
  const reactiveStart = performance.now()
  await nextTick() // 等待 Vue 响应式更新完成
  const reactiveEnd = performance.now()
  console.log(`⚡ [Vue] 响应式更新耗时: ${(reactiveEnd - reactiveStart).toFixed(2)}ms`)
  
  const storeEndTime = performance.now()
  console.log(`🏪 [Store] 总状态更新耗时: ${(storeEndTime - totalStartTime).toFixed(2)}ms`)
  
  // 防抖渲染
  pageChangeTimeout = setTimeout(async () => {
    const renderStartTime = performance.now()
    await pdfViewer.value.renderPage(pdfStore.currentPage)
    const renderEndTime = performance.now()
    console.log(`🎨 [Annotator] PDF 渲染耗时: ${(renderEndTime - renderStartTime).toFixed(2)}ms`)
    
    const totalTime = performance.now() - totalStartTime
    console.log(`✅ [Annotator] 下一页操作完成，总耗时: ${totalTime.toFixed(2)}ms`)
    
    // 🎯 性能分析总结
    console.log(`📊 [性能分析] Store更新: ${(storeEndTime - totalStartTime).toFixed(2)}ms (${((storeEndTime - totalStartTime) / totalTime * 100).toFixed(1)}%)`)
    console.log(`📊 [性能分析] PDF渲染: ${(renderEndTime - renderStartTime).toFixed(2)}ms (${((renderEndTime - renderStartTime) / totalTime * 100).toFixed(1)}%)`)
  }, 50) // 50ms 防抖
}

const prevPageWithDebounce = async () => {
  // 清除之前的定时器
  if (pageChangeTimeout) {
    clearTimeout(pageChangeTimeout)
  }
  
  console.log(`⬅️ [Annotator] 开始上一页操作`)
  const startTime = performance.now()
  
  console.log(`📖 [Annotator] 从第 ${pdfStore.currentPage} 页切换到第 ${pdfStore.currentPage - 1} 页`)
  
  const storeStartTime = performance.now()
  pdfStore.prevPage()
  const storeEndTime = performance.now()
  console.log(`🏪 [Annotator] Store 状态更新耗时: ${(storeEndTime - storeStartTime).toFixed(2)}ms`)
  
  // 防抖渲染
  pageChangeTimeout = setTimeout(async () => {
    const renderStartTime = performance.now()
    await pdfViewer.value.renderPage(pdfStore.currentPage)
    const renderEndTime = performance.now()
    console.log(`🎨 [Annotator] PDF 渲染耗时: ${(renderEndTime - renderStartTime).toFixed(2)}ms`)
    
    const totalTime = performance.now() - startTime
    console.log(`✅ [Annotator] 上一页操作完成，总耗时: ${totalTime.toFixed(2)}ms`)
  }, 50) // 50ms 防抖
}

// 原有的翻页方法保持不变，用于键盘导航
const nextPage = async () => {
  console.log(`➡️ [Annotator] 开始下一页操作`)
  const startTime = performance.now()
  
  console.log(`📖 [Annotator] 从第 ${pdfStore.currentPage} 页切换到第 ${pdfStore.currentPage + 1} 页`)
  
  const storeStartTime = performance.now()
  pdfStore.nextPage()
  const storeEndTime = performance.now()
  console.log(`🏪 [Annotator] Store 状态更新耗时: ${(storeEndTime - storeStartTime).toFixed(2)}ms`)
  
  const renderStartTime = performance.now()
  await pdfViewer.value.renderPage(pdfStore.currentPage)
  const renderEndTime = performance.now()
  console.log(`🎨 [Annotator] PDF 渲染耗时: ${(renderEndTime - renderStartTime).toFixed(2)}ms`)
  
  const totalTime = performance.now() - startTime
  console.log(`✅ [Annotator] 下一页操作完成，总耗时: ${totalTime.toFixed(2)}ms`)
}

const prevPage = async () => {
  console.log(`⬅️ [Annotator] 开始上一页操作`)
  const startTime = performance.now()
  
  console.log(`📖 [Annotator] 从第 ${pdfStore.currentPage} 页切换到第 ${pdfStore.currentPage - 1} 页`)
  
  const storeStartTime = performance.now()
  pdfStore.prevPage()
  const storeEndTime = performance.now()
  console.log(`🏪 [Annotator] Store 状态更新耗时: ${(storeEndTime - storeStartTime).toFixed(2)}ms`)
  
  const renderStartTime = performance.now()
  await pdfViewer.value.renderPage(pdfStore.currentPage)
  const renderEndTime = performance.now()
  console.log(`🎨 [Annotator] PDF 渲染耗时: ${(renderEndTime - renderStartTime).toFixed(2)}ms`)
  
  const totalTime = performance.now() - startTime
  console.log(`✅ [Annotator] 上一页操作完成，总耗时: ${totalTime.toFixed(2)}ms`)
}

const goToPage = async (page: number) => {
  console.log(`🎯 [Annotator] 跳转到第 ${page} 页`)
  const startTime = performance.now()
  
  if (page >= 1 && page <= totalPages.value) {
    const storeTime = performance.now()
    pdfStore.goToPage(page)
    console.log(`🏪 [Annotator] Store 状态更新耗时: ${(performance.now() - storeTime).toFixed(2)}ms`)
    
    // 等待 PDF 查看器渲染完成
    if (pdfViewer.value) {
      try {
        const renderTime = performance.now()
        await pdfViewer.value.renderPage(pdfStore.currentPage)
        console.log(`🎨 [Annotator] PDF 渲染耗时: ${(performance.now() - renderTime).toFixed(2)}ms`)
      } catch (error) {
        console.error('❌ [Annotator] 渲染页面失败:', error)
      }
    }
    
    const totalTime = performance.now()
    console.log(`✅ [Annotator] 跳转到第 ${page} 页完成，总耗时: ${(totalTime - startTime).toFixed(2)}ms`)
  } else {
    console.log(`⚠️ [Annotator] 页码 ${page} 超出范围 (1-${totalPages.value})`)
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