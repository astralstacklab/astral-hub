# Admin Web Style Guide
## Fintech/Crypto Dark Mode with Glassmorphism

**版本**: 1.0.0
**最後更新**: 2026-01-25
**風格定位**: 專業、可信、現代科技

---

## 🎯 設計理念

### 視覺關鍵字

```
Professional    Trustworthy    Sophisticated
   Dark           Sleek          Modern
      Tech        Glass       Security
```

### 靈感來源

- **Fintech Dashboards**: Stripe, Coinbase, Robinhood
- **Crypto Exchanges**: Binance (dark mode), FTX
- **Design Systems**: Vercel, Linear, Resend
- **Glassmorphism**: iOS, Windows 11 Fluent Design

### 核心特色

1. **深色優先** - 減少眼睛疲勞，專業感
2. **玻璃態 (Glassmorphism)** - 現代、精緻、層次感
3. **數據視覺化** - 圖表、指標、即時數據
4. **信任指標** - 安全提示、狀態徽章、驗證標記

---

## 🎨 色彩系統

### 主色調 - Deep Slate

```css
:root {
  /* Background Layers */
  --bg-base: #0F172A;        /* Slate 900 - 最深背景 */
  --bg-elevated: #1E293B;    /* Slate 800 - 提升層 */
  --bg-glass: rgba(30, 41, 59, 0.7);  /* 玻璃態背景 */

  /* Surface Colors */
  --surface-1: #334155;      /* Slate 700 */
  --surface-2: #475569;      /* Slate 600 */
  --surface-3: #64748B;      /* Slate 500 */
}
```

### 強調色 - Electric Blue

```css
:root {
  /* Primary - 電光藍 (代表科技、創新) */
  --primary-50: #EFF6FF;
  --primary-100: #DBEAFE;
  --primary-200: #BFDBFE;
  --primary-300: #93C5FD;
  --primary-400: #60A5FA;
  --primary-500: #3B82F6;   /* 主要使用 */
  --primary-600: #2563EB;
  --primary-700: #1D4ED8;
  --primary-800: #1E40AF;
  --primary-900: #1E3A8A;

  /* Glow Effect */
  --primary-glow: 0 0 20px rgba(59, 130, 246, 0.5);
  --primary-glow-strong: 0 0 40px rgba(59, 130, 246, 0.8);
}
```

### 輔助色 - Purple Accent

```css
:root {
  /* Accent - 紫羅蘭 (代表高端、神秘) */
  --accent-400: #A78BFA;
  --accent-500: #8B5CF6;    /* Violet 500 */
  --accent-600: #7C3AED;

  /* Gradient */
  --gradient-primary: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  --gradient-subtle: linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
}
```

### 語義色彩

```css
:root {
  /* Success */
  --success-400: #34D399;   /* Emerald */
  --success-500: #10B981;
  --success-600: #059669;

  /* Warning */
  --warning-400: #FBBF24;   /* Amber */
  --warning-500: #F59E0B;
  --warning-600: #D97706;

  /* Error */
  --error-400: #F87171;     /* Red */
  --error-500: #EF4444;
  --error-600: #DC2626;

  /* Info */
  --info-400: #38BDF8;      /* Sky */
  --info-500: #0EA5E9;
  --info-600: #0284C7;
}
```

### 文字色彩

```css
:root {
  --text-primary: #F8FAFC;      /* Slate 50 - 主要文字 */
  --text-secondary: #CBD5E1;    /* Slate 300 - 次要文字 */
  --text-tertiary: #94A3B8;     /* Slate 400 - 輔助文字 */
  --text-muted: #64748B;        /* Slate 500 - 禁用/說明 */
  --text-inverse: #0F172A;      /* 反色文字（亮色背景上） */
}
```

### 邊框與分隔線

```css
:root {
  --border-subtle: rgba(148, 163, 184, 0.1);  /* 極淡邊框 */
  --border-default: rgba(148, 163, 184, 0.2); /* 標準邊框 */
  --border-strong: rgba(148, 163, 184, 0.3);  /* 強邊框 */
}
```

---

## 🔤 字體系統

### 字體堆疊

```css
:root {
  /* 中文 + 系統回退 */
  --font-sans: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* 等寬字體（數據、代碼） */
  --font-mono: 'Geist Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
}
```

### 字體大小比例

```css
:root {
  /* Scale: 1.250 (Major Third) */
  --text-xs: 0.75rem;      /* 12px - 輔助說明 */
  --text-sm: 0.875rem;     /* 14px - 次要文字 */
  --text-base: 1rem;       /* 16px - 基準 */
  --text-lg: 1.125rem;     /* 18px - 強調 */
  --text-xl: 1.25rem;      /* 20px - 小標題 */
  --text-2xl: 1.5rem;      /* 24px - 標題 */
  --text-3xl: 1.875rem;    /* 30px - 大標題 */
  --text-4xl: 2.25rem;     /* 36px - 頁面標題 */
  --text-5xl: 3rem;        /* 48px - 英雄標題 */
}
```

### 行高

```css
:root {
  --leading-tight: 1.25;    /* 標題 */
  --leading-normal: 1.5;    /* 內文 */
  --leading-relaxed: 1.75;  /* 寬鬆內文 */
}
```

### 字重

```css
:root {
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;       /* 最常用 */
  --font-semibold: 600;
  --font-bold: 700;
  --font-black: 900;        /* 超大標題 */
}
```

---

## 🧊 Glassmorphism 效果

### 核心玻璃態樣式

```css
.glass-card {
  background: rgba(30, 41, 59, 0.7);  /* 半透明深色 */
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.37),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
}
```

### 變體

```css
/* 更透明（次要元素） */
.glass-subtle {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(8px);
}

/* 更實心（主要元素） */
.glass-solid {
  background: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(16px);
}

/* 邊框高光（懸停狀態） */
.glass-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.37),
    0 0 20px 0 rgba(59, 130, 246, 0.2),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
}
```

### 效能考量

```css
/* 僅在必要時使用 backdrop-filter */
@supports (backdrop-filter: blur(12px)) {
  .glass-card {
    backdrop-filter: blur(12px) saturate(180%);
  }
}

/* 降級方案 */
@supports not (backdrop-filter: blur(12px)) {
  .glass-card {
    background: rgba(30, 41, 59, 0.95);
  }
}
```

---

## 🎨 組件設計

### 1. 按鈕系統

#### Primary Button

```html
<button class="btn btn-primary">
  確認操作
</button>
```

```css
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.39);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}

/* 發光效果（可選） */
.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}
```

#### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.btn-ghost:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--primary-500);
}
```

#### Icon Button

```css
.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}
```

---

### 2. 卡片組件

#### Glass Card

```html
<div class="glass-card">
  <div class="card-header">
    <h3 class="card-title">銷售統計</h3>
    <button class="btn-icon">•••</button>
  </div>
  <div class="card-body">
    <!-- Content -->
  </div>
</div>
```

```css
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}
```

#### Stat Card (數據卡片)

```html
<div class="stat-card">
  <div class="stat-icon">
    <svg><!-- icon --></svg>
  </div>
  <div class="stat-content">
    <p class="stat-label">總銷售額</p>
    <p class="stat-value">NT$ 1,234,567</p>
    <p class="stat-change positive">
      <span class="arrow">↑</span> 12.5%
    </p>
  </div>
</div>
```

```css
.stat-card {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--border-default);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-400);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.stat-change {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-change.positive {
  color: var(--success-400);
}

.stat-change.negative {
  color: var(--error-400);
}
```

---

### 3. 表格組件

```html
<div class="table-container">
  <table class="data-table">
    <thead>
      <tr>
        <th>商品名稱</th>
        <th>售價</th>
        <th>庫存</th>
        <th>狀態</th>
        <th class="text-right">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <img src="..." class="product-thumb" />
            <span>Pikachu VMAX</span>
          </div>
        </td>
        <td class="font-mono">NT$ 1,200</td>
        <td>15</td>
        <td><span class="badge badge-success">可售</span></td>
        <td class="text-right">
          <button class="btn-icon-sm">編輯</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.table-container {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table thead {
  background: rgba(15, 23, 42, 0.6);
}

.data-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
}

.data-table tbody tr {
  transition: background 0.2s ease;
}

.data-table tbody tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

.data-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  object-fit: cover;
}
```

---

### 4. Badge 徽章

```html
<span class="badge badge-success">已付款</span>
<span class="badge badge-warning">待出貨</span>
<span class="badge badge-error">已取消</span>
<span class="badge badge-info">處理中</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: 1;
}

.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-400);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-400);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-400);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.badge-info {
  background: rgba(14, 165, 233, 0.1);
  color: var(--info-400);
  border: 1px solid rgba(14, 165, 233, 0.2);
}
```

---

### 5. Input 輸入框

```html
<div class="input-group">
  <label for="email" class="input-label">Email 地址</label>
  <input
    type="email"
    id="email"
    class="input"
    placeholder="admin@example.com"
  />
  <span class="input-hint">用於登入和接收通知</span>
</div>
```

```css
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid var(--border-default);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: rgba(30, 41, 59, 0.7);
}

.input-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

---

### 6. 側邊欄 (Sidebar)

```html
<aside class="sidebar">
  <div class="sidebar-header">
    <div class="logo">
      <img src="/logo.svg" alt="Astral Hub" />
      <span>Astral Hub</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    <a href="/dashboard" class="nav-item active">
      <svg class="nav-icon"><!-- icon --></svg>
      <span>總覽</span>
    </a>
    <a href="/products" class="nav-item">
      <svg class="nav-icon"><!-- icon --></svg>
      <span>商品管理</span>
    </a>
    <!-- ... -->
  </nav>

  <div class="sidebar-footer">
    <div class="user-profile">
      <img src="/avatar.jpg" class="avatar" />
      <div class="user-info">
        <p class="user-name">Admin User</p>
        <p class="user-email">admin@example.com</p>
      </div>
    </div>
  </div>
</aside>
```

```css
.sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.logo img {
  width: 32px;
  height: 32px;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
  margin-bottom: 0.25rem;
}

.nav-item:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-400);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  color: var(--primary-400);
  box-shadow: inset 3px 0 0 var(--primary-500);
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: background 0.2s ease;
  cursor: pointer;
}

.user-profile:hover {
  background: rgba(59, 130, 246, 0.05);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border-default);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
}

.user-email {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 0;
}
```

---

## 📊 圖表樣式 (Chart.js)

### Chart.js 主題配置

```javascript
const chartTheme = {
  backgroundColor: 'rgba(30, 41, 59, 0.7)',
  borderColor: 'rgba(148, 163, 184, 0.2)',
  gridColor: 'rgba(148, 163, 184, 0.1)',
  textColor: '#CBD5E1',

  colors: {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    purple: '#8B5CF6',
  },

  font: {
    family: "'Geist Mono', 'SF Mono', monospace",
    size: 12,
    weight: 500,
  },
}

// 範例：折線圖
const lineChartConfig = {
  type: 'line',
  data: {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [{
      label: '銷售額',
      data: [12000, 19000, 15000, 25000, 22000, 30000],
      borderColor: chartTheme.colors.primary,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 400)
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)')
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
        return gradient
      },
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: chartTheme.colors.primary,
      pointBorderColor: '#0F172A',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTheme.textColor,
          font: chartTheme.font,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: {
          color: chartTheme.gridColor,
          drawBorder: false,
        },
        ticks: {
          color: chartTheme.textColor,
          font: chartTheme.font,
        }
      },
      y: {
        grid: {
          color: chartTheme.gridColor,
          drawBorder: false,
        },
        ticks: {
          color: chartTheme.textColor,
          font: chartTheme.font,
        }
      }
    }
  }
}
```

---

## 🎭 動畫與微互動

### 頁面載入動畫

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

/* 交錯動畫 */
.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }
```

### 脈衝效果（即時數據）

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.live-indicator::before {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--success-500);
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 10px var(--success-500);
}
```

### Skeleton Loading

```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(51, 65, 85, 0.3) 0%,
    rgba(71, 85, 105, 0.5) 50%,
    rgba(51, 65, 85, 0.3) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 0.5rem;
}

.skeleton-text {
  height: 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-card {
  height: 200px;
  width: 100%;
}
```

---

## 完整的 Tailwind 配置 (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Background
        'bg-base': '#0F172A',
        'bg-elevated': '#1E293B',
        'bg-glass': 'rgba(30, 41, 59, 0.7)',

        // Surface
        'surface': {
          1: '#334155',
          2: '#475569',
          3: '#64748B',
        },

        // Primary (Electric Blue)
        'primary': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // Accent (Purple)
        'accent': {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },

        // Semantic
        'success': {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        'warning': {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        'error': {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        'info': {
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
        },

        // Text
        'text': {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          tertiary: '#94A3B8',
          muted: '#64748B',
        },

        // Border
        'border': {
          subtle: 'rgba(148, 163, 184, 0.1)',
          default: 'rgba(148, 163, 184, 0.2)',
          strong: 'rgba(148, 163, 184, 0.3)',
        },
      },

      fontFamily: {
        sans: ['Noto Sans TC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },

      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-strong': '0 0 40px rgba(59, 130, 246, 0.8)',
      },

      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },

      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },

      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
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

- **使用深色背景** - 主背景 #0F172A
- **運用 Glassmorphism** - backdrop-filter: blur()
- **等寬字體顯示數據** - 價格、ID、代碼用 Geist Mono
- **柔和的動畫** - 250ms ease-out transitions
- **清晰的層次** - z-index, box-shadow 建立深度
- **即時數據指標** - 脈衝動畫、live 標記
- **高對比文字** - 確保 WCAG AA 標準
- **信任元素** - 安全徽章、驗證標記、SSL 圖標

### ❌ DON'T

- **避免純白背景** - 刺眼且不符合風格
- **避免過度動畫** - 專業環境需要內斂
- **避免亮色主題** - 深色是核心定位
- **避免非等寬字體顯示數字** - 數據對齊很重要
- **避免低對比度** - 深色背景上需要足夠對比
- **避免過多顏色** - 保持 2-3 主色
- **避免 Comic Sans 或可愛字體** - 不符專業形象

---

## 📐 佈局範例

### Dashboard 首頁

```html
<div class="admin-layout">
  <!-- Sidebar -->
  <aside class="sidebar">...</aside>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Top Bar -->
    <header class="top-bar">
      <h1 class="page-title">總覽</h1>
      <div class="top-bar-actions">
        <button class="btn btn-ghost">
          <svg class="icon"><!-- bell --></svg>
        </button>
        <button class="btn btn-primary">新增商品</button>
      </div>
    </header>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">...</div>
      <div class="stat-card">...</div>
      <div class="stat-card">...</div>
      <div class="stat-card">...</div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <div class="glass-card chart-container">
        <canvas id="salesChart"></canvas>
      </div>
      <div class="glass-card chart-container">
        <canvas id="categoryChart"></canvas>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="glass-card">
      <div class="card-header">
        <h3>最近訂單</h3>
        <a href="/orders">查看全部</a>
      </div>
      <div class="table-container">
        <table class="data-table">...</table>
      </div>
    </div>
  </main>
</div>
```

```css
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
}

.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 2rem;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.page-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.top-bar-actions {
  display: flex;
  gap: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-container {
  padding: 1.5rem;
  height: 400px;
}
```

---

## 🎯 總結

Admin Web 以 **Fintech/Crypto Dark Mode + Glassmorphism** 為核心，打造專業、現代、值得信任的管理介面。

**核心特色**:
- 🌑 深色優先（#0F172A 基底）
- 🧊 玻璃態效果（backdrop-filter: blur）
- 💎 電光藍強調色（#3B82F6）
- 📊 數據視覺化（Chart.js）
- ⚡ 細膩動畫（250ms 過渡）
- 🔒 信任元素（安全徽章、驗證標記）

---

**相關文件**:
- [Brand Guidelines](./BRAND_GUIDELINES.md)
- [Buyer Web Style Guide](./BUYER_WEB_STYLE_GUIDE.md)
- [POS Web Style Guide](./POS_WEB_STYLE_GUIDE.md)

**最後更新**: 2026-01-25
