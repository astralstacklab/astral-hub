# Task 17: 後台報表分析

## 概述

建立後台報表分析儀表板，整合 Task 09 報表 API，提供銷售分析、商品統計、賣家佣金等報表視覺化。

## 依賴

- Task 09: Analytics API（報表 API 已建立）
- Task 14: Admin Web Setup（後台基礎已建立）

---

## 一、擴充 API Composables

### 1.1 Analytics API

```typescript
// apps/admin-web/composables/useAnalyticsApi.ts

import type {
  QuerySalesReportInput,
  SalesReportOutput,
  QueryProductStatsInput,
  ProductStatsOutput,
  QuerySellerCommissionInput,
  SellerCommissionOutput,
  DashboardOutput,
} from '@astral-hub/shared-types'

export const useAnalyticsApi = () => {
  const { apiFetch } = useApiClient()

  return {
    /**
     * 獲取銷售報表
     */
    salesReport: async (query: QuerySalesReportInput): Promise<SalesReportOutput> => {
      return await apiFetch<SalesReportOutput>('/api/analytics/sales', {
        method: 'GET',
        query: query as Record<string, string>,
      })
    },

    /**
     * 獲取商品統計
     */
    productStats: async (query: QueryProductStatsInput): Promise<ProductStatsOutput> => {
      return await apiFetch<ProductStatsOutput>('/api/analytics/products', {
        method: 'GET',
        query: query as Record<string, string | number>,
      })
    },

    /**
     * 獲取賣家佣金報表
     */
    sellerCommission: async (query: QuerySellerCommissionInput): Promise<SellerCommissionOutput> => {
      return await apiFetch<SellerCommissionOutput>('/api/analytics/sellers', {
        method: 'GET',
        query: query as Record<string, string>,
      })
    },

    /**
     * 獲取儀表板數據
     */
    dashboard: async (): Promise<DashboardOutput> => {
      return await apiFetch<DashboardOutput>('/api/analytics/dashboard', {
        method: 'GET',
      })
    },

    /**
     * 匯出 CSV
     */
    exportCSV: async (reportType: string, startDate: string, endDate: string): Promise<Blob> => {
      return await apiFetch<Blob>(`/api/analytics/export`, {
        method: 'GET',
        query: { reportType, startDate, endDate },
        responseType: 'blob',
      })
    },
  }
}
```

---

## 二、儀表板首頁（更新）

### 2.1 更新 Dashboard Page

```vue
<!-- apps/admin-web/pages/index.vue -->

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">儀表板</h1>

    <LoadingSpinner v-if="loading" container-class="py-12" />

    <template v-else-if="data">
      <!-- 總覽統計 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="總營收"
          :value="`NT$ ${formatNumber(parseFloat(data.overview.totalRevenue))}`"
          icon="💰"
          color="blue"
        />
        <StatsCard
          title="總訂單"
          :value="formatNumber(data.overview.totalOrders)"
          icon="📦"
          color="green"
        />
        <StatsCard
          title="總商品"
          :value="formatNumber(data.overview.totalProducts)"
          icon="🎴"
          color="purple"
        />
        <StatsCard
          title="活躍賣家"
          :value="formatNumber(data.overview.activeSellers)"
          icon="👥"
          color="orange"
        />
      </div>

      <!-- 近期趨勢 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="card">
          <h2 class="font-bold text-xl mb-4">近 7 天趨勢</h2>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-gray-600">營收</dt>
              <dd class="font-bold text-primary-600">
                NT$ {{ formatNumber(parseFloat(data.recentTrends.last7Days.revenue)) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">訂單數</dt>
              <dd class="font-medium">{{ data.recentTrends.last7Days.orders }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">成長率</dt>
              <dd
                class="font-medium"
                :class="data.recentTrends.last7Days.growth >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ data.recentTrends.last7Days.growth >= 0 ? '+' : '' }}{{ data.recentTrends.last7Days.growth }}%
              </dd>
            </div>
          </dl>
        </div>

        <div class="card">
          <h2 class="font-bold text-xl mb-4">近 30 天趨勢</h2>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-gray-600">營收</dt>
              <dd class="font-bold text-primary-600">
                NT$ {{ formatNumber(parseFloat(data.recentTrends.last30Days.revenue)) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">訂單數</dt>
              <dd class="font-medium">{{ data.recentTrends.last30Days.orders }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">成長率</dt>
              <dd
                class="font-medium"
                :class="data.recentTrends.last30Days.growth >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ data.recentTrends.last30Days.growth >= 0 ? '+' : '' }}{{ data.recentTrends.last30Days.growth }}%
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- 快速統計 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <p class="text-sm text-gray-600 mb-1">待處理訂單</p>
          <p class="text-2xl font-bold text-orange-600">{{ data.quickStats.pendingOrders }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600 mb-1">待付款訂單</p>
          <p class="text-2xl font-bold text-red-600">{{ data.quickStats.pendingPayments }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600 mb-1">進行中競標</p>
          <p class="text-2xl font-bold text-blue-600">{{ data.quickStats.activeAuctions }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-600 mb-1">低庫存商品</p>
          <p class="text-2xl font-bold text-purple-600">{{ data.quickStats.lowStockProducts }}</p>
        </div>
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
    </template>

    <ErrorMessage v-else-if="error" :message="error" />
  </div>
</template>

<script setup lang="ts">
import type { DashboardOutput } from '@astral-hub/shared-types'

definePageMeta({
  middleware: ['auth'],
})

const analyticsApi = useAnalyticsApi()
const authStore = useAuthStore()

const data = ref<DashboardOutput | null>(null)
const loading = ref(false)
const error = ref('')

const fetchDashboard = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    data.value = await analyticsApi.dashboard()
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-TW')
}

onMounted(() => {
  fetchDashboard()
})

// SEO
useHead({
  title: '儀表板 | 卡牌商城後台',
})
</script>
```

---

## 三、報表分析頁面

### 3.1 Analytics Index Page

```vue
<!-- apps/admin-web/pages/analytics/index.vue -->

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">報表分析</h1>

    <!-- 報表類型選擇 -->
    <div class="mb-6 flex space-x-4">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="btn"
        :class="activeTab === tab.value ? 'btn-primary' : 'btn-secondary'"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 銷售報表 -->
    <div v-if="activeTab === 'sales'">
      <SalesReport />
    </div>

    <!-- 商品統計 -->
    <div v-else-if="activeTab === 'products'">
      <ProductStatsReport />
    </div>

    <!-- 賣家佣金 -->
    <div v-else-if="activeTab === 'sellers'">
      <SellerCommissionReport />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const tabs = [
  { label: '銷售報表', value: 'sales' },
  { label: '商品統計', value: 'products' },
  { label: '賣家佣金', value: 'sellers' },
]

const activeTab = ref('sales')

// SEO
useHead({
  title: '報表分析 | 卡牌商城後台',
})
</script>
```

---

## 四、報表組件

### 4.1 SalesReport 銷售報表

```vue
<!-- apps/admin-web/components/SalesReport.vue -->

<template>
  <div class="space-y-6">
    <!-- 日期範圍選擇 -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select v-model="period" class="input" @change="handlePeriodChange">
          <option value="DAILY">每日</option>
          <option value="WEEKLY">每週</option>
          <option value="MONTHLY">每月</option>
          <option value="CUSTOM">自訂範圍</option>
        </select>
        <input
          v-model="startDate"
          type="date"
          class="input"
          :max="endDate"
          @change="fetchReport"
        >
        <input
          v-if="period === 'CUSTOM'"
          v-model="endDate"
          type="date"
          class="input"
          :min="startDate"
          @change="fetchReport"
        >
        <button class="btn btn-primary" @click="handleExport">
          匯出 CSV
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" container-class="py-12" />

    <template v-else-if="report">
      <!-- 總覽 -->
      <div class="card">
        <h2 class="font-bold text-xl mb-4">總覽</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p class="text-sm text-gray-600 mb-1">總營收</p>
            <p class="text-2xl font-bold text-primary-600">
              NT$ {{ formatNumber(parseFloat(report.summary.totalRevenue)) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">總訂單</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatNumber(report.summary.totalOrders) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">總商品</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatNumber(report.summary.totalProducts) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">平均訂單金額</p>
            <p class="text-2xl font-bold text-gray-900">
              NT$ {{ formatNumber(parseFloat(report.summary.averageOrderValue)) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 分類統計 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h2 class="font-bold text-xl mb-4">來源統計</h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm text-gray-600 mb-1">自營</dt>
              <dd class="flex items-center justify-between">
                <span class="font-medium">NT$ {{ formatNumber(parseFloat(report.breakdown.selfOperated.revenue)) }}</span>
                <span class="text-sm text-gray-500">{{ report.breakdown.selfOperated.orders }} 筆訂單</span>
              </dd>
              <div class="mt-1 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full"
                  :style="{ width: `${getSelfOperatedPercentage(report)}%` }"
                />
              </div>
            </div>
            <div>
              <dt class="text-sm text-gray-600 mb-1">寄賣</dt>
              <dd class="flex items-center justify-between">
                <span class="font-medium">NT$ {{ formatNumber(parseFloat(report.breakdown.consignment.revenue)) }}</span>
                <span class="text-sm text-gray-500">{{ report.breakdown.consignment.orders }} 筆訂單</span>
              </dd>
              <div class="mt-1 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-green-600 h-2 rounded-full"
                  :style="{ width: `${getConsignmentPercentage(report)}%` }"
                />
              </div>
              <p class="text-sm text-gray-500 mt-1">
                平台抽成：NT$ {{ formatNumber(parseFloat(report.breakdown.consignment.commission)) }}
              </p>
            </div>
          </dl>
        </div>

        <div class="card">
          <h2 class="font-bold text-xl mb-4">通路統計</h2>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm text-gray-600 mb-1">線上訂單</dt>
              <dd class="flex items-center justify-between">
                <span class="font-medium">NT$ {{ formatNumber(parseFloat(report.channels.online.revenue)) }}</span>
                <span class="text-sm text-gray-500">{{ report.channels.online.orders }} 筆</span>
              </dd>
              <div class="mt-1 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-purple-600 h-2 rounded-full"
                  :style="{ width: `${getOnlinePercentage(report)}%` }"
                />
              </div>
            </div>
            <div>
              <dt class="text-sm text-gray-600 mb-1">門市訂單</dt>
              <dd class="flex items-center justify-between">
                <span class="font-medium">NT$ {{ formatNumber(parseFloat(report.channels.pos.revenue)) }}</span>
                <span class="text-sm text-gray-500">{{ report.channels.pos.orders }} 筆</span>
              </dd>
              <div class="mt-1 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-orange-600 h-2 rounded-full"
                  :style="{ width: `${getPOSPercentage(report)}%` }"
                />
              </div>
            </div>
          </dl>
        </div>
      </div>

      <!-- 每日數據 -->
      <div class="card">
        <h2 class="font-bold text-xl mb-4">每日數據</h2>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>日期</th>
                <th class="text-right">營收</th>
                <th class="text-right">訂單數</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in report.dailyData" :key="day.date">
                <td>{{ formatDate(day.date) }}</td>
                <td class="text-right font-medium">NT$ {{ formatNumber(parseFloat(day.revenue)) }}</td>
                <td class="text-right">{{ day.orders }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <ErrorMessage v-else-if="error" :message="error" />
  </div>
</template>

<script setup lang="ts">
import type { SalesReportOutput, AnalyticsPeriod } from '@astral-hub/shared-types'

const analyticsApi = useAnalyticsApi()

const period = ref<AnalyticsPeriod>('DAILY')
const startDate = ref(new Date().toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

const report = ref<SalesReportOutput | null>(null)
const loading = ref(false)
const error = ref('')

const fetchReport = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    report.value = await analyticsApi.salesReport({
      period: period.value,
      startDate: startDate.value,
      endDate: period.value === 'CUSTOM' ? endDate.value : undefined,
    })
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const handlePeriodChange = (): void => {
  if (period.value !== 'CUSTOM') {
    endDate.value = startDate.value
  }
  fetchReport()
}

const handleExport = async (): Promise<void> => {
  try {
    const blob = await analyticsApi.exportCSV('sales', startDate.value, endDate.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${startDate.value}-${endDate.value}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    alert(handleApiError(err))
  }
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-TW')
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW')
}

const getSelfOperatedPercentage = (report: SalesReportOutput): number => {
  const total = parseFloat(report.summary.totalRevenue)
  if (total === 0) return 0
  return Math.round((parseFloat(report.breakdown.selfOperated.revenue) / total) * 100)
}

const getConsignmentPercentage = (report: SalesReportOutput): number => {
  const total = parseFloat(report.summary.totalRevenue)
  if (total === 0) return 0
  return Math.round((parseFloat(report.breakdown.consignment.revenue) / total) * 100)
}

const getOnlinePercentage = (report: SalesReportOutput): number => {
  const total = parseFloat(report.summary.totalRevenue)
  if (total === 0) return 0
  return Math.round((parseFloat(report.channels.online.revenue) / total) * 100)
}

const getPOSPercentage = (report: SalesReportOutput): number => {
  const total = parseFloat(report.summary.totalRevenue)
  if (total === 0) return 0
  return Math.round((parseFloat(report.channels.pos.revenue) / total) * 100)
}

onMounted(() => {
  fetchReport()
})
</script>
```

### 4.2 ProductStatsReport 商品統計

```vue
<!-- apps/admin-web/components/ProductStatsReport.vue -->

<template>
  <div class="space-y-6">
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <template v-else-if="stats">
      <!-- 庫存統計 -->
      <div class="card">
        <h2 class="font-bold text-xl mb-4">庫存統計</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <p class="text-sm text-gray-600 mb-1">總商品數</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.inventory.totalProducts }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">待上架</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.inventory.pending }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">可購買</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.inventory.available }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">已售出</p>
            <p class="text-2xl font-bold text-gray-600">{{ stats.inventory.sold }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-1">寄賣中</p>
            <p class="text-2xl font-bold text-purple-600">{{ stats.inventory.consignment }}</p>
          </div>
        </div>
      </div>

      <!-- 暢銷商品 -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-xl">暢銷商品 TOP 10</h2>
          <button class="btn btn-sm btn-secondary" @click="handleExport">
            匯出 CSV
          </button>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>排名</th>
                <th>商品名稱</th>
                <th>類別</th>
                <th class="text-right">銷售數量</th>
                <th class="text-right">總營收</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, index) in stats.topSelling" :key="product.productId">
                <td>
                  <span
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold"
                    :class="getRankClass(index)"
                  >
                    {{ index + 1 }}
                  </span>
                </td>
                <td class="font-medium">{{ product.productName }}</td>
                <td>{{ product.category }}</td>
                <td class="text-right">{{ product.totalSold }}</td>
                <td class="text-right font-medium">NT$ {{ formatNumber(parseFloat(product.totalRevenue)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 類別統計 -->
      <div class="card">
        <h2 class="font-bold text-xl mb-4">類別統計</h2>
        <div class="space-y-4">
          <div v-for="category in stats.categoryBreakdown" :key="category.category" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ category.category }}</span>
              <span class="text-sm text-gray-600">
                {{ category.count }} 件 | NT$ {{ formatNumber(parseFloat(category.revenue)) }}
              </span>
            </div>
            <div class="bg-gray-200 rounded-full h-2">
              <div
                class="bg-primary-600 h-2 rounded-full"
                :style="{ width: `${getCategoryPercentage(category.count)}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <ErrorMessage v-else-if="error" :message="error" />
  </div>
</template>

<script setup lang="ts">
import type { ProductStatsOutput } from '@astral-hub/shared-types'

const analyticsApi = useAnalyticsApi()

const stats = ref<ProductStatsOutput | null>(null)
const loading = ref(false)
const error = ref('')

const fetchStats = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    stats.value = await analyticsApi.productStats({ limit: 10 })
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const handleExport = async (): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const blob = await analyticsApi.exportCSV('products', today, today)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-stats-${today}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    alert(handleApiError(err))
  }
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-TW')
}

const getRankClass = (index: number): string => {
  if (index === 0) return 'bg-yellow-400 text-white'
  if (index === 1) return 'bg-gray-400 text-white'
  if (index === 2) return 'bg-orange-400 text-white'
  return 'bg-gray-200 text-gray-700'
}

const getCategoryPercentage = (count: number): number => {
  if (!stats.value) return 0
  const total = stats.value.inventory.totalProducts
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

onMounted(() => {
  fetchStats()
})
</script>
```

### 4.3 SellerCommissionReport 賣家佣金報表

```vue
<!-- apps/admin-web/components/SellerCommissionReport.vue -->

<template>
  <div class="space-y-6">
    <!-- 日期範圍選擇 -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          v-model="startDate"
          type="date"
          class="input"
          :max="endDate"
          @change="fetchReport"
        >
        <input
          v-model="endDate"
          type="date"
          class="input"
          :min="startDate"
          @change="fetchReport"
        >
        <button class="btn btn-primary" @click="handleExport">
          匯出 CSV
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" container-class="py-12" />

    <template v-else-if="report">
      <div class="card">
        <h2 class="font-bold text-xl mb-4">賣家佣金報表</h2>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>賣家名稱</th>
                <th>等級</th>
                <th class="text-right">總商品數</th>
                <th class="text-right">已售商品</th>
                <th class="text-right">總營收</th>
                <th class="text-right">平台抽成</th>
                <th class="text-right">賣家所得</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="seller in report.sellers" :key="seller.sellerId">
                <td class="font-medium">{{ seller.sellerName }}</td>
                <td>
                  <span
                    class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                    :class="getTierClass(seller.tier)"
                  >
                    {{ getTierText(seller.tier) }}
                  </span>
                </td>
                <td class="text-right">{{ seller.totalProducts }}</td>
                <td class="text-right">{{ seller.soldProducts }}</td>
                <td class="text-right font-medium">NT$ {{ formatNumber(parseFloat(seller.totalRevenue)) }}</td>
                <td class="text-right text-red-600">
                  NT$ {{ formatNumber(parseFloat(seller.platformCommission)) }}
                  <span class="text-xs text-gray-500">({{ seller.commissionRate }}%)</span>
                </td>
                <td class="text-right font-bold text-green-600">
                  NT$ {{ formatNumber(parseFloat(seller.sellerEarnings)) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-50 font-bold">
                <td colspan="4">總計</td>
                <td class="text-right">NT$ {{ formatNumber(getTotalRevenue()) }}</td>
                <td class="text-right text-red-600">NT$ {{ formatNumber(getTotalCommission()) }}</td>
                <td class="text-right text-green-600">NT$ {{ formatNumber(getTotalEarnings()) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <ErrorMessage v-else-if="error" :message="error" />
  </div>
</template>

<script setup lang="ts">
import type { SellerCommissionOutput } from '@astral-hub/shared-types'

const analyticsApi = useAnalyticsApi()

const startDate = ref(new Date().toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

const report = ref<SellerCommissionOutput | null>(null)
const loading = ref(false)
const error = ref('')

const fetchReport = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    report.value = await analyticsApi.sellerCommission({
      startDate: startDate.value,
      endDate: endDate.value,
    })
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const handleExport = async (): Promise<void> => {
  try {
    const blob = await analyticsApi.exportCSV('sellers', startDate.value, endDate.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seller-commission-${startDate.value}-${endDate.value}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    alert(handleApiError(err))
  }
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-TW')
}

const getTierText = (tier: string): string => {
  const tierMap: Record<string, string> = {
    BRONZE: '銅牌',
    SILVER: '銀牌',
    GOLD: '金牌',
  }
  return tierMap[tier] || tier
}

const getTierClass = (tier: string): string => {
  const classMap: Record<string, string> = {
    BRONZE: 'bg-orange-100 text-orange-800',
    SILVER: 'bg-gray-100 text-gray-800',
    GOLD: 'bg-yellow-100 text-yellow-800',
  }
  return classMap[tier] || ''
}

const getTotalRevenue = (): number => {
  if (!report.value) return 0
  return report.value.sellers.reduce((sum, s) => sum + parseFloat(s.totalRevenue), 0)
}

const getTotalCommission = (): number => {
  if (!report.value) return 0
  return report.value.sellers.reduce((sum, s) => sum + parseFloat(s.platformCommission), 0)
}

const getTotalEarnings = (): number => {
  if (!report.value) return 0
  return report.value.sellers.reduce((sum, s) => sum + parseFloat(s.sellerEarnings), 0)
}

onMounted(() => {
  fetchReport()
})
</script>
```

---

## 五、驗收標準

- [ ] 儀表板正確顯示總覽數據
- [ ] 近期趨勢數據正確顯示（7天/30天）
- [ ] 快速統計正確顯示
- [ ] 銷售報表正常運作（日/週/月/自訂範圍）
- [ ] 銷售報表分類統計正確（自營/寄賣、線上/門市）
- [ ] 商品統計正確顯示庫存與暢銷商品
- [ ] 賣家佣金報表正確計算
- [ ] CSV 匯出功能正常運作
- [ ] 視覺化圖表（進度條）正確顯示比例
- [ ] 響應式設計在手機/平板/桌面正常顯示
- [ ] 無使用 `any` 型別（除單元測試外）
- [ ] Loading 與 Error 狀態正確處理

---

## 六、注意事項

1. **資料快取**：
   - 報表數據使用 Redis 快取（API 層）
   - 快取時間 3-5 分鐘
   - 避免頻繁查詢影響效能

2. **視覺化**：
   - 目前使用簡單的 CSS 進度條
   - Phase 2 可整合圖表庫（Chart.js, ECharts）
   - 保持介面清晰易讀

3. **CSV 匯出**：
   - 使用 Blob 下載
   - 檔案名稱包含日期範圍
   - 支援中文（UTF-8 BOM）

4. **效能優化**：
   - 大量資料使用分頁
   - 複雜統計查詢考慮背景任務
   - 定期清理過期快取

5. **權限控制**：
   - 目前所有登入管理員皆可查看
   - Phase 2 加入細緻權限控制
   - 敏感數據脫敏處理

---

## 七、後續任務

- **Task 18**: POS Web（門市 POS 系統）
- **Task 19**: Third-party ECPay（整合綠界金流）
- **Task 20**: Third-party GCS（整合 Google Cloud Storage）
- **Phase 2**: 圖表視覺化、自動報表排程、資料匯出優化
