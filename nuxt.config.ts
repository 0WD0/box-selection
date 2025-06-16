// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxthub/core',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxtjs/tailwindcss',
    '@nuxt/ui',
    '@pinia/nuxt'
  ],
  
  // NuxtHub 配置
  hub: {
    database: true,
    workers: true,
  },

  // Nitro 配置（用于任务支持）
  nitro: {
    experimental: {
      tasks: true
    }
  }
})