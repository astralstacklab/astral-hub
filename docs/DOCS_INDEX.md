# Card ERP 文件索引

> **版本**: 1.0.0
> **最後更新**: 2026-01-25
> **維護者**: Card ERP 開發團隊

本文件提供 Card ERP 專案的完整文件導航與參考指引，確保開發過程中能快速找到正確的文件，並在方案調整時同步更新相關文檔。

---

## 📚 文件分類總覽

```
docs/
├── 📋 產品規劃 (Product Planning)
│   ├── PRD.md                           # 產品需求文檔
│   └── TASKS.md                         # 任務總綱（分階段）
│
├── 🎨 設計系統 (Design System)
│   ├── design-system/
│   │   ├── BRAND_GUIDELINES.md          # 品牌設計指南
│   │   ├── ADMIN_WEB_STYLE_GUIDE.md     # Admin Web 風格指南（Fintech/Crypto）
│   │   ├── BUYER_WEB_STYLE_GUIDE.md     # Buyer Web 風格指南（DeFi Cyberpunk）
│   │   ├── POS_WEB_STYLE_GUIDE.md       # POS Web 風格指南（功能型）
│   │   ├── TAILWIND_USAGE.md            # Tailwind 使用指南
│   │   └── tailwind-preset.js           # 共用 Tailwind preset
│
├── 🏗️ 架構設計 (Architecture)
│   └── plans/
│       └── 2026-01-24-system-architecture-design.md  # 系統架構設計
│
├── 🗺️ 產品路線圖 (Roadmap)
│   └── roadmap/
│       ├── README.md                    # 路線圖總覽（三階段）
│       ├── PHASE-2-3-OVERVIEW.md        # Phase 2/3 功能概覽
│       └── TECHNICAL-EVOLUTION.md       # 技術演進路線圖
│
├── ✅ 實作任務 (Implementation Tasks)
│   └── tasks/
│       └── phase-1-mvp/                 # Phase 1 MVP 任務（22個）
│           ├── 01-environment-setup.md
│           ├── 02-shared-packages.md
│           ├── ... (03-21)
│           └── 22-deployment.md
│
├── 🔧 開發指南 (Development Guide)
│   ├── MULTI_AGENT_PROTOCOL.md          # Multi-Agent 協作協定
│   ├── executor-rules.md               # Executor Agent Rules（Antigravity 設定參考）
│   ├── SKILLS_GUIDE.md                  # Skills 使用指南
│   ├── SKILLS_LOCATION.md               # Skills 位置說明
│   └── DOCS_INDEX.md                    # 本文件 - 文件索引
│
└── 📖 其他
    └── (待建立 API 文檔、測試文檔等)
```

---

## 🎯 執行方針：依任務參考文件

### **原則**：執行 A 任務 → 參考 A 文件 → 更新 A 文件

開發過程中應遵循以下參考順序，確保實作與文件保持一致：

---

### 1️⃣ 產品功能開發

#### 📌 執行任務
新增功能、修改業務邏輯、調整產品方向

#### 📖 必讀文件（優先順序）
1. **`docs/PRD.md`** - 確認需求是否在產品範圍內
2. **`docs/tasks/phase-1-mvp/XX-<topic>.md`** - 確認具體實作步驟
3. **`docs/plans/2026-01-24-system-architecture-design.md`** - 確認架構設計

#### 🔄 需更新文件
- ✅ **當需求變更時** → 更新 `docs/PRD.md`
- ✅ **當實作步驟調整時** → 更新對應的 Task 文件
- ✅ **當架構變更時** → 更新 Architecture 文件

**範例**：
```
任務：新增「商品評論系統」
1. 檢查 PRD.md → 確認評論系統是否在 Phase 2 規劃中
2. 若不在 PRD 中 → 先更新 PRD.md 與 roadmap/PHASE-2-3-OVERVIEW.md
3. 建立新的 Task 文件或更新現有文件
4. 實作完成後 → 在 Task 文件中記錄實際做法
```

---

### 2️⃣ UI/UX 設計與實作

#### 📌 執行任務
建立前端頁面、開發 UI 元件、調整視覺風格

#### 📖 必讀文件（優先順序）
1. **`docs/design-system/BRAND_GUIDELINES.md`** - 確認統一的品牌原則
2. **應用程式專用風格指南**:
   - **Admin Web** → `ADMIN_WEB_STYLE_GUIDE.md`（Fintech/Crypto 深色模式）
   - **Buyer Web** → `BUYER_WEB_STYLE_GUIDE.md`（DeFi Cyberpunk 霓虹風格）
   - **POS Web** → `POS_WEB_STYLE_GUIDE.md`（簡潔功能型）
3. **`docs/design-system/TAILWIND_USAGE.md`** - 確認 Tailwind 使用方式

#### 🔄 需更新文件
- ✅ **當新增顏色或字體時** → 更新對應的 Style Guide
- ✅ **當修改 Tailwind preset 時** → 更新 `tailwind-preset.js` 與 `TAILWIND_USAGE.md`
- ✅ **當品牌原則變更時** → 更新 `BRAND_GUIDELINES.md`

**範例**：
```
任務：實作 Admin 商品列表頁面
1. 閱讀 ADMIN_WEB_STYLE_GUIDE.md → 了解 Glassmorphism 卡片設計
2. 使用 tailwind-preset.js 提供的共用 utilities
3. 參考 TAILWIND_USAGE.md 中的 Admin Web 配置範例
4. 若需新增顏色 → 更新 ADMIN_WEB_STYLE_GUIDE.md 的色彩系統
```

---

### 3️⃣ 系統架構調整

#### 📌 執行任務
修改部署架構、調整資料庫設計、變更技術棧

#### 📖 必讀文件（優先順序）
1. **`docs/plans/2026-01-24-system-architecture-design.md`** - 確認當前架構設計
2. **`docs/roadmap/TECHNICAL-EVOLUTION.md`** - 確認技術演進路線
3. **`CLAUDE.md`** - 確認專案技術棧與開發規範

#### 🔄 需更新文件
- ✅ **當架構變更時** → 更新 `docs/plans/2026-01-24-system-architecture-design.md`
- ✅ **當技術棧變更時** → 更新 `CLAUDE.md` 與 `TECHNICAL-EVOLUTION.md`
- ✅ **當資料庫 Schema 變更時** → 更新 Architecture 文件與對應的 Task 文件

**範例**：
```
任務：將四個服務合併為單一 Cloud Run
1. 閱讀 2026-01-24-system-architecture-design.md → 確認目前是四服務架構
2. 評估是否符合 TECHNICAL-EVOLUTION.md 的演進方向
3. 決策後 → 更新 Architecture 文件、TECHNICAL-EVOLUTION.md
4. 更新所有受影響的 Task 文件（如 22-deployment.md）
```

---

### 4️⃣ 實作 Phase 1 MVP 任務

#### 📌 執行任務
按照 Task 01-22 逐步實作系統功能

#### 📖 必讀文件（優先順序）
1. **`docs/tasks/phase-1-mvp/XX-<topic>.md`** - 當前任務的詳細說明
2. **`docs/PRD.md`** - 確認業務需求
3. **`docs/plans/2026-01-24-system-architecture-design.md`** - 確認架構設計
4. **`docs/design-system/<app>_STYLE_GUIDE.md`** - 確認 UI 風格（前端任務）

#### 🔄 需更新文件
- ✅ **當任務實作與文件不符時** → 更新對應的 Task 文件
- ✅ **當發現架構問題時** → 更新 Architecture 文件
- ✅ **當需求理解有誤時** → 更新 PRD.md

**範例**：
```
任務：執行 Task 05 - API Products 模組
1. 閱讀 docs/tasks/phase-1-mvp/05-api-products.md
2. 參考 PRD.md 確認商品類型與狀態定義
3. 參考 Architecture 文件確認資料庫設計
4. 實作過程中發現需新增欄位 → 更新 05-api-products.md 與 Architecture 文件
```

---

### 5️⃣ 規劃 Phase 2/3 功能

#### 📌 執行任務
規劃未來功能、調整產品路線圖、評估技術演進

#### 📖 必讀文件（優先順序）
1. **`docs/roadmap/README.md`** - 確認三階段總體規劃
2. **`docs/roadmap/PHASE-2-3-OVERVIEW.md`** - 確認 Phase 2/3 功能清單
3. **`docs/roadmap/TECHNICAL-EVOLUTION.md`** - 確認技術演進方向
4. **`docs/PRD.md`** - 確認產品願景

#### 🔄 需更新文件
- ✅ **當新增/刪除功能時** → 更新 `PHASE-2-3-OVERVIEW.md`
- ✅ **當調整技術棧時** → 更新 `TECHNICAL-EVOLUTION.md`
- ✅ **當路線圖變更時** → 更新 `roadmap/README.md`
- ✅ **當產品方向變更時** → 更新 `PRD.md`

**範例**：
```
任務：評估是否提前實作「賣家平台」（原為 Phase 3）
1. 閱讀 roadmap/README.md → 確認當前規劃為 Phase 3
2. 閱讀 PHASE-2-3-OVERVIEW.md → 確認賣家平台的詳細功能
3. 決策提前實作 → 更新 README.md 將賣家平台移至 Phase 2
4. 更新 PHASE-2-3-OVERVIEW.md 調整時程與優先級
```

---

### 6️⃣ 使用 Claude Code Skills

#### 📌 執行任務
使用專案安裝的 Skills 進行開發

#### 📖 必讀文件（優先順序）
1. **`docs/SKILLS_GUIDE.md`** - 確認可用的 Skills 與使用時機
2. **`docs/SKILLS_LOCATION.md`** - 了解 Skills 的安裝位置

#### 🔄 需更新文件
- ✅ **當安裝新 Skill 時** → 更新 `SKILLS_GUIDE.md`
- ✅ **當移除 Skill 時** → 更新 `SKILLS_GUIDE.md`
- ✅ **當 Skill 用法變更時** → 更新 `SKILLS_GUIDE.md`

**範例**：
```
任務：使用 TDD Skill 開發「競標出價」功能
1. 閱讀 SKILLS_GUIDE.md → 確認 test-driven-development 的使用時機
2. 使用 Skill tool 執行 superpowers:test-driven-development
3. 若發現 Skill 使用經驗值得記錄 → 更新 SKILLS_GUIDE.md 的最佳實踐章節
```

---

## 🔄 文件更新規則

### **同步更新原則**

| 變更類型 | 需更新的文件 |
|---------|-------------|
| **產品需求變更** | `PRD.md` → `roadmap/README.md` → 受影響的 Task 文件 |
| **架構調整** | `plans/2026-01-24-system-architecture-design.md` → 受影響的 Task 文件 → `CLAUDE.md`（如技術棧變更） |
| **UI 風格變更** | 對應的 Style Guide → `BRAND_GUIDELINES.md`（如影響統一原則） → `TAILWIND_USAGE.md`（如影響配置） |
| **路線圖調整** | `roadmap/README.md` → `PHASE-2-3-OVERVIEW.md` → `PRD.md`（如影響產品願景） |
| **技術演進** | `TECHNICAL-EVOLUTION.md` → `CLAUDE.md` → 受影響的 Task 文件 |

### **文件一致性檢查清單**

在完成重大變更後，應檢查以下文件是否保持一致：

- [ ] `PRD.md` 與 `roadmap/README.md` 的產品願景一致
- [ ] `TASKS.md` 與 `roadmap/README.md` 的階段劃分一致
- [ ] `plans/2026-01-24-system-architecture-design.md` 與 Phase 1 Task 文件的架構一致
- [ ] 三個 Style Guide 與 `BRAND_GUIDELINES.md` 的統一原則一致
- [ ] `TECHNICAL-EVOLUTION.md` 與 `CLAUDE.md` 的技術棧一致

---

## 📝 文件分類詳解

### 1. 產品規劃文件

| 文件 | 用途 | 更新時機 |
|------|------|---------|
| **PRD.md** | 產品需求文檔，定義系統目標、功能範圍、用戶故事 | 當產品需求變更、新增功能時 |
| **TASKS.md** | 任務總綱，列出各階段的任務方向與目標 | 當階段目標調整、任務優先級變更時 |

**關鍵內容**：
- 產品願景與目標用戶
- 核心功能與業務流程
- 功能優先級

**使用場景**：
- ✅ 開始新功能開發前
- ✅ 評估功能是否在範圍內
- ✅ 與 Stakeholder 討論需求時

---

### 2. 設計系統文件

| 文件 | 用途 | 更新時機 |
|------|------|---------|
| **BRAND_GUIDELINES.md** | 品牌級統一原則（字體、間距、動畫、無障礙） | 當品牌原則變更時 |
| **ADMIN_WEB_STYLE_GUIDE.md** | Admin Web 完整風格指南（Fintech/Crypto 深色模式） | 當 Admin UI 風格調整時 |
| **BUYER_WEB_STYLE_GUIDE.md** | Buyer Web 完整風格指南（DeFi Cyberpunk 霓虹風格） | 當 Buyer UI 風格調整時 |
| **POS_WEB_STYLE_GUIDE.md** | POS Web 完整風格指南（簡潔功能型） | 當 POS UI 風格調整時 |
| **TAILWIND_USAGE.md** | Tailwind 配置與使用指南 | 當 Tailwind preset 或配置變更時 |
| **tailwind-preset.js** | 共用 Tailwind preset（可執行代碼） | 當共用樣式變更時 |

**關鍵內容**：
- 色彩系統、字體系統、間距系統
- 完整的 Tailwind 配置
- 組件設計範例與程式碼
- Do's and Don'ts

**使用場景**：
- ✅ 建立新的前端頁面或組件
- ✅ 調整 UI 風格時
- ✅ 設定 Tailwind 配置時

---

### 3. 架構設計文件

| 文件 | 用途 | 更新時機 |
|------|------|---------|
| **plans/2026-01-24-system-architecture-design.md** | 系統架構設計，包含資料庫設計、API 設計、部署架構 | 當架構變更、資料庫 Schema 調整、部署方案變更時 |

**關鍵內容**：
- 技術棧選型與理由
- 資料庫 Schema 設計
- API 設計規範
- 部署架構圖
- 安全性與效能考量

**使用場景**：
- ✅ 開始實作前了解整體架構
- ✅ 調整技術方案時
- ✅ 新增資料表或 API 時

---

### 4. 產品路線圖文件

| 文件 | 用途 | 更新時機 |
|------|------|---------|
| **roadmap/README.md** | 三階段路線圖總覽（MVP → 會員社交 → 規模化） | 當產品方向、時程、階段劃分調整時 |
| **roadmap/PHASE-2-3-OVERVIEW.md** | Phase 2/3 輕量級功能清單 | 當 Phase 2/3 功能調整時 |
| **roadmap/TECHNICAL-EVOLUTION.md** | 技術架構演進路線圖 | 當技術棧、架構演進方向調整時 |

**關鍵內容**：
- 三階段產品演進規劃
- 每階段的核心功能與時程
- 技術棧演進方向
- KPI 與成本估算

**使用場景**：
- ✅ 了解產品整體方向
- ✅ 規劃下一階段功能時
- ✅ 評估技術演進時機時

---

### 5. 實作任務文件

| 文件 | 用途 | 更新時機 |
|------|------|---------|
| **tasks/phase-1-mvp/01-22.md** | Phase 1 MVP 詳細實作任務（22個） | 當任務實作步驟調整、技術方案變更時 |

**關鍵內容**：
- 詳細的實作步驟
- 技術規格與設計
- 驗收標準
- 預計工時

**使用場景**：
- ✅ 執行具體開發任務時
- ✅ 了解任務詳細步驟時
- ✅ 評估任務工作量時

**任務清單**：
1. 環境建置（01-02）
2. 後端 API（03-09）
3. 前端應用（10-18）
4. 第三方整合（19-20）
5. 測試與部署（21-22）

---

### 6. 開發指南文件

| 文件 | 用途 | 更新時機 |
|------|------|---------|
| **SKILLS_GUIDE.md** | Skills 使用指南，列出安裝的 Skills 與使用時機 | 當安裝/移除 Skill、使用經驗更新時 |
| **SKILLS_LOCATION.md** | Skills 位置說明 | 當 Skills 安裝方式變更時 |
| **DOCS_INDEX.md** | 本文件 - 文件索引與參考指引 | 當新增/移除文件、文件結構調整時 |

**關鍵內容**：
- 可用的 Skills 列表
- 各 Skill 的使用時機與範例
- Skills 安裝位置與管理方式

**使用場景**：
- ✅ 開始開發任務前，選擇適合的 Skill
- ✅ 了解 Skills 位置與管理方式

---

## 🔗 文件間關聯圖

```
                       ┌──────────────┐
                       │   PRD.md     │◄────── 產品願景與需求
                       └──────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐  ┌────────────────┐  ┌──────────────┐
    │  TASKS.md   │  │ roadmap/       │  │ Architecture │
    │  (任務總綱)  │  │ README.md      │  │ Design       │
    └──────┬──────┘  └────────┬───────┘  └──────┬───────┘
           │                  │                  │
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐  ┌────────────────┐  ┌──────────────┐
    │ Task 01-22  │  │ PHASE-2-3      │  │ Task 01-22   │
    │ (詳細任務)   │  │ OVERVIEW       │  │ (技術規格)    │
    └──────┬──────┘  └────────┬───────┘  └──────┬───────┘
           │                  │                  │
           │                  ▼                  │
           │         ┌────────────────┐         │
           │         │ TECHNICAL-     │         │
           │         │ EVOLUTION      │         │
           │         └────────────────┘         │
           │                                     │
           └──────────────┬──────────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │ Design System   │◄────── UI/UX 實作參考
                │ (Style Guides)  │
                └─────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │ Tailwind        │
                │ Config          │
                └─────────────────┘
```

---

## 🎯 快速查找指南

### **我想了解...**

| 需求 | 查看文件 |
|------|---------|
| 產品整體目標與功能範圍 | `PRD.md` |
| 三階段產品演進規劃 | `roadmap/README.md` |
| Phase 1 有哪些任務 | `TASKS.md` 或 `roadmap/README.md` |
| 某個任務的詳細步驟 | `tasks/phase-1-mvp/XX-<topic>.md` |
| 系統架構與技術棧 | `plans/2026-01-24-system-architecture-design.md` 或 `CLAUDE.md` |
| 資料庫設計 | `plans/2026-01-24-system-architecture-design.md` |
| Admin Web 的 UI 風格 | `design-system/ADMIN_WEB_STYLE_GUIDE.md` |
| Buyer Web 的 UI 風格 | `design-system/BUYER_WEB_STYLE_GUIDE.md` |
| POS Web 的 UI 風格 | `design-system/POS_WEB_STYLE_GUIDE.md` |
| Tailwind 如何配置 | `design-system/TAILWIND_USAGE.md` |
| 品牌統一原則 | `design-system/BRAND_GUIDELINES.md` |
| Phase 2/3 有哪些功能 | `roadmap/PHASE-2-3-OVERVIEW.md` |
| 技術演進方向 | `roadmap/TECHNICAL-EVOLUTION.md` |
| 可用的 Skills | `SKILLS_GUIDE.md` |
| Skills 安裝位置 | `SKILLS_LOCATION.md` |
| 專案開發規範 | `CLAUDE.md` |
| Multi-Agent 協作流程與產物模板 | `MULTI_AGENT_PROTOCOL.md` |

---

## ⚠️ 重要提醒

### 🚨 文件更新的強制要求

**當以下情況發生時，必須同步更新相關文件**：

1. ✅ **產品需求變更** → 必須更新 `PRD.md`
2. ✅ **架構調整** → 必須更新 `Architecture Design`
3. ✅ **UI 風格變更** → 必須更新對應的 `Style Guide`
4. ✅ **路線圖調整** → 必須更新 `roadmap/README.md`
5. ✅ **任務步驟變更** → 必須更新對應的 `Task 文件`

### 📋 文件審查 Checklist

在完成重大變更或提交 Pull Request 前，應檢查：

- [ ] 是否更新了所有受影響的文件？
- [ ] 文件之間是否保持一致？
- [ ] 是否更新了文件的「最後更新」日期？
- [ ] 是否在 Commit Message 中說明文件變更？

---

## 📞 維護與支援

### 文件問題回報

如果發現文件有以下問題，請回報：
- ❌ 文件之間內容不一致
- ❌ 文件缺失或過時
- ❌ 文件索引錯誤

### 文件改進建議

歡迎提出文件改進建議：
- 💡 新增文件分類
- 💡 改善文件結構
- 💡 補充使用範例

---

**文件版本**: 1.0.0
**最後更新**: 2026-01-25
**下次 Review**: Phase 1 完成時

---

**讓文件成為開發的最佳夥伴！** 📚✨
