# Skills 檔案位置說明

## 📍 Skills 實際儲存位置

Skills 的 `.md` 檔案並**不會**直接複製到專案 repo 中，而是儲存在全局的 Claude Code cache 目錄。

### 全局儲存路徑

```
~/.claude/plugins/cache/
├── superpowers-marketplace/
│   └── superpowers/
│       ├── 4.0.3/          # 舊版本
│       └── 4.1.1/          # 目前 project 使用的版本
│           └── skills/
│               ├── brainstorming/
│               ├── systematic-debugging/
│               │   ├── SKILL.md                    # 主要 skill 內容
│               │   ├── root-cause-tracing.md       # 輔助資源
│               │   ├── defense-in-depth.md
│               │   └── ...
│               ├── test-driven-development/
│               ├── verification-before-completion/
│               ├── requesting-code-review/
│               ├── using-git-worktrees/
│               ├── finishing-a-development-branch/
│               ├── executing-plans/
│               ├── writing-plans/
│               ├── receiving-code-review/
│               ├── subagent-driven-development/
│               ├── writing-skills/
│               ├── dispatching-parallel-agents/
│               └── using-superpowers/
│
└── anthropic-agent-skills/
    └── document-skills/
        └── 69c0b1a06741/        # 版本 hash
            └── skills/
                ├── frontend-design/
                │   ├── SKILL.md
                │   └── LICENSE.txt
                ├── webapp-testing/
                ├── pdf/
                ├── docx/
                ├── pptx/
                ├── xlsx/
                ├── algorithmic-art/
                ├── canvas-design/
                ├── doc-coauthoring/
                ├── internal-comms/
                ├── mcp-builder/
                ├── skill-creator/
                ├── slack-gif-creator/
                ├── theme-factory/
                ├── web-artifacts-builder/
                └── brand-guidelines/
```

## 🔧 專案中的配置

專案的 `.claude/settings.json` 只記錄**哪些 plugins 已啟用**：

```json
{
  "enabledPlugins": {
    "superpowers@superpowers-marketplace": true,
    "document-skills@anthropic-agent-skills": true
  }
}
```

## 📂 檔案結構說明

### 每個 Skill 目錄包含：

1. **`SKILL.md`** - 核心內容
   - Skill 的主要邏輯和指導方針
   - 使用方式和最佳實踐
   - 檢查清單和流程圖

2. **輔助資源檔案**（視 skill 而定）
   - 範例代碼
   - 參考文檔
   - Shell 腳本工具
   - 授權文件

### Superpowers Skills 範例結構：

```bash
~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/systematic-debugging/
├── SKILL.md                           # 主要 skill 內容（9.9 KB）
├── CREATION-LOG.md                    # 創建日誌
├── root-cause-tracing.md              # 根因追蹤方法
├── defense-in-depth.md                # 深度防禦策略
├── condition-based-waiting.md         # 條件等待模式
├── condition-based-waiting-example.ts # 範例代碼
├── find-polluter.sh                   # 測試污染查找工具
├── test-academic.md                   # 學術測試指南
├── test-pressure-1.md                 # 壓力測試指南
├── test-pressure-2.md
└── test-pressure-3.md
```

### Document Skills 範例結構：

```bash
~/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/frontend-design/
├── SKILL.md                           # 主要 skill 內容（4.4 KB）
└── LICENSE.txt                        # 授權文件
```

## 🔍 查看 Skill 內容的方法

### 方法 1：直接讀取檔案（推薦用於學習）

```bash
# 查看 systematic-debugging skill
cat ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/systematic-debugging/SKILL.md

# 查看 frontend-design skill
cat ~/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/frontend-design/SKILL.md
```

### 方法 2：使用 Skill tool（推薦用於執行）

在 Claude Code 對話中直接調用 skill，系統會自動載入對應的 SKILL.md 內容。

```bash
# 在對話中說：
"請使用 systematic-debugging 協助分析這個問題"
```

### 方法 3：列出所有 skills

```bash
# Superpowers skills
ls ~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/

# Document skills
ls ~/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/
```

## 💡 為什麼不放在 Repo 中？

### 優點：

1. **避免重複**：多個專案共用同一份 skills
2. **自動更新**：`claude plugin update` 可更新所有專案的 skills
3. **版本管理**：Claude Code 統一管理 plugin 版本
4. **保持 Repo 乾淨**：專案 repo 只包含專案代碼

### 專案配置的作用：

- `.claude/settings.json` 記錄此專案啟用哪些 plugins
- 團隊成員 clone repo 後，執行 `claude plugin install` 會根據配置安裝相同的 plugins
- 確保團隊使用一致的開發 skills

## 🚀 團隊協作流程

### 1. 專案擁有者（已完成）

```bash
# 安裝 plugins 到 project scope
claude plugin install superpowers@superpowers-marketplace --scope project
claude plugin install document-skills@anthropic-agent-skills --scope project

# 配置自動寫入 .claude/settings.json
git add .claude/settings.json
git commit -m "Add project skills configuration"
```

### 2. 團隊成員（加入專案時）

```bash
# Clone 專案
git clone <repo-url>
cd card-erp

# Claude Code 會自動偵測 .claude/settings.json
# 首次使用時會提示安裝缺少的 plugins

# 或手動安裝
claude plugin install superpowers@superpowers-marketplace
claude plugin install document-skills@anthropic-agent-skills
```

### 3. 更新 Skills

```bash
# 更新特定 plugin
claude plugin update superpowers@superpowers-marketplace

# 更新後需要重啟 Claude Code session 才會生效
```

## 📝 快速參考

### 查看已安裝的 plugins

```bash
claude plugin list
```

### 查看特定 skill 的完整路徑

```bash
# Superpowers skills (v4.1.1)
~/.claude/plugins/cache/superpowers-marketplace/superpowers/4.1.1/skills/<skill-name>/SKILL.md

# Document skills (v69c0b1a06741)
~/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/<skill-name>/SKILL.md
```

### 本專案使用的 Skills 清單

**Superpowers (11個):**
- brainstorming
- systematic-debugging
- test-driven-development
- verification-before-completion
- requesting-code-review
- receiving-code-review
- using-git-worktrees
- finishing-a-development-branch
- executing-plans
- writing-plans
- subagent-driven-development

**Document Skills (3個):**
- frontend-design
- webapp-testing
- (其他 13 個可用但本專案較少使用)

---

## 🔗 相關文件

- [Skills 使用指南](/docs/SKILLS_GUIDE.md)
- [Phase 1 MVP Tasks](/docs/tasks/phase-1-mvp/)

---

最後更新：2026-01-25
