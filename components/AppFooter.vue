<template>
  <footer class="bg-gray-50 border-t border-gray-200 mt-auto">
    <UContainer class="py-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- 产品信息 -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📚 PDF 查看器系统</h3>
          <p class="text-sm text-gray-600 mb-4">
            基于 NuxtHub 构建的现代化 PDF 处理和批注平台
          </p>
          <div class="flex gap-2">
            <UBadge color="success" variant="soft" size="xs">NuxtHub</UBadge>
            <UBadge color="info" variant="soft" size="xs">Cloudflare D1</UBadge>
            <UBadge color="primary" variant="soft" size="xs">Nuxt UI</UBadge>
          </div>
        </div>

        <!-- 功能链接 -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-4">功能</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <UButton to="/read-all" variant="ghost" size="xs" class="p-0 h-auto">
                PDF 查看器
              </UButton>
            </li>
            <li>
              <UButton to="/annotator" variant="ghost" size="xs" class="p-0 h-auto">
                视觉块批注器
              </UButton>
            </li>
            <li>
              <UButton to="/admin" variant="ghost" size="xs" class="p-0 h-auto">
                系统管理
              </UButton>
            </li>
            <li>
              <UButton to="/status" variant="ghost" size="xs" class="p-0 h-auto">
                系统状态
              </UButton>
            </li>
          </ul>
        </div>

        <!-- 技术栈 -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-4">技术栈</h4>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-cloud" class="w-4 h-4 text-green-500" />
              <span>NuxtHub</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-circle-stack" class="w-4 h-4 text-blue-500" />
              <span>Cloudflare D1</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-purple-500" />
              <span>Nuxt UI</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-document" class="w-4 h-4 text-orange-500" />
              <span>PDF.js</span>
            </li>
          </ul>
        </div>

        <!-- 系统信息 -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-4">系统信息</h4>
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
              <span>系统运行正常</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-blue-500" />
              <span>{{ currentTime }}</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-server" class="w-4 h-4 text-purple-500" />
              <span>NuxtHub 部署</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="border-t border-gray-200 mt-8 pt-6 text-center">
        <p class="text-sm text-gray-500">
          © {{ currentYear }} PDF 查看器系统. 基于 NuxtHub 构建.
        </p>
      </div>
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
const currentTime = ref('')
const currentYear = new Date().getFullYear()

// 更新当前时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN')
}

// 初始化时间并设置定时器
onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
})
</script> 