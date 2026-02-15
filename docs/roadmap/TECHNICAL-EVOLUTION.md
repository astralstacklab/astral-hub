# Card ERP 技術演進路線圖

**文件版本**: 1.0.0
**最後更新**: 2026-01-25
**目的**: 技術架構從 MVP 到規模化的演進策略

---

## 📊 技術棧演進總覽

```
Phase 1 (MVP)          Phase 2 (增強)              Phase 3 (規模化)
─────────────────      ──────────────────          ───────────────────
Monolithic App    →    Enhanced Monolith      →    Microservices*
Cloud Run         →    Cloud Run              →    GKE (Kubernetes)
PostgreSQL        →    PostgreSQL + Redis     →    PostgreSQL HA + Redis Cluster
GCS               →    GCS + CDN              →    Multi-region GCS + CDN
Basic Auth        →    OAuth 2.0              →    OAuth + SSO + MFA
Manual Deploy     →    CI/CD (GitHub Actions) →    GitOps + Auto-scaling

* Microservices 為選配，視規模需求決定
```

---

## 🏗️ 架構演進路線圖

### Phase 1: Monolithic Architecture (單體應用)

```
┌─────────────────────────────────────────────────────────┐
│                      Cloud Run                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  API     │  │ Buyer    │  │  Admin   │  │  POS   │ │
│  │  :3001   │  │  Web     │  │  Web     │  │  Web   │ │
│  │          │  │  :3000   │  │  :3002   │  │  :3003 │ │
│  │ Fastify  │  │ Nuxt 3   │  │ Nuxt 3   │  │ Nuxt 3 │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬───┘ │
│       │             │              │              │     │
└───────┼─────────────┼──────────────┼──────────────┼─────┘
        │             │              │              │
        ├─────────────┴──────────────┴──────────────┘
        │
   ┌────▼─────┐        ┌─────────┐       ┌─────────┐
   │PostgreSQL│        │  Redis  │       │   GCS   │
   │          │        │ (Cache) │       │ (Image) │
   └──────────┘        └─────────┘       └─────────┘
```

**特性**:

- 4 個獨立部署的應用
- 共享資料庫
- 基礎快取策略
- 簡單水平擴展

---

### Phase 2: Enhanced Monolith (強化單體)

```
┌─────────────────────────────────────────────────────────┐
│                   Cloud Run (Auto-scale)                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  API     │  │ Buyer    │  │  Admin   │  │  POS   │ │
│  │  +OAuth  │  │  Web     │  │  Web     │  │  Web   │ │
│  │  +Search │  │  +Social │  │  +BI     │  │        │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬───┘ │
│       │             │              │              │     │
└───────┼─────────────┼──────────────┼──────────────┼─────┘
        │
   ┌────▼─────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐
   │PostgreSQL│   │  Redis   │   │   GCS   │   │ElasticS │
   │          │   │(Enhanced)│   │  +CDN   │   │ Search  │
   │          │   │ Session  │   │Multi-   │   │         │
   │          │   │ Cache    │   │Bucket   │   └─────────┘
   │          │   │ Queue    │   └─────────┘
   └──────────┘   └──────────┘
                        │
                  ┌─────▼──────┐
                  │  SendGrid  │
                  │   (Email)  │
                  └────────────┘
```

**特性**:

- OAuth 2.0 整合
- Elasticsearch 全文搜尋
- Redis 多用途（Session、Cache、Queue）
- CDN 加速
- Email 服務

---

### Phase 3: Microservices (選配) / Scalable Monolith

#### 選項 A: 保持強化單體 + Kubernetes

```
┌────────────────── GKE Cluster ──────────────────────┐
│  ┌─────────────────────────────────────────┐       │
│  │         Ingress / Load Balancer          │       │
│  └────┬────────┬────────┬──────────┬────────┘       │
│       │        │        │          │                │
│  ┌────▼───┐ ┌─▼─────┐ ┌▼──────┐ ┌─▼─────┐         │
│  │API Pod │ │Buyer  │ │Admin  │ │POS    │         │
│  │ x3     │ │Pod x2 │ │Pod x1 │ │Pod x1 │         │
│  └────┬───┘ └───┬───┘ └───┬───┘ └───┬───┘         │
└───────┼─────────┼─────────┼─────────┼──────────────┘
        │         │         │         │
   ┌────▼─────────▼─────────▼─────────▼────┐
   │      Cloud SQL (High Availability)     │
   │      Primary + Read Replica            │
   └────────────────────────────────────────┘
        │
   ┌────▼─────┐   ┌──────────┐   ┌─────────┐
   │  Redis   │   │ Pub/Sub  │   │BigQuery │
   │ Cluster  │   │ (Event)  │   │  (DW)   │
   └──────────┘   └──────────┘   └─────────┘
```

#### 選項 B: Microservices 拆分（大規模時）

```
┌────────────────── GKE Cluster ──────────────────────┐
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐│
│  │Product  │  │ Order   │  │  User   │  │Payment ││
│  │Service  │  │Service  │  │ Service │  │Service ││
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬───┘│
│       │            │             │             │    │
└───────┼────────────┼─────────────┼─────────────┼────┘
        │            │             │             │
   ┌────▼────┐  ┌───▼────┐   ┌────▼────┐  ┌────▼────┐
   │Product  │  │ Order  │   │  User   │  │ Payment │
   │   DB    │  │   DB   │   │   DB    │  │   DB    │
   └─────────┘  └────────┘   └─────────┘  └─────────┘
                      │
                ┌─────▼──────┐
                │  Pub/Sub   │
                │  (Events)  │
                └────────────┘
```

**特性**:

- Kubernetes 自動擴展
- 服務拆分（選配）
- 事件驅動架構
- 資料庫讀寫分離
- 多區域部署能力

---

## 💾 資料庫 Schema 演進

### Phase 1: 核心實體

```sql
-- 核心表格
Product
Order
OrderItem
Auction
Bid
Seller
Admin
Payment
Shipment
```

**總表數**: ~10 tables
**關係**: 基礎 1-to-N, N-to-N
**索引策略**: 基本主鍵與外鍵索引

---

### Phase 2: 會員與社交

```sql
-- Phase 1 +
User (擴展)
MemberLevel
Point
PointTransaction
Coupon
UserCoupon
Review
Wishlist
Follow
Notification
Message
EmailCampaign
Promotion
DiscountCode
```

**總表數**: ~24 tables (+14)
**新增特性**:

- 多對多關係增加
- JSON 欄位（通知內容、優惠券條件）
- 全文搜尋索引（商品名稱、描述）
- 時間序列資料（點數交易、通知）

**Schema 調整**:

```sql
-- User 表擴展
ALTER TABLE "User" ADD COLUMN "memberLevelId" TEXT;
ALTER TABLE "User" ADD COLUMN "totalPoints" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;
ALTER TABLE "User" ADD COLUMN "oauthProvider" TEXT;
ALTER TABLE "User" ADD COLUMN "oauthId" TEXT;

-- Product 表擴展（全文搜尋）
CREATE INDEX "Product_search_idx" ON "Product"
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

---

### Phase 3: 規模化與國際化

```sql
-- Phase 2 +
SellerApplication
Settlement
Withdrawal
Translation (多語系)
Currency
ExchangeRate
ApiKey
WebhookLog
DataExportJob
AnalyticsSnapshot
```

**總表數**: ~34 tables (+10)
**新增特性**:

- 多語系支援（Translation table 或 JSONB）
- 審計日誌（Audit logs）
- 分區表（Partitioning for analytics）
- 物化視圖（Materialized views for reports）

**Schema 調整**:

```sql
-- 多語系支援
CREATE TABLE "Translation" (
  "id" TEXT PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  UNIQUE("entityType", "entityId", "field", "locale")
);

-- 資料分區（訂單表）
CREATE TABLE "Order_2026" PARTITION OF "Order"
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

---

## 🔧 技術棧詳細對比

### 後端 (API)

| 技術層        | Phase 1                 | Phase 2                        | Phase 3                        |
| ------------- | ----------------------- | ------------------------------ | ------------------------------ |
| **框架**      | Fastify 4               | Fastify 4                      | Fastify 4 / NestJS\*           |
| **語言**      | TypeScript 5            | TypeScript 5                   | TypeScript 5                   |
| **ORM**       | Prisma 5                | Prisma 5                       | Prisma 5 + TypeORM\*           |
| **驗證**      | Zod                     | Zod                            | Zod                            |
| **認證**      | JWT (Admin only)        | JWT + OAuth 2.0                | OAuth + SSO + MFA              |
| **API 文件**  | 手動                    | Swagger/OpenAPI                | Swagger + GraphQL\*            |
| **快取**      | Redis (basic)           | Redis (advanced)               | Redis Cluster                  |
| **WebSocket** | 單 Instance 記憶體 Room | Redis Pub/Sub 跨 Instance 同步 | Redis Cluster + Sticky Session |
| **搜尋**      | PostgreSQL LIKE         | Elasticsearch                  | Elasticsearch + AI             |
| **佇列**      | -                       | Redis Bull                     | Pub/Sub                        |
| **測試**      | Vitest (80%)            | Vitest (85%)                   | Vitest (90%)                   |

\* 選配，依需求決定

---

### 前端 (Web)

| 技術層       | Phase 1             | Phase 2              | Phase 3              |
| ------------ | ------------------- | -------------------- | -------------------- |
| **框架**     | Nuxt 3              | Nuxt 3               | Nuxt 3               |
| **UI 庫**    | TailwindCSS         | TailwindCSS + shadcn | TailwindCSS + shadcn |
| **狀態管理** | Pinia               | Pinia                | Pinia                |
| **表單**     | VeeValidate + Zod   | VeeValidate + Zod    | VeeValidate + Zod    |
| **圖表**     | -                   | Chart.js             | Chart.js / D3.js     |
| **國際化**   | -                   | vue-i18n (繁中)      | vue-i18n (多語系)    |
| **PWA**      | 基本設定            | 完整支援             | 完整支援 + 離線      |
| **測試**     | Vitest + Playwright | Vitest + Playwright  | Vitest + Playwright  |
| **SSR**      | SSR                 | SSR + SSG            | SSR + SSG + ISR      |

---

### 行動應用

| 技術層   | Phase 1 | Phase 2 | Phase 3          |
| -------- | ------- | ------- | ---------------- |
| **平台** | -       | -       | React Native     |
| **框架** | -       | -       | Expo             |
| **導航** | -       | -       | React Navigation |
| **狀態** | -       | -       | Redux Toolkit    |
| **推播** | -       | -       | Firebase CM      |
| **認證** | -       | -       | Biometric        |

---

### DevOps & 基礎設施

| 項目            | Phase 1        | Phase 2                | Phase 3                  |
| --------------- | -------------- | ---------------------- | ------------------------ |
| **容器編排**    | Cloud Run      | Cloud Run              | GKE (Kubernetes)         |
| **CI/CD**       | GitHub Actions | GitHub Actions         | GitHub Actions + ArgoCD  |
| **監控**        | Cloud Logging  | Cloud Logging + Sentry | Prometheus + Grafana     |
| **告警**        | 手動           | Cloud Monitoring       | PagerDuty / Opsgenie     |
| **日誌**        | Cloud Logging  | Cloud Logging          | ELK Stack / Loki         |
| **追蹤**        | -              | -                      | Jaeger / Zipkin          |
| **Secret 管理** | Secret Manager | Secret Manager         | Secret Manager + Vault\* |
| **IaC**         | 手動           | Terraform (basic)      | Terraform (full)         |
| **備份**        | Daily backup   | Daily + Point-in-time  | Multi-region backup      |

---

## 🚀 效能指標演進

### 目標效能指標

| 指標                   | Phase 1 (MVP) | Phase 2 | Phase 3 |
| ---------------------- | ------------- | ------- | ------- |
| **API 響應時間 (P95)** | < 500ms       | < 300ms | < 200ms |
| **頁面載入時間 (FCP)** | < 2.5s        | < 2s    | < 1.5s  |
| **同時在線用戶**       | 100           | 1,000   | 10,000+ |
| **每秒請求 (RPS)**     | 50            | 500     | 5,000+  |
| **資料庫查詢時間**     | < 100ms       | < 50ms  | < 30ms  |
| **系統可用性**         | 99.5%         | 99.7%   | 99.9%   |
| **錯誤率**             | < 1%          | < 0.5%  | < 0.1%  |

### 效能優化策略

**Phase 1 → Phase 2:**

- ✅ Redis 快取命中率 > 80%
- ✅ Elasticsearch 搜尋優化
- ✅ CDN 靜態資源快取
- ✅ Database query optimization
- ✅ API response compression

**Phase 2 → Phase 3:**

- ✅ Database read replicas（讀寫分離）
- ✅ Redis Cluster（分散式快取）
- ✅ Multi-region deployment
- ✅ Auto-scaling policies
- ✅ Connection pooling optimization

---

## 🔐 安全性演進

### Phase 1: 基礎安全

```
✓ HTTPS (TLS 1.3)
✓ JWT 認證 (Admin)
✓ Password hashing (bcrypt)
✓ SQL injection 防護 (Prisma)
✓ XSS 防護 (CSP headers)
✓ CSRF 防護 (tokens)
✓ Rate limiting (基礎)
✓ Input validation (Zod)
```

### Phase 2: 增強安全

```
Phase 1 +
✓ OAuth 2.0 整合
✓ Session 管理 (Redis)
✓ API rate limiting (進階)
✓ Content Security Policy (嚴格)
✓ CORS 精確配置
✓ 敏感資料加密 (at rest)
✓ Security headers (Helmet.js)
✓ 圖片內容審核
```

### Phase 3: 企業級安全

```
Phase 2 +
✓ Multi-factor Authentication (MFA)
✓ Single Sign-On (SSO)
✓ API Key 管理與輪換
✓ Audit logging (完整)
✓ DDoS 防護 (Cloud Armor)
✓ WAF (Web Application Firewall)
✓ Secrets rotation (自動)
✓ Penetration testing (定期)
✓ GDPR / 個資法合規
✓ SOC 2 準備
```

---

## 📈 監控與可觀測性演進

### Phase 1: 基礎監控

```yaml
監控項目:
  - Cloud Run metrics (CPU, Memory, Requests)
  - Database connections
  - Error logs (Cloud Logging)
  - Uptime monitoring (外部服務)

告警:
  - HTTP 5xx errors > 10/min
  - Database connection failures
  - Disk usage > 80%
```

### Phase 2: 進階監控

```yaml
監控項目:
  - Application Performance Monitoring (APM)
  - User experience metrics (FCP, LCP, CLS)
  - Business metrics (訂單、GMV)
  - Redis cache hit rate
  - Elasticsearch query performance
  - Email delivery rate

告警:
  - API latency P95 > 300ms
  - Cache hit rate < 70%
  - Payment failure rate > 5%
  - Error rate > 0.5%

工具:
  - Sentry (Error tracking)
  - Google Analytics 4
  - Sentry Performance
```

### Phase 3: 完整可觀測性

```yaml
監控項目:
  - Distributed tracing (跨服務追蹤)
  - Custom business metrics
  - Infrastructure metrics (Kubernetes)
  - Network performance
  - Security events

可觀測性三支柱:
  1. Metrics: Prometheus + Grafana
  2. Logs: ELK Stack / Loki
  3. Traces: Jaeger / Zipkin

SLI/SLO 定義:
  - API availability: 99.9%
  - Payment success rate: 99.5%
  - Search latency P95: < 200ms

On-call 輪值制度
```

---

## 💰 成本優化策略

### Phase 1: 成本控制基礎

```
策略:
  ✓ Cloud Run min-instances=0 (pay-per-use)
  ✓ 合理的 PostgreSQL instance size
  ✓ GCS lifecycle policies (刪除過期檔案)
  ✓ 避免不必要的 API 呼叫

預估成本: $60-100/月
```

### Phase 2: 成本效益平衡

```
策略:
  ✓ Reserved capacity (Cloud SQL)
  ✓ CDN caching (減少 origin 請求)
  ✓ Elasticsearch managed service (成本預估)
  ✓ Email service 用量監控
  ✓ Redis memory optimization

預估成本: $175-350/月
```

### Phase 3: 規模化成本優化

```
策略:
  ✓ Committed use discounts (GCP)
  ✓ Spot instances for batch jobs
  ✓ Storage class optimization (GCS)
  ✓ Query optimization (減少 BigQuery 成本)
  ✓ Auto-scaling 精細調整
  ✓ Multi-region 成本分析

預估成本: $485-1,050/月 (視流量)

成本分配:
  - Compute (GKE): 40%
  - Database: 25%
  - Storage & CDN: 15%
  - Monitoring & Logging: 10%
  - Other services: 10%
```

---

## 🧪 測試策略演進

### Phase 1: 測試基礎

```typescript
單元測試 (Vitest):
  - 覆蓋率目標: 80%
  - Service layer 完整測試
  - Utility functions 測試

整合測試:
  - API endpoints 測試
  - Database operations 測試
  - 覆蓋率目標: 60%

E2E 測試 (Playwright):
  - 關鍵流程：購買、競標、結帳
  - 瀏覽器：Chrome, Firefox
```

### Phase 2: 測試增強

```typescript
Phase 1 +
  單元測試覆蓋率: 85%
  整合測試覆蓋率: 70%

新增測試類型:
  - OAuth flow 測試
  - Email delivery 測試（mock）
  - Search functionality 測試
  - Cache invalidation 測試
  - Rate limiting 測試

Performance testing:
  - Load testing (k6)
  - Stress testing
  - 目標: 500 RPS without degradation
```

### Phase 3: 測試自動化完整

```typescript
Phase 2 +
  單元測試覆蓋率: 90%
  整合測試覆蓋率: 80%

新增測試類型:
  - Contract testing (微服務間)
  - Chaos engineering (Chaos Monkey)
  - Security testing (OWASP ZAP)
  - Accessibility testing (a11y)
  - Visual regression testing

CI/CD 整合:
  - Pre-commit hooks (lint, type-check)
  - PR checks (所有測試必過)
  - Staging 環境 smoke tests
  - Canary deployment testing
  - Rollback automation
```

---

## 🔄 資料遷移策略

### Phase 1 → Phase 2

```sql
-- 新增欄位（向後相容）
ALTER TABLE "User" ADD COLUMN "memberLevelId" TEXT;
ALTER TABLE "User" ADD COLUMN "oauthProvider" TEXT;
ALTER TABLE "Product" ADD COLUMN "viewCount" INTEGER DEFAULT 0;

-- 新增表格
CREATE TABLE "Review" (...);
CREATE TABLE "Wishlist" (...);
CREATE TABLE "MemberLevel" (...);

-- 資料遷移
-- 1. 建立預設會員等級
-- 2. 所有現有用戶設為基礎等級
-- 3. 計算歷史點數（基於訂單）
```

**遷移策略**:

- ✅ Zero-downtime migration
- ✅ 向後相容
- ✅ Rollback plan 準備
- ✅ 資料驗證腳本

### Phase 2 → Phase 3

```sql
-- 多語系支援（大規模 schema 變更）
-- 策略：使用 Translation 表而非修改現有表

-- 分區表（歷史資料）
CREATE TABLE "Order_Archive" AS
  SELECT * FROM "Order" WHERE "createdAt" < '2025-01-01';

-- 建立物化視圖（效能）
CREATE MATERIALIZED VIEW "DailySalesStats" AS
  SELECT DATE(createdAt), COUNT(*), SUM(totalAmount)
  FROM "Order"
  GROUP BY DATE(createdAt);
```

**遷移策略**:

- ✅ Blue-green deployment
- ✅ 資料備份（完整）
- ✅ 段階式遷移（critical tables 優先）
- ✅ 監控與警報

---

## 🎓 技能需求矩陣

### Phase 1 開發團隊

```
必備技能:
  ✓ TypeScript / JavaScript
  ✓ Node.js / Fastify
  ✓ Vue 3 / Nuxt 3
  ✓ PostgreSQL / Prisma
  ✓ Git / GitHub
  ✓ Docker basics
  ✓ GCP basics (Cloud Run, Cloud SQL)

建議人力:
  - Full-stack 工程師 x2
  - 或 Backend x1 + Frontend x1
```

### Phase 2 開發團隊

```
Phase 1 技能 +
  ✓ OAuth 2.0 實作
  ✓ Elasticsearch 操作
  ✓ Redis 進階應用
  ✓ Email service 整合
  ✓ i18n 實作經驗

建議人力:
  - Backend 工程師 x2
  - Frontend 工程師 x1
  - DevOps 工程師 x0.5 (兼職或外包)
```

### Phase 3 開發團隊

```
Phase 2 技能 +
  ✓ Kubernetes 運維
  ✓ Microservices 架構
  ✓ React Native
  ✓ Data engineering basics
  ✓ Performance optimization
  ✓ Security best practices

建議人力:
  - Backend 工程師 x3
  - Frontend 工程師 x2
  - Mobile 工程師 x1
  - DevOps 工程師 x1
  - QA 工程師 x1
  - Data Engineer x0.5 (選配)
```

---

## 📅 技術里程碑時間軸

```
Week 0-2   │ Phase 1: 環境建置 & 資料庫設計
Week 2-4   │ Phase 1: 核心 API 開發
Week 4-6   │ Phase 1: Buyer & Admin 前端
Week 6-8   │ Phase 1: POS & 第三方整合
Week 8-9   │ Phase 1: 測試 & 部署
           │
           │ ✓ Phase 1 上線
           │ ▼ 收集用戶反饋 2 週
           │
Week 11-12 │ Phase 2: OAuth & 會員系統
Week 13-14 │ Phase 2: 社交功能 & 搜尋
Week 14-15 │ Phase 2: 通知系統 & 行銷工具
Week 15-16 │ Phase 2: 測試 & 優化
           │
           │ ✓ Phase 2 上線
           │ ▼ 評估規模化需求
           │
Week 18-20 │ Phase 3: 賣家平台
Week 20-22 │ Phase 3: 國際化 & Mobile App
Week 22-24 │ Phase 3: API 平台 & BI
Week 24-26 │ Phase 3: K8s 遷移 & 優化
           │
           │ ✓ Phase 3 上線
```

---

## 🚨 技術風險與緩解策略

### Phase 1 風險

| 風險             | 影響 | 機率 | 緩解策略                              |
| ---------------- | ---- | ---- | ------------------------------------- |
| ECPay 整合困難   | 高   | 中   | 提前測試、完整文件、預留時間          |
| Cloud Run 冷啟動 | 中   | 高   | min-instances=1 for critical services |
| Prisma 效能問題  | 中   | 低   | Query optimization、索引策略          |
| WebSocket 穩定性 | 中   | 中   | Fallback to polling、心跳機制         |

### Phase 2 風險

| 風險               | 影響 | 機率 | 緩解策略                          |
| ------------------ | ---- | ---- | --------------------------------- |
| Elasticsearch 成本 | 中   | 中   | 評估替代方案（Algolia）、成本監控 |
| OAuth 整合複雜度   | 中   | 中   | 使用成熟 library、詳細測試        |
| 資料遷移錯誤       | 高   | 低   | 完整備份、段階式遷移、驗證腳本    |
| 效能下降           | 高   | 中   | 效能測試、監控、快取策略          |

### Phase 3 風險

| 風險                 | 影響 | 機率 | 緩解策略                         |
| -------------------- | ---- | ---- | -------------------------------- |
| K8s 學習曲線         | 中   | 高   | 培訓、外部顧問、或維持 Cloud Run |
| Microservices 複雜度 | 高   | 中   | 評估必要性、保持 monolith 優先   |
| 多區域部署成本       | 高   | 中   | 段階式部署、成本分析             |
| App Store 審核延遲   | 中   | 中   | 提前送審、預留緩衝時間           |

---

## 🎯 決策樹：何時升級技術架構？

### 是否需要 Elasticsearch？

```
流量 > 1000 用戶/天？
  ├─ 是 → 搜尋延遲 > 500ms？
  │   ├─ 是 → 導入 Elasticsearch ✓
  │   └─ 否 → PostgreSQL 優化即可
  └─ 否 → 等待流量成長
```

### 是否需要 Microservices？

```
團隊規模 > 10 人？
  ├─ 是 → 部署頻率衝突頻繁？
  │   ├─ 是 → 考慮 Microservices
  │   └─ 否 → Monolith 仍可行
  └─ 否 → 保持 Monolith ✓
```

### 是否需要 Kubernetes？

```
Cloud Run 限制遇到瓶頸？
  ├─ 是 → 需要複雜的 auto-scaling？
  │   ├─ 是 → 遷移至 GKE ✓
  │   └─ 否 → Cloud Run 調整配置
  └─ 否 → 保持 Cloud Run ✓
```

---

## 📚 技術文件清單

### Phase 1 必備文件

- [x] API 文件（OpenAPI spec）
- [x] 資料庫 Schema 文件（Prisma schema）
- [x] 部署指南（README）
- [ ] 環境變數說明
- [ ] 本地開發指南
- [ ] 測試指南

### Phase 2 新增文件

- [ ] OAuth 整合指南
- [ ] Elasticsearch 索引策略
- [ ] Redis 快取策略
- [ ] Email 模板指南
- [ ] 多語系翻譯流程

### Phase 3 新增文件

- [ ] Kubernetes 部署指南
- [ ] Microservices 溝通協議
- [ ] API 使用文件（對外）
- [ ] 資料倉儲架構
- [ ] 災難復原計劃
- [ ] SLA 與 SLO 定義

---

## 🔗 相關資源

### 學習資源

**Phase 1:**

- [Fastify 官方文件](https://www.fastify.io/)
- [Nuxt 3 官方文件](https://nuxt.com/)
- [Prisma 最佳實踐](https://www.prisma.io/docs)
- [GCP Cloud Run 指南](https://cloud.google.com/run/docs)

**Phase 2:**

- [OAuth 2.0 完全指南](https://oauth.net/2/)
- [Elasticsearch 入門](https://www.elastic.co/guide/)
- [Redis 最佳實踐](https://redis.io/docs/manual/)

**Phase 3:**

- [Kubernetes 官方教學](https://kubernetes.io/docs/)
- [Microservices 模式](https://microservices.io/)
- [React Native 文件](https://reactnative.dev/)

---

## ✅ 檢查清單：準備技術升級

### Phase 1 → Phase 2 升級前

- [ ] Phase 1 所有功能穩定運行
- [ ] 效能基準測試完成
- [ ] 資料備份策略建立
- [ ] 監控系統正常運作
- [ ] 團隊熟悉現有技術棧
- [ ] Phase 2 技術 POC 完成（OAuth、Elasticsearch）

### Phase 2 → Phase 3 升級前

- [ ] Phase 2 功能穩定運行 1 個月+
- [ ] 明確的規模化需求（用戶數、流量）
- [ ] 成本效益分析完成
- [ ] 團隊技能評估（K8s、Mobile）
- [ ] 基礎設施準備（GKE cluster）
- [ ] 遷移計劃與時程確認

---

**此文件會隨技術演進持續更新**

最後更新：2026-01-25
維護者：技術團隊
下次 Review：Phase 1 完成時
