# POS Web Style Guide
## Simple & Functional Design

**版本**: 1.0.0
**最後更新**: 2026-01-25
**風格定位**: 實用、高效、易操作

---

## 🎯 設計理念

### 視覺關鍵字

```
Simple    Clear    Fast
 Touch    Large   Efficient
   Clean   Bold   Practical
```

### 核心目標

1. **快速操作** - 最少點擊完成交易
2. **觸控優化** - 大按鈕、充足間距
3. **清晰易讀** - 高對比、大字體
4. **錯誤預防** - 明確的視覺回饋
5. **即時反應** - 操作立即看到結果

### 使用場景

- 📍 **環境**: 實體店面收銀台
- 👥 **用戶**: 店員（可能快速輪替）
- 🖥️ **設備**: 平板 (iPad / Android Tablet)
- ⚡ **需求**: 快速結帳、不能出錯

---

## 🎨 色彩系統

### 主色調 - Emerald Green

```css
:root {
  /* Primary - 翠綠（代表確認、成功、行動） */
  --primary-400: #34D399;
  --primary-500: #10B981;   /* 主要使用 */
  --primary-600: #059669;
  --primary-700: #047857;

  /* Primary States */
  --primary-hover: #0D9668;
  --primary-active: #047857;
  --primary-disabled: #6EE7B7;
}
```

### 功能色彩

```css
:root {
  /* Confirm - 翠綠（確認操作） */
  --confirm: #10B981;
  --confirm-bg: #D1FAE5;
  --confirm-text: #065F46;

  /* Cancel - 紅色（取消操作） */
  --cancel: #EF4444;
  --cancel-bg: #FEE2E2;
  --cancel-text: #991B1B;

  /* Warning - 琥珀（警告提示） */
  --warning: #F59E0B;
  --warning-bg: #FEF3C7;
  --warning-text: #92400E;

  /* Info - 藍色（資訊提示） */
  --info: #3B82F6;
  --info-bg: #DBEAFE;
  --info-text: #1E40AF;
}
```

### 背景與表面

```css
:root {
  /* Background - 純白為主 */
  --bg-base: #FFFFFF;
  --bg-gray: #F9FAFB;       /* Gray 50 */
  --bg-light-gray: #F3F4F6; /* Gray 100 */

  /* Surface */
  --surface-white: #FFFFFF;
  --surface-light: #F9FAFB;
  --surface-border: #E5E7EB;  /* Gray 200 */
}
```

### 文字色彩

```css
:root {
  --text-primary: #111827;    /* Gray 900 - 主要文字 */
  --text-secondary: #4B5563;  /* Gray 600 - 次要文字 */
  --text-tertiary: #6B7280;   /* Gray 500 - 輔助文字 */
  --text-disabled: #9CA3AF;   /* Gray 400 - 禁用文字 */
}
```

---

## 🔤 字體系統

### 字體堆疊

```css
:root {
  /* 優先系統字體（速度最快） */
  --font-sans: 'Inter', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* 等寬字體（價格、數字） */
  --font-mono: 'SF Mono', 'Roboto Mono', 'Consolas', monospace;
}
```

### 字體大小 - 加大設計

```css
:root {
  /* Touch-Optimized Sizes */
  --text-sm: 1rem;        /* 16px - 最小文字 */
  --text-base: 1.125rem;  /* 18px - 基準 */
  --text-lg: 1.25rem;     /* 20px - 標籤 */
  --text-xl: 1.5rem;      /* 24px - 按鈕 */
  --text-2xl: 2rem;       /* 32px - 小標題 */
  --text-3xl: 2.5rem;     /* 40px - 標題 */
  --text-4xl: 3rem;       /* 48px - 數字 */
  --text-5xl: 4rem;       /* 64px - 總價 */
}
```

### 字重

```css
:root {
  --font-normal: 400;
  --font-medium: 500;     /* 標準使用 */
  --font-semibold: 600;   /* 按鈕文字 */
  --font-bold: 700;       /* 重要數字 */
  --font-black: 900;      /* 總金額 */
}
```

---

## 🎯 觸控設計規範

### 最小觸控目標

```css
:root {
  /* WCAG 2.1 AAA 級標準：44x44px */
  --touch-target-min: 44px;

  /* 建議尺寸：更寬容的觸控 */
  --touch-target-comfortable: 56px;
  --touch-target-large: 72px;
}
```

### 按鈕尺寸

```css
.btn-sm {
  min-height: 44px;
  min-width: 88px;
  padding: 0.75rem 1.5rem;
  font-size: var(--text-lg);
}

.btn-md {
  min-height: 56px;
  min-width: 120px;
  padding: 1rem 2rem;
  font-size: var(--text-xl);
}

.btn-lg {
  min-height: 72px;
  min-width: 160px;
  padding: 1.25rem 2.5rem;
  font-size: var(--text-2xl);
}
```

### 間距規範

```css
:root {
  /* Spacing - 16px 基準 */
  --space-2: 8px;     /* 最小間距 */
  --space-3: 12px;
  --space-4: 16px;    /* 基準 */
  --space-6: 24px;    /* 舒適間距 */
  --space-8: 32px;    /* 寬鬆間距 */
  --space-12: 48px;   /* 區塊間距 */
}
```

---

## 🎨 組件設計

### 1. 主要按鈕

```html
<button class="btn btn-primary">
  確認結帳
</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: var(--touch-target-comfortable);
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary {
  background: var(--primary-500);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-primary:active {
  background: var(--primary-active);
  transform: scale(0.98);
}

.btn-primary:disabled {
  background: var(--primary-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}
```

### 2. 次要按鈕

```css
.btn-secondary {
  background: var(--bg-gray);
  color: var(--text-primary);
  border: 2px solid var(--surface-border);
}

.btn-secondary:hover {
  background: var(--bg-light-gray);
  border-color: var(--text-secondary);
}

.btn-secondary:active {
  transform: scale(0.98);
}
```

### 3. 危險按鈕

```css
.btn-danger {
  background: var(--cancel);
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: #DC2626;
}

.btn-danger:active {
  background: #B91C1C;
  transform: scale(0.98);
}
```

---

### 4. 數字鍵盤

```html
<div class="numpad">
  <button class="numpad-key" data-value="1">1</button>
  <button class="numpad-key" data-value="2">2</button>
  <button class="numpad-key" data-value="3">3</button>
  <button class="numpad-key" data-value="4">4</button>
  <button class="numpad-key" data-value="5">5</button>
  <button class="numpad-key" data-value="6">6</button>
  <button class="numpad-key" data-value="7">7</button>
  <button class="numpad-key" data-value="8">8</button>
  <button class="numpad-key" data-value="9">9</button>
  <button class="numpad-key numpad-clear" data-value="clear">C</button>
  <button class="numpad-key" data-value="0">0</button>
  <button class="numpad-key numpad-backspace" data-value="backspace">⌫</button>
</div>
```

```css
.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  max-width: 400px;
}

.numpad-key {
  aspect-ratio: 1;
  min-height: 72px;
  background: white;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  font-size: 2rem;
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.numpad-key:hover {
  background: var(--bg-gray);
  border-color: var(--text-secondary);
}

.numpad-key:active {
  transform: scale(0.95);
  background: var(--bg-light-gray);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.numpad-clear {
  background: var(--warning-bg);
  color: var(--warning-text);
  border-color: var(--warning);
}

.numpad-backspace {
  background: var(--bg-gray);
  color: var(--text-secondary);
}
```

---

### 5. 商品卡片（簡化版）

```html
<div class="product-item">
  <img src="/card-thumb.jpg" alt="Product" class="product-thumb" />
  <div class="product-info">
    <h4 class="product-name">Pikachu VMAX</h4>
    <p class="product-sku">SKU: PKM-001</p>
  </div>
  <div class="product-price">NT$ 1,200</div>
  <button class="btn-remove" aria-label="移除">×</button>
</div>
```

```css
.product-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  min-height: 88px;
  transition: all 0.2s ease;
}

.product-item:active {
  background: var(--bg-gray);
}

.product-thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-sku {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.product-price {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  flex-shrink: 0;
}

.btn-remove {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: var(--cancel-bg);
  color: var(--cancel-text);
  border: 2px solid var(--cancel);
  border-radius: 50%;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-remove:active {
  transform: scale(0.9);
  background: var(--cancel);
  color: white;
}
```

---

### 6. 總價顯示

```html
<div class="total-display">
  <span class="total-label">總計</span>
  <span class="total-amount">NT$ 3,600</span>
</div>
```

```css
.total-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
  border: 3px solid var(--primary-500);
  border-radius: 16px;
  min-height: 160px;
}

.total-label {
  font-size: var(--text-2xl);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.total-amount {
  font-family: var(--font-mono);
  font-size: var(--text-5xl);
  font-weight: var(--font-black);
  color: var(--primary-700);
  line-height: 1;
}
```

---

### 7. QR Code 掃描區

```html
<div class="scan-area">
  <div class="scan-icon">
    <svg width="80" height="80" viewBox="0 0 24 24">
      <!-- QR icon -->
    </svg>
  </div>
  <p class="scan-text">對準 QR Code 掃描</p>
  <div class="scan-border">
    <div class="scan-line"></div>
  </div>
</div>
```

```css
.scan-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
  background: var(--bg-gray);
  border: 2px dashed var(--surface-border);
  border-radius: 16px;
}

.scan-icon {
  width: 80px;
  height: 80px;
  color: var(--text-tertiary);
  margin-bottom: 1rem;
}

.scan-text {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin: 0;
}

.scan-border {
  position: absolute;
  inset: 1rem;
  border: 3px solid var(--primary-500);
  border-radius: 12px;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--primary-500);
  box-shadow: 0 0 10px var(--primary-500);
  animation: scan 2s ease-in-out infinite;
}

@keyframes scan {
  0% {
    top: 0;
  }
  50% {
    top: calc(100% - 3px);
  }
  100% {
    top: 0;
  }
}
```

---

### 8. Toast 通知

```html
<div class="toast toast-success">
  <svg class="toast-icon">✓</svg>
  <span class="toast-message">結帳成功！</span>
</div>
```

```css
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slide-in 0.3s ease-out;
  z-index: 1000;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  background: var(--confirm-bg);
  color: var(--confirm-text);
  border: 2px solid var(--confirm);
}

.toast-error {
  background: var(--cancel-bg);
  color: var(--cancel-text);
  border: 2px solid var(--cancel);
}

.toast-warning {
  background: var(--warning-bg);
  color: var(--warning-text);
  border: 2px solid var(--warning);
}

.toast-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}
```

---

## 📐 佈局系統

### 主佈局 - 雙欄設計

```html
<div class="pos-layout">
  <!-- Left Panel - Product List -->
  <aside class="products-panel">
    <div class="panel-header">
      <h2>商品清單</h2>
      <button class="btn btn-secondary btn-sm">掃描</button>
    </div>
    <div class="panel-body">
      <!-- Product items -->
    </div>
  </aside>

  <!-- Right Panel - Checkout -->
  <main class="checkout-panel">
    <div class="panel-header">
      <h2>結帳</h2>
    </div>
    <div class="panel-body">
      <!-- Checkout content -->
      <div class="total-display">...</div>
      <div class="numpad">...</div>
      <div class="action-buttons">
        <button class="btn btn-lg btn-primary">完成結帳</button>
        <button class="btn btn-lg btn-secondary">取消</button>
      </div>
    </div>
  </main>
</div>
```

```css
.pos-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  height: 100vh;
  padding: 2rem;
  background: var(--bg-gray);
}

.products-panel,
.checkout-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: var(--bg-gray);
  border-bottom: 2px solid var(--surface-border);
}

.panel-header h2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.panel-body {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.action-buttons > * {
  flex: 1;
}
```

---

## 🎬 動畫與反饋

### 即時反饋原則

```css
/* 所有互動元素必須有即時反饋 */
button:active,
.interactive:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

/* 成功狀態動畫 */
@keyframes success-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.success-feedback {
  animation: success-pulse 0.6s ease-out;
}
```

### Loading 狀態

```css
.btn-loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.btn-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  margin: -12px 0 0 -12px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## 完整的 Tailwind 配置

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        'primary': {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },

        // Functional
        'confirm': '#10B981',
        'cancel': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',

        // Text
        'text': {
          primary: '#111827',
          secondary: '#4B5563',
          tertiary: '#6B7280',
          disabled: '#9CA3AF',
        },

        // Background
        'bg': {
          base: '#FFFFFF',
          gray: '#F9FAFB',
          'light-gray': '#F3F4F6',
        },
      },

      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Roboto Mono', 'Consolas', 'monospace'],
      },

      fontSize: {
        sm: ['1rem', { lineHeight: '1.5' }],
        base: ['1.125rem', { lineHeight: '1.5' }],
        lg: ['1.25rem', { lineHeight: '1.5' }],
        xl: ['1.5rem', { lineHeight: '1.4' }],
        '2xl': ['2rem', { lineHeight: '1.3' }],
        '3xl': ['2.5rem', { lineHeight: '1.2' }],
        '4xl': ['3rem', { lineHeight: '1.1' }],
        '5xl': ['4rem', { lineHeight: '1' }],
      },

      spacing: {
        'touch': '16px',
        'touch-min': '44px',
        'touch-comfortable': '56px',
        'touch-large': '72px',
      },

      minHeight: {
        'touch': '44px',
        'touch-comfortable': '56px',
        'touch-large': '72px',
      },

      minWidth: {
        'touch': '44px',
        'button-sm': '88px',
        'button-md': '120px',
        'button-lg': '160px',
      },

      borderRadius: {
        'DEFAULT': '12px',
        'lg': '16px',
        'xl': '20px',
      },

      boxShadow: {
        'sm': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'md': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'lg': '0 12px 32px rgba(0, 0, 0, 0.15)',
      },

      animation: {
        'scan': 'scan 2s ease-in-out infinite',
        'success-pulse': 'success-pulse 0.6s ease-out',
        'spin': 'spin 0.6s linear infinite',
        'slide-in': 'slide-in 0.3s ease-out',
      },

      keyframes: {
        scan: {
          '0%': { top: '0' },
          '50%': { top: 'calc(100% - 3px)' },
          '100%': { top: '0' },
        },
        'success-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
          '70%': { boxShadow: '0 0 0 20px rgba(16, 185, 129, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## ✅ Do's and Don'ts

### ✅ DO

- **大按鈕** - 最小 44x44px
- **高對比** - 確保清晰可讀
- **簡潔佈局** - 功能清晰分區
- **即時反饋** - 每次點擊都有視覺回應
- **錯誤預防** - 危險操作需確認
- **快速操作** - 最少點擊完成任務
- **系統字體** - 載入速度最快
- **白色背景** - 減少眼睛疲勞

### ❌ DON'T

- **避免小按鈕** - < 44px 容易誤觸
- **避免低對比** - 難以閱讀
- **避免複雜動畫** - 影響效能和速度
- **避免花俏效果** - 分散注意力
- **避免過多選項** - 造成困惑
- **避免深色主題** - 店面環境通常明亮
- **避免自訂字體** - 載入時間延遲

---

## 🔒 無障礙設計

### 鍵盤支援

```css
/* Focus 狀態清晰可見 */
*:focus-visible {
  outline: 3px solid var(--primary-500);
  outline-offset: 2px;
}

/* 跳過內容連結 */
.skip-to-content {
  position: absolute;
  top: -100px;
  left: 0;
  background: var(--primary-500);
  color: white;
  padding: 1rem 2rem;
  z-index: 9999;
}

.skip-to-content:focus {
  top: 0;
}
```

### ARIA 標籤

```html
<!-- 按鈕 -->
<button aria-label="移除商品">×</button>

<!-- 狀態 -->
<div role="status" aria-live="polite">
  已加入 3 件商品
</div>

<!-- Loading -->
<button aria-busy="true">
  <span class="sr-only">載入中...</span>
</button>
```

---

## 🎯 總結

POS Web 以 **Simple & Functional** 為核心，打造快速、清晰、易操作的收銀介面。

**核心特色**:
- 🟢 翠綠主色（#10B981）
- 📱 觸控優化（最小 44x44px）
- 📏 大字體（最小 16px）
- ⚡ 即時反饋（視覺回饋）
- 🎯 簡潔佈局（功能分區清晰）
- 🤝 無障礙設計（WCAG AA）

---

**相關文件**:
- [Brand Guidelines](./BRAND_GUIDELINES.md)
- [Admin Web Style Guide](./ADMIN_WEB_STYLE_GUIDE.md)
- [Buyer Web Style Guide](./BUYER_WEB_STYLE_GUIDE.md)

**最後更新**: 2026-01-25
