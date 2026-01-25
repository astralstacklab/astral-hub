# Task 22: GCP Cloud Run 部署

## 概述

將系統部署到 Google Cloud Platform (GCP)，使用 Cloud Run 作為應用程式運行環境，Cloud SQL 作為資料庫，並設定 CI/CD 自動部署流程。

## 依賴

- 所有前置任務（01-21）

---

## 一、GCP 專案設定

### 1.1 建立 GCP 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案：`card-erp-production`
3. 啟用以下 API：
   - Cloud Run API
   - Cloud SQL Admin API
   - Cloud Build API
   - Secret Manager API
   - Container Registry API

### 1.2 安裝 gcloud CLI

```bash
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# 初始化
gcloud init
gcloud auth login
gcloud config set project card-erp-production
```

---

## 二、Docker 容器化

### 2.1 API Dockerfile

```dockerfile
# apps/api/Dockerfile

FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

# Build shared-types
WORKDIR /app/packages/shared-types
RUN pnpm build

# Build API
WORKDIR /app/apps/api
RUN pnpm build

# Generate Prisma Client
RUN pnpm prisma generate

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy necessary files
COPY --from=builder --chown=fastify:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=fastify:nodejs /app/packages/shared-types/dist ../packages/shared-types/dist

USER fastify

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/index.js"]
```

### 2.2 Buyer Web Dockerfile

```dockerfile
# apps/buyer-web/Dockerfile

FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/buyer-web/package.json ./apps/buyer-web/

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/apps/buyer-web/node_modules ./apps/buyer-web/node_modules

COPY packages/shared-types ./packages/shared-types
COPY apps/buyer-web ./apps/buyer-web

WORKDIR /app/packages/shared-types
RUN pnpm build

WORKDIR /app/apps/buyer-web
RUN pnpm build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxt

COPY --from=builder --chown=nuxt:nodejs /app/apps/buyer-web/.output ./.output

USER nuxt

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
```

### 2.3 Admin Web Dockerfile

```dockerfile
# apps/admin-web/Dockerfile
# （類似 buyer-web，修改路徑與 port）

FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/admin-web/package.json ./apps/admin-web/

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/apps/admin-web/node_modules ./apps/admin-web/node_modules

COPY packages/shared-types ./packages/shared-types
COPY apps/admin-web ./apps/admin-web

WORKDIR /app/packages/shared-types
RUN pnpm build

WORKDIR /app/apps/admin-web
RUN pnpm build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxt

COPY --from=builder --chown=nuxt:nodejs /app/apps/admin-web/.output ./.output

USER nuxt

EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002

CMD ["node", ".output/server/index.mjs"]
```

### 2.4 POS Web Dockerfile

```dockerfile
# apps/pos-web/Dockerfile
# （類似 buyer-web，修改路徑與 port 3003）

FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/pos-web/package.json ./apps/pos-web/

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/apps/pos-web/node_modules ./apps/pos-web/node_modules

COPY packages/shared-types ./packages/shared-types
COPY apps/pos-web ./apps/pos-web

WORKDIR /app/packages/shared-types
RUN pnpm build

WORKDIR /app/apps/pos-web
RUN pnpm build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxt

COPY --from=builder --chown=nuxt:nodejs /app/apps/pos-web/.output ./.output

USER nuxt

EXPOSE 3003

ENV NODE_ENV=production
ENV PORT=3003

CMD ["node", ".output/server/index.mjs"]
```

### 2.5 .dockerignore

```
# .dockerignore

node_modules
dist
.nuxt
.output
.git
.env
.env.local
*.log
coverage
playwright-report
test-results
```

---

## 三、Cloud SQL 設定

### 3.1 建立 Cloud SQL 實例

```bash
# 建立 PostgreSQL 實例
gcloud sql instances create card-erp-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-east1 \
  --root-password=CHANGE_ME \
  --storage-type=SSD \
  --storage-size=10GB

# 建立資料庫
gcloud sql databases create card_erp --instance=card-erp-db

# 建立使用者
gcloud sql users create card_erp_user \
  --instance=card-erp-db \
  --password=CHANGE_ME
```

### 3.2 建立 Redis (Memory Store)

```bash
# 建立 Redis 實例
gcloud redis instances create card-erp-redis \
  --size=1 \
  --region=asia-east1 \
  --redis-version=redis_7_0
```

---

## 四、Secret Manager 設定

### 4.1 建立機密

```bash
# 資料庫 URL
echo -n "postgresql://card_erp_user:PASSWORD@/card_erp?host=/cloudsql/PROJECT_ID:asia-east1:card-erp-db" | \
  gcloud secrets create DATABASE_URL --data-file=-

# JWT Secret
echo -n "your-super-secret-jwt-key" | \
  gcloud secrets create JWT_SECRET --data-file=-

# ECPay 設定
echo -n "2000132" | gcloud secrets create ECPAY_MERCHANT_ID --data-file=-
echo -n "5294y06JbISpM5x9" | gcloud secrets create ECPAY_HASH_KEY --data-file=-
echo -n "v77hoKGq4kWxNNIS" | gcloud secrets create ECPAY_HASH_IV --data-file=-

# GCS 金鑰
gcloud secrets create GCS_KEY_FILE --data-file=./gcp-key.json
```

---

## 五、Cloud Run 部署

### 5.1 建置並推送映像檔

```bash
# 設定 Artifact Registry（建議使用 Artifact Registry 取代 Container Registry）
gcloud artifacts repositories create card-erp-images \
  --repository-format=docker \
  --location=asia-east1

# 設定 Docker 認證
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 建置 API 映像檔
cd apps/api
docker build -t asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/api:latest -f Dockerfile ../..
docker push asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/api:latest

# 建置 Buyer Web 映像檔
cd apps/buyer-web
docker build -t asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/buyer-web:latest -f Dockerfile ../..
docker push asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/buyer-web:latest

# 建置 Admin Web 映像檔
cd apps/admin-web
docker build -t asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/admin-web:latest -f Dockerfile ../..
docker push asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/admin-web:latest

# 建置 POS Web 映像檔
cd apps/pos-web
docker build -t asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/pos-web:latest -f Dockerfile ../..
docker push asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/pos-web:latest
```

### 5.2 部署到 Cloud Run

```bash
# 部署 API
gcloud run deploy card-erp-api \
  --image=asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/api:latest \
  --region=asia-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --set-cloudsql-instances=PROJECT_ID:asia-east1:card-erp-db \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,ECPAY_MERCHANT_ID=ECPAY_MERCHANT_ID:latest,ECPAY_HASH_KEY=ECPAY_HASH_KEY:latest,ECPAY_HASH_IV=ECPAY_HASH_IV:latest \
  --set-env-vars=NODE_ENV=production,PORT=3001

# 部署 Buyer Web
gcloud run deploy card-erp-buyer-web \
  --image=asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/buyer-web:latest \
  --region=asia-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=256Mi \
  --cpu=1 \
  --set-env-vars=NODE_ENV=production,PORT=3000,NUXT_PUBLIC_API_BASE=https://card-erp-api-xxx.run.app

# 部署 Admin Web
gcloud run deploy card-erp-admin-web \
  --image=asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/admin-web:latest \
  --region=asia-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=3 \
  --memory=256Mi \
  --cpu=1 \
  --set-env-vars=NODE_ENV=production,PORT=3002,NUXT_PUBLIC_API_BASE=https://card-erp-api-xxx.run.app

# 部署 POS Web
gcloud run deploy card-erp-pos-web \
  --image=asia-east1-docker.pkg.dev/PROJECT_ID/card-erp-images/pos-web:latest \
  --region=asia-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=3 \
  --memory=256Mi \
  --cpu=1 \
  --set-env-vars=NODE_ENV=production,PORT=3003,NUXT_PUBLIC_API_BASE=https://card-erp-api-xxx.run.app
```

---

## 六、資料庫 Migration

### 6.1 Cloud Build 執行 Migration

```bash
# 建立 Cloud Build 設定
gcloud builds submit --config=cloudbuild-migrate.yaml
```

```yaml
# cloudbuild-migrate.yaml

steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'asia-east1-docker.pkg.dev/$PROJECT_ID/card-erp-images/api:latest'
      - '-f'
      - 'apps/api/Dockerfile'
      - '.'

  - name: 'asia-east1-docker.pkg.dev/$PROJECT_ID/card-erp-images/api:latest'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        cd apps/api
        npx prisma migrate deploy

    secretEnv: ['DATABASE_URL']

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/DATABASE_URL/versions/latest
      env: 'DATABASE_URL'
```

---

## 七、CI/CD 自動部署

### 7.1 GitHub Actions 工作流程

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches: [main]

env:
  PROJECT_ID: card-erp-production
  REGION: asia-east1
  REPOSITORY: card-erp-images

jobs:
  deploy-api:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ env.PROJECT_ID }}

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and Push API
        run: |
          docker build \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:${{ github.sha }} \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:latest \
            -f apps/api/Dockerfile .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:${{ github.sha }}
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy card-erp-api \
            --image=${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:${{ github.sha }} \
            --region=${{ env.REGION }} \
            --platform=managed

  deploy-buyer-web:
    runs-on: ubuntu-latest
    needs: deploy-api

    steps:
      - uses: actions/checkout@v3

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ env.PROJECT_ID }}

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and Push Buyer Web
        run: |
          docker build \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/buyer-web:${{ github.sha }} \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/buyer-web:latest \
            -f apps/buyer-web/Dockerfile .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/buyer-web:${{ github.sha }}
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/buyer-web:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy card-erp-buyer-web \
            --image=${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/buyer-web:${{ github.sha }} \
            --region=${{ env.REGION }} \
            --platform=managed
```

---

## 八、自訂網域設定

### 8.1 設定網域對應

```bash
# 為 Cloud Run 服務設定自訂網域
gcloud run domain-mappings create \
  --service=card-erp-buyer-web \
  --domain=www.card-erp.com \
  --region=asia-east1

gcloud run domain-mappings create \
  --service=card-erp-api \
  --domain=api.card-erp.com \
  --region=asia-east1

gcloud run domain-mappings create \
  --service=card-erp-admin-web \
  --domain=admin.card-erp.com \
  --region=asia-east1

gcloud run domain-mappings create \
  --service=card-erp-pos-web \
  --domain=pos.card-erp.com \
  --region=asia-east1
```

### 8.2 DNS 設定

在網域註冊商設定以下 DNS 記錄：

```
Type    Name    Value
CNAME   www     ghs.googlehosted.com.
CNAME   api     ghs.googlehosted.com.
CNAME   admin   ghs.googlehosted.com.
CNAME   pos     ghs.googlehosted.com.
```

---

## 九、監控與日誌

### 9.1 Cloud Logging

```bash
# 查看 API 日誌
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=card-erp-api" --limit 50

# 查看錯誤日誌
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 20
```

### 9.2 Cloud Monitoring

1. 前往 Cloud Console > Monitoring
2. 建立 Dashboard
3. 新增以下 Metrics：
   - Request count
   - Request latency
   - Error rate
   - CPU utilization
   - Memory utilization

### 9.3 Alerts 設定

```bash
# 建立告警政策（錯誤率 > 5%）
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

---

## 十、成本優化

### 10.1 Cloud Run 最佳實踐

1. **Min Instances = 0**：閒置時不收費
2. **CPU 分配**：僅在請求時分配
3. **記憶體優化**：依實際需求調整（256Mi-512Mi）
4. **Timeout**：設定合理超時時間（避免長時間掛起）

### 10.2 Cloud SQL 成本控制

```bash
# 開發環境：可在非營業時間關閉
gcloud sql instances patch card-erp-db \
  --activation-policy=NEVER

# 恢復啟動
gcloud sql instances patch card-erp-db \
  --activation-policy=ALWAYS
```

### 10.3 預估成本（每月）

- **Cloud Run**：
  - API (min=0, max=10): ~$10-30
  - Buyer Web (min=0, max=5): ~$5-15
  - Admin/POS (min=0): ~$5-10

- **Cloud SQL**：
  - db-f1-micro (10GB): ~$7-10

- **Redis Memory Store**：
  - 1GB: ~$30

- **Cloud Storage**：
  - 10GB + 流量: ~$5

- **總計**：約 $60-100/月（低流量情況）

---

## 十一、驗收標準

- [ ] 所有服務成功部署到 Cloud Run
- [ ] Cloud SQL 正確設定並可連線
- [ ] Redis Memory Store 正常運作
- [ ] Secret Manager 正確儲存機密
- [ ] 資料庫 Migration 成功執行
- [ ] 自訂網域正確對應
- [ ] CI/CD 自動部署流程正常運作
- [ ] 監控與日誌正確設定
- [ ] 所有環境變數正確配置
- [ ] HTTPS 自動啟用（Cloud Run 預設）

---

## 十二、注意事項

1. **安全性**：
   - 使用 Secret Manager 管理機密
   - 不要將金鑰提交到 Git
   - 啟用 VPC Connector（Cloud SQL 私有 IP）

2. **高可用性**：
   - 設定適當的 max-instances
   - 使用 Cloud CDN 加速靜態資源
   - 定期備份 Cloud SQL

3. **環境分離**：
   - 開發環境使用不同專案
   - 測試環境使用較小規格
   - 正式環境啟用所有監控

4. **成本控制**：
   - 監控每日成本
   - 設定預算告警
   - 定期檢視未使用資源

5. **效能優化**：
   - 啟用 Cloud CDN
   - 使用 Cloud Armor（DDoS 防護）
   - 定期檢視 Cloud Trace

---

## 十三、故障排除

### 13.1 常見問題

**Q: Cloud Run 連接不到 Cloud SQL**
```bash
# 確認 Cloud SQL 連線設定
gcloud run services describe card-erp-api --region=asia-east1 | grep cloudsql
```

**Q: Prisma Migration 失敗**
```bash
# 手動執行 migration
gcloud builds submit --config=cloudbuild-migrate.yaml
```

**Q: 環境變數未生效**
```bash
# 檢查 Cloud Run 環境變數
gcloud run services describe card-erp-api --region=asia-east1 --format=yaml
```

### 13.2 除錯技巧

```bash
# 查看最新部署
gcloud run revisions list --service=card-erp-api --region=asia-east1

# 查看特定 revision 的日誌
gcloud logging read "resource.labels.revision_name=REVISION_NAME" --limit 100

# 測試 Cloud SQL 連線
gcloud sql connect card-erp-db --user=card_erp_user --database=card_erp
```

---

## 十四、後續優化方向

- **Phase 2**：
  - 多區域部署（高可用）
  - Cloud CDN 整合
  - Cloud Armor（WAF）
  - Cloud Trace（效能監控）
  - Serverless VPC Connector（私有網路）
  - 自動擴展策略優化
  - 備份與災難復原計畫

---

## 恭喜！Phase 1 MVP 完成！

所有 22 個任務已完成，系統已成功部署到 GCP Cloud Run。接下來可以進入 Phase 2 開發，加入買家會員系統、賣家管理、進階功能等。
