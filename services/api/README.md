# @card-erp/api

Card ERP 後端 API 服務，基於 Fastify + Prisma + Redis。

## 快速開始

```bash
# 安裝依賴
pnpm install

# 設定環境變數
cp .env.example .env
# 修改 .env 中的設定值

# 資料庫遷移
pnpm run db:migrate

# 填充測試資料
pnpm run db:seed

# 啟動開發伺服器
pnpm run dev
```

## 專案結構

```
src/
├── config/          # 配置（Zod 驗證環境變數）
│   └── index.ts
├── plugins/         # Fastify 插件
│   ├── prisma.ts    # Prisma Client（資料庫）
│   ├── redis.ts     # Redis Client（快取/Rate Limit）
│   └── auth.ts      # JWT 認證
├── middlewares/      # 中間件
│   ├── cors.ts      # 跨域設定
│   ├── rate-limiter.ts  # 頻率限制
│   └── error-handler.ts # 錯誤處理 + 404
├── utils/           # 工具函數
│   ├── logger.ts    # Pino 日誌
│   └── response.ts  # API 回應格式化
├── modules/         # 業務模組（待開發）
├── types/           # 型別定義
└── server.ts        # 伺服器入口
```

## 指令

| 指令                  | 說明                     |
| --------------------- | ------------------------ |
| `pnpm run dev`        | 啟動開發伺服器（熱重載） |
| `pnpm run build`      | TypeScript 編譯          |
| `pnpm run start`      | 啟動編譯後的伺服器       |
| `pnpm run test`       | 執行測試                 |
| `pnpm run type-check` | 型別檢查                 |
| `pnpm run db:migrate` | 資料庫遷移               |
| `pnpm run db:seed`    | 填充測試資料             |
| `pnpm run db:studio`  | 開啟 Prisma Studio       |
| `pnpm run db:reset`   | 重置資料庫               |

## 新增路由

1. 在 `src/modules/` 建立模組目錄
2. 建立路由檔案，使用 Fastify plugin 模式
3. 在 `server.ts` 中註冊：

```typescript
import productRoutes from './modules/products/routes.js'
await server.register(productRoutes, { prefix: '/api/products' })
```

## 使用 Prisma

路由中透過 `server.prisma` 存取資料庫：

```typescript
server.get('/api/products', async (request) => {
  const products = await server.prisma.product.findMany()
  return successResponse(products)
})
```

## 使用 Redis

路由中透過 `server.redis` 操作快取：

```typescript
await server.redis.set('key', 'value', 'EX', 3600)
const value = await server.redis.get('key')
```

## 認證

需要認證的路由加上 `preHandler`：

```typescript
server.get(
  '/api/protected',
  {
    preHandler: [server.authenticate],
  },
  async (request) => {
    const user = request.user // { id, role }
    return successResponse({ user })
  }
)
```

## 環境變數

| 變數           | 必填 | 預設值                 | 說明                         |
| -------------- | ---- | ---------------------- | ---------------------------- |
| NODE_ENV       | 否   | development            | 環境                         |
| API_PORT       | 否   | 3000                   | 監聽端口                     |
| API_HOST       | 否   | 0.0.0.0                | 監聽地址                     |
| DATABASE_URL   | 是   | -                      | PostgreSQL 連線字串          |
| REDIS_URL      | 否   | redis://localhost:6379 | Redis 連線字串               |
| JWT_SECRET     | 是   | -                      | JWT 簽名密鑰（至少 32 字元） |
| JWT_EXPIRES_IN | 否   | 7d                     | JWT 過期時間                 |
