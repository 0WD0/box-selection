<template>
  <div class="flex items-center gap-1">
    <UButton 
      @click="$emit('zoom-out')" 
      :disabled="disabled" 
      variant="ghost" 
      size="sm"
    >
      <UIcon name="i-heroicons-minus" class="w-4 h-4" />
    </UButton>
    
    <span class="text-sm text-gray-600 min-w-[60px] text-center">
      {{ Math.round(scale * 100) }}%
    </span>
    
    <UButton 
      @click="$emit('zoom-in')" 
      :disabled="disabled" 
      variant="ghost" 
      size="sm"
    >
      <UIcon name="i-heroicons-plus" class="w-4 h-4" />
    </UButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  scale: number
  disabled?: boolean
}

interface Emits {
  'zoom-in': []
  'zoom-out': []
}

withDefaults(defineProps<Props>(), {
  disabled: false
})

defineEmits<Emits>()
</script> 