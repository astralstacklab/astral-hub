import type { FastifyPluginAsync } from 'fastify'
import { OrdersService } from './orders.service.js'
import {
  CreateOrderSchema,
  QueryOrdersSchema,
  UpdateOrderStatusSchema,
  UpdatePaymentStatusSchema,
  OrderIdParamSchema,
} from './orders.schema.js'
import { successResponse, errorResponse } from '../../utils/response.js'

const ErrorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [false] },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
} as const

const OrderItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    orderId: { type: 'string', format: 'uuid' },
    productId: { type: 'string', format: 'uuid' },
    productName: { type: 'string' },
    productPrice: { type: 'number' },
    sellerId: { type: 'string', format: 'uuid', nullable: true },
  },
} as const

const OrderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    orderNumber: { type: 'string' },
    buyerId: { type: 'string', format: 'uuid', nullable: true },
    buyerName: { type: 'string', nullable: true },
    buyerEmail: { type: 'string', nullable: true },
    buyerPhone: { type: 'string', nullable: true },
    subtotal: { type: 'number' },
    shippingFee: { type: 'number' },
    discountAmount: { type: 'number' },
    finalAmount: { type: 'number' },
    paymentMethod: { type: 'string', enum: ['CASH', 'CREDIT_CARD', 'LINE_PAY', 'TRANSFER'] },
    paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
    paymentTransactionId: { type: 'string', nullable: true },
    paidAt: { type: 'string', format: 'date-time', nullable: true },
    shippingMethod: {
      type: 'string',
      enum: ['SEVEN_ELEVEN', 'FAMILY_MART', 'FACE_TO_FACE', 'IN_STORE'],
    },
    shippingAddress: { type: 'object', nullable: true },
    trackingNumber: { type: 'string', nullable: true },
    shippedAt: { type: 'string', format: 'date-time', nullable: true },
    status: {
      type: 'string',
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'],
    },
    channel: { type: 'string', enum: ['ONLINE', 'POS'] },
    notes: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    items: { type: 'array', items: OrderItemSchema },
  },
} as const

const ordersRoutes: FastifyPluginAsync = async (server) => {
  const ordersService = new OrdersService(server.prisma)

  server.post(
    '/',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Orders'],
        summary: '建立訂單',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['items', 'paymentMethod', 'shippingMethod', 'channel'],
          properties: {
            items: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string', format: 'uuid' },
                },
              },
            },
            buyerName: { type: 'string' },
            buyerEmail: { type: 'string', format: 'email' },
            buyerPhone: { type: 'string' },
            paymentMethod: {
              type: 'string',
              enum: ['CASH', 'CREDIT_CARD', 'LINE_PAY', 'TRANSFER'],
            },
            shippingMethod: {
              type: 'string',
              enum: ['SEVEN_ELEVEN', 'FAMILY_MART', 'FACE_TO_FACE', 'IN_STORE'],
            },
            shippingAddress: { type: 'object' },
            discountAmount: { type: 'number', minimum: 0 },
            channel: { type: 'string', enum: ['ONLINE', 'POS'] },
            notes: { type: 'string' },
          },
        },
        response: {
          201: {
            description: '訂單建立成功',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: OrderSchema,
            },
          },
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const data = CreateOrderSchema.parse(request.body)
      const order = await ordersService.createOrder(data, request.user.id)
      return reply.code(201).send(successResponse(order))
    }
  )

  server.get(
    '/',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Orders'],
        summary: '查詢訂單列表',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'],
            },
            channel: { type: 'string', enum: ['ONLINE', 'POS'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            search: { type: 'string' },
            page: { type: 'integer', default: 1, minimum: 1 },
            limit: { type: 'integer', default: 20, minimum: 1 },
          },
        },
        response: {
          200: {
            description: '成功回傳訂單列表',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: { type: 'array', items: OrderSchema },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const query = QueryOrdersSchema.parse(request.query)
      const result = await ordersService.getOrders(query)

      return reply.send(
        successResponse(result.orders, {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        })
      )
    }
  )

  server.get(
    '/:id',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Orders'],
        summary: '查詢單一訂單',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: '成功回傳訂單',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: OrderSchema,
            },
          },
          401: { description: '未授權', ...ErrorResponseSchema },
          404: { description: '找不到指定訂單', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { id } = OrderIdParamSchema.parse(request.params)
      const order = await ordersService.getOrderById(id)

      if (!order) {
        return reply.code(404).send(errorResponse('ORDER_NOT_FOUND', '找不到指定訂單'))
      }

      return reply.send(successResponse(order))
    }
  )

  server.patch(
    '/:id/status',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Orders'],
        summary: '更新訂單狀態',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'],
            },
            trackingNumber: { type: 'string' },
          },
        },
        response: {
          200: {
            description: '成功更新訂單狀態',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: OrderSchema,
            },
          },
          400: { description: '更新失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { id } = OrderIdParamSchema.parse(request.params)
      const data = UpdateOrderStatusSchema.parse(request.body)
      const order = await ordersService.updateOrderStatus(id, data)
      return reply.send(successResponse(order))
    }
  )

  server.patch(
    '/:id/payment',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Orders'],
        summary: '更新付款狀態',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
            transactionId: { type: 'string' },
          },
        },
        response: {
          200: {
            description: '成功更新付款狀態',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: OrderSchema,
            },
          },
          400: { description: '更新失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { id } = OrderIdParamSchema.parse(request.params)
      const data = UpdatePaymentStatusSchema.parse(request.body)
      const order = await ordersService.updatePaymentStatus(id, data.status, data.transactionId)
      return reply.send(successResponse(order))
    }
  )

  server.put(
    '/:id/cancel',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Orders'],
        summary: '取消訂單',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: '取消訂單成功',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: OrderSchema,
            },
          },
          400: { description: '取消失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { id } = OrderIdParamSchema.parse(request.params)
      const order = await ordersService.cancelOrder(id)
      return reply.send(successResponse(order))
    }
  )
}

export default ordersRoutes
