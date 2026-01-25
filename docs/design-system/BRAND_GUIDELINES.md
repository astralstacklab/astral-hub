# Card ERP Brand Guidelines

**版本**: 1.0.0
**最後更新**: 2026-01-25
**狀態**: ✅ 核心規範

---

## 🎯 品牌核心

### 品牌定位

**Card ERP** 是一個創新的 OMO 卡片交易平台，結合了：
- 🏪 **實體店面**的信任感與即時性
- 💻 **線上交易**的便利性與廣度
- ⚡ **競標機制**的刺激感與公平性

### 品牌個性

| 特質 | 表現方式 |
|------|---------|
| **專業可信** | 透過嚴謹的數據展示、安全提示、透明流程 |
| **科技前衛** | 運用現代 Web 技術、即時更新、流暢動畫 |
| **熱情活力** | 為收藏家營造興奮感、社群氛圍、探索樂趣 |
| **效率實用** | 店員操作快速簡單、流程優化、減少步驟 |

---

## 🎨 三大應用差異化策略

### 設計哲學：一個品牌，三種表情

雖然共享同一品牌，但三個應用服務完全不同的用戶場景，需要**差異化的視覺語言**：

```
Brand Core (共同基因)
├── Admin Web → Fintech/Crypto 專業風格
├── Buyer Web → DeFi Cyberpunk 炫酷風格
└── POS Web → 實用功能型風格
```

### 統一性 vs 差異性矩陣

| 元素 | 統一程度 | 說明 |
|------|---------|------|
| **品牌名稱** | ⬛⬛⬛⬛⬛ | 100% 統一 |
| **Logo 基本形** | ⬛⬛⬛⬛⬜ | 80% 統一，允許色彩變化 |
| **字體家族** | ⬛⬛⬛⬜⬜ | 60% 統一，共用中文字體 |
| **設計原則** | ⬛⬛⬛⬛⬜ | 80% 統一（圓角、間距邏輯） |
| **主題色彩** | ⬛⬜⬜⬜⬜ | 20% 統一，各應用獨立色系 |
| **組件風格** | ⬛⬛⬜⬜⬜ | 40% 統一，功能同但樣式異 |

---

## 🔤 字體系統

### 中文字體（統一）

**主字體**: [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)

**選擇理由**:
- ✅ Google Fonts 免費開源
- ✅ 優秀的螢幕顯示效果
- ✅ 支援繁體中文全字集
- ✅ 多字重支援（100-900）
- ✅ 現代感強，適合科技產品

**字重對照**:
```
Thin (100)       → 極少使用，裝飾性標題
Light (300)      → 次要資訊、說明文字
Regular (400)    → 主要內文
Medium (500)     → 強調、按鈕文字
Bold (700)       → 標題、重要訊息
Black (900)      → 超大標題、英雄區塊
```

---

### 英文/數字字體（差異化）

各應用使用不同英文字體以強化風格差異：

#### Admin Web - **"Geist Mono"**
```css
font-family: 'Geist Mono', 'SF Mono', 'Monaco', monospace;
```
- 等寬字體，適合數據展示
- 專業、精確、科技感
- 用於：價格、數據、代碼、ID

#### Buyer Web - **"Orbitron"**
```css
font-family: 'Orbitron', 'Exo 2', sans-serif;
```
- 未來感、幾何造型
- 高科技、電玩風格
- 用於：標題、強調、數字

#### POS Web - **"Inter"**
```css
font-family: 'Inter', -apple-system, system-ui, sans-serif;
```
- 清晰易讀
- 系統字體回退快速
- 用於：所有文字（優先易讀性）

---

### 字體載入策略

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Noto Sans TC (共用) -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap" rel="stylesheet">

<!-- Admin: Geist Mono -->
<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;700&display=swap" rel="stylesheet">

<!-- Buyer: Orbitron -->
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">

<!-- POS: Inter -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

**效能優化**:
- 使用 `font-display: swap` 避免 FOIT (Flash of Invisible Text)
- 只載入需要的字重
- Preconnect DNS 加速

---

## 🎨 色彩系統

### 品牌主色（共同基因）

雖然各應用有獨立配色，但共享**深藍色**作為品牌基因：

```css
--brand-navy: #0A1929;  /* 深海藍，代表信任、專業、深度 */
```

**使用場景**: Logo、Footer、法律聲明、品牌識別元素

---

### 各應用色彩策略

#### Admin Web - **科技藍紫 + 玻璃態**
```
主色調: 深灰藍 (#0F172A)
強調色: 電光藍 (#3B82F6)
輔助色: 紫羅蘭 (#8B5CF6)
背景: 漸層深色
```
→ 詳見 `ADMIN_WEB_STYLE_GUIDE.md`

#### Buyer Web - **霓虹 Cyberpunk**
```
主色調: 純黑 (#000000)
霓虹色: 青 (#00F0FF) / 洋紅 (#FF00FF) / 紫 (#A855F7)
能量色: 黃綠 (#84FF00)
背景: 深黑漸層
```
→ 詳見 `BUYER_WEB_STYLE_GUIDE.md`

#### POS Web - **簡潔綠 + 高對比**
```
主色調: 翠綠 (#10B981)
警示色: 紅 (#EF4444) / 黃 (#F59E0B)
背景: 純白 (#FFFFFF)
文字: 深灰 (#1F2937)
```
→ 詳見 `POS_WEB_STYLE_GUIDE.md`

---

## 📐 空間系統

### 間距比例（統一）

使用 **8px 基準系統**，確保視覺節奏一致：

```
4px  (0.5)  → 極小間距（圖標與文字）
8px  (1)    → 基準單位
12px (1.5)  → 緊湊間距
16px (2)    → 標準間距
24px (3)    → 舒適間距
32px (4)    → 區塊間距
48px (6)    → 大區塊間距
64px (8)    → 章節間距
96px (12)   → 頁面區域間距
```

### 圓角系統（統一）

```css
--radius-sm: 4px;    /* 小元素（標籤、徽章） */
--radius-md: 8px;    /* 標準（按鈕、輸入框） */
--radius-lg: 12px;   /* 卡片 */
--radius-xl: 16px;   /* 大卡片、模態框 */
--radius-2xl: 24px;  /* 特大元素 */
--radius-full: 9999px; /* 圓形（頭像、圖標） */
```

**例外**: POS Web 可使用較小圓角（4px-8px）以強調功能性

---

## 🎭 動畫與過渡

### 動畫時長（統一）

```css
--duration-fast: 150ms;     /* 微互動（hover、focus） */
--duration-normal: 250ms;   /* 標準過渡 */
--duration-slow: 400ms;     /* 複雜動畫（modal、drawer） */
--duration-slower: 600ms;   /* 頁面轉場 */
```

### 緩動函數（統一）

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);       /* 最常用 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);  /* 標準過渡 */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* 彈性效果 */
```

### 動畫原則

**Admin Web**:
- ✅ 細膩、平滑、專業
- ✅ Glassmorphism 淡入淡出
- ❌ 避免過度動畫

**Buyer Web**:
- ✅ 快速、爆發力、引人注目
- ✅ 霓虹光暈效果
- ✅ 滑動、彈跳、脈衝動畫

**POS Web**:
- ✅ 即時反饋、清晰明確
- ✅ 點擊縮放、確認動畫
- ❌ 最小化裝飾性動畫

---

## 🧩 組件命名規範

### 組件前綴（統一）

```
Card → 卡片容器
Button → 按鈕
Input → 輸入框
Modal → 模態框
Dropdown → 下拉選單
Table → 表格
Badge → 徽章
Alert → 警告提示
```

### Vue 組件命名（統一）

```
PascalCase for components:
✅ ProductCard.vue
✅ DataTable.vue
✅ PriceChart.vue

kebab-case for usage:
<product-card />
<data-table />
<price-chart />
```

---

## 🎯 無障礙設計原則（統一）

### WCAG 2.1 AA 級標準

**色彩對比度**:
- 正常文字: 至少 4.5:1
- 大文字 (18px+): 至少 3:1
- UI 組件: 至少 3:1

**鍵盤導航**:
- ✅ 所有互動元素可用 Tab 鍵訪問
- ✅ 清晰的 focus 狀態
- ✅ 支援 Enter/Space 觸發

**螢幕閱讀器**:
- ✅ 語義化 HTML (header, nav, main, article, aside, footer)
- ✅ ARIA 標籤 (aria-label, aria-describedby)
- ✅ alt 文字（圖片）

**特殊考量**:
- **Admin/Buyer**: 深色背景需特別注意對比度
- **POS**: 大觸控目標 (min 44x44px)

---

## 📱 響應式斷點（統一）

```css
/* Mobile First Approach */
--screen-sm: 640px;   /* 手機橫屏 */
--screen-md: 768px;   /* 平板直屏 */
--screen-lg: 1024px;  /* 平板橫屏、小筆電 */
--screen-xl: 1280px;  /* 桌面 */
--screen-2xl: 1536px; /* 大桌面 */
```

### 優先級

| 應用 | 優先設備 | 說明 |
|------|---------|------|
| **Admin Web** | 桌面 > 平板 | 管理員主要使用桌面 |
| **Buyer Web** | 手機 > 桌面 | 消費者隨時隨地瀏覽 |
| **POS Web** | 平板 | 店面收銀平板專用 |

---

## 🔒 設計原則（統一）

### 1. 漸進增強 (Progressive Enhancement)

基礎功能在所有設備都可用，視覺效果依設備能力增強：

```
基礎層 (所有瀏覽器)
├── 語義化 HTML
├── 可讀的內容
└── 基本 CSS 佈局

增強層 (現代瀏覽器)
├── 進階 CSS (Grid, Flexbox)
├── 動畫效果
├── Glassmorphism (Admin)
└── 霓虹特效 (Buyer)

極致層 (高效能設備)
├── 複雜動畫
├── Blur 效果
└── 粒子特效
```

### 2. 效能優先

- ✅ 首次內容繪製 (FCP) < 1.5s
- ✅ 最大內容繪製 (LCP) < 2.5s
- ✅ 累積佈局偏移 (CLS) < 0.1
- ✅ 首次輸入延遲 (FID) < 100ms

### 3. 內容優先

設計服務於內容，不是相反：
- ❌ 不為了酷炫犧牲可讀性
- ❌ 不為了動畫犧牲效能
- ✅ 視覺增強應支持而非干擾內容

### 4. 一致性與驚喜的平衡

- **85% 一致性**: 用戶知道在哪找功能
- **15% 驚喜**: 讓介面令人難忘

---

## 🎨 Logo 使用規範

### Logo 變體

```
Primary Logo (全彩)
├── Light Mode: 深色 Logo + 彩色強調
└── Dark Mode: 淺色 Logo + 彩色強調

Monochrome Logo (單色)
├── Black: 純黑 #000000
├── White: 純白 #FFFFFF
└── App-specific:
    ├── Admin: 電光藍 #3B82F6
    ├── Buyer: 霓虹青 #00F0FF
    └── POS: 翠綠 #10B981
```

### 最小尺寸

- 數位版本: 24px (高度)
- 印刷版本: 10mm (高度)

### 留白空間

Logo 周圍至少保留 **Logo 高度的 50%** 作為留白

```
┌─────────────────┐
│                 │ ← 0.5x
│   ┌─────────┐   │
│   │  LOGO   │   │ ← 1x (Logo 高度)
│   └─────────┘   │
│                 │ ← 0.5x
└─────────────────┘
```

### 禁止事項

❌ 改變 Logo 比例（拉伸或壓縮）
❌ 旋轉 Logo
❌ 添加陰影或特效（除非設計系統明確允許）
❌ 在低對比背景使用（對比度 < 4.5:1）
❌ 置於複雜圖片上（除非有適當背景遮罩）

---

## 📐 柵格系統（統一）

### 12 欄柵格

```
Desktop (1280px+):  12 columns, 24px gutter
Tablet (768px+):    8 columns, 16px gutter
Mobile (< 768px):   4 columns, 16px gutter
```

### 容器寬度

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### 內容區域

```
Max-width: 1280px (desktop)
Padding: 24px (desktop) / 16px (mobile)
```

---

## 🖼️ 圖片與媒體

### 圖片格式

| 用途 | 格式 | 說明 |
|------|------|------|
| 商品圖片 | WebP (fallback: JPEG) | 壓縮率高、質量好 |
| Logo/圖標 | SVG | 向量圖、無損縮放 |
| 裝飾性圖形 | SVG / PNG (透明) | 視複雜度決定 |
| 動畫 | Lottie JSON / CSS | 避免 GIF |

### 圖片優化

- ✅ 使用 `loading="lazy"` 延遲載入
- ✅ 提供多尺寸 (srcset)
- ✅ 壓縮品質: 85%
- ✅ 最大檔案大小: 500KB (商品圖)

### 長寬比

```
商品卡片圖: 1:1 (正方形)
橫幅圖片: 21:9 (超寬)
頭像: 1:1 (圓形)
縮圖: 4:3
```

---

## 🎯 品牌聲音與語調

### 文案原則

**專業但親切**:
- ✅ "您的訂單已確認" (正式但友善)
- ❌ "你的訂單確認了" (過於隨便)

**簡潔明確**:
- ✅ "付款成功"
- ❌ "您的付款已經成功完成處理"

**積極正向**:
- ✅ "查看更多精彩商品"
- ❌ "沒有更多商品了"

### 錯誤訊息

**建設性提示**:
```
❌ "錯誤：無效輸入"
✅ "請輸入有效的 Email 地址，例如：user@example.com"

❌ "操作失敗"
✅ "無法完成操作，請稍後再試或聯繫客服"
```

---

## 📊 設計交付物清單

### 每個應用需要提供

- [ ] Tailwind 配置檔案
- [ ] 色彩變數 CSS
- [ ] 組件庫（Storybook 或文檔）
- [ ] 範例頁面（首頁、列表、詳情）
- [ ] 響應式規範
- [ ] 無障礙檢查清單
- [ ] 效能基準測試結果

---

## 🔄 設計系統維護

### 版本控制

使用語義化版本 (Semantic Versioning):
```
1.0.0 → 首次發布
1.1.0 → 新增組件或功能
1.0.1 → 修復錯誤
2.0.0 → 破壞性變更
```

### 更新流程

1. 提出變更需求 (Issue)
2. 設計討論與原型
3. 文檔更新
4. 程式碼實作
5. Review 與測試
6. 發布與通知團隊

### 反饋機制

- 📧 設計系統郵件群組
- 💬 Slack #design-system 頻道
- 📝 每月設計回顧會議

---

## 📚 延伸閱讀

- [Admin Web 風格指南](./ADMIN_WEB_STYLE_GUIDE.md) - Fintech/Crypto Dark Mode
- [Buyer Web 風格指南](./BUYER_WEB_STYLE_GUIDE.md) - DeFi Cyberpunk Neon
- [POS Web 風格指南](./POS_WEB_STYLE_GUIDE.md) - Simple & Functional

---

**建立日期**: 2026-01-25
**維護團隊**: Card ERP Design Team
**聯絡方式**: design@card-erp.com
