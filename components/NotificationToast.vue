<template>
  <UNotification
    :title="title"
    :description="description"
    :icon="iconName"
    :color="color"
    :timeout="timeout"
    :actions="actions"
    @close="$emit('close')"
  />
</template>

<script setup lang="ts">
interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  timeout?: number
  actions?: Array<{
    label: string
    click: () => void
  }>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  timeout: 5000
})

const emit = defineEmits<{
  close: []
}>()

const iconMap = {
  success: 'i-heroicons-check-circle',
  error: 'i-heroicons-x-circle',
  warning: 'i-heroicons-exclamation-triangle',
  info: 'i-heroicons-information-circle'
}

const colorMap = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue'
}

const iconName = computed(() => iconMap[props.type])
const color = computed(() => colorMap[props.type])
</script> 