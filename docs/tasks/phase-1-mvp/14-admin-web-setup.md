# Task 14: 後台管理基礎建立

## 概述

建立後台管理 Nuxt 3 專案，整合 JWT 認證、側邊欄導航、權限管理基礎，並設定管理介面 UI 樣式。

## 依賴

- Task 02: Shared Packages（使用 shared-types）
- Task 04: API Foundation（API server 已建立）

---

## 一、Nuxt 3 專案初始化

### 1.1 建立專案

```bash
# 在專案根目錄
mkdir -p apps/admin-web
cd apps/admin-web
pnpm init
pnpm add -D nuxt@latest
```

### 1.2 package.json

```json
{
  "name": "@card-erp/admin-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev --port 3002",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "lint": "eslint . --ext .vue,.js,.ts",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "@card-erp/shared-types": "workspace:*",
    "@pinia/nuxt": "^0.5.1",
    "nuxt": "^3.13.0",
    "pinia": "^2.1.7",
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "@vueuse/core": "^10.9.0",
    "@vueuse/nuxt": "^10.9.0",
    "jwt-decode": "^4.0.0"
  },
  "devDependencies": {
    "@nuxt/devtools": "latest",
    "@nuxtjs/tailwindcss": "^6.11.4",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "@types/node": "^20.11.16"
  }
}
```

---

## 二、Nuxt 配置

### 2.1 nuxt.config.ts

```typescript
// apps/admin-web/nuxt.config.ts

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  // TypeScript 嚴格模式
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Runtime config
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      appName: '卡牌商城後台',
    },
  },

  // App config
  app: {
    head: {
      title: '卡牌商城後台管理系統',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'robots', content: 'noindex, nofollow' }, // 禁止搜尋引擎索引
      ],
    },
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // Tailwind CSS
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js',
  },

  // Vite 設定
  vite: {
    resolve: {
      alias: {
        '@card-erp/shared-types': '../../../packages/shared-types/src',
      },
    },
  },

  // 相容性日期
  compatibilityDate: '2024-01-24',
})
```

### 2.2 tsconfig.json

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true
  }
}
```

---

## 三、TailwindCSS 配置

### 3.1 tailwind.config.js

```javascript
// apps/admin-web/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        sidebar: {
          DEFAULT: '#1e293b',
          hover: '#334155',
        },
      },
    },
  },
  plugins: [],
}
```

### 3.2 CSS 檔案

```css
/* apps/admin-web/assets/css/tailwind.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-100 text-gray-900;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
  }

  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400;
  }

  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700 active:bg-red-800;
  }

  .card {
    @apply bg-white rounded-lg shadow-sm p-6;
  }

  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }

  .table-responsive {
    @apply overflow-x-auto;
  }

  .table {
    @apply min-w-full divide-y divide-gray-200;
  }

  .table thead {
    @apply bg-gray-50;
  }

  .table th {
    @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  }

  .table td {
    @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
  }

  .table tbody {
    @apply bg-white divide-y divide-gray-200;
  }
}
```

```css
/* apps/admin-web/assets/css/main.css */

@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
```

---

## 四、認證系統

### 4.1 Auth Store

```typescript
// apps/admin-web/stores/auth.ts

import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

interface Admin {
  id: string
  email: string
  name: string
  role: string
}

interface JWTPayload {
  id: string
  email: string
  name: string
  role: string
  exp: number
}

interface AuthState {
  token: string | null
  admin: Admin | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    admin: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => {
      if (!state.token) return false

      try {
        const decoded = jwtDecode<JWTPayload>(state.token)
        return decoded.exp * 1000 > Date.now()
      } catch {
        return false
      }
    },

    isAdmin: (state): boolean => {
      return state.admin?.role === 'ADMIN'
    },
  },

  actions: {
    setToken(token: string) {
      this.token = token

      try {
        const decoded = jwtDecode<JWTPayload>(token)
        this.admin = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        }

        // 儲存到 localStorage
        if (process.client) {
          localStorage.setItem('admin_token', token)
        }
      } catch (error) {
        console.error('Invalid token:', error)
        this.logout()
      }
    },

    logout() {
      this.token = null
      this.admin = null

      if (process.client) {
        localStorage.removeItem('admin_token')
      }
    },

    initAuth() {
      if (process.client) {
        const token = localStorage.getItem('admin_token')
        if (token) {
          this.setToken(token)
        }
      }
    },
  },
})
```

### 4.2 Auth Plugin

```typescript
// apps/admin-web/plugins/auth.client.ts

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  authStore.initAuth()
})
```

### 4.3 Auth Middleware

```typescript
// apps/admin-web/middleware/auth.ts

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // 登入頁面不需要認證
  if (to.path === '/login') {
    // 如果已登入，重定向到首頁
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  // 其他頁面需要認證
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

---

## 五、API Client

### 5.1 API 工具函式

```typescript
// apps/admin-web/utils/api.ts

import type { FetchOptions } from 'ofetch'

export const useApiClient = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const baseURL = config.public.apiBase as string

  const apiFetch = async <T>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
    }

    // 加入 JWT token
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }

    try {
      const response = await $fetch<T>(endpoint, {
        baseURL,
        ...options,
        headers,
      })
      return response
    } catch (error) {
      // Token 過期，登出
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
        authStore.logout()
        navigateTo('/login')
      }
      throw error
    }
  }

  return { apiFetch }
}

export interface ApiError {
  statusCode: number
  message: string
  errors?: Record<string, string[]>
}

export const handleApiError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as { data?: ApiError }
    if (apiError.data?.message) {
      return apiError.data.message
    }
  }
  return '發生未知錯誤，請稍後再試'
}
```

### 5.2 Auth API

```typescript
// apps/admin-web/composables/useAuthApi.ts

interface LoginInput {
  email: string
  password: string
}

interface LoginOutput {
  token: string
  admin: {
    id: string
    email: string
    name: string
    role: string
  }
}

export const useAuthApi = () => {
  const { apiFetch } = useApiClient()

  return {
    login: async (data: LoginInput): Promise<LoginOutput> => {
      return await apiFetch<LoginOutput>('/api/auth/login', {
        method: 'POST',
        body: data,
      })
    },
  }
}
```

---

## 六、Layout

### 6.1 Default Layout（後台主 Layout）

```vue
<!-- apps/admin-web/layouts/default.vue -->

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 側邊欄 -->
    <aside
      class="fixed inset-y-0 left-0 w-64 bg-sidebar text-white transform transition-transform duration-300 ease-in-out z-30"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-center border-b border-sidebar-hover">
        <h1 class="text-xl font-bold">卡牌商城後台</h1>
      </div>

      <!-- 導航選單 -->
      <nav class="p-4 space-y-2">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
          :class="isActive(item.path) ? 'bg-primary-600' : 'hover:bg-sidebar-hover'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- 登出 -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-hover">
        <button
          class="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-sidebar-hover w-full transition-colors"
          @click="handleLogout"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>登出</span>
        </button>
      </div>
    </aside>

    <!-- 主內容區 -->
    <div class="md:ml-64">
      <!-- 頂部欄 -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <!-- 手機版選單按鈕 -->
        <button
          class="md:hidden text-gray-600"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- 麵包屑 -->
        <div class="hidden md:block">
          <slot name="breadcrumb" />
        </div>

        <!-- 管理員資訊 -->
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900">{{ authStore.admin?.name }}</p>
            <p class="text-xs text-gray-500">{{ authStore.admin?.email }}</p>
          </div>
          <div class="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
            {{ getInitials(authStore.admin?.name || '') }}
          </div>
        </div>
      </header>

      <!-- 頁面內容 -->
      <main class="p-6">
        <slot />
      </main>
    </div>

    <!-- 手機版遮罩 -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
      @click="sidebarOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)

// 動態導入 SVG 圖標組件
const IconDashboard = defineAsyncComponent(() => import('~/components/icons/IconDashboard.vue'))
const IconProducts = defineAsyncComponent(() => import('~/components/icons/IconProducts.vue'))
const IconOrders = defineAsyncComponent(() => import('~/components/icons/IconOrders.vue'))
const IconAnalytics = defineAsyncComponent(() => import('~/components/icons/IconAnalytics.vue'))

const menuItems = [
  { path: '/', label: '儀表板', icon: IconDashboard },
  { path: '/products', label: '商品管理', icon: IconProducts },
  { path: '/orders', label: '訂單管理', icon: IconOrders },
  { path: '/analytics', label: '報表分析', icon: IconAnalytics },
]

const isActive = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase()
}

const handleLogout = (): void => {
  if (confirm('確定要登出嗎？')) {
    authStore.logout()
    router.push('/login')
  }
}
</script>
```

### 6.2 簡單圖標組件

```vue
<!-- apps/admin-web/components/icons/IconDashboard.vue -->
<template>
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
</template>
```

```vue
<!-- apps/admin-web/components/icons/IconProducts.vue -->
<template>
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
</template>
```

```vue
<!-- apps/admin-web/components/icons/IconOrders.vue -->
<template>
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
</template>
```

```vue
<!-- apps/admin-web/components/icons/IconAnalytics.vue -->
<template>
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
</template>
```

---

## 七、登入頁面

### 7.1 Login Page

```vue
<!-- apps/admin-web/pages/login.vue -->

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <div class="card">
        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">卡牌商城後台</h1>
          <p class="text-sm text-gray-600 mt-2">管理系統登入</p>
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
              <input
                v-model="formData.email"
                type="email"
                class="input"
                placeholder="admin@example.com"
                required
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">密碼</label>
              <input
                v-model="formData.password"
                type="password"
                class="input"
                placeholder="請輸入密碼"
                required
              >
            </div>
          </div>

          <ErrorMessage v-if="error" :message="error" class="mt-4" />

          <button
            type="submit"
            class="btn btn-primary w-full mt-6 py-3"
            :disabled="loading"
          >
            {{ loading ? '登入中...' : '登入' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const authApi = useAuthApi()
const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
  email: '',
  password: '',
})

const loading = ref(false)
const error = ref('')

const handleLogin = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    const response = await authApi.login(formData.value)
    authStore.setToken(response.token)
    router.push('/')
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

// SEO
useHead({
  title: '登入 | 卡牌商城後台',
})
</script>
```

---

## 八、儀表板頁面

### 8.1 Dashboard Page

```vue
<!-- apps/admin-web/pages/index.vue -->

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">儀表板</h1>

    <!-- 統計卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="總營收"
        :value="`NT$ ${formatNumber(12345)}`"
        icon="💰"
        color="blue"
      />
      <StatsCard
        title="總訂單"
        :value="formatNumber(234)"
        icon="📦"
        color="green"
      />
      <StatsCard
        title="總商品"
        :value="formatNumber(567)"
        icon="🎴"
        color="purple"
      />
      <StatsCard
        title="活躍賣家"
        :value="formatNumber(12)"
        icon="👥"
        color="orange"
      />
    </div>

    <!-- 快速操作 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h2 class="font-bold text-xl mb-4">快速操作</h2>
        <div class="space-y-3">
          <NuxtLink to="/products/new" class="btn btn-primary w-full">
            新增商品
          </NuxtLink>
          <NuxtLink to="/orders" class="btn btn-secondary w-full">
            查看訂單
          </NuxtLink>
          <NuxtLink to="/analytics" class="btn btn-secondary w-full">
            查看報表
          </NuxtLink>
        </div>
      </div>

      <div class="card">
        <h2 class="font-bold text-xl mb-4">系統資訊</h2>
        <dl class="space-y-3">
          <div class="flex justify-between">
            <dt class="text-gray-600">系統版本</dt>
            <dd class="font-medium">v1.0.0</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600">最後登入</dt>
            <dd class="font-medium">{{ new Date().toLocaleString('zh-TW') }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600">管理員身份</dt>
            <dd class="font-medium">{{ authStore.admin?.role }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const authStore = useAuthStore()

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-TW')
}

// SEO
useHead({
  title: '儀表板 | 卡牌商城後台',
})
</script>
```

### 8.2 StatsCard 組件

```vue
<!-- apps/admin-web/components/StatsCard.vue -->

<template>
  <div class="card">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 mb-1">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
      </div>
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        :class="bgColorClass"
      >
        {{ icon }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}

const props = defineProps<Props>()

const bgColorClass = computed(() => {
  const colors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  }
  return colors[props.color]
})
</script>
```

---

## 九、共用元件

### 9.1 LoadingSpinner

```vue
<!-- apps/admin-web/components/LoadingSpinner.vue -->

<template>
  <div class="flex justify-center items-center" :class="containerClass">
    <div
      class="animate-spin rounded-full border-t-2 border-b-2 border-primary-600"
      :class="sizeClass"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  containerClass: '',
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  return sizes[props.size]
})
</script>
```

### 9.2 ErrorMessage

```vue
<!-- apps/admin-web/components/ErrorMessage.vue -->

<template>
  <div v-if="message" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md" role="alert">
    <div class="flex items-center">
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <span>{{ message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string
}

defineProps<Props>()
</script>
```

---

## 十、環境變數

### 10.1 .env

```bash
# apps/admin-web/.env

NUXT_PUBLIC_API_BASE=http://localhost:3001
```

### 10.2 .env.production

```bash
# apps/admin-web/.env.production

NUXT_PUBLIC_API_BASE=https://api.card-erp.com
```

---

## 十一、專案結構

```
apps/admin-web/
├── assets/
│   └── css/
│       ├── main.css
│       └── tailwind.css
├── components/
│   ├── icons/
│   │   ├── IconDashboard.vue
│   │   ├── IconProducts.vue
│   │   ├── IconOrders.vue
│   │   └── IconAnalytics.vue
│   ├── LoadingSpinner.vue
│   ├── ErrorMessage.vue
│   └── StatsCard.vue
├── composables/
│   └── useAuthApi.ts
├── layouts/
│   └── default.vue
├── middleware/
│   └── auth.ts
├── pages/
│   ├── index.vue
│   └── login.vue
├── plugins/
│   └── auth.client.ts
├── stores/
│   └── auth.ts
├── utils/
│   └── api.ts
├── .env
├── .gitignore
├── nuxt.config.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 十二、開發腳本

```bash
# 安裝依賴
cd apps/admin-web
pnpm install

# 開發模式（port 3002）
pnpm dev

# 類型檢查
pnpm typecheck

# 建置
pnpm build

# 預覽建置結果
pnpm preview
```

---

## 十三、驗收標準

- [ ] Nuxt 3 專案正常啟動（`pnpm dev` on port 3002）
- [ ] TailwindCSS 樣式正常載入
- [ ] TypeScript 嚴格模式開啟，無型別錯誤
- [ ] 登入頁面正常顯示與運作
- [ ] JWT 認證機制正常運作
- [ ] Auth middleware 正確攔截未登入請求
- [ ] 側邊欄導航正常運作（響應式設計）
- [ ] 儀表板頁面正常顯示
- [ ] API Client 正確帶入 JWT token
- [ ] 無使用 `any` 型別（除單元測試外）

---

## 十四、注意事項

1. **認證安全**：
   - JWT token 儲存於 localStorage
   - Token 過期自動登出
   - API 請求自動帶入 Authorization header
   - 401 錯誤自動重定向至登入頁

2. **權限管理**：
   - 目前僅實作基礎認證
   - Phase 2 會加入細緻權限控制（RBAC）
   - 預留 role 欄位用於未來擴充

3. **響應式設計**：
   - 側邊欄在手機版可收合
   - 手機版顯示遮罩與漢堡選單
   - 平板/桌面版固定側邊欄

4. **SEO**：
   - 後台加入 `noindex, nofollow` meta tag
   - 防止搜尋引擎索引後台頁面

5. **開發體驗**：
   - 使用 port 3002 避免與前台衝突
   - 與前台共用 shared-types
   - 統一的 API client 架構

---

## 十五、後續任務

- **Task 15**: Admin Web Products（商品管理 CRUD）
- **Task 16**: Admin Web Orders（訂單管理）
- **Task 17**: Admin Web Analytics（報表儀表板）
- **Phase 2**: 細緻權限管理（角色、權限、操作日誌）
