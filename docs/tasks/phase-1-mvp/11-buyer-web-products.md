# Task 11: 買家前台商品頁面

## 概述

建立買家前台商品列表頁與商品詳情頁，包含搜尋、篩選、分頁、圖片預覽、加入購物車等功能。

## 依賴

- Task 05: Products API（商品 API 已建立）
- Task 10: Buyer Web Setup（前台基礎已建立）

---

## 一、擴充 API Composables

### 1.1 更新 useApi

```typescript
// apps/buyer-web/composables/useApi.ts (擴充)

import type {
  QueryProductsInput,
  ProductListOutput,
  ProductDetailOutput,
} from '@card-erp/shared-types'

export const useProductsApi = () => {
  const { apiFetch } = useApiClient()

  return {
    /**
     * 獲取商品列表
     */
    list: async (query: QueryProductsInput): Promise<ProductListOutput> => {
      return await apiFetch<ProductListOutput>('/api/products', {
        method: 'GET',
        query: query as Record<string, string | number>,
      })
    },

    /**
     * 獲取商品詳情
     */
    detail: async (id: string): Promise<ProductDetailOutput> => {
      return await apiFetch<ProductDetailOutput>(`/api/products/${id}`, {
        method: 'GET',
      })
    },
  }
}
```

---

## 二、共用元件

### 2.1 ProductCard 商品卡片

```vue
<!-- apps/buyer-web/components/ProductCard.vue -->

<template>
  <div class="card hover:shadow-lg transition-shadow duration-200 cursor-pointer" @click="goToDetail">
    <!-- 商品圖片 -->
    <div class="relative aspect-square mb-4 overflow-hidden rounded-md bg-gray-100">
      <img
        v-if="product.images && product.images.length > 0"
        :src="product.images[0]"
        :alt="product.name"
        class="w-full h-full object-cover"
      >
      <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- 狀態標籤 -->
      <div class="absolute top-2 right-2">
        <span v-if="product.status === 'SOLD'" class="bg-red-500 text-white text-xs px-2 py-1 rounded">
          已售出
        </span>
        <span v-else-if="product.status === 'PENDING'" class="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
          待上架
        </span>
      </div>
    </div>

    <!-- 商品資訊 -->
    <div>
      <p class="text-sm text-gray-500 mb-1">{{ product.category }}</p>
      <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ product.name }}</h3>
      <div class="flex items-center justify-between">
        <p class="text-xl font-bold text-primary-600">
          NT$ {{ formatPrice(product.sellingPrice) }}
        </p>
        <button
          v-if="product.status === 'AVAILABLE'"
          class="btn btn-primary text-sm"
          @click.stop="addToCart"
        >
          加入購物車
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/store'

interface Props {
  product: Product
}

const props = defineProps<Props>()
const router = useRouter()
const cartStore = useCartStore()

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const goToDetail = (): void => {
  router.push(`/products/${props.product.id}`)
}

const addToCart = (): void => {
  cartStore.addItem(props.product)
  // TODO: 顯示提示訊息
}
</script>
```

### 2.2 ProductFilter 篩選器

```vue
<!-- apps/buyer-web/components/ProductFilter.vue -->

<template>
  <div class="card">
    <h3 class="font-bold text-lg mb-4">篩選條件</h3>

    <!-- 類別篩選 -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">類別</label>
      <select v-model="localFilters.category" class="input" @change="applyFilters">
        <option value="">全部類別</option>
        <option value="Pokemon">寶可夢</option>
        <option value="OnePiece">海賊王</option>
        <option value="YuGiOh">遊戲王</option>
        <option value="Baseball">棒球卡</option>
      </select>
    </div>

    <!-- 價格範圍 -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">價格範圍</label>
      <div class="grid grid-cols-2 gap-2">
        <input
          v-model="localFilters.minPrice"
          type="number"
          placeholder="最低價"
          class="input"
          @change="applyFilters"
        >
        <input
          v-model="localFilters.maxPrice"
          type="number"
          placeholder="最高價"
          class="input"
          @change="applyFilters"
        >
      </div>
    </div>

    <!-- 狀態篩選 -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">狀態</label>
      <select v-model="localFilters.status" class="input" @change="applyFilters">
        <option value="">全部狀態</option>
        <option value="AVAILABLE">可購買</option>
        <option value="SOLD">已售出</option>
      </select>
    </div>

    <!-- 重置按鈕 -->
    <button class="btn btn-secondary w-full" @click="resetFilters">
      重置篩選
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ProductStatus } from '@card-erp/shared-types'

interface FilterData {
  category: string
  minPrice: string
  maxPrice: string
  status: ProductStatus | ''
}

interface Props {
  filters: FilterData
}

interface Emits {
  (e: 'update:filters', filters: FilterData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = ref<FilterData>({ ...props.filters })

const applyFilters = (): void => {
  emit('update:filters', { ...localFilters.value })
}

const resetFilters = (): void => {
  localFilters.value = {
    category: '',
    minPrice: '',
    maxPrice: '',
    status: '',
  }
  applyFilters()
}

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
})
</script>
```

### 2.3 Pagination 分頁

```vue
<!-- apps/buyer-web/components/Pagination.vue -->

<template>
  <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2">
    <!-- 上一頁 -->
    <button
      class="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      上一頁
    </button>

    <!-- 頁碼 -->
    <template v-for="page in visiblePages" :key="page">
      <button
        v-if="page !== '...'"
        class="btn"
        :class="page === currentPage ? 'btn-primary' : 'btn-secondary'"
        @click="goToPage(page as number)"
      >
        {{ page }}
      </button>
      <span v-else class="px-2 text-gray-500">...</span>
    </template>

    <!-- 下一頁 -->
    <button
      class="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      下一頁
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
}

interface Emits {
  (e: 'page-change', page: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visiblePages = computed((): Array<number | string> => {
  const pages: Array<number | string> = []
  const { currentPage, totalPages } = props

  if (totalPages <= 7) {
    // 總頁數 <= 7，顯示全部
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // 總頁數 > 7，顯示部分頁碼
    pages.push(1)

    if (currentPage <= 3) {
      for (let i = 2; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    }
  }

  return pages
})

const goToPage = (page: number): void => {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}
</script>
```

### 2.4 ImageGallery 圖片畫廊

```vue
<!-- apps/buyer-web/components/ImageGallery.vue -->

<template>
  <div>
    <!-- 主圖 -->
    <div class="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
      <img
        v-if="images.length > 0"
        :src="images[currentIndex]"
        :alt="`商品圖片 ${currentIndex + 1}`"
        class="w-full h-full object-cover cursor-zoom-in"
        @click="openLightbox"
      >
      <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
        <svg class="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>

    <!-- 縮圖 -->
    <div v-if="images.length > 1" class="grid grid-cols-4 gap-2">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="aspect-square overflow-hidden rounded-md cursor-pointer border-2 transition-colors"
        :class="index === currentIndex ? 'border-primary-600' : 'border-transparent'"
        @click="currentIndex = index"
      >
        <img :src="image" :alt="`縮圖 ${index + 1}`" class="w-full h-full object-cover">
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="showLightbox"
        class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
        @click="closeLightbox"
      >
        <button
          class="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
          @click="closeLightbox"
        >
          &times;
        </button>
        <img
          :src="images[currentIndex]"
          :alt="`商品圖片 ${currentIndex + 1}`"
          class="max-w-full max-h-full object-contain"
          @click.stop
        >
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Props {
  images: string[]
}

defineProps<Props>()

const currentIndex = ref(0)
const showLightbox = ref(false)

const openLightbox = (): void => {
  showLightbox.value = true
}

const closeLightbox = (): void => {
  showLightbox.value = false
}

// 按 ESC 關閉 Lightbox
onMounted(() => {
  const handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      closeLightbox()
    }
  }
  window.addEventListener('keydown', handleEscape)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>
```

---

## 三、商品列表頁

### 3.1 Products Index Page

```vue
<!-- apps/buyer-web/pages/products/index.vue -->

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">商品列表</h1>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- 側邊篩選器 -->
      <aside class="lg:col-span-1">
        <ProductFilter v-model:filters="filters" @update:filters="handleFilterChange" />
      </aside>

      <!-- 商品列表 -->
      <main class="lg:col-span-3">
        <!-- 搜尋與排序 -->
        <div class="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋商品名稱..."
            class="input flex-1"
            @keyup.enter="handleSearch"
          >
          <select v-model="sortBy" class="input sm:w-48" @change="handleSortChange">
            <option value="createdAt_desc">最新上架</option>
            <option value="sellingPrice_asc">價格由低到高</option>
            <option value="sellingPrice_desc">價格由高到低</option>
          </select>
        </div>

        <!-- Loading -->
        <LoadingSpinner v-if="loading" container-class="py-12" />

        <!-- Error -->
        <ErrorMessage v-else-if="error" :message="error" />

        <!-- 商品列表 -->
        <template v-else>
          <div v-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard v-for="product in products" :key="product.id" :product="product" />
          </div>

          <div v-else class="text-center py-12 text-gray-500">
            沒有找到符合條件的商品
          </div>

          <!-- 分頁 -->
          <div class="mt-8">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="handlePageChange"
            />
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/store'
import type { ProductStatus } from '@card-erp/shared-types'

interface FilterData {
  category: string
  minPrice: string
  maxPrice: string
  status: ProductStatus | ''
}

const productsApi = useProductsApi()

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref('')

const searchQuery = ref('')
const filters = ref<FilterData>({
  category: '',
  minPrice: '',
  maxPrice: '',
  status: '',
})
const sortBy = ref('createdAt_desc')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 12

// 獲取商品列表
const fetchProducts = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    const [sortField, sortOrder] = sortBy.value.split('_')

    const response = await productsApi.list({
      page: currentPage.value,
      pageSize,
      search: searchQuery.value || undefined,
      category: filters.value.category || undefined,
      minPrice: filters.value.minPrice ? parseFloat(filters.value.minPrice) : undefined,
      maxPrice: filters.value.maxPrice ? parseFloat(filters.value.maxPrice) : undefined,
      status: filters.value.status || undefined,
      sortBy: sortField as 'createdAt' | 'sellingPrice',
      sortOrder: sortOrder as 'asc' | 'desc',
    })

    products.value = response.products as Product[]
    totalPages.value = response.pagination.totalPages
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

// 搜尋
const handleSearch = (): void => {
  currentPage.value = 1
  fetchProducts()
}

// 篩選變更
const handleFilterChange = (): void => {
  currentPage.value = 1
  fetchProducts()
}

// 排序變更
const handleSortChange = (): void => {
  currentPage.value = 1
  fetchProducts()
}

// 換頁
const handlePageChange = (page: number): void => {
  currentPage.value = page
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 初始載入
onMounted(() => {
  fetchProducts()
})

// SEO
useHead({
  title: '商品列表 | 卡牌商城',
  meta: [
    { name: 'description', content: '瀏覽寶可夢、海賊王、遊戲王等收藏級卡牌' },
  ],
})
</script>
```

---

## 四、商品詳情頁

### 4.1 Product Detail Page

```vue
<!-- apps/buyer-web/pages/products/[id].vue -->

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <!-- Error -->
    <ErrorMessage v-else-if="error" :message="error" />

    <!-- 商品詳情 -->
    <template v-else-if="product">
      <!-- 麵包屑 -->
      <nav class="mb-6 text-sm text-gray-600">
        <NuxtLink to="/" class="hover:text-primary-600">首頁</NuxtLink>
        <span class="mx-2">/</span>
        <NuxtLink to="/products" class="hover:text-primary-600">商品列表</NuxtLink>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ product.name }}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- 左側：圖片 -->
        <div>
          <ImageGallery :images="product.images || []" />
        </div>

        <!-- 右側：商品資訊 -->
        <div>
          <!-- 類別 -->
          <p class="text-sm text-gray-500 mb-2">{{ product.category }}</p>

          <!-- 商品名稱 -->
          <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ product.name }}</h1>

          <!-- 價格 -->
          <div class="mb-6">
            <p class="text-4xl font-bold text-primary-600">
              NT$ {{ formatPrice(product.sellingPrice) }}
            </p>
          </div>

          <!-- 狀態 -->
          <div class="mb-6">
            <span
              class="inline-block px-4 py-2 rounded-full text-sm font-medium"
              :class="{
                'bg-green-100 text-green-800': product.status === 'AVAILABLE',
                'bg-red-100 text-red-800': product.status === 'SOLD',
                'bg-yellow-100 text-yellow-800': product.status === 'PENDING',
              }"
            >
              {{ getStatusText(product.status) }}
            </span>
          </div>

          <!-- 商品描述 -->
          <div v-if="product.description" class="mb-6">
            <h2 class="font-bold text-lg mb-2">商品描述</h2>
            <p class="text-gray-700 whitespace-pre-wrap">{{ product.description }}</p>
          </div>

          <!-- 規格資訊 -->
          <div class="mb-6">
            <h2 class="font-bold text-lg mb-2">規格資訊</h2>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-gray-500">類型</dt>
                <dd class="font-medium">{{ product.type }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">類別</dt>
                <dd class="font-medium">{{ product.category }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">商品編號</dt>
                <dd class="font-medium text-sm">{{ product.id }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">上架日期</dt>
                <dd class="font-medium text-sm">{{ formatDate(product.createdAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- 操作按鈕 -->
          <div class="space-y-4">
            <button
              v-if="product.status === 'AVAILABLE'"
              class="btn btn-primary w-full py-3 text-lg"
              @click="addToCart"
            >
              加入購物車
            </button>
            <button
              v-else
              class="btn btn-secondary w-full py-3 text-lg cursor-not-allowed"
              disabled
            >
              {{ product.status === 'SOLD' ? '已售出' : '暫不販售' }}
            </button>

            <button class="btn btn-secondary w-full" @click="goBack">
              返回商品列表
            </button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      找不到此商品
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductDetailOutput, ProductStatus } from '@card-erp/shared-types'

const route = useRoute()
const router = useRouter()
const productsApi = useProductsApi()
const cartStore = useCartStore()

const product = ref<ProductDetailOutput | null>(null)
const loading = ref(false)
const error = ref('')

const productId = computed(() => route.params.id as string)

// 獲取商品詳情
const fetchProduct = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    product.value = await productsApi.detail(productId.value)
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW')
}

const getStatusText = (status: ProductStatus): string => {
  const statusMap: Record<ProductStatus, string> = {
    PENDING: '待上架',
    AVAILABLE: '可購買',
    SOLD: '已售出',
  }
  return statusMap[status] || status
}

const addToCart = (): void => {
  if (product.value) {
    cartStore.addItem(product.value as unknown as Product)
    // TODO: 顯示成功提示
    router.push('/cart')
  }
}

const goBack = (): void => {
  router.back()
}

// 初始載入
onMounted(() => {
  fetchProduct()
})

// SEO
useHead(() => ({
  title: product.value ? `${product.value.name} | 卡牌商城` : '商品詳情 | 卡牌商城',
  meta: [
    {
      name: 'description',
      content: product.value?.description || '查看商品詳細資訊',
    },
  ],
}))
</script>
```

---

## 五、型別定義擴充

### 5.1 擴充 Store Types

```typescript
// apps/buyer-web/types/store.ts (擴充)

import type { ProductType, ProductStatus } from '@card-erp/shared-types'

export interface Product {
  id: string
  type: ProductType
  category: string
  name: string
  description?: string
  sellingPrice: string
  status: ProductStatus
  images: string[]
  createdAt: string
}
```

---

## 六、單元測試（可選）

### 6.1 ProductCard 測試

```typescript
// apps/buyer-web/components/__tests__/ProductCard.test.ts

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from '../ProductCard.vue'
import type { Product } from '~/types/store'

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 'test-1',
    type: 'TRADING_CARD' as const,
    category: 'Pokemon',
    name: 'Pikachu',
    sellingPrice: '100.00',
    status: 'AVAILABLE' as const,
    images: ['https://example.com/image.jpg'],
    createdAt: '2026-01-25T00:00:00Z',
  }

  it('renders product information correctly', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
    })

    expect(wrapper.text()).toContain('Pikachu')
    expect(wrapper.text()).toContain('Pokemon')
    expect(wrapper.text()).toContain('100')
  })

  it('shows sold badge when status is SOLD', () => {
    const soldProduct: Product = { ...mockProduct, status: 'SOLD' as const }
    const wrapper = mount(ProductCard, {
      props: { product: soldProduct },
    })

    expect(wrapper.text()).toContain('已售出')
  })
})
```

---

## 七、驗收標準

- [ ] 商品列表頁正常顯示，包含搜尋、篩選、排序、分頁功能
- [ ] 商品卡片正確顯示商品資訊與圖片
- [ ] 篩選器可正常篩選類別、價格、狀態
- [ ] 分頁功能正常運作，換頁時滾動至頂部
- [ ] 商品詳情頁正確顯示完整商品資訊
- [ ] 圖片畫廊可切換圖片，點擊放大檢視
- [ ] 加入購物車功能正常運作
- [ ] 響應式設計在手機/平板/桌面正常顯示
- [ ] SEO meta tags 正確設定
- [ ] 無使用 `any` 型別（除單元測試外）
- [ ] Loading 與 Error 狀態正確處理

---

## 八、注意事項

1. **圖片處理**：
   - 使用 lazy loading 延遲載入圖片
   - 提供預設圖片佔位符
   - 圖片壓縮與優化（Task 20 整合 GCS）

2. **效能優化**：
   - 商品列表使用虛擬滾動（大量資料時）
   - 圖片使用 `<NuxtImg>` 自動優化
   - 篩選與搜尋使用 debounce 減少 API 請求

3. **使用者體驗**：
   - 加入購物車後顯示 Toast 提示
   - 載入狀態使用 Skeleton Screen
   - 錯誤訊息友善且可操作

4. **SEO 優化**：
   - 商品詳情頁使用 SSR 渲染
   - 設定正確的 meta tags 與 Open Graph
   - 使用結構化資料（Schema.org Product）

5. **可訪問性**：
   - 圖片提供 alt 文字
   - 鍵盤可操作所有互動元素
   - 顏色對比符合 WCAG 標準

---

## 九、後續任務

- **Task 12**: Buyer Web Auctions（競標頁面）
- **Task 13**: Buyer Web Cart（購物車與結帳）
- **Task 20**: Third-party GCS（整合 Google Cloud Storage）
