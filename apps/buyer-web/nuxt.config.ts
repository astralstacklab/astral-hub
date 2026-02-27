import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vueuse/nuxt', '@vite-pwa/nuxt'],

  devtools: { enabled: true },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },

  app: {
    head: {
      title: '卡牌商城 | OMO 卡牌交易平台',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [{ name: 'description', content: 'OMO 卡牌交易平台 - 專業、安全、刺激的卡牌交易體驗' }],
    },
  },

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.cjs',
  },

  pwa: {
    manifest: {
      name: '卡牌商城',
      short_name: '卡牌商城',
      description: 'OMO 卡牌交易平台',
      theme_color: '#00F0FF',
      background_color: '#000000',
      display: 'standalone',
    },
  },

  vite: {
    resolve: {
      alias: {
        '@astral-hub/shared-types': '../../../packages/shared-types/src',
      },
    },
  },

  compatibilityDate: '2024-01-24',
})
