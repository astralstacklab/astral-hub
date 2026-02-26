# Multi-Agent 協作協定 (Multi-Agent Collaboration Protocol)

> **版本**: 0.5.0 (Draft)
> **最後更新**: 2026-02-17
> **狀態**: 待審核
> **適用範圍**: Astral Hub 專案所有 AI Agent 協作場景

本協定定義 Astral Hub 開發中的多 Agent 協作規範。

### 角色與 Agent 對應

- **Planner / Archiver（策劃 + 進版控 + 最終把關）**：Claude（固定）
- **Executor（開發）**：任何可用 Agent（Gemini / Codex / Claude 等，由 Coordinator 彈性指派）
- **Reviewer（審查）**：任何可用 Agent（由 Coordinator 彈性指派，建議與 Executor 不同）

### 彈性配置模式

本協定支援 2~3 個 Agent 的配置，角色可依實際情況互換：

| 模式                | Agent 配置              | 說明                                                             |
| ------------------- | ----------------------- | ---------------------------------------------------------------- |
| **2-Agent**         | Claude + Gemini         | Claude 兼任 Planner + Reviewer + Final QA；Gemini 擔任 Executor  |
| **2-Agent**         | Claude + Codex          | Claude 兼任 Planner + Final QA；Codex 擔任 Executor + 自我驗證   |
| **3-Agent**         | Claude + Gemini + Codex | Claude = Planner + Final QA；Gemini = Executor；Codex = Reviewer |
| **3-Agent（反轉）** | Claude + Codex + Gemini | Claude = Planner + Final QA；Codex = Executor；Gemini = Reviewer |

**核心不變量**：無論幾個 Agent，Claude 始終負責最終把關（Final QA）與版控歸檔。其餘角色可自由分配。

**角色互換規則**：

- 同一個 Mission 中，Executor 和 Reviewer 建議由不同 Agent 擔任（避免自我審查盲區）
- 2-Agent 模式下若無法分開，Claude 在 Final QA 階段需加強驗證力度（重新跑測試 + 截圖檢查）
- 不同 Mission 之間，Executor 和 Reviewer 角色可以互換

---

## 1. 核心原則

**Contract-First（契約優先）**：Agent 間透過 3 份固定的結構化產物溝通，不依賴口語轉述。

**Observable State（可觀測狀態）**：所有決策、變更、判斷都必須寫入產物，任何 Agent 可從產物直接接續工作。

**Human-in-the-Loop（人類居中調度）**：人類負責 Agent 切換時機與最終判斷。

---

## 2. 角色定義

### 2.1 Planner / Final QA（策劃 + 最終把關）— Claude（固定）

- 分析任務需求，寫入 `MISSION_CONTROL.md`
- 定義 File Scope、約束條件、驗證指令、中止條件
- **最終把關（Final QA）**：獨立重新執行驗證，不信任上游報告
- 驗證通過後歸檔進版控

**輸入**：人類的任務描述 + 專案文件
**輸出**：`MISSION_CONTROL.md`

**Final QA 職責**（歸檔前必做）：

1. 重新執行 Verification Commands（typecheck、測試等）
2. 前端任務：執行 Playwright 截圖，以 multimodal 能力確認 UI 符合 Style Guide
3. 確認代碼品質與架構一致性
4. git commit + 更新任務文件

### 2.2 Executor（執行者）— 任何可用 Agent

由 Coordinator 依任務性質彈性指派，每次任務指定一位。

- 根據 `MISSION_CONTROL.md` 執行程式碼變更
- 記錄每一步操作的原因與結果至 `EXECUTION_LOG.md`
- **執行完成後必須自行跑驗證**（Verification Commands），將結果記錄在 EXECUTION_LOG
- 觸及中止條件時停止並回報

**輸入**：`MISSION_CONTROL.md`
**輸出**：`EXECUTION_LOG.md` + 程式碼變更

**前端任務額外職責**：

1. 執行 `npx playwright test` 或對應的 E2E 測試，確保頁面可正常渲染
2. 若 MISSION_CONTROL 要求截圖驗收，需產出截圖並記錄在 EXECUTION_LOG
3. 確認響應式斷點（mobile / tablet / desktop）無明顯破版

### 2.3 Reviewer（審查者）— 任何可用 Agent

由 Coordinator 依任務性質彈性指派，建議與同一任務的 Executor 不同。

- 對比 `MISSION_CONTROL.md` 目標與 `EXECUTION_LOG.md` 產出
- 檢查架構一致性（對比 AGENTS.md 設計規範）
- 識別跨模組副作用與未實現目標

**輸入**：`MISSION_CONTROL.md` + `EXECUTION_LOG.md`
**輸出**：`REVIEW_REPORT.md`

**前端任務額外職責**：

1. 執行 Playwright E2E 測試，驗證 Executor 的結果可重現
2. 檢查 UI 是否符合對應的 Style Guide（`docs/design-system/`）
3. 確認無 console.error / 無效 API 呼叫

### 2.4 Coordinator（調度者）— 人類

- 決定任務等級（見第 3 節）
- **指定每個 Mission 的角色分配**（哪個 Agent 當 Executor、哪個當 Reviewer）
- 觸發 Agent 切換（告知下一個 Agent 讀取對應產物）
- 在 Agent 產出間做最終判斷

---

## 3. 任務分級

| 等級        | 判斷標準                                | 使用流程                        | 範例                            |
| ----------- | --------------------------------------- | ------------------------------- | ------------------------------- |
| **L1 單兵** | 改動 < 3 個檔案，邏輯單純，無跨模組影響 | 單一 Agent 完成，不走管線       | 修 typo、加一個欄位、調 CSS     |
| **L2 標準** | 邊界清晰的獨立功能，可一次完成          | 完整管線（策劃→執行→審查→歸檔） | 實作商品 CRUD API、建立結帳頁面 |
| **L3 複雜** | 涉及多模組、需反覆嘗試、架構影響大      | 迭代管線（允許回退與多輪）      | 競標 WebSocket 系統、金流串接   |

分級由人類（Coordinator）判斷。不確定時以 L2 起步。

---

## 4. 管線流程

### 4.1 標準管線（L2）

```
  MISSION_CONTROL.md          EXECUTION_LOG.md          REVIEW_REPORT.md
        │                           │                         │
        ▼                           ▼                         ▼
┌─────────────┐  寫入  ┌─────────────┐  寫入  ┌──────────────────┐  讀取  ┌─────────────┐
│  Phase 1    │───────▶│  Phase 2    │───────▶│  Phase 3         │───────▶│  Phase 4    │
│  策劃       │        │  執行       │        │  審查            │        │  歸檔       │
│  (Claude)   │        │  (Executor) │        │   (Reviewer)     │        │  (Claude)   │
└─────────────┘        └─────────────┘        └──────────────────┘        └─────────────┘
```

每個 Agent 讀取上游產物、寫入自己的產物。人類在 Agent 間做切換觸發。

### 4.2 迭代管線（L3）

標準管線 + 以下回退路徑：

```
Phase 3（審查）→ REVIEW_REPORT verdict = CHANGES_REQUIRED
               → 回退 Phase 2（Executor 讀 REVIEW_REPORT 修正）

Phase 2（執行）→ 觸及中止條件
               → 跳至 Phase 3（Reviewer 做全域診斷）

Phase 3（審查）→ REVIEW_REPORT verdict = BLOCKED
               → 回退 Phase 1（Planner 重新修訂 MISSION_CONTROL）
```

**迭代上限**：同一任務最多 3 輪。超過 3 輪表示任務拆分不夠細，應暫停重新拆解。

### 4.3 分段管線（大型任務）

當任務清單的某個子任務（如 Task 2.2 ui-components）內含多個獨立可交付的子項目時，採用「Planning + 多個小 Mission」的方式拆分執行：

```
Planning（全局規劃）
  │  Planner 先產出 docs/plans/YYYY-MM-DD-<task-name>.md
  │  定義所有 Mission 的切分方式、檔案範圍、關鍵程式碼與驗證指令
  │
  ├→ Mission A（小塊）→ MISSION_CONTROL → Execute → Review → Commit
  ├→ Mission B（小塊）→ MISSION_CONTROL → Execute → Review → Commit
  ├→ Mission C（小塊）→ MISSION_CONTROL → Execute → Review → Commit
  └→ ...（依序執行，每個 Mission 獨立走完整管線）
```

> **⚠️ 強制要求**：**全新 Task 開始時，Planner 必須先產出 Planning 文件**（`docs/plans/`），再依序撰寫各 Mission 的 `MISSION_CONTROL.md`。
> 禁止跳過 Planning 直接寫 MISSION_CONTROL。Planning 文件是 MISSION_CONTROL 的上游輸入，確保每個 Mission 的範圍切分合理且有完整的技術細節。
> Planning 文件命名規則：`docs/plans/YYYY-MM-DD-task{N}-{feature-name}.md`

**適用條件**：

- 子任務內含 > 5 個獨立可交付項目
- 單一 MISSION_CONTROL 的 File Scope 會超過 10 個檔案
- 項目之間有依賴順序但各自可獨立驗證

**拆分原則**：

- 每個 Mission 改動 3~8 個檔案
- 每個 Mission 完成後有明確的可用狀態
- Mission 之間允許根據 Review 結果調整後續 Mission 方向

**優勢**：

- Review 範圍小，審查品質更高
- 每步 commit 後可隨時暫停或調整方向
- Executor 出錯時回溯成本低
- 中途需求變更時已完成的 Mission 不受影響

---

## 5. 契約產物（Contract Artifacts）

3 份固定檔案，位於 **repo 根目錄**，每次任務覆寫前一次內容。不進版控。

```
astral-hub/
├── MISSION_CONTROL.md    ← Planner 寫，Executor 讀
├── EXECUTION_LOG.md      ← Executor 寫，Reviewer 讀
├── REVIEW_REPORT.md      ← Reviewer 寫，Executor / Planner 讀
├── AGENTS.md             ← 專案規範（所有 Agent 共讀）
├── CLAUDE.md
└── ...
```

### 5.1 MISSION_CONTROL.md

由 Planner（Claude）產出，驅動 Executor。

```markdown
# MISSION_CONTROL

## Meta

- **Task ID**: phase-1/task-05-api-products
- **Level**: L2
- **Date**: 2026-01-29
- **Planner**: Claude

## Objective

（一句話描述目標）
實作商品模組的 CRUD API，包含分頁查詢與篩選功能。

## File Scope

（Executor 必須讀取的檔案，限定操作範圍）

- `services/api/src/modules/products/` — 主要工作目錄
- `services/api/prisma/schema.prisma` — 需讀取但僅在必要時修改
- `packages/shared-types/src/entities/` — 需新增 Product 型別

## Constraints

（不可更動的邊界）

- 不可修改 `services/api/src/server.ts` 的插件載入順序
- 必須使用 Zod 做 request validation，不可使用 Fastify 內建 schema
- API response 格式必須符合 AGENTS.md 定義的標準格式

## Verification Commands

（完成後必須通過的驗證）
pnpm --filter api test -- --grep "products"
pnpm --filter api type-check

## Halt Conditions

（觸發任一條件時，立即停止執行並回報）

- Prisma migrate 失敗
- 型別錯誤超過 5 個且非本次變更引起
- 修改了 File Scope 以外的檔案

## Reference Docs

（Executor 可選讀的參考文件）

- `docs/tasks/phase-1-mvp/05-api-products.md`
- `AGENTS.md` > API 設計規範
```

### 5.2 EXECUTION_LOG.md

由 Executor 產出，記錄「做了什麼」和「為什麼這麼做」。

```markdown
# EXECUTION_LOG

## Meta

- **Task ID**: phase-1/task-05-api-products
- **Executor**: Antigravity
- **Start**: 2026-01-29 14:00
- **End**: 2026-01-29 15:30
- **Status**: completed | halted | partial

## Changes Summary

（概述所有變更）
新增 5 個檔案，修改 2 個檔案。實作了 Product CRUD API 共 5 個 endpoints。

## Detailed Steps

### Step 1: 建立 Product Zod schemas

- **Action**: 新增 `services/api/src/modules/products/schemas.ts`
- **Rationale**: 根據 AGENTS.md 的 Products 實體定義建立驗證 schema
- **Result**: 成功

### Step 2: 實作 route handlers

- **Action**: 新增 `services/api/src/modules/products/routes.ts`
- **Rationale**: 按 RESTful 規範實作 5 個 endpoint
- **Result**: 成功
- **Decision Note**: 選擇 cursor-based pagination 而非 offset-based，
  因為商品列表可能頻繁新增，offset 會造成重複/遺漏

## Verification Results

（執行 MISSION_CONTROL 中定義的驗證指令）
$ pnpm --filter api test -- --grep "products"
12 tests passed, 0 failed

$ pnpm --filter api type-check
No errors found.

## Deviations from Mission

（任何偏離 MISSION_CONTROL 的地方，必須說明原因）

- 新增了 `services/api/src/utils/pagination.ts`（不在 File Scope 內），
  因為分頁是通用邏輯，放在 products module 內不合理。

## Files Changed

- [NEW] `services/api/src/modules/products/schemas.ts`
- [NEW] `services/api/src/modules/products/routes.ts`
- [NEW] `services/api/src/modules/products/service.ts`
- [NEW] `services/api/src/modules/products/index.ts`
- [NEW] `services/api/src/utils/pagination.ts`
- [MOD] `services/api/prisma/schema.prisma`
- [MOD] `packages/shared-types/src/entities/product.ts`
```

### 5.3 REVIEW_REPORT.md

由 Reviewer 產出，結構化差異分析。

```markdown
# REVIEW_REPORT

## Meta

- **Task ID**: phase-1/task-05-api-products
- **Reviewer**: Gemini
- **Date**: 2026-01-29

## Verdict: APPROVED | APPROVED_WITH_NOTES | CHANGES_REQUIRED | BLOCKED

## 1. Goal Completion

（對比 MISSION_CONTROL 的 Objective，逐項檢查）

| 目標             | 狀態    | 備註                      |
| ---------------- | ------- | ------------------------- |
| Product CRUD API | DONE    | 5 endpoints 均已實作      |
| 分頁查詢         | DONE    | 使用 cursor-based，合理   |
| 篩選功能         | PARTIAL | 缺少按 gradingStatus 篩選 |

## 2. Architecture Consistency

（對比 AGENTS.md 的設計規範）

- [PASS] API response 格式符合標準
- [PASS] 使用 Zod validation
- [WARN] `pagination.ts` 放在 `utils/` 但 AGENTS.md 未定義 utils 的職責邊界
- [FAIL] 缺少 `Products.status + Products.channel` 複合索引

## 3. Side Effects

（跨模組影響分析）

- `schema.prisma` 變更會觸發所有 Prisma client 重新生成

## 4. Security & Performance

- [PASS] 無原生 SQL，全部透過 Prisma
- [WARN] GET /products 未設 rate limiting

## 5. Required Actions

（Verdict 不是 APPROVED 時，列出必修項）

1. 新增 `gradingStatus` 篩選參數到 GET /products
2. 在 schema.prisma 補上 `@@index([status, channel])` 複合索引
```

---

## 6. 升級與中止條件

### 6.1 Executor 中止條件

任一觸發時 Executor 停止執行，將狀態寫入 `EXECUTION_LOG.md` 並回報人類：

| 信號                    | 判斷方式                                                | 後續動作                    |
| ----------------------- | ------------------------------------------------------- | --------------------------- |
| **同一錯誤重複出現**    | 同一 error message 出現 >= 3 次且修復嘗試未改變錯誤訊息 | 轉交 Reviewer 做全域診斷    |
| **範圍溢出**            | 需要修改 File Scope 以外的檔案 >= 2 個                  | 回退 Planner 擴大 Scope     |
| **驗證持續失敗**        | Verification Commands 執行 3 次仍未全數通過             | 轉交 Reviewer               |
| **Halt Condition 觸發** | 按 MISSION_CONTROL 定義判斷                             | 按 MISSION_CONTROL 指示處理 |

### 6.2 Reviewer 升級條件

| 信號                                                      | 後續動作                        |
| --------------------------------------------------------- | ------------------------------- |
| **設計層缺陷** — 需重新定義 Objective 或 Constraints      | Verdict = BLOCKED，回退 Planner |
| **架構違規** — 違反 AGENTS.md 規範且無法在當前 Scope 修復 | Verdict = BLOCKED，人類參與決策 |
| **任務拆分不當** — 涵蓋過多不相關目標                     | 暫停管線，拆分為多個獨立任務    |

### 6.3 管線熔斷

- 同一任務迭代 3 輪仍未通過 Review → **暫停，人類重新評估**
- 累計修改檔案超過 File Scope 的 2 倍 → **暫停，任務需重新拆分**

---

## 7. 上下文傳遞

各 Agent 均有持久化 session 能力，且已配置各自的 Rules/System Instructions：

- **Claude**：讀取 `CLAUDE.md` → 引導至 `AGENTS.md`
- **Gemini**：讀取 `AGENTS.md`（透過 System Instructions 配置）
- **Codex**：讀取 `AGENTS.md` + `codex.md`

因此 **不需要額外的 handoff prompt 或上下文組裝文件**。Agent 切換時，人類只需告知下一個 Agent 讀取 repo 根目錄的對應產物。

### 切換觸發方式

Coordinator 透過關鍵字觸發 Agent 角色：

- **Executor 觸發**：「讀取 MISSION_CONTROL」、「開始執行」、「執行任務」
- **Reviewer 觸發**：「REVIEW」、「閱讀 EXECUTION_LOG」、「審查」

| 切換方向           | 目標 Agent    | 人類對下一個 Agent 說的話                                              |
| ------------------ | ------------- | ---------------------------------------------------------------------- |
| → Executor         | 指定的 Agent  | 「讀取 MISSION_CONTROL.md 並執行」                                     |
| → Reviewer         | 指定的 Agent  | 「讀取 MISSION_CONTROL.md 和 EXECUTION_LOG.md，產出 REVIEW_REPORT.md」 |
| → Executor（修正） | 同原 Executor | 「讀取 REVIEW_REPORT.md，修正問題後更新 EXECUTION_LOG.md」             |
| → Final QA（歸檔） | Claude        | 「讀取 EXECUTION_LOG.md 和 REVIEW_REPORT.md，驗證並歸檔」              |

### 2-Agent 模式的簡化流程

當僅有 2 個 Agent 時，可省略獨立 Reviewer 階段，由 Claude 在 Final QA 中加強驗證：

```
MISSION_CONTROL.md                    EXECUTION_LOG.md
      │                                     │
      ▼                                     ▼
┌─────────────┐  寫入  ┌─────────────┐  讀取  ┌──────────────────────┐
│  Phase 1    │───────▶│  Phase 2    │───────▶│  Phase 3             │
│  策劃       │        │  執行       │        │  Final QA + 歸檔     │
│  (Claude)   │        │  (Executor) │        │  (Claude, 加強驗證)  │
└─────────────┘        └─────────────┘        └──────────────────────┘
```

此模式下 Claude 的 Final QA 需額外承擔 Reviewer 的職責（架構一致性檢查、副作用分析等）。

---

## 8. 產物管理

### 存放位置

3 份產物檔案固定放在 **repo 根目錄**，與 `AGENTS.md`、`CLAUDE.md` 同層級。

### 生命週期

每次新任務啟動時，Planner 覆寫 `MISSION_CONTROL.md`，後續 Agent 依序覆寫各自的產物。前一次任務的內容不保留。

歸檔階段（Phase 4），Planner（Claude）負責：

1. 獨立執行驗證指令（不信任 Executor 報告，重新跑一次）
2. 將程式碼變更提交至版控（`git commit`）
3. 更新任務文件中的 checkbox、進度追蹤表、交付物、成功標準
4. 將有價值的結論（架構決策、設計取捨）寫回 Task 文件或 AGENTS.md

> **⚠️ 重要**：任務文件（`docs/tasks/`）的 checkbox 勾選、進度更新等操作**專屬於 Planner（Claude）**。Executor 和 Reviewer **不得**修改任務文件。

### 版控

3 份產物檔案 **不進版控**（已加入 `.gitignore`），因為它們是 Agent 間的即時通訊，不是專案永久紀錄。

---

## 9. 度量與演進

### 協定調整觸發條件

- 連續 3 個任務都需要 3 輪迭代 → 任務拆分粒度需調整
- 某個 Agent 的產物持續被跳過不讀 → 考慮簡化或移除該產物
- 人類在切換時仍需大量口語補充上下文 → 產物模板需擴充欄位

### 啟動計畫（Pilot）

1. **試行**：從 Phase 1 任務中選 2 個 L2 任務試跑完整管線
2. **正式啟用**：根據試行結果調整後，協定升級為 v1.0.0
3. **持續演進**：每完成一個 Phase，回顧協定並調整

---

## 10. 前端任務驗證流程

Task 10 起進入前端 UI/UX 開發，驗證方式與後端 API 不同。本節定義前端任務的驗證標準與各角色職責。

### 10.1 驗證工具

| 驗證層           | 工具                               | 驗證內容                 | 誰執行                             |
| ---------------- | ---------------------------------- | ------------------------ | ---------------------------------- |
| **型別正確性**   | `nuxt typecheck` 或 `tsc --noEmit` | TypeScript 編譯通過      | Executor + Final QA                |
| **E2E 測試**     | `npx playwright test`              | DOM 狀態、導航、互動邏輯 | Executor + Reviewer + Final QA     |
| **截圖驗收**     | Playwright screenshot → 圖檔       | 視覺呈現符合 Style Guide | Executor（產出）+ Final QA（判讀） |
| **Console 檢查** | Playwright console log capture     | 無 console.error / 警告  | Executor + Reviewer                |

### 10.2 Playwright 安裝位置

Playwright 安裝於 **monorepo root**，所有前端 app 共用：

```
astral-hub/
├── playwright.config.ts      ← 統一配置，支援多 project
├── tests/e2e/                ← E2E 測試目錄
│   ├── buyer-web/
│   ├── admin-web/
│   └── pos-web/
├── package.json              ← @playwright/test 在此安裝
```

### 10.3 前端版 MISSION_CONTROL 額外欄位

前端任務的 MISSION_CONTROL 除標準欄位外，需額外包含：

```markdown
## Design Reference

（指向對應的 Style Guide）

- `docs/design-system/BUYER_WEB_STYLE_GUIDE.md`
- `docs/design-system/TAILWIND_USAGE.md`

## Visual Acceptance Criteria

（截圖驗收條件，描述頁面應有的視覺呈現）

- 首頁 Hero section 需有漸層背景
- 手機版 (375px) 導航需收合為 hamburger menu
- 卡片元件需有 hover shadow 效果

## Responsive Breakpoints

（必須驗證的斷點）

- Mobile: 375px
- Tablet: 768px
- Desktop: 1280px
```

### 10.4 各角色的前端驗證清單

**Executor 完成開發後必做**：

- [ ] `nuxt typecheck` 通過
- [ ] `npx playwright test` 相關測試通過
- [ ] 在 EXECUTION_LOG 中記錄測試結果與截圖路徑
- [ ] 確認無 TypeScript `any` 型別（單元測試除外）

**Reviewer 審查時必做**：

- [ ] 重新執行 `npx playwright test`，確認結果可重現
- [ ] 檢查代碼是否符合 Style Guide 規範
- [ ] 檢查是否有 console.error
- [ ] 在 REVIEW_REPORT 中記錄驗證結果

**Claude（Final QA）歸檔前必做**：

- [ ] 重新執行 typecheck + Playwright 測試
- [ ] 執行 Playwright 截圖，用 multimodal 能力看圖確認 UI
- [ ] 對照 Style Guide 確認視覺一致性
- [ ] 確認響應式各斷點無破版
- [ ] git commit + 更新任務文件
- [ ] 產出「人類視覺抽測報告」（見 10.5）

### 10.5 人類視覺抽測流程

Claude 完成 Final QA 後，若該 Mission 涉及 UI/UX 變更，**必須**在回報結果時附上以下內容，供人類（Coordinator）做最終視覺抽測：

#### 回報格式

```markdown
## Final QA 結果：PASS / FAIL

### 截圖驗證摘要

（表格列出各驗證項目 + PASS/FAIL + 說明）

### 人類視覺抽測步驟

#### Step 1: 啟動 dev server

（具體指令）

#### Step 2: 瀏覽器開啟

（URL + 檢查重點清單）

#### Step 3: 響應式測試

（DevTools 操作 + 各斷點檢查項目）

#### Step 4: 互動測試

（hover / click / 動畫等需人工確認的項目）

#### Step 5: 結束

（停止 server 的方式）
```

#### 回報原則

- **只在涉及 UI/UX 的 Mission 產出**（純邏輯層如 API Client / Store 不需要）
- **步驟必須具體可執行**：包含完整指令、URL、DevTools 操作方式
- **檢查重點對齊 MISSION_CONTROL 的 Visual Acceptance Criteria**
- **列出需要人工確認的互動效果**（hover 動畫、transition、scroll 行為等，這些 Playwright 截圖無法完整呈現）

---

## 附錄 A: 與現有文件體系的整合

```
AGENTS.md                ← 專案規範（What：做什麼、標準是什麼）
MULTI_AGENT_PROTOCOL.md  ← 協作規範（How：怎麼協作、用什麼流程）
MISSION_CONTROL.md       ← 當前任務指令（Planner → Executor）
EXECUTION_LOG.md         ← 當前執行紀錄（Executor → Reviewer）
REVIEW_REPORT.md         ← 當前審查報告（Reviewer → Planner/Executor）
```

**MISSION_CONTROL 不取代 Task 文件**。Task 文件定義「要做什麼」（需求與驗收標準），MISSION_CONTROL 定義「怎麼交給 Executor 做」（操作指令與約束）。

## 附錄 B: 快速參考卡

```
開始任務
  │
  ├─ L1（簡單）→ 直接用單一 Agent 完成，不走管線
  │
  ├─ L2（標準）→ 策劃 → 執行 → 審查 → 歸檔
  │                每步讀取上游產物、寫入自己的產物
  │
  └─ L3（複雜）→ 同 L2，但允許回退（最多 3 輪）
```

**產物**（repo 根目錄，不進版控）:

- `MISSION_CONTROL.md` — Planner 寫，驅動 Executor
- `EXECUTION_LOG.md` — Executor 寫，記錄過程與決策
- `REVIEW_REPORT.md` — Reviewer 寫，結構化審查結果
