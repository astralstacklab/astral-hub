# Buyer Web Style Guide
## DeFi Cyberpunk Neon Aesthetics

**版本**: 1.0.0
**最後更新**: 2026-01-25
**風格定位**: 未來、刺激、高能量

---

## 🎯 設計理念

### 視覺關鍵字

```
Cyberpunk    Neon    Futuristic
   Energy     Gaming    Exciting
      Electric   Bold    Vibrant
```

### 靈感來源

- **DeFi Platforms**: Uniswap, PancakeSwap, Aave
- **Gaming UI**: Valorant, Apex Legends, Cyberpunk 2077
- **Crypto Aesthetics**: Neon colors, grid patterns, glitch effects
- **Retro-Futurism**: Tron, Blade Runner, Synthwave

### 核心特色

1. **霓虹色彩** - 高飽和度青/洋紅/紫
2. **深黑背景** - 純黑 #000000 突顯霓虹
3. **幾何圖形** - 網格、線條、六邊形
4. **動態效果** - 發光、脈衝、掃描線
5. **未來字體** - Orbitron 科技感

---

## 🎨 色彩系統

### 背景系統

```css
:root {
  /* Pure Black Base */
  --bg-pure-black: #000000;
  --bg-dark: #0A0A0A;
  --bg-charcoal: #141414;

  /* Gradient Backgrounds */
  --bg-gradient-dark: linear-gradient(180deg, #000000 0%, #0A0A0A 100%);
  --bg-gradient-cyber: linear-gradient(135deg,
    #000000 0%,
    rgba(0, 240, 255, 0.05) 50%,
    rgba(255, 0, 255, 0.05) 100%
  );

  /* Grid Pattern */
  --bg-grid:
    linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
  --bg-grid-size: 40px 40px;
}
```

### 霓虹色彩 - Primary Palette

```css
:root {
  /* Cyan - 主要霓虹色（代表科技、未來） */
  --neon-cyan: #00F0FF;
  --neon-cyan-glow: 0 0 20px #00F0FF, 0 0 40px #00F0FF;
  --neon-cyan-strong: 0 0 30px #00F0FF, 0 0 60px #00F0FF, 0 0 90px #00F0FF;

  /* Magenta - 次要霓虹色（代表激情、能量） */
  --neon-magenta: #FF00FF;
  --neon-magenta-glow: 0 0 20px #FF00FF, 0 0 40px #FF00FF;

  /* Purple - 輔助霓虹色（代表高級、稀有） */
  --neon-purple: #A855F7;
  --neon-purple-glow: 0 0 20px #A855F7, 0 0 40px #A855F7;

  /* Lime - 能量色（代表稀有、成功） */
  --neon-lime: #84FF00;
  --neon-lime-glow: 0 0 20px #84FF00, 0 0 40px #84FF00;

  /* Orange - 警示色（代表熱門、緊急） */
  --neon-orange: #FF6B00;
  --neon-orange-glow: 0 0 20px #FF6B00, 0 0 40px #FF6B00;
}
```

### 漸層系統

```css
:root {
  /* Cyber Gradient */
  --gradient-cyber: linear-gradient(135deg, #00F0FF 0%, #FF00FF 100%);
  --gradient-cyber-vertical: linear-gradient(180deg, #00F0FF 0%, #FF00FF 100%);

  /* Triple Neon */
  --gradient-triple: linear-gradient(135deg, #00F0FF 0%, #A855F7 50%, #FF00FF 100%);

  /* Energy Gradient */
  --gradient-energy: linear-gradient(135deg, #84FF00 0%, #00F0FF 100%);

  /* Rare/Epic Gradients */
  --gradient-rare: linear-gradient(135deg, #A855F7 0%, #EC4899 100%);
  --gradient-epic: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
  --gradient-legendary: linear-gradient(135deg, #FF6B00 0%, #FF00FF 100%);
}
```

### 文字色彩

```css
:root {
  --text-neon: #00F0FF;        /* 霓虹文字 */
  --text-primary: #FFFFFF;      /* 主要文字 */
  --text-secondary: #94A3B8;    /* 次要文字 */
  --text-muted: #475569;        /* 靜音文字 */
  --text-inverse: #000000;      /* 反色（亮背景上） */
}
```

### 語義色彩

```css
:root {
  /* Success */
  --success: #84FF00;
  --success-glow: 0 0 20px #84FF00;

  /* Warning */
  --warning: #FBBF24;
  --warning-glow: 0 0 20px #FBBF24;

  /* Error */
  --error: #FF0055;
  --error-glow: 0 0 20px #FF0055;

  /* Info */
  --info: #00F0FF;
  --info-glow: 0 0 20px #00F0FF;
}
```

---

## 🔤 字體系統

### 字體堆疊

```css
:root {
  /* 中文字體 */
  --font-sans: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif;

  /* 英文/標題字體 - 未來感 */
  --font-display: 'Orbitron', 'Exo 2', sans-serif;

  /* 數字字體 - 科技感 */
  --font-mono: 'JetBrains Mono', 'Roboto Mono', monospace;
}
```

### 字體大小

```css
:root {
  /* Mobile First Approach */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 2rem;       /* 32px */
  --text-4xl: 2.5rem;     /* 40px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 4rem;       /* 64px - Hero */
}
```

### 字體應用規則

```css
/* 標題使用 Orbitron */
h1, h2, h3 {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 價格、數字使用等寬 */
.price, .count, .stat-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

/* 內文使用 Noto Sans TC */
p, span, div {
  font-family: var(--font-sans);
}
```

---

## ✨ 霓虹特效系統

### 文字霓虹效果

```css
.neon-text {
  color: var(--neon-cyan);
  text-shadow: var(--neon-cyan-glow);
  animation: neon-flicker 3s infinite alternate;
}

.neon-text-magenta {
  color: var(--neon-magenta);
  text-shadow: var(--neon-magenta-glow);
}

.neon-text-lime {
  color: var(--neon-lime);
  text-shadow: var(--neon-lime-glow);
}

@keyframes neon-flicker {
  0%, 100% {
    text-shadow: var(--neon-cyan-glow);
    opacity: 1;
  }
  50% {
    text-shadow: var(--neon-cyan-strong);
    opacity: 0.9;
  }
}
```

### 邊框霓虹效果

```css
.neon-border {
  border: 2px solid var(--neon-cyan);
  box-shadow:
    inset 0 0 20px rgba(0, 240, 255, 0.2),
    0 0 20px rgba(0, 240, 255, 0.5);
  transition: all 0.3s ease;
}

.neon-border:hover {
  box-shadow:
    inset 0 0 30px rgba(0, 240, 255, 0.3),
    0 0 40px rgba(0, 240, 255, 0.8);
}
```

### 霓虹按鈕

```css
.neon-button {
  position: relative;
  padding: 1rem 2rem;
  background: transparent;
  border: 2px solid var(--neon-cyan);
  color: var(--neon-cyan);
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.neon-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 240, 255, 0.3),
    transparent
  );
  transition: left 0.5s;
}

.neon-button:hover::before {
  left: 100%;
}

.neon-button:hover {
  background: rgba(0, 240, 255, 0.1);
  box-shadow:
    inset 0 0 20px rgba(0, 240, 255, 0.3),
    0 0 30px rgba(0, 240, 255, 0.8);
  text-shadow: 0 0 10px #00F0FF;
}

.neon-button:active {
  transform: scale(0.98);
}
```

---

## 🎨 組件設計

### 1. Product Card - 商品卡片

```html
<div class="product-card">
  <div class="product-image-wrapper">
    <img src="/card-image.jpg" alt="Pikachu VMAX" class="product-image" />
    <div class="rarity-badge legendary">LEGENDARY</div>
    <div class="card-shine"></div>
  </div>

  <div class="product-content">
    <h3 class="product-title">Pikachu VMAX</h3>
    <p class="product-category">Pokemon • 25th Anniversary</p>

    <div class="product-stats">
      <div class="stat">
        <span class="stat-label">PSA</span>
        <span class="stat-value">10</span>
      </div>
      <div class="stat">
        <span class="stat-label">Stock</span>
        <span class="stat-value">3</span>
      </div>
    </div>

    <div class="product-footer">
      <span class="product-price">NT$ 12,000</span>
      <button class="neon-button-small">BUY NOW</button>
    </div>
  </div>
</div>
```

```css
.product-card {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.03) 0%, rgba(255, 0, 255, 0.03) 100%);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-8px);
  border-color: rgba(0, 240, 255, 0.5);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(0, 240, 255, 0.3);
}

.product-image-wrapper {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: linear-gradient(135deg, #0A0A0A 0%, #141414 100%);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.1);
}

.rarity-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 0.5rem 1rem;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-radius: 4px;
  text-shadow: 0 0 10px currentColor;
}

.rarity-badge.legendary {
  background: var(--gradient-legendary);
  color: #FFFFFF;
  box-shadow: 0 0 20px rgba(255, 107, 0, 0.8);
}

.rarity-badge.epic {
  background: var(--gradient-epic);
  color: #000000;
}

.rarity-badge.rare {
  background: var(--gradient-rare);
  color: #FFFFFF;
}

/* Holographic Shine Effect */
.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transform: skewX(-20deg);
  transition: left 0.5s;
}

.product-card:hover .card-shine {
  left: 100%;
}

.product-content {
  padding: 1.5rem;
}

.product-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-neon);
  text-shadow: 0 0 10px var(--neon-cyan);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
}

.product-category {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
}

.product-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 240, 255, 0.1);
  border-radius: 8px;
}

.stat {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--neon-cyan);
  text-shadow: 0 0 10px var(--neon-cyan);
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--neon-lime);
  text-shadow: 0 0 10px var(--neon-lime);
}

.neon-button-small {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid var(--neon-cyan);
  color: var(--neon-cyan);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.neon-button-small:hover {
  background: rgba(0, 240, 255, 0.1);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
}
```

---

### 2. Auction Timer - 競標倒數

```html
<div class="auction-timer">
  <div class="timer-label">ENDING IN</div>
  <div class="timer-display">
    <div class="time-unit">
      <span class="time-value">02</span>
      <span class="time-label">HOURS</span>
    </div>
    <span class="time-separator">:</span>
    <div class="time-unit">
      <span class="time-value">34</span>
      <span class="time-label">MINS</span>
    </div>
    <span class="time-separator">:</span>
    <div class="time-unit">
      <span class="time-value">56</span>
      <span class="time-label">SECS</span>
    </div>
  </div>
</div>
```

```css
.auction-timer {
  background: linear-gradient(135deg, rgba(255, 0, 85, 0.1) 0%, rgba(255, 107, 0, 0.1) 100%);
  border: 2px solid var(--error);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow:
    0 0 30px rgba(255, 0, 85, 0.3),
    inset 0 0 20px rgba(255, 0, 85, 0.1);
  animation: pulse-danger 2s infinite;
}

@keyframes pulse-danger {
  0%, 100% {
    box-shadow:
      0 0 30px rgba(255, 0, 85, 0.3),
      inset 0 0 20px rgba(255, 0, 85, 0.1);
  }
  50% {
    box-shadow:
      0 0 50px rgba(255, 0, 85, 0.5),
      inset 0 0 30px rgba(255, 0, 85, 0.2);
  }
}

.timer-label {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--error);
  text-shadow: 0 0 10px var(--error);
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-value {
  font-family: var(--font-mono);
  font-size: 3rem;
  font-weight: 700;
  color: var(--error);
  text-shadow: 0 0 20px var(--error);
  line-height: 1;
}

.time-label {
  font-family: var(--font-display);
  font-size: 0.625rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  letter-spacing: 0.05em;
}

.time-separator {
  font-family: var(--font-mono);
  font-size: 2rem;
  color: var(--error);
  text-shadow: 0 0 10px var(--error);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

---

### 3. Bid Panel - 出價面板

```html
<div class="bid-panel">
  <div class="current-bid">
    <span class="bid-label">CURRENT BID</span>
    <span class="bid-amount">NT$ 15,000</span>
  </div>

  <div class="bid-history">
    <div class="bid-item">
      <img src="/avatar1.jpg" class="bidder-avatar" />
      <div class="bid-info">
        <span class="bidder-name">collector_123</span>
        <span class="bid-time">2 mins ago</span>
      </div>
      <span class="bid-value">NT$ 15,000</span>
    </div>
    <!-- More bid items... -->
  </div>

  <div class="bid-input-wrapper">
    <input
      type="number"
      class="bid-input"
      placeholder="Enter your bid"
      min="16000"
    />
    <button class="bid-button">
      PLACE BID
      <svg class="arrow-icon">→</svg>
    </button>
  </div>
</div>
```

```css
.bid-panel {
  background:
    var(--bg-grid),
    linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
  background-size: var(--bg-grid-size), 100% 100%;
  border: 2px solid rgba(0, 240, 255, 0.3);
  border-radius: 16px;
  padding: 2rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 0 40px rgba(0, 240, 255, 0.05);
}

.current-bid {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
}

.bid-label {
  display: block;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
}

.bid-amount {
  display: block;
  font-family: var(--font-mono);
  font-size: 3rem;
  font-weight: 700;
  background: var(--gradient-triple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.8));
}

.bid-history {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 2rem;
}

.bid-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 240, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.bid-item:hover {
  background: rgba(0, 240, 255, 0.05);
  border-color: rgba(0, 240, 255, 0.3);
}

.bidder-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--neon-cyan);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.bid-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bidder-name {
  font-weight: 600;
  color: var(--text-primary);
}

.bid-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.bid-value {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--neon-cyan);
  text-shadow: 0 0 10px var(--neon-cyan);
}

.bid-input-wrapper {
  display: flex;
  gap: 1rem;
}

.bid-input {
  flex: 1;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(0, 240, 255, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 1.25rem;
  transition: all 0.3s ease;
}

.bid-input:focus {
  outline: none;
  border-color: var(--neon-cyan);
  box-shadow:
    0 0 20px rgba(0, 240, 255, 0.3),
    inset 0 0 10px rgba(0, 240, 255, 0.1);
}

.bid-button {
  padding: 1rem 2rem;
  background: var(--gradient-cyber);
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
}

.bid-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 40px rgba(0, 240, 255, 0.8);
}

.bid-button:active {
  transform: translateY(0);
}

.arrow-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.bid-button:hover .arrow-icon {
  transform: translateX(4px);
}
```

---

### 4. Hero Section - 英雄區塊

```html
<section class="hero">
  <div class="hero-bg">
    <div class="grid-overlay"></div>
    <div class="glow-orb glow-cyan"></div>
    <div class="glow-orb glow-magenta"></div>
  </div>

  <div class="hero-content">
    <h1 class="hero-title">
      <span class="glitch" data-text="COLLECT">COLLECT</span>
      <span class="glitch" data-text="TRADE">TRADE</span>
      <span class="glitch" data-text="WIN">WIN</span>
    </h1>
    <p class="hero-subtitle">
      The Future of Card Trading is Here
    </p>
    <div class="hero-actions">
      <button class="neon-button neon-button-large">
        START TRADING
      </button>
      <button class="ghost-button">
        EXPLORE MARKETPLACE
      </button>
    </div>
  </div>

  <div class="hero-stats">
    <div class="stat-item">
      <span class="stat-value">10K+</span>
      <span class="stat-label">CARDS</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">2.5K+</span>
      <span class="stat-label">TRADERS</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">NT$ 5M+</span>
      <span class="stat-label">VOLUME</span>
    </div>
  </div>
</section>
```

```css
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.1) 0%, transparent 50%),
    var(--bg-pure-black);
  z-index: 0;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--bg-grid);
  background-size: var(--bg-grid-size);
  opacity: 0.3;
  animation: grid-scroll 20s linear infinite;
}

@keyframes grid-scroll {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(40px);
  }
}

.glow-orb {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  animation: float 8s ease-in-out infinite;
}

.glow-cyan {
  background: radial-gradient(circle, #00F0FF 0%, transparent 70%);
  top: 10%;
  left: 10%;
}

.glow-magenta {
  background: radial-gradient(circle, #FF00FF 0%, transparent 70%);
  bottom: 10%;
  right: 10%;
  animation-delay: -4s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(50px, 50px);
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 10vw, 6rem);
  font-weight: 900;
  line-height: 1.1;
  margin: 0 0 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.glitch {
  position: relative;
  display: inline-block;
  background: var(--gradient-triple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 30px rgba(0, 240, 255, 0.8));
  animation: glitch-animation 5s infinite;
}

@keyframes glitch-animation {
  0%, 90%, 100% {
    transform: translate(0);
  }
  92% {
    transform: translate(-2px, 2px);
  }
  94% {
    transform: translate(2px, -2px);
  }
  96% {
    transform: translate(-2px, -2px);
  }
  98% {
    transform: translate(2px, 2px);
  }
}

.hero-subtitle {
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: var(--text-secondary);
  margin: 0 0 3rem 0;
  letter-spacing: 0.05em;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.neon-button-large {
  padding: 1.25rem 3rem;
  font-size: 1.125rem;
}

.ghost-button {
  padding: 1.25rem 3rem;
  background: transparent;
  border: 2px solid rgba(148, 163, 184, 0.3);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ghost-button:hover {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}

.hero-stats {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 4rem;
  margin-top: 4rem;
  flex-wrap: wrap;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-item .stat-value {
  font-family: var(--font-mono);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--neon-cyan);
  text-shadow: 0 0 20px var(--neon-cyan);
}

.stat-item .stat-label {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}
```

---

## 🎬 動畫與特效

### Scroll Reveal Animation

```javascript
// 使用 Intersection Observer 實作滾動顯示
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed')
    }
  })
}, observerOptions)

document.querySelectorAll('.reveal').forEach(el => {
  observer.observe(el)
})
```

```css
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger effect */
.reveal:nth-child(1) { transition-delay: 0.1s; }
.reveal:nth-child(2) { transition-delay: 0.2s; }
.reveal:nth-child(3) { transition-delay: 0.3s; }
```

### Particle Background (Optional)

```javascript
// 使用 Canvas 創建粒子背景
class ParticleBackground {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.particles = []
    this.init()
  }

  init() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    // Create particles
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#00F0FF' : '#FF00FF'
      })
    }

    this.animate()
  }

  animate() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1

      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      this.ctx.fillStyle = p.color
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = p.color
      this.ctx.fill()
    })

    requestAnimationFrame(() => this.animate())
  }
}

// Initialize
const canvas = document.getElementById('particle-bg')
new ParticleBackground(canvas)
```

---

## 📱 響應式設計

### Mobile Optimization

```css
/* Mobile First */
@media (max-width: 768px) {
  .hero-title {
    font-size: 3rem;
  }

  .product-card {
    border-width: 1px;
  }

  .neon-button {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
  }

  .hero-stats {
    gap: 2rem;
  }

  /* Reduce glow effects on mobile for performance */
  .neon-text {
    text-shadow: 0 0 10px currentColor;
  }

  .glow-orb {
    filter: blur(60px);
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
        // Background
        'black': '#000000',
        'dark': '#0A0A0A',
        'charcoal': '#141414',

        // Neon Colors
        'neon-cyan': '#00F0FF',
        'neon-magenta': '#FF00FF',
        'neon-purple': '#A855F7',
        'neon-lime': '#84FF00',
        'neon-orange': '#FF6B00',

        // Semantic
        'success': '#84FF00',
        'warning': '#FBBF24',
        'error': '#FF0055',
        'info': '#00F0FF',

        // Text
        'text-neon': '#00F0FF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
      },

      fontFamily: {
        sans: ['Noto Sans TC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Orbitron', 'Exo 2', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },

      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00F0FF 0%, #FF00FF 100%)',
        'gradient-triple': 'linear-gradient(135deg, #00F0FF 0%, #A855F7 50%, #FF00FF 100%)',
        'gradient-energy': 'linear-gradient(135deg, #84FF00 0%, #00F0FF 100%)',
        'gradient-rare': 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
        'gradient-epic': 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        'gradient-legendary': 'linear-gradient(135deg, #FF6B00 0%, #FF00FF 100%)',
        'grid-pattern': 'linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)',
      },

      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-cyan-strong': '0 0 40px rgba(0, 240, 255, 0.8)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.5)',
        'neon-lime': '0 0 20px rgba(132, 255, 0, 0.5)',
        'glow': '0 0 30px rgba(0, 240, 255, 0.3)',
      },

      animation: {
        'neon-flicker': 'neon-flicker 3s infinite alternate',
        'pulse-danger': 'pulse-danger 2s infinite',
        'blink': 'blink 1s infinite',
        'glitch': 'glitch-animation 5s infinite',
        'grid-scroll': 'grid-scroll 20s linear infinite',
        'float': 'float 8s ease-in-out infinite',
      },

      keyframes: {
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.9' },
        },
        'pulse-danger': {
          '0%, 100%': { boxShadow: '0 0 30px rgba(255, 0, 85, 0.3)' },
          '50%': { boxShadow: '0 0 50px rgba(255, 0, 85, 0.5)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'glitch-animation': {
          '0%, 90%, 100%': { transform: 'translate(0)' },
          '92%': { transform: 'translate(-2px, 2px)' },
          '94%': { transform: 'translate(2px, -2px)' },
          '96%': { transform: 'translate(-2px, -2px)' },
          '98%': { transform: 'translate(2px, 2px)' },
        },
        'grid-scroll': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(40px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(50px, 50px)' },
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

- **純黑背景** - #000000 as base
- **霓虹色彩** - 高飽和度 cyan/magenta/purple
- **未來字體** - Orbitron for headings
- **發光效果** - text-shadow, box-shadow with neon colors
- **動態動畫** - 吸引注意力的動畫
- **網格圖案** - cyberpunk grid backgrounds
- **高對比** - 確保文字清晰可讀
- **稀有度視覺化** - 不同等級不同顏色漸層

### ❌ DON'T

- **避免淺色背景** - 破壞 cyberpunk 氛圍
- **避免柔和色彩** - 需要高飽和度
- **避免傳統字體** - Sans-serif 太平凡
- **避免靜態設計** - 缺乏能量感
- **避免過度模糊** - 霓虹要清晰
- **避免單調配色** - 需要多元霓虹色
- **避免低對比** - 黑背景需足夠亮的文字

---

## 🎯 總結

Buyer Web 以 **DeFi Cyberpunk Neon** 為核心，打造充滿未來感、刺激性、高能量的交易平台。

**核心特色**:
- 🌃 純黑背景（#000000）
- ⚡ 霓虹色彩（Cyan/Magenta/Purple）
- 🎮 未來字體（Orbitron）
- ✨ 發光特效（Glow & Pulse）
- 🎬 動態動畫（Glitch & Float）
- 🔲 網格圖案（Cyberpunk Grid）

---

**相關文件**:
- [Brand Guidelines](./BRAND_GUIDELINES.md)
- [Admin Web Style Guide](./ADMIN_WEB_STYLE_GUIDE.md)
- [POS Web Style Guide](./POS_WEB_STYLE_GUIDE.md)

**最後更新**: 2026-01-25
