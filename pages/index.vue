<template>
  <AppLayout>
    <template #header>
      <AppHeader 
        title="PDF 查看器系统" 
        icon="📚"
        subtitle="基于 NuxtHub 的现代化 PDF 处理平台"
        :show-back-button="false"
      />
    </template>

    <UContainer class="py-12">
      <div class="text-center mb-12">
        <div class="text-6xl mb-4 animate-bounce">📄</div>
        <h2 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          欢迎使用 PDF 查看器系统
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          基于 <span class="font-semibold text-green-600">NuxtHub</span> 和 
          <span class="font-semibold text-blue-600">Cloudflare D1</span> 构建的现代化 PDF 处理和批注平台
        </p>
        
        <!-- 快速开始按钮 -->
        <div class="flex justify-center gap-4 mt-8">
          <UButton to="/read-all" size="lg" color="primary" class="shadow-lg hover:shadow-xl transition-shadow">
            <UIcon name="i-heroicons-play" class="w-5 h-5 mr-2" />
            立即开始
          </UButton>
          <UButton to="/status" size="lg" variant="outline" class="shadow-lg hover:shadow-xl transition-shadow">
            <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 mr-2" />
            查看状态
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <!-- PDF 查看器 -->
        <div class="transform hover:scale-105 transition-transform duration-300">
          <InfoCard title="PDF 查看器" icon="📖" class="h-full hover:shadow-xl transition-shadow duration-300">
            <div class="space-y-3">
              <p class="text-gray-600 text-sm">
                原生 PDF.js 渲染引擎，支持缩放、翻页和覆盖层注释功能
              </p>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>高性能 PDF 渲染</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>响应式缩放控制</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>覆盖层注释系统</span>
                </div>
              </div>
            </div>
            
            <template #footer>
              <UButton to="/read-all" color="primary" block>
                <UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-2" />
                打开 PDF 查看器
              </UButton>
            </template>
          </InfoCard>
        </div>

        <!-- 视觉块批注器 -->
        <div class="transform hover:scale-105 transition-transform duration-300">
          <InfoCard title="视觉块批注器" icon="✏️" class="h-full hover:shadow-xl transition-shadow duration-300">
            <div class="space-y-3">
              <p class="text-gray-600 text-sm">
                智能视觉块识别和批注系统，支持区域选择和协作批注
              </p>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>智能块识别</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>区域选择工具</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>实时协作批注</span>
                </div>
              </div>
            </div>
            
            <template #footer>
              <UButton to="/annotator" color="success" block>
                <UIcon name="i-heroicons-pencil" class="w-4 h-4 mr-2" />
                打开批注器
              </UButton>
            </template>
          </InfoCard>
        </div>

        <!-- 系统管理 -->
        <div class="transform hover:scale-105 transition-transform duration-300">
          <InfoCard title="系统管理" icon="⚙️" class="h-full hover:shadow-xl transition-shadow duration-300">
            <div class="space-y-3">
              <p class="text-gray-600 text-sm">
                数据库管理、系统状态监控和配置管理工具
              </p>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>数据库管理</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>系统状态监控</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
                  <span>系统状态监控</span>
                </div>
              </div>
            </div>
            
            <template #footer>
              <div class="flex gap-2">
                <UButton to="/admin" color="warning" class="flex-1">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-1" />
                  管理面板
                </UButton>
                <UButton to="/status" color="info" class="flex-1">
                  <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 mr-1" />
                  系统状态
                </UButton>
              </div>
            </template>
          </InfoCard>
        </div>
      </div>

      <!-- 技术特性 -->
      <div class="transform hover:scale-105 transition-transform duration-300">
        <InfoCard title="技术架构" icon="🏗️" class="hover:shadow-xl transition-shadow duration-300">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center group">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-cloud" class="w-6 h-6 text-green-600" />
              </div>
              <h4 class="font-semibold text-gray-900 mb-2">NuxtHub</h4>
              <p class="text-sm text-gray-600">全栈 Nuxt 框架，零配置部署</p>
            </div>
            
            <div class="text-center group">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-circle-stack" class="w-6 h-6 text-blue-600" />
              </div>
              <h4 class="font-semibold text-gray-900 mb-2">Cloudflare D1</h4>
              <p class="text-sm text-gray-600">边缘数据库，全球分布</p>
            </div>
            
            <div class="text-center group">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-sparkles" class="w-6 h-6 text-purple-600" />
              </div>
              <h4 class="font-semibold text-gray-900 mb-2">Nuxt UI</h4>
              <p class="text-sm text-gray-600">现代化 UI 组件库</p>
            </div>
            
            <div class="text-center group">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-document" class="w-6 h-6 text-orange-600" />
              </div>
              <h4 class="font-semibold text-gray-900 mb-2">PDF.js</h4>
              <p class="text-sm text-gray-600">原生 PDF 渲染引擎</p>
            </div>
          </div>
        </InfoCard>
      </div>
    </UContainer>
  </AppLayout>
</template>

<script setup lang="ts">
// 设置页面标题
useHead({
  title: 'PDF 查看器 - NuxtHub 版本'
})
</script> 