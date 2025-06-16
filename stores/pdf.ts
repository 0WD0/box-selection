import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { MiddleJsonData } from '~/utils/pdf-parser'
import { nextTick } from 'vue'

export interface PDFState {
  // PDF 文档状态
  pdfDoc: any | null
  currentPage: number
  totalPages: number
  scale: number
  
  // 文档数据
  mineruData: MiddleJsonData | null
  visualBlocks: any[]
  
  // 覆盖层状态
  overlayDimensions: {
    width: number
    height: number
    offsetX: number
    offsetY: number
  }
  
  // 加载状态
  isLoading: boolean
  error: string | null
  
  // 内部缓存（可选）
  _pageBlocksCache?: Map<string, any[]>
}

export const usePDFStore = defineStore('pdf', {
  state: (): PDFState => ({
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.2,
    
    // 使用普通数组，但在访问时进行优化
    mineruData: null,
    visualBlocks: [],
    
    overlayDimensions: {
      width: 0,
      height: 0,
      offsetX: 0,
      offsetY: 0
    },
    
    isLoading: false,
    error: null
  }),

  getters: {
    // 当前页面的视觉块 - 使用智能缓存
    currentPageBlocks: (state) => {
      const startTime = performance.now()
      console.log(`🏪 [PDFStore] 开始计算 currentPageBlocks，当前页: ${state.currentPage}`)
      
      // 使用静态缓存避免重复计算
      const cacheKey = `page-${state.currentPage}`
      if (!state._pageBlocksCache) {
        state._pageBlocksCache = new Map()
      }
      
      if (state._pageBlocksCache.has(cacheKey)) {
        const cached = state._pageBlocksCache.get(cacheKey)
        if (cached) {
          console.log(`🏪 [PDFStore] 🚀 使用缓存结果，耗时: 0.00ms，结果数量: ${cached.length}`)
          return cached
        }
      }
      
      const result = state.visualBlocks.filter(block => block.pageIndex === state.currentPage - 1)
      
      // 缓存结果，但限制缓存大小
      if (state._pageBlocksCache.size > 10) {
        const firstKey = state._pageBlocksCache.keys().next().value
        if (firstKey) {
          state._pageBlocksCache.delete(firstKey)
        }
      }
      state._pageBlocksCache.set(cacheKey, result)
      
      const endTime = performance.now()
      console.log(`🏪 [PDFStore] currentPageBlocks 计算完成，耗时: ${(endTime - startTime).toFixed(2)}ms，结果数量: ${result.length}`)
      
      return result
    },
    
    // 是否有PDF文档
    hasPDF: (state) => !!state.pdfDoc,
    
    // 是否可以翻页
    canGoNext: (state) => state.currentPage < state.totalPages,
    canGoPrev: (state) => state.currentPage > 1,
    
    // 缩放信息
    scalePercentage: (state) => Math.round(state.scale * 100),
    
    // 页面信息
    pageInfo: (state) => `${state.currentPage} / ${state.totalPages}`
  },

  actions: {
    // PDF 文档管理
    setPDFDoc(doc: any) {
      this.pdfDoc = doc
      this.totalPages = doc?.numPages || 0
    },

    // 页面导航
    setCurrentPage(page: number) {
      console.log(`🏪 [PDFStore] setCurrentPage: ${this.currentPage} -> ${page}`)
      const startTime = performance.now()
      
      if (page >= 1 && page <= this.totalPages) {
        // 避免不必要的更新
        if (this.currentPage === page) {
          console.log(`⏭️ [PDFStore] 页面无变化，跳过更新`)
          return
        }
        
        this.currentPage = page
        console.log(`🏪 [PDFStore] 页面设置完成，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
      } else {
        console.log(`⚠️ [PDFStore] 页码 ${page} 超出范围 (1-${this.totalPages})`)
      }
    },

    nextPage() {
      console.log(`🏪 [PDFStore] nextPage: ${this.currentPage} -> ${this.currentPage + 1}`)
      const startTime = performance.now()
      if (this.canGoNext) {
        const oldPage = this.currentPage
        // 直接更新，避免不必要的复杂性
        this.currentPage++
        console.log(`🏪 [PDFStore] nextPage 完成，页面: ${oldPage} -> ${this.currentPage}，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
      } else {
        console.log(`⚠️ [PDFStore] 已经是最后一页，无法继续`)
      }
    },

    prevPage() {
      console.log(`🏪 [PDFStore] prevPage: ${this.currentPage} -> ${this.currentPage - 1}`)
      const startTime = performance.now()
      if (this.canGoPrev) {
        const oldPage = this.currentPage
        // 直接更新，避免不必要的复杂性
        this.currentPage--
        console.log(`🏪 [PDFStore] prevPage 完成，页面: ${oldPage} -> ${this.currentPage}，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
      } else {
        console.log(`⚠️ [PDFStore] 已经是第一页，无法继续`)
      }
    },

    goToPage(page: number) {
      console.log(`🏪 [PDFStore] goToPage: ${this.currentPage} -> ${page}`)
      this.setCurrentPage(page)
    },

    // 缩放控制
    setScale(scale: number) {
      this.scale = Math.max(0.5, Math.min(3.0, scale))
    },

    zoomIn() {
      this.setScale(this.scale + 0.1)
    },

    zoomOut() {
      this.setScale(this.scale - 0.1)
    },

    resetZoom() {
      this.setScale(1.0)
    },

    // 覆盖层管理
    updateOverlayDimensions(dimensions: PDFState['overlayDimensions']) {
      const startTime = performance.now()
      console.log(`🏪 [PDFStore] 开始更新覆盖层尺寸`)
      
      // 检查是否真的需要更新
      const current = this.overlayDimensions
      const hasChanged = 
        Math.abs(dimensions.width - current.width) > 1 ||
        Math.abs(dimensions.height - current.height) > 1 ||
        Math.abs(dimensions.offsetX - current.offsetX) > 1 ||
        Math.abs(dimensions.offsetY - current.offsetY) > 1
      
      if (!hasChanged) {
        console.log(`⏭️ [PDFStore] 覆盖层尺寸无变化，跳过更新`)
        return
      }
      
      this.overlayDimensions = dimensions
      console.log(`🏪 [PDFStore] 覆盖层尺寸更新完成，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
    },

    // 数据加载
    async loadPDFData() {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await fetch('/data/middle.json')
        const data: MiddleJsonData = await response.json()
        this.mineruData = data
        
        // 解析视觉块数据
        const { parseMiddleJsonToBlocks } = await import('~/utils/pdf-parser')
        const blocks = parseMiddleJsonToBlocks(data)
        
        // 使用 markRaw 优化大数组的响应式性能
        this.visualBlocks = markRaw(blocks.map((block, index) => ({
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
        })))
        
        console.log('已加载视觉块:', this.visualBlocks.length)
      } catch (error) {
        this.error = error instanceof Error ? error.message : '加载PDF数据失败'
        console.error('加载PDF数据失败:', error)
      } finally {
        this.isLoading = false
      }
    },

    // 重置状态
    reset() {
      this.pdfDoc = null
      this.currentPage = 1
      this.totalPages = 0
      this.scale = 1.2
      this.mineruData = null
      this.visualBlocks = []
      this.overlayDimensions = { width: 0, height: 0, offsetX: 0, offsetY: 0 }
      this.isLoading = false
      this.error = null
    }
  }
}) 
