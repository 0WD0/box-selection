<template>
  <InfoCard title="键盘控制" icon="⌨️">
    <div class="space-y-3 text-sm">
      <div class="flex items-center gap-3">
        <div class="flex gap-1">
          <UKbd>h</UKbd><UKbd>j</UKbd><UKbd>k</UKbd><UKbd>l</UKbd>
        </div>
        <span class="text-gray-600">方向导航</span>
      </div>
      
      <div class="flex items-center gap-3">
        <UKbd>v</UKbd>
        <span class="text-gray-600">切换选择模式</span>
      </div>
      
      <div class="flex items-center gap-3">
        <UKbd>Space</UKbd>
        <span class="text-gray-600">切换当前块选择</span>
      </div>
      
      <div class="flex items-center gap-3">
        <UKbd>Esc</UKbd>
        <span class="text-gray-600">退出选择模式</span>
      </div>
      
      <div v-if="selectionMode" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div class="flex items-center gap-2 text-yellow-800">
          <UIcon name="i-heroicons-cursor-arrow-rays" class="w-4 h-4" />
          <span class="font-medium">选择模式已激活</span>
        </div>
        <p class="text-xs text-yellow-700 mt-1">使用方向键导航会自动选择视觉块</p>
      </div>
    </div>
  </InfoCard>
</template>

<script setup lang="ts">
interface Props {
  selectionMode: boolean
}

defineProps<Props>()
</script> 