import { Prisma } from '../../generated/prisma/client.js'
import type { PrismaClient } from '../../generated/prisma/client.js'
import type Redis from 'ioredis'
import { addDays, eachDayOfInterval, endOfDay, format, startOfDay } from 'date-fns'
import type {
  DashboardOutput,
  ProductStatsOutput,
  QueryProductStatsInput,
  QuerySalesReportInput,
  QuerySellerCommissionInput,
  SalesReportOutput,
  SellerCommissionOutput,
} from './analytics.schema.js'

export class AnalyticsService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  async getSalesReport(query: QuerySalesReportInput): Promise<SalesReportOutput> {
    const startDateObj = startOfDay(new Date(query.startDate))
    const endDateObj = endOfDay(new Date(query.endDate ?? query.startDate))
    const cacheKey = `analytics:sales:${query.period}:${query.startDate}:${query.endDate ?? query.startDate}`

    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached) as SalesReportOutput
    }

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: {
          gte: startDateObj,
          lte: endDateObj,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                sellerId: true,
              },
            },
          },
        },
      },
    })

    let totalRevenue = 0
    let totalProducts = 0
    let selfRevenue = 0
    let selfProducts = 0
    let consignRevenue = 0
    let consignProducts = 0

    let selfOrders = 0
    let consignOrders = 0
    let onlineRevenue = 0
    let onlineOrders = 0
    let posRevenue = 0
    let posOrders = 0

    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    const allDays = eachDayOfInterval({ start: startDateObj, end: endDateObj })
    for (const day of allDays) {
      dailyMap.set(format(day, 'yyyy-MM-dd'), { revenue: 0, orders: 0 })
    }

    for (const order of orders) {
      const orderRevenue = order.finalAmount.toNumber()
      totalRevenue += orderRevenue
      totalProducts += order.items.length

      const orderDay = format(order.createdAt, 'yyyy-MM-dd')
      const dayData = dailyMap.get(orderDay)
      if (dayData) {
        dayData.revenue += orderRevenue
        dayData.orders += 1
      }

      if (order.channel === 'ONLINE') {
        onlineRevenue += orderRevenue
        onlineOrders += 1
      } else if (order.channel === 'POS') {
        posRevenue += orderRevenue
        posOrders += 1
      }

      let hasSelf = false
      let hasConsign = false
      for (const item of order.items) {
        const price = item.productPrice.toNumber()
        if (item.sellerId === null) {
          selfRevenue += price
          selfProducts += 1
          hasSelf = true
        } else {
          consignRevenue += price
          consignProducts += 1
          hasConsign = true
        }
      }
      if (hasSelf) selfOrders += 1
      if (hasConsign) consignOrders += 1
    }

    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const output: SalesReportOutput = {
      period: query.period,
      startDate: query.startDate,
      endDate: query.endDate ?? query.startDate,
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
          commission: (consignRevenue * 0.15).toFixed(2),
        },
      },
      channels: {
        online: {
          revenue: onlineRevenue.toFixed(2),
          orders: onlineOrders,
        },
        pos: {
          revenue: posRevenue.toFixed(2),
          orders: posOrders,
        },
      },
      dailyData: allDays.map((day) => {
        const key = format(day, 'yyyy-MM-dd')
        const value = dailyMap.get(key) ?? { revenue: 0, orders: 0 }
        return {
          date: key,
          revenue: value.revenue.toFixed(2),
          orders: value.orders,
        }
      }),
    }

    await this.redis.setex(cacheKey, 300, JSON.stringify(output))
    return output
  }

  async getProductStats(query: QueryProductStatsInput): Promise<ProductStatsOutput> {
    const cacheKey = `analytics:products:${query.startDate ?? 'all'}:${query.endDate ?? 'all'}:${query.limit}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached) as ProductStatsOutput
    }

    const startDateObj = query.startDate ? startOfDay(new Date(query.startDate)) : undefined
    const endDateObj = query.endDate ? endOfDay(new Date(query.endDate)) : undefined

    const soldGrouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          ...(startDateObj || endDateObj
            ? {
                createdAt: {
                  ...(startDateObj ? { gte: startDateObj } : {}),
                  ...(endDateObj ? { lte: endDateObj } : {}),
                },
              }
            : {}),
        },
      },
      _count: {
        productId: true,
      },
      _sum: {
        productPrice: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: query.limit,
    })

    const productIds = soldGrouped.map((item) => item.productId)
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            category: true,
          },
        })
      : []
    const productMap = new Map(products.map((product) => [product.id, product]))

    const topSelling = soldGrouped.map((item) => {
      const product = productMap.get(item.productId)
      return {
        productId: item.productId,
        productName: product?.name ?? 'Unknown',
        category: product?.category ?? 'Unknown',
        soldCount: item._count.productId,
        revenue: (item._sum.productPrice?.toNumber() ?? 0).toFixed(2),
      }
    })

    const inventoryGrouped = await this.prisma.product.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    })

    const inventory = {
      pending: inventoryGrouped.find((item) => item.status === 'PENDING')?._count._all ?? 0,
      listed: inventoryGrouped.find((item) => item.status === 'LISTED')?._count._all ?? 0,
      sold: inventoryGrouped.find((item) => item.status === 'SOLD')?._count._all ?? 0,
      total: inventoryGrouped.reduce((sum, item) => sum + item._count._all, 0),
    }

    const categoryGrouped = await this.prisma.product.groupBy({
      by: ['category'],
      _count: {
        _all: true,
      },
    })

    const dateRangeSql =
      startDateObj || endDateObj
        ? Prisma.sql`
          AND o."createdAt" >= ${startDateObj ?? new Date(0)}
          AND o."createdAt" <= ${endDateObj ?? new Date()}
        `
        : Prisma.empty

    const categoryRevenueRows = await this.prisma.$queryRaw<
      Array<{ category: string; revenue: unknown }>
    >(
      Prisma.sql`
        SELECT p."category", COALESCE(SUM(oi."productPrice"), 0) as revenue
        FROM "products" p
        INNER JOIN "order_items" oi ON oi."productId" = p."id"
        INNER JOIN "orders" o ON o."id" = oi."orderId"
        WHERE o."status" = 'COMPLETED' AND o."paymentStatus" = 'PAID'
        ${dateRangeSql}
        GROUP BY p."category"
      `
    )

    const revenueMap = new Map(
      categoryRevenueRows.map((row) => [row.category, Number(row.revenue ?? 0)])
    )

    const categoryBreakdown = categoryGrouped.map((item) => ({
      category: item.category,
      count: item._count._all,
      revenue: (revenueMap.get(item.category) ?? 0).toFixed(2),
    }))

    const output: ProductStatsOutput = {
      topSelling,
      inventory,
      categoryBreakdown,
    }

    await this.redis.setex(cacheKey, 300, JSON.stringify(output))
    return output
  }

  async getSellerCommission(query: QuerySellerCommissionInput): Promise<SellerCommissionOutput> {
    const cacheKey = `analytics:sellers:${query.sellerId ?? 'all'}:${query.startDate}:${query.endDate}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached) as SellerCommissionOutput
    }

    const startDateObj = startOfDay(new Date(query.startDate))
    const endDateObj = endOfDay(new Date(query.endDate))

    const sellers = await this.prisma.seller.findMany({
      where: query.sellerId ? { id: query.sellerId } : undefined,
      select: {
        id: true,
        name: true,
        commissionRate: true,
      },
    })

    const sellerOutputs: SellerCommissionOutput['sellers'] = []
    for (const seller of sellers) {
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          sellerId: seller.id,
          order: {
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            createdAt: {
              gte: startDateObj,
              lte: endDateObj,
            },
          },
        },
        select: {
          orderId: true,
          productPrice: true,
        },
      })

      const totalRevenue = orderItems.reduce((sum, item) => sum + item.productPrice.toNumber(), 0)
      const commissionRate = seller.commissionRate.toNumber()
      const platformCommission = totalRevenue * commissionRate
      const sellerEarnings = totalRevenue - platformCommission
      const orderCount = new Set(orderItems.map((item) => item.orderId)).size

      sellerOutputs.push({
        sellerId: seller.id,
        sellerName: seller.name,
        commissionRate: commissionRate.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        platformCommission: platformCommission.toFixed(2),
        sellerEarnings: sellerEarnings.toFixed(2),
        totalOrders: orderCount,
      })
    }

    const output: SellerCommissionOutput = {
      startDate: query.startDate,
      endDate: query.endDate,
      sellers: sellerOutputs,
    }

    await this.redis.setex(cacheKey, 300, JSON.stringify(output))
    return output
  }

  async getDashboard(): Promise<DashboardOutput> {
    const cacheKey = 'analytics:dashboard'
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached) as DashboardOutput
    }

    const now = new Date()
    const last7Start = addDays(now, -7)
    const prev7Start = addDays(now, -14)
    const last30Start = addDays(now, -30)
    const prev30Start = addDays(now, -60)

    const [revenueAgg, totalOrders, totalProducts, activeSellers] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
        },
        _sum: {
          finalAmount: true,
        },
      }),
      this.prisma.order.count({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
        },
      }),
      this.prisma.product.count(),
      this.prisma.seller.count({
        where: { status: 'ACTIVE' },
      }),
    ])

    const [last7, prev7, last30, prev30] = await Promise.all([
      this.getPeriodMetrics(last7Start, now),
      this.getPeriodMetrics(prev7Start, last7Start),
      this.getPeriodMetrics(last30Start, now),
      this.getPeriodMetrics(prev30Start, last30Start),
    ])

    const [pendingOrders, pendingPayments, activeAuctions] = await Promise.all([
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { paymentStatus: 'PENDING' } }),
      this.prisma.auction.count({
        where: {
          status: 'ACTIVE',
          endTime: {
            gt: new Date(),
          },
        },
      }),
    ])

    const growthRate7d = this.calculateGrowth(last7.revenue, prev7.revenue)
    const growthRate30d = this.calculateGrowth(last30.revenue, prev30.revenue)

    const output: DashboardOutput = {
      overview: {
        totalRevenue: (revenueAgg._sum.finalAmount?.toNumber() ?? 0).toFixed(2),
        totalOrders,
        totalProducts,
        activeSellers,
      },
      recentTrends: {
        last7DaysRevenue: last7.revenue.toFixed(2),
        last7DaysOrders: last7.orders,
        last30DaysRevenue: last30.revenue.toFixed(2),
        last30DaysOrders: last30.orders,
        revenueGrowthRate7d: growthRate7d.toFixed(2),
        revenueGrowthRate30d: growthRate30d.toFixed(2),
      },
      quickStats: {
        pendingOrders,
        pendingPayments,
        lowStockProducts: 0,
        activeAuctions,
      },
    }

    await this.redis.setex(cacheKey, 180, JSON.stringify(output))
    return output
  }

  private async getPeriodMetrics(start: Date, end: Date) {
    const agg = await this.prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        finalAmount: true,
      },
      _count: {
        _all: true,
      },
    })

    return {
      revenue: agg._sum.finalAmount?.toNumber() ?? 0,
      orders: agg._count._all,
    }
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0
    }
    return ((current - previous) / previous) * 100
  }
}
