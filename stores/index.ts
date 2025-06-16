// 导出所有 stores
export { usePDFStore } from './pdf'
export { useAnnotationStore } from './annotation'
export { useSystemStore } from './system'
export { useUIStore } from './ui'

// 导出类型
export type { PDFState } from './pdf'
export type { AnnotationState, Region } from './annotation'
export type { SystemState, DatabaseStats, APIStatus } from './system'
export type { UIState } from './ui'

// 组合 store hook，用于需要多个 store 的组件
export const useStores = () => {
  const pdfStore = usePDFStore()
  const annotationStore = useAnnotationStore()
  const systemStore = useSystemStore()
  const uiStore = useUIStore()

  return {
    pdf: pdfStore,
    annotation: annotationStore,
    system: systemStore,
    ui: uiStore
  }
}

// 全局重置函数
export const resetAllStores = () => {
  const stores = useStores()
  
  stores.pdf.reset()
  stores.annotation.reset()
  stores.system.reset()
  stores.ui.resetSettings()
}

// 初始化函数
export const initializeStores = async () => {
  const stores = useStores()
  
  // 加载 UI 设置
  stores.ui.loadSettings()
  
  // 初始化系统状态
  await stores.system.fetchStats()
  
  // 加载 PDF 数据
  await stores.pdf.loadPDFData()
  
  // 加载批注数据
  await stores.annotation.loadRegions()
} 