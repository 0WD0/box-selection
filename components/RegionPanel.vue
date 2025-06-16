<template>
  <InfoCard title="已创建的区域" icon="📝" :badge="regions.length" badge-color="success">
    <div v-if="regions.length === 0" class="text-center py-8 text-gray-500">
      暂无区域，请先选择视觉块创建区域
    </div>
    
    <div v-else class="space-y-4">
      <div v-for="region in regions" :key="region.id" class="border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium">区域 #{{ region.id }}</h4>
          <button @click="$emit('delete-region', region.id)" class="text-red-500 hover:text-red-700">
            🗑️
          </button>
        </div>
        
        <textarea 
          :value="region.annotation || ''"
          @input="$emit('update-annotation', region.id, ($event.target as HTMLTextAreaElement).value)"
          placeholder="添加批注..."
          class="w-full p-2 border border-gray-300 rounded resize-none"
          rows="2"
        ></textarea>
        
        <div class="text-xs text-gray-500 mt-2">
          包含 {{ getBlockCount(region) }} 个视觉块
        </div>
      </div>
    </div>
  </InfoCard>
</template>

<script setup lang="ts">
interface Props {
  regions: any[]
}

interface Emits {
  'delete-region': [regionId: number]
  'update-annotation': [regionId: number, annotation: string]
}

defineProps<Props>()
defineEmits<Emits>()

const getBlockCount = (region: any) => {
  if (region.blocks && Array.isArray(region.blocks)) {
    return region.blocks.length
  }
  if (region.blockIds && Array.isArray(region.blockIds)) {
    return region.blockIds.length
  }
  return 0
}
</script> 