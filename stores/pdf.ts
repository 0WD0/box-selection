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
  
  // 🖱️ 画布偏移状态
  canvasOffset: {
    x: number
    y: number
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
    
    // 🖱️ 画布偏移状态
    canvasOffset: {
      x: 0,
      y: 0
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
          const endTime = performance.now()
          console.log(`🏪 [PDFStore] 🚀 使用缓存结果，耗时: ${(endTime - startTime).toFixed(2)}ms，结果数量: ${cached.length}`)
          return cached
        }
      }
      
      // 🚀 优化：使用更高效的过滤方法
      const targetPageIndex = state.currentPage - 1
      const result = []
      
      // 直接遍历，避免 filter 的函数调用开销
      for (let i = 0; i < state.visualBlocks.length; i++) {
        const block = state.visualBlocks[i]
        if (block.pageIndex === targetPageIndex) {
          result.push(block)
        }
      }
      
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
      console.log(`🏪 [PDFStore] setPDFDoc`)
      const startTime = performance.now()
      
      // 🚀 使用 $patch 批量更新，减少响应式触发
      this.$patch({
        pdfDoc: doc,
        totalPages: doc?.numPages || 0
      })
      
      console.log(`🏪 [PDFStore] setPDFDoc 完成，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
    },

    // 页面导航 - 优化版本
    setCurrentPage(page: number) {
      console.log(`🏪 [PDFStore] setCurrentPage: ${this.currentPage} -> ${page}`)
      const startTime = performance.now()
      
      if (page >= 1 && page <= this.totalPages) {
        // 避免不必要的更新
        if (this.currentPage === page) {
          console.log(`⏭️ [PDFStore] 页面无变化，跳过更新`)
          return
        }
        
        // 🚀 直接赋值，最小化响应式开销
        this.currentPage = page
        console.log(`🏪 [PDFStore] 页面设置完成，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
      } else {
        console.log(`⚠️ [PDFStore] 页码 ${page} 超出范围 (1-${this.totalPages})`)
      }
    },

    // 🚀 优化的翻页方法
    nextPage() {
      console.log(`🏪 [PDFStore] nextPage: ${this.currentPage} -> ${this.currentPage + 1}`)
      const startTime = performance.now()
      
      if (this.currentPage < this.totalPages) {
        // 🚀 最简单的更新方式
        this.currentPage++
        console.log(`🏪 [PDFStore] nextPage 完成，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
      } else {
        console.log(`⚠️ [PDFStore] 已经是最后一页`)
      }
    },

    prevPage() {
      console.log(`🏪 [PDFStore] prevPage: ${this.currentPage} -> ${this.currentPage - 1}`)
      const startTime = performance.now()
      
      if (this.currentPage > 1) {
        // 🚀 最简单的更新方式
        this.currentPage--
        console.log(`🏪 [PDFStore] prevPage 完成，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
      } else {
        console.log(`⚠️ [PDFStore] 已经是第一页`)
      }
    },

    goToPage(page: number) {
      console.log(`🏪 [PDFStore] goToPage: ${this.currentPage} -> ${page}`)
      this.setCurrentPage(page)
    },

    // 缩放控制
    setScale(scale: number) {
      const newScale = Math.max(0.5, Math.min(3.0, scale))
      if (this.scale !== newScale) {
        this.scale = newScale
      }
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

    // 🖱️ 画布偏移控制
    setCanvasOffset(x: number, y: number) {
      this.canvasOffset.x = x
      this.canvasOffset.y = y
    },

    updateCanvasOffset(deltaX: number, deltaY: number) {
      this.canvasOffset.x += deltaX
      this.canvasOffset.y += deltaY
    },

    resetCanvasOffset() {
      this.canvasOffset.x = 0
      this.canvasOffset.y = 0
    },

    // 🚀 优化的覆盖层管理
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
      
      // 🚀 使用 $patch 批量更新
      this.$patch({
        overlayDimensions: dimensions
      })
      
      console.log(`🏪 [PDFStore] 覆盖层尺寸更新完成，耗时: ${(performance.now() - startTime).toFixed(2)}ms`)
    },

    // 数据加载
    async loadPDFData() {
      console.log(`🏪 [PDFStore] 开始加载PDF数据`)
      const startTime = performance.now()
      
      this.isLoading = true
      this.error = null
      
      try {
        // 🔄 从数据库加载visual blocks（包含真实ID）
        const visualBlocksResponse: any = await $fetch('/api/visual-blocks')
        if (!visualBlocksResponse.success) {
          throw new Error('Failed to load visual blocks from database')
        }
        
        // 🔄 仍需要加载middle.json获取页面信息
        const response = await $fetch('/api/files/middle.json')
        const data: MiddleJsonData = response as unknown as MiddleJsonData
        
        // 🚀 使用数据库中的真实ID，而不是数组索引
        const processedBlocks = visualBlocksResponse.visualBlocks.map((block: any) => ({
          ...block,
          pageInfo: data.pdf_info[block.pageIndex] // 添加页面信息
        }))
        
        // 🚀 使用 $patch 批量更新，减少响应式触发
        this.$patch({
          mineruData: markRaw(data), // 原始数据不需要响应式
          visualBlocks: markRaw(processedBlocks), // 大数组使用 markRaw
          isLoading: false
        })
        
        // 清空缓存，因为数据已更新
        if (this._pageBlocksCache) {
          this._pageBlocksCache.clear()
        }
        
        const endTime = performance.now()
        console.log(`🏪 [PDFStore] PDF数据加载完成，耗时: ${(endTime - startTime).toFixed(2)}ms，视觉块: ${processedBlocks.length}`)
        
      } catch (error) {
        this.error = error instanceof Error ? error.message : '加载PDF数据失败'
        console.error('加载PDF数据失败:', error)
        this.isLoading = false
      }
    },

    // 重置状态
    reset() {
      // 🚀 直接赋值重置，避免 $patch 的类型问题
      this.pdfDoc = null
      this.currentPage = 1
      this.totalPages = 0
      this.scale = 1.2
      this.mineruData = null
      this.visualBlocks = []
      this.overlayDimensions = { width: 0, height: 0, offsetX: 0, offsetY: 0 }
      this.canvasOffset = { x: 0, y: 0 } // 🖱️ 重置画布偏移
      this.isLoading = false
      this.error = null
      
      // 清空缓存
      if (this._pageBlocksCache) {
        this._pageBlocksCache.clear()
      }
    }
  }
}) 
