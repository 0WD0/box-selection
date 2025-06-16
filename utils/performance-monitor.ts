// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private sessionStart = performance.now()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  // 记录操作耗时
  recordOperation(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    
    const times = this.metrics.get(operation)!
    times.push(duration)
    
    // 只保留最近50次记录
    if (times.length > 50) {
      times.shift()
    }
    
    // 检测性能异常
    this.detectPerformanceAnomaly(operation, duration)
  }
  
  // 检测性能异常
  private detectPerformanceAnomaly(operation: string, currentDuration: number) {
    const times = this.metrics.get(operation)!
    
    if (times.length < 5) return // 需要至少5次记录才能分析
    
    const recent = times.slice(-5) // 最近5次
    const average = recent.reduce((a, b) => a + b, 0) / recent.length
    const previous = times.slice(-10, -5) // 之前5次
    const previousAverage = previous.length > 0 
      ? previous.reduce((a, b) => a + b, 0) / previous.length 
      : average
    
    // 如果当前操作比平均值慢3倍以上
    if (currentDuration > average * 3) {
      console.warn(`🐌 [性能异常] ${operation} 耗时异常: ${currentDuration.toFixed(2)}ms (平均: ${average.toFixed(2)}ms)`)
    }
    
    // 如果性能突然改善
    if (previousAverage > average * 2 && times.length >= 10) {
      console.info(`🚀 [性能改善] ${operation} 性能提升: ${previousAverage.toFixed(2)}ms -> ${average.toFixed(2)}ms`)
    }
    
    // 如果性能突然恶化
    if (average > previousAverage * 2 && times.length >= 10) {
      console.warn(`📉 [性能恶化] ${operation} 性能下降: ${previousAverage.toFixed(2)}ms -> ${average.toFixed(2)}ms`)
    }
  }
  
  // 获取操作统计
  getStats(operation: string) {
    const times = this.metrics.get(operation)
    if (!times || times.length === 0) return null
    
    const sorted = [...times].sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const median = sorted[Math.floor(sorted.length / 2)]
    
    return { min, max, avg, median, count: times.length }
  }
  
  // 打印所有统计信息
  printAllStats() {
    console.group('📊 性能监控统计')
    console.log(`会话时长: ${((performance.now() - this.sessionStart) / 1000).toFixed(1)}秒`)
    
    for (const [operation, times] of this.metrics.entries()) {
      const stats = this.getStats(operation)
      if (stats) {
        console.log(`${operation}:`, {
          次数: stats.count,
          平均: `${stats.avg.toFixed(2)}ms`,
          最小: `${stats.min.toFixed(2)}ms`,
          最大: `${stats.max.toFixed(2)}ms`,
          中位数: `${stats.median.toFixed(2)}ms`
        })
      }
    }
    console.groupEnd()
  }
  
  // 检测浏览器优化状态
  detectBrowserOptimization() {
    const pageFlipTimes = this.metrics.get('翻页总耗时')
    if (!pageFlipTimes || pageFlipTimes.length < 10) return
    
    const recent5 = pageFlipTimes.slice(-5)
    const first5 = pageFlipTimes.slice(0, 5)
    
    const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length
    const firstAvg = first5.reduce((a, b) => a + b, 0) / first5.length
    
    if (firstAvg > recentAvg * 1.5) {
      console.info(`🔥 [浏览器优化] 检测到性能优化，首次平均: ${firstAvg.toFixed(2)}ms，最近平均: ${recentAvg.toFixed(2)}ms`)
      return 'optimized'
    }
    
    return 'stable'
  }
}

// 全局实例
export const perfMonitor = PerformanceMonitor.getInstance()

// 便捷函数
export function measureOperation<T>(operation: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  perfMonitor.recordOperation(operation, duration)
  return result
}

export async function measureAsyncOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  perfMonitor.recordOperation(operation, duration)
  return result
} 