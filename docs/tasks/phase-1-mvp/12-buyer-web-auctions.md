# Task 12: 買家前台競標頁面

## 概述

建立買家前台競標列表頁與競標詳情頁，整合 WebSocket 實現即時出價更新與倒數計時功能。

## 依賴

- Task 06: Auctions API（競標 API 已建立）
- Task 10: Buyer Web Setup（前台基礎已建立）

---

## 一、WebSocket Client 設定

### 1.1 WebSocket Plugin

```typescript
// apps/buyer-web/plugins/websocket.client.ts

import { io, Socket } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const socket: Socket = io(config.public.apiBase as string, {
    transports: ['websocket'],
    autoConnect: false,
  })

  return {
    provide: {
      socket,
    },
  }
})
```

### 1.2 WebSocket Composable

```typescript
// apps/buyer-web/composables/useWebSocket.ts

import type { Socket } from 'socket.io-client'

export const useWebSocket = () => {
  const { $socket } = useNuxtApp()
  const socket = $socket as Socket

  /**
   * 連接 WebSocket
   */
  const connect = (): void => {
    if (!socket.connected) {
      socket.connect()
    }
  }

  /**
   * 斷開 WebSocket
   */
  const disconnect = (): void => {
    if (socket.connected) {
      socket.disconnect()
    }
  }

  /**
   * 訂閱競標更新
   */
  const subscribeAuction = (
    auctionId: string,
    callback: (data: { currentPrice: string; bidCount: number }) => void
  ): void => {
    socket.emit('subscribe', { auctionId })
    socket.on(`auction:${auctionId}:update`, callback)
  }

  /**
   * 取消訂閱競標
   */
  const unsubscribeAuction = (auctionId: string): void => {
    socket.emit('unsubscribe', { auctionId })
    socket.off(`auction:${auctionId}:update`)
  }

  return {
    socket,
    connect,
    disconnect,
    subscribeAuction,
    unsubscribeAuction,
  }
}
```

---

## 二、擴充 API Composables

### 2.1 Auctions API

```typescript
// apps/buyer-web/composables/useAuctionsApi.ts

import type {
  QueryAuctionsInput,
  AuctionListOutput,
  AuctionDetailOutput,
  PlaceBidInput,
  BidOutput,
} from '@card-erp/shared-types'

export const useAuctionsApi = () => {
  const { apiFetch } = useApiClient()

  return {
    /**
     * 獲取競標列表
     */
    list: async (query: QueryAuctionsInput): Promise<AuctionListOutput> => {
      return await apiFetch<AuctionListOutput>('/api/auctions', {
        method: 'GET',
        query: query as Record<string, string | number>,
      })
    },

    /**
     * 獲取競標詳情
     */
    detail: async (id: string): Promise<AuctionDetailOutput> => {
      return await apiFetch<AuctionDetailOutput>(`/api/auctions/${id}`, {
        method: 'GET',
      })
    },

    /**
     * 出價（需登入）
     */
    placeBid: async (auctionId: string, data: PlaceBidInput): Promise<BidOutput> => {
      return await apiFetch<BidOutput>(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        body: data,
      })
    },
  }
}
```

---

## 三、共用元件

### 3.1 AuctionCard 競標卡片

```vue
<!-- apps/buyer-web/components/AuctionCard.vue -->

<template>
  <div class="card hover:shadow-lg transition-shadow duration-200">
    <!-- 商品圖片 -->
    <div class="relative aspect-square mb-4 overflow-hidden rounded-md bg-gray-100 cursor-pointer" @click="goToDetail">
      <img
        v-if="auction.product.images && auction.product.images.length > 0"
        :src="auction.product.images[0]"
        :alt="auction.product.name"
        class="w-full h-full object-cover"
      >
      <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- 狀態標籤 -->
      <div class="absolute top-2 right-2">
        <span v-if="auction.status === 'ENDED'" class="bg-gray-500 text-white text-xs px-2 py-1 rounded">
          已結束
        </span>
        <span v-else-if="isEndingSoon" class="bg-red-500 text-white text-xs px-2 py-1 rounded animate-pulse">
          即將結束
        </span>
        <span v-else class="bg-green-500 text-white text-xs px-2 py-1 rounded">
          進行中
        </span>
      </div>
    </div>

    <!-- 競標資訊 -->
    <div>
      <p class="text-sm text-gray-500 mb-1">{{ auction.product.category }}</p>
      <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ auction.product.name }}</h3>

      <!-- 目前價格 -->
      <div class="mb-3">
        <p class="text-sm text-gray-500">目前價格</p>
        <p class="text-2xl font-bold text-primary-600">
          NT$ {{ formatPrice(auction.currentPrice) }}
        </p>
      </div>

      <!-- 起標價 -->
      <div class="flex items-center justify-between text-sm mb-3">
        <span class="text-gray-500">起標價</span>
        <span class="font-medium">NT$ {{ formatPrice(auction.startingPrice) }}</span>
      </div>

      <!-- 出價次數 -->
      <div class="flex items-center justify-between text-sm mb-3">
        <span class="text-gray-500">出價次數</span>
        <span class="font-medium">{{ auction.bidCount }} 次</span>
      </div>

      <!-- 倒數計時 -->
      <CountdownTimer :end-time="auction.endTime" />

      <!-- 按鈕 -->
      <button
        class="btn w-full mt-4"
        :class="auction.status === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'"
        :disabled="auction.status !== 'ACTIVE'"
        @click="goToDetail"
      >
        {{ auction.status === 'ACTIVE' ? '立即出價' : '查看詳情' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AuctionDetailOutput } from '@card-erp/shared-types'

interface Props {
  auction: AuctionDetailOutput
}

const props = defineProps<Props>()
const router = useRouter()

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const isEndingSoon = computed((): boolean => {
  const endTime = new Date(props.auction.endTime)
  const now = new Date()
  const diff = endTime.getTime() - now.getTime()
  const hours = diff / (1000 * 60 * 60)
  return hours > 0 && hours <= 1 && props.auction.status === 'ACTIVE'
})

const goToDetail = (): void => {
  router.push(`/auctions/${props.auction.id}`)
}
</script>
```

### 3.2 CountdownTimer 倒數計時

```vue
<!-- apps/buyer-web/components/CountdownTimer.vue -->

<template>
  <div class="bg-gray-100 rounded-md px-3 py-2">
    <p class="text-sm text-gray-500 mb-1">{{ label }}</p>
    <div v-if="!isExpired" class="flex items-center justify-center space-x-2 text-lg font-bold" :class="isUrgent ? 'text-red-600' : 'text-gray-900'">
      <span v-if="days > 0">{{ days }}天</span>
      <span>{{ formatTime(hours) }}</span>
      <span>:</span>
      <span>{{ formatTime(minutes) }}</span>
      <span>:</span>
      <span>{{ formatTime(seconds) }}</span>
    </div>
    <div v-else class="text-center text-gray-500 font-medium">
      已結束
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  endTime: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '剩餘時間',
})

const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
const isExpired = ref(false)

const isUrgent = computed((): boolean => {
  return days.value === 0 && hours.value === 0 && minutes.value < 10
})

const formatTime = (value: number): string => {
  return value.toString().padStart(2, '0')
}

const updateCountdown = (): void => {
  const endTime = new Date(props.endTime)
  const now = new Date()
  const diff = endTime.getTime() - now.getTime()

  if (diff <= 0) {
    isExpired.value = true
    days.value = 0
    hours.value = 0
    minutes.value = 0
    seconds.value = 0
    return
  }

  days.value = Math.floor(diff / (1000 * 60 * 60 * 24))
  hours.value = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  minutes.value = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  seconds.value = Math.floor((diff % (1000 * 60)) / 1000)
}

let intervalId: NodeJS.Timeout | null = null

onMounted(() => {
  updateCountdown()
  intervalId = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>
```

### 3.3 BidHistory 出價記錄

```vue
<!-- apps/buyer-web/components/BidHistory.vue -->

<template>
  <div class="card">
    <h3 class="font-bold text-lg mb-4">出價記錄</h3>

    <div v-if="bids.length > 0" class="space-y-3">
      <div
        v-for="(bid, index) in displayBids"
        :key="bid.id"
        class="flex items-center justify-between py-2 border-b last:border-b-0"
      >
        <div class="flex items-center space-x-3">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            :class="index === 0 ? 'bg-yellow-500' : 'bg-gray-400'"
          >
            {{ index + 1 }}
          </div>
          <div>
            <p class="font-medium">{{ maskBidderName(bid.bidderName) }}</p>
            <p class="text-xs text-gray-500">{{ formatDateTime(bid.createdAt) }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-primary-600">NT$ {{ formatPrice(bid.amount) }}</p>
        </div>
      </div>

      <button
        v-if="bids.length > maxDisplay && !showAll"
        class="btn btn-secondary w-full text-sm"
        @click="showAll = true"
      >
        顯示全部 ({{ bids.length }} 筆)
      </button>
    </div>

    <div v-else class="text-center py-8 text-gray-500">
      尚無出價記錄
    </div>
  </div>
</template>

<script setup lang="ts">
interface Bid {
  id: string
  bidderName: string
  amount: string
  createdAt: string
}

interface Props {
  bids: Bid[]
  maxDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: 10,
})

const showAll = ref(false)

const displayBids = computed((): Bid[] => {
  return showAll.value ? props.bids : props.bids.slice(0, props.maxDisplay)
})

const maskBidderName = (name: string): string => {
  if (name.length <= 2) {
    return name[0] + '*'
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
```

---

## 四、競標列表頁

### 4.1 Auctions Index Page

```vue
<!-- apps/buyer-web/pages/auctions/index.vue -->

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">競標專區</h1>

    <!-- 狀態篩選 -->
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

    <!-- Loading -->
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <!-- Error -->
    <ErrorMessage v-else-if="error" :message="error" />

    <!-- 競標列表 -->
    <template v-else>
      <div v-if="auctions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AuctionCard v-for="auction in auctions" :key="auction.id" :auction="auction" />
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        沒有找到競標項目
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
  </div>
</template>

<script setup lang="ts">
import type { AuctionDetailOutput, AuctionStatus } from '@card-erp/shared-types'

const auctionsApi = useAuctionsApi()

const tabs = [
  { label: '全部', value: '' },
  { label: '進行中', value: 'ACTIVE' },
  { label: '即將結束', value: 'ENDING_SOON' },
  { label: '已結束', value: 'ENDED' },
]

const auctions = ref<AuctionDetailOutput[]>([])
const loading = ref(false)
const error = ref('')

const activeTab = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 12

// 獲取競標列表
const fetchAuctions = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    const response = await auctionsApi.list({
      page: currentPage.value,
      pageSize,
      status: activeTab.value as AuctionStatus | undefined,
    })

    auctions.value = response.auctions as AuctionDetailOutput[]
    totalPages.value = response.pagination.totalPages
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

// 換頁
const handlePageChange = (page: number): void => {
  currentPage.value = page
  fetchAuctions()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 監聽 tab 變化
watch(activeTab, () => {
  currentPage.value = 1
  fetchAuctions()
})

// 初始載入
onMounted(() => {
  fetchAuctions()
})

// SEO
useHead({
  title: '競標專區 | 卡牌商城',
  meta: [
    { name: 'description', content: '即時線上競標，收藏級卡牌等你來搶' },
  ],
})
</script>
```

---

## 五、競標詳情頁

### 5.1 Auction Detail Page

```vue
<!-- apps/buyer-web/pages/auctions/[id].vue -->

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading -->
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <!-- Error -->
    <ErrorMessage v-else-if="error" :message="error" />

    <!-- 競標詳情 -->
    <template v-else-if="auction">
      <!-- 麵包屑 -->
      <nav class="mb-6 text-sm text-gray-600">
        <NuxtLink to="/" class="hover:text-primary-600">首頁</NuxtLink>
        <span class="mx-2">/</span>
        <NuxtLink to="/auctions" class="hover:text-primary-600">競標專區</NuxtLink>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ auction.product.name }}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- 左側：商品資訊 -->
        <div>
          <ImageGallery :images="auction.product.images || []" />

          <div class="mt-6">
            <h2 class="font-bold text-lg mb-2">商品描述</h2>
            <p class="text-gray-700 whitespace-pre-wrap">{{ auction.product.description || '暫無描述' }}</p>
          </div>
        </div>

        <!-- 右側：競標資訊 -->
        <div>
          <p class="text-sm text-gray-500 mb-2">{{ auction.product.category }}</p>
          <h1 class="text-3xl font-bold text-gray-900 mb-6">{{ auction.product.name }}</h1>

          <!-- 倒數計時 -->
          <CountdownTimer :end-time="auction.endTime" class="mb-6" />

          <!-- 目前價格 -->
          <div class="card mb-6">
            <p class="text-sm text-gray-500 mb-1">目前價格</p>
            <p class="text-4xl font-bold text-primary-600">
              NT$ {{ formatPrice(currentPrice) }}
            </p>
            <p class="text-sm text-gray-500 mt-2">
              起標價：NT$ {{ formatPrice(auction.startingPrice) }} | 出價次數：{{ bidCount }} 次
            </p>
          </div>

          <!-- 出價表單 -->
          <div v-if="auction.status === 'ACTIVE'" class="card mb-6">
            <h3 class="font-bold text-lg mb-4">立即出價</h3>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">出價金額</label>
              <input
                v-model="bidAmount"
                type="number"
                :min="minBidAmount"
                :step="auction.minimumIncrement"
                class="input"
                placeholder="請輸入出價金額"
              >
              <p class="text-sm text-gray-500 mt-1">
                最低出價：NT$ {{ formatPrice(minBidAmount.toString()) }}
              </p>
            </div>

            <button
              class="btn btn-primary w-full py-3 text-lg"
              :disabled="submitting || !isValidBid"
              @click="handlePlaceBid"
            >
              {{ submitting ? '出價中...' : '確認出價' }}
            </button>

            <ErrorMessage v-if="bidError" :message="bidError" class="mt-4" />
          </div>

          <div v-else class="card mb-6 text-center py-8">
            <p class="text-xl font-bold text-gray-500">此競標已結束</p>
            <p v-if="auction.winnerId" class="text-sm text-gray-600 mt-2">
              得標者：{{ maskName(auction.winnerName || '') }}
            </p>
          </div>

          <!-- 出價記錄 -->
          <BidHistory :bids="bids" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AuctionDetailOutput } from '@card-erp/shared-types'

interface Bid {
  id: string
  bidderName: string
  amount: string
  createdAt: string
}

const route = useRoute()
const auctionsApi = useAuctionsApi()
const { subscribeAuction, unsubscribeAuction, connect, disconnect } = useWebSocket()

const auction = ref<AuctionDetailOutput | null>(null)
const loading = ref(false)
const error = ref('')

const bidAmount = ref<number | null>(null)
const bidError = ref('')
const submitting = ref(false)

// 即時更新的數據
const currentPrice = ref('0')
const bidCount = ref(0)
const bids = ref<Bid[]>([])

const auctionId = computed(() => route.params.id as string)

const minBidAmount = computed((): number => {
  const current = parseFloat(currentPrice.value)
  const increment = auction.value?.minimumIncrement || 10
  return current + increment
})

const isValidBid = computed((): boolean => {
  return bidAmount.value !== null && bidAmount.value >= minBidAmount.value
})

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const maskName = (name: string): string => {
  if (name.length <= 2) {
    return name[0] + '*'
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

// 獲取競標詳情
const fetchAuction = async (): Promise<void> => {
  loading.value = true
  error.value = ''

  try {
    auction.value = await auctionsApi.detail(auctionId.value)
    currentPrice.value = auction.value.currentPrice
    bidCount.value = auction.value.bidCount
    bids.value = auction.value.bids || []
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

// 出價
const handlePlaceBid = async (): Promise<void> => {
  if (!isValidBid.value || bidAmount.value === null) {
    return
  }

  bidError.value = ''
  submitting.value = true

  try {
    // TODO: 需要整合會員登入（Phase 2）
    // 目前暫時使用測試用 bidderId
    await auctionsApi.placeBid(auctionId.value, {
      bidderId: 'test-bidder-1',
      amount: bidAmount.value,
    })

    // 清空出價金額
    bidAmount.value = null

    // 重新獲取競標資訊（WebSocket 會自動更新，但為了確保資料一致性）
    await fetchAuction()
  } catch (err) {
    bidError.value = handleApiError(err)
  } finally {
    submitting.value = false
  }
}

// WebSocket 即時更新
const setupWebSocket = (): void => {
  connect()

  subscribeAuction(auctionId.value, (data) => {
    currentPrice.value = data.currentPrice
    bidCount.value = data.bidCount

    // 重新獲取完整資訊以更新出價記錄
    fetchAuction()
  })
}

// 初始載入
onMounted(() => {
  fetchAuction()
  setupWebSocket()
})

onUnmounted(() => {
  unsubscribeAuction(auctionId.value)
  disconnect()
})

// SEO
useHead(() => ({
  title: auction.value ? `${auction.value.product.name} - 競標中 | 卡牌商城` : '競標詳情 | 卡牌商城',
  meta: [
    {
      name: 'description',
      content: auction.value?.product.description || '即時線上競標',
    },
  ],
}))
</script>
```

---

## 六、安裝依賴

```bash
# apps/buyer-web
pnpm add socket.io-client
pnpm add -D @types/socket.io-client
```

---

## 七、驗收標準

- [ ] 競標列表頁正常顯示，可依狀態篩選
- [ ] 競標卡片正確顯示競標資訊與倒數計時
- [ ] 倒數計時即時更新，接近結束時顯示警示
- [ ] 競標詳情頁正確顯示完整資訊
- [ ] 出價功能正常運作（需登入後測試）
- [ ] WebSocket 即時更新出價資訊
- [ ] 出價記錄正確顯示（遮蔽出價者姓名）
- [ ] 響應式設計在手機/平板/桌面正常顯示
- [ ] SEO meta tags 正確設定
- [ ] 無使用 `any` 型別（除單元測試外）
- [ ] Loading 與 Error 狀態正確處理

---

## 八、注意事項

1. **WebSocket 連線管理**：
   - 僅在需要時連線（進入競標詳情頁）
   - 離開頁面時正確斷開連線
   - 處理斷線重連機制

2. **即時更新**：
   - WebSocket 更新僅更新關鍵數據（價格、次數）
   - 完整出價記錄透過 API 重新獲取
   - 避免頻繁的全量資料更新

3. **倒數計時**：
   - 使用 `setInterval` 每秒更新
   - 組件卸載時清除 interval
   - 時間接近結束時顯示警示

4. **出價驗證**：
   - 前端驗證最低出價金額
   - 後端二次驗證（防止惡意出價）
   - 樂觀鎖防止併發出價衝突

5. **使用者體驗**：
   - 出價成功後顯示提示
   - 出價失敗顯示友善錯誤訊息
   - 即將結束的競標加上視覺提示

6. **Phase 2 整合**：
   - 目前使用測試 bidderId
   - Phase 2 整合會員系統後替換為真實會員 ID
   - 加入出價歷史查詢功能

---

## 九、後續任務

- **Task 13**: Buyer Web Cart（購物車與結帳）
- **Phase 2**: 買家會員系統（登入、註冊、我的競標）
