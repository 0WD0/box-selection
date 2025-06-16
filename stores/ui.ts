import { defineStore } from 'pinia'

export interface UIState {
  // 侧边栏状态
  sidebarCollapsed: boolean
  sidebarWidth: number
  
  // 模态框状态
  modals: {
    keyboardHelp: boolean
    settings: boolean
    about: boolean
  }
  
  // 主题设置
  theme: 'light' | 'dark' | 'auto'
  
  // 布局设置
  layout: {
    showHeader: boolean
    showFooter: boolean
    showBreadcrumbs: boolean
  }
  
  // 加载状态
  globalLoading: boolean
  loadingMessage: string
  
  // 错误状态
  globalError: string | null
  
  // 用户偏好
  preferences: {
    autoSave: boolean
    showTooltips: boolean
    animationsEnabled: boolean
    compactMode: boolean
  }
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    sidebarCollapsed: false,
    sidebarWidth: 320,
    
    modals: {
      keyboardHelp: false,
      settings: false,
      about: false
    },
    
    theme: 'auto',
    
    layout: {
      showHeader: true,
      showFooter: true,
      showBreadcrumbs: true
    },
    
    globalLoading: false,
    loadingMessage: '',
    
    globalError: null,
    
    preferences: {
      autoSave: true,
      showTooltips: true,
      animationsEnabled: true,
      compactMode: false
    }
  }),

  getters: {
    // 是否有打开的模态框
    hasOpenModal: (state) => {
      return Object.values(state.modals).some(isOpen => isOpen)
    },
    
    // 侧边栏实际宽度
    actualSidebarWidth: (state) => {
      return state.sidebarCollapsed ? 60 : state.sidebarWidth
    },
    
    // 主内容区域样式
    mainContentStyle: (state) => {
      const sidebarWidth = state.sidebarCollapsed ? 60 : state.sidebarWidth
      return {
        marginLeft: `${sidebarWidth}px`,
        width: `calc(100% - ${sidebarWidth}px)`
      }
    },
    
    // 是否显示加载状态
    isLoading: (state) => state.globalLoading,
    
    // 是否有错误
    hasError: (state) => !!state.globalError
  },

  actions: {
    // 侧边栏控制
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      this.saveSidebarState()
    },

    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
      this.saveSidebarState()
    },

    setSidebarWidth(width: number) {
      this.sidebarWidth = Math.max(200, Math.min(500, width))
      this.saveSidebarState()
    },

    // 模态框控制
    openModal(modalName: keyof UIState['modals']) {
      this.modals[modalName] = true
    },

    closeModal(modalName: keyof UIState['modals']) {
      this.modals[modalName] = false
    },

    closeAllModals() {
      Object.keys(this.modals).forEach(key => {
        this.modals[key as keyof UIState['modals']] = false
      })
    },

    toggleModal(modalName: keyof UIState['modals']) {
      this.modals[modalName] = !this.modals[modalName]
    },

    // 主题控制
    setTheme(theme: UIState['theme']) {
      this.theme = theme
      this.applyTheme()
      this.saveTheme()
    },

    toggleTheme() {
      const themes: UIState['theme'][] = ['light', 'dark', 'auto']
      const currentIndex = themes.indexOf(this.theme)
      const nextIndex = (currentIndex + 1) % themes.length
      this.setTheme(themes[nextIndex])
    },

    // 布局控制
    setLayoutOption<K extends keyof UIState['layout']>(
      key: K, 
      value: UIState['layout'][K]
    ) {
      this.layout[key] = value
      this.saveLayoutSettings()
    },

    toggleLayoutOption(key: keyof UIState['layout']) {
      this.layout[key] = !this.layout[key]
      this.saveLayoutSettings()
    },

    // 全局加载状态
    setGlobalLoading(loading: boolean, message = '') {
      this.globalLoading = loading
      this.loadingMessage = message
    },

    showLoading(message = '正在加载...') {
      this.setGlobalLoading(true, message)
    },

    hideLoading() {
      this.setGlobalLoading(false, '')
    },

    // 全局错误状态
    setGlobalError(error: string | null) {
      this.globalError = error
    },

    clearGlobalError() {
      this.globalError = null
    },

    // 用户偏好
    setPreference<K extends keyof UIState['preferences']>(
      key: K, 
      value: UIState['preferences'][K]
    ) {
      this.preferences[key] = value
      this.savePreferences()
    },

    togglePreference(key: keyof UIState['preferences']) {
      this.preferences[key] = !this.preferences[key]
      this.savePreferences()
    },

    // 持久化方法
    saveSidebarState() {
      if (process.client) {
        localStorage.setItem('ui-sidebar', JSON.stringify({
          collapsed: this.sidebarCollapsed,
          width: this.sidebarWidth
        }))
      }
    },

    saveTheme() {
      if (process.client) {
        localStorage.setItem('ui-theme', this.theme)
      }
    },

    saveLayoutSettings() {
      if (process.client) {
        localStorage.setItem('ui-layout', JSON.stringify(this.layout))
      }
    },

    savePreferences() {
      if (process.client) {
        localStorage.setItem('ui-preferences', JSON.stringify(this.preferences))
      }
    },

    // 应用主题
    applyTheme() {
      if (process.client) {
        const html = document.documentElement
        
        if (this.theme === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          html.classList.toggle('dark', prefersDark)
        } else {
          html.classList.toggle('dark', this.theme === 'dark')
        }
      }
    },

    // 加载保存的设置
    loadSettings() {
      if (process.client) {
        // 加载侧边栏状态
        const sidebarState = localStorage.getItem('ui-sidebar')
        if (sidebarState) {
          try {
            const parsed = JSON.parse(sidebarState)
            this.sidebarCollapsed = parsed.collapsed
            this.sidebarWidth = parsed.width
          } catch (e) {
            console.warn('Failed to parse sidebar state:', e)
          }
        }

        // 加载主题
        const theme = localStorage.getItem('ui-theme') as UIState['theme']
        if (theme && ['light', 'dark', 'auto'].includes(theme)) {
          this.theme = theme
          this.applyTheme()
        }

        // 加载布局设置
        const layoutSettings = localStorage.getItem('ui-layout')
        if (layoutSettings) {
          try {
            const parsed = JSON.parse(layoutSettings)
            this.layout = { ...this.layout, ...parsed }
          } catch (e) {
            console.warn('Failed to parse layout settings:', e)
          }
        }

        // 加载用户偏好
        const preferences = localStorage.getItem('ui-preferences')
        if (preferences) {
          try {
            const parsed = JSON.parse(preferences)
            this.preferences = { ...this.preferences, ...parsed }
          } catch (e) {
            console.warn('Failed to parse preferences:', e)
          }
        }
      }
    },

    // 重置所有设置
    resetSettings() {
      this.sidebarCollapsed = false
      this.sidebarWidth = 320
      this.modals = {
        keyboardHelp: false,
        settings: false,
        about: false
      }
      this.theme = 'auto'
      this.layout = {
        showHeader: true,
        showFooter: true,
        showBreadcrumbs: true
      }
      this.preferences = {
        autoSave: true,
        showTooltips: true,
        animationsEnabled: true,
        compactMode: false
      }
      
      // 清除本地存储
      if (process.client) {
        localStorage.removeItem('ui-sidebar')
        localStorage.removeItem('ui-theme')
        localStorage.removeItem('ui-layout')
        localStorage.removeItem('ui-preferences')
      }
      
      this.applyTheme()
    }
  }
}) 