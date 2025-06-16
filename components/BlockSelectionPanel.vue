<template>
  <InfoCard title="选中的视觉块" icon="🎯" :badge="selectedBlocks.length" badge-color="primary">
    <div v-if="selectedBlocks.length > 0" class="space-y-2 mb-4">
      <div v-for="blockId in selectedBlocks" :key="blockId" 
           class="flex items-center justify-between p-2 bg-gray-50 rounded">
        <span class="text-sm">块 #{{ blockId }}</span>
        <UButton @click="$emit('remove-block', blockId)" color="error" variant="ghost" size="xs">
          <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
        </UButton>
      </div>
    </div>
    
    <EmptyState 
      v-else
      icon="i-heroicons-cursor-arrow-rays"
      title="暂无选中的视觉块"
      description="点击或框选 PDF 中的视觉块来开始批注"
    />
    
    <template #footer>
      <div class="flex gap-2">
        <UButton 
          @click="$emit('create-region')" 
          :disabled="selectedBlocks.length === 0" 
          color="primary"
          class="flex-1"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          创建区域
        </UButton>
        <UButton 
          @click="$emit('clear-selection')" 
          :disabled="selectedBlocks.length === 0" 
          variant="outline"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </UButton>
      </div>
    </template>
  </InfoCard>
</template>

<script setup lang="ts">
interface Props {
  selectedBlocks: number[]
}

interface Emits {
  'remove-block': [blockId: number]
  'create-region': []
  'clear-selection': []
}

defineProps<Props>()
defineEmits<Emits>()
</script> 