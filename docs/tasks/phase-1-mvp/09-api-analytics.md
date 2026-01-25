# Task 09: 報表分析 API

## 概述

建立報表分析 API，提供銷售統計、商品分析、賣家佣金計算等功能，並支援 CSV 匯出。

## 依賴

- Task 03: Database Schema（Prisma schema 已建立）
- Task 04: API Foundation（Fastify server 已就緒）
- Task 07: Orders API（訂單資料）
- Task 08: Payments API（金流資料）

---

## 一、資料庫擴充

### 1.1 新增報表快照表（可選）

如需保存歷史報表快照，可新增 `AnalyticsSnapshot` 表：

```prisma
// apps/api/prisma/schema.prisma

model AnalyticsSnapshot {
  id         String   @id @default(uuid())
  reportType String   // "daily_sales", "weekly_sales", "monthly_sales"
  period     String   // "2026-01-25", "2026-W04", "2026-01"
  data       Json     // 報表 JSON 資料
  createdAt  DateTime @default(now())

  @@unique([reportType, period])
  @@index([reportType])
  @@map("analytics_snapshots")
}
```

執行 migration：

```bash
cd apps/api
pnpm prisma migrate dev --name add_analytics_snapshot
```

---

## 二、Shared Types 定義

### 2.1 報表類型

```typescript
// packages/shared-types/src/analytics.ts

import { z } from 'zod'

/**
 * 時間範圍類型
 */
export enum AnalyticsPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

/**
 * 銷售報表查詢參數
 */
export const QuerySalesReportSchema = z.object({
  period: z.nativeEnum(AnalyticsPeriod),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
export type QuerySalesReportInput = z.infer<typeof QuerySalesReportSchema>

/**
 * 銷售報表響應
 */
export interface SalesReportOutput {
  period: AnalyticsPeriod
  startDate: string
  endDate: string
  summary: {
    totalRevenue: string // Decimal as string
    totalOrders: number
    totalProducts: number
    averageOrderValue: string
  }
  breakdown: {
    selfOperated: {
      revenue: string
      orders: number
      products: number
    }
    consignment: {
      revenue: string
      orders: number
      products: number
      commission: string // 平台抽成
    }
  }
  channels: {
    online: {
      revenue: string
      orders: number
    }
    pos: {
      revenue: string
      orders: number
    }
  }
  dailyData: Array<{
    date: string
    revenue: string
    orders: number
  }>
}

/**
 * 商品統計查詢參數
 */
export const QueryProductStatsSchema = z.object({
  period: z.nativeEnum(AnalyticsPeriod).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type QueryProductStatsInput = z.infer<typeof QueryProductStatsSchema>

/**
 * 商品統計響應
 */
export interface ProductStatsOutput {
  topSelling: Array<{
    productId: string
    productName: string
    category: string
    totalSold: number
    totalRevenue: string
  }>
  inventory: {
    totalProducts: number
    pending: number
    available: number
    sold: number
    consignment: number
  }
  categoryBreakdown: Array<{
    category: string
    count: number
    revenue: string
  }>
}

/**
 * 賣家佣金查詢參數
 */
export const QuerySellerCommissionSchema = z.object({
  sellerId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type QuerySellerCommissionInput = z.infer<typeof QuerySellerCommissionSchema>

/**
 * 賣家佣金響應
 */
export interface SellerCommissionOutput {
  sellers: Array<{
    sellerId: string
    sellerName: string
    tier: string // BRONZE | SILVER | GOLD
    totalProducts: number
    soldProducts: number
    totalRevenue: string
    platformCommission: string // 平台抽成
    sellerEarnings: string // 賣家所得
    commissionRate: number // 抽成比例（%）
  }>
}

/**
 * 儀表板數據響應
 */
export interface DashboardOutput {
  overview: {
    totalRevenue: string
    totalOrders: number
    totalProducts: number
    activeSellers: number
  }
  recentTrends: {
    last7Days: {
      revenue: string
      orders: number
      growth: number // 成長率（%）
    }
    last30Days: {
      revenue: string
      orders: number
      growth: number
    }
  }
  quickStats: {
    pendingOrders: number
    pendingPayments: number
    lowStockProducts: number
    activeAuctions: number
  }
}

/**
 * CSV 匯出請求
 */
export const ExportCSVSchema = z.object({
  reportType: z.enum(['sales', 'products', 'sellers']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type ExportCSVInput = z.infer<typeof ExportCSVSchema>
```

---

## 三、API Service 層

### 3.1 AnalyticsService

```typescript
// apps/api/src/services/analytics.service.ts

import { PrismaClient, ProductStatus, OrderStatus, PaymentStatus } from '@prisma/client'
import { Redis } from 'ioredis'
import {
  QuerySalesReportInput,
  SalesReportOutput,
  QueryProductStatsInput,
  ProductStatsOutput,
  QuerySellerCommissionInput,
  SellerCommissionOutput,
  DashboardOutput,
  AnalyticsPeriod,
} from '@card-erp/shared-types'
import { addDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'

export class AnalyticsService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  /**
   * 獲取銷售報表
   */
  async getSalesReport(query: QuerySalesReportInput): Promise<SalesReportOutput> {
    const { period, startDate, endDate } = query

    // 計算日期範圍
    const start = startOfDay(new Date(startDate))
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(start)

    // Redis 快取 key
    const cacheKey = `analytics:sales:${period}:${startDate}:${endDate || startDate}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // 查詢已完成且已付款的訂單
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                sourceType: true,
                sellerId: true,
              },
            },
          },
        },
      },
    })

    // 計算總覽數據
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    const totalOrders = orders.length
    const totalProducts = orders.reduce((sum, order) => sum + order.orderItems.length, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // 計算自營 vs 寄賣
    let selfRevenue = 0
    let selfOrders = 0
    let selfProducts = 0
    let consignRevenue = 0
    let consignOrders = 0
    let consignProducts = 0
    let consignCommission = 0

    const orderSet = new Set<string>()

    orders.forEach(order => {
      const hasSelf = order.orderItems.some(item => item.product.sourceType === 'SELF_OPERATED')
      const hasConsign = order.orderItems.some(item => item.product.sourceType === 'CONSIGNMENT')

      if (hasSelf && !hasConsign) {
        selfRevenue += Number(order.totalAmount)
        selfOrders += 1
        selfProducts += order.orderItems.length
        orderSet.add(order.id + '_self')
      } else if (hasConsign && !hasSelf) {
        consignRevenue += Number(order.totalAmount)
        consignOrders += 1
        consignProducts += order.orderItems.length
        orderSet.add(order.id + '_consign')

        // 計算佣金（假設平均抽成 15%）
        order.orderItems.forEach(item => {
          if (item.product.sourceType === 'CONSIGNMENT') {
            consignCommission += Number(item.subtotal) * 0.15
          }
        })
      } else {
        // 混合訂單（既有自營又有寄賣）
        order.orderItems.forEach(item => {
          if (item.product.sourceType === 'SELF_OPERATED') {
            selfRevenue += Number(item.subtotal)
            selfProducts += 1
          } else {
            consignRevenue += Number(item.subtotal)
            consignProducts += 1
            consignCommission += Number(item.subtotal) * 0.15
          }
        })
        if (hasSelf) selfOrders += 1
        if (hasConsign) consignOrders += 1
      }
    })

    // 計算線上 vs POS
    const onlineOrders = orders.filter(o => o.channel === 'ONLINE')
    const posOrders = orders.filter(o => o.channel === 'POS')
    const onlineRevenue = onlineOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const posRevenue = posOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)

    // 計算每日數據
    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    const days = eachDayOfInterval({ start, end })

    days.forEach(day => {
      const dateKey = day.toISOString().split('T')[0]
      dailyMap.set(dateKey, { revenue: 0, orders: 0 })
    })

    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      const existing = dailyMap.get(dateKey) || { revenue: 0, orders: 0 }
      dailyMap.set(dateKey, {
        revenue: existing.revenue + Number(order.totalAmount),
        orders: existing.orders + 1,
      })
    })

    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue.toFixed(2),
      orders: data.orders,
    }))

    const result: SalesReportOutput = {
      period,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders,
        totalProducts,
        averageOrderValue: averageOrderValue.toFixed(2),
      },
      breakdown: {
        selfOperated: {
          revenue: selfRevenue.toFixed(2),
          orders: selfOrders,
          products: selfProducts,
        },
        consignment: {
          revenue: consignRevenue.toFixed(2),
          orders: consignOrders,
          products: consignProducts,
          commission: consignCommission.toFixed(2),
        },
      },
      channels: {
        online: {
          revenue: onlineRevenue.toFixed(2),
          orders: onlineOrders.length,
        },
        pos: {
          revenue: posRevenue.toFixed(2),
          orders: posOrders.length,
        },
      },
      dailyData,
    }

    // 快取 5 分鐘
    await this.redis.setex(cacheKey, 300, JSON.stringify(result))

    return result
  }

  /**
   * 獲取商品統計
   */
  async getProductStats(query: QueryProductStatsInput): Promise<ProductStatsOutput> {
    const { startDate, endDate, limit } = query

    const cacheKey = `analytics:products:${startDate || 'all'}:${endDate || 'all'}:${limit}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // 日期範圍條件
    const dateFilter = startDate && endDate
      ? {
          createdAt: {
            gte: startOfDay(new Date(startDate)),
            lte: endOfDay(new Date(endDate)),
          },
        }
      : {}

    // 暢銷商品（基於 OrderItem）
    const topSellingData = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: OrderStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          ...dateFilter,
        },
      },
      _count: {
        productId: true,
      },
      _sum: {
        subtotal: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: limit,
    })

    const topSellingIds = topSellingData.map(item => item.productId)
    const products = await this.prisma.product.findMany({
      where: { id: { in: topSellingIds } },
      select: { id: true, name: true, category: true },
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    const topSelling = topSellingData.map(item => {
      const product = productMap.get(item.productId)
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown',
        category: product?.category || 'Unknown',
        totalSold: item._count.productId,
        totalRevenue: (item._sum.subtotal || 0).toString(),
      }
    })

    // 庫存統計
    const inventoryStats = await this.prisma.product.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    })

    const inventory = {
      totalProducts: inventoryStats.reduce((sum, s) => sum + s._count.status, 0),
      pending: inventoryStats.find(s => s.status === ProductStatus.PENDING)?._count.status || 0,
      available: inventoryStats.find(s => s.status === ProductStatus.AVAILABLE)?._count.status || 0,
      sold: inventoryStats.find(s => s.status === ProductStatus.SOLD)?._count.status || 0,
      consignment:
        inventoryStats.reduce((sum, s) => sum + s._count.status, 0) -
        (inventoryStats.find(s => s.status === ProductStatus.SOLD)?._count.status || 0),
    }

    // 類別統計
    const categoryStats = await this.prisma.product.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    })

    // 計算各類別營收（需要關聯 OrderItem）
    const categoryRevenue = await this.prisma.$queryRaw<
      Array<{ category: string; revenue: number }>
    >`
      SELECT p.category, SUM(oi.subtotal) as revenue
      FROM products p
      INNER JOIN order_items oi ON oi.product_id = p.id
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.status = ${OrderStatus.COMPLETED}
        AND o.payment_status = ${PaymentStatus.PAID}
      GROUP BY p.category
    `

    const revenueMap = new Map(categoryRevenue.map(c => [c.category, c.revenue]))

    const categoryBreakdown = categoryStats.map(cat => ({
      category: cat.category,
      count: cat._count.category,
      revenue: (revenueMap.get(cat.category) || 0).toString(),
    }))

    const result: ProductStatsOutput = {
      topSelling,
      inventory,
      categoryBreakdown,
    }

    await this.redis.setex(cacheKey, 300, JSON.stringify(result))

    return result
  }

  /**
   * 獲取賣家佣金報表
   */
  async getSellerCommission(query: QuerySellerCommissionInput): Promise<SellerCommissionOutput> {
    const { sellerId, startDate, endDate } = query

    const start = startOfDay(new Date(startDate))
    const end = endOfDay(new Date(endDate))

    const cacheKey = `analytics:sellers:${sellerId || 'all'}:${startDate}:${endDate}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // 查詢賣家
    const sellers = await this.prisma.seller.findMany({
      where: sellerId ? { id: sellerId } : undefined,
      include: {
        products: {
          where: {
            sourceType: 'CONSIGNMENT',
          },
          include: {
            orderItems: {
              where: {
                order: {
                  status: OrderStatus.COMPLETED,
                  paymentStatus: PaymentStatus.PAID,
                  createdAt: { gte: start, lte: end },
                },
              },
            },
          },
        },
      },
    })

    const sellersData = sellers.map(seller => {
      const totalProducts = seller.products.length
      const soldProducts = seller.products.filter(p => p.status === ProductStatus.SOLD).length

      let totalRevenue = 0
      seller.products.forEach(product => {
        product.orderItems.forEach(item => {
          totalRevenue += Number(item.subtotal)
        })
      })

      // 根據賣家等級計算抽成比例
      let commissionRate = 0.15 // BRONZE: 15%
      if (seller.tier === 'SILVER') commissionRate = 0.10
      if (seller.tier === 'GOLD') commissionRate = 0.05

      const platformCommission = totalRevenue * commissionRate
      const sellerEarnings = totalRevenue - platformCommission

      return {
        sellerId: seller.id,
        sellerName: seller.name,
        tier: seller.tier,
        totalProducts,
        soldProducts,
        totalRevenue: totalRevenue.toFixed(2),
        platformCommission: platformCommission.toFixed(2),
        sellerEarnings: sellerEarnings.toFixed(2),
        commissionRate: commissionRate * 100,
      }
    })

    const result: SellerCommissionOutput = {
      sellers: sellersData,
    }

    await this.redis.setex(cacheKey, 300, JSON.stringify(result))

    return result
  }

  /**
   * 獲取儀表板數據
   */
  async getDashboard(): Promise<DashboardOutput> {
    const cacheKey = 'analytics:dashboard'
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // 總覽數據
    const [totalRevenue, totalOrders, totalProducts, activeSellers] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, paymentStatus: PaymentStatus.PAID },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.COMPLETED, paymentStatus: PaymentStatus.PAID },
      }),
      this.prisma.product.count(),
      this.prisma.seller.count({ where: { status: 'ACTIVE' } }),
    ])

    // 近 7 天數據
    const last7DaysStart = addDays(new Date(), -7)
    const last7DaysOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: last7DaysStart },
      },
    })
    const last7DaysRevenue = last7DaysOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)

    // 近 30 天數據
    const last30DaysStart = addDays(new Date(), -30)
    const last30DaysOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: last30DaysStart },
      },
    })
    const last30DaysRevenue = last30DaysOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)

    // 計算成長率（與前一週期對比）
    const prev7DaysStart = addDays(new Date(), -14)
    const prev7DaysEnd = addDays(new Date(), -7)
    const prev7DaysOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: prev7DaysStart, lt: prev7DaysEnd },
      },
    })
    const prev7DaysRevenue = prev7DaysOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const growth7Days =
      prev7DaysRevenue > 0 ? ((last7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue) * 100 : 0

    const prev30DaysStart = addDays(new Date(), -60)
    const prev30DaysEnd = addDays(new Date(), -30)
    const prev30DaysOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: prev30DaysStart, lt: prev30DaysEnd },
      },
    })
    const prev30DaysRevenue = prev30DaysOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const growth30Days =
      prev30DaysRevenue > 0 ? ((last30DaysRevenue - prev30DaysRevenue) / prev30DaysRevenue) * 100 : 0

    // 快速統計
    const [pendingOrders, pendingPayments, activeAuctions] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
      this.prisma.auction.count({
        where: {
          status: 'ACTIVE',
          endTime: { gt: new Date() },
        },
      }),
    ])

    const result: DashboardOutput = {
      overview: {
        totalRevenue: (totalRevenue._sum.totalAmount || 0).toString(),
        totalOrders,
        totalProducts,
        activeSellers,
      },
      recentTrends: {
        last7Days: {
          revenue: last7DaysRevenue.toFixed(2),
          orders: last7DaysOrders.length,
          growth: Math.round(growth7Days * 100) / 100,
        },
        last30Days: {
          revenue: last30DaysRevenue.toFixed(2),
          orders: last30DaysOrders.length,
          growth: Math.round(growth30Days * 100) / 100,
        },
      },
      quickStats: {
        pendingOrders,
        pendingPayments,
        lowStockProducts: 0, // 此功能暫不實作（需要庫存管理）
        activeAuctions,
      },
    }

    // 快取 3 分鐘
    await this.redis.setex(cacheKey, 180, JSON.stringify(result))

    return result
  }
}
```

---

## 四、API Routes

### 4.1 Analytics Routes

```typescript
// apps/api/src/routes/analytics.routes.ts

import { FastifyInstance } from 'fastify'
import { AnalyticsService } from '../services/analytics.service'
import {
  QuerySalesReportSchema,
  QueryProductStatsSchema,
  QuerySellerCommissionSchema,
  ExportCSVSchema,
} from '@card-erp/shared-types'
import { authMiddleware } from '../middleware/auth.middleware'
import { stringify } from 'csv-stringify/sync'

export async function analyticsRoutes(fastify: FastifyInstance) {
  const analyticsService = new AnalyticsService(fastify.prisma, fastify.redis)

  /**
   * GET /api/analytics/sales - 銷售報表
   */
  fastify.get(
    '/sales',
    {
      preHandler: [authMiddleware],
      schema: {
        querystring: QuerySalesReportSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              summary: { type: 'object' },
              breakdown: { type: 'object' },
              channels: { type: 'object' },
              dailyData: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = QuerySalesReportSchema.parse(request.query)
      const report = await analyticsService.getSalesReport(query)
      reply.send(report)
    }
  )

  /**
   * GET /api/analytics/products - 商品統計
   */
  fastify.get(
    '/products',
    {
      preHandler: [authMiddleware],
      schema: {
        querystring: QueryProductStatsSchema,
      },
    },
    async (request, reply) => {
      const query = QueryProductStatsSchema.parse(request.query)
      const stats = await analyticsService.getProductStats(query)
      reply.send(stats)
    }
  )

  /**
   * GET /api/analytics/sellers - 賣家佣金報表
   */
  fastify.get(
    '/sellers',
    {
      preHandler: [authMiddleware],
      schema: {
        querystring: QuerySellerCommissionSchema,
      },
    },
    async (request, reply) => {
      const query = QuerySellerCommissionSchema.parse(request.query)
      const commission = await analyticsService.getSellerCommission(query)
      reply.send(commission)
    }
  )

  /**
   * GET /api/analytics/dashboard - 儀表板
   */
  fastify.get(
    '/dashboard',
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      const dashboard = await analyticsService.getDashboard()
      reply.send(dashboard)
    }
  )

  /**
   * GET /api/analytics/export - CSV 匯出
   */
  fastify.get(
    '/export',
    {
      preHandler: [authMiddleware],
      schema: {
        querystring: ExportCSVSchema,
      },
    },
    async (request, reply) => {
      const { reportType, startDate, endDate } = ExportCSVSchema.parse(request.query)

      let csvData: string

      if (reportType === 'sales') {
        const report = await analyticsService.getSalesReport({
          period: 'CUSTOM' as const,
          startDate,
          endDate,
        })

        const records = report.dailyData.map(day => ({
          日期: day.date,
          營收: day.revenue,
          訂單數: day.orders,
        }))

        csvData = stringify(records, { header: true, bom: true })
      } else if (reportType === 'products') {
        const stats = await analyticsService.getProductStats({
          startDate,
          endDate,
          limit: 100,
        })

        const records = stats.topSelling.map(product => ({
          商品ID: product.productId,
          商品名稱: product.productName,
          類別: product.category,
          銷售數量: product.totalSold,
          總營收: product.totalRevenue,
        }))

        csvData = stringify(records, { header: true, bom: true })
      } else if (reportType === 'sellers') {
        const commission = await analyticsService.getSellerCommission({
          startDate,
          endDate,
        })

        const records = commission.sellers.map(seller => ({
          賣家ID: seller.sellerId,
          賣家名稱: seller.sellerName,
          等級: seller.tier,
          總商品數: seller.totalProducts,
          已售商品: seller.soldProducts,
          總營收: seller.totalRevenue,
          平台抽成: seller.platformCommission,
          賣家所得: seller.sellerEarnings,
          抽成比例: `${seller.commissionRate}%`,
        }))

        csvData = stringify(records, { header: true, bom: true })
      } else {
        return reply.code(400).send({ error: 'Invalid report type' })
      }

      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${reportType}-${startDate}-${endDate}.csv"`)
        .send(csvData)
    }
  )
}
```

### 4.2 註冊路由

```typescript
// apps/api/src/app.ts

import { analyticsRoutes } from './routes/analytics.routes'

// ...

app.register(analyticsRoutes, { prefix: '/api/analytics' })
```

---

## 五、單元測試

### 5.1 AnalyticsService 測試

```typescript
// apps/api/src/services/__tests__/analytics.service.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient, ProductStatus, OrderStatus, PaymentStatus } from '@prisma/client'
import Redis from 'ioredis'
import { AnalyticsService } from '../analytics.service'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()
const redis = new Redis()

describe('AnalyticsService', () => {
  let service: AnalyticsService
  let testOrderId: string

  beforeAll(async () => {
    service = new AnalyticsService(prisma, redis)

    // 清空測試資料
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.seller.deleteMany()

    // 創建測試賣家
    const seller = await prisma.seller.create({
      data: {
        id: 'test-seller-1',
        name: 'Test Seller',
        email: 'seller@test.com',
        phone: '0912345678',
        tier: 'BRONZE',
        commissionRate: 0.15,
        status: 'ACTIVE',
      },
    })

    // 創建測試商品
    const product1 = await prisma.product.create({
      data: {
        type: 'TRADING_CARD',
        category: 'Pokemon',
        name: 'Pikachu',
        sellingPrice: 100,
        sourceType: 'SELF_OPERATED',
        status: ProductStatus.SOLD,
      },
    })

    const product2 = await prisma.product.create({
      data: {
        type: 'TRADING_CARD',
        category: 'Pokemon',
        name: 'Charizard',
        sellingPrice: 500,
        sourceType: 'CONSIGNMENT',
        sellerId: seller.id,
        status: ProductStatus.SOLD,
      },
    })

    // 創建測試訂單
    const order = await prisma.order.create({
      data: {
        orderNumber: 'TEST-ORDER-001',
        channel: 'ONLINE',
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        subtotal: 600,
        totalAmount: 600,
      },
    })
    testOrderId = order.id

    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order.id,
          productId: product1.id,
          unitPrice: 100,
          quantity: 1,
          subtotal: 100,
        },
        {
          orderId: order.id,
          productId: product2.id,
          unitPrice: 500,
          quantity: 1,
          subtotal: 500,
        },
      ],
    })
  })

  afterAll(async () => {
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.seller.deleteMany()
    await redis.flushdb()
    await redis.quit()
    await prisma.$disconnect()
  })

  it('should get sales report', async () => {
    const today = new Date().toISOString().split('T')[0]
    const report = await service.getSalesReport({
      period: 'DAILY' as const,
      startDate: today,
    })

    expect(report).toHaveProperty('summary')
    expect(report.summary.totalRevenue).toBe('600.00')
    expect(report.summary.totalOrders).toBe(1)
    expect(report.summary.totalProducts).toBe(2)
  })

  it('should get product stats', async () => {
    const stats = await service.getProductStats({ limit: 10 })

    expect(stats).toHaveProperty('topSelling')
    expect(stats).toHaveProperty('inventory')
    expect(stats.topSelling.length).toBeGreaterThan(0)
  })

  it('should get seller commission', async () => {
    const today = new Date().toISOString().split('T')[0]
    const commission = await service.getSellerCommission({
      startDate: today,
      endDate: today,
    })

    expect(commission.sellers.length).toBeGreaterThan(0)
    const seller = commission.sellers[0]
    expect(seller).toHaveProperty('totalRevenue')
    expect(seller).toHaveProperty('platformCommission')
    expect(seller).toHaveProperty('sellerEarnings')
  })

  it('should get dashboard data', async () => {
    const dashboard = await service.getDashboard()

    expect(dashboard).toHaveProperty('overview')
    expect(dashboard).toHaveProperty('recentTrends')
    expect(dashboard).toHaveProperty('quickStats')
    expect(dashboard.overview.totalOrders).toBeGreaterThanOrEqual(1)
  })
})
```

---

## 六、驗收標準

- [ ] 銷售報表 API 正常運作，可查詢每日/每週/每月報表
- [ ] 商品統計 API 正常運作，顯示暢銷商品與庫存統計
- [ ] 賣家佣金 API 正常運作，準確計算各等級賣家的佣金
- [ ] 儀表板 API 正常運作，提供總覽與趨勢數據
- [ ] CSV 匯出功能正常運作，可下載各類報表
- [ ] Redis 快取機制有效（檢查 Redis keys）
- [ ] 所有單元測試通過（覆蓋率 > 80%）
- [ ] 日期範圍查詢正確處理時區（使用 date-fns）
- [ ] 複雜統計查詢效能可接受（< 2 秒）
- [ ] 嚴格遵守型別定義，無 `any` 類型（單元測試除外）

---

## 七、注意事項

1. **效能優化**：
   - 複雜統計查詢考慮使用 `$queryRaw` 直接執行 SQL
   - 定期清理 Redis 快取（設定合理的 TTL）
   - 大量資料查詢時考慮分頁或限制數量

2. **資料準確性**：
   - 訂單必須是 `COMPLETED` 且 `PAID` 才計入統計
   - 寄賣商品佣金計算要根據賣家等級動態調整
   - 日期範圍查詢要正確處理時區（統一使用 UTC）

3. **CSV 匯出**：
   - 使用 `csv-stringify` 套件（`pnpm add csv-stringify`）
   - 加入 BOM 以支援 Excel 正確顯示中文
   - 檔案命名包含報表類型與日期範圍

4. **快取策略**：
   - 報表數據快取時間較短（3-5 分鐘）
   - 儀表板數據可快取稍長（5-10 分鐘）
   - 提供手動清除快取的管理功能（Task 17）

5. **擴充性**：
   - 預留 `AnalyticsSnapshot` 表用於歷史報表快照
   - 未來可加入排程任務自動生成每日報表
   - 考慮整合圖表庫（如 Chart.js）用於前端展示

---

## 八、後續任務

- **Task 10**: Buyer Web Setup（買家前台基礎建立）
- **Task 17**: Admin Web Analytics（後台報表視覺化）
- **Task 21**: Testing（E2E 測試報表功能）
