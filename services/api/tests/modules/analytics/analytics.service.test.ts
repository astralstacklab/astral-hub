import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestServer, closeTestServer } from '../../helpers.js'
import { AnalyticsService } from '../../../src/modules/analytics/analytics.service.js'

describe('AnalyticsService', () => {
  let server: FastifyInstance
  let service: AnalyticsService
  let buyerId: string
  let sellerId: string
  let p1Id: string
  let p2Id: string
  let p3Id: string

  beforeAll(async () => {
    server = await buildTestServer()
    service = new AnalyticsService(server.prisma, server.redis)

    const existingKeys = await server.redis.keys('analytics:*')
    if (existingKeys.length > 0) {
      await server.redis.del(...existingKeys)
    }

    const buyer = await server.prisma.user.create({
      data: {
        email: `analytics-buyer-${Date.now()}@example.com`,
        name: 'Analytics Buyer',
        provider: 'GOOGLE',
        providerId: `analytics-buyer-provider-${Date.now()}`,
      },
    })
    buyerId = buyer.id

    const seller = await server.prisma.seller.create({
      data: {
        email: `analytics-seller-${Date.now()}@example.com`,
        name: 'Analytics Seller',
        passwordHash: 'hashed-password',
        level: 'BRONZE',
        commissionRate: 0.15,
        onlineListingFee: 10,
        offlineListingFee: 10,
        status: 'ACTIVE',
      },
    })
    sellerId = seller.id

    const p1 = await server.prisma.product.create({
      data: {
        type: 'CARD',
        category: 'ANALYTICS-CAT-A',
        name: 'ANALYTICS-P1-SELF',
        costPrice: 50,
        sellingPrice: 100,
        description: 'analytics p1',
        status: 'SOLD',
      },
    })
    p1Id = p1.id

    const p2 = await server.prisma.product.create({
      data: {
        type: 'CARD',
        category: 'ANALYTICS-CAT-B',
        name: 'ANALYTICS-P2-CONSIGN',
        costPrice: 200,
        sellingPrice: 500,
        description: 'analytics p2',
        status: 'SOLD',
        sellerId,
      },
    })
    p2Id = p2.id

    const p3 = await server.prisma.product.create({
      data: {
        type: 'CARD',
        category: 'ANALYTICS-CAT-A',
        name: 'ANALYTICS-P3-LISTED',
        costPrice: 100,
        sellingPrice: 200,
        description: 'analytics p3',
        status: 'LISTED',
      },
    })
    p3Id = p3.id

    const completedOrder = await server.prisma.order.create({
      data: {
        orderNumber: `ANALYTICS-COMP-${Date.now()}`,
        buyerId,
        subtotal: 600,
        shippingFee: 0,
        discountAmount: 0,
        finalAmount: 600,
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: 'PAID',
        shippingMethod: 'IN_STORE',
        status: 'COMPLETED',
        channel: 'ONLINE',
      },
    })

    await server.prisma.orderItem.createMany({
      data: [
        {
          orderId: completedOrder.id,
          productId: p1Id,
          productName: 'ANALYTICS-P1-SELF',
          productPrice: 100,
          sellerId: null,
        },
        {
          orderId: completedOrder.id,
          productId: p2Id,
          productName: 'ANALYTICS-P2-CONSIGN',
          productPrice: 500,
          sellerId,
        },
      ],
    })

    await server.prisma.order.create({
      data: {
        orderNumber: `ANALYTICS-PENDING-${Date.now()}`,
        buyerId,
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        finalAmount: 0,
        paymentMethod: 'TRANSFER',
        paymentStatus: 'PENDING',
        shippingMethod: 'IN_STORE',
        status: 'PENDING',
        channel: 'ONLINE',
      },
    })
  })

  beforeEach(async () => {
    const keys = await server.redis.keys('analytics:*')
    if (keys.length > 0) {
      await server.redis.del(...keys)
    }
  })

  afterAll(async () => {
    await server.prisma.paymentLog.deleteMany()
    await server.prisma.orderItem.deleteMany()
    await server.prisma.order.deleteMany()
    await server.prisma.product.deleteMany({
      where: { id: { in: [p1Id, p2Id, p3Id] } },
    })
    await server.prisma.seller.deleteMany({
      where: { id: sellerId },
    })
    await server.prisma.user.deleteMany({
      where: { id: buyerId },
    })

    const keys = await server.redis.keys('analytics:*')
    if (keys.length > 0) {
      await server.redis.del(...keys)
    }

    await closeTestServer(server)
  })

  it('getSalesReport should return correct summary', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const report = await service.getSalesReport({
      period: 'DAILY',
      startDate: today,
      endDate: today,
    })

    expect(report.summary.totalRevenue).toBe('600.00')
    expect(report.summary.totalOrders).toBe(1)
    expect(report.summary.totalProducts).toBe(2)
  })

  it('getSalesReport should return correct self/consignment breakdown', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const report = await service.getSalesReport({
      period: 'DAILY',
      startDate: today,
      endDate: today,
    })

    expect(report.breakdown.selfOperated.revenue).toBe('100.00')
    expect(report.breakdown.consignment.revenue).toBe('500.00')
    expect(report.breakdown.consignment.commission).toBe('75.00')
  })

  it('getSalesReport should return correct channel stats', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const report = await service.getSalesReport({
      period: 'DAILY',
      startDate: today,
      endDate: today,
    })

    expect(report.channels.online.revenue).toBe('600.00')
    expect(report.channels.online.orders).toBe(1)
    expect(report.channels.pos.revenue).toBe('0.00')
  })

  it('getProductStats should return top selling products', async () => {
    const stats = await service.getProductStats({ limit: 20 })

    expect(stats.topSelling.length).toBeGreaterThan(0)
    expect(stats.topSelling.some((item) => item.productId === p1Id)).toBe(true)
    expect(stats.topSelling.some((item) => item.productId === p2Id)).toBe(true)
  })

  it('getProductStats should return inventory distribution', async () => {
    const stats = await service.getProductStats({ limit: 20 })

    expect(stats.inventory.sold).toBe(2)
    expect(stats.inventory.listed).toBe(1)
  })

  it('getSellerCommission should calculate commission correctly', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const stats = await service.getSellerCommission({
      sellerId,
      startDate: today,
      endDate: today,
    })

    expect(stats.sellers).toHaveLength(1)
    expect(stats.sellers[0].totalRevenue).toBe('500.00')
    expect(stats.sellers[0].platformCommission).toBe('75.00')
    expect(stats.sellers[0].sellerEarnings).toBe('425.00')
  })

  it('getDashboard should return correct overview', async () => {
    const dashboard = await service.getDashboard()

    expect(dashboard.overview.totalRevenue).toBe('600.00')
    expect(dashboard.overview.totalOrders).toBe(1)
    expect(dashboard.overview.totalProducts).toBe(3)
    expect(dashboard.overview.activeSellers).toBeGreaterThanOrEqual(1)
  })

  it('getDashboard should return quickStats pendingOrders >= 1', async () => {
    const dashboard = await service.getDashboard()
    expect(dashboard.quickStats.pendingOrders).toBeGreaterThanOrEqual(1)
  })
})
