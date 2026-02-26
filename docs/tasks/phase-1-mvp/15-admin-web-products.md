# Task 15: 後台商品管理

## 概述

建立後台商品管理完整 CRUD 功能，包含商品列表、新增、編輯、刪除、批量操作、圖片上傳與 QR code 展示。

## 依賴

- Task 05: Products API（商品 API 已建立）
- Task 14: Admin Web Setup（後台基礎已建立）

---

## 一、擴充 API Composables

### 1.1 Products API

```typescript
// apps/admin-web/composables/useProductsApi.ts

import type {
  QueryProductsInput,
  ProductListOutput,
  ProductDetailOutput,
  CreateProductInput,
  UpdateProductInput,
} from '@astral-hub/shared-types'

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

    /**
     * 新增商品
     */
    create: async (data: CreateProductInput): Promise<ProductDetailOutput> => {
      return await apiFetch<ProductDetailOutput>('/api/products', {
        method: 'POST',
        body: data,
      })
    },

    /**
     * 更新商品
     */
    update: async (id: string, data: UpdateProductInput): Promise<ProductDetailOutput> => {
      return await apiFetch<ProductDetailOutput>(`/api/products/${id}`, {
        method: 'PATCH',
        body: data,
      })
    },

    /**
     * 刪除商品
     */
    delete: async (id: string): Promise<void> => {
      await apiFetch<void>(`/api/products/${id}`, {
        method: 'DELETE',
      })
    },
  }
}
```

---

## 二、共用元件

### 2.1 DataTable 資料表格

```vue
<!-- apps/admin-web/components/DataTable.vue -->

<template>
  <div class="card">
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th v-if="selectable" class="w-12">
              <input
                type="checkbox"
                class="rounded"
                :checked="allSelected"
                @change="handleSelectAll"
              >
            </th>
            <th v-for="column in columns" :key="column.key">
              {{ column.label }}
            </th>
            <th v-if="hasActions" class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data" :key="row[rowKey]">
            <td v-if="selectable">
              <input
                type="checkbox"
                class="rounded"
                :checked="selectedIds.includes(row[rowKey])"
                @change="handleSelect(row[rowKey])"
              >
            </td>
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
            <td v-if="hasActions" class="text-right">
              <slot name="actions" :row="row" />
            </td>
          </tr>
          <tr v-if="data.length === 0">
            <td :colspan="columnCount" class="text-center text-gray-500 py-8">
              {{ emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
}

interface Props {
  columns: Column[]
  data: Record<string, unknown>[]
  rowKey?: string
  selectable?: boolean
  hasActions?: boolean
  emptyText?: string
}

interface Emits {
  (e: 'selection-change', selectedIds: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  selectable: false,
  hasActions: false,
  emptyText: '暫無資料',
})

const emit = defineEmits<Emits>()

const selectedIds = ref<string[]>([])

const allSelected = computed(() => {
  return props.data.length > 0 && selectedIds.value.length === props.data.length
})

const columnCount = computed(() => {
  let count = props.columns.length
  if (props.selectable) count++
  if (props.hasActions) count++
  return count
})

const handleSelectAll = (event: Event): void => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedIds.value = props.data.map(row => row[props.rowKey] as string)
  } else {
    selectedIds.value = []
  }
  emit('selection-change', selectedIds.value)
}

const handleSelect = (id: string): void => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
  emit('selection-change', selectedIds.value)
}

// 暴露方法讓父組件可以清空選擇
defineExpose({
  clearSelection: () => {
    selectedIds.value = []
  },
})
</script>
```

### 2.2 Pagination 分頁

```vue
<!-- apps/admin-web/components/Pagination.vue -->

<template>
  <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2 mt-6">
    <button
      class="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      上一頁
    </button>

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
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
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

### 2.3 ImageUpload 圖片上傳

```vue
<!-- apps/admin-web/components/ImageUpload.vue -->

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>

    <!-- 圖片預覽 -->
    <div v-if="images.length > 0" class="grid grid-cols-4 gap-4 mb-4">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="relative aspect-square overflow-hidden rounded-md border-2 border-gray-300"
      >
        <img :src="image" :alt="`圖片 ${index + 1}`" class="w-full h-full object-cover">
        <button
          type="button"
          class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          @click="removeImage(index)"
        >
          ×
        </button>
      </div>
    </div>

    <!-- 上傳按鈕 -->
    <div class="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleFileSelect"
      >
      <button
        type="button"
        class="btn btn-secondary"
        @click="openFileDialog"
      >
        選擇圖片
      </button>
      <p class="text-sm text-gray-500 mt-2">支援 JPG、PNG 格式，最多 {{ maxFiles }} 張</p>
    </div>

    <p v-if="error" class="text-sm text-red-600 mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  modelValue: string[]
  maxFiles?: number
  maxSizeMB?: number
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '商品圖片',
  maxFiles: 5,
  maxSizeMB: 2,
})

const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement | null>(null)
const images = ref<string[]>([...props.modelValue])
const error = ref('')

const openFileDialog = (): void => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  error.value = ''

  // 檢查數量限制
  if (images.value.length + files.length > props.maxFiles) {
    error.value = `最多只能上傳 ${props.maxFiles} 張圖片`
    return
  }

  // 處理每個檔案
  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // 檢查檔案大小
    if (file.size > props.maxSizeMB * 1024 * 1024) {
      error.value = `圖片大小不可超過 ${props.maxSizeMB}MB`
      continue
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      error.value = '只能上傳圖片檔案'
      continue
    }

    // 轉換為 base64（暫時方案，Task 20 整合 GCS）
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      images.value.push(result)
      emit('update:modelValue', images.value)
    }
    reader.readAsDataURL(file)
  }

  // 清空 input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removeImage = (index: number): void => {
  images.value.splice(index, 1)
  emit('update:modelValue', images.value)
}

watch(() => props.modelValue, (newValue) => {
  images.value = [...newValue]
})
</script>
```

---

## 三、商品列表頁

### 3.1 Products Index Page

```vue
<!-- apps/admin-web/pages/products/index.vue -->

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900">商品管理</h1>
      <NuxtLink to="/products/new" class="btn btn-primary">
        新增商品
      </NuxtLink>
    </div>

    <!-- 搜尋與篩選 -->
    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋商品名稱..."
          class="input"
          @keyup.enter="handleSearch"
        >
        <select v-model="filters.category" class="input" @change="handleFilterChange">
          <option value="">全部類別</option>
          <option value="Pokemon">寶可夢</option>
          <option value="OnePiece">海賊王</option>
          <option value="YuGiOh">遊戲王</option>
          <option value="Baseball">棒球卡</option>
        </select>
        <select v-model="filters.status" class="input" @change="handleFilterChange">
          <option value="">全部狀態</option>
          <option value="PENDING">待上架</option>
          <option value="AVAILABLE">可購買</option>
          <option value="SOLD">已售出</option>
        </select>
        <button class="btn btn-secondary" @click="resetFilters">
          重置篩選
        </button>
      </div>
    </div>

    <!-- 批量操作 -->
    <div v-if="selectedIds.length > 0" class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
      <div class="flex items-center justify-between">
        <p class="text-sm text-blue-800">已選擇 {{ selectedIds.length }} 項商品</p>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" @click="handleBatchUpdateStatus('AVAILABLE')">
            批量上架
          </button>
          <button class="btn btn-sm btn-secondary" @click="handleBatchUpdateStatus('PENDING')">
            批量下架
          </button>
          <button class="btn btn-sm btn-danger" @click="handleBatchDelete">
            批量刪除
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <!-- Error -->
    <ErrorMessage v-else-if="error" :message="error" />

    <!-- 商品列表 -->
    <template v-else>
      <DataTable
        ref="tableRef"
        :columns="columns"
        :data="products"
        selectable
        has-actions
        @selection-change="handleSelectionChange"
      >
        <!-- 圖片欄位 -->
        <template #cell-images="{ row }">
          <div class="w-16 h-16 overflow-hidden rounded-md bg-gray-100">
            <img
              v-if="row.images && row.images.length > 0"
              :src="row.images[0]"
              :alt="row.name"
              class="w-full h-full object-cover"
            >
          </div>
        </template>

        <!-- 價格欄位 -->
        <template #cell-sellingPrice="{ value }">
          <span class="font-medium text-primary-600">
            NT$ {{ formatPrice(value) }}
          </span>
        </template>

        <!-- 狀態欄位 -->
        <template #cell-status="{ value }">
          <span
            class="inline-block px-2 py-1 rounded-full text-xs font-medium"
            :class="getStatusClass(value)"
          >
            {{ getStatusText(value) }}
          </span>
        </template>

        <!-- 操作欄位 -->
        <template #actions="{ row }">
          <div class="flex gap-2 justify-end">
            <NuxtLink
              :to="`/products/${row.id}`"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              查看
            </NuxtLink>
            <NuxtLink
              :to="`/products/${row.id}/edit`"
              class="text-green-600 hover:text-green-800 text-sm"
            >
              編輯
            </NuxtLink>
            <button
              class="text-red-600 hover:text-red-800 text-sm"
              @click="handleDelete(row.id)"
            >
              刪除
            </button>
          </div>
        </template>
      </DataTable>

      <!-- 分頁 -->
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ProductStatus } from '@astral-hub/shared-types'

definePageMeta({
  middleware: ['auth'],
})

const productsApi = useProductsApi()
const tableRef = ref()

const products = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')

const searchQuery = ref('')
const filters = ref({
  category: '',
  status: '' as ProductStatus | '',
})
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 20

const selectedIds = ref<string[]>([])

const columns = [
  { key: 'images', label: '圖片' },
  { key: 'name', label: '商品名稱' },
  { key: 'category', label: '類別' },
  { key: 'sellingPrice', label: '售價' },
  { key: 'status', label: '狀態' },
  { key: 'createdAt', label: '建立時間' },
]

// 獲取商品列表
const fetchProducts = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    const response = await productsApi.list({
      page: currentPage.value,
      pageSize,
      search: searchQuery.value || undefined,
      category: filters.value.category || undefined,
      status: filters.value.status || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })

    products.value = response.products.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt).toLocaleDateString('zh-TW'),
    }))
    totalPages.value = response.pagination.totalPages
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const getStatusText = (status: ProductStatus): string => {
  const statusMap: Record<ProductStatus, string> = {
    PENDING: '待上架',
    AVAILABLE: '可購買',
    SOLD: '已售出',
  }
  return statusMap[status] || status
}

const getStatusClass = (status: ProductStatus): string => {
  const classMap: Record<ProductStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    SOLD: 'bg-gray-100 text-gray-800',
  }
  return classMap[status] || ''
}

const handleSearch = (): void => {
  currentPage.value = 1
  fetchProducts()
}

const handleFilterChange = (): void => {
  currentPage.value = 1
  fetchProducts()
}

const resetFilters = (): void => {
  searchQuery.value = ''
  filters.value = { category: '', status: '' }
  currentPage.value = 1
  fetchProducts()
}

const handlePageChange = (page: number): void => {
  currentPage.value = page
  fetchProducts()
}

const handleSelectionChange = (ids: string[]): void => {
  selectedIds.value = ids
}

const handleDelete = async (id: string): Promise<void> => {
  if (!confirm('確定要刪除此商品嗎？')) return

  try {
    await productsApi.delete(id)
    fetchProducts()
  } catch (err) {
    alert(handleApiError(err))
  }
}

const handleBatchUpdateStatus = async (status: ProductStatus): Promise<void> => {
  if (!confirm(`確定要批量更新 ${selectedIds.value.length} 項商品的狀態嗎？`)) return

  try {
    // TODO: 實作批量更新 API
    alert('批量更新功能將在後續實作')
  } catch (err) {
    alert(handleApiError(err))
  }
}

const handleBatchDelete = async (): Promise<void> => {
  if (!confirm(`確定要批量刪除 ${selectedIds.value.length} 項商品嗎？此操作無法復原！`)) return

  try {
    // TODO: 實作批量刪除 API
    alert('批量刪除功能將在後續實作')
  } catch (err) {
    alert(handleApiError(err))
  }
}

onMounted(() => {
  fetchProducts()
})

// SEO
useHead({
  title: '商品管理 | 卡牌商城後台',
})
</script>
```

---

## 四、商品新增/編輯頁面

### 4.1 Product Form Page

```vue
<!-- apps/admin-web/pages/products/new.vue -->

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">新增商品</h1>

    <ProductForm
      :loading="loading"
      :error="error"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { CreateProductInput } from '@astral-hub/shared-types'

definePageMeta({
  middleware: ['auth'],
})

const productsApi = useProductsApi()
const router = useRouter()

const loading = ref(false)
const error = ref('')

const handleSubmit = async (data: CreateProductInput): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    await productsApi.create(data)
    router.push('/products')
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const handleCancel = (): void => {
  router.push('/products')
}

// SEO
useHead({
  title: '新增商品 | 卡牌商城後台',
})
</script>
```

```vue
<!-- apps/admin-web/pages/products/[id]/edit.vue -->

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">編輯商品</h1>

    <LoadingSpinner v-if="loadingProduct" container-class="py-12" />

    <ProductForm
      v-else-if="product"
      :initial-data="product"
      :loading="loading"
      :error="error"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <ErrorMessage v-else-if="loadError" :message="loadError" />
  </div>
</template>

<script setup lang="ts">
import type { UpdateProductInput, ProductDetailOutput } from '@astral-hub/shared-types'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const productsApi = useProductsApi()
const router = useRouter()

const product = ref<ProductDetailOutput | null>(null)
const loadingProduct = ref(false)
const loadError = ref('')

const loading = ref(false)
const error = ref('')

const productId = computed(() => route.params.id as string)

// 獲取商品詳情
const fetchProduct = async (): Promise<void> => {
  loadingProduct.value = true
  loadError.value = ''

  try {
    product.value = await productsApi.detail(productId.value)
  } catch (err) {
    loadError.value = handleApiError(err)
  } finally {
    loadingProduct.value = false
  }
}

const handleSubmit = async (data: UpdateProductInput): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    await productsApi.update(productId.value, data)
    router.push('/products')
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const handleCancel = (): void => {
  router.push('/products')
}

onMounted(() => {
  fetchProduct()
})

// SEO
useHead({
  title: '編輯商品 | 卡牌商城後台',
})
</script>
```

### 4.2 Product Form Component

```vue
<!-- apps/admin-web/components/ProductForm.vue -->

<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左側：基本資訊 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h2 class="font-bold text-xl mb-4">基本資訊</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">商品類型 *</label>
              <select v-model="formData.type" class="input" required>
                <option value="TRADING_CARD">交易卡</option>
                <option value="SEALED_PRODUCT">盒裝商品</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">類別 *</label>
              <input v-model="formData.category" type="text" class="input" placeholder="例如：Pokemon" required>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">商品名稱 *</label>
              <input v-model="formData.name" type="text" class="input" placeholder="請輸入商品名稱" required>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">商品描述</label>
              <textarea v-model="formData.description" rows="4" class="input" placeholder="請輸入商品描述" />
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="font-bold text-xl mb-4">定價資訊</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">售價 *</label>
              <input v-model.number="formData.sellingPrice" type="number" step="0.01" class="input" placeholder="0.00" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">狀態</label>
              <select v-model="formData.status" class="input">
                <option value="PENDING">待上架</option>
                <option value="AVAILABLE">可購買</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <ImageUpload v-model="formData.images" />
        </div>
      </div>

      <!-- 右側：來源資訊 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="card">
          <h2 class="font-bold text-xl mb-4">來源資訊</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">來源類型</label>
              <select v-model="formData.sourceType" class="input">
                <option value="SELF_OPERATED">自營</option>
                <option value="CONSIGNMENT">寄賣</option>
              </select>
            </div>

            <div v-if="formData.sourceType === 'CONSIGNMENT'">
              <label class="block text-sm font-medium text-gray-700 mb-2">寄賣賣家 ID</label>
              <input v-model="formData.sellerId" type="text" class="input" placeholder="賣家 ID">
            </div>

            <div v-if="formData.sourceType === 'CONSIGNMENT'">
              <label class="block text-sm font-medium text-gray-700 mb-2">進貨價</label>
              <input v-model.number="formData.costPrice" type="number" step="0.01" class="input" placeholder="0.00">
            </div>
          </div>
        </div>

        <ErrorMessage v-if="error" :message="error" />

        <div class="space-y-3">
          <button type="submit" class="btn btn-primary w-full py-3" :disabled="loading">
            {{ loading ? '儲存中...' : '儲存商品' }}
          </button>
          <button type="button" class="btn btn-secondary w-full" @click="$emit('cancel')">
            取消
          </button>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { CreateProductInput, ProductDetailOutput } from '@astral-hub/shared-types'

interface Props {
  initialData?: ProductDetailOutput
  loading?: boolean
  error?: string
}

interface Emits {
  (e: 'submit', data: CreateProductInput): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = ref<CreateProductInput>({
  type: 'TRADING_CARD',
  category: '',
  name: '',
  description: '',
  sellingPrice: 0,
  costPrice: 0,
  sourceType: 'SELF_OPERATED',
  sellerId: undefined,
  status: 'PENDING',
  images: [],
})

// 如果有初始資料（編輯模式），填入表單
if (props.initialData) {
  formData.value = {
    type: props.initialData.type,
    category: props.initialData.category,
    name: props.initialData.name,
    description: props.initialData.description,
    sellingPrice: parseFloat(props.initialData.sellingPrice),
    costPrice: props.initialData.costPrice ? parseFloat(props.initialData.costPrice) : 0,
    sourceType: props.initialData.sourceType,
    sellerId: props.initialData.sellerId,
    status: props.initialData.status,
    images: props.initialData.images || [],
  }
}

const handleSubmit = (): void => {
  emit('submit', formData.value)
}
</script>
```

---

## 五、商品詳情頁

### 5.1 Product Detail Page

```vue
<!-- apps/admin-web/pages/products/[id]/index.vue -->

<template>
  <div>
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <template v-else-if="product">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900">商品詳情</h1>
        <div class="flex gap-3">
          <NuxtLink :to="`/products/${product.id}/edit`" class="btn btn-primary">
            編輯商品
          </NuxtLink>
          <button class="btn btn-danger" @click="handleDelete">
            刪除商品
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左側：商品資訊 -->
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <h2 class="font-bold text-xl mb-4">基本資訊</h2>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-gray-600">商品 ID</dt>
                <dd class="font-medium">{{ product.id }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-600">類型</dt>
                <dd class="font-medium">{{ product.type }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-600">類別</dt>
                <dd class="font-medium">{{ product.category }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-600">狀態</dt>
                <dd>
                  <span
                    class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(product.status)"
                  >
                    {{ getStatusText(product.status) }}
                  </span>
                </dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-gray-600">商品名稱</dt>
                <dd class="font-medium">{{ product.name }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-gray-600">商品描述</dt>
                <dd class="text-gray-700 whitespace-pre-wrap">{{ product.description || '無' }}</dd>
              </div>
            </dl>
          </div>

          <div class="card">
            <h2 class="font-bold text-xl mb-4">價格資訊</h2>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-gray-600">售價</dt>
                <dd class="font-bold text-2xl text-primary-600">NT$ {{ formatPrice(product.sellingPrice) }}</dd>
              </div>
              <div v-if="product.costPrice">
                <dt class="text-sm text-gray-600">進貨價</dt>
                <dd class="font-medium">NT$ {{ formatPrice(product.costPrice) }}</dd>
              </div>
            </dl>
          </div>

          <div class="card">
            <h2 class="font-bold text-xl mb-4">商品圖片</h2>
            <div class="grid grid-cols-4 gap-4">
              <div
                v-for="(image, index) in product.images"
                :key="index"
                class="aspect-square overflow-hidden rounded-md border border-gray-300"
              >
                <img :src="image" :alt="`圖片 ${index + 1}`" class="w-full h-full object-cover">
              </div>
              <div v-if="!product.images || product.images.length === 0" class="text-gray-500">
                無圖片
              </div>
            </div>
          </div>
        </div>

        <!-- 右側：來源與 QR Code -->
        <div class="lg:col-span-1 space-y-6">
          <div class="card">
            <h2 class="font-bold text-xl mb-4">來源資訊</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-600">來源類型</dt>
                <dd class="font-medium">{{ product.sourceType === 'SELF_OPERATED' ? '自營' : '寄賣' }}</dd>
              </div>
              <div v-if="product.sellerId">
                <dt class="text-sm text-gray-600">賣家 ID</dt>
                <dd class="font-medium">{{ product.sellerId }}</dd>
              </div>
            </dl>
          </div>

          <div class="card">
            <h2 class="font-bold text-xl mb-4">QR Code</h2>
            <div v-if="product.qrCode" class="text-center">
              <img :src="product.qrCode" alt="QR Code" class="mx-auto w-48 h-48">
              <p class="text-sm text-gray-500 mt-2">掃描查看商品詳情</p>
            </div>
            <p v-else class="text-gray-500 text-center">無 QR Code</p>
          </div>

          <div class="card">
            <h2 class="font-bold text-xl mb-4">時間資訊</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-600">建立時間</dt>
                <dd class="font-medium">{{ formatDateTime(product.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-600">更新時間</dt>
                <dd class="font-medium">{{ formatDateTime(product.updatedAt) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </template>

    <ErrorMessage v-else-if="error" :message="error" />
  </div>
</template>

<script setup lang="ts">
import type { ProductDetailOutput, ProductStatus } from '@astral-hub/shared-types'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()
const productsApi = useProductsApi()

const product = ref<ProductDetailOutput | null>(null)
const loading = ref(false)
const error = ref('')

const productId = computed(() => route.params.id as string)

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

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW')
}

const getStatusText = (status: ProductStatus): string => {
  const statusMap: Record<ProductStatus, string> = {
    PENDING: '待上架',
    AVAILABLE: '可購買',
    SOLD: '已售出',
  }
  return statusMap[status] || status
}

const getStatusClass = (status: ProductStatus): string => {
  const classMap: Record<ProductStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    SOLD: 'bg-gray-100 text-gray-800',
  }
  return classMap[status] || ''
}

const handleDelete = async (): Promise<void> => {
  if (!confirm('確定要刪除此商品嗎？此操作無法復原！')) return

  try {
    await productsApi.delete(productId.value)
    router.push('/products')
  } catch (err) {
    alert(handleApiError(err))
  }
}

onMounted(() => {
  fetchProduct()
})

// SEO
useHead({
  title: '商品詳情 | 卡牌商城後台',
})
</script>
```

---

## 六、驗收標準

- [ ] 商品列表頁正常顯示，包含搜尋、篩選、分頁功能
- [ ] DataTable 組件支援多選與批量操作
- [ ] 新增商品功能正常運作
- [ ] 編輯商品功能正常運作
- [ ] 商品詳情頁正確顯示完整資訊
- [ ] 刪除商品功能正常運作（含確認）
- [ ] 圖片上傳功能正常運作（base64）
- [ ] QR Code 正確顯示
- [ ] 表單驗證正常運作
- [ ] 響應式設計在手機/平板/桌面正常顯示
- [ ] 無使用 `any` 型別（除單元測試外）
- [ ] Loading 與 Error 狀態正確處理

---

## 七、注意事項

1. **圖片上傳**：
   - 目前使用 base64 編碼儲存
   - Task 20 整合 GCS 後改為上傳至雲端
   - 限制檔案大小與數量

2. **批量操作**：
   - 批量更新狀態功能預留
   - 批量刪除功能預留
   - 需要後端 API 支援

3. **表單驗證**：
   - 必填欄位使用 HTML5 required
   - 價格使用 number input
   - 寄賣商品需填入賣家 ID

4. **QR Code**：
   - 顯示商品的 QR Code（Task 05 已生成）
   - 可用於門市掃描查詢

5. **權限控制**：
   - 目前所有登入管理員皆可操作
   - Phase 2 加入細緻權限控制

---

## 八、後續任務

- **Task 16**: Admin Web Orders（訂單管理）
- **Task 17**: Admin Web Analytics（報表儀表板）
- **Task 20**: Third-party GCS（整合 Google Cloud Storage）
