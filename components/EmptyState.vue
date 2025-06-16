<template>
  <div class="text-center py-12">
    <!-- 图标 -->
    <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <UIcon :name="icon" class="w-12 h-12 text-gray-400" />
    </div>
    
    <!-- 标题和描述 -->
    <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
    <p class="text-gray-600 mb-6 max-w-sm mx-auto">{{ description }}</p>
    
    <!-- 操作按钮 -->
    <div v-if="$slots.actions" class="flex justify-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  title: string
  description: string
}

withDefaults(defineProps<Props>(), {
  icon: 'i-heroicons-inbox'
})
</script> 