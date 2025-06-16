# Pinia 状态管理使用指南

本项目使用 Pinia 进行状态管理，将应用状态分为四个主要的 store：

## Store 结构

### 1. PDF Store (`usePDFStore`)
管理 PDF 文档相关的状态：
- PDF 文档对象
- 当前页面和总页数
- 缩放级别
- 视觉块数据
- 覆盖层尺寸

### 2. Annotation Store (`useAnnotationStore`)
管理批注和选择相关的状态：
- 选中的视觉块
- 区域和批注数据
- 选择框状态
- 键盘导航状态

### 3. System Store (`useSystemStore`)
管理系统状态和数据库统计：
- 数据库统计信息
- API 状态
- 全局通知系统
- 系统健康状态

### 4. UI Store (`useUIStore`)
管理用户界面状态：
- 侧边栏状态
- 模态框状态
- 主题设置
- 用户偏好

## 基本使用

### 在组件中使用单个 store

```vue
<script setup>
import { usePDFStore } from '~/stores'

const pdfStore = usePDFStore()

// 直接访问状态
console.log(pdfStore.currentPage)

// 使用 getter
console.log(pdfStore.pageInfo) // "1 / 10"

// 调用 action
pdfStore.nextPage()
</script>
```

### 使用响应式引用

```vue
<script setup>
import { usePDFStore } from '~/stores'

const pdfStore = usePDFStore()
const { currentPage, totalPages, scale } = storeToRefs(pdfStore)

// 现在这些是响应式的 ref
watch(currentPage, (newPage) => {
  console.log('页面变更:', newPage)
})
</script>
```

### 使用组合 store

```vue
<script setup>
import { useStores } from '~/stores'

const stores = useStores()

// 访问所有 store
stores.pdf.nextPage()
stores.annotation.clearSelection()
stores.system.fetchStats()
stores.ui.toggleSidebar()
</script>
```

## 具体使用场景

### 1. PDF 导航

```vue
<template>
  <div>
    <button @click="prevPage" :disabled="!canGoPrev">上一页</button>
    <span>{{ pageInfo }}</span>
    <button @click="nextPage" :disabled="!canGoNext">下一页</button>
    
    <div>缩放: {{ scalePercentage }}%</div>
    <button @click="zoomIn">放大</button>
    <button @click="zoomOut">缩小</button>
  </div>
</template>

<script setup>
import { usePDFStore } from '~/stores'

const pdfStore = usePDFStore()
const { canGoPrev, canGoNext, pageInfo, scalePercentage } = storeToRefs(pdfStore)

const prevPage = () => pdfStore.prevPage()
const nextPage = () => pdfStore.nextPage()
const zoomIn = () => pdfStore.zoomIn()
const zoomOut = () => pdfStore.zoomOut()
</script>
```

### 2. 批注管理

```vue
<template>
  <div>
    <div>已选择 {{ selectedBlocksCount }} 个块</div>
    <button 
      @click="createRegion" 
      :disabled="!canCreateRegion"
    >
      创建区域
    </button>
    
    <div v-for="region in regionsSorted" :key="region.id">
      <h3>{{ region.name }}</h3>
      <textarea 
        v-model="region.annotation"
        @blur="updateAnnotation(region.id, region.annotation)"
      />
      <button @click="deleteRegion(region.id)">删除</button>
    </div>
  </div>
</template>

<script setup>
import { useAnnotationStore } from '~/stores'

const annotationStore = useAnnotationStore()
const { 
  selectedBlocksCount, 
  canCreateRegion, 
  regionsSorted 
} = storeToRefs(annotationStore)

const createRegion = () => annotationStore.createRegion()
const updateAnnotation = (id, annotation) => 
  annotationStore.updateRegionAnnotation(id, annotation)
const deleteRegion = (id) => annotationStore.deleteRegion(id)
</script>
```

### 3. 系统状态监控

```vue
<template>
  <div>
    <div v-if="isLoading">正在加载...</div>
    
    <div>系统健康状态: {{ systemHealth }}</div>
    
    <div v-if="stats">
      <p>视觉块: {{ stats.visualBlocks }}</p>
      <p>区域: {{ stats.regions }}</p>
      <p>批注: {{ stats.annotations }}</p>
    </div>
    
    <button @click="refreshStats">刷新统计</button>
    <button @click="initDB">初始化数据库</button>
  </div>
</template>

<script setup>
import { useSystemStore } from '~/stores'

const systemStore = useSystemStore()
const { stats, isLoading, systemHealth } = storeToRefs(systemStore)

const refreshStats = () => systemStore.refreshStats()
const initDB = () => systemStore.initializeDatabase()
</script>
```

### 4. UI 控制

```vue
<template>
  <div>
    <button @click="toggleSidebar">
      {{ sidebarCollapsed ? '展开' : '收起' }}侧边栏
    </button>
    
    <button @click="toggleTheme">
      切换主题 (当前: {{ theme }})
    </button>
    
    <button @click="openModal('settings')">打开设置</button>
    
    <div v-if="hasOpenModal">有模态框打开</div>
  </div>
</template>

<script setup>
import { useUIStore } from '~/stores'

const uiStore = useUIStore()
const { sidebarCollapsed, theme, hasOpenModal } = storeToRefs(uiStore)

const toggleSidebar = () => uiStore.toggleSidebar()
const toggleTheme = () => uiStore.toggleTheme()
const openModal = (name) => uiStore.openModal(name)
</script>
```

## 通知系统

系统 store 包含了一个内置的通知系统：

```vue
<script setup>
import { useSystemStore } from '~/stores'

const systemStore = useSystemStore()

// 添加通知
systemStore.addNotification({
  type: 'success',
  title: '操作成功',
  description: '数据已保存',
  timeout: 3000
})

// 通知会自动显示在页面右上角，并在指定时间后消失
</script>
```

## 数据持久化

UI Store 会自动将用户偏好保存到 localStorage：
- 侧边栏状态
- 主题设置
- 布局偏好
- 用户设置

这些设置会在页面刷新后自动恢复。

## 最佳实践

1. **使用 storeToRefs**: 当需要在模板中使用 store 状态时，使用 `storeToRefs` 保持响应性
2. **组合使用**: 对于需要多个 store 的复杂组件，使用 `useStores()` 组合函数
3. **错误处理**: Store 中的异步操作已包含错误处理，会自动显示通知
4. **类型安全**: 所有 store 都有完整的 TypeScript 类型定义
5. **状态重置**: 使用 `resetAllStores()` 可以重置所有状态到初始值

## 调试

在开发环境中，可以通过浏览器的 Vue DevTools 查看和调试 Pinia store 状态。 