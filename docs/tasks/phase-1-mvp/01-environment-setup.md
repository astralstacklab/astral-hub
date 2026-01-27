# 01 - 環境建置任務

**階段**: 第一階段 MVP - Sprint 1
**預計時間**: 1 天
**負責人**: TBD
**優先級**: 🔴 Critical

---

## 📋 目標

建立完整的本地開發環境，讓開發者能快速啟動專案，並為後續開發做好準備。

## 🎯 成功標準

- [x] 執行 `pnpm run setup-dev` 能成功啟動環境
- [x] Docker containers 正常運行（PostgreSQL + Redis）
- [x] 可連接 PostgreSQL（使用 psql 或 GUI 工具測試）
- [x] 可連接 Redis（使用 redis-cli 測試）
- [ ] Git hooks 正常運作（pre-commit、commit-msg）
- [ ] 環境變數驗證工具正常運作

## 📦 前置條件

**系統需求**:
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker Desktop 或 Docker Engine
- Git

**前置任務**:
- 無（這是第一個任務）

---

## ✅ 子任務清單

### 1.1 Docker Compose 設定

#### 1.1.1 建立 docker-compose.yml
- [x] 在專案根目錄建立 `docker-compose.yml`
- [x] 配置 PostgreSQL 15 服務
  ```yaml
  services:
    postgres:
      image: postgres:15-alpine
      container_name: card-erp-postgres
      environment:
        POSTGRES_USER: card_erp_user
        POSTGRES_PASSWORD: card_erp_password
        POSTGRES_DB: card_erp
      ports:
        - "5678:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
        - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U card_erp_user"]
        interval: 10s
        timeout: 5s
        retries: 5
  ```
- [x] 配置 Redis 7 服務
  ```yaml
    redis:
      image: redis:7-alpine
      container_name: card-erp-redis
      ports:
        - "6379:6379"
      volumes:
        - redis_data:/data
      healthcheck:
        test: ["CMD", "redis-cli", "ping"]
        interval: 10s
        timeout: 5s
        retries: 5
  ```
- [x] 定義 volumes
  ```yaml
  volumes:
    postgres_data:
    redis_data:
  ```

#### 1.1.2 建立資料庫初始化腳本
- [x] 建立 `scripts/init-db.sql`
  - 建立必要的 extension（如 uuid-ossp）
  - 設定資料庫編碼（UTF-8）
  - 建立初始 schema（若需要）

#### 1.1.3 測試 Docker 環境
- [x] 執行 `docker-compose up -d`
- [x] 確認 containers 正常啟動
- [x] 測試 PostgreSQL 連線
  ```bash
  docker exec -it card-erp-postgres psql -U card_erp_user -d card_erp
  ```
- [x] 測試 Redis 連線
  ```bash
  docker exec -it card-erp-redis redis-cli ping
  ```

---

### 1.2 開發工具腳本

#### 1.2.1 建立開發環境設定腳本
- [x] 建立 `scripts/setup-dev.sh`（macOS/Linux）
  ```bash
  #!/bin/bash
  # 檢查 Node.js 版本
  # 檢查 pnpm 版本
  # 檢查 Docker 是否運行
  # 複製 .env.example → .env（如果不存在）
  # 啟動 Docker containers
  # 安裝所有依賴（pnpm install）
  # 提示後續步驟
  ```
- [ ] 建立 `scripts/setup-dev.ps1`（Windows PowerShell）⚠️ 暫緩：目前為 Linux 開發環境，視需求補建
  - 與上述腳本功能相同
- [x] 賦予執行權限
  ```bash
  chmod +x scripts/setup-dev.sh
  ```

#### 1.2.2 建立清理腳本
- [x] 建立 `scripts/teardown-dev.sh`
  ```bash
  #!/bin/bash
  # 停止 Docker containers
  # 刪除 volumes（可選）
  # 清理 node_modules（可選）
  ```
- [ ] 建立對應的 Windows 版本 ⚠️ 暫緩：同上

#### 1.2.3 在 package.json 新增腳本
- [x] 編輯根目錄 `package.json`
  ```json
  {
    "scripts": {
      "setup-dev": "bash scripts/setup-dev.sh",
      "teardown-dev": "bash scripts/teardown-dev.sh",
      "docker:up": "docker compose up -d",
      "docker:down": "docker compose down",
      "docker:logs": "docker compose logs -f",
      "db:psql": "docker exec -it card-erp-postgres psql -U card_erp_user -d card_erp"
    }
  }
  ```

#### 1.2.4 測試腳本
- [x] 執行 `pnpm run setup-dev`
- [x] 驗證所有步驟成功執行
- [x] 執行 `pnpm run teardown-dev`
- [x] 驗證清理成功

---

### 1.3 環境變數驗證

#### 1.3.1 建立環境變數驗證工具
- [ ] 建立 `scripts/validate-env.ts`
  ```typescript
  import { z } from 'zod'
  import { config } from 'dotenv'

  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    API_PORT: z.string().regex(/^\d+$/),
    // ... 其他環境變數
  })

  // 驗證邏輯
  ```
- [ ] 安裝依賴: `pnpm add -D zod dotenv`

#### 1.3.2 整合到開發腳本
- [ ] 在 `setup-dev.sh` 中呼叫驗證工具
- [ ] 驗證失敗時提供清楚的錯誤訊息

#### 1.3.3 新增 package.json 腳本
- [ ] 編輯 `package.json`
  ```json
  {
    "scripts": {
      "validate-env": "tsx scripts/validate-env.ts"
    }
  }
  ```

---

### 1.4 VSCode 設定

#### 1.4.1 建立 VSCode 工作區設定
- [ ] 建立 `.vscode/settings.json`
  ```json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "typescript.tsdk": "node_modules/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true,
    "[vue]": {
      "editor.defaultFormatter": "Vue.volar"
    },
    "[typescript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "files.eol": "\n",
    "files.insertFinalNewline": true,
    "files.trimTrailingWhitespace": true
  }
  ```

#### 1.4.2 建立推薦擴充清單
- [ ] 建立 `.vscode/extensions.json`
  ```json
  {
    "recommendations": [
      "vue.volar",
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "prisma.prisma",
      "bradlc.vscode-tailwindcss",
      "ms-azuretools.vscode-docker"
    ]
  }
  ```

#### 1.4.3 建立除錯配置（可選）
- [ ] 建立 `.vscode/launch.json`
  - API 伺服器除錯配置
  - 前端應用除錯配置

---

### 1.5 Git Hooks

#### 1.5.1 安裝 Husky
- [ ] 安裝依賴
  ```bash
  pnpm add -D husky lint-staged
  ```
- [ ] 初始化 Husky
  ```bash
  pnpm exec husky init
  ```

#### 1.5.2 配置 pre-commit hook
- [ ] 編輯 `.husky/pre-commit`
  ```bash
  #!/bin/sh
  pnpm exec lint-staged
  ```
- [ ] 建立 `.lintstagedrc.json`
  ```json
  {
    "*.{ts,tsx,js,jsx,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
  ```

#### 1.5.3 配置 commit-msg hook
- [ ] 安裝 commitlint
  ```bash
  pnpm add -D @commitlint/cli @commitlint/config-conventional
  ```
- [ ] 建立 `.commitlintrc.json`
  ```json
  {
    "extends": ["@commitlint/config-conventional"],
    "rules": {
      "type-enum": [
        2,
        "always",
        ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"]
      ],
      "subject-case": [0]
    }
  }
  ```
- [ ] 建立 `.husky/commit-msg`
  ```bash
  #!/bin/sh
  pnpm exec commitlint --edit $1
  ```

#### 1.5.4 測試 Git Hooks
- [ ] 測試 pre-commit（故意寫錯格式）
- [ ] 測試 commit-msg（使用錯誤的 commit message）
- [ ] 驗證 hooks 正常阻止錯誤提交

---

### 1.6 文檔更新

#### 1.6.1 更新 README.md
- [ ] 新增「快速開始」章節
  ```markdown
  ## 快速開始

  1. 安裝依賴
  ```bash
  pnpm install
  ```

  2. 設定環境
  ```bash
  pnpm run setup-dev
  ```

  3. 啟動開發伺服器
  ```bash
  # 後端 API
  pnpm --filter api dev

  # 前端（後續補充）
  ```
  ```

#### 1.6.2 建立開發環境疑難排解文檔
- [ ] 建立 `docs/TROUBLESHOOTING.md`
  - Docker 常見問題
  - 端口衝突解決方案
  - 權限問題處理

---

## 🧪 測試步驟

### 全新環境測試
1. [ ] 在全新的機器或虛擬環境中 clone 專案
2. [ ] 執行 `pnpm run setup-dev`
3. [ ] 驗證所有步驟成功
4. [ ] 連接 PostgreSQL 並執行簡單查詢
5. [ ] 連接 Redis 並執行 SET/GET 測試

### Git Hooks 測試
1. [ ] 建立測試檔案並故意加入格式錯誤
2. [ ] 執行 `git add .` 和 `git commit`
3. [ ] 驗證 pre-commit hook 攔截錯誤
4. [ ] 使用錯誤的 commit message
5. [ ] 驗證 commit-msg hook 攔截錯誤

---

## 📝 交付物

- [x] `docker-compose.yml`
- [x] `scripts/init-db.sql`
- [x] `scripts/setup-dev.sh`
- [x] `scripts/teardown-dev.sh`
- [ ] `scripts/validate-env.ts`
- [ ] `.vscode/settings.json`
- [ ] `.vscode/extensions.json`
- [ ] `.husky/pre-commit`
- [ ] `.husky/commit-msg`
- [ ] `.lintstagedrc.json`
- [ ] `.commitlintrc.json`
- [ ] 更新後的 `README.md`
- [ ] `docs/TROUBLESHOOTING.md`

---

## 🚨 注意事項

1. **端口衝突**: 確保 5678（PostgreSQL）和 6379（Redis）端口未被佔用（注意：WSL2 環境下 Hyper-V 會保留 port 5432，因此改用 5678）
2. **Docker 資源**: PostgreSQL + Redis 大約需要 500MB RAM
3. **檔案權限**: Linux/macOS 需要執行權限（chmod +x）
4. **Windows 相容性**: 提供 PowerShell 版本腳本
5. **環境變數**: 不要提交真實的 `.env` 檔案到 Git

---

## 🔗 相關文件

- [CLAUDE.md](../../CLAUDE.md) - 開發規範
- [PRD.md](../PRD.md) - 產品需求
- [系統架構設計](../plans/2026-01-24-system-architecture-design.md)

---

## 📊 進度追蹤

| 子任務 | 狀態 | 負責人 | 完成日期 |
|--------|------|--------|---------|
| 1.1 Docker Compose | ✅ 完成 | Claude | 2026-01-27 |
| 1.2 開發工具腳本 | ✅ 完成（Windows 腳本暫緩） | Gemini + Claude | 2026-01-27 |
| 1.3 環境變數驗證 | ⏳ 未開始 | - | - |
| 1.4 VSCode 設定 | ⏳ 未開始 | - | - |
| 1.5 Git Hooks | ⏳ 未開始 | - | - |
| 1.6 文檔更新 | ⏳ 未開始 | - | - |

---

**下一個任務**: [02 - 共用套件開發](./02-shared-packages.md)
