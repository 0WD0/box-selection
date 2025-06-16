<template>
  <div class="flex items-center gap-3">
    <UButton 
      @click="$emit('prev')" 
      :disabled="currentPage <= 1 || disabled" 
      variant="outline"
      size="sm"
    >
      <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
      <span v-if="showText">上一页</span>
    </UButton>

    <div class="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
      <UInput 
        :model-value="currentPage"
        @update:model-value="$emit('goto', $event)"
        type="number" 
        :min="1" 
        :max="totalPages" 
        :disabled="disabled"
        class="w-16 text-center"
        size="xs"
      />
      <span class="text-sm text-gray-500">/</span>
      <span class="text-sm text-gray-700 font-medium">{{ totalPages }}</span>
    </div>

    <UButton 
      @click="$emit('next')" 
      :disabled="currentPage >= totalPages || disabled" 
      variant="outline"
      size="sm"
    >
      <span v-if="showText">下一页</span>
      <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
    </UButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
  disabled?: boolean
  showText?: boolean
}

interface Emits {
  prev: []
  next: []
  goto: [page: number]
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  showText: false
})

defineEmits<Emits>()
</script> 