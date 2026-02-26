# Task 18: 門市 POS 系統

## 概述

建立門市 POS（Point of Sale）系統，提供商品掃描、快速結帳、現金收款、訂單列印等功能，優化觸控操作體驗。

## 依賴

- Task 05: Products API（商品 API 已建立）
- Task 07: Orders API（訂單 API 已建立）
- Task 14: Admin Web Setup（可參考後台架構）

---

## 一、Nuxt 3 專案初始化

### 1.1 建立專案

```bash
# 在專案根目錄
mkdir -p apps/pos-web
cd apps/pos-web
pnpm init
pnpm add -D nuxt@latest
```

### 1.2 package.json

```json
{
  "name": "@astral-hub/pos-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev --port 3003",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "@astral-hub/shared-types": "workspace:*",
    "@pinia/nuxt": "^0.5.1",
    "nuxt": "^3.13.0",
    "pinia": "^2.1.7",
    "vue": "^3.4.0",
    "@vueuse/core": "^10.9.0",
    "@vueuse/nuxt": "^10.9.0",
    "@zxing/library": "^0.20.0"
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
// apps/pos-web/nuxt.config.ts

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      appName: '卡牌商城 POS',
    },
  },

  app: {
    head: {
      title: 'POS 系統 | 卡牌商城',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, user-scalable=no',
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js',
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
```

### 2.2 tsconfig.json

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## 三、TailwindCSS 配置（大字體設計）

### 3.1 tailwind.config.js

```javascript
// apps/pos-web/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      fontSize: {
        'pos-xl': '1.5rem',
        'pos-2xl': '2rem',
        'pos-3xl': '2.5rem',
        'pos-4xl': '3rem',
      },
    },
  },
  plugins: [],
}
```

### 3.2 CSS 檔案

```css
/* apps/pos-web/assets/css/tailwind.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-100 text-gray-900;
  }

  /* 觸控友善設計 */
  button, a, input, select {
    @apply select-none;
  }
}

@layer components {
  .btn {
    @apply px-6 py-4 rounded-lg font-bold text-xl transition-colors duration-200 active:scale-95;
  }

  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700;
  }

  .btn-secondary {
    @apply bg-gray-300 text-gray-900 hover:bg-gray-400;
  }

  .btn-success {
    @apply bg-green-600 text-white hover:bg-green-700;
  }

  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700;
  }

  .input-pos {
    @apply w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }

  .numpad-btn {
    @apply w-full aspect-square flex items-center justify-center text-pos-3xl font-bold bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100;
  }
}
```

```css
/* apps/pos-web/assets/css/main.css */

@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap');

/* 禁用選取與長按選單（觸控裝置） */
* {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 允許 input 選取 */
input, textarea {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}
```

---

## 四、Cart Store（POS 專用）

### 4.1 POS Cart Store

```typescript
// apps/pos-web/stores/cart.ts

import { defineStore } from 'pinia'
import type { ProductDetailOutput } from '@astral-hub/shared-types'

export interface CartItem {
  productId: string
  product: ProductDetailOutput
  quantity: number
}

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

    isEmpty: (state): boolean => {
      return state.items.length === 0
    },
  },

  actions: {
    addItem(product: ProductDetailOutput, quantity = 1) {
      const existingItem = this.items.find(item => item.productId === product.id)

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.items.push({
          productId: product.id,
          product,
          quantity,
        })
      }
    },

    removeItem(productId: string) {
      this.items = this.items.filter(item => item.productId !== productId)
    },

    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find(item => item.productId === productId)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(productId)
        } else {
          item.quantity = quantity
        }
      }
    },

    clearCart() {
      this.items = []
    },
  },
})
```

---

## 五、主要頁面

### 5.1 POS 主頁面

```vue
<!-- apps/pos-web/pages/index.vue -->

<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
      <!-- 左側：購物車 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 標題列 -->
        <div class="card">
          <div class="flex items-center justify-between">
            <h1 class="text-pos-3xl font-bold">POS 收銀系統</h1>
            <div class="text-right">
              <p class="text-sm text-gray-600">{{ currentDateTime }}</p>
              <p class="text-lg font-bold">收銀員：{{ cashierName }}</p>
            </div>
          </div>
        </div>

        <!-- 掃描/搜尋商品 -->
        <div class="card">
          <div class="space-y-3">
            <button
              class="btn btn-primary w-full"
              @click="openScanner"
            >
              📷 掃描 QR Code
            </button>
            <div class="relative">
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                class="input-pos"
                placeholder="輸入商品 ID 或名稱搜尋..."
                @keyup.enter="handleSearch"
              >
              <button
                class="absolute right-2 top-1/2 -translate-y-1/2 btn btn-secondary"
                @click="handleSearch"
              >
                搜尋
              </button>
            </div>
          </div>
        </div>

        <!-- 購物車項目 -->
        <div class="card">
          <h2 class="text-pos-2xl font-bold mb-4">購物車</h2>

          <div v-if="!cartStore.isEmpty" class="space-y-3">
            <div
              v-for="item in cartStore.items"
              :key="item.productId"
              class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <h3 class="text-xl font-bold">{{ item.product.name }}</h3>
                <p class="text-lg text-gray-600">NT$ {{ formatPrice(item.product.sellingPrice) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  class="w-12 h-12 bg-gray-300 rounded-lg text-2xl font-bold"
                  @click="cartStore.updateQuantity(item.productId, item.quantity - 1)"
                >
                  -
                </button>
                <span class="text-pos-2xl font-bold w-12 text-center">{{ item.quantity }}</span>
                <button
                  class="w-12 h-12 bg-gray-300 rounded-lg text-2xl font-bold"
                  @click="cartStore.updateQuantity(item.productId, item.quantity + 1)"
                >
                  +
                </button>
              </div>
              <div class="text-right">
                <p class="text-pos-xl font-bold">
                  NT$ {{ formatPrice((parseFloat(item.product.sellingPrice) * item.quantity).toFixed(2)) }}
                </p>
              </div>
              <button
                class="w-12 h-12 bg-red-500 text-white rounded-lg text-2xl"
                @click="cartStore.removeItem(item.productId)"
              >
                ×
              </button>
            </div>
          </div>

          <div v-else class="text-center py-12 text-gray-500">
            <p class="text-pos-xl">購物車是空的</p>
            <p class="text-lg mt-2">請掃描或搜尋商品</p>
          </div>
        </div>
      </div>

      <!-- 右側：結帳資訊 -->
      <div class="lg:col-span-1 space-y-4">
        <!-- 金額統計 -->
        <div class="card">
          <h2 class="text-pos-2xl font-bold mb-4">結帳資訊</h2>
          <dl class="space-y-3">
            <div class="flex justify-between text-xl">
              <dt class="text-gray-600">商品數量</dt>
              <dd class="font-bold">{{ cartStore.totalItems }} 件</dd>
            </div>
            <div class="flex justify-between text-xl border-t pt-3">
              <dt class="text-gray-600">應付金額</dt>
              <dd class="font-bold text-pos-3xl text-primary-600">
                NT$ {{ formatPrice(cartStore.totalAmount.toFixed(2)) }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- 操作按鈕 -->
        <div class="space-y-3">
          <button
            class="btn btn-success w-full"
            :disabled="cartStore.isEmpty"
            @click="handleCheckout"
          >
            💰 結帳
          </button>
          <button
            class="btn btn-danger w-full"
            :disabled="cartStore.isEmpty"
            @click="handleClear"
          >
            🗑️ 清空購物車
          </button>
        </div>
      </div>
    </div>

    <!-- QR Scanner Modal -->
    <QRScanner v-if="showScanner" @close="showScanner = false" @scan="handleScan" />

    <!-- Search Results Modal -->
    <SearchResults
      v-if="showSearchResults"
      :products="searchResults"
      :loading="searching"
      @close="showSearchResults = false"
      @select="handleSelectProduct"
    />

    <!-- Checkout Modal -->
    <CheckoutModal
      v-if="showCheckout"
      :total="cartStore.totalAmount"
      @close="showCheckout = false"
      @complete="handleCheckoutComplete"
    />
  </div>
</template>

<script setup lang="ts">
import type { ProductDetailOutput } from '@astral-hub/shared-types'

const cartStore = useCartStore()
const productsApi = useProductsApi()

const cashierName = ref('店員 A')
const currentDateTime = ref('')
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const showScanner = ref(false)
const showSearchResults = ref(false)
const showCheckout = ref(false)

const searchResults = ref<ProductDetailOutput[]>([])
const searching = ref(false)

// 更新時間
const updateDateTime = (): void => {
  currentDateTime.value = new Date().toLocaleString('zh-TW')
}

// 掃描 QR Code
const openScanner = (): void => {
  showScanner.value = true
}

const handleScan = async (productId: string): Promise<void> => {
  showScanner.value = false
  try {
    const product = await productsApi.detail(productId)
    cartStore.addItem(product)
  } catch (error) {
    alert('找不到此商品')
  }
}

// 搜尋商品
const handleSearch = async (): Promise<void> => {
  if (!searchQuery.value.trim()) return

  searching.value = true
  try {
    const response = await productsApi.list({
      search: searchQuery.value,
      status: 'AVAILABLE',
      pageSize: 20,
    })
    searchResults.value = response.products as ProductDetailOutput[]
    showSearchResults.value = true
  } catch (error) {
    alert('搜尋失敗')
  } finally {
    searching.value = false
  }
}

const handleSelectProduct = (product: ProductDetailOutput): void => {
  cartStore.addItem(product)
  showSearchResults.value = false
  searchQuery.value = ''
  searchInput.value?.focus()
}

// 結帳
const handleCheckout = (): void => {
  showCheckout.value = true
}

const handleCheckoutComplete = (): void => {
  showCheckout.value = false
  cartStore.clearCart()
  alert('結帳完成！')
}

// 清空購物車
const handleClear = (): void => {
  if (confirm('確定要清空購物車嗎？')) {
    cartStore.clearCart()
  }
}

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

// 定時更新時間
onMounted(() => {
  updateDateTime()
  const interval = setInterval(updateDateTime, 1000)

  onUnmounted(() => {
    clearInterval(interval)
  })
})

// SEO
useHead({
  title: 'POS 收銀系統 | 卡牌商城',
})
</script>
```

---

## 六、共用元件

### 6.1 QRScanner 組件

```vue
<!-- apps/pos-web/components/QRScanner.vue -->

<template>
  <div class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-pos-2xl font-bold">掃描 QR Code</h3>
        <button
          class="text-4xl text-gray-600 hover:text-gray-900"
          @click="$emit('close')"
        >
          ×
        </button>
      </div>

      <!-- Camera Preview -->
      <div class="aspect-square bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
        <video ref="videoRef" class="w-full h-full object-cover rounded-lg" autoplay />
      </div>

      <!-- 手動輸入 -->
      <div class="space-y-3">
        <p class="text-lg text-gray-600">或手動輸入商品 ID：</p>
        <input
          v-model="manualInput"
          type="text"
          class="input-pos"
          placeholder="輸入商品 ID"
          @keyup.enter="handleManualInput"
        >
        <button class="btn btn-primary w-full" @click="handleManualInput">
          確認
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BrowserMultiFormatReader } from '@zxing/library'

interface Emits {
  (e: 'close'): void
  (e: 'scan', productId: string): void
}

const emit = defineEmits<Emits>()

const videoRef = ref<HTMLVideoElement | null>(null)
const manualInput = ref('')
const codeReader = new BrowserMultiFormatReader()

const startScanning = async (): Promise<void> => {
  if (!videoRef.value) return

  try {
    await codeReader.decodeFromVideoDevice(null, videoRef.value, (result, error) => {
      if (result) {
        const productId = result.getText()
        emit('scan', productId)
        stopScanning()
      }
    })
  } catch (error) {
    console.error('Camera error:', error)
    alert('無法啟動相機，請使用手動輸入')
  }
}

const stopScanning = (): void => {
  codeReader.reset()
}

const handleManualInput = (): void => {
  if (manualInput.value.trim()) {
    emit('scan', manualInput.value.trim())
  }
}

onMounted(() => {
  startScanning()
})

onUnmounted(() => {
  stopScanning()
})
</script>
```

### 6.2 SearchResults 組件

```vue
<!-- apps/pos-web/components/SearchResults.vue -->

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-pos-2xl font-bold">搜尋結果</h3>
        <button
          class="text-4xl text-gray-600 hover:text-gray-900"
          @click="$emit('close')"
        >
          ×
        </button>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-xl text-gray-600">搜尋中...</p>
      </div>

      <div v-else-if="products.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="product in products"
          :key="product.id"
          class="p-4 border-2 border-gray-300 rounded-lg hover:border-primary-600 cursor-pointer"
          @click="$emit('select', product)"
        >
          <h4 class="text-xl font-bold mb-2">{{ product.name }}</h4>
          <p class="text-gray-600 mb-2">{{ product.category }}</p>
          <p class="text-pos-xl font-bold text-primary-600">
            NT$ {{ formatPrice(product.sellingPrice) }}
          </p>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-xl text-gray-600">找不到符合的商品</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductDetailOutput } from '@astral-hub/shared-types'

interface Props {
  products: ProductDetailOutput[]
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'select', product: ProductDetailOutput): void
}

defineProps<Props>()
defineEmits<Emits>()

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}
</script>
```

### 6.3 CheckoutModal 組件

```vue
<!-- apps/pos-web/components/CheckoutModal.vue -->

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full p-6">
      <h3 class="text-pos-2xl font-bold mb-6">收銀結帳</h3>

      <!-- 金額資訊 -->
      <div class="mb-6 p-6 bg-gray-50 rounded-lg">
        <div class="flex justify-between items-center mb-4">
          <span class="text-pos-xl text-gray-600">應付金額</span>
          <span class="text-pos-3xl font-bold text-primary-600">
            NT$ {{ formatPrice(total.toFixed(2)) }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-pos-xl text-gray-600">實收金額</span>
          <span class="text-pos-3xl font-bold text-green-600">
            NT$ {{ formatPrice(receivedAmount) }}
          </span>
        </div>
        <div v-if="change > 0" class="flex justify-between items-center mt-4 pt-4 border-t">
          <span class="text-pos-xl text-gray-600">找零</span>
          <span class="text-pos-3xl font-bold text-orange-600">
            NT$ {{ formatPrice(change.toFixed(2)) }}
          </span>
        </div>
      </div>

      <!-- 數字鍵盤 -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <button
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
          :key="num"
          class="numpad-btn"
          @click="handleNumpad(num.toString())"
        >
          {{ num }}
        </button>
        <button class="numpad-btn" @click="handleClear">C</button>
        <button class="numpad-btn" @click="handleNumpad('0')">0</button>
        <button class="numpad-btn" @click="handleBackspace">⌫</button>
      </div>

      <!-- 快速金額 -->
      <div class="grid grid-cols-4 gap-3 mb-6">
        <button
          v-for="amount in [100, 500, 1000, 2000]"
          :key="amount"
          class="btn btn-secondary py-3"
          @click="handleQuickAmount(amount)"
        >
          {{ amount }}
        </button>
      </div>

      <!-- 操作按鈕 -->
      <div class="grid grid-cols-2 gap-3">
        <button class="btn btn-secondary" @click="$emit('close')">
          取消
        </button>
        <button
          class="btn btn-success"
          :disabled="parseFloat(receivedAmount) < total"
          @click="handleComplete"
        >
          完成結帳
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  total: number
}

interface Emits {
  (e: 'close'): void
  (e: 'complete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const receivedAmount = ref('0')

const change = computed((): number => {
  const received = parseFloat(receivedAmount.value) || 0
  return Math.max(0, received - props.total)
})

const handleNumpad = (digit: string): void => {
  if (receivedAmount.value === '0') {
    receivedAmount.value = digit
  } else {
    receivedAmount.value += digit
  }
}

const handleBackspace = (): void => {
  if (receivedAmount.value.length > 1) {
    receivedAmount.value = receivedAmount.value.slice(0, -1)
  } else {
    receivedAmount.value = '0'
  }
}

const handleClear = (): void => {
  receivedAmount.value = '0'
}

const handleQuickAmount = (amount: number): void => {
  receivedAmount.value = amount.toString()
}

const handleComplete = async (): Promise<void> => {
  // TODO: 建立訂單（Task 07 API）
  emit('complete')
}

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

// 自動填入應付金額
onMounted(() => {
  receivedAmount.value = Math.ceil(props.total).toString()
})
</script>
```

---

## 七、API Composables

### 7.1 Products API

```typescript
// apps/pos-web/composables/useProductsApi.ts

import type {
  QueryProductsInput,
  ProductListOutput,
  ProductDetailOutput,
} from '@astral-hub/shared-types'

export const useProductsApi = () => {
  const { apiFetch } = useApiClient()

  return {
    list: async (query: QueryProductsInput): Promise<ProductListOutput> => {
      return await apiFetch<ProductListOutput>('/api/products', {
        method: 'GET',
        query: query as Record<string, string | number>,
      })
    },

    detail: async (id: string): Promise<ProductDetailOutput> => {
      return await apiFetch<ProductDetailOutput>(`/api/products/${id}`, {
        method: 'GET',
      })
    },
  }
}
```

### 7.2 Orders API

```typescript
// apps/pos-web/composables/useOrdersApi.ts

import type { CreateOrderInput, OrderDetailOutput } from '@astral-hub/shared-types'

export const useOrdersApi = () => {
  const { apiFetch } = useApiClient()

  return {
    create: async (data: CreateOrderInput): Promise<OrderDetailOutput> => {
      return await apiFetch<OrderDetailOutput>('/api/orders', {
        method: 'POST',
        body: data,
      })
    },
  }
}
```

---

## 八、環境變數

```bash
# apps/pos-web/.env

NUXT_PUBLIC_API_BASE=http://localhost:3001
```

---

## 九、驗收標準

- [ ] POS 系統正常啟動（port 3003）
- [ ] QR Code 掃描功能正常運作
- [ ] 商品搜尋功能正常運作
- [ ] 購物車新增、刪除、調整數量功能正常
- [ ] 數字鍵盤輸入正常運作
- [ ] 快速金額按鈕正常運作
- [ ] 找零計算正確
- [ ] 結帳流程完整（建立訂單）
- [ ] 觸控友善設計（大按鈕、大字體）
- [ ] 響應式設計適合平板使用
- [ ] 無使用 `any` 型別（除單元測試外）

---

## 十、注意事項

1. **觸控優化**：
   - 按鈕尺寸至少 48x48px（建議更大）
   - 禁用文字選取與長按選單
   - 使用 active 狀態提供視覺回饋

2. **QR Code 掃描**：
   - 使用 @zxing/library 函式庫
   - 支援手動輸入作為備選方案
   - 需要 HTTPS 或 localhost 才能存取相機

3. **結帳流程**：
   - 目前僅支援現金收款
   - 訂單通路設為 'POS'
   - 付款方式設為 'CASH'

4. **效能優化**：
   - 購物車使用 Pinia store（記憶體存儲）
   - 避免不必要的 API 請求
   - 使用 debounce 優化搜尋

5. **未來擴充**：
   - Phase 2 整合藍牙印表機
   - 會員掃碼識別
   - 交易歷史查詢
   - 庫存即時同步

---

## 十一、後續任務

- **Task 19**: Third-party ECPay（綠界金流整合）
- **Task 20**: Third-party GCS（圖片上傳整合）
- **Task 21**: Testing（單元測試與 E2E 測試）
- **Task 22**: Deployment（GCP Cloud Run 部署）
