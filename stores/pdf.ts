import { defineStore } from 'pinia'
import type { MiddleJsonData } from '~/utils/pdf-parser'

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
}

export const usePDFStore = defineStore('pdf', {
  state: (): PDFState => ({
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.2,
    
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
    // 当前页面的视觉块
    currentPageBlocks: (state) => {
      return state.visualBlocks.filter(block => block.pageIndex === state.currentPage - 1)
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
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    nextPage() {
      if (this.canGoNext) {
        this.currentPage++
      }
    },

    prevPage() {
      if (this.canGoPrev) {
        this.currentPage--
      }
    },

    goToPage(page: number) {
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
      this.overlayDimensions = dimensions
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
        
        this.visualBlocks = blocks.map((block, index) => ({
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
