import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '../../../src/generated/prisma/client.js'
import { OrdersService } from '../../../src/modules/orders/orders.service.js'
import type { CreateOrderInput } from '../../../src/modules/orders/orders.schema.js'

const prisma = new PrismaClient()
const service = new OrdersService(prisma)

function listedProductInput(name: string, sellingPrice: number) {
  return {
    type: 'CARD' as const,
    category: 'ORDER-TEST',
    name,
    costPrice: Math.max(1, Math.floor(sellingPrice / 2)),
    sellingPrice,
    description: '訂單測試商品',
    status: 'LISTED' as const,
  }
}

async function createListedProduct(name: string, sellingPrice: number) {
  return prisma.product.create({
    data: listedProductInput(name, sellingPrice),
  })
}

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
})

describe('OrdersService', () => {
  describe('createOrder', () => {
    it('should create order, set products SOLD, and generate valid order number', async () => {
      const product = await createListedProduct('Order Item A', 300)

      const input: CreateOrderInput = {
        items: [{ productId: product.id }],
        paymentMethod: 'CREDIT_CARD',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      }

      const order = await service.createOrder(input)

      expect(order.orderNumber).toMatch(/^ORD\d{8}\d{3}$/)
      expect(order.paymentStatus).toBe('PENDING')

      const soldProduct = await prisma.product.findUnique({ where: { id: product.id } })
      expect(soldProduct!.status).toBe('SOLD')
    })

    it('should create order with multiple items and correct subtotal', async () => {
      const p1 = await createListedProduct('Order Item B1', 100)
      const p2 = await createListedProduct('Order Item B2', 250)

      const order = await service.createOrder({
        items: [{ productId: p1.id }, { productId: p2.id }],
        paymentMethod: 'LINE_PAY',
        shippingMethod: 'FACE_TO_FACE',
        channel: 'ONLINE',
      })

      expect(order.subtotal.toNumber()).toBe(350)
      expect(order.finalAmount.toNumber()).toBe(350)
    })

    it('should mark payment as PAID when payment method is CASH', async () => {
      const product = await createListedProduct('Order Item C', 200)

      const order = await service.createOrder({
        items: [{ productId: product.id }],
        paymentMethod: 'CASH',
        shippingMethod: 'IN_STORE',
        channel: 'POS',
      })

      expect(order.paymentStatus).toBe('PAID')
      expect(order.paidAt).not.toBeNull()
    })

    it('should apply shipping fee 60 for convenience store delivery', async () => {
      const product = await createListedProduct('Order Item D', 200)

      const order = await service.createOrder({
        items: [{ productId: product.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'SEVEN_ELEVEN',
        shippingAddress: { storeId: '711-A', storeName: '7-11 測試店' },
        channel: 'ONLINE',
      })

      expect(order.shippingFee.toNumber()).toBe(60)
      expect(order.finalAmount.toNumber()).toBe(260)
    })

    it('should throw when product does not exist', async () => {
      await expect(
        service.createOrder({
          items: [{ productId: '00000000-0000-0000-0000-000000000000' }],
          paymentMethod: 'CREDIT_CARD',
          shippingMethod: 'IN_STORE',
          channel: 'ONLINE',
        })
      ).rejects.toThrow('部分商品不存在')
    })

    it('should throw when product is sold', async () => {
      const sold = await prisma.product.create({
        data: {
          ...listedProductInput('Order Item E', 200),
          status: 'SOLD',
        },
      })

      await expect(
        service.createOrder({
          items: [{ productId: sold.id }],
          paymentMethod: 'CREDIT_CARD',
          shippingMethod: 'IN_STORE',
          channel: 'ONLINE',
        })
      ).rejects.toThrow('已售出')
    })

    it('should throw when product is not listed', async () => {
      const pending = await prisma.product.create({
        data: {
          ...listedProductInput('Order Item F', 200),
          status: 'PENDING',
        },
      })

      await expect(
        service.createOrder({
          items: [{ productId: pending.id }],
          paymentMethod: 'CREDIT_CARD',
          shippingMethod: 'IN_STORE',
          channel: 'ONLINE',
        })
      ).rejects.toThrow('尚未上架')
    })

    it('should generate sequential order numbers on same day', async () => {
      const p1 = await createListedProduct('Order Item G1', 100)
      const p2 = await createListedProduct('Order Item G2', 120)

      const first = await service.createOrder({
        items: [{ productId: p1.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })
      const second = await service.createOrder({
        items: [{ productId: p2.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })

      expect(second.orderNumber > first.orderNumber).toBe(true)
      expect(first.orderNumber.slice(0, 11)).toBe(second.orderNumber.slice(0, 11))
    })
  })

  describe('getOrderById', () => {
    it('should return order with items', async () => {
      const product = await createListedProduct('Order Item H', 180)
      const created = await service.createOrder({
        items: [{ productId: product.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })

      const order = await service.getOrderById(created.id)
      expect(order).not.toBeNull()
      expect(order!.items).toHaveLength(1)
    })

    it('should return null for non-existent order', async () => {
      const order = await service.getOrderById('00000000-0000-0000-0000-000000000000')
      expect(order).toBeNull()
    })
  })

  describe('getOrders', () => {
    it('should return paginated and filtered orders', async () => {
      const p1 = await createListedProduct('Order Item I1', 100)
      const p2 = await createListedProduct('Order Item I2', 200)

      await service.createOrder({
        items: [{ productId: p1.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })
      const order2 = await service.createOrder({
        items: [{ productId: p2.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'POS',
      })

      await service.updateOrderStatus(order2.id, { status: 'PROCESSING' })

      const result = await service.getOrders({ page: 1, limit: 10, status: 'PROCESSING' })

      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].status).toBe('PROCESSING')
      expect(result.total).toBe(1)
    })
  })

  describe('updateOrderStatus', () => {
    it('should support legal status transitions', async () => {
      const product = await createListedProduct('Order Item J', 180)
      const order = await service.createOrder({
        items: [{ productId: product.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })

      const processing = await service.updateOrderStatus(order.id, { status: 'PROCESSING' })
      expect(processing.status).toBe('PROCESSING')

      const shipped = await service.updateOrderStatus(order.id, {
        status: 'SHIPPED',
        trackingNumber: 'TRACK-001',
      })
      expect(shipped.status).toBe('SHIPPED')
      expect(shipped.trackingNumber).toBe('TRACK-001')
      expect(shipped.shippedAt).not.toBeNull()

      const completed = await service.updateOrderStatus(order.id, { status: 'COMPLETED' })
      expect(completed.status).toBe('COMPLETED')
    })

    it('should throw for illegal status transition', async () => {
      const product = await createListedProduct('Order Item K', 180)
      const order = await service.createOrder({
        items: [{ productId: product.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })

      await expect(service.updateOrderStatus(order.id, { status: 'SHIPPED' })).rejects.toThrow(
        '訂單狀態不可從 PENDING 轉換為 SHIPPED'
      )
    })
  })

  describe('updatePaymentStatus', () => {
    it('should set paidAt when payment status becomes PAID', async () => {
      const product = await createListedProduct('Order Item L', 150)
      const order = await service.createOrder({
        items: [{ productId: product.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })

      const updated = await service.updatePaymentStatus(order.id, 'PAID', 'TXN-001')
      expect(updated.paymentStatus).toBe('PAID')
      expect(updated.paidAt).not.toBeNull()
      expect(updated.paymentTransactionId).toBe('TXN-001')
    })
  })

  describe('cancelOrder', () => {
    it('should cancel pending order and restore product status to LISTED', async () => {
      const product = await createListedProduct('Order Item M', 230)
      const order = await service.createOrder({
        items: [{ productId: product.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })

      const cancelled = await service.cancelOrder(order.id)
      expect(cancelled.status).toBe('CANCELLED')

      const restored = await prisma.product.findUnique({ where: { id: product.id } })
      expect(restored!.status).toBe('LISTED')
    })

    it('should throw when cancelling non-pending order', async () => {
      const product = await createListedProduct('Order Item N', 210)
      const order = await service.createOrder({
        items: [{ productId: product.id }],
        paymentMethod: 'TRANSFER',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      })

      await service.updateOrderStatus(order.id, { status: 'PROCESSING' })

      await expect(service.cancelOrder(order.id)).rejects.toThrow('僅能取消待處理訂單')
    })
  })
})
