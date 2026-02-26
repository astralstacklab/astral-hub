# @astral-hub/utils

Astral Hub 共用工具函數庫，提供格式化、驗證、計算與字串處理等常用純函數。

## 安裝方式

一般安裝：

```bash
pnpm add @astral-hub/utils
```

Monorepo workspace 內使用：

```json
{
  "dependencies": {
    "@astral-hub/utils": "workspace:*"
  }
}
```

## 套件結構

```
packages/utils/
├── src/
│   ├── formatters/     # 格式化工具（currency, date, phone, number）
│   ├── validators/     # 驗證工具（email, phone, card-number）
│   ├── calculators/    # 計算工具（commission）
│   ├── string/         # 字串處理（slug, sanitize）
│   └── index.ts        # 統一匯出入口
├── tests/              # 單元測試（鏡射 src/ 結構）
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 功能分類清單

### Formatters

- `formatCurrency`, `parseCurrency`
- `formatDate`, `formatRelativeTime`
- `formatPhone`, `formatLandline`
- `formatNumber`, `formatPercent`, `formatCompact`

### Validators

- `isValidEmail`
- `isValidMobilePhone`, `isValidLandline`, `isValidPhone`
- `isValidCardNumber`, `parseCardNumber`

### Calculators

- `calculateCommission`
- `calculateNetIncome`
- `calculateProfitMargin`

### String

- `toSlug`
- `sanitizeHtml`
- `truncate`

## 使用範例

### Formatters

```ts
import { formatCurrency } from '@astral-hub/utils'

const value = formatCurrency(1000) // NT$1,000
```

### Validators

```ts
import { isValidEmail } from '@astral-hub/utils'

const ok = isValidEmail('user@example.com') // true
```

### Calculators

```ts
import { calculateNetIncome } from '@astral-hub/utils'

const income = calculateNetIncome(1000, 500, 10, 30) // 370
```

### String

```ts
import { toSlug, sanitizeHtml, truncate } from '@astral-hub/utils'

const slug = toSlug('寶可夢 卡片 001') // 寶可夢-卡片-001
const safe = sanitizeHtml('<script>alert("xss")</script>')
const short = truncate('這是一段很長的文字', 6) // 這是一...
```

## 開發指令

```bash
# 型別檢查
pnpm --filter @astral-hub/utils type-check

# 測試
pnpm --filter @astral-hub/utils test

# 測試（監看）
pnpm --filter @astral-hub/utils test:watch

# 測試覆蓋率
pnpm --filter @astral-hub/utils test:coverage

# 建置
pnpm --filter @astral-hub/utils build
```
