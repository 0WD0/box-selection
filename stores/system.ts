import { defineStore } from 'pinia'

export interface DatabaseStats {
  visualBlocks: number
  regions: number
  annotations: number
  regionBlocks: number
}

export interface APIStatus {
  status: string
  color: 'success' | 'error' | 'warning' | 'info'
  variant: 'solid' | 'soft'
}

export interface SystemState {
  // 数据库统计
  stats: DatabaseStats | null
  
  // API 状态
  apiTests: {
    stats: APIStatus
    regions: APIStatus
    initDb: APIStatus
  }
  
  // 系统状态
  isLoading: boolean
  error: string | null
  
  // 通知系统
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    description?: string
    timeout?: number
  }>
}

export const useSystemStore = defineStore('system', {
  state: (): SystemState => ({
    stats: null,
    
    apiTests: {
      stats: { 
        status: '检测中...', 
        color: 'warning', 
        variant: 'soft' 
      },
      regions: { 
        status: '检测中...', 
        color: 'warning', 
        variant: 'soft' 
      },
      initDb: { 
        status: '未测试', 
        color: 'info', 
        variant: 'soft' 
      }
    },
    
    isLoading: false,
    error: null,
    
    notifications: []
  }),

  getters: {
    // 数据状态
    dataStatus: (state) => {
      if (!state.stats) {
        return { text: '加载中...', color: 'warning' }
      }
      if (state.stats.visualBlocks > 0) {
        return { text: '已完成', color: 'success' }
      }
      return { text: '未初始化', color: 'error' }
    },
    
    // 系统健康状态
    systemHealth: (state) => {
      const statsOk = state.apiTests.stats.color === 'success'
      const regionsOk = state.apiTests.regions.color === 'success'
      const dbOk = state.apiTests.initDb.color === 'success'
      
      if (statsOk && regionsOk && dbOk) return 'healthy'
      if (statsOk || regionsOk || dbOk) return 'warning'
      return 'error'
    },
    
    // 是否有未读通知
    hasNotifications: (state) => state.notifications.length > 0
  },

  actions: {
    // 获取统计数据
    async fetchStats() {
      this.isLoading = true
      this.error = null
      
      try {
        // 使用新的统计API
        const response: any = await $fetch('/api/stats')
        
        if (response.success) {
          this.stats = response.stats
        } else {
          throw new Error('Failed to get stats')
        }
        
        // 更新API测试状态
        this.apiTests.stats = {
          status: '✅ 正常',
          color: 'success',
          variant: 'solid'
        }
        
        // 测试区域API
        await this.testRegionsAPI()
        
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        this.apiTests.stats = {
          status: '❌ 失败',
          color: 'error',
          variant: 'solid'
        }
        this.error = error instanceof Error ? error.message : '获取统计数据失败'
      } finally {
        this.isLoading = false
      }
    },

    // 刷新统计
    async refreshStats() {
      await this.fetchStats()
      this.addNotification({
        type: 'success',
        title: '数据已刷新',
        description: '系统统计数据已更新'
      })
    },

    // 初始化数据库
    async initializeDatabase() {
      this.isLoading = true
      
      try {
        const response: any = await $fetch('/api/init-db', {
          method: 'POST'
        })
        
        this.apiTests.initDb = {
          status: response.success ? '✅ 成功' : '❌ 失败',
          color: response.success ? 'success' : 'error',
          variant: 'solid'
        }
        
        this.addNotification({
          type: response.success ? 'success' : 'error',
          title: response.success ? '初始化成功' : '初始化失败',
          description: response.message
        })
        
        // 如果成功，刷新统计数据
        if (response.success) {
          await this.fetchStats()
        }
        
        return response
      } catch (error: any) {
        this.apiTests.initDb = {
          status: '❌ 失败',
          color: 'error',
          variant: 'solid'
        }
        
        this.addNotification({
          type: 'error',
          title: '初始化失败',
          description: error.data?.message || error.message
        })
        
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 通知管理
    addNotification(notification: Omit<SystemState['notifications'][0], 'id'>) {
      const id = Date.now().toString()
      this.notifications.push({
        id,
        ...notification
      })
      
      // 自动移除通知
      const timeout = notification.timeout || 5000
      setTimeout(() => {
        this.removeNotification(id)
      }, timeout)
    },

    removeNotification(id: string) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    clearAllNotifications() {
      this.notifications = []
    },

    // 测试区域API
    async testRegionsAPI() {
      try {
        await $fetch('/api/regions')
        this.apiTests.regions = {
          status: '✅ 正常',
          color: 'success',
          variant: 'solid'
        }
      } catch (error) {
        console.error('Failed to test regions API:', error)
        this.apiTests.regions = {
          status: '❌ 失败',
          color: 'error',
          variant: 'solid'
        }
      }
    },

    // 重置状态
    reset() {
      this.stats = null
      this.apiTests = {
        stats: { 
          status: '检测中...', 
          color: 'warning', 
          variant: 'soft' 
        },
        regions: { 
          status: '检测中...', 
          color: 'warning', 
          variant: 'soft' 
        },
        initDb: { 
          status: '未测试', 
          color: 'info', 
          variant: 'soft' 
        }
      }
      this.isLoading = false
      this.error = null
      this.notifications = []
    }
  }
}) 