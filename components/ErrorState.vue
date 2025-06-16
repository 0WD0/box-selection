<template>
  <div class="text-center py-12">
    <!-- 错误图标 -->
    <div class="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-500" />
    </div>
    
    <!-- 错误信息 -->
    <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
    <p class="text-gray-600 mb-2">{{ description }}</p>
    
    <!-- 错误详情（可选） -->
    <details v-if="error" class="mt-4 max-w-md mx-auto">
      <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
        查看错误详情
      </summary>
      <div class="mt-2 p-3 bg-gray-50 rounded-lg text-left">
        <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ error }}</pre>
      </div>
    </details>
    
    <!-- 操作按钮 -->
    <div v-if="$slots.actions" class="flex justify-center gap-3 mt-6">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  error?: string | Error
}

withDefaults(defineProps<Props>(), {
  title: '出现错误',
  description: '抱歉，发生了意外错误'
})
</script> 