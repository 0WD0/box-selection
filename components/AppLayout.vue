<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <slot name="header" />
    
    <main class="flex-1">
      <slot />
    </main>
    
    <slot name="footer">
      <AppFooter />
    </slot>
  </div>
</template>

<script setup lang="ts">
// 统一的应用布局组件
</script> 