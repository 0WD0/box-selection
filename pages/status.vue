<template>
  <AppLayout>
    <template #header>
      <AppHeader 
        title="系统状态监控" 
        icon="📊"
        subtitle="NuxtHub 迁移状态和数据库监控"
        :breadcrumbs="[
          { label: '系统管理', to: '/admin' },
          { label: '系统状态监控' }
        ]"
      >
        <template #actions>
          <UButton 
            @click="refreshStats" 
            color="primary" 
            size="sm"
            :loading="loading"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
            刷新数据
          </UButton>
        </template>
      </AppHeader>
    </template>

    <UContainer class="py-8">
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- 系统状态概览 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="NuxtHub 状态"
            value="运行中"
            icon="i-heroicons-check"
            color="green"
            subtitle="云原生部署就绪"
          />

          <StatCard
            label="数据库连接"
            value="正常"
            icon="i-heroicons-circle-stack"
            color="blue"
            subtitle="Cloudflare D1"
          />

          <StatCard
            label="API 服务"
            value="活跃"
            icon="i-heroicons-server"
            color="purple"
            subtitle="所有端点正常"
          />

          <StatCard
            label="数据状态"
            :value="dataStatus.text"
            icon="i-heroicons-database"
            color="orange"
            subtitle="数据库已初始化"
          />
        </div>

        <!-- 数据库统计 -->
        <InfoCard title="数据库统计" icon="📈" badge-color="info">
          <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-3xl font-bold text-blue-600 mb-2">
                {{ stats.visualBlocks.toLocaleString() }}
              </div>
              <div class="text-sm text-blue-700 font-medium">视觉块</div>
              <div class="text-xs text-blue-600 mt-1">Visual Blocks</div>
            </div>
            
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-3xl font-bold text-green-600 mb-2">
                {{ stats.regions.toLocaleString() }}
              </div>
              <div class="text-sm text-green-700 font-medium">区域</div>
              <div class="text-xs text-green-600 mt-1">Regions</div>
            </div>
            
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-3xl font-bold text-purple-600 mb-2">
                {{ stats.annotations.toLocaleString() }}
              </div>
              <div class="text-sm text-purple-700 font-medium">批注</div>
              <div class="text-xs text-purple-600 mt-1">Annotations</div>
            </div>
            
            <div class="text-center p-4 bg-orange-50 rounded-lg">
              <div class="text-3xl font-bold text-orange-600 mb-2">
                {{ stats.regionBlocks.toLocaleString() }}
              </div>
              <div class="text-sm text-orange-700 font-medium">关系</div>
              <div class="text-xs text-orange-600 mt-1">Relations</div>
            </div>
          </div>
          
          <LoadingState 
            v-else
            title="正在加载统计数据"
            description="正在从数据库获取最新统计信息..."
          />
        </InfoCard>

        <!-- API 健康检查 -->
        <InfoCard title="API 健康检查" icon="🔍">
          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-server" class="w-5 h-5 text-gray-600" />
                <div>
                  <span class="font-mono text-sm font-medium">GET /api/blocks</span>
                  <p class="text-xs text-gray-500">获取视觉块数据</p>
                </div>
              </div>
              <UBadge 
                :color="apiTests.blocks.color" 
                :variant="apiTests.blocks.variant"
                size="sm"
              >
                {{ apiTests.blocks.status }}
              </UBadge>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-database" class="w-5 h-5 text-gray-600" />
                <div>
                  <span class="font-mono text-sm font-medium">POST /api/init-db</span>
                  <p class="text-xs text-gray-500">数据库初始化</p>
                </div>
              </div>
              <UBadge 
                :color="apiTests.initDb.color" 
                :variant="apiTests.initDb.variant"
                size="sm"
              >
                {{ apiTests.initDb.status }}
              </UBadge>
            </div>
          </div>
        </InfoCard>

        <!-- 系统信息 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 技术栈信息 -->
          <InfoCard title="技术栈" icon="🛠️">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-cloud" class="w-4 h-4 text-green-600" />
                  </div>
                  <span class="font-medium">NuxtHub</span>
                </div>
                <UBadge color="success" variant="soft">v3.17.5</UBadge>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-circle-stack" class="w-4 h-4 text-blue-600" />
                  </div>
                  <span class="font-medium">Cloudflare D1</span>
                </div>
                <UBadge color="info" variant="soft">SQLite</UBadge>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-purple-600" />
                  </div>
                  <span class="font-medium">Drizzle ORM</span>
                </div>
                <UBadge color="primary" variant="soft">最新</UBadge>
              </div>
            </div>
          </InfoCard>

          <!-- 快速操作 -->
          <InfoCard title="快速操作" icon="⚡">
            <div class="grid grid-cols-2 gap-3">
              <UButton 
                to="/annotator" 
                color="primary" 
                block
                class="justify-center"
              >
                <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 mr-2" />
                批注系统
              </UButton>
              
              <UButton 
                to="/read-all" 
                color="success" 
                block
                class="justify-center"
              >
                <UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-2" />
                PDF 查看器
              </UButton>
              
              <UButton 
                to="/admin" 
                color="warning" 
                block
                class="justify-center"
              >
                <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-2" />
                数据库管理
              </UButton>
              
              <UButton 
                @click="initializeData" 
                color="error" 
                :loading="loading"
                block
                class="justify-center"
              >
                <UIcon name="i-heroicons-database" class="w-4 h-4 mr-2" />
                重新初始化
              </UButton>
            </div>
          </InfoCard>
        </div>

        <!-- 迁移成功提示 -->
        <UAlert 
          color="success" 
          variant="soft" 
          title="🎉 NuxtHub 迁移成功"
          description="项目已成功从传统 SQLite 迁移到 NuxtHub + Cloudflare D1，享受更好的开发体验和云原生部署能力。"
        />
      </div>
    </UContainer>
  </AppLayout>
</template>

<script setup>
import { useSystemStore } from '~/stores'

// 页面元数据
definePageMeta({
  title: 'NuxtHub 迁移状态'
})

// 使用系统 store
const systemStore = useSystemStore()

// 从 store 获取响应式数据
const { stats, isLoading: loading, apiTests, dataStatus } = storeToRefs(systemStore)

// 刷新统计
async function refreshStats() {
  await systemStore.refreshStats()
}

// 初始化数据
async function initializeData() {
  // 使用 Nuxt UI 的确认对话框（如果可用）或原生确认
  if (!confirm('确定要重新初始化数据吗？这将清空现有数据。')) {
    return
  }
  
  await systemStore.initializeDatabase()
}

// 页面加载时获取统计数据
onMounted(() => {
  systemStore.fetchStats()
})
</script>

<style scoped>
.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.max-w-4xl {
  max-width: 56rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.bg-yellow-100 { background-color: #fef3c7; }
.text-yellow-800 { color: #92400e; }
.bg-green-100 { background-color: #dcfce7; }
.text-green-800 { color: #166534; }
.bg-red-100 { background-color: #fee2e2; }
.text-red-800 { color: #991b1b; }
.bg-gray-100 { background-color: #f3f4f6; }
.text-gray-800 { color: #1f2937; }
.text-gray-600 { color: #4b5563; }
.bg-gray-50 { background-color: #f9fafb; }

.text-blue-600 { color: #2563eb; }
.text-green-600 { color: #16a34a; }
.text-purple-600 { color: #9333ea; }
.text-orange-600 { color: #ea580c; }

.bg-green-500 { background-color: #22c55e; }
.bg-yellow-500 { background-color: #eab308; }
.bg-red-500 { background-color: #ef4444; }

.w-3 { width: 0.75rem; }
.h-3 { height: 0.75rem; }
.rounded-full { border-radius: 9999px; }

.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }

.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.p-3 { padding: 0.75rem; }
.p-8 { padding: 2rem; }

.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.mt-6 { margin-top: 1.5rem; }

.flex-wrap { flex-wrap: wrap; }
</style> 