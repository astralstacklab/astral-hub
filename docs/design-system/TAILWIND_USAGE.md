# Tailwind CSS 使用指南

本文件說明如何在 Card ERP 各應用程式中使用共用的 Tailwind CSS preset。

---

## 📁 設計系統文件結構

```
docs/design-system/
├── BRAND_GUIDELINES.md         # 品牌設計指南（統一原則）
├── ADMIN_WEB_STYLE_GUIDE.md    # Admin Web 風格指南（Fintech/Crypto）
├── BUYER_WEB_STYLE_GUIDE.md    # Buyer Web 風格指南（DeFi Cyberpunk）
├── POS_WEB_STYLE_GUIDE.md      # POS Web 風格指南（功能型）
├── tailwind-preset.js          # 共用 Tailwind preset（本檔案）
└── TAILWIND_USAGE.md           # 本文件 - Tailwind 使用說明
```

---

## 🎯 Preset 設計原則

### 共用 Preset 包含內容

**`tailwind-preset.js`** 提供所有應用程式的共同基礎：

- ✅ **字體系統**: Noto Sans TC（統一中文字體）
- ✅ **間距系統**: 8px baseline grid
- ✅ **陰影系統**: 統一的 box-shadow 層級
- ✅ **圓角系統**: 從 4px 到 32px 的標準圓角
- ✅ **動畫系統**:
  - 標準 transition durations (75ms - 1000ms)
  - Easing functions (smooth, bounce-in, ease-out-back)
  - 10+ 預定義動畫 (fade-in, slide-up, scale-in, pulse, etc.)
- ✅ **響應式斷點**: xs, sm, md, lg, xl, 2xl, 3xl + tablet/laptop/desktop
- ✅ **Z-Index 層級**: 標準化的堆疊順序 (dropdown, modal, tooltip, etc.)
- ✅ **無障礙工具**: 最小觸控目標尺寸 (44px/56px)
- ✅ **文字截斷**: `.line-clamp-1/2/3` utilities

### 各應用程式自行擴展

每個應用程式在其 `tailwind.config.js` 中 **extend** 此 preset，並加入：

- ❌ **顏色系統**: 各應用程式有獨立的色彩方案
- ❌ **英文字體**: Admin (Geist Mono) / Buyer (Orbitron) / POS (Inter)
- ❌ **特殊動畫**: 如 Buyer 的 neon-flicker, Admin 的 shimmer
- ❌ **背景圖案**: 如 Buyer 的 grid-pattern, Admin 的 glassmorphism
- ❌ **自訂 Utilities**: 各應用程式特有的 CSS class

---

## 📦 安裝與設定

### Step 1: 複製 Preset 到專案

將 `tailwind-preset.js` 複製到各應用程式的根目錄或共用目錄：

```bash
# 選項 A: 複製到各應用程式根目錄
cp docs/design-system/tailwind-preset.js apps/admin-web/
cp docs/design-system/tailwind-preset.js apps/buyer-web/
cp docs/design-system/tailwind-preset.js apps/pos-web/

# 選項 B: 使用 Monorepo 共用（推薦）
# 將 preset 放在 packages/shared/ 或類似位置
mkdir -p packages/tailwind-config
cp docs/design-system/tailwind-preset.js packages/tailwind-config/
```

### Step 2: 在應用程式中引用 Preset

各應用程式的 `tailwind.config.js` 範例：

---

## 🔧 應用程式設定範例

### Admin Web (Fintech/Crypto Dark Mode)

**`apps/admin-web/tailwind.config.js`**

```javascript
const sharedPreset = require('../../packages/tailwind-config/tailwind-preset.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],

  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],

  theme: {
    extend: {
      // ======================================
      // Admin 專用顏色
      // ======================================
      colors: {
        // 背景色
        'bg-base': '#0F172A',
        'bg-elevated': '#1E293B',
        'bg-card': 'rgba(30, 41, 59, 0.7)',

        // 主色（藍色系）
        'primary': {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },

        // 輔色（紫色系）
        'accent': {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },

        // 語意色
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444',
        'info': '#3B82F6',

        // 文字色
        'text-primary': '#F1F5F9',
        'text-secondary': '#CBD5E1',
        'text-muted': '#64748B',

        // 邊框色
        'border': 'rgba(148, 163, 184, 0.1)',
        'border-focus': 'rgba(59, 130, 246, 0.5)',
      },

      // ======================================
      // Admin 專用字體
      // ======================================
      fontFamily: {
        'mono': ['Geist Mono', 'ui-monospace', 'monospace'],
      },

      // ======================================
      // Admin 專用陰影（Glassmorphism）
      // ======================================
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass-hover': '0 12px 48px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
      },

      // ======================================
      // Admin 專用動畫
      // ======================================
      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
      },

      // ======================================
      // Admin 專用背景圖
      // ======================================
      backgroundImage: {
        'gradient-glass': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
      },
    },
  },

  plugins: [
    // Admin 專用 Utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.glass-card': {
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(12px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(12px) saturate(180%)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
```

---

### Buyer Web (DeFi Cyberpunk Neon)

**`apps/buyer-web/tailwind.config.js`**

```javascript
const sharedPreset = require('../../packages/tailwind-config/tailwind-preset.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],

  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],

  theme: {
    extend: {
      // ======================================
      // Buyer 專用顏色
      // ======================================
      colors: {
        // 背景色
        'black': '#000000',
        'dark-gray': '#0A0A0A',
        'card-bg': 'rgba(20, 20, 20, 0.9)',

        // Neon 主色
        'neon-cyan': '#00F0FF',
        'neon-magenta': '#FF00FF',
        'neon-purple': '#A855F7',
        'neon-lime': '#84FF00',
        'neon-pink': '#FF1493',

        // 語意色（Neon 變體）
        'success': '#84FF00',
        'warning': '#FFD700',
        'danger': '#FF1493',
        'info': '#00F0FF',

        // 文字色
        'text-primary': '#FFFFFF',
        'text-secondary': 'rgba(255, 255, 255, 0.8)',
        'text-muted': 'rgba(255, 255, 255, 0.5)',

        // 邊框色
        'border': 'rgba(0, 240, 255, 0.2)',
        'border-magenta': 'rgba(255, 0, 255, 0.3)',
      },

      // ======================================
      // Buyer 專用字體
      // ======================================
      fontFamily: {
        'display': ['Orbitron', 'ui-sans-serif', 'sans-serif'],
      },

      // ======================================
      // Buyer 專用陰影（Glow）
      // ======================================
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.8), 0 0 40px rgba(0, 240, 255, 0.4)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.4)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.4)',
      },

      // ======================================
      // Buyer 專用動畫
      // ======================================
      keyframes: {
        'neon-flicker': {
          '0%, 100%': { opacity: '1', textShadow: '0 0 10px currentColor, 0 0 20px currentColor' },
          '50%': { opacity: '0.8', textShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
        },
        'glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(-2px, 2px)' },
          '66%': { transform: 'translate(2px, -2px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        'neon-flicker': 'neon-flicker 3s infinite alternate',
        'glitch': 'glitch 5s infinite',
        'float': 'float 3s ease-in-out infinite',
      },

      // ======================================
      // Buyer 專用背景圖
      // ======================================
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00F0FF 0%, #FF00FF 100%)',
        'gradient-triple': 'linear-gradient(135deg, #00F0FF 0%, #A855F7 50%, #FF00FF 100%)',
        'grid-pattern': `
          linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },

  plugins: [
    // Buyer 專用 Utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.neon-text': {
          color: '#00F0FF',
          textShadow: '0 0 10px #00F0FF, 0 0 20px #00F0FF, 0 0 30px #00F0FF',
        },
        '.neon-border': {
          border: '1px solid #00F0FF',
          boxShadow: '0 0 10px rgba(0, 240, 255, 0.5), inset 0 0 10px rgba(0, 240, 255, 0.2)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
```

---

### POS Web (Simple & Functional)

**`apps/pos-web/tailwind.config.js`**

```javascript
const sharedPreset = require('../../packages/tailwind-config/tailwind-preset.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],

  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],

  theme: {
    extend: {
      // ======================================
      // POS 專用顏色
      // ======================================
      colors: {
        // 背景色
        'bg-base': '#FFFFFF',
        'bg-secondary': '#F9FAFB',
        'bg-elevated': '#F3F4F6',

        // 主色（綠色）
        'primary': {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },

        // 語意色
        'confirm': '#10B981',
        'cancel': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',

        // 文字色
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',

        // 邊框色
        'border': '#E5E7EB',
        'border-focus': '#10B981',
      },

      // ======================================
      // POS 專用字體（大字體）
      // ======================================
      fontFamily: {
        'sans': ['Inter', 'Noto Sans TC', 'ui-sans-serif', 'sans-serif'],
      },

      fontSize: {
        // 最小 16px 避免自動縮放
        'sm': ['1rem', { lineHeight: '1.5' }],
        'base': ['1.125rem', { lineHeight: '1.5' }],
        'lg': ['1.25rem', { lineHeight: '1.5' }],
        'xl': ['1.5rem', { lineHeight: '1.4' }],
        '2xl': ['2rem', { lineHeight: '1.3' }],
        '3xl': ['2.5rem', { lineHeight: '1.2' }],
        '4xl': ['3rem', { lineHeight: '1.1' }],
        '5xl': ['4rem', { lineHeight: '1' }],
      },

      // ======================================
      // POS 專用間距（觸控友善）
      // ======================================
      spacing: {
        'touch': '44px',
        'touch-comfortable': '56px',
      },
    },
  },

  plugins: [
    // POS 專用 Utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.btn-touch': {
          minHeight: '56px',
          padding: '1rem 2rem',
          fontSize: '1.5rem',
          transition: 'all 0.2s ease',
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.btn-touch:active': {
          transform: 'scale(0.98)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
```

---

## 🎨 使用範例

### 共用動畫（所有應用程式可用）

```vue
<template>
  <!-- 淡入效果 -->
  <div class="animate-fade-in">內容</div>

  <!-- 由下滑入 -->
  <div class="animate-slide-up">內容</div>

  <!-- 脈衝效果 -->
  <div class="animate-pulse">載入中...</div>

  <!-- 自訂延遲 -->
  <div
    class="animate-fade-in"
    style="animation-delay: 200ms"
  >
    延遲淡入
  </div>
</template>
```

### 間距系統（8px Baseline）

```vue
<template>
  <!-- 標準間距 -->
  <div class="p-4">Padding 16px (4 * 4px)</div>
  <div class="p-8">Padding 32px (8 * 4px)</div>

  <!-- 額外間距 -->
  <div class="mt-13">Margin Top 52px</div>
  <div class="mb-18">Margin Bottom 72px</div>
</template>
```

### 文字截斷

```vue
<template>
  <!-- 單行截斷 -->
  <p class="line-clamp-1">
    這是一段很長的文字，會被截斷並顯示省略號
  </p>

  <!-- 三行截斷 -->
  <p class="line-clamp-3">
    這是一段很長的文字內容，
    會在第三行截斷並顯示省略號，
    超過的內容將被隱藏。
  </p>
</template>
```

### 觸控目標（POS 專用）

```vue
<template>
  <!-- 標準觸控目標 (44px) -->
  <button class="min-h-touch min-w-touch">
    按鈕
  </button>

  <!-- 舒適觸控目標 (56px) -->
  <button class="min-h-touch-comfortable min-w-touch-comfortable">
    大按鈕
  </button>
</template>
```

---

## 📐 Z-Index 層級指南

使用標準化的 z-index 值避免層級衝突：

```vue
<template>
  <!-- Dropdown 選單 -->
  <div class="z-dropdown">下拉選單</div>

  <!-- 固定元素（Header/Footer） -->
  <header class="z-fixed">固定標題</header>

  <!-- Modal 背景遮罩 -->
  <div class="z-modal-backdrop">遮罩</div>

  <!-- Modal 內容 -->
  <div class="z-modal">彈窗內容</div>

  <!-- Tooltip -->
  <div class="z-tooltip">提示</div>

  <!-- Toast 通知 -->
  <div class="z-notification">通知</div>
</template>
```

---

## 🚀 最佳實踐

### 1. 優先使用 Preset 提供的 Utilities

```vue
<!-- ✅ 好：使用 preset 動畫 -->
<div class="animate-fade-in">內容</div>

<!-- ❌ 壞：自訂重複的動畫 -->
<div class="custom-fade">內容</div>
<style>
@keyframes custom-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.custom-fade {
  animation: custom-fade 0.3s;
}
</style>
```

### 2. 保持顏色變數在 Tailwind Config

```vue
<!-- ✅ 好：使用 Tailwind 顏色 -->
<button class="bg-primary-500 text-white">按鈕</button>

<!-- ❌ 壞：行內樣式 -->
<button style="background: #3B82F6; color: white;">按鈕</button>
```

### 3. 響應式設計使用標準斷點

```vue
<!-- ✅ 好：使用標準斷點 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 內容 -->
</div>

<!-- ✅ 好：使用語意化斷點 -->
<div class="hidden tablet:block">
  <!-- 平板以上顯示 -->
</div>
```

### 4. 動畫組合使用

```vue
<!-- 組合多個動畫效果 -->
<div class="
  animate-fade-in
  hover:scale-105
  transition-all
  duration-300
">
  滑鼠懸停放大
</div>
```

---

## 🔍 除錯提示

### Preset 未生效

確認 `tailwind.config.js` 中正確引用：

```javascript
// ❌ 錯誤
module.exports = {
  theme: { /* ... */ }
};

// ✅ 正確
const sharedPreset = require('./tailwind-preset.js');

module.exports = {
  presets: [sharedPreset],
  theme: {
    extend: { /* ... */ }
  }
};
```

### 顏色未顯示

檢查是否在 `extend` 區塊內：

```javascript
// ❌ 錯誤：會覆蓋 preset
module.exports = {
  presets: [sharedPreset],
  theme: {
    colors: { /* 會覆蓋所有 preset 顏色 */ }
  }
};

// ✅ 正確：擴展 preset
module.exports = {
  presets: [sharedPreset],
  theme: {
    extend: {
      colors: { /* 添加新顏色 */ }
    }
  }
};
```

### PurgeCSS 刪除動畫

確保 `content` 路徑正確：

```javascript
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  // ...
};
```

---

## 📚 相關文件

- **品牌指南**: [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md)
- **Admin 風格指南**: [ADMIN_WEB_STYLE_GUIDE.md](./ADMIN_WEB_STYLE_GUIDE.md)
- **Buyer 風格指南**: [BUYER_WEB_STYLE_GUIDE.md](./BUYER_WEB_STYLE_GUIDE.md)
- **POS 風格指南**: [POS_WEB_STYLE_GUIDE.md](./POS_WEB_STYLE_GUIDE.md)
- **Tailwind CSS 官方文件**: https://tailwindcss.com/docs

---

**最後更新**: 2026-01-25
**維護者**: Card ERP 開發團隊
