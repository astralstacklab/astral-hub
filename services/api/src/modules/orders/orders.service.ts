import { Prisma } from '../../generated/prisma/client.js'
import type { PrismaClient, Order } from '../../generated/prisma/client.js'
import type { CreateOrderInput, QueryOrdersInput, UpdateOrderStatusInput } from './orders.schema.js'
import { generateOrderNumber } from './order-number-generator.js'

export class OrdersService {
  constructor(private prisma: PrismaClient) {}

  async createOrder(data: CreateOrderInput, buyerId?: string): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const productIds = data.items.map((item) => item.productId)
      const products = await tx.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      })

      if (products.length !== data.items.length) {
        throw new Error('部分商品不存在')
      }

      for (const product of products) {
        if (product.status === 'SOLD') {
          throw new Error(`商品 ${product.name} 已售出`)
        }
        if (product.status !== 'LISTED') {
          throw new Error(`商品 ${product.name} 尚未上架`)
        }
      }

      const subtotal = products.reduce((sum, product) => sum + product.sellingPrice.toNumber(), 0)
      const discountAmount = data.discountAmount ?? 0
      const shippingFee = this.calculateShippingFee(data.shippingMethod)
      const finalAmount = subtotal + shippingFee - discountAmount

      const orderNumber = await generateOrderNumber(tx as unknown as PrismaClient)

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId,
          buyerName: data.buyerName,
          buyerEmail: data.buyerEmail,
          buyerPhone: data.buyerPhone,
          subtotal,
          shippingFee,
          discountAmount,
          finalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentMethod === 'CASH' ? 'PAID' : 'PENDING',
          paymentTransactionId: null,
          paidAt: data.paymentMethod === 'CASH' ? new Date() : null,
          shippingMethod: data.shippingMethod,
          shippingAddress: data.shippingAddress ?? Prisma.JsonNull,
          status: 'PENDING',
          channel: data.channel,
          notes: data.notes,
        },
      })

      await tx.orderItem.createMany({
        data: products.map((product) => ({
          orderId: newOrder.id,
          productId: product.id,
          productName: product.name,
          productPrice: product.sellingPrice,
          sellerId: product.sellerId,
        })),
      })

      await tx.product.updateMany({
        where: {
          id: {
            in: productIds,
          },
        },
        data: {
          status: 'SOLD',
        },
      })

      return newOrder
    })
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    })
  }

  async getOrders(query: QueryOrdersInput) {
    const { page, limit, status, channel, startDate, endDate, search } = query

    const where: Prisma.OrderWhereInput = {}

    if (status) where.status = status
    if (channel) where.channel = channel

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { buyerName: { contains: search, mode: 'insensitive' } },
        { buyerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ])

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusInput): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { id } })
    if (!order) {
      throw new Error('訂單不存在')
    }

    if (!this.isValidStatusTransition(order.status, data.status)) {
      throw new Error(`訂單狀態不可從 ${order.status} 轉換為 ${data.status}`)
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: data.status,
    }

    if (data.status === 'SHIPPED') {
      updateData.shippedAt = new Date()
      updateData.trackingNumber = data.trackingNumber
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    })
  }

  async updatePaymentStatus(
    id: string,
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
    transactionId?: string
  ): Promise<Order> {
    const updateData: Prisma.OrderUpdateInput = {
      paymentStatus: status,
    }

    if (status === 'PAID') {
      updateData.paidAt = new Date()
      updateData.paymentTransactionId = transactionId ?? null
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    })
  }

  async cancelOrder(id: string): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!order) {
        throw new Error('訂單不存在')
      }

      if (order.status !== 'PENDING') {
        throw new Error('僅能取消待處理訂單')
      }

      const cancelledOrder = await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      const productIds = order.items.map((item) => item.productId)
      if (productIds.length > 0) {
        await tx.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: {
            status: 'LISTED',
          },
        })
      }

      return cancelledOrder
    })
  }

  private calculateShippingFee(
    shippingMethod: 'SEVEN_ELEVEN' | 'FAMILY_MART' | 'FACE_TO_FACE' | 'IN_STORE'
  ): number {
    if (shippingMethod === 'SEVEN_ELEVEN' || shippingMethod === 'FAMILY_MART') {
      return 60
    }
    return 0
  }

  private isValidStatusTransition(
    currentStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED',
    nextStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
  ): boolean {
    if (currentStatus === 'PENDING' && nextStatus === 'PROCESSING') return true
    if (currentStatus === 'PROCESSING' && nextStatus === 'SHIPPED') return true
    if (currentStatus === 'SHIPPED' && nextStatus === 'COMPLETED') return true
    if (currentStatus === 'PENDING' && nextStatus === 'CANCELLED') return true

    return false
  }
}
