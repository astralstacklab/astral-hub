# ui-components 套件 全局實作計畫

> **For Claude:** 本計畫採分段管線（4.3 節），拆為多個 Mission 逐步執行。

**Goal:** 建立 `@astral-hub/ui-components` 共用 Vue 3 元件庫，採 Headless + 預設 Tailwind class 模式，供三個前端應用（Admin/Buyer/POS）共用。

**Architecture:** Headless 元件提供完整的 props/events/slots/accessibility 邏輯，自帶基本 Tailwind class 作為預設樣式，各 app 可透過 class prop 覆寫。使用 Vite library mode 建置，vue-tsc 做型別檢查。

**Tech Stack:** Vue 3.3+, TypeScript, Vite (library mode), Tailwind CSS, @astral-hub/shared-types

---

## 設計決策

### Headless + 預設 Tailwind class

- 元件自帶基本 Tailwind class（佈局、互動狀態、無障礙）
- 不包含品牌色彩，使用 semantic class（`bg-primary`、`text-muted` 等由各 app 定義）
- 透過 `class` prop 可完全覆寫外觀
- 業務元件（ProductCard 等）依賴 `@astral-hub/shared-types` 型別

### 元件 API 慣例

```vue
<script setup lang="ts">
// 1. Props 用 interface + withDefaults
// 2. Events 用 defineEmits 明確型別
// 3. 提供 default slot + named slots
// 4. class prop 允許覆寫
</script>
```

---

## Mission 拆分

### Mission A: 套件骨架與建置配置

**範圍**: 3 個檔案

- `packages/ui-components/package.json`
- `packages/ui-components/tsconfig.json`
- `packages/ui-components/vite.config.ts`
- `packages/ui-components/src/index.ts`（空殼）

**驗證**: `pnpm install` + `pnpm --filter @astral-hub/ui-components type-check`

### Mission B: 基礎元件（base/）

**範圍**: 5 個元件

- `Button.vue` — variant/size/disabled/loading
- `Input.vue` — type/placeholder/disabled/error
- `Card.vue` — header/footer slots
- `Modal.vue` — open/close + teleport + 鍵盤操作
- `Toast.vue` — type/message/duration + 自動消失

**驗證**: type-check 通過

### Mission C: 資料展示元件（data/）

**範圍**: 3 個元件

- `Table.vue` — columns/rows/sortable/loading
- `Pagination.vue` — page/totalPages/onChange
- `EmptyState.vue` — icon/title/description slots

**驗證**: type-check 通過

### Mission D: 表單元件（form/）

**範圍**: 3 個元件

- `FormInput.vue` — label/error/required + wraps Input
- `FormSelect.vue` — label/options/error/required
- `FormUpload.vue` — accept/maxSize/preview

**驗證**: type-check 通過

### Mission E: 業務元件（business/）

**範圍**: 3 個元件

- `ProductCard.vue` — 依賴 shared-types Product
- `OrderStatus.vue` — 依賴 shared-types OrderStatus enum
- `AuctionTimer.vue` — countdown + 即時更新

**驗證**: type-check 通過

### Mission F: 匯出入口 + 整合驗證 + 文件

**範圍**: 3 個檔案

- `src/index.ts` — 匯出所有元件
- `README.md`
- 執行 build + 驗證 dist 輸出

**驗證**: build 通過，dist/ 結構正確

---

## 依賴順序

```
Mission A（骨架）
  → Mission B（base）
    → Mission C（data）  ← 可能用到 Card
    → Mission D（form）  ← 用到 Input
    → Mission E（business） ← 用到 Card, shared-types
      → Mission F（匯出 + 驗證）
```

Mission C/D/E 彼此獨立，但都依賴 A+B 完成。
