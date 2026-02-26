# @astral-hub/ui-components

Astral Hub 共用 Vue 3 元件庫，採 Headless + 預設 Tailwind CSS class 模式。

## 安裝

此套件為 monorepo 內部套件，透過 pnpm workspace 自動連結：

```json
{
  "dependencies": {
    "@astral-hub/ui-components": "workspace:*"
  }
}
```

**Peer Dependencies**: Vue 3.3+

## 使用

```vue
<script setup lang="ts">
import { Button, Card, Table, FormInput, ProductCard } from '@astral-hub/ui-components'
</script>

<template>
  <Button variant="primary" @click="handleClick">確認</Button>
  <FormInput v-model="name" label="商品名稱" required />
  <ProductCard :product="product" @click="viewProduct" />
</template>
```

## 元件清單

### 基礎元件 (Base)

| 元件     | 說明                                     |
| -------- | ---------------------------------------- |
| `Button` | 按鈕，支援 variant/size/loading          |
| `Input`  | 文字輸入框，支援 prefix/suffix slots     |
| `Card`   | 卡片容器，支援 header/footer + hoverable |
| `Modal`  | 對話框，Teleport + Escape 關閉 + ARIA    |
| `Toast`  | 提示訊息，自動消失 + 多種類型            |

### 資料展示 (Data)

| 元件         | 說明                                       |
| ------------ | ------------------------------------------ |
| `Table`      | 資料表格，支援排序事件 + 自定義 cell slots |
| `Pagination` | 分頁導航，支援 v-model:currentPage         |
| `EmptyState` | 空狀態佔位，支援 icon/action slots         |

### 表單 (Form)

| 元件         | 說明                                |
| ------------ | ----------------------------------- |
| `FormInput`  | 表單輸入框，含 label/error/hint     |
| `FormSelect` | 下拉選擇，含 placeholder + 型別保留 |
| `FormUpload` | 檔案上傳，拖放 + 預覽 + 驗證        |

### 業務元件 (Business)

| 元件           | 說明                             |
| -------------- | -------------------------------- |
| `ProductCard`  | 商品卡片，顯示圖片/價格/鑑定狀態 |
| `OrderStatus`  | 訂單狀態標籤，語意色彩           |
| `AuctionTimer` | 競標倒數計時器，即時更新         |

## 設計原則

- **Semantic Tailwind class**: 不硬編碼品牌色彩，使用 `bg-primary`、`text-danger` 等語意 class
- **Props + withDefaults**: 所有元件使用 TypeScript interface 定義 props
- **Slots**: 每個元件提供合理的 slots 供外部覆寫
- **Events**: 使用 `defineEmits` 明確定義事件型別

## 開發

```bash
# 型別檢查
pnpm --filter @astral-hub/ui-components type-check

# 建置
pnpm --filter @astral-hub/ui-components build
```

## 套件結構

```
src/
├── components/
│   ├── base/        # 基礎元件（Button, Input, Card, Modal, Toast）
│   ├── data/        # 資料展示（Table, Pagination, EmptyState）
│   ├── form/        # 表單元件（FormInput, FormSelect, FormUpload）
│   └── business/    # 業務元件（ProductCard, OrderStatus, AuctionTimer）
├── env.d.ts         # Vue SFC 型別宣告
└── index.ts         # 統一匯出入口
```
