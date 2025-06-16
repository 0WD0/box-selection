<template>
  <nav class="flex items-center space-x-2 text-sm text-gray-600 mb-4">
    <UButton 
      to="/" 
      variant="ghost" 
      size="xs" 
      class="p-1 hover:bg-gray-100"
    >
      <UIcon name="i-heroicons-home" class="w-4 h-4" />
    </UButton>
    
    <template v-for="(item, index) in items" :key="index">
      <UIcon name="i-heroicons-chevron-right" class="w-3 h-3 text-gray-400" />
      
      <UButton
        v-if="item.to && index < items.length - 1"
        :to="item.to"
        variant="ghost"
        size="xs"
        class="px-2 py-1 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      >
        {{ item.label }}
      </UButton>
      
      <span 
        v-else
        class="px-2 py-1 text-gray-900 font-medium"
      >
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  items: BreadcrumbItem[]
}

defineProps<Props>()
</script> 