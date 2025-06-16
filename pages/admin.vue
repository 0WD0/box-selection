<template>
  <AppLayout>
    <template #header>
      <AppHeader 
        title="数据库管理面板" 
        icon="📊"
        subtitle="数据库初始化和管理工具"
      />
    </template>

    <UContainer class="py-8">
      <div class="space-y-6">
        <!-- 数据库初始化 -->
        <InfoCard title="数据库初始化" icon="🗄️">
          <div class="space-y-4">
            <p class="text-gray-600">从 middle.json 文件加载视觉块数据到数据库</p>
            
            <UButton 
              @click="initializeDatabase" 
              :loading="loading"
              color="primary"
              size="lg"
            >
              {{ loading ? '正在初始化...' : '初始化数据库' }}
            </UButton>
            
            <UAlert 
              v-if="latestMessage.message" 
              :color="latestMessage.messageType" 
              class="mt-4"
            >
              <template #title>
                {{ latestMessage.messageType === 'success' ? '成功' : latestMessage.messageType === 'error' ? '错误' : '信息' }}
              </template>
              <template #description>
                {{ latestMessage.message }}
              </template>
            </UAlert>
          </div>
        </InfoCard>

        <!-- 数据库状态 -->
        <InfoCard title="数据库状态" icon="📈">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ adminStats.totalBlocks }}</div>
              <div class="text-sm text-gray-600">视觉块总数</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ adminStats.totalRegions }}</div>
              <div class="text-sm text-gray-600">区域总数</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">{{ adminStats.totalAnnotations }}</div>
              <div class="text-sm text-gray-600">批注总数</div>
            </div>
          </div>
        </InfoCard>

        <!-- 快速操作 -->
        <InfoCard title="快速操作" icon="⚡">
          <div class="flex flex-wrap gap-3">
            <UButton to="/annotator" color="success" size="sm">
              <UIcon name="i-heroicons-pencil" class="w-4 h-4 mr-1" />
              打开批注器
            </UButton>
            
            <UButton to="/read-all" color="info" size="sm">
              <UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-1" />
              PDF 查看器
            </UButton>
            
            <UButton to="/status" color="warning" size="sm">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 mr-1" />
              系统状态
            </UButton>
          </div>
        </InfoCard>
      </div>
    </UContainer>
  </AppLayout>
</template>

<script setup lang="ts">
import { useSystemStore } from '~/stores'

// 设置页面标题
useHead({
  title: '数据库管理面板'
})

// 使用系统 store
const systemStore = useSystemStore()

// 从 store 获取响应式数据
const { stats, isLoading: loading, notifications } = storeToRefs(systemStore)

// 计算属性 - 从系统统计中获取数据
const adminStats = computed(() => ({
  totalBlocks: stats.value?.visualBlocks || 0,
  totalRegions: stats.value?.regions || 0,
  totalAnnotations: stats.value?.annotations || 0
}))

// 最新的消息
const latestMessage = computed(() => {
  const latest = notifications.value[notifications.value.length - 1]
  return latest ? {
    message: latest.description || latest.title,
    messageType: latest.type
  } : { message: '', messageType: 'info' as const }
})

// 初始化数据库
const initializeDatabase = async () => {
  await systemStore.initializeDatabase()
}

// 页面加载时获取统计数据
onMounted(() => {
  systemStore.fetchStats()
})
</script> 