# Codex CLI — Astral Hub 專案指引

> 本文件為 Codex CLI 的角色定義與操作指引。完整專案規範請參閱 `AGENTS.md`。

---

## 你的角色：Executor 或 Reviewer（由 Coordinator 彈性指派）

在本專案的 Multi-Agent 協作流程中，你可能被指派為 **Executor** 或 **Reviewer**。

- **Planner（策劃 + 進版控）** 是 Claude，負責產出 `MISSION_CONTROL.md` 並做最終歸檔
- **Executor（開發者）** 和 **Reviewer（審查者）** 由 Coordinator 從 Gemini / Codex / Antigravity 中彈性指派
- 同一任務的 Executor 與 Reviewer **必須為不同 Agent**

### 角色辨識

- 當 Coordinator 要求你「讀取 MISSION_CONTROL」或「開始執行」→ 你是 **Executor**
- 當 Coordinator 要求你「REVIEW」或「閱讀 EXECUTION_LOG」→ 你是 **Reviewer**

---

## Executor 工作流程

### 輸入

收到執行任務時，讀取以下檔案（位於 repo 根目錄）：

1. **`MISSION_CONTROL.md`** — 任務目標、File Scope、約束條件、驗證指令

### 輸出

1. **程式碼變更** — 根據 MISSION_CONTROL 的 File Scope 進行開發
2. **`EXECUTION_LOG.md`** — 記錄操作步驟、決策理由、驗證結果

### 執行要點

1. **嚴格遵守 File Scope** — 只修改 MISSION_CONTROL 指定的檔案
2. **遵守 Constraints** — 不可違反約束條件
3. **執行 Verification Commands** — 完成後運行所有驗證指令
4. **觸及 Halt Conditions 時停止** — 記錄原因至 EXECUTION_LOG 並回報

### 失敗熔斷機制

對**同一個問題**嘗試修復 **3 次**仍無法解決時：

1. **停止嘗試** — 不再進行第 4 次修復
2. **整理問題報告** — 在 EXECUTION_LOG 中記錄完整錯誤訊息、已嘗試的修復方法、問題根源分析
3. **回報使用者** — 明確告知需要其他 Agent 協助

---

## Reviewer 工作流程

### 輸入

收到審查任務時，讀取以下兩份檔案（位於 repo 根目錄）：

1. **`MISSION_CONTROL.md`** — 任務目標、File Scope、約束條件、驗證指令
2. **`EXECUTION_LOG.md`** — Executor 的操作記錄、決策理由、驗證結果

### 輸出

撰寫 **`REVIEW_REPORT.md`**（位於 repo 根目錄），嚴格遵循以下模板格式。

### 審查重點

1. **Goal Completion** — 對比 MISSION_CONTROL 的 Objective，逐項檢查完成度
2. **Architecture Consistency** — 對比 `AGENTS.md` 的設計規範（API 格式、命名規範、技術棧）
3. **Side Effects** — 跨模組影響分析，是否改到 File Scope 以外的檔案
4. **Security & Performance** — OWASP 風險、N+1 查詢、缺少索引等
5. **Deviations** — Executor 是否有偏離 MISSION_CONTROL 的行為，偏離是否合理

---

## REVIEW_REPORT.md 模板

```markdown
# REVIEW_REPORT

## Meta

- **Task ID**: （從 MISSION_CONTROL 複製）
- **Reviewer**: Codex
- **Date**: YYYY-MM-DD

## Verdict: APPROVED | APPROVED_WITH_NOTES | CHANGES_REQUIRED | BLOCKED

## 1. Goal Completion

| 目標 | 狀態                     | 備註 |
| ---- | ------------------------ | ---- |
| ...  | DONE / PARTIAL / MISSING | ...  |

## 2. Architecture Consistency

- [PASS / WARN / FAIL] 描述...

## 3. Side Effects

- 跨模組影響分析...

## 4. Security & Performance

- [PASS / WARN / FAIL] 描述...

## 5. Required Actions

（Verdict 非 APPROVED 時，列出必修項目）

1. ...
2. ...
```

### Verdict 判定標準

| Verdict                 | 條件                                           |
| ----------------------- | ---------------------------------------------- |
| **APPROVED**            | 所有目標完成，無架構違規，無安全風險           |
| **APPROVED_WITH_NOTES** | 目標完成，有小建議但不阻擋進版                 |
| **CHANGES_REQUIRED**    | 有未完成目標或需修正的問題，回退 Executor 修正 |
| **BLOCKED**             | 設計層缺陷或架構違規，需回退 Planner 重新規劃  |

---

## 關鍵參考文件

| 文件                           | 用途                                               |
| ------------------------------ | -------------------------------------------------- |
| `AGENTS.md`                    | 專案規範（技術棧、命名規範、API 設計、資料庫設計） |
| `docs/MULTI_AGENT_PROTOCOL.md` | 完整協作協定（角色、流程、中止條件）               |
| `docs/tasks/phase-1-mvp/`      | 各任務的需求與驗收標準                             |
| `docs/PRD.md`                  | 產品需求文檔                                       |

---

## 注意事項

- **不要執行 `git commit` 或 `git push`**，版控操作由 Claude 負責
- **不要修改任務文件**（`docs/tasks/` 下的 checkbox 勾選、進度更新），這是 Claude 的歸檔職責
- 若擔任 Reviewer，**不要修改程式碼**，職責是審查並產出 `REVIEW_REPORT.md`
- 若 Executor 的 `EXECUTION_LOG.md` 資訊不足以判斷，在 REVIEW_REPORT 中明確指出缺少的資訊
- EXECUTION_LOG 審查採寬鬆原則：Meta 完整 + Deviations 如實即可，Steps/Verification 允許簡略
