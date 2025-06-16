<template>
  <InfoCard title="已创建的区域" icon="📝" :badge="regions.length" badge-color="success">
    <EmptyState 
      v-if="regions.length === 0"
      icon="i-heroicons-rectangle-group"
      title="暂无区域"
      description="选择视觉块后点击“创建区域”来开始批注"
    />
    
    <div v-else class="space-y-3">
      <UCard v-for="region in regions" :key="region.id" class="border border-gray-200">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">区域 #{{ region.id }}</span>
            <UButton @click="$emit('delete-region', region.id)" color="error" variant="ghost" size="xs">
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
            </UButton>
          </div>
        </template>
        
        <div class="space-y-3">
          <UTextarea 
            :model-value="region.annotation"
            @update:model-value="$emit('update-annotation', region.id, $event)"
            placeholder="添加批注..."
            :rows="2"
          />
          <div class="text-xs text-gray-500">
            包含 {{ region.blockIds.length }} 个视觉块
          </div>
        </div>
      </UCard>
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
</script> 