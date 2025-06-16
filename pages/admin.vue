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
              v-if="message" 
              :color="messageType" 
              class="mt-4"
            >
              <template #title>
                {{ messageType === 'success' ? '成功' : messageType === 'error' ? '错误' : '信息' }}
              </template>
              <template #description>
                {{ message }}
              </template>
            </UAlert>
          </div>
        </InfoCard>

        <!-- 数据库状态 -->
        <InfoCard title="数据库状态" icon="📈">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ stats.totalBlocks }}</div>
              <div class="text-sm text-gray-600">视觉块总数</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ stats.totalRegions }}</div>
              <div class="text-sm text-gray-600">区域总数</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">{{ stats.totalAnnotations }}</div>
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
// 设置页面标题
useHead({
  title: '数据库管理面板'
})

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info' | 'warning'>('info')

const stats = ref({
  totalBlocks: 0,
  totalRegions: 0,
  totalAnnotations: 0
})

// 初始化数据库
const initializeDatabase = async () => {
  loading.value = true
  message.value = ''
  
  try {
    const response = await $fetch('/api/init-db', {
      method: 'POST'
    })
    
    message.value = response.message
    messageType.value = response.success ? 'success' : 'error'
    await loadStats()
  } catch (error: any) {
    message.value = `初始化失败: ${error.data?.message || error.message}`
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const blocksResponse = await $fetch('/api/blocks')
    stats.value.totalBlocks = blocksResponse.blocks.length
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 页面加载时获取统计数据
onMounted(() => {
  loadStats()
})
</script> 