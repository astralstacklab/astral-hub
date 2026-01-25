# Task 21: 測試

## 概述

建立完整的測試策略，包含單元測試、整合測試與 E2E 測試，確保系統穩定性與程式碼品質。

## 依賴

- 所有前置任務（01-20）

---

## 一、測試策略

### 1.1 測試金字塔

```
         /\
        /  \  E2E 測試（少量）
       /----\
      /      \  整合測試（適量）
     /--------\
    /          \
   /------------\  單元測試（大量）
  /______________\
```

- **單元測試**：70% - 測試獨立函式與邏輯
- **整合測試**：20% - 測試 API 與資料庫互動
- **E2E 測試**：10% - 測試完整使用者流程

### 1.2 覆蓋率目標

- **單元測試**：> 80%
- **整合測試**：> 60%
- **關鍵路徑**：> 90%

---

## 二、單元測試（Vitest）

### 2.1 安裝依賴

```bash
# 所有 apps 與 packages
pnpm add -D vitest @vitest/ui @vitest/coverage-v8
pnpm add -D @vue/test-utils happy-dom
```

### 2.2 Vitest 配置

```typescript
// packages/shared-types/vitest.config.ts

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
})
```

```typescript
// apps/api/vitest.config.ts

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        'src/test/**',
      ],
    },
  },
})
```

```typescript
// apps/buyer-web/vitest.config.ts

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### 2.3 測試範例（Shared Types）

```typescript
// packages/shared-types/src/__tests__/schemas.test.ts

import { describe, it, expect } from 'vitest'
import { CreateProductSchema, UpdateProductSchema } from '../schemas/product.schema'

describe('Product Schemas', () => {
  describe('CreateProductSchema', () => {
    it('should validate valid product data', () => {
      const validData = {
        type: 'TRADING_CARD',
        category: 'Pokemon',
        name: 'Pikachu',
        sellingPrice: 100,
        sourceType: 'SELF_OPERATED',
        status: 'AVAILABLE',
      }

      const result = CreateProductSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid product type', () => {
      const invalidData = {
        type: 'INVALID_TYPE',
        category: 'Pokemon',
        name: 'Pikachu',
        sellingPrice: 100,
      }

      const result = CreateProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative price', () => {
      const invalidData = {
        type: 'TRADING_CARD',
        category: 'Pokemon',
        name: 'Pikachu',
        sellingPrice: -100,
      }

      const result = CreateProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const invalidData = {
        type: 'TRADING_CARD',
        category: 'Pokemon',
        name: '',
        sellingPrice: 100,
      }

      const result = CreateProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateProductSchema', () => {
    it('should allow partial updates', () => {
      const validData = {
        name: 'Updated Name',
      }

      const result = UpdateProductSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = UpdateProductSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})
```

### 2.4 測試範例（API Service）

```typescript
// apps/api/src/services/__tests__/products.service.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { ProductsService } from '../products.service'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const redis = new Redis()

describe('ProductsService', () => {
  let service: ProductsService

  beforeEach(async () => {
    service = new ProductsService(prisma, redis)

    // 清空測試資料
    await prisma.product.deleteMany()
  })

  afterEach(async () => {
    await prisma.product.deleteMany()
    await redis.flushdb()
  })

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        type: 'TRADING_CARD' as const,
        category: 'Pokemon',
        name: 'Pikachu',
        sellingPrice: 100,
        sourceType: 'SELF_OPERATED' as const,
        status: 'AVAILABLE' as const,
      }

      const product = await service.createProduct(productData)

      expect(product).toHaveProperty('id')
      expect(product.name).toBe('Pikachu')
      expect(product.sellingPrice).toBe('100.00')
      expect(product.qrCode).toBeDefined()
    })

    it('should generate QR code', async () => {
      const productData = {
        type: 'TRADING_CARD' as const,
        category: 'Pokemon',
        name: 'Charizard',
        sellingPrice: 500,
        sourceType: 'SELF_OPERATED' as const,
        status: 'AVAILABLE' as const,
      }

      const product = await service.createProduct(productData)

      expect(product.qrCode).toContain('data:image/png;base64,')
    })
  })

  describe('getProducts', () => {
    beforeEach(async () => {
      // 建立測試資料
      await prisma.product.createMany({
        data: [
          { type: 'TRADING_CARD', category: 'Pokemon', name: 'Product 1', sellingPrice: 100, sourceType: 'SELF_OPERATED', status: 'AVAILABLE' },
          { type: 'TRADING_CARD', category: 'Pokemon', name: 'Product 2', sellingPrice: 200, sourceType: 'SELF_OPERATED', status: 'AVAILABLE' },
          { type: 'TRADING_CARD', category: 'OnePiece', name: 'Product 3', sellingPrice: 300, sourceType: 'CONSIGNMENT', status: 'SOLD' },
        ],
      })
    })

    it('should return paginated products', async () => {
      const result = await service.getProducts({ page: 1, pageSize: 2 })

      expect(result.products).toHaveLength(2)
      expect(result.pagination.totalPages).toBe(2)
      expect(result.pagination.totalItems).toBe(3)
    })

    it('should filter by category', async () => {
      const result = await service.getProducts({ category: 'OnePiece', page: 1, pageSize: 10 })

      expect(result.products).toHaveLength(1)
      expect(result.products[0].name).toBe('Product 3')
    })

    it('should filter by status', async () => {
      const result = await service.getProducts({ status: 'SOLD', page: 1, pageSize: 10 })

      expect(result.products).toHaveLength(1)
      expect(result.products[0].status).toBe('SOLD')
    })

    it('should cache results', async () => {
      // 第一次查詢
      await service.getProducts({ page: 1, pageSize: 10 })

      // 檢查 Redis 快取
      const cacheKey = 'products:list:' + JSON.stringify({ page: 1, pageSize: 10 })
      const cached = await redis.get(cacheKey)

      expect(cached).toBeDefined()
    })
  })

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const product = await prisma.product.create({
        data: {
          type: 'TRADING_CARD',
          category: 'Pokemon',
          name: 'To Delete',
          sellingPrice: 100,
          sourceType: 'SELF_OPERATED',
          status: 'AVAILABLE',
        },
      })

      await service.deleteProduct(product.id)

      const deleted = await prisma.product.findUnique({ where: { id: product.id } })
      expect(deleted).toBeNull()
    })

    it('should throw error if product not found', async () => {
      await expect(service.deleteProduct('non-existent-id')).rejects.toThrow('Product not found')
    })
  })
})
```

### 2.5 測試範例（Vue Component）

```typescript
// apps/buyer-web/components/__tests__/ProductCard.test.ts

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from '../ProductCard.vue'

describe('ProductCard', () => {
  const mockProduct = {
    id: 'test-1',
    type: 'TRADING_CARD' as const,
    category: 'Pokemon',
    name: 'Pikachu',
    sellingPrice: '100.00',
    status: 'AVAILABLE' as const,
    images: ['https://example.com/image.jpg'],
    createdAt: '2026-01-25T00:00:00Z',
  }

  it('renders product name', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
    })

    expect(wrapper.text()).toContain('Pikachu')
  })

  it('renders product price', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
    })

    expect(wrapper.text()).toContain('100')
  })

  it('renders product category', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
    })

    expect(wrapper.text()).toContain('Pokemon')
  })

  it('shows sold badge when status is SOLD', () => {
    const soldProduct = { ...mockProduct, status: 'SOLD' as const }
    const wrapper = mount(ProductCard, {
      props: { product: soldProduct },
    })

    expect(wrapper.text()).toContain('已售出')
  })

  it('shows add to cart button when available', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
    })

    expect(wrapper.text()).toContain('加入購物車')
  })
})
```

---

## 三、整合測試

### 3.1 API 整合測試

```typescript
// apps/api/src/test/integration/products.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../helper'
import { FastifyInstance } from 'fastify'

describe('Products API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await build()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /api/products', () => {
    it('should return 200 and products list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('products')
      expect(body).toHaveProperty('pagination')
    })

    it('should filter by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products?category=Pokemon',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      body.products.forEach(product => {
        expect(product.category).toBe('Pokemon')
      })
    })
  })

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        type: 'TRADING_CARD',
        category: 'Pokemon',
        name: 'Test Product',
        sellingPrice: 100,
        sourceType: 'SELF_OPERATED',
        status: 'AVAILABLE',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: productData,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('Test Product')
      expect(body.qrCode).toBeDefined()
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        type: 'INVALID_TYPE',
        category: 'Pokemon',
        name: '',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: invalidData,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})
```

### 3.2 測試輔助工具

```typescript
// apps/api/src/test/helper.ts

import Fastify, { FastifyInstance } from 'fastify'
import { app as buildApp } from '../app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function build(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  await buildApp(app)

  return app
}

export async function clearDatabase(): Promise<void> {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.seller.deleteMany()
}
```

---

## 四、E2E 測試（Playwright）

### 4.1 安裝 Playwright

```bash
# apps/buyer-web
pnpm add -D @playwright/test
pnpm exec playwright install
```

### 4.2 Playwright 配置

```typescript
// apps/buyer-web/playwright.config.ts

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 4.3 E2E 測試範例

```typescript
// apps/buyer-web/e2e/shopping-flow.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Shopping Flow', () => {
  test('should complete a purchase', async ({ page }) => {
    // 1. 前往首頁
    await page.goto('/')
    await expect(page).toHaveTitle(/卡牌商城/)

    // 2. 進入商品列表
    await page.click('text=瀏覽商品')
    await expect(page).toHaveURL(/\/products/)

    // 3. 點擊第一個商品
    await page.click('.product-card:first-child')
    await expect(page.locator('h1')).toBeVisible()

    // 4. 加入購物車
    await page.click('text=加入購物車')

    // 5. 前往購物車
    await page.click('a[href="/cart"]')
    await expect(page).toHaveURL(/\/cart/)

    // 6. 驗證商品在購物車中
    await expect(page.locator('.cart-item')).toBeVisible()

    // 7. 前往結帳
    await page.click('text=前往結帳')
    await expect(page).toHaveURL(/\/cart\/checkout/)

    // 8. 填寫收件人資訊
    await page.fill('input[name="recipientName"]', '測試買家')
    await page.fill('input[name="recipientPhone"]', '0912345678')
    await page.fill('input[name="recipientEmail"]', 'test@example.com')

    // 9. 選擇配送方式
    await page.click('input[value="HOME_DELIVERY"]')
    await page.fill('input[name="shippingAddress"]', '台北市信義區信義路五段7號')

    // 10. 選擇付款方式
    await page.click('input[value="CASH"]')

    // 11. 提交訂單
    await page.click('text=確認訂單')

    // 12. 驗證導向成功頁
    await expect(page).toHaveURL(/\/cart\/success/)
    await expect(page.locator('text=訂單建立成功')).toBeVisible()
  })

  test('should search and filter products', async ({ page }) => {
    await page.goto('/products')

    // 搜尋商品
    await page.fill('input[placeholder*="搜尋"]', 'Pikachu')
    await page.press('input[placeholder*="搜尋"]', 'Enter')

    // 等待結果載入
    await page.waitForLoadState('networkidle')

    // 驗證搜尋結果
    await expect(page.locator('.product-card')).toBeVisible()

    // 篩選類別
    await page.selectOption('select[name="category"]', 'Pokemon')

    // 等待篩選結果
    await page.waitForLoadState('networkidle')

    // 驗證篩選結果
    const cards = page.locator('.product-card')
    await expect(cards.first()).toBeVisible()
  })
})
```

### 4.4 E2E 測試（Admin）

```typescript
// apps/admin-web/e2e/product-management.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登入
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('should create a new product', async ({ page }) => {
    // 前往商品管理
    await page.click('text=商品管理')
    await expect(page).toHaveURL(/\/products/)

    // 點擊新增商品
    await page.click('text=新增商品')
    await expect(page).toHaveURL(/\/products\/new/)

    // 填寫表單
    await page.selectOption('select[name="type"]', 'TRADING_CARD')
    await page.fill('input[name="category"]', 'Pokemon')
    await page.fill('input[name="name"]', 'Test Product E2E')
    await page.fill('textarea[name="description"]', 'This is a test product')
    await page.fill('input[name="sellingPrice"]', '999')

    // 提交表單
    await page.click('text=儲存商品')

    // 驗證導向商品列表
    await expect(page).toHaveURL(/\/products$/)

    // 驗證商品出現在列表中
    await expect(page.locator('text=Test Product E2E')).toBeVisible()
  })

  test('should edit a product', async ({ page }) => {
    await page.goto('/products')

    // 點擊編輯按鈕
    await page.click('text=編輯 >> nth=0')

    // 修改名稱
    await page.fill('input[name="name"]', 'Updated Product Name')

    // 儲存
    await page.click('text=儲存商品')

    // 驗證更新成功
    await expect(page.locator('text=Updated Product Name')).toBeVisible()
  })

  test('should delete a product', async ({ page }) => {
    await page.goto('/products')

    // 點擊刪除按鈕
    page.on('dialog', dialog => dialog.accept())
    await page.click('text=刪除 >> nth=0')

    // 驗證商品已刪除（等待列表重新載入）
    await page.waitForLoadState('networkidle')
  })
})
```

---

## 五、測試腳本

### 5.1 package.json 更新

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:ci": "vitest run && playwright test"
  }
}
```

---

## 六、CI/CD 整合（GitHub Actions）

### 6.1 測試工作流程

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 七、驗收標準

- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試覆蓋關鍵 API
- [ ] E2E 測試覆蓋主要使用者流程
- [ ] 所有測試可在 CI/CD 中執行
- [ ] Vitest 測試正常運作
- [ ] Playwright E2E 測試正常運作
- [ ] 測試報告可正確生成
- [ ] 無使用 `any` 型別（除單元測試外）

---

## 八、注意事項

1. **測試資料隔離**：
   - 每個測試使用獨立的資料庫
   - 測試前後清理資料
   - 使用 transaction rollback（可選）

2. **Mock 與 Stub**：
   - 外部服務使用 Mock（ECPay、GCS）
   - 時間相關使用固定值
   - 隨機數使用固定 seed

3. **效能**：
   - 並行執行測試（Vitest 預設）
   - 使用 in-memory Redis（測試環境）
   - 最小化資料庫操作

4. **可維護性**：
   - 測試命名清晰（描述性）
   - 共用測試資料使用 fixture
   - 避免測試間依賴

5. **CI/CD**：
   - PR 必須通過所有測試
   - 覆蓋率不可下降
   - E2E 測試可選擇性執行（較慢）

---

## 九、後續任務

- **Task 22**: Deployment（GCP Cloud Run 部署）
