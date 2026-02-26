---
name: astral-hub-workflow
description: Astral Hub 專案開發工作流程。在開始任何 Astral Hub 相關開發任務時使用此 skill，確保遵循專案規範與最佳實踐。
---

# Astral Hub 開發工作流程

## 專案背景

Astral Hub 是一個 OMO 收藏卡交易平台，包含：
- **buyer-web**: 買家端 (Nuxt 3 SSR + PWA)
- **admin-web**: 後台管理 (Vue 3 SPA)
- **pos-web**: 店面結帳系統 (Vue 3 PWA)
- **api**: 後端服務 (Fastify + Prisma)

## 開發前檢查清單

在開始任何任務前，確認：

- [ ] 已閱讀相關的任務文件 (`docs/tasks/phase-1-mvp/`)
- [ ] 了解對應的 PRD 需求 (`docs/PRD.md`)
- [ ] 檢查 UI 風格指南（對應應用的 Style Guide）

## TypeScript 嚴格規範

**強制要求**：
- 禁止使用 `any` 類型（單元測試除外）
- 使用 `unknown` 或明確型別定義
- 使用 Zod schema 進行運行時驗證
- 使用 `@astral-hub/shared-types` 共享類型

## 開發流程

### 1. 新功能開發

```
規劃 → TDD → 實作 → 驗證 → Review → 整合
```

1. **規劃**: 閱讀任務文件，理解需求
2. **TDD**: 先寫測試，再寫實作
3. **實作**: 遵循專案結構和命名規範
4. **驗證**: 執行測試，確保通過
5. **Review**: 請求代碼審查
6. **整合**: 等待負責人 commit

### 2. Bug 修復

```
重現 → 分析 → 測試 → 修復 → 驗證
```

1. **重現**: 確認能穩定重現問題
2. **分析**: 使用 systematic-debugging 定位根因
3. **測試**: 寫測試覆蓋該 bug
4. **修復**: 修復問題
5. **驗證**: 確保測試通過，無回歸

## Git 規範

**重要**：Git commit 操作僅由專案負責人執行。

- 使用 Conventional Commits 格式
- 禁止直接 push 到 main/develop
- 功能分支命名：`feature/<功能名稱>`
- 修復分支命名：`fix/<問題描述>`

## 測試要求

- 單元測試覆蓋率：80%+
- 整合測試覆蓋率：60%+
- E2E 測試：關鍵流程必須覆蓋

## 文件同步

**文件先行原則**：執行 A 任務 → 先讀 A 文件 → 完成後更新 A 文件

變更代碼時，必須同步更新相關文件。

## 常用命令

```bash
# 啟動開發伺服器
pnpm --filter api dev          # API 後端
pnpm --filter buyer-web dev    # 買家端
pnpm --filter admin-web dev    # 後台
pnpm --filter pos-web dev      # POS 系統

# 測試
pnpm test                      # 執行所有測試
pnpm --filter api test         # 僅測試 API

# 資料庫
pnpm --filter api prisma studio       # Prisma GUI
pnpm --filter api prisma migrate dev  # 執行遷移

# 代碼品質
pnpm lint                      # ESLint 檢查
pnpm format                    # Prettier 格式化
pnpm type-check                # TypeScript 檢查
```
