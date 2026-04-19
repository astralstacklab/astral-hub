# AstralStackLab Repository Governance Charter v1.0

## 1. Purpose & Authority

### 1.1 文件目的

本文件定義本 Repository 的最高治理規範（Governance Charter），用於：

- 規範產品開發流程與變更控制
- 確保版本一致性與可追溯性
- 保證文件、實作與發版流程一致
- 支援單代理或多代理開發模式

### 1.2 適用範圍

本規範適用於：

- 所有程式碼變更
- 所有產品需求變更
- 所有版本發佈行為
- 所有 PRD、roadmap、tasks 文件

### 1.3 優先級聲明

- `AGENT.md` 為本 Repository 最高治理規範。
- 如與其他文件衝突，應以 `AGENT.md` 為準。

## 2. Core Governance Principles

### 2.1 `product_slug` 不可變原則

- `product_slug` 一旦定義不得修改。
- 格式：小寫字母 + hyphen（kebab-case）。
- 例：`astralstacklab-core`
- `product_slug` 為產品唯一識別碼，參與 Idempotency 驗證。

### 2.2 僅使用 SemVer

版本格式必須為：

- `vMAJOR.MINOR.PATCH`

不得使用：

- 日期版本
- 自定義後綴
- 非語意化版本格式

### 2.3 Version Classification Policy

版本升級規則：

- `MAJOR`：Breaking change、API/Contract 不相容變更、Scope 重定義、Schema 破壞性變更
- `MINOR`：新增功能（向下相容）、新增非破壞性模組
- `PATCH`：Bug fix、文件修正、不改變行為的內部優化

不得隨意升級 `MAJOR`。

### 2.4 一次 Release 對應一次 `change.json`

每次發版必須對應唯一 `change.json`。不得：

- 合併多次 change 於同一版本
- 一個版本對應多個 `change.json`

### 2.5 結構化變更優先原則

- 所有變更必須可被機器解析。
- `change.json` 為唯一可審計變更來源。
- 禁止僅存在自由敘述的關鍵變更。

## 3. Required Repository Structure

Repository 必須包含：

- `/docs/prd/`
- `/docs/roadmap/`
- `/docs/tasks/`
- `/docs/adr/`（如有）
- `/changes/`
- `/PRODUCT.yaml`
- `/AGENT.md`

### 3.1 `CLAUDE.md` 規範

`CLAUDE.md` 僅可包含：

- 導向 `AGENT.md` 的說明
- 執行環境提示

不得定義治理規則。

## 4. Pre-Development Gate (Definition of Ready)

在任何實作開始前，必須具備：

- PRD（完整章節）
- 設計說明
- roadmap
- tasks 分解
- 驗收標準
- 風險評估
- 回滾策略

### 4.1 文件一致性檢查

必須確認：

- PRD Scope 與 roadmap 一致
- roadmap 與 tasks 對應
- tasks 有明確驗收條件

### 4.2 啟動條件

若文件缺失或不一致，禁止進入開發階段。

## 5. In-Development Rules (Execution Discipline)

### 5.1 Scope 對齊原則

所有實作必須對齊：

- PRD Scope
- 設計文件
- roadmap
- tasks

不得自行擴展 Scope。

### 5.2 Scope 變更流程

若需變更 Scope：

1. 先更新 PRD
2. 更新 roadmap
3. 更新 tasks
4. 再修改程式碼

禁止先改碼後補文件。

### 5.3 Traceability Matrix 原則

- 每個 Scope 必須對應至少一個 Task
- 每個 Task 必須對應至少一個 Commit
- 每個 PR 必須標註 Task ID

### 5.4 最低品質標準

- 必須通過測試
- 不得引入明顯警告
- 必須可成功建置
- 不得破壞既有功能

## 6. Secure Development Requirements

### 6.1 依賴管理

- 必須鎖定依賴版本
- 禁止使用未審核套件

### 6.2 Secrets 管理

- 禁止在 repo 存放 secrets
- 必須使用環境變數或安全儲存機制

### 6.3 外部整合

新增外部整合時，必須：

- 更新風險說明
- 記錄安全考量

## 7. Post-Development Gate (Definition of Done)

完成條件包括：

- 驗收測試通過
- 回歸測試完成
- 文件同步更新
- `change.json` 完整填寫

## 8. Release & Change Event Workflow

固定順序：

1. 更新 PRD（若有 Scope 變更）
2. 產生 `change.json`
3. 合規驗證
4. 打 Tag
5. 提交

### 8.1 `change.json` 必填欄位

每次 release 必須有且僅有一個 `change.json`，且至少包含：

- `product_slug`
- `version`
- `date`（`YYYY-MM-DD`）
- `summary`
- `highlights`（最多 5 項）
- `changes`
- `references`
- `scope_changes`
- `impact_domains`
- `risk_level`
- `rollback_strategy`

### 8.2 `changes` 結構（固定 buckets）

`changes` 必須包含以下固定鍵（即使無內容也需為空陣列）：

- `added`
- `changed`
- `fixed`
- `security`
- `deprecated`
- `breaking`

禁止新增自定義 bucket 名稱。

### 8.3 Impact Domain 分類

變更必須標註影響域：

- API
- Schema
- Security
- Performance
- Infrastructure
- Documentation

### 8.4 Idempotency 規則

以下組合必須唯一：

- `product_slug + version`

不得重複發版。

### 8.5 Change Extraction 規則

發版 `change.json` 的變更內容，應以 PRD 的 `Scope` 為主要依據來源，避免自由敘述偏移。

## 9. PRD Standard

PRD 必須包含：

- Summary
- Goals
- Non-Goals
- Scope
- Added
- Changed
- Fixed
- Security
- 背景
- 問題定義
- 功能需求
- 非功能需求
- 風險分析
- Acceptance Criteria
- Risks & Rollback

可選章節：

- Deprecated
- Breaking

### 9.1 PRD 版本化

PRD 必須版本化，並與產品版本可對齊。

## 10. Decision Records & Exceptions

### 10.1 何時需要 ADR

以下情況必須建立 ADR：

- 架構重大決策
- 技術選型變更
- Breaking change

### 10.2 例外流程

例外必須：

- 書面記錄
- 註明核准人
- 指定有效期限
- 存放於 `/docs/adr/`

### 10.3 禁止事項

未記錄例外不得繞過治理規範。

## 11. Compliance Checklist

### 開發前

- PRD 是否完整
- Scope 是否明確
- Roadmap 是否對齊

### 合併前

- 是否標註 Task ID
- 是否更新文件
- 是否影響版本

### 發版前

- `change.json` 是否完整
- 版本是否符合 SemVer
- Tag 是否正確
- `date` 是否為 `YYYY-MM-DD`
- `product_slug + version` 是否唯一
- `changes` buckets 是否齊全

### 不合規處理

若發現違規：

1. 暫停合併
2. 回退至最近合法版本
3. 補齊文件後重新驗證

## 12. Ownership & Maintenance

- 規範維護人：Product Owner / Repository Owner
- 修改 `AGENT.md` 必須建立 `change.json`
- 治理版本變更應極少發生
- 每次修改必須可追溯

## 13. Automation Compatibility

本治理框架設計為：

- 可被機器解析
- 可被代理系統驗證
- 支援單代理與多代理模型

本文件定義治理規範，但不綁定具體執行架構。

## 14. LLM Observability Standard

### 14.1 強制規範

所有 ASL repository 的 LLM call 必須整合 Langfuse 觀測。

ASTRA `/llm` panel 依賴 Langfuse tag 做跨 repo 數據聚合。**Tag 不一致即視為合規違規。**

### 14.2 整合前置條件

在任何 repo 進行 Langfuse 整合前，必須使用 `langfuse-integration` skill。

禁止在未讀取 skill 的情況下自行實作 Langfuse 整合。

### 14.3 強制 Tag Schema

每個 Langfuse trace 必須帶以下四個 tag，缺一不可：

| Tag | 說明 |
|-----|------|
| `project:{product_slug}` | 必須與 `PRODUCT.yaml` 的 `product_slug` 一致 |
| `module:{module_name}` | repo 內的功能模組名稱 |
| `model:{model_name}` | 實際使用的 LLM model，動態取得 |
| `env:{environment}` | 從 `NODE_ENV` 讀取，預設 `development` |

### 14.4 禁止事項

- 禁止 hardcode `model` tag（必須動態取得）
- 禁止在 Langfuse keys 缺失時讓服務 crash（必須 graceful degrade）
- 禁止 Cloud Run Job 在 `execute()` 結束前未呼叫 `flushAsync()`
- 禁止將 Langfuse secrets 存放於 repo（必須使用 GCP Secret Manager）

### 14.5 Compliance Checklist 補充項目

發版前額外確認：

- [ ] 所有 LLM call 已加 Langfuse trace
- [ ] 四個 tag 齊全且格式正確
- [ ] `project` tag 與 `PRODUCT.yaml` 一致
- [ ] Cloud Run Job 有 `flushAsync()`

## 15. ASL Skills Discovery Pipeline

### 15.1 目的

Skills 是 ASL 組織的**共用執行知識單元**，用於在所有 repo 之間同步一致的做法。
每個 Skill 封裝一個明確的「如何做」，讓 Claude 或人工在無額外說明的情況下即可正確執行。

### 15.2 何時應封裝為 Skill

當下列任一條件成立時，應考慮將做法封裝為 Skill：

- 同樣的做法在兩個以上 repo 重複出現
- 沒有 Skill 時，Claude 容易做出不一致或錯誤的選擇
- 做法有明確的「對/錯」邊界（不是個人偏好）

### 15.3 Skill 存放位置與格式

所有共用 Skills 存放於：

```
astralstacklab/astralstacklab/skills/{skill-name}/SKILL.md
```

每個 `SKILL.md` 必須包含 YAML frontmatter：

```yaml
---
name: {skill-name}
description: {一句話說明這個 skill 解決什麼問題}
tags: [{分類標籤}]
---
```

body 內容遵循 agentskills.io 格式，並在文末加上：

```
> Governance: AGENT.md §15
```

### 15.4 Skill 生命週期

```
發現候選 → 起草 SKILL.md → PR 至 astralstacklab → 合併 → AEGIS 自動 sync PR 至所有 repo
```

- **發現**：Eric 或 Claude 均可提出候選
- **起草**：由 Claude 產生初稿，Eric 審核
- **合併後**：AEGIS standards-sync 自動偵測 diff，對所有已安裝 repo 開 PR

### 15.5 版本控制

Skills 隨 `astralstacklab/VERSION` 一起版本化。
新增或修改任何 Skill 後，必須同時 bump VERSION（MINOR），並產生對應 `change.json`。

### 15.6 禁止事項

- 禁止將 repo 專屬邏輯放入共用 Skills（應放在該 repo 的 `.claude/` 目錄）
- 禁止直接修改已 sync 至各 repo 的 Skill 副本（應修改 `astralstacklab` 來源後重新 sync）
- 禁止在未讀取對應 Skill 的情況下自行實作該 Skill 所涵蓋的功能
