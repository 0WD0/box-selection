<template>
  <UCard :class="cardClasses">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium" :class="labelClasses">{{ label }}</p>
        <p class="text-2xl font-bold" :class="valueClasses">
          {{ formattedValue }}
        </p>
        <p v-if="subtitle" class="text-xs mt-1" :class="subtitleClasses">
          {{ subtitle }}
        </p>
      </div>
      
      <div v-if="icon" :class="iconContainerClasses">
        <UIcon :name="icon" class="w-6 h-6 text-white" />
      </div>
    </div>
    
    <!-- 趋势指示器（可选） -->
    <div v-if="trend" class="flex items-center mt-3 pt-3 border-t border-gray-100">
      <UIcon 
        :name="trendIcon" 
        :class="trendIconClasses"
        class="w-4 h-4 mr-1"
      />
      <span :class="trendTextClasses" class="text-sm font-medium">
        {{ trend.value }}{{ trend.unit }}
      </span>
      <span class="text-xs text-gray-500 ml-1">{{ trend.label }}</span>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Trend {
  value: number
  unit?: string
  label?: string
  type: 'up' | 'down' | 'neutral'
}

interface Props {
  label: string
  value: number | string
  subtitle?: string
  icon?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'
  trend?: Trend
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const colorClasses = {
  blue: {
    card: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
    label: 'text-blue-600',
    value: 'text-blue-900',
    subtitle: 'text-blue-600',
    icon: 'bg-blue-500'
  },
  green: {
    card: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
    label: 'text-green-600',
    value: 'text-green-900',
    subtitle: 'text-green-600',
    icon: 'bg-green-500'
  },
  purple: {
    card: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
    label: 'text-purple-600',
    value: 'text-purple-900',
    subtitle: 'text-purple-600',
    icon: 'bg-purple-500'
  },
  orange: {
    card: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
    label: 'text-orange-600',
    value: 'text-orange-900',
    subtitle: 'text-orange-600',
    icon: 'bg-orange-500'
  },
  red: {
    card: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
    label: 'text-red-600',
    value: 'text-red-900',
    subtitle: 'text-red-600',
    icon: 'bg-red-500'
  },
  yellow: {
    card: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
    label: 'text-yellow-600',
    value: 'text-yellow-900',
    subtitle: 'text-yellow-600',
    icon: 'bg-yellow-500'
  }
}

const cardClasses = computed(() => colorClasses[props.color].card)
const labelClasses = computed(() => colorClasses[props.color].label)
const valueClasses = computed(() => colorClasses[props.color].value)
const subtitleClasses = computed(() => colorClasses[props.color].subtitle)
const iconContainerClasses = computed(() => 
  `w-12 h-12 ${colorClasses[props.color].icon} rounded-full flex items-center justify-center`
)

const trendIcon = computed(() => {
  if (!props.trend) return ''
  switch (props.trend.type) {
    case 'up': return 'i-heroicons-arrow-trending-up'
    case 'down': return 'i-heroicons-arrow-trending-down'
    default: return 'i-heroicons-minus'
  }
})

const trendIconClasses = computed(() => {
  if (!props.trend) return ''
  switch (props.trend.type) {
    case 'up': return 'text-green-500'
    case 'down': return 'text-red-500'
    default: return 'text-gray-500'
  }
})

const trendTextClasses = computed(() => {
  if (!props.trend) return ''
  switch (props.trend.type) {
    case 'up': return 'text-green-600'
    case 'down': return 'text-red-600'
    default: return 'text-gray-600'
  }
})
</script> 