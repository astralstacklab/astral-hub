# Multi-Agent 協作協定 (Multi-Agent Collaboration Protocol)

> **版本**: 0.3.0 (Draft)
> **最後更新**: 2026-02-13
> **狀態**: 待審核
> **適用範圍**: Card ERP 專案所有 AI Agent 協作場景

本協定定義 Card ERP 開發中的多 Agent 協作規範。角色與 Agent 的對應關係如下：

- **Planner / Archiver（策劃 + 進版控）**：Claude（固定）
- **Executor（開發）**：Gemini（固定）
- **Reviewer（審查）**：Claude 或 Codex（由 Coordinator 彈性指派）

---

## 1. 核心原則

**Contract-First（契約優先）**：Agent 間透過 3 份固定的結構化產物溝通，不依賴口語轉述。

**Observable State（可觀測狀態）**：所有決策、變更、判斷都必須寫入產物，任何 Agent 可從產物直接接續工作。

**Human-in-the-Loop（人類居中調度）**：人類負責 Agent 切換時機與最終判斷。

---

## 2. 角色定義

### 2.1 Planner（策劃者）— Claude

- 分析任務需求，寫入 `MISSION_CONTROL.md`
- 定義 File Scope、約束條件、驗證指令、中止條件
- 最終驗證通過後歸檔進版控

**輸入**：人類的任務描述 + 專案文件
**輸出**：`MISSION_CONTROL.md`

### 2.2 Executor（執行者）— Gemini

- 根據 `MISSION_CONTROL.md` 執行程式碼變更
- 記錄每一步操作的原因與結果至 `EXECUTION_LOG.md`
- 觸及中止條件時停止並回報

**輸入**：`MISSION_CONTROL.md`
**輸出**：`EXECUTION_LOG.md` + 程式碼變更

### 2.3 Reviewer（審查者）— Claude 或 Codex

由 Coordinator 依任務性質彈性指派。兩者遵循相同的審查標準與產出格式。

- 對比 `MISSION_CONTROL.md` 目標與 `EXECUTION_LOG.md` 產出
- 檢查架構一致性（對比 AGENTS.md 設計規範）
- 識別跨模組副作用與未實現目標

**輸入**：`MISSION_CONTROL.md` + `EXECUTION_LOG.md`
**輸出**：`REVIEW_REPORT.md`

### 2.4 Coordinator（調度者）— 人類

- 決定任務等級（見第 3 節）
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
│  (Claude)   │        │  (Gemini)   │        │ (Claude 或 Codex)│        │  (Claude)   │
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
  │  Planner 產出整體實作計畫，定義所有 Mission 的切分方式
  │
  ├→ Mission A（小塊）→ MISSION_CONTROL → Execute → Review → Commit
  ├→ Mission B（小塊）→ MISSION_CONTROL → Execute → Review → Commit
  ├→ Mission C（小塊）→ MISSION_CONTROL → Execute → Review → Commit
  └→ ...（依序執行，每個 Mission 獨立走完整管線）
```

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
card-erp/
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

由 Reviewer（Gemini）產出，結構化差異分析。

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

| 切換方向                   | 目標 Agent      | 人類對下一個 Agent 說的話                                              |
| -------------------------- | --------------- | ---------------------------------------------------------------------- |
| → Executor                 | Gemini          | 「讀取 MISSION_CONTROL.md 並執行」                                     |
| → Reviewer                 | Claude 或 Codex | 「讀取 MISSION_CONTROL.md 和 EXECUTION_LOG.md，產出 REVIEW_REPORT.md」 |
| → Executor（修正）         | Gemini          | 「讀取 REVIEW_REPORT.md，修正問題後更新 EXECUTION_LOG.md」             |
| → Planner（歸檔 + 進版控） | Claude          | 「讀取 EXECUTION_LOG.md 和 REVIEW_REPORT.md，驗證並歸檔」              |

---

## 8. 產物管理

### 存放位置

3 份產物檔案固定放在 **repo 根目錄**，與 `AGENTS.md`、`CLAUDE.md` 同層級。

### 生命週期

每次新任務啟動時，Planner 覆寫 `MISSION_CONTROL.md`，後續 Agent 依序覆寫各自的產物。前一次任務的內容不保留。

歸檔階段（Phase 4），Planner 將有價值的結論（架構決策、設計取捨）寫回 Task 文件或 AGENTS.md，確保永久紀錄存放在版控內的文件中。

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
