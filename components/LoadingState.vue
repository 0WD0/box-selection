<template>
  <div class="flex flex-col items-center justify-center py-12">
    <div class="relative">
      <!-- 主要加载动画 -->
      <div class="w-16 h-16 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
      
      <!-- 内部脉冲动画 -->
      <div class="absolute inset-2 bg-primary-100 rounded-full animate-pulse"></div>
    </div>
    
    <!-- 加载文本 -->
    <div class="mt-6 text-center">
      <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
      <p class="text-sm text-gray-600">{{ description }}</p>
    </div>
    
    <!-- 进度条（可选） -->
    <div v-if="showProgress" class="w-64 mt-4">
      <div class="bg-gray-200 rounded-full h-2">
        <div 
          class="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
      <p class="text-xs text-gray-500 mt-1 text-center">{{ progress }}%</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  showProgress?: boolean
  progress?: number
}

withDefaults(defineProps<Props>(), {
  title: '正在加载',
  description: '请稍候...',
  showProgress: false,
  progress: 0
})
</script> 