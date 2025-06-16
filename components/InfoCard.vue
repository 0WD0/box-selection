<template>
  <UCard class="mb-6">
    <template #header>
      <div class="flex items-center gap-2">
        <div v-if="icon" class="text-lg">{{ icon }}</div>
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <UBadge v-if="badge" :color="badgeColor">{{ badge }}</UBadge>
      </div>
    </template>
    
    <slot />
    
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  icon?: string
  badge?: string | number
  badgeColor?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
}

withDefaults(defineProps<Props>(), {
  badgeColor: 'primary'
})
</script> 