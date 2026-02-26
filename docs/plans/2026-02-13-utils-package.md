# utils 套件 全局實作計畫

> **For Claude:** 本計畫採分段管線（4.3 節），拆為 4 個 Mission 逐步執行。

**Goal:** 建立 `@astral-hub/utils` 共用工具函數庫，提供格式化、驗證、計算、字串處理等純 TypeScript 函數，供前後端應用共用。

**Tech Stack:** TypeScript, Vitest（單元測試），無外部依賴（零依賴原則）

---

## 設計決策

### 純函數 + 零依賴

- 所有工具函數為純函數（無副作用）
- 不安裝外部依賴（日期格式化用原生 `Intl` API）
- 每個函數需有 JSDoc 註解
- 所有公開函數需有對應單元測試

### 模組結構

```
src/
├── formatters/   # 格式化工具（currency, date, phone, number）
├── validators/   # 驗證工具（email, phone, card-number）
├── calculators/  # 計算工具（commission）
├── string/       # 字串處理（slug, sanitize）
└── index.ts      # 統一匯出入口
```

### 測試策略

- 使用 Vitest
- 測試檔案放在 `tests/` 目錄，鏡射 `src/` 結構
- 目標覆蓋率 > 90%
- 每個 Mission 的測試與實作同步交付

---

## Mission 拆分

### Mission A: 套件骨架與建置配置

**範圍**: 4 個檔案

- `packages/utils/package.json`
- `packages/utils/tsconfig.json`
- `packages/utils/vitest.config.ts`
- `packages/utils/src/index.ts`（空殼）

**驗證**: `pnpm install` + `pnpm --filter @astral-hub/utils type-check`

### Mission B: 格式化工具（formatters/）

**範圍**: 8 個檔案

- `src/formatters/currency.ts` + `tests/formatters/currency.test.ts`
- `src/formatters/date.ts` + `tests/formatters/date.test.ts`
- `src/formatters/phone.ts` + `tests/formatters/phone.test.ts`
- `src/formatters/number.ts` + `tests/formatters/number.test.ts`

**驗證**: `type-check` + `vitest run`

### Mission C: 驗證工具 + 計算工具

**範圍**: 8 個檔案

- `src/validators/email.ts` + `tests/validators/email.test.ts`
- `src/validators/phone.ts` + `tests/validators/phone.test.ts`
- `src/validators/card-number.ts` + `tests/validators/card-number.test.ts`
- `src/calculators/commission.ts` + `tests/calculators/commission.test.ts`

**驗證**: `type-check` + `vitest run`

### Mission D: 字串工具 + 匯出入口 + README

**範圍**: 5 個檔案

- `src/string/slug.ts` + `tests/string/slug.test.ts`
- `src/string/sanitize.ts` + `tests/string/sanitize.test.ts`
- `src/index.ts`（完整匯出）
- `packages/utils/README.md`

**驗證**: `type-check` + `vitest run` + `build` + 覆蓋率檢查

---

## 依賴順序

```
Mission A（骨架）
  → Mission B（formatters）  ← 可與 C 平行
  → Mission C（validators + calculators）  ← 可與 B 平行
    → Mission D（string + 匯出 + README）
```

Mission B/C 彼此獨立，但都依賴 A 完成。Mission D 需等 B+C 完成後整合匯出。
