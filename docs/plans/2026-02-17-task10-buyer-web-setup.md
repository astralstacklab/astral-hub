# Task 10: Buyer Web 基礎建立 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立 buyer-web Nuxt 3 專案，整合 DeFi Cyberpunk 設計系統、Pinia 狀態管理、API Client，並搭建 Playwright E2E 驗證基礎設施。

**Architecture:** buyer-web 位於 `apps/buyer-web/`，為 Nuxt 3 SSR + PWA 應用。使用 TailwindCSS 搭配 `docs/design-system/BUYER_WEB_STYLE_GUIDE.md` 的 DeFi Cyberpunk 主題（純黑背景 #000000 + 霓虹 Cyan/Magenta/Purple）。狀態管理用 Pinia，API 層用 Nuxt 內建 `$fetch`。Playwright E2E 安裝於 monorepo root，共用於所有前端 app。

**Tech Stack:** Nuxt 3, Vue 3, TailwindCSS 3, Pinia, @vueuse/nuxt, @vite-pwa/nuxt, @playwright/test, TypeScript

---

## Mission 總覽

| Mission       | 內容                                                  | 預估檔案數 | Agent 建議                                     |
| ------------- | ----------------------------------------------------- | ---------- | ---------------------------------------------- |
| **Mission 0** | Playwright E2E 基礎設施（monorepo root）              | 4~5        | 2-Agent（Claude + Gemini），範圍小、需確認環境 |
| **Mission A** | Nuxt 3 專案初始化 + TailwindCSS + DeFi Cyberpunk 主題 | 8~10       | 2-Agent（Claude + Gemini），基礎建置           |
| **Mission B** | Layout + 首頁 + 共用元件                              | 5~7        | 3-Agent（加 Codex review），首次 UI 需嚴格審查 |
| **Mission C** | API Client + Composables + Pinia Store                | 5~6        | 2-Agent（Claude + Gemini），邏輯層為主         |
| **Mission D** | 整合驗證（typecheck + Playwright 截圖 + E2E）         | 3~4        | 2-Agent（Claude 自己跑驗證 + 截圖判讀）        |

---

## Mission 0: Playwright E2E 基礎設施

### 目標

在 monorepo root 安裝 Playwright，建立共用 E2E 測試結構，驗證基礎設施可正常運作。

### 交付檔案

| 動作   | 檔案路徑                                                                      |
| ------ | ----------------------------------------------------------------------------- |
| Modify | `package.json` — 加入 `@playwright/test` devDependency                        |
| Create | `playwright.config.ts` — 多 project 配置（buyer-web / admin-web / pos-web）   |
| Create | `tests/e2e/helpers/screenshot.ts` — 截圖 helper（含 viewport 預設）           |
| Create | `tests/e2e/buyer-web/smoke.spec.ts` — 基礎 smoke test（確認 Playwright 可跑） |

### 重點提示

- `playwright.config.ts` 需定義三個 project（buyer-web / admin-web / pos-web），每個有獨立的 `webServer` 設定
- buyer-web 的 webServer 指向 `pnpm --filter @card-erp/buyer-web dev`，port 3000
- smoke test 先用一個簡單的 `page.goto` + 截圖，確認流程通，不需要實際頁面內容
- screenshot helper 需支援三個 viewport：mobile (375x812), tablet (768x1024), desktop (1280x800)

### Verification Commands

```bash
npx playwright install chromium
npx playwright test tests/e2e/buyer-web/smoke.spec.ts --project=buyer-web
```

### UX 驗證要求

- 無（本 Mission 建立基礎設施，不涉及 UI）

---

## Mission A: Nuxt 3 專案初始化 + TailwindCSS + DeFi Cyberpunk 主題

### 目標

在 `apps/buyer-web/` 初始化 Nuxt 3 專案，整合 TailwindCSS 並套用 BUYER_WEB_STYLE_GUIDE 的 DeFi Cyberpunk 色彩系統、字體系統、霓虹特效。

### 交付檔案

| 動作   | 檔案路徑                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| Create | `apps/buyer-web/package.json`                                                                       |
| Create | `apps/buyer-web/nuxt.config.ts`                                                                     |
| Create | `apps/buyer-web/tsconfig.json`                                                                      |
| Create | `apps/buyer-web/tailwind.config.js` — 含 DeFi Cyberpunk 完整色彩 + 動畫                             |
| Create | `apps/buyer-web/assets/css/tailwind.css` — base layer + 霓虹 utilities                              |
| Create | `apps/buyer-web/assets/css/main.css` — Google Fonts import (Orbitron, Noto Sans TC, JetBrains Mono) |
| Create | `apps/buyer-web/app.vue` — 最小可執行 app                                                           |
| Create | `apps/buyer-web/.env`                                                                               |
| Create | `apps/buyer-web/.gitignore`                                                                         |

### Design Reference

- `docs/design-system/BUYER_WEB_STYLE_GUIDE.md` — 完整色彩/字體/動畫定義
- `docs/design-system/tailwind-preset.js` — 共用 preset
- `docs/design-system/TAILWIND_USAGE.md` — preset 整合方式

### 重點提示

- `tailwind.config.js` 必須包含 Style Guide 底部的完整 Tailwind 配置（colors, fontFamily, backgroundImage, boxShadow, animation, keyframes）
- 加入 `tailwind-preset.js` 作為 preset（按 TAILWIND_USAGE.md 說明）
- `nuxt.config.ts` 需含 runtimeConfig（apiBase）、PWA 基礎配置、TypeScript strict
- `app.vue` 只需渲染一個黑底 + 霓虹文字的最小頁面，確認 Tailwind + 字體生效
- package name: `@card-erp/buyer-web`
- 依賴 `@card-erp/shared-types: workspace:*`

### Verification Commands

```bash
cd apps/buyer-web && pnpm install
pnpm --filter @card-erp/buyer-web dev  # 確認能啟動
pnpm --filter @card-erp/buyer-web typecheck
```

### UX 驗證要求

| 驗證項目   | 標準                                           |
| ---------- | ---------------------------------------------- |
| 背景色     | 純黑 #000000                                   |
| 字體載入   | Orbitron 用於標題、Noto Sans TC 用於中文       |
| 霓虹色     | 至少一個 cyan (#00F0FF) 元素可見且有 glow 效果 |
| Dev server | `pnpm dev` 啟動無 error                        |

---

## Mission B: Layout + 首頁 + 共用元件

### 目標

建立 default layout（Header + Footer）、DeFi Cyberpunk 風格首頁、以及 LoadingSpinner / ErrorMessage 共用元件。

### 交付檔案

| 動作   | 檔案路徑                                                                        |
| ------ | ------------------------------------------------------------------------------- |
| Create | `apps/buyer-web/layouts/default.vue` — Header (logo + nav + cart icon) + Footer |
| Create | `apps/buyer-web/pages/index.vue` — Hero section + Features section              |
| Create | `apps/buyer-web/components/LoadingSpinner.vue` — 霓虹風格 spinner               |
| Create | `apps/buyer-web/components/ErrorMessage.vue` — 霓虹風格 error alert             |
| Create | `apps/buyer-web/components/NeonButton.vue` — 可複用霓虹按鈕                     |

### Design Reference

- `docs/design-system/BUYER_WEB_STYLE_GUIDE.md` > Hero Section 設計
- `docs/design-system/BUYER_WEB_STYLE_GUIDE.md` > 霓虹按鈕
- `docs/design-system/BUYER_WEB_STYLE_GUIDE.md` > 響應式設計

### 重點提示

- **首頁 Hero** 必須遵循 Style Guide 的 Hero Section 設計：grid overlay + glow orbs + glitch 文字動畫 + stats bar
- Header 在手機版需收合為 hamburger menu（使用 Vue reactive state，不用外部 lib）
- Footer 使用深灰/黑底 + 霓虹邊線
- LoadingSpinner 要有霓虹 cyan glow 動畫
- ErrorMessage 使用 `--error: #FF0055` 色系
- 所有元件使用 TypeScript `<script setup lang="ts">` + defineProps 型別

### Verification Commands

```bash
pnpm --filter @card-erp/buyer-web typecheck
pnpm --filter @card-erp/buyer-web dev  # 手動確認頁面
```

### UX 驗證要求

| 驗證項目                  | 標準                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| Hero 區塊                 | 全螢幕高度、grid overlay 可見、glow orbs 浮動動畫、glitch 文字效果 |
| Header                    | 固定頂部（sticky）、logo 左側、導航右側、cart icon 有 badge        |
| 響應式 - Mobile (375px)   | Hero 文字縮小、導航收合為 hamburger、stats 堆疊                    |
| 響應式 - Tablet (768px)   | Hero 文字中等大小、導航展開                                        |
| 響應式 - Desktop (1280px) | 完整展示、glow 效果全開                                            |
| NeonButton                | hover 時有掃光動畫 + glow 增強                                     |
| Footer                    | 底部固定、霓虹邊線分隔                                             |

### Playwright E2E（Executor 必做）

```bash
npx playwright test tests/e2e/buyer-web/ --project=buyer-web
```

需新增測試：

- 首頁載入成功（title 正確）
- Header 導航連結存在
- Hero section 可見
- Mobile viewport 下 hamburger menu 出現
- 三個 viewport 截圖（mobile / tablet / desktop）

---

## Mission C: API Client + Composables + Pinia Store

### 目標

建立 API Client 工具函式、商品/競標 API composables、User Store 和 Cart Store。

### 交付檔案

| 動作   | 檔案路徑                                                                         |
| ------ | -------------------------------------------------------------------------------- |
| Create | `apps/buyer-web/utils/api.ts` — API client (useApiClient + handleApiError)       |
| Create | `apps/buyer-web/composables/useApi.ts` — 商品/競標 API composables               |
| Create | `apps/buyer-web/stores/user.ts` — User store (setUser / logout)                  |
| Create | `apps/buyer-web/stores/cart.ts` — Cart store (add/remove/update/clear + getters) |
| Create | `apps/buyer-web/types/store.ts` — Store 型別定義                                 |

### 重點提示

- API client 使用 Nuxt 內建 `$fetch`（基於 ofetch），設定 baseURL 來自 runtimeConfig
- composables 的回傳型別使用 `@card-erp/shared-types` 的型別（如有合適的，沒有就自定義）
- Cart store 需要 `persist` 功能（localStorage），需安裝 `@pinia-plugin-persistedstate/nuxt` 或同等方案
- User store 暫不含 JWT 邏輯（Task 12 再做），只做基本狀態管理
- 所有函式需有 TypeScript 型別標註，禁止 `any`

### Verification Commands

```bash
pnpm --filter @card-erp/buyer-web typecheck
```

### UX 驗證要求

- 無直接 UI 驗證（本 Mission 為邏輯層）
- 確認 `pnpm dev` 啟動後無 console error

---

## Mission D: 整合驗證

### 目標

執行全面驗證：TypeScript 編譯、Playwright E2E 測試、多 viewport 截圖，確認所有 Mission 整合無誤。

### 交付檔案

| 動作          | 檔案路徑                                                      |
| ------------- | ------------------------------------------------------------- |
| Create/Update | `tests/e2e/buyer-web/homepage.spec.ts` — 完整首頁 E2E 測試    |
| Create        | `tests/e2e/buyer-web/navigation.spec.ts` — 導航測試           |
| Update        | `docs/tasks/phase-1-mvp/10-buyer-web-setup.md` — 勾選完成項目 |

### 驗證清單

**TypeScript**:

```bash
pnpm --filter @card-erp/buyer-web typecheck  # 零 error
```

**Playwright E2E**:

```bash
npx playwright test tests/e2e/buyer-web/ --project=buyer-web  # 全通過
```

**截圖驗收（Claude Final QA）**:

- Mobile (375px): 首頁完整截圖
- Tablet (768px): 首頁完整截圖
- Desktop (1280px): 首頁完整截圖
- 對照 `BUYER_WEB_STYLE_GUIDE.md` 確認：純黑背景、霓虹配色、Orbitron 字體、glow 效果

### UX 驗證要求

| 驗證項目 | 標準                                                          |
| -------- | ------------------------------------------------------------- |
| 整體風格 | 符合 DeFi Cyberpunk Neon 設計語言                             |
| 色彩系統 | 純黑底 + cyan/magenta/purple 霓虹                             |
| 字體系統 | Orbitron (標題) + Noto Sans TC (中文) + JetBrains Mono (數字) |
| 動畫效果 | Hero glitch + grid scroll + glow orb float                    |
| 無障礙   | 文字對比度足夠（霓虹色在黑底上清晰可讀）                      |
| Console  | 零 error、零 warning（deprecation 除外）                      |
| PWA      | manifest 正確載入                                             |

---

## 驗收標準（Task 10 整體）

對應 `docs/tasks/phase-1-mvp/10-buyer-web-setup.md` 的驗收清單：

- [ ] Nuxt 3 專案正常啟動（`pnpm dev`）
- [ ] TailwindCSS + DeFi Cyberpunk 主題正常載入
- [ ] TypeScript 嚴格模式開啟，無型別錯誤
- [ ] Pinia stores 正常運作（user, cart）
- [ ] API client 可正常呼叫後端 API（結構就位，實際連線 Task 11 驗證）
- [ ] Layout + 首頁正常顯示（符合 Style Guide）
- [ ] PWA manifest 正確配置
- [ ] 響應式設計在 mobile / tablet / desktop 正常顯示
- [ ] 無使用 `any` 型別
- [ ] 共用元件（LoadingSpinner, ErrorMessage, NeonButton）可正常使用
- [ ] Playwright E2E 測試全部通過
