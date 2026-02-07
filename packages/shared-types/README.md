# @card-erp/shared-types

Card ERP 前後端共用型別定義套件。

## 安裝

此套件為 monorepo 內部套件，透過 pnpm workspace 自動連結：

```json
{
  "dependencies": {
    "@card-erp/shared-types": "workspace:*"
  }
}
```

## 使用

```typescript
import type { Product, ApiResponse, CreateProductDTO } from '@card-erp/shared-types'
import { ProductType, ProductStatus } from '@card-erp/shared-types'
```

## 套件結構

```
src/
├── enums/        # 枚舉（as const 物件 + type 推導）
├── entities/     # 實體型別（Product, Order, User 等）
├── dtos/         # DTO 型別（Create/Update/Query）
├── api/          # API 回應型別（SuccessResponse, ErrorResponse）
└── index.ts      # 統一匯出入口
```

## 開發

```bash
# 型別檢查
pnpm --filter @card-erp/shared-types type-check

# 建置
pnpm --filter @card-erp/shared-types build
```
