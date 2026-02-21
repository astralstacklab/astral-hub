# Task 11: 買家前台商品頁面

## 概述

建立買家前台商品列表頁與商品詳情頁，包含搜尋、篩選、分頁、圖片預覽、加入購物車等功能。

## 依賴

- Task 05: Products API（商品 API 已建立）
- Task 10: Buyer Web Setup（前台基礎已建立）

## 已由 Task 10 完成的基礎

> 以下已在 Task 10 Mission C 中實作完成，**本任務不需重做**：

- **API Client**: `utils/api.ts` — `$fetch` 封裝 + Auth header + 錯誤處理
- **Products Composables**: `composables/useProducts.ts` — `useProducts(query)` + `useProduct(id)` + `useAsyncData`
- **Cart Store**: `stores/cart.ts` — `addItem(product: Product, quantity?)` + `pinia-plugin-persistedstate`
- **型別定義**: `types/index.ts` — `CartItem`、`ProductListQuery`、`ProductEntity`（re-export from shared-types）
- **共用元件**: `NeonButton`、`LoadingSpinner`、`ErrorMessage`

---

## 主題風格指引

> **重要：Task 10 實作了 DeFi Cyberpunk Neon 主題，所有新元件必須遵循此風格。**

### 色彩系統

| 用途             | Class / Variable                                                            |
| ---------------- | --------------------------------------------------------------------------- | ------- | -------- |
| 背景             | `bg-black`, `bg-dark/50`                                                    |
| 主色 (cyan)      | `text-neon-cyan`, `border-neon-cyan/20`, `hover:border-neon-cyan/60`        |
| 強調色 (magenta) | `text-neon-magenta`, `bg-neon-magenta`                                      |
| 文字主色         | `text-text-primary` (白色)                                                  |
| 文字次色         | `text-text-secondary` (灰色)                                                |
| 卡片樣式         | `rounded-xl border border-neon-cyan/20 bg-dark/50 backdrop-blur-sm`         |
| 按鈕             | `<NeonButton variant="cyan                                                  | magenta | ghost">` |
| 輸入框           | 自訂：`bg-dark/50 border border-neon-cyan/20 text-text-primary rounded ...` |
| 霓虹發光         | `neon-text` class 或 `[text-shadow:0_0_14px_rgba(0,240,255,0.7)]`           |

### 字體

- 標題：`font-display` (Orbitron) + `uppercase tracking-[0.12em]`
- 內文：`font-sans` (Noto Sans TC)
- 數據：`font-mono` (JetBrains Mono)

### 參考檔案

- `apps/buyer-web/assets/css/tailwind.css` — CSS 變數與 @layer components
- `apps/buyer-web/tailwind.config.cjs` — 自訂 colors/fonts/animations
- `apps/buyer-web/components/NeonButton.vue` — 按鈕元件參考
- `apps/buyer-web/pages/index.vue` — 首頁卡片風格參考

---

## 一、新增元件

### 1.1 ProductCard 商品卡片

**檔案**: `apps/buyer-web/components/ProductCard.vue`

**需求**:

- 接受 `Product`（from `@card-erp/shared-types`）prop
- 顯示：圖片（aspect-square）、類別、名稱（line-clamp-2）、售價（font-mono + neon-cyan glow）
- 狀態標籤：SOLD → 紅色 badge、PENDING → 黃色 badge
- 點擊跳轉 `/products/${id}`
- 「加入購物車」按鈕（AVAILABLE 狀態才顯示），使用 `<NeonButton size="sm">`
- 卡片 hover 效果：`hover:border-neon-cyan/60 hover:shadow-neon-cyan`
- 無圖片時顯示 SVG placeholder

**Cart 操作**:

```typescript
import { useCartStore } from '~/stores/cart'
const cartStore = useCartStore()
cartStore.addItem(product) // Product from @card-erp/shared-types
```

### 1.2 ProductFilter 篩選器

**檔案**: `apps/buyer-web/components/ProductFilter.vue`

**需求**:

- `v-model:filters` pattern（emit `update:filters`）
- 篩選項目：類別（Pokemon/OnePiece/YuGiOh/Baseball）、價格範圍（min/max）、狀態（AVAILABLE/SOLD）
- 重置按鈕
- 輸入框/下拉選單需用 Cyberpunk 風格（黑底 + neon-cyan border）
- 面板外框用卡片樣式

### 1.3 Pagination 分頁

**檔案**: `apps/buyer-web/components/Pagination.vue`

**需求**:

- Props: `currentPage`, `totalPages`
- Emit: `page-change`
- 頁碼邏輯：總頁 ≤ 7 全顯示；> 7 用 `...` 省略
- 當前頁用 NeonButton cyan，其他頁用 ghost variant
- 上一頁/下一頁 disabled 處理

### 1.4 ImageGallery 圖片畫廊

**檔案**: `apps/buyer-web/components/ImageGallery.vue`

**需求**:

- Props: `images: string[]`
- 主圖 + 縮圖列表（grid-cols-4），點擊切換
- 點擊主圖開啟 Lightbox（用 `<Teleport to="body">`）
- Lightbox: 全螢幕黑底、X 關閉、ESC 關閉
- 無圖片 placeholder

---

## 二、頁面

### 2.1 商品列表頁

**檔案**: `apps/buyer-web/pages/products/index.vue`

**需求**:

- 使用 `useProducts(query)` composable（已存在）
- 左側篩選器（`<ProductFilter>`）+ 右側商品 grid
- 搜尋欄 + 排序下拉（最新/價格升/降）
- 商品 grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- `<Pagination>` 分頁，換頁滾動至頂部
- Loading / Error / Empty 三態處理
- SEO: `useHead()` 設定 title + description

**API 整合方式**:

```typescript
// 已有 composable，直接使用
const query = reactive<ProductListQuery>({ page: 1, limit: 12 })
const { data: products, pending, error, refresh } = useProducts(query)
```

### 2.2 商品詳情頁

**檔案**: `apps/buyer-web/pages/products/[id].vue`

**需求**:

- 使用 `useProduct(id)` composable（已存在）
- 左側：`<ImageGallery>`
- 右側：類別、名稱、價格（大字 neon-cyan glow）、狀態 badge、描述、規格 grid
- 麵包屑導航：首頁 / 商品列表 / {name}
- 「加入購物車」按鈕（AVAILABLE）或「已售出/暫不販售」disabled
- 返回商品列表按鈕
- SEO: 動態 title + description

---

## 三、驗收標準

- [ ] 商品列表頁正常顯示，包含搜尋、篩選、排序、分頁功能
- [ ] 商品卡片正確顯示商品資訊、圖片、價格
- [ ] 篩選器可正常篩選類別、價格、狀態
- [ ] 分頁功能正常運作，換頁時滾動至頂部
- [ ] 商品詳情頁正確顯示完整商品資訊
- [ ] 圖片畫廊可切換圖片，點擊放大檢視（Lightbox）
- [ ] 加入購物車功能正常運作
- [ ] 響應式設計在手機/平板/桌面正常顯示
- [ ] **DeFi Cyberpunk Neon 主題一致性**（黑底、霓虹色、正確字體）
- [ ] SEO meta tags 正確設定
- [ ] 無使用 `any` 型別（除測試外）
- [ ] Loading / Error / Empty 狀態正確處理
- [ ] E2E 測試覆蓋關鍵流程

---

## 四、注意事項

1. **API 整合**：直接使用 Task 10 建立的 `useProducts` / `useProduct` composable，勿重複封裝
2. **型別**：`Product` 統一從 `@card-erp/shared-types` import，前端額外型別放 `~/types/index.ts`
3. **購物車**：`cartStore.addItem(product)` 接受 `Product` from shared-types，不需轉換
4. **Teleport**：Lightbox/Modal 使用 `<Teleport to="body">` 避免 z-index stacking context 問題
5. **效能**：圖片 lazy loading、篩選/搜尋 debounce、大量資料考慮虛擬滾動
6. **SSR**：商品詳情頁使用 `useAsyncData` 確保 SSR 渲染（composable 已處理）

---

## 五、後續任務

- **Task 12**: Buyer Web Auctions（競標頁面）
- **Task 13**: Buyer Web Cart（購物車與結帳）
