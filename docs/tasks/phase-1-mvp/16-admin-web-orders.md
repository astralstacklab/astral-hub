# Task 16: 後台訂單管理

## 概述

建立後台訂單管理功能，包含訂單列表、詳情查看、狀態更新、付款處理與訂單匯出。

## 依賴

- Task 07: Orders API（訂單 API 已建立）
- Task 08: Payments API（付款 API 已建立）
- Task 14: Admin Web Setup（後台基礎已建立）

---

## 一、擴充 API Composables

### 1.1 Orders API

```typescript
// apps/admin-web/composables/useOrdersApi.ts

import type {
  QueryOrdersInput,
  OrderListOutput,
  OrderDetailOutput,
  UpdateOrderStatusInput,
} from '@astral-hub/shared-types'

export const useOrdersApi = () => {
  const { apiFetch } = useApiClient()

  return {
    /**
     * 獲取訂單列表
     */
    list: async (query: QueryOrdersInput): Promise<OrderListOutput> => {
      return await apiFetch<OrderListOutput>('/api/orders', {
        method: 'GET',
        query: query as Record<string, string | number>,
      })
    },

    /**
     * 獲取訂單詳情
     */
    detail: async (id: string): Promise<OrderDetailOutput> => {
      return await apiFetch<OrderDetailOutput>(`/api/orders/${id}`, {
        method: 'GET',
      })
    },

    /**
     * 更新訂單狀態
     */
    updateStatus: async (id: string, data: UpdateOrderStatusInput): Promise<OrderDetailOutput> => {
      return await apiFetch<OrderDetailOutput>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: data,
      })
    },
  }
}
```

### 1.2 Payments API

```typescript
// apps/admin-web/composables/usePaymentsApi.ts

import type { UpdatePaymentStatusInput } from '@astral-hub/shared-types'

export const usePaymentsApi = () => {
  const { apiFetch } = useApiClient()

  return {
    /**
     * 更新付款狀態
     */
    updateStatus: async (orderId: string, data: UpdatePaymentStatusInput): Promise<void> => {
      await apiFetch<void>(`/api/payments/${orderId}/status`, {
        method: 'PATCH',
        body: data,
      })
    },
  }
}
```

---

## 二、訂單列表頁

### 2.1 Orders Index Page

```vue
<!-- apps/admin-web/pages/orders/index.vue -->

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900">訂單管理</h1>
      <button class="btn btn-secondary" @click="handleExport">
        匯出訂單
      </button>
    </div>

    <!-- 搜尋與篩選 -->
    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋訂單編號..."
          class="input"
          @keyup.enter="handleSearch"
        >
        <select v-model="filters.status" class="input" @change="handleFilterChange">
          <option value="">全部狀態</option>
          <option value="PENDING">待處理</option>
          <option value="CONFIRMED">已確認</option>
          <option value="SHIPPING">配送中</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>
        <select v-model="filters.paymentStatus" class="input" @change="handleFilterChange">
          <option value="">付款狀態</option>
          <option value="PENDING">待付款</option>
          <option value="PAID">已付款</option>
          <option value="FAILED">付款失敗</option>
        </select>
        <select v-model="filters.channel" class="input" @change="handleFilterChange">
          <option value="">全部通路</option>
          <option value="ONLINE">線上</option>
          <option value="POS">門市</option>
        </select>
        <button class="btn btn-secondary" @click="resetFilters">
          重置篩選
        </button>
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="card">
        <p class="text-sm text-gray-600 mb-1">待處理訂單</p>
        <p class="text-2xl font-bold text-orange-600">{{ stats.pending }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-600 mb-1">配送中訂單</p>
        <p class="text-2xl font-bold text-blue-600">{{ stats.shipping }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-600 mb-1">已完成訂單</p>
        <p class="text-2xl font-bold text-green-600">{{ stats.completed }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-600 mb-1">今日營收</p>
        <p class="text-2xl font-bold text-primary-600">NT$ {{ formatPrice(stats.todayRevenue) }}</p>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <!-- Error -->
    <ErrorMessage v-else-if="error" :message="error" />

    <!-- 訂單列表 -->
    <template v-else>
      <DataTable
        :columns="columns"
        :data="orders"
        has-actions
      >
        <!-- 訂單編號欄位 -->
        <template #cell-orderNumber="{ value, row }">
          <NuxtLink
            :to="`/orders/${row.id}`"
            class="text-primary-600 hover:text-primary-800 font-medium"
          >
            {{ value }}
          </NuxtLink>
        </template>

        <!-- 通路欄位 -->
        <template #cell-channel="{ value }">
          <span
            class="inline-block px-2 py-1 rounded-full text-xs font-medium"
            :class="value === 'ONLINE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'"
          >
            {{ value === 'ONLINE' ? '線上' : '門市' }}
          </span>
        </template>

        <!-- 訂單狀態欄位 -->
        <template #cell-status="{ value }">
          <span
            class="inline-block px-2 py-1 rounded-full text-xs font-medium"
            :class="getOrderStatusClass(value)"
          >
            {{ getOrderStatusText(value) }}
          </span>
        </template>

        <!-- 付款狀態欄位 -->
        <template #cell-paymentStatus="{ value }">
          <span
            class="inline-block px-2 py-1 rounded-full text-xs font-medium"
            :class="getPaymentStatusClass(value)"
          >
            {{ getPaymentStatusText(value) }}
          </span>
        </template>

        <!-- 金額欄位 -->
        <template #cell-totalAmount="{ value }">
          <span class="font-medium text-gray-900">
            NT$ {{ formatPrice(value) }}
          </span>
        </template>

        <!-- 操作欄位 -->
        <template #actions="{ row }">
          <div class="flex gap-2 justify-end">
            <NuxtLink
              :to="`/orders/${row.id}`"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              查看詳情
            </NuxtLink>
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
import type { OrderStatus, PaymentStatus } from '@astral-hub/shared-types'

definePageMeta({
  middleware: ['auth'],
})

const ordersApi = useOrdersApi()

const orders = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')

const searchQuery = ref('')
const filters = ref({
  status: '' as OrderStatus | '',
  paymentStatus: '' as PaymentStatus | '',
  channel: '',
})
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 20

const stats = ref({
  pending: 0,
  shipping: 0,
  completed: 0,
  todayRevenue: '0',
})

const columns = [
  { key: 'orderNumber', label: '訂單編號' },
  { key: 'channel', label: '通路' },
  { key: 'status', label: '訂單狀態' },
  { key: 'paymentStatus', label: '付款狀態' },
  { key: 'totalAmount', label: '訂單金額' },
  { key: 'createdAt', label: '建立時間' },
]

// 獲取訂單列表
const fetchOrders = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    const response = await ordersApi.list({
      page: currentPage.value,
      pageSize,
      orderNumber: searchQuery.value || undefined,
      status: filters.value.status || undefined,
      paymentStatus: filters.value.paymentStatus || undefined,
      channel: filters.value.channel as 'ONLINE' | 'POS' | undefined,
    })

    orders.value = response.orders.map(o => ({
      ...o,
      createdAt: new Date(o.createdAt).toLocaleString('zh-TW'),
    }))
    totalPages.value = response.pagination.totalPages

    // 計算統計數據（簡化版，實際應從 API 獲取）
    stats.value = {
      pending: response.orders.filter(o => o.status === 'PENDING').length,
      shipping: response.orders.filter(o => o.status === 'SHIPPING').length,
      completed: response.orders.filter(o => o.status === 'COMPLETED').length,
      todayRevenue: response.orders
        .filter(o => {
          const today = new Date().toDateString()
          const orderDate = new Date(o.createdAt).toDateString()
          return today === orderDate && o.paymentStatus === 'PAID'
        })
        .reduce((sum, o) => sum + parseFloat(o.totalAmount as string), 0)
        .toFixed(2),
    }
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const getOrderStatusText = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    PENDING: '待處理',
    CONFIRMED: '已確認',
    SHIPPING: '配送中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return statusMap[status] || status
}

const getOrderStatusClass = (status: OrderStatus): string => {
  const classMap: Record<OrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    SHIPPING: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }
  return classMap[status] || ''
}

const getPaymentStatusText = (status: PaymentStatus): string => {
  const statusMap: Record<PaymentStatus, string> = {
    PENDING: '待付款',
    PAID: '已付款',
    FAILED: '付款失敗',
  }
  return statusMap[status] || status
}

const getPaymentStatusClass = (status: PaymentStatus): string => {
  const classMap: Record<PaymentStatus, string> = {
    PENDING: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  }
  return classMap[status] || ''
}

const handleSearch = (): void => {
  currentPage.value = 1
  fetchOrders()
}

const handleFilterChange = (): void => {
  currentPage.value = 1
  fetchOrders()
}

const resetFilters = (): void => {
  searchQuery.value = ''
  filters.value = { status: '', paymentStatus: '', channel: '' }
  currentPage.value = 1
  fetchOrders()
}

const handlePageChange = (page: number): void => {
  currentPage.value = page
  fetchOrders()
}

const handleExport = (): void => {
  // TODO: 實作訂單匯出功能
  alert('訂單匯出功能將在後續實作')
}

onMounted(() => {
  fetchOrders()
})

// SEO
useHead({
  title: '訂單管理 | 卡牌商城後台',
})
</script>
```

---

## 三、訂單詳情頁

### 3.1 Order Detail Page

```vue
<!-- apps/admin-web/pages/orders/[id]/index.vue -->

<template>
  <div>
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <template v-else-if="order">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">訂單詳情</h1>
          <p class="text-gray-600 mt-1">訂單編號：{{ order.orderNumber }}</p>
        </div>
        <NuxtLink to="/orders" class="btn btn-secondary">
          返回列表
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左側：訂單資訊 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 訂單狀態 -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-bold text-xl">訂單狀態</h2>
              <button
                v-if="order.status !== 'COMPLETED' && order.status !== 'CANCELLED'"
                class="btn btn-sm btn-primary"
                @click="showStatusModal = true"
              >
                更新狀態
              </button>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600 mb-1">訂單狀態</p>
                <span
                  class="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  :class="getOrderStatusClass(order.status)"
                >
                  {{ getOrderStatusText(order.status) }}
                </span>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">付款狀態</p>
                <span
                  class="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  :class="getPaymentStatusClass(order.paymentStatus)"
                >
                  {{ getPaymentStatusText(order.paymentStatus) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 訂單項目 -->
          <div class="card">
            <h2 class="font-bold text-xl mb-4">訂單項目</h2>
            <div class="divide-y divide-gray-200">
              <div
                v-for="item in order.orderItems"
                :key="item.id"
                class="py-4 flex items-center gap-4"
              >
                <div class="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <img
                    v-if="item.product.images && item.product.images.length > 0"
                    :src="item.product.images[0]"
                    :alt="item.product.name"
                    class="w-full h-full object-cover"
                  >
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{{ item.product.name }}</h3>
                  <p class="text-sm text-gray-500">{{ item.product.category }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-600">NT$ {{ formatPrice(item.unitPrice) }} × {{ item.quantity }}</p>
                  <p class="font-medium text-gray-900">NT$ {{ formatPrice(item.subtotal) }}</p>
                </div>
              </div>
            </div>

            <!-- 金額統計 -->
            <div class="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">商品小計</span>
                <span class="font-medium">NT$ {{ formatPrice(order.subtotal) }}</span>
              </div>
              <div v-if="order.shippingFee && parseFloat(order.shippingFee) > 0" class="flex justify-between text-sm">
                <span class="text-gray-600">運費</span>
                <span class="font-medium">NT$ {{ formatPrice(order.shippingFee) }}</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                <span class="font-bold text-lg">訂單總額</span>
                <span class="font-bold text-2xl text-primary-600">
                  NT$ {{ formatPrice(order.totalAmount) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 收件人資訊 -->
          <div class="card">
            <h2 class="font-bold text-xl mb-4">收件人資訊</h2>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-gray-600">姓名</dt>
                <dd class="font-medium">{{ order.recipientName }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-600">手機</dt>
                <dd class="font-medium">{{ order.recipientPhone }}</dd>
              </div>
              <div v-if="order.recipientEmail" class="col-span-2">
                <dt class="text-sm text-gray-600">電子郵件</dt>
                <dd class="font-medium">{{ order.recipientEmail }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-gray-600">配送方式</dt>
                <dd class="font-medium">{{ getShippingMethodText(order.shippingMethod) }}</dd>
              </div>
              <div v-if="order.shippingAddress" class="col-span-2">
                <dt class="text-sm text-gray-600">配送地址</dt>
                <dd class="font-medium">{{ order.shippingAddress }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- 右側：其他資訊 -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 付款資訊 -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-bold text-xl">付款資訊</h2>
              <button
                v-if="order.paymentStatus === 'PENDING' && order.paymentMethod === 'CASH'"
                class="btn btn-sm btn-primary"
                @click="handleConfirmPayment"
              >
                確認付款
              </button>
            </div>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-600">付款方式</dt>
                <dd class="font-medium">{{ getPaymentMethodText(order.paymentMethod) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-600">付款狀態</dt>
                <dd>
                  <span
                    class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                    :class="getPaymentStatusClass(order.paymentStatus)"
                  >
                    {{ getPaymentStatusText(order.paymentStatus) }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <!-- 訂單備註 -->
          <div v-if="order.note" class="card">
            <h2 class="font-bold text-xl mb-4">訂單備註</h2>
            <p class="text-gray-700 whitespace-pre-wrap">{{ order.note }}</p>
          </div>

          <!-- 時間資訊 -->
          <div class="card">
            <h2 class="font-bold text-xl mb-4">時間資訊</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-600">建立時間</dt>
                <dd class="font-medium">{{ formatDateTime(order.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-600">更新時間</dt>
                <dd class="font-medium">{{ formatDateTime(order.updatedAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- 系統資訊 -->
          <div class="card">
            <h2 class="font-bold text-xl mb-4">系統資訊</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-600">訂單 ID</dt>
                <dd class="font-medium text-xs break-all">{{ order.id }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-600">訂單通路</dt>
                <dd class="font-medium">{{ order.channel === 'ONLINE' ? '線上訂單' : '門市訂單' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </template>

    <ErrorMessage v-else-if="error" :message="error" />

    <!-- 更新狀態 Modal -->
    <Modal v-if="showStatusModal" title="更新訂單狀態" @close="showStatusModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">訂單狀態</label>
          <select v-model="newStatus" class="input">
            <option value="PENDING">待處理</option>
            <option value="CONFIRMED">已確認</option>
            <option value="SHIPPING">配送中</option>
            <option value="COMPLETED">已完成</option>
            <option value="CANCELLED">已取消</option>
          </select>
        </div>

        <ErrorMessage v-if="updateError" :message="updateError" />

        <div class="flex gap-3">
          <button
            class="btn btn-primary flex-1"
            :disabled="updating"
            @click="handleUpdateStatus"
          >
            {{ updating ? '更新中...' : '確認更新' }}
          </button>
          <button class="btn btn-secondary flex-1" @click="showStatusModal = false">
            取消
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { OrderDetailOutput, OrderStatus, PaymentStatus } from '@astral-hub/shared-types'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const ordersApi = useOrdersApi()
const paymentsApi = usePaymentsApi()

const order = ref<OrderDetailOutput | null>(null)
const loading = ref(false)
const error = ref('')

const showStatusModal = ref(false)
const newStatus = ref<OrderStatus>('PENDING')
const updating = ref(false)
const updateError = ref('')

const orderId = computed(() => route.params.id as string)

const fetchOrder = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    order.value = await ordersApi.detail(orderId.value)
    newStatus.value = order.value.status
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

const getOrderStatusText = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    PENDING: '待處理',
    CONFIRMED: '已確認',
    SHIPPING: '配送中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return statusMap[status] || status
}

const getOrderStatusClass = (status: OrderStatus): string => {
  const classMap: Record<OrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    SHIPPING: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }
  return classMap[status] || ''
}

const getPaymentStatusText = (status: PaymentStatus): string => {
  const statusMap: Record<PaymentStatus, string> = {
    PENDING: '待付款',
    PAID: '已付款',
    FAILED: '付款失敗',
  }
  return statusMap[status] || status
}

const getPaymentStatusClass = (status: PaymentStatus): string => {
  const classMap: Record<PaymentStatus, string> = {
    PENDING: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  }
  return classMap[status] || ''
}

const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    CASH: '貨到付款',
    CREDIT_CARD: '信用卡',
    LINE_PAY: 'LINE Pay',
  }
  return methodMap[method] || method
}

const getShippingMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    HOME_DELIVERY: '宅配',
    STORE_PICKUP: '門市自取',
    SEVEN_ELEVEN: '7-11 取貨',
    FAMILY_MART: '全家取貨',
  }
  return methodMap[method] || method
}

const handleUpdateStatus = async (): Promise<void> => {
  updating.value = true
  updateError.value = ''

  try {
    await ordersApi.updateStatus(orderId.value, { status: newStatus.value })
    showStatusModal.value = false
    await fetchOrder()
  } catch (err) {
    updateError.value = handleApiError(err)
  } finally {
    updating.value = false
  }
}

const handleConfirmPayment = async (): Promise<void> => {
  if (!confirm('確定要確認此訂單已付款嗎？')) return

  try {
    await paymentsApi.updateStatus(orderId.value, {
      paymentStatus: 'PAID',
      paymentMethod: order.value?.paymentMethod || 'CASH',
    })
    await fetchOrder()
  } catch (err) {
    alert(handleApiError(err))
  }
}

onMounted(() => {
  fetchOrder()
})

// SEO
useHead({
  title: '訂單詳情 | 卡牌商城後台',
})
</script>
```

---

## 四、共用元件

### 4.1 Modal 組件

```vue
<!-- apps/admin-web/components/Modal.vue -->

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click="handleBackdropClick"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        @click.stop
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">{{ title }}</h3>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="$emit('close')"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleBackdropClick = (): void => {
  emit('close')
}

// ESC 關閉
onMounted(() => {
  const handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      emit('close')
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

## 五、驗收標準

- [ ] 訂單列表頁正常顯示，包含搜尋、篩選、分頁功能
- [ ] 訂單統計卡片正確顯示數據
- [ ] 訂單詳情頁正確顯示完整資訊
- [ ] 訂單狀態更新功能正常運作
- [ ] 付款狀態確認功能正常運作（貨到付款）
- [ ] 訂單項目與金額計算正確
- [ ] Modal 組件正常運作（ESC 關閉、背景點擊關閉）
- [ ] 響應式設計在手機/平板/桌面正常顯示
- [ ] 無使用 `any` 型別（除單元測試外）
- [ ] Loading 與 Error 狀態正確處理

---

## 六、注意事項

1. **訂單狀態流程**：
   - PENDING → CONFIRMED → SHIPPING → COMPLETED
   - 可跳過中間狀態直接更新
   - CANCELLED 狀態無法回復

2. **付款確認**：
   - 僅貨到付款可手動確認付款
   - 信用卡/LINE Pay 由綠界回調自動更新
   - 付款狀態與訂單狀態獨立管理

3. **權限控制**：
   - 目前所有登入管理員皆可操作
   - Phase 2 加入細緻權限控制
   - 記錄操作日誌（未來實作）

4. **訂單匯出**：
   - 預留匯出功能
   - 可匯出為 CSV 或 Excel
   - 支援日期範圍篩選

5. **即時通知**：
   - Phase 2 整合 WebSocket 即時訂單通知
   - 新訂單提醒
   - 訂單狀態變更通知

---

## 七、後續任務

- **Task 17**: Admin Web Analytics（報表儀表板）
- **Task 19**: Third-party ECPay（整合綠界金流回調）
- **Phase 2**: 訂單操作日誌、即時通知、退款處理
