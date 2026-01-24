# Card ERP - OMO 收藏卡交易平台

線上線下整合的收藏卡、鑑定卡交易系統，支援多賣家寄賣、競標、實體店面掃碼結帳等完整功能。

## 專案結構

```
card-erp/
├── apps/                          # 前端應用
│   ├── buyer-web/                 # 買家端（Nuxt 3 SSR + PWA）
│   ├── admin-web/                 # 後台管理系統（Vue 3 SPA）
│   └── pos-web/                   # 店面結帳系統（Vue 3 PWA）
│
├── services/                      # 後端服務
│   └── api/                       # Fastify API Server
│
├── packages/                      # 共用套件
│   ├── shared-types/              # TypeScript 共用型別定義
│   ├── ui-components/             # Vue 共用元件庫
│   └── utils/                     # 共用工具函數
│
├── docs/                          # 文檔
│   ├── plans/                     # 系統設計文檔
│   └── api/                       # API 文檔
│
├── scripts/                       # 工具腳本
└── .github/workflows/             # CI/CD 配置
```

## 技術棧

### 前端
- **框架**: Vue 3 + Nuxt 3
- **狀態管理**: Pinia
- **UI 框架**: TailwindCSS
- **移動端**: PWA + Capacitor (第二階段)

### 後端
- **框架**: Fastify + TypeScript
- **資料庫**: PostgreSQL (Cloud SQL)
- **快取**: Redis Cloud
- **儲存**: Google Cloud Storage

### 部署
- **前後端**: GCP Cloud Run (zero scaling)
- **資料庫**: Cloud SQL for PostgreSQL
- **CI/CD**: GitHub Actions

### 第三方服務
- **金流**: 綠界 ECPay (信用卡 + LINE Pay)
- **物流**: 7-11 賣貨便 + 全家店到店
- **認證**: Google OAuth + Facebook Login

## 開發階段規劃

### 第一階段：自營線上線下販售系統
- ✅ 商品管理（卡片上架、QR Code 生成）
- ✅ 實體店面掃碼結帳
- ✅ 線上商城（含競標功能）
- ✅ 進貨管理與收入報表
- ✅ 基本賣家欄位（統一抽成）

### 第二階段：買家會員系統
- 🔲 買家註冊登入（OAuth）
- 🔲 購物車與訂單管理
- 🔲 紅利點數系統
- 🔲 訂單追蹤

### 第三階段：賣家管理系統
- 🔲 賣家後台（寄賣申請、商品上架）
- 🔲 賣家等級與抽成管理
- 🔲 銷售報表與對帳系統
- 🔲 退貨機制

### 第四階段：進階功能與優化
- 🔲 後台權限管理（店員、財務等角色）
- 🔲 Capacitor 原生 APP 打包
- 🔲 效能優化與擴展

## 快速開始

詳細開發指南請參考 [docs/plans/](./docs/plans/) 中的設計文檔。

## 文檔

- [產品需求文檔 (PRD)](./docs/PRD.md)
- [系統設計文檔](./docs/plans/)
- [API 文檔](./docs/api/)

## License

Private - All Rights Reserved
