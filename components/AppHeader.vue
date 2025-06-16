<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <UContainer class="py-4">
      <div class="flex items-center justify-between">
        <!-- 左侧：导航和标题 -->
        <div class="flex items-center gap-4">
          <UButton 
            v-if="showBackButton" 
            :to="backTo" 
            variant="ghost" 
            size="sm"
            class="text-gray-600 hover:text-gray-900"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
            {{ backText }}
          </UButton>
          
          <div class="flex items-center gap-3">
            <div v-if="icon" class="text-2xl">{{ icon }}</div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900">{{ title }}</h1>
              <p v-if="subtitle" class="text-sm text-gray-600">{{ subtitle }}</p>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="flex items-center gap-3">
          <slot name="actions" />
        </div>
      </div>
      
      <!-- 面包屑导航 -->
      <AppBreadcrumb v-if="breadcrumbs" :items="breadcrumbs" class="mt-2" />
    </UContainer>
  </header>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  title: string
  subtitle?: string
  icon?: string
  showBackButton?: boolean
  backTo?: string
  backText?: string
  breadcrumbs?: BreadcrumbItem[]
}

withDefaults(defineProps<Props>(), {
  backTo: '/',
  backText: '返回首页',
  showBackButton: true
})
</script> 