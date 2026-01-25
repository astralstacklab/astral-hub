# Card ERP Project Skills Guide

本專案已安裝以下 Claude Code Skills，協助開發流程更加系統化和高效。

## 🚀 快速安裝

Clone 專案後，執行以下命令安裝所需的 plugins：

```bash
bash .claude/setup-skills.sh
```

這會自動安裝專案所需的所有 Claude Code plugins。

## 📦 已安裝的 Plugins

- **superpowers@superpowers-marketplace** (v4.1.1)
- **document-skills@anthropic-agent-skills** (v69c0b1a06741)
- **claude-reflect@claude-reflect-marketplace** (v2.4.0)

## 🎯 核心開發流程技能（Tier 1 - 必備）

### 1. `superpowers:systematic-debugging`
**使用時機：** 遇到任何 bug、測試失敗、或意外行為時

**為何重要：**
- 複雜的 monorepo 架構（4個apps + shared packages）
- 多個第三方整合（ECPay、GCS、WebSocket）
- 跨服務通訊可能產生的問題
- 需要系統化方法定位問題根源

**使用方式：**
```bash
# 在對話中直接請求
"我遇到 WebSocket 連線問題，請使用 systematic-debugging 來協助"
```

---

### 2. `superpowers:test-driven-development`
**使用時機：** 實作任何功能或 bugfix 之前

**為何重要：**
- 專案要求 80% 單元測試覆蓋率
- 金流/物流整合需要高可靠性
- TDD 確保商業邏輯正確性
- Vitest + Playwright 測試架構

**使用方式：**
```bash
# 在實作功能前
"請使用 TDD 方式實作商品搜尋功能"
```

---

### 3. `superpowers:verification-before-completion`
**使用時機：** 宣稱工作完成、commit、創建 PR 之前

**為何重要：**
- 防止錯誤的「完成」宣告
- 確保測試真的通過
- 驗證部署前的狀態
- 22個任務需要嚴格驗證

**使用方式：**
```bash
# 在完成任務前
"任務完成，請進行 verification"
```

---

### 4. `superpowers:requesting-code-review`
**使用時機：** 完成任務、實作主要功能、merge 前

**為何重要：**
- TypeScript strict mode 需要高代碼質量
- 禁用 `any` 的嚴格要求
- 金流邏輯的安全性審查
- 多人協作時的質量保證

**使用方式：**
```bash
# 完成功能實作後
"請 review 我剛完成的 ECPay 整合代碼"
```

---

## 🔧 Git 工作流程技能（Tier 2 - 強烈推薦）

### 5. `superpowers:using-git-worktrees`
**使用時機：** 開始新功能開發、需要隔離工作空間時

**為何重要：**
- 6個 Sprint 可能需要並行開發
- 隔離不同功能的開發環境
- 避免頻繁切換分支影響開發
- 特別適合 monorepo 架構

**使用方式：**
```bash
"請使用 git worktree 為 Sprint 4 建立獨立工作區"
```

---

### 6. `superpowers:finishing-a-development-branch`
**使用時機：** 實作完成、所有測試通過後

**為何重要：**
- 結構化的完成流程（merge、PR、cleanup）
- 確保每個 Sprint 結束時的一致性
- 符合專案的 Git 工作流程

**使用方式：**
```bash
"Sprint 4 已完成，請協助完成 development branch"
```

---

### 7. `superpowers:executing-plans`
**使用時機：** 執行已寫好的實作計劃時

**為何重要：**
- 已有 22 個詳細的任務計劃
- 需要系統化執行每個 Sprint
- 在獨立 session 中執行並設置 review checkpoint
- 確保按計劃推進

**使用方式：**
```bash
"請執行 Task 10 的實作計劃"
```

---

## 🎨 前端開發技能（Tier 2）

### 8. `document-skills:frontend-design`
**使用時機：** 建立 web 組件、頁面、UI 布局時

**為何重要：**
- 3個 Nuxt 應用需要 UI 設計（Buyer、Admin、POS）
- 避免 generic AI 美學
- 產出 production-grade 的介面
- TailwindCSS + shadcn/ui 整合

**使用方式：**
```bash
"請使用 frontend-design 協助設計商品列表頁面"
```

---

## 🧪 測試技能（Tier 3 - 建議）

### 9. `document-skills:webapp-testing`
**使用時機：** 驗證前端功能、debug UI 行為、E2E 測試時

**為何重要：**
- Task 21 規劃了 Playwright E2E 測試
- 需要測試本地 web 應用功能
- 前端互動流程驗證（購物車、結帳、競標）
- 瀏覽器截圖和日誌查看

**使用方式：**
```bash
"請測試購物車的完整流程"
```

---

## 📋 計劃管理技能（Tier 3）

### 10. `superpowers:writing-plans`
**使用時機：** 有 spec 或需求的多步驟任務前

**為何重要：**
- 22個任務可能需要細分子任務
- 複雜功能需要詳細實作計劃
- 在接觸代碼前先規劃

**使用方式：**
```bash
"請為會員系統功能撰寫詳細實作計劃"
```

---

### 11. `superpowers:receiving-code-review`
**使用時機：** 接收 review 反饋時

**為何重要：**
- 接收 review 反饋時需要技術驗證
- 不盲目實作建議
- 確保反饋的技術正確性

**使用方式：**
```bash
"收到 review 建議要改用 Composition API，請協助評估"
```

---

## 💡 Skills 使用最佳實踐

### 1. 開發新功能的完整流程

```bash
1. 使用 superpowers:writing-plans 規劃實作
2. 使用 superpowers:using-git-worktrees 建立隔離環境
3. 使用 superpowers:test-driven-development 開始實作
4. 使用 document-skills:frontend-design 設計 UI（如需要）
5. 使用 superpowers:verification-before-completion 驗證完成
6. 使用 superpowers:requesting-code-review 進行審查
7. 使用 superpowers:finishing-a-development-branch 完成整合
```

### 2. Debug 問題的流程

```bash
1. 使用 superpowers:systematic-debugging 系統化分析
2. 使用 document-skills:webapp-testing 重現問題（前端）
3. 使用 superpowers:test-driven-development 撰寫測試確保修復
4. 使用 superpowers:verification-before-completion 驗證修復
```

### 3. Code Review 流程

```bash
1. 使用 superpowers:requesting-code-review 請求審查
2. 使用 superpowers:receiving-code-review 處理反饋
3. 使用 superpowers:verification-before-completion 確認改善
```

---

## 📝 專案特定注意事項

### TypeScript Strict Mode
所有 skills 都需要遵守：
- ❌ 禁止使用 `any` 類型（測試除外）
- ✅ 使用 Zod schema 進行運行時驗證
- ✅ 使用 shared-types 確保類型一致性

### 測試覆蓋率要求
- 單元測試：80%+
- 整合測試：60%+
- E2E 測試：關鍵流程必須覆蓋

### Git 工作流程
- Git commits 只由專案擁有者執行
- 使用 git worktrees 進行功能隔離
- 每個 Sprint 完成後進行整合

---

## 🔍 檢查已安裝的 Skills

```bash
# 列出所有已安裝的 plugins
claude plugin list

# 檢查專案配置
cat .claude/settings.json
```

---

## 📁 專案 Skills 配置

專案的 Claude Code 配置位於 `.claude/` 目錄，會跟隨 Git 版本控制：

```
.claude/
├── settings.json          # 專案設定（版本控制）
├── settings.local.json    # 本地設定（不進版控）
├── setup-skills.sh        # Plugins 安裝腳本
├── README.md              # 配置說明
└── skills/                # 專案自訂 skills
    └── card-erp-workflow.md  # Card ERP 開發工作流程
```

### 專案自訂 Skill: `card-erp-workflow`

專案內建的開發工作流程 skill，包含：
- 專案背景與結構
- TypeScript 嚴格規範
- 開發流程指南
- Git 規範
- 常用命令

### 新機器設置流程

1. Clone 專案：`git clone <repo-url>`
2. 安裝 plugins：`bash .claude/setup-skills.sh`
3. 開始使用 Claude Code

---

## 📚 相關文件

- [Phase 1 MVP Tasks](/docs/tasks/phase-1-mvp/) - 22個詳細任務文件
- [PRD](/docs/requirements/PRD.md) - 產品需求文件
- [System Architecture](/docs/system-architecture.md) - 系統架構設計

---

最後更新：2026-01-25
