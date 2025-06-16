<template>
  <div class="annotator-page">
    <ClientOnly>
      <VisualBlockAnnotator />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// 设置页面标题
useHead({
  title: '视觉块批注系统'
})
</script>

<style scoped>
/* 确保annotator页面全屏显示 */
.annotator-page {
  height: 100vh;
  overflow: hidden;
}
</style>

<style>
/* 重置页面样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style> 