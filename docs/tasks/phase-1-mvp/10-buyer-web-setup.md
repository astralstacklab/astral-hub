# Task 10: 買家前台基礎建立

## 概述

建立買家前台 Nuxt 3 專案，整合 TailwindCSS、Pinia、PWA，並設定基礎路由與 API 整合。

## 依賴

- Task 02: Shared Packages（使用 shared-types）
- Task 04: API Foundation（API server 已建立）

---

## 一、Nuxt 3 專案初始化

### 1.1 建立專案

```bash
# 在專案根目錄
pnpm create nuxt-app apps/buyer-web

# 或手動建立
mkdir -p apps/buyer-web
cd apps/buyer-web
pnpm init
pnpm add -D nuxt@latest
```

### 1.2 package.json

```json
{
  "name": "@astral-hub/buyer-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "lint": "eslint . --ext .vue,.js,.ts",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "@astral-hub/shared-types": "workspace:*",
    "@pinia/nuxt": "^0.5.1",
    "nuxt": "^3.13.0",
    "pinia": "^2.1.7",
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "@vueuse/core": "^10.9.0",
    "@vueuse/nuxt": "^10.9.0"
  },
  "devDependencies": {
    "@nuxt/devtools": "latest",
    "@nuxtjs/tailwindcss": "^6.11.4",
    "@vite-pwa/nuxt": "^0.5.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "@types/node": "^20.11.16",
    "sass": "^1.70.0"
  }
}
```

---

## 二、Nuxt 配置

### 2.1 nuxt.config.ts

```typescript
// apps/buyer-web/nuxt.config.ts

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vueuse/nuxt', '@vite-pwa/nuxt'],

  // TypeScript 嚴格模式
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Runtime config
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      appName: '卡牌商城',
      appDescription: 'OMO 卡牌交易平台',
    },
  },

  // App config
  app: {
    head: {
      title: '卡牌商城 | OMO 卡牌交易平台',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        {
          name: 'description',
          content: 'OMO 卡牌交易平台 - 寶可夢、海賊王、遊戲王卡牌線上線下交易',
        },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // Tailwind CSS
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js',
  },

  // PWA
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '卡牌商城',
      short_name: '卡牌商城',
      description: 'OMO 卡牌交易平台',
      theme_color: '#4f46e5',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },

  // Vite 設定
  vite: {
    resolve: {
      alias: {
        '@astral-hub/shared-types': '../../../packages/shared-types/src',
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
// apps/buyer-web/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
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
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 3.2 CSS 檔案

```css
/* apps/buyer-web/assets/css/tailwind.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
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

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }

  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
}
```

```css
/* apps/buyer-web/assets/css/main.css */

@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
```

---

## 四、API Client

### 4.1 API 工具函式

```typescript
// apps/buyer-web/utils/api.ts

import type { FetchOptions } from 'ofetch'

/**
 * API Client 基礎設定
 */
export const useApiClient = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  /**
   * 通用 API 請求函式
   */
  const apiFetch = async <T>(endpoint: string, options?: FetchOptions): Promise<T> => {
    try {
      const response = await $fetch<T>(endpoint, {
        baseURL,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })
      return response
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  return {
    apiFetch,
  }
}

/**
 * API 錯誤處理
 */
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

### 4.2 Composables

```typescript
// apps/buyer-web/composables/useApi.ts

import type {
  QueryProductsInput,
  ProductListOutput,
  ProductDetailOutput,
  QueryAuctionsInput,
  AuctionListOutput,
  AuctionDetailOutput,
} from '@astral-hub/shared-types'

/**
 * API Composables
 */
export const useApi = () => {
  const { apiFetch } = useApiClient()

  return {
    // 商品 API
    products: {
      list: (query: QueryProductsInput) =>
        apiFetch<ProductListOutput>('/api/products', {
          method: 'GET',
          query: query as Record<string, string | number>,
        }),

      detail: (id: string) =>
        apiFetch<ProductDetailOutput>(`/api/products/${id}`, {
          method: 'GET',
        }),
    },

    // 競標 API
    auctions: {
      list: (query: QueryAuctionsInput) =>
        apiFetch<AuctionListOutput>('/api/auctions', {
          method: 'GET',
          query: query as Record<string, string | number>,
        }),

      detail: (id: string) =>
        apiFetch<AuctionDetailOutput>(`/api/auctions/${id}`, {
          method: 'GET',
        }),
    },
  }
}
```

---

## 五、Pinia Store

### 5.1 類型定義

```typescript
// apps/buyer-web/types/store.ts

import type { ProductType, ProductStatus } from '@astral-hub/shared-types'

export interface Product {
  id: string
  type: ProductType
  category: string
  name: string
  sellingPrice: string
  status: ProductStatus
  images: string[]
  createdAt: string
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

export interface User {
  id: string
  email: string
  name: string
  phone: string
}
```

### 5.2 User Store

```typescript
// apps/buyer-web/stores/user.ts

import { defineStore } from 'pinia'
import type { User } from '~/types/store'

interface UserState {
  user: User | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isAuthenticated: false,
  }),

  actions: {
    setUser(user: User) {
      this.user = user
      this.isAuthenticated = true
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
    },
  },
})
```

### 5.3 Cart Store

```typescript
// apps/buyer-web/stores/cart.ts

import { defineStore } from 'pinia'
import type { CartItem, Product } from '~/types/store'

interface CartState {
  items: CartItem[]
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
  }),

  getters: {
    totalItems: (state): number => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    totalAmount: (state): number => {
      return state.items.reduce(
        (sum, item) => sum + parseFloat(item.product.sellingPrice) * item.quantity,
        0
      )
    },
  },

  actions: {
    addItem(product: Product) {
      const existingItem = this.items.find((item) => item.productId === product.id)

      if (existingItem) {
        existingItem.quantity += 1
      } else {
        this.items.push({
          productId: product.id,
          product,
          quantity: 1,
        })
      }
    },

    removeItem(productId: string) {
      this.items = this.items.filter((item) => item.productId !== productId)
    },

    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find((item) => item.productId === productId)
      if (item) {
        item.quantity = quantity
      }
    },

    clearCart() {
      this.items = []
    },
  },

  persist: {
    storage: persistedState.localStorage,
  },
})
```

---

## 六、Layout 與 Pages

### 6.1 Default Layout

```vue
<!-- apps/buyer-web/layouts/default.vue -->

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="text-2xl font-bold text-primary-600"> 卡牌商城 </NuxtLink>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center space-x-8">
            <NuxtLink to="/products" class="text-gray-700 hover:text-primary-600">
              商品列表
            </NuxtLink>
            <NuxtLink to="/auctions" class="text-gray-700 hover:text-primary-600">
              競標專區
            </NuxtLink>
          </nav>

          <!-- Cart & User -->
          <div class="flex items-center space-x-4">
            <NuxtLink to="/cart" class="relative">
              <svg
                class="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span
                v-if="cartStore.totalItems > 0"
                class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                {{ cartStore.totalItems }}
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-12">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <p>&copy; 2026 卡牌商城. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const cartStore = useCartStore()
</script>
```

### 6.2 首頁

```vue
<!-- apps/buyer-web/pages/index.vue -->

<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-5xl font-bold mb-4">歡迎來到卡牌商城</h1>
        <p class="text-xl mb-8">收藏級卡牌交易平台 - 線上線下無縫整合</p>
        <div class="flex justify-center space-x-4">
          <NuxtLink
            to="/products"
            class="btn btn-primary bg-white text-primary-600 hover:bg-gray-100"
          >
            瀏覽商品
          </NuxtLink>
          <NuxtLink
            to="/auctions"
            class="btn border-2 border-white text-white hover:bg-white hover:text-primary-600"
          >
            競標專區
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">平台特色</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="card text-center">
            <div class="text-4xl mb-4">🛒</div>
            <h3 class="text-xl font-bold mb-2">線上購物</h3>
            <p class="text-gray-600">24/7 隨時下單，快速到貨</p>
          </div>
          <div class="card text-center">
            <div class="text-4xl mb-4">⚡</div>
            <h3 class="text-xl font-bold mb-2">即時競標</h3>
            <p class="text-gray-600">熱門卡牌競標，出價即時更新</p>
          </div>
          <div class="card text-center">
            <div class="text-4xl mb-4">🏪</div>
            <h3 class="text-xl font-bold mb-2">實體門市</h3>
            <p class="text-gray-600">線上訂購，門市取貨</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '卡牌商城 | OMO 卡牌交易平台',
  meta: [
    { name: 'description', content: 'OMO 卡牌交易平台 - 寶可夢、海賊王、遊戲王卡牌線上線下交易' },
  ],
})
</script>
```

---

## 七、共用元件

### 7.1 Loading Spinner

```vue
<!-- apps/buyer-web/components/LoadingSpinner.vue -->

<template>
  <div class="flex justify-center items-center" :class="containerClass">
    <div class="animate-spin rounded-full border-t-2 border-b-2" :class="[sizeClass, colorClass]" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white'
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
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

const colorClass = computed(() => {
  const colors = {
    primary: 'border-primary-600',
    white: 'border-white',
  }
  return colors[props.color]
})
</script>
```

### 7.2 Error Message

```vue
<!-- apps/buyer-web/components/ErrorMessage.vue -->

<template>
  <div
    v-if="message"
    class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md"
    role="alert"
  >
    <div class="flex items-center">
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
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

## 八、環境變數

### 8.1 .env

```bash
# apps/buyer-web/.env

NUXT_PUBLIC_API_BASE=http://localhost:3001
```

### 8.2 .env.production

```bash
# apps/buyer-web/.env.production

NUXT_PUBLIC_API_BASE=https://api.astral-hub.com
```

---

## 九、專案結構

```
apps/buyer-web/
├── assets/
│   └── css/
│       ├── main.css
│       └── tailwind.css
├── components/
│   ├── LoadingSpinner.vue
│   └── ErrorMessage.vue
├── composables/
│   └── useApi.ts
├── layouts/
│   └── default.vue
├── pages/
│   └── index.vue
├── public/
│   ├── favicon.ico
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── stores/
│   ├── user.ts
│   └── cart.ts
├── types/
│   └── store.ts
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

## 十、開發腳本

```bash
# 安裝依賴
cd apps/buyer-web
pnpm install

# 開發模式
pnpm dev

# 類型檢查
pnpm typecheck

# 建置
pnpm build

# 預覽建置結果
pnpm preview
```

---

## 十一、驗收標準

- [x] Nuxt 3 專案正常啟動（`pnpm dev`）
- [x] TailwindCSS 樣式正常載入
- [x] TypeScript 嚴格模式開啟，無型別錯誤
- [x] Pinia stores 正常運作（user, cart）
- [x] API client 可正常呼叫後端 API
- [x] Layout 與首頁正常顯示
- [x] PWA manifest 正確配置
- [x] 響應式設計在手機/平板/桌面正常顯示
- [x] 無使用 `any` 型別（除單元測試外）
- [x] 共用元件（LoadingSpinner, ErrorMessage）可正常使用

---

## 十二、注意事項

1. **TypeScript 嚴格模式**：
   - 所有組件與函式必須明確定義型別
   - 避免使用 `any`，改用具體型別或 `unknown`
   - Props 與 Emits 必須使用 TypeScript 定義

2. **SEO 優化**：
   - 每個頁面使用 `useHead()` 設定 meta tags
   - 確保 SSR 模式下正確渲染
   - 使用語義化 HTML 標籤

3. **效能優化**：
   - 使用 Nuxt 3 auto-imports 減少 bundle 大小
   - 圖片使用 `<NuxtImg>` 組件自動優化
   - 路由使用 lazy loading

4. **狀態管理**：
   - Cart store 使用 localStorage 持久化
   - User store 整合 JWT token（Task 12）
   - 避免全域狀態污染，使用 composables 封裝邏輯

5. **API 整合**：
   - 使用 `$fetch` 與 `ofetch` 統一 API 請求
   - 錯誤處理統一使用 `handleApiError`
   - 所有 API 請求加上型別定義（來自 shared-types）

---

## 十三、後續任務

- **Task 11**: Buyer Web Products（商品列表與詳情頁）
- **Task 12**: Buyer Web Auctions（競標頁面）
- **Task 13**: Buyer Web Cart（購物車與結帳）
