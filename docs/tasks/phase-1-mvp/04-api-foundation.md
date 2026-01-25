# 04 - API 基礎架構

**階段**: 第一階段 MVP - Sprint 1
**預計時間**: 2 天
**負責人**: TBD
**優先級**: 🔴 Critical

---

## 📋 目標

建立 Fastify API 伺服器的基礎架構，包含 plugins、middlewares、錯誤處理、日誌系統、認證機制等，為後續業務模組開發奠定基礎。

## 🎯 成功標準

- [ ] Fastify 伺服器可正常啟動並監聽指定端口
- [ ] Prisma Client 整合成功
- [ ] Redis Client 整合成功
- [ ] JWT 認證機制運作正常
- [ ] 錯誤處理中間件正確捕捉並格式化錯誤
- [ ] 日誌系統記錄所有請求與錯誤
- [ ] CORS 配置正確
- [ ] Health check endpoint 正常運作

## 📦 前置條件

**前置任務**:
- [x] 01 - 環境建置完成
- [x] 02 - shared-types 套件完成
- [x] 03 - 資料庫設計完成

**技術需求**:
- Fastify 4.x
- Prisma Client
- ioredis
- jsonwebtoken

---

## ✅ 子任務清單

### 4.1 專案結構建立

#### 4.1.1 建立 API 專案結構
- [ ] 建立 `services/api/` 目錄結構
  ```
  services/api/
  ├── src/
  │   ├── modules/         # 業務模組
  │   │   └── .gitkeep
  │   ├── plugins/         # Fastify plugins
  │   │   ├── prisma.ts
  │   │   ├── redis.ts
  │   │   └── auth.ts
  │   ├── middlewares/     # 中間件
  │   │   ├── error-handler.ts
  │   │   ├── rate-limiter.ts
  │   │   └── cors.ts
  │   ├── utils/           # 工具函數
  │   │   ├── logger.ts
  │   │   └── response.ts
  │   ├── types/           # 型別定義
  │   │   └── index.ts
  │   ├── config/          # 配置
  │   │   └── index.ts
  │   └── server.ts        # 伺服器入口
  ├── tests/               # 測試
  ├── prisma/              # Prisma (已存在)
  ├── package.json
  ├── tsconfig.json
  └── .env
  ```

#### 4.1.2 配置 package.json
- [ ] 建立 `services/api/package.json`
  ```json
  {
    "name": "@card-erp/api",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "tsx watch src/server.ts",
      "build": "tsc",
      "start": "node dist/server.js",
      "test": "vitest",
      "type-check": "tsc --noEmit"
    },
    "dependencies": {
      "@card-erp/shared-types": "workspace:*",
      "@fastify/cors": "^8.4.0",
      "@fastify/jwt": "^7.2.0",
      "@fastify/rate-limit": "^9.0.0",
      "@prisma/client": "^5.7.0",
      "fastify": "^4.24.0",
      "ioredis": "^5.3.2",
      "pino": "^8.16.0",
      "zod": "^3.22.0"
    },
    "devDependencies": {
      "@types/node": "^20.9.0",
      "prisma": "^5.7.0",
      "tsx": "^4.6.0",
      "typescript": "^5.2.0",
      "vitest": "^1.0.0"
    }
  }
  ```

#### 4.1.3 配置 TypeScript
- [ ] 建立 `services/api/tsconfig.json`
  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./src",
      "moduleResolution": "bundler",
      "types": ["node"],
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "tests"]
  }
  ```

---

### 4.2 配置系統

#### 4.2.1 建立配置管理
- [ ] 建立 `src/config/index.ts`
  ```typescript
  import { z } from 'zod'

  const configSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']),
    API_PORT: z.string().transform(Number),
    API_HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    // 新增其他環境變數
  })

  export type Config = z.infer<typeof configSchema>

  export const config: Config = configSchema.parse(process.env)
  ```

#### 4.2.2 驗證配置
- [ ] 確保所有必要環境變數存在
- [ ] 啟動時驗證配置正確性

---

### 4.3 Logger（日誌系統）

#### 4.3.1 建立 Logger
- [ ] 建立 `src/utils/logger.ts`
  ```typescript
  import pino from 'pino'
  import { config } from '@/config'

  export const logger = pino({
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      config.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  })
  ```

#### 4.3.2 整合到 Fastify
- [ ] 在伺服器初始化時註冊 logger
  ```typescript
  const server = fastify({
    logger: logger
  })
  ```

---

### 4.4 Plugins（插件）

#### 4.4.1 Prisma Plugin
- [ ] 建立 `src/plugins/prisma.ts`
  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import fp from 'fastify-plugin'
  import { PrismaClient } from '@prisma/client'

  declare module 'fastify' {
    interface FastifyInstance {
      prisma: PrismaClient
    }
  }

  const prismaPlugin: FastifyPluginAsync = async (server) => {
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    })

    await prisma.$connect()

    server.decorate('prisma', prisma)

    server.addHook('onClose', async (server) => {
      await server.prisma.$disconnect()
    })
  }

  export default fp(prismaPlugin)
  ```

#### 4.4.2 Redis Plugin
- [ ] 建立 `src/plugins/redis.ts`
  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import fp from 'fastify-plugin'
  import Redis from 'ioredis'
  import { config } from '@/config'

  declare module 'fastify' {
    interface FastifyInstance {
      redis: Redis
    }
  }

  const redisPlugin: FastifyPluginAsync = async (server) => {
    const redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
    })

    redis.on('error', (err) => {
      server.log.error('Redis error:', err)
    })

    redis.on('connect', () => {
      server.log.info('Redis connected')
    })

    server.decorate('redis', redis)

    server.addHook('onClose', async (server) => {
      await server.redis.quit()
    })
  }

  export default fp(redisPlugin)
  ```

#### 4.4.3 Auth Plugin (JWT)
- [ ] 建立 `src/plugins/auth.ts`
  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import fp from 'fastify-plugin'
  import jwt from '@fastify/jwt'
  import { config } from '@/config'

  const authPlugin: FastifyPluginAsync = async (server) => {
    server.register(jwt, {
      secret: config.JWT_SECRET,
      sign: {
        expiresIn: config.JWT_EXPIRES_IN,
      },
    })

    server.decorate('authenticate', async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '未授權的請求',
          },
        })
      }
    })
  }

  declare module 'fastify' {
    interface FastifyInstance {
      authenticate: (
        request: FastifyRequest,
        reply: FastifyReply
      ) => Promise<void>
    }
  }

  export default fp(authPlugin)
  ```

---

### 4.5 Middlewares（中間件）

#### 4.5.1 CORS 中間件
- [ ] 建立 `src/middlewares/cors.ts`
  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import cors from '@fastify/cors'
  import { config } from '@/config'

  const corsMiddleware: FastifyPluginAsync = async (server) => {
    await server.register(cors, {
      origin:
        config.NODE_ENV === 'production'
          ? ['https://card-erp.com', 'https://admin.card-erp.com']
          : true,
      credentials: true,
    })
  }

  export default corsMiddleware
  ```

#### 4.5.2 Rate Limiter 中間件
- [ ] 建立 `src/middlewares/rate-limiter.ts`
  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import rateLimit from '@fastify/rate-limit'

  const rateLimiterMiddleware: FastifyPluginAsync = async (server) => {
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      redis: server.redis,
    })
  }

  export default rateLimiterMiddleware
  ```

#### 4.5.3 錯誤處理中間件
- [ ] 建立 `src/middlewares/error-handler.ts`
  ```typescript
  import { FastifyPluginAsync, FastifyError } from 'fastify'
  import { ZodError } from 'zod'

  const errorHandlerMiddleware: FastifyPluginAsync = async (server) => {
    server.setErrorHandler((error, request, reply) => {
      server.log.error(error)

      // Zod 驗證錯誤
      if (error instanceof ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '請求參數驗證失敗',
            details: error.errors,
          },
        })
      }

      // Fastify 錯誤
      if ((error as FastifyError).statusCode) {
        return reply.code((error as FastifyError).statusCode!).send({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        })
      }

      // 其他錯誤
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '伺服器內部錯誤',
        },
      })
    })
  }

  export default errorHandlerMiddleware
  ```

---

### 4.6 工具函數

#### 4.6.1 回應格式化工具
- [ ] 建立 `src/utils/response.ts`
  ```typescript
  import type { SuccessResponse, ErrorResponse } from '@card-erp/shared-types'

  export function successResponse<T>(
    data: T,
    meta?: Record<string, unknown>
  ): SuccessResponse<T> {
    return {
      success: true,
      data,
      meta,
    }
  }

  export function errorResponse(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
    }
  }
  ```

---

### 4.7 伺服器入口

#### 4.7.1 建立 server.ts
- [ ] 建立 `src/server.ts`
  ```typescript
  import Fastify from 'fastify'
  import { config } from './config'
  import { logger } from './utils/logger'

  // Plugins
  import prismaPlugin from './plugins/prisma'
  import redisPlugin from './plugins/redis'
  import authPlugin from './plugins/auth'

  // Middlewares
  import corsMiddleware from './middlewares/cors'
  import rateLimiterMiddleware from './middlewares/rate-limiter'
  import errorHandlerMiddleware from './middlewares/error-handler'

  async function buildServer() {
    const server = Fastify({
      logger,
    })

    // 註冊 plugins
    await server.register(prismaPlugin)
    await server.register(redisPlugin)
    await server.register(authPlugin)

    // 註冊 middlewares
    await server.register(corsMiddleware)
    await server.register(rateLimiterMiddleware)
    await server.register(errorHandlerMiddleware)

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    // 未來業務路由將在此註冊
    // await server.register(productsRoutes, { prefix: '/api/products' })

    return server
  }

  async function start() {
    try {
      const server = await buildServer()

      await server.listen({
        port: config.API_PORT,
        host: config.API_HOST,
      })

      server.log.info(`Server listening on ${config.API_HOST}:${config.API_PORT}`)
    } catch (err) {
      logger.error(err)
      process.exit(1)
    }
  }

  start()
  ```

#### 4.7.2 測試伺服器啟動
- [ ] 執行 `pnpm --filter @card-erp/api dev`
- [ ] 驗證伺服器啟動成功
- [ ] 測試 `/health` endpoint

---

### 4.8 測試

#### 4.8.1 建立測試輔助函數
- [ ] 建立 `tests/helpers.ts`
  ```typescript
  import { FastifyInstance } from 'fastify'
  import { buildServer } from '@/server'

  export async function buildTestServer(): Promise<FastifyInstance> {
    const server = await buildServer()
    return server
  }

  export async function closeTestServer(server: FastifyInstance) {
    await server.close()
  }
  ```

#### 4.8.2 建立基礎測試
- [ ] 建立 `tests/server.test.ts`
  ```typescript
  import { describe, it, expect, beforeAll, afterAll } from 'vitest'
  import { buildTestServer, closeTestServer } from './helpers'
  import { FastifyInstance } from 'fastify'

  describe('Server', () => {
    let server: FastifyInstance

    beforeAll(async () => {
      server = await buildTestServer()
    })

    afterAll(async () => {
      await closeTestServer(server)
    })

    it('should start successfully', () => {
      expect(server).toBeDefined()
    })

    it('should respond to health check', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.status).toBe('ok')
      expect(json.timestamp).toBeDefined()
    })
  })
  ```

---

### 4.9 文檔

#### 4.9.1 建立 API 開發指南
- [ ] 建立 `services/api/README.md`
  - 專案結構說明
  - 如何啟動開發伺服器
  - 如何新增路由
  - 如何使用 Prisma
  - 如何使用 Redis

#### 4.9.2 建立錯誤碼文檔
- [ ] 建立 `docs/api/error-codes.md`
  - 列出所有錯誤碼
  - 錯誤訊息格式
  - 錯誤處理最佳實踐

---

## 🧪 測試步驟

1. **環境變數測試**
   ```bash
   pnpm --filter @card-erp/api validate-env
   ```

2. **啟動測試**
   ```bash
   pnpm --filter @card-erp/api dev
   ```

3. **Health Check 測試**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Prisma 連接測試**
   - 在路由中執行簡單查詢
   - 驗證資料庫連接正常

5. **Redis 連接測試**
   - 執行 SET/GET 操作
   - 驗證 Redis 連接正常

6. **JWT 測試**
   - 生成 Token
   - 驗證 Token
   - 測試過期 Token

7. **錯誤處理測試**
   - 觸發 404 錯誤
   - 觸發 500 錯誤
   - 驗證錯誤格式正確

8. **Rate Limit 測試**
   - 短時間內發送超過 100 個請求
   - 驗證 429 錯誤回應

---

## 📝 交付物

- [ ] `services/api/src/` 完整目錄結構
- [ ] `src/server.ts`
- [ ] `src/plugins/` 所有 plugins
- [ ] `src/middlewares/` 所有 middlewares
- [ ] `src/utils/logger.ts`
- [ ] `src/utils/response.ts`
- [ ] `src/config/index.ts`
- [ ] `tests/server.test.ts`
- [ ] `services/api/README.md`
- [ ] `docs/api/error-codes.md`

---

## 🚨 注意事項

1. **環境變數安全**: 不要將 JWT_SECRET 提交到版本控制
2. **錯誤訊息**: 生產環境不要暴露詳細錯誤堆疊
3. **日誌等級**: 生產環境使用 info，開發環境使用 debug
4. **連接池**: Prisma 和 Redis 需要適當配置連接池
5. **優雅關閉**: 確保伺服器關閉時正確清理資源

---

## 🔗 相關文件

- [Fastify 文檔](https://www.fastify.io/)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [ioredis](https://github.com/redis/ioredis)
- [Pino Logger](https://getpino.io/)

---

## 📊 進度追蹤

| 子任務 | 狀態 | 負責人 | 完成日期 |
|--------|------|--------|---------|
| 4.1 專案結構 | ⏳ 未開始 | - | - |
| 4.2 配置系統 | ⏳ 未開始 | - | - |
| 4.3 Logger | ⏳ 未開始 | - | - |
| 4.4 Plugins | ⏳ 未開始 | - | - |
| 4.5 Middlewares | ⏳ 未開始 | - | - |
| 4.6 工具函數 | ⏳ 未開始 | - | - |
| 4.7 伺服器入口 | ⏳ 未開始 | - | - |
| 4.8 測試 | ⏳ 未開始 | - | - |
| 4.9 文檔 | ⏳ 未開始 | - | - |

---

**上一個任務**: [03 - 資料庫設計](./03-database-schema.md)
**下一個任務**: [05 - 商品 API](./05-api-products.md)
