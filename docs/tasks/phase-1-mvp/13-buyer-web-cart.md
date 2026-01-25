# Task 13: 買家前台購物車與結帳

## 概述

建立買家前台購物車頁面與結帳流程，整合訂單建立與付款功能。

## 依賴

- Task 07: Orders API（訂單 API 已建立）
- Task 08: Payments API（付款 API 已建立）
- Task 10: Buyer Web Setup（Cart Store 已建立）

---

## 一、擴充 API Composables

### 1.1 Orders API

```typescript
// apps/buyer-web/composables/useOrdersApi.ts

import type {
  CreateOrderInput,
  OrderDetailOutput,
} from '@card-erp/shared-types'

export const useOrdersApi = () => {
  const { apiFetch } = useApiClient()

  return {
    /**
     * 建立訂單
     */
    create: async (data: CreateOrderInput): Promise<OrderDetailOutput> => {
      return await apiFetch<OrderDetailOutput>('/api/orders', {
        method: 'POST',
        body: data,
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
  }
}
```

---

## 二、共用元件

### 2.1 CartItem 購物車項目

```vue
<!-- apps/buyer-web/components/CartItem.vue -->

<template>
  <div class="flex items-center gap-4 py-4 border-b">
    <!-- 商品圖片 -->
    <div class="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
      <img
        v-if="item.product.images && item.product.images.length > 0"
        :src="item.product.images[0]"
        :alt="item.product.name"
        class="w-full h-full object-cover"
      >
    </div>

    <!-- 商品資訊 -->
    <div class="flex-1">
      <h3 class="font-semibold text-gray-900">{{ item.product.name }}</h3>
      <p class="text-sm text-gray-500">{{ item.product.category }}</p>
      <p class="text-lg font-bold text-primary-600 mt-1">
        NT$ {{ formatPrice(item.product.sellingPrice) }}
      </p>
    </div>

    <!-- 數量調整 -->
    <div class="flex items-center gap-2">
      <button
        class="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
        :disabled="item.quantity <= 1"
        @click="updateQuantity(item.quantity - 1)"
      >
        -
      </button>
      <span class="w-12 text-center font-medium">{{ item.quantity }}</span>
      <button
        class="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
        @click="updateQuantity(item.quantity + 1)"
      >
        +
      </button>
    </div>

    <!-- 小計 -->
    <div class="w-24 text-right">
      <p class="font-bold text-gray-900">
        NT$ {{ formatPrice(subtotal) }}
      </p>
    </div>

    <!-- 刪除按鈕 -->
    <button
      class="w-8 h-8 rounded-md bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center"
      @click="removeItem"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '~/types/store'

interface Props {
  item: CartItem
}

interface Emits {
  (e: 'update-quantity', productId: string, quantity: number): void
  (e: 'remove', productId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const subtotal = computed((): string => {
  const price = parseFloat(props.item.product.sellingPrice)
  return (price * props.item.quantity).toFixed(2)
})

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const updateQuantity = (quantity: number): void => {
  if (quantity >= 1) {
    emit('update-quantity', props.item.productId, quantity)
  }
}

const removeItem = (): void => {
  emit('remove', props.item.productId)
}
</script>
```

### 2.2 OrderSummary 訂單摘要

```vue
<!-- apps/buyer-web/components/OrderSummary.vue -->

<template>
  <div class="card sticky top-20">
    <h3 class="font-bold text-lg mb-4">訂單摘要</h3>

    <div class="space-y-3 mb-4">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">商品小計</span>
        <span class="font-medium">NT$ {{ formatPrice(subtotal) }}</span>
      </div>

      <div v-if="shippingFee > 0" class="flex justify-between text-sm">
        <span class="text-gray-600">運費</span>
        <span class="font-medium">NT$ {{ formatPrice(shippingFee.toFixed(2)) }}</span>
      </div>

      <div v-if="discount > 0" class="flex justify-between text-sm text-red-600">
        <span>折扣</span>
        <span>- NT$ {{ formatPrice(discount.toFixed(2)) }}</span>
      </div>
    </div>

    <div class="border-t pt-4 mb-6">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">總計</span>
        <span class="font-bold text-2xl text-primary-600">
          NT$ {{ formatPrice(total) }}
        </span>
      </div>
    </div>

    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  subtotal: string
  shippingFee?: number
  discount?: number
}

const props = withDefaults(defineProps<Props>(), {
  shippingFee: 0,
  discount: 0,
})

const total = computed((): string => {
  const sub = parseFloat(props.subtotal)
  return (sub + props.shippingFee - props.discount).toFixed(2)
})

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}
</script>
```

---

## 三、購物車頁面

### 3.1 Cart Page

```vue
<!-- apps/buyer-web/pages/cart/index.vue -->

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">購物車</h1>

    <div v-if="cartStore.items.length > 0" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 購物車項目列表 -->
      <div class="lg:col-span-2">
        <div class="card">
          <CartItem
            v-for="item in cartStore.items"
            :key="item.productId"
            :item="item"
            @update-quantity="handleUpdateQuantity"
            @remove="handleRemove"
          />
        </div>
      </div>

      <!-- 訂單摘要 -->
      <div class="lg:col-span-1">
        <OrderSummary :subtotal="cartStore.totalAmount.toFixed(2)">
          <template #action>
            <NuxtLink to="/cart/checkout" class="btn btn-primary w-full py-3 text-lg">
              前往結帳
            </NuxtLink>
          </template>
        </OrderSummary>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <p class="text-xl text-gray-500 mb-6">購物車是空的</p>
      <NuxtLink to="/products" class="btn btn-primary">
        前往購物
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const cartStore = useCartStore()

const handleUpdateQuantity = (productId: string, quantity: number): void => {
  cartStore.updateQuantity(productId, quantity)
}

const handleRemove = (productId: string): void => {
  if (confirm('確定要移除此商品嗎？')) {
    cartStore.removeItem(productId)
  }
}

// SEO
useHead({
  title: '購物車 | 卡牌商城',
  meta: [
    { name: 'description', content: '查看您的購物車商品' },
  ],
})
</script>
```

---

## 四、結帳頁面

### 4.1 表單驗證 Schema

```typescript
// apps/buyer-web/types/checkout.ts

import { z } from 'zod'

export const CheckoutFormSchema = z.object({
  // 收件人資訊
  recipientName: z.string().min(1, '請輸入收件人姓名').max(50, '姓名過長'),
  recipientPhone: z.string().regex(/^09\d{8}$/, '請輸入有效的手機號碼'),
  recipientEmail: z.string().email('請輸入有效的電子郵件').optional().or(z.literal('')),

  // 配送資訊
  shippingMethod: z.enum(['HOME_DELIVERY', 'STORE_PICKUP', 'SEVEN_ELEVEN', 'FAMILY_MART']),
  shippingAddress: z.string().min(1, '請輸入配送地址').max(255, '地址過長').optional(),
  storeId: z.string().optional(),
  storeName: z.string().optional(),

  // 付款方式
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'LINE_PAY']),

  // 備註
  note: z.string().max(500, '備註過長').optional(),
})

export type CheckoutFormData = z.infer<typeof CheckoutFormSchema>
```

### 4.2 Checkout Page

```vue
<!-- apps/buyer-web/pages/cart/checkout.vue -->

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">結帳</h1>

    <div v-if="cartStore.items.length > 0" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 結帳表單 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 收件人資訊 -->
        <div class="card">
          <h2 class="font-bold text-xl mb-4">收件人資訊</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
              <input
                v-model="formData.recipientName"
                type="text"
                class="input"
                placeholder="請輸入收件人姓名"
              >
              <p v-if="errors.recipientName" class="text-sm text-red-600 mt-1">{{ errors.recipientName }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">手機 *</label>
              <input
                v-model="formData.recipientPhone"
                type="tel"
                class="input"
                placeholder="0912345678"
              >
              <p v-if="errors.recipientPhone" class="text-sm text-red-600 mt-1">{{ errors.recipientPhone }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
              <input
                v-model="formData.recipientEmail"
                type="email"
                class="input"
                placeholder="example@email.com"
              >
              <p v-if="errors.recipientEmail" class="text-sm text-red-600 mt-1">{{ errors.recipientEmail }}</p>
            </div>
          </div>
        </div>

        <!-- 配送方式 -->
        <div class="card">
          <h2 class="font-bold text-xl mb-4">配送方式</h2>
          <div class="space-y-3">
            <label
              v-for="method in shippingMethods"
              :key="method.value"
              class="flex items-center gap-3 p-4 border rounded-md cursor-pointer"
              :class="formData.shippingMethod === method.value ? 'border-primary-600 bg-primary-50' : 'border-gray-300'"
            >
              <input
                v-model="formData.shippingMethod"
                type="radio"
                :value="method.value"
                class="w-4 h-4 text-primary-600"
              >
              <div class="flex-1">
                <p class="font-medium">{{ method.label }}</p>
                <p class="text-sm text-gray-500">{{ method.description }}</p>
              </div>
              <p class="font-medium text-primary-600">{{ method.fee > 0 ? `NT$ ${method.fee}` : '免運費' }}</p>
            </label>
          </div>

          <!-- 配送地址（宅配） -->
          <div v-if="formData.shippingMethod === 'HOME_DELIVERY'" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">配送地址 *</label>
            <input
              v-model="formData.shippingAddress"
              type="text"
              class="input"
              placeholder="請輸入完整地址"
            >
            <p v-if="errors.shippingAddress" class="text-sm text-red-600 mt-1">{{ errors.shippingAddress }}</p>
          </div>

          <!-- 超商選擇（7-11/全家） -->
          <div v-if="formData.shippingMethod === 'SEVEN_ELEVEN' || formData.shippingMethod === 'FAMILY_MART'" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">選擇門市 *</label>
            <button class="btn btn-secondary w-full" @click="openStoreSelector">
              {{ formData.storeName || '點擊選擇門市' }}
            </button>
            <p v-if="errors.storeId" class="text-sm text-red-600 mt-1">{{ errors.storeId }}</p>
          </div>
        </div>

        <!-- 付款方式 -->
        <div class="card">
          <h2 class="font-bold text-xl mb-4">付款方式</h2>
          <div class="space-y-3">
            <label
              v-for="method in paymentMethods"
              :key="method.value"
              class="flex items-center gap-3 p-4 border rounded-md cursor-pointer"
              :class="formData.paymentMethod === method.value ? 'border-primary-600 bg-primary-50' : 'border-gray-300'"
            >
              <input
                v-model="formData.paymentMethod"
                type="radio"
                :value="method.value"
                class="w-4 h-4 text-primary-600"
              >
              <div class="flex-1">
                <p class="font-medium">{{ method.label }}</p>
                <p class="text-sm text-gray-500">{{ method.description }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- 備註 -->
        <div class="card">
          <h2 class="font-bold text-xl mb-4">訂單備註</h2>
          <textarea
            v-model="formData.note"
            rows="4"
            class="input"
            placeholder="有任何需要告知的事項嗎？（選填）"
          />
          <p v-if="errors.note" class="text-sm text-red-600 mt-1">{{ errors.note }}</p>
        </div>
      </div>

      <!-- 訂單摘要 -->
      <div class="lg:col-span-1">
        <OrderSummary
          :subtotal="cartStore.totalAmount.toFixed(2)"
          :shipping-fee="shippingFee"
        >
          <template #action>
            <button
              class="btn btn-primary w-full py-3 text-lg"
              :disabled="submitting"
              @click="handleSubmit"
            >
              {{ submitting ? '處理中...' : '確認訂單' }}
            </button>
          </template>
        </OrderSummary>

        <ErrorMessage v-if="submitError" :message="submitError" class="mt-4" />
      </div>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-xl text-gray-500 mb-6">購物車是空的，無法結帳</p>
      <NuxtLink to="/products" class="btn btn-primary">
        前往購物
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckoutFormSchema, type CheckoutFormData } from '~/types/checkout'
import type { CreateOrderInput } from '@card-erp/shared-types'

const cartStore = useCartStore()
const ordersApi = useOrdersApi()
const router = useRouter()

const formData = ref<CheckoutFormData>({
  recipientName: '',
  recipientPhone: '',
  recipientEmail: '',
  shippingMethod: 'HOME_DELIVERY',
  shippingAddress: '',
  storeId: '',
  storeName: '',
  paymentMethod: 'CASH',
  note: '',
})

const errors = ref<Partial<Record<keyof CheckoutFormData, string>>>({})
const submitError = ref('')
const submitting = ref(false)

const shippingMethods = [
  { value: 'HOME_DELIVERY', label: '宅配', description: '3-5 個工作天送達', fee: 60 },
  { value: 'STORE_PICKUP', label: '門市自取', description: '到店自取，免運費', fee: 0 },
  { value: 'SEVEN_ELEVEN', label: '7-11 取貨', description: '2-3 個工作天送達', fee: 60 },
  { value: 'FAMILY_MART', label: '全家取貨', description: '2-3 個工作天送達', fee: 60 },
]

const paymentMethods = [
  { value: 'CASH', label: '貨到付款', description: '收到商品時付款' },
  { value: 'CREDIT_CARD', label: '信用卡', description: '綠界 ECPay 金流' },
  { value: 'LINE_PAY', label: 'LINE Pay', description: '使用 LINE Pay 付款' },
]

const shippingFee = computed((): number => {
  const method = shippingMethods.find(m => m.value === formData.value.shippingMethod)
  return method?.fee || 0
})

const openStoreSelector = (): void => {
  // TODO: 整合超商選擇器（Task 19）
  alert('超商選擇功能將在 Task 19 實作')
}

const validateForm = (): boolean => {
  try {
    CheckoutFormSchema.parse(formData.value)
    errors.value = {}
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.value = {}
      error.errors.forEach(err => {
        if (err.path[0]) {
          errors.value[err.path[0] as keyof CheckoutFormData] = err.message
        }
      })
    }
    return false
  }
}

const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  submitError.value = ''

  try {
    // 建立訂單資料
    const orderData: CreateOrderInput = {
      channel: 'ONLINE',
      items: cartStore.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      recipientName: formData.value.recipientName,
      recipientPhone: formData.value.recipientPhone,
      recipientEmail: formData.value.recipientEmail,
      shippingMethod: formData.value.shippingMethod,
      shippingAddress: formData.value.shippingAddress,
      shippingFee,
      paymentMethod: formData.value.paymentMethod,
      note: formData.value.note,
    }

    const order = await ordersApi.create(orderData)

    // 清空購物車
    cartStore.clearCart()

    // 導向訂單完成頁
    router.push(`/cart/success?orderId=${order.id}`)
  } catch (error) {
    submitError.value = handleApiError(error)
  } finally {
    submitting.value = false
  }
}

// SEO
useHead({
  title: '結帳 | 卡牌商城',
  meta: [
    { name: 'description', content: '完成您的訂單結帳' },
  ],
})
</script>
```

---

## 五、訂單成功頁面

### 5.1 Success Page

```vue
<!-- apps/buyer-web/pages/cart/success.vue -->

<template>
  <div class="container mx-auto px-4 py-8">
    <LoadingSpinner v-if="loading" container-class="py-12" />

    <div v-else-if="order" class="max-w-2xl mx-auto">
      <!-- 成功圖示 -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">訂單建立成功！</h1>
        <p class="text-gray-600">感謝您的購買，我們已收到您的訂單</p>
      </div>

      <!-- 訂單資訊 -->
      <div class="card mb-6">
        <h2 class="font-bold text-xl mb-4">訂單資訊</h2>
        <dl class="space-y-3">
          <div class="flex justify-between">
            <dt class="text-gray-600">訂單編號</dt>
            <dd class="font-medium">{{ order.orderNumber }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600">訂單狀態</dt>
            <dd class="font-medium">{{ getStatusText(order.status) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600">付款狀態</dt>
            <dd class="font-medium">{{ getPaymentStatusText(order.paymentStatus) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600">訂單金額</dt>
            <dd class="font-bold text-xl text-primary-600">NT$ {{ formatPrice(order.totalAmount) }}</dd>
          </div>
        </dl>
      </div>

      <!-- 付款資訊 -->
      <div v-if="order.paymentMethod !== 'CASH'" class="card mb-6">
        <h2 class="font-bold text-xl mb-4">付款資訊</h2>
        <p class="text-gray-700 mb-4">請完成付款以處理您的訂單</p>
        <button class="btn btn-primary w-full" @click="handlePayment">
          前往付款
        </button>
      </div>

      <!-- 操作按鈕 -->
      <div class="space-y-3">
        <NuxtLink to="/products" class="btn btn-primary w-full">
          繼續購物
        </NuxtLink>
        <!-- <NuxtLink to="/account/orders" class="btn btn-secondary w-full">
          查看我的訂單
        </NuxtLink> -->
      </div>
    </div>

    <ErrorMessage v-else-if="error" :message="error" />
  </div>
</template>

<script setup lang="ts">
import type { OrderDetailOutput, OrderStatus, PaymentStatus } from '@card-erp/shared-types'

const route = useRoute()
const ordersApi = useOrdersApi()

const order = ref<OrderDetailOutput | null>(null)
const loading = ref(false)
const error = ref('')

const orderId = computed(() => route.query.orderId as string)

const fetchOrder = async (): Promise<void> => {
  if (!orderId.value) {
    error.value = '找不到訂單資訊'
    return
  }

  loading.value = true
  error.value = ''

  try {
    order.value = await ordersApi.detail(orderId.value)
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price: string): string => {
  return parseFloat(price).toLocaleString('zh-TW')
}

const getStatusText = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    PENDING: '待處理',
    CONFIRMED: '已確認',
    SHIPPING: '配送中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return statusMap[status] || status
}

const getPaymentStatusText = (status: PaymentStatus): string => {
  const statusMap: Record<PaymentStatus, string> = {
    PENDING: '待付款',
    PAID: '已付款',
    FAILED: '付款失敗',
  }
  return statusMap[status] || status
}

const handlePayment = (): void => {
  // TODO: 整合綠界 ECPay（Task 19）
  alert('付款功能將在 Task 19 實作')
}

onMounted(() => {
  fetchOrder()
})

// SEO
useHead({
  title: '訂單成功 | 卡牌商城',
  meta: [
    { name: 'description', content: '您的訂單已成功建立' },
  ],
})
</script>
```

---

## 六、驗收標準

- [ ] 購物車頁面正常顯示商品列表
- [ ] 可調整商品數量、刪除商品
- [ ] 訂單摘要正確計算金額
- [ ] 結帳頁面表單驗證正常運作
- [ ] 支援多種配送方式與付款方式
- [ ] 訂單建立成功後正確導向成功頁
- [ ] 成功頁顯示訂單資訊
- [ ] 響應式設計在手機/平板/桌面正常顯示
- [ ] SEO meta tags 正確設定
- [ ] 無使用 `any` 型別（除單元測試外）
- [ ] Loading 與 Error 狀態正確處理

---

## 七、注意事項

1. **購物車狀態管理**：
   - 使用 Pinia 持久化購物車（localStorage）
   - 頁面重新整理時購物車內容保留
   - 結帳成功後清空購物車

2. **表單驗證**：
   - 使用 Zod schema 進行驗證
   - 即時顯示驗證錯誤
   - 根據配送方式動態調整必填欄位

3. **訂單建立**：
   - 使用 Prisma transaction 確保資料一致性
   - 訂單號自動生成（ORD + 日期 + 流水號）
   - 商品狀態更新為 SOLD

4. **付款整合**：
   - Task 19 會完整實作綠界 ECPay 整合
   - 目前僅支援貨到付款
   - 信用卡/LINE Pay 功能預留介面

5. **超商選擇**：
   - Task 19 會整合 7-11/全家 API
   - 目前提供手動輸入門市資訊

6. **Phase 2 整合**：
   - 會員登入後自動帶入收件人資訊
   - 訂單歷史查詢功能
   - 會員專屬優惠折扣

---

## 八、後續任務

- **Task 14**: Admin Web Setup（後台管理基礎建立）
- **Task 19**: Third-party ECPay（整合綠界金流與超商物流）
- **Phase 2**: 買家會員系統（我的訂單、收件地址管理）
