import { defineStore } from 'pinia'
import type { Bbox } from '~/utils/pdf-parser'
import { isRectIntersect } from '~/utils/pdf-parser'

export interface Region {
  id: number
  name: string
  annotation: string
  blocks: number[]
  bbox: Bbox
  createdAt: Date
  updatedAt: Date
}

export interface AnnotationState {
  // 选择状态
  selectedBlocks: number[]
  highlightedBlock: number | null
  currentBlock: number | null
  
  // 区域和批注
  regions: Region[]
  currentPageRegions: Region[] // 🎯 当前页面的区域缓存
  
  // 选择框
  selectionBox: Bbox | null
  isSelecting: boolean
  selectionMode: boolean
  selectionStart: { x: number, y: number } | null
  
  // 键盘导航
  keyboardNavigation: boolean
}

export const useAnnotationStore = defineStore('annotation', {
  state: (): AnnotationState => ({
    selectedBlocks: [],
    highlightedBlock: null,
    currentBlock: null,
    
    regions: [],
    currentPageRegions: [],
    
    selectionBox: null,
    isSelecting: false,
    selectionMode: false,
    selectionStart: null,
    
    keyboardNavigation: false
  }),

  getters: {
    // 是否有选中的块
    hasSelectedBlocks: (state) => state.selectedBlocks.length > 0,
    
    // 选中块的数量
    selectedBlocksCount: (state) => state.selectedBlocks.length,
    
    // 是否有区域
    hasRegions: (state) => state.regions.length > 0,
    
    // 区域数量
    regionsCount: (state) => state.regions.length,
    
    // 获取区域按创建时间排序
    regionsSorted: (state) => {
      return [...state.regions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    
    // 是否可以创建区域
    canCreateRegion: (state) => state.selectedBlocks.length > 0,
    
    // 🎯 获取当前页面的区域（从缓存中）
    getCurrentPageRegions: (state) => {
      return (currentPage: number) => {
        return state.currentPageRegions || []
      }
    }
  },

  actions: {
    // 块选择管理
    toggleBlockSelection(blockId: number) {
      const index = this.selectedBlocks.indexOf(blockId)
      if (index > -1) {
        this.selectedBlocks.splice(index, 1)
      } else {
        this.selectedBlocks.push(blockId)
      }
    },

    addBlockToSelection(blockId: number) {
      if (!this.selectedBlocks.includes(blockId)) {
        this.selectedBlocks.push(blockId)
      }
    },

    removeBlockFromSelection(blockId: number) {
      const index = this.selectedBlocks.indexOf(blockId)
      if (index > -1) {
        this.selectedBlocks.splice(index, 1)
      }
    },

    clearSelection() {
      this.selectedBlocks = []
      this.highlightedBlock = null
      this.currentBlock = null
    },

    setHighlightedBlock(blockId: number | null) {
      this.highlightedBlock = blockId
    },

    setCurrentBlock(blockId: number | null) {
      this.currentBlock = blockId
    },

    // 选择框管理
    startSelection(start: { x: number, y: number }) {
      this.isSelecting = true
      this.selectionStart = start
      this.selectionBox = {
        x: start.x,
        y: start.y,
        width: 0,
        height: 0
      }
    },

    updateSelection(current: { x: number, y: number }) {
      if (!this.isSelecting || !this.selectionStart) return

      const start = this.selectionStart
      this.selectionBox = {
        x: Math.min(start.x, current.x),
        y: Math.min(start.y, current.y),
        width: Math.abs(current.x - start.x),
        height: Math.abs(current.y - start.y)
      }
    },

    endSelection() {
      this.isSelecting = false
      this.selectionStart = null
      this.selectionBox = null
    },

    // 检测选择框与视觉块的相交
    findIntersectingBlocks(blocks: any[], overlayDimensions: any, mineruData: any, currentPage: number) {
      if (!this.selectionBox || !blocks.length) return []

      return blocks.filter(block => {
        // 将视觉块坐标转换为屏幕坐标
        const blockScreenCoords = this.convertBlockToScreenCoords(
          block.bbox, 
          overlayDimensions, 
          mineruData, 
          currentPage
        )
        if (!blockScreenCoords) return false
        
        // 使用相交检测函数
        return isRectIntersect(blockScreenCoords, this.selectionBox!)
      })
    },

    // 坐标转换函数：将PDF坐标转换为屏幕坐标
    convertBlockToScreenCoords(bbox: any, overlayDimensions: any, mineruData: any, currentPage: number) {
      if (overlayDimensions.width === 0 || !mineruData) return null

      // 获取当前页面的页面信息
      const currentPageInfo = mineruData.pdf_info[currentPage - 1]
      if (!currentPageInfo) return null

      // 从MinerU数据中获取页面尺寸
      const [pageWidth, pageHeight] = currentPageInfo.page_size

      // 计算缩放比例
      const scaleX = overlayDimensions.width / pageWidth
      const scaleY = overlayDimensions.height / pageHeight
      const scale = Math.min(scaleX, scaleY)

      // 计算实际渲染尺寸
      const renderWidth = pageWidth * scale
      const renderHeight = pageHeight * scale

      // 计算居中偏移
      const centerOffsetX = (overlayDimensions.width - renderWidth) / 2
      const centerOffsetY = (overlayDimensions.height - renderHeight) / 2

      return {
        x: bbox.x * scale + centerOffsetX,
        y: bbox.y * scale + centerOffsetY,
        width: bbox.width * scale,
        height: bbox.height * scale
      }
    },

    toggleSelectionMode() {
      this.selectionMode = !this.selectionMode
      if (!this.selectionMode) {
        this.endSelection()
      }
    },

    // 区域管理
    async createRegion(name?: string) {
      if (this.selectedBlocks.length === 0) return null

      // 计算选中块的边界框
      const pdfStore = usePDFStore()
      const selectedBlocksData = this.selectedBlocks.map(id => 
        pdfStore.visualBlocks.find(block => block.id === id)
      ).filter(Boolean)

      if (selectedBlocksData.length === 0) return null

      // 计算边界框
      const { calculateBoundingBox } = await import('~/utils/pdf-parser')
      const bbox = calculateBoundingBox(selectedBlocksData.map(block => block.bbox))

      const region: Region = {
        id: Date.now(),
        name: name || `区域 ${this.regions.length + 1}`,
        annotation: '',
        blocks: [...this.selectedBlocks],
        bbox,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.regions.push(region)
      
      // 保存到服务器
      try {
        await $fetch('/api/regions', {
          method: 'POST',
          body: {
            name: region.name,
            annotation: region.annotation,
            blocks: region.blocks,
            bbox: region.bbox
          }
        })
      } catch (error) {
        console.error('保存区域失败:', error)
      }

      // 清空选择
      this.clearSelection()
      
      return region
    },

    updateRegionAnnotation(regionId: number, annotation: string) {
      const region = this.regions.find(r => r.id === regionId)
      if (region) {
        region.annotation = annotation
        region.updatedAt = new Date()
        
        // 保存到服务器
        this.saveRegionToServer(region)
      }
    },

    async deleteRegion(regionId: number) {
      // 1. 从当前页面区域缓存中删除（立即更新UI）
      const currentPageIndex = this.currentPageRegions.findIndex(r => r.id === regionId)
      if (currentPageIndex > -1) {
        this.currentPageRegions.splice(currentPageIndex, 1)
      }
      
      // 2. 从全局区域列表中删除
      const globalIndex = this.regions.findIndex(r => r.id === regionId)
      if (globalIndex > -1) {
        this.regions.splice(globalIndex, 1)
      }
      
      // 3. 从服务器删除
      try {
        await this.deleteRegionFromServer(regionId)
        console.log(`✅ [Store] 成功删除区域 #${regionId}`)
      } catch (error) {
        console.error(`❌ [Store] 删除区域 #${regionId} 失败:`, error)
        // 如果服务器删除失败，可以考虑恢复本地状态
        // 这里暂时保持本地删除状态
      }
    },

    // 服务器同步
    async saveRegionToServer(region: Region) {
      try {
        await $fetch(`/api/regions/${region.id}`, {
          method: 'PUT' as any,
          body: {
            name: region.name,
            annotation: region.annotation,
            blocks: region.blocks,
            bbox: region.bbox
          }
        })
      } catch (error) {
        console.error('保存区域失败:', error)
      }
    },

    async deleteRegionFromServer(regionId: number) {
      try {
        await $fetch(`/api/regions/${regionId}`, {
          method: 'DELETE' as any
        })
      } catch (error) {
        console.error('删除区域失败:', error)
      }
    },

    async loadRegions() {
      try {
        console.log('🔄 [Store] 开始加载区域数据...')
        const response: any = await $fetch('/api/regions')
        console.log('📥 [Store] 收到区域数据响应:', response)
        
        if (response.success && response.regions) {
          this.regions = response.regions.map((r: any) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt)
          }))
          console.log(`✅ [Store] 成功加载 ${this.regions.length} 个区域:`, this.regions)
        } else {
          console.warn('⚠️ [Store] 区域数据响应格式异常:', response)
        }
      } catch (error) {
        console.error('❌ [Store] 加载区域失败:', error)
      }
    },

    // 🎯 加载当前页面的区域
    async loadCurrentPageRegions(pageNum: number) {
      try {
        console.log(`🔄 [Store] 开始加载第 ${pageNum} 页的区域...`)
        const response: any = await $fetch(`/api/regions/page/${pageNum}`)
        console.log(`📥 [Store] 收到第 ${pageNum} 页区域响应:`, response)
        
        if (response.success && response.regions) {
          this.currentPageRegions = response.regions.map((r: any) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt)
          }))
          console.log(`✅ [Store] 成功加载第 ${pageNum} 页的 ${this.currentPageRegions.length} 个区域`)
        } else {
          this.currentPageRegions = []
          console.log(`📄 [Store] 第 ${pageNum} 页没有区域`)
        }
      } catch (error) {
        console.error(`❌ [Store] 加载第 ${pageNum} 页区域失败:`, error)
        this.currentPageRegions = []
      }
    },

    // 键盘导航
    toggleKeyboardNavigation() {
      this.keyboardNavigation = !this.keyboardNavigation
    },

    // 重置状态
    reset() {
      this.selectedBlocks = []
      this.highlightedBlock = null
      this.currentBlock = null
      this.regions = []
      this.selectionBox = null
      this.isSelecting = false
      this.selectionMode = false
      this.selectionStart = null
      this.keyboardNavigation = false
    }
  }
}) 
