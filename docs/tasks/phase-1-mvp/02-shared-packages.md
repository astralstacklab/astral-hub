# 02 - 共用套件開發

**階段**: 第一階段 MVP - Sprint 1
**預計時間**: 2 天
**負責人**: TBD
**優先級**: 🔴 Critical

---

## 📋 目標

建立可重用的共用套件（shared-types、ui-components、utils），為前後端提供統一的型別定義、UI 元件與工具函數，確保代碼一致性並減少重複。

## 🎯 成功標準

- [x] shared-types 套件可被前後端專案引用
- [x] 所有型別定義完整且無 `any` 型別（測試除外）
- [x] ui-components 元件可在 Vue 3 專案中正常使用
- [ ] utils 工具函數有完整的單元測試
- [ ] 所有套件有清楚的 README 與使用範例
- [ ] TypeScript 型別檢查通過

## 📦 前置條件

**前置任務**:

- [x] 01 - 環境建置完成

**技術需求**:

- TypeScript 5.2+
- Vue 3.3+（ui-components）
- Vitest（測試）

---

## ✅ 子任務清單

### 2.1 shared-types 套件

#### 2.1.1 建立套件結構

- [x] 建立 `packages/shared-types/`目錄結構
  ```
  packages/shared-types/
  ├── src/
  │   ├── entities/     # 實體型別
  │   ├── dtos/         # DTO 型別
  │   ├── enums/        # 枚舉定義
  │   ├── api/          # API 回應型別
  │   └── index.ts      # 匯出入口
  ├── package.json
  ├── tsconfig.json
  └── README.md
  ```

#### 2.1.2 配置 package.json

- [x] 建立 `packages/shared-types/package.json`
  ```json
  {
    "name": "@card-erp/shared-types",
    "version": "1.0.0",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "scripts": {
      "build": "tsc",
      "type-check": "tsc --noEmit"
    },
    "devDependencies": {
      "typescript": "^5.2.0"
    }
  }
  ```

#### 2.1.3 定義實體型別（entities/）

- [x] `entities/product.ts`

  ```typescript
  export interface Product {
    id: string
    type: ProductType
    category: string
    name: string
    series: string | null
    cardNumber: string | null
    gradingStatus: GradingStatus | null
    gradingScore: number | null
    costPrice: number
    sellingPrice: number
    sellerId: string | null
    status: ProductStatus
    channel: ProductChannel
    images: ProductImage[]
    video: string | null
    description: string
    conditionNotes: string | null
    supplier: string | null
    stockQuantity: number
    createdAt: Date
    updatedAt: Date
  }

  export interface ProductImage {
    url: string
    type: 'front' | 'back' | 'detail' | 'cert'
  }
  ```

- [x] `entities/order.ts`
- [x] `entities/auction.ts`
- [x] `entities/user.ts`
- [x] `entities/seller.ts`
- [x] `entities/admin-user.ts`

#### 2.1.4 定義枚舉（enums/）

- [x] `enums/product.ts`

  ```typescript
  export enum ProductType {
    CARD = 'CARD',
    ACCESSORY = 'ACCESSORY',
  }

  export enum ProductStatus {
    PENDING = 'PENDING',
    LISTED = 'LISTED',
    SOLD = 'SOLD',
  }

  export enum ProductChannel {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    BOTH = 'BOTH',
  }

  export enum GradingStatus {
    RAW = 'RAW',
    PSA = 'PSA',
    ARS = 'ARS',
    BGS = 'BGS',
  }
  ```

- [x] `enums/order.ts`（PaymentMethod, PaymentStatus, ShippingMethod 等）
- [x] `enums/auction.ts`（AuctionStatus）
- [x] `enums/common.ts`（UserRole, AdminRole 等）

#### 2.1.5 定義 DTO 型別（dtos/）

- [x] `dtos/product-dto.ts`

  ```typescript
  export interface CreateProductDTO {
    type: ProductType
    category: string
    name: string
    series?: string
    cardNumber?: string
    gradingStatus?: GradingStatus
    gradingScore?: number
    costPrice: number
    sellingPrice: number
    sellerId?: string
    channel: ProductChannel
    description: string
    conditionNotes?: string
    supplier?: string
  }

  export interface UpdateProductDTO {
    name?: string
    sellingPrice?: number
    status?: ProductStatus
    description?: string
    // ... 其他可更新欄位
  }

  export interface QueryProductsDTO {
    category?: string
    status?: ProductStatus
    channel?: ProductChannel
    minPrice?: number
    maxPrice?: number
    search?: string
    page?: number
    limit?: number
    sort?: string
  }
  ```

- [x] `dtos/order-dto.ts`
- [x] `dtos/auction-dto.ts`
- [x] `dtos/user-dto.ts`

#### 2.1.6 定義 API 回應型別（api/）

- [x] `api/response.ts`

  ```typescript
  export interface SuccessResponse<T = unknown> {
    success: true
    data: T
    meta?: PaginationMeta
  }

  export interface ErrorResponse {
    success: false
    error: {
      code: string
      message: string
      details?: Record<string, unknown>
    }
  }

  export interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
  }

  export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse
  ```

#### 2.1.7 建立匯出入口

- [x] `src/index.ts`

  ```typescript
  // Entities
  export * from './entities/product'
  export * from './entities/order'
  export * from './entities/auction'
  // ... 其他 entities

  // Enums
  export * from './enums/product'
  export * from './enums/order'
  // ... 其他 enums

  // DTOs
  export * from './dtos/product-dto'
  // ... 其他 DTOs

  // API
  export * from './api/response'
  ```

#### 2.1.8 建立文檔

- [x] 建立 `packages/shared-types/README.md`
  - 套件說明
  - 安裝與使用方式
  - 型別範例

---

### 2.2 ui-components 套件

#### 2.2.1 建立套件結構

- [x] 建立 `packages/ui-components/` 目錄結構
  ```
  packages/ui-components/
  ├── src/
  │   ├── components/
  │   │   ├── base/       # Button, Input, Card 等
  │   │   ├── data/       # Table, Pagination 等
  │   │   ├── form/       # FormInput, FormSelect 等
  │   │   └── business/   # ProductCard, AuctionTimer 等
  │   ├── composables/    # 共用 composables
  │   ├── styles/         # 共用樣式
  │   └── index.ts
  ├── package.json
  ├── tsconfig.json
  └── README.md
  ```

#### 2.2.2 配置 package.json

- [x] 建立 `packages/ui-components/package.json`
  ```json
  {
    "name": "@card-erp/ui-components",
    "version": "1.0.0",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "scripts": {
      "build": "vite build",
      "type-check": "vue-tsc --noEmit"
    },
    "peerDependencies": {
      "vue": "^3.3.0"
    },
    "devDependencies": {
      "vue": "^3.3.0",
      "vite": "^5.0.0",
      "vue-tsc": "^1.8.0"
    }
  }
  ```

#### 2.2.3 建立基礎元件（components/base/）

- [x] `Button.vue`

  ```vue
  <script setup lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  })

  const emit = defineEmits<{
    click: [event: MouseEvent]
  }>()
  </script>

  <template>
    <button
      :class="['btn', `btn-${variant}`, `btn-${size}`, { 'btn-loading': loading }]"
      :disabled="disabled || loading"
      @click="emit('click', $event)"
    >
      <slot />
    </button>
  </template>
  ```

- [x] `Card.vue`
- [x] `Modal.vue`
- [x] `Toast.vue`
- [x] `Input.vue`

#### 2.2.4 建立資料展示元件（components/data/）

- [x] `Table.vue`
- [x] `Pagination.vue`
- [x] `EmptyState.vue`

#### 2.2.5 建立表單元件（components/form/）

- [x] `FormInput.vue`
- [x] `FormSelect.vue`
- [x] `FormUpload.vue`

#### 2.2.6 建立業務元件（components/business/）

- [x] `ProductCard.vue`

  ```vue
  <script setup lang="ts">
  import type { Product } from '@card-erp/shared-types'

  interface Props {
    product: Product
    compact?: boolean
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    click: [product: Product]
  }>()
  </script>

  <template>
    <Card class="product-card" @click="emit('click', product)">
      <img :src="product.images[0]?.url" :alt="product.name" />
      <h3>{{ product.name }}</h3>
      <p class="price">${{ product.sellingPrice }}</p>
      <Badge v-if="product.gradingStatus" :text="product.gradingStatus" />
    </Card>
  </template>
  ```

- [x] `OrderStatus.vue`
- [x] `AuctionTimer.vue`

#### 2.2.7 建立匯出入口

- [x] `src/index.ts`

  ```typescript
  // Base
  export { default as Button } from './components/base/Button.vue'
  export { default as Card } from './components/base/Card.vue'
  // ... 其他元件

  // Data
  export { default as Table } from './components/data/Table.vue'
  // ...

  // Form
  export { default as FormInput } from './components/form/FormInput.vue'
  // ...

  // Business
  export { default as ProductCard } from './components/business/ProductCard.vue'
  // ...
  ```

---

### 2.3 utils 套件

#### 2.3.1 建立套件結構

- [x] 建立 `packages/utils/` 目錄結構
  ```
  packages/utils/
  ├── src/
  │   ├── formatters/   # 格式化工具
  │   ├── validators/   # 驗證工具
  │   ├── calculators/  # 計算工具
  │   ├── string/       # 字串處理
  │   └── index.ts
  ├── tests/            # 單元測試
  ├── package.json
  ├── tsconfig.json
  ├── vitest.config.ts
  └── README.md
  ```

#### 2.3.2 建立格式化工具（formatters/）

- [x] `formatters/currency.ts`

  ```typescript
  export function formatCurrency(amount: number, currency = 'TWD'): string {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  export function parseCurrency(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]+/g, ''))
  }
  ```

- [x] `formatters/date.ts`

  ```typescript
  export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
    // 實作日期格式化
  }

  export function formatRelativeTime(date: Date | string): string {
    // 實作相對時間（例如：2 小時前）
  }
  ```

- [x] `formatters/phone.ts`
- [x] `formatters/number.ts`

#### 2.3.3 建立驗證工具（validators/）

- [x] `validators/email.ts`

  ```typescript
  export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  ```

- [x] `validators/phone.ts`
- [x] `validators/card-number.ts`（卡片編號驗證）

#### 2.3.4 建立計算工具（calculators/）

- [x] `calculators/commission.ts`

  ```typescript
  export function calculateCommission(sellingPrice: number, commissionRate: number): number {
    return sellingPrice * (commissionRate / 100)
  }

  export function calculateNetIncome(
    sellingPrice: number,
    costPrice: number,
    commissionRate: number,
    listingFee: number
  ): number {
    const commission = calculateCommission(sellingPrice, commissionRate)
    return sellingPrice - costPrice - commission - listingFee
  }
  ```

#### 2.3.5 建立字串處理工具（string/）

- [ ] `string/slug.ts`
- [ ] `string/sanitize.ts`

#### 2.3.6 單元測試

- [x] 為所有工具函數建立測試

  ```typescript
  // tests/formatters/currency.test.ts
  import { describe, it, expect } from 'vitest'
  import { formatCurrency, parseCurrency } from '@/formatters/currency'

  describe('formatCurrency', () => {
    it('should format number as TWD currency', () => {
      expect(formatCurrency(1000)).toBe('NT$1,000')
    })

    it('should handle decimal places', () => {
      expect(formatCurrency(1234.56)).toBe('NT$1,235')
    })
  })
  ```

- [ ] 目標：測試覆蓋率 > 90%

---

### 2.4 整合測試

#### 2.4.1 測試套件間引用

- [ ] 在 utils 中引用 shared-types
- [ ] 在 ui-components 中引用 shared-types
- [ ] 驗證型別正確傳遞

#### 2.4.2 建立範例專案

- [ ] 建立 `examples/` 資料夾
- [ ] 建立簡單的 Vue 3 專案引用套件
- [ ] 驗證所有元件與工具正常運作

---

## 🧪 測試步驟

1. **型別檢查**

   ```bash
   pnpm --filter @card-erp/shared-types type-check
   pnpm --filter @card-erp/ui-components type-check
   pnpm --filter @card-erp/utils type-check
   ```

2. **單元測試**

   ```bash
   pnpm --filter @card-erp/utils test
   ```

3. **建置測試**

   ```bash
   pnpm --filter @card-erp/shared-types build
   pnpm --filter @card-erp/ui-components build
   pnpm --filter @card-erp/utils build
   ```

4. **引用測試**
   - 在 API 專案中引用 shared-types
   - 在前端專案中引用 ui-components

---

## 📝 交付物

- [x] `packages/shared-types/` 完整套件
- [x] `packages/ui-components/` 完整套件
- [ ] `packages/utils/` 完整套件
- [ ] 每個套件的 README.md
- [ ] 單元測試（utils）
- [ ] 使用範例文檔

---

## 🚨 注意事項

1. **禁止使用 any**: 所有型別必須明確定義（測試除外）
2. **命名一致性**: 遵循 PascalCase（型別）、camelCase（函數）
3. **文檔完整性**: 每個公開的型別和函數都需要 JSDoc 註解
4. **向後相容**: 一旦發布，避免破壞性變更
5. **依賴最小化**: 共用套件應避免外部依賴

---

## 🔗 相關文件

- [TypeScript 規範](../../CLAUDE.md#代碼風格)
- [Vue 3 文檔](https://vuejs.org/)
- [Vitest 文檔](https://vitest.dev/)

---

## 📊 進度追蹤

| 子任務            | 狀態      | 負責人              | 完成日期   |
| ----------------- | --------- | ------------------- | ---------- |
| 2.1 shared-types  | ✅ 完成   | Gemini CLI + Claude | 2026-02-08 |
| 2.2 ui-components | ✅ 完成   | Gemini CLI + Codex  | 2026-02-13 |
| 2.3 utils         | ⏳ 未開始 | -                   | -          |
| 2.4 整合測試      | ⏳ 未開始 | -                   | -          |

---

**上一個任務**: [01 - 環境建置](./01-environment-setup.md)
**下一個任務**: [03 - 資料庫設計](./03-database-schema.md)
