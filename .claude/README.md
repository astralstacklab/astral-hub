# Astral Hub - Claude Code 配置

此目錄包含專案的 Claude Code 配置，讓 skills 和設定能跟隨 repo 進行版本控制。

## 快速開始

Clone 專案後，執行以下命令安裝所需的 plugins：

```bash
bash .claude/setup-skills.sh
```

## 目錄結構

```
.claude/
├── README.md              # 本文件
├── settings.json          # 專案設定（版本控制）
├── settings.local.json    # 本地設定（不進版控）
├── setup-skills.sh        # Plugins 安裝腳本
└── skills/                # 專案 skills（版本控制）
    ├── astral-hub-workflow/          # Astral Hub 開發工作流程
    │   └── SKILL.md
    ├── systematic-debugging/       # 系統化除錯（含參考腳本）
    │   ├── SKILL.md
    │   ├── root-cause-tracing.md
    │   ├── defense-in-depth.md
    │   ├── condition-based-waiting.md
    │   ├── condition-based-waiting-example.ts
    │   └── find-polluter.sh
    ├── test-driven-development/    # TDD 測試驅動開發
    │   ├── SKILL.md
    │   └── testing-anti-patterns.md
    ├── verification-before-completion/  # 完成前驗證
    │   └── SKILL.md
    ├── requesting-code-review/     # 請求 Code Review
    │   ├── SKILL.md
    │   └── code-reviewer.md
    ├── receiving-code-review/      # 接收 Code Review
    │   └── SKILL.md
    ├── using-git-worktrees/        # Git Worktree 使用
    │   └── SKILL.md
    ├── finishing-a-development-branch/  # 完成開發分支
    │   └── SKILL.md
    ├── executing-plans/            # 執行計劃
    │   └── SKILL.md
    ├── writing-plans/              # 撰寫計劃
    │   └── SKILL.md
    ├── frontend-design/            # 前端設計
    │   └── SKILL.md
    └── webapp-testing/             # Web 應用測試（含範例與腳本）
        ├── SKILL.md
        ├── examples/
        │   ├── console_logging.py
        │   ├── element_discovery.py
        │   └── static_html_automation.py
        └── scripts/
            └── with_server.py
```

## 配置文件說明

### `settings.json`（版本控制）

專案級別的設定，包含：
- 啟用的 plugins 列表
- 專案共用的配置

### `settings.local.json`（不進版控）

本地個人設定，包含：
- 個人權限設定
- 不應共享的配置

## Skills 說明

### Tier 1 - 核心開發流程技能（必備）

| Skill | 使用時機 |
|-------|---------|
| `systematic-debugging` | 遇到 bug、測試失敗、意外行為 |
| `test-driven-development` | 實作功能或 bugfix 前 |
| `verification-before-completion` | 完成工作、commit、PR 前 |
| `requesting-code-review` | 完成功能、merge 前 |

### Tier 2 - Git 工作流程技能（強烈推薦）

| Skill | 使用時機 |
|-------|---------|
| `using-git-worktrees` | 開始新功能、需要隔離環境 |
| `finishing-a-development-branch` | 完成開發、測試通過後 |
| `executing-plans` | 執行已寫好的實作計劃 |

### Tier 3 - 其他技能

| Skill | 使用時機 |
|-------|---------|
| `frontend-design` | 建立 UI 組件、頁面布局 |
| `webapp-testing` | E2E 測試、前端功能驗證 |
| `writing-plans` | 規劃多步驟任務 |
| `receiving-code-review` | 接收 review 反饋 |
| `astral-hub-workflow` | Astral Hub 專案專用工作流程 |

## 安裝的 Plugins

| Plugin | 說明 |
|--------|------|
| `superpowers@superpowers-marketplace` | 核心開發流程技能 |
| `document-skills@anthropic-agent-skills` | 文件處理技能 |
| `claude-reflect@claude-reflect-marketplace` | 反思與學習技能 |

## 新機器設置流程

1. Clone 專案：`git clone <repo-url>`
2. 安裝 plugins：`bash .claude/setup-skills.sh`
3. 開始使用 Claude Code

## 詳細使用指南

請參考：[docs/SKILLS_GUIDE.md](../docs/SKILLS_GUIDE.md)
