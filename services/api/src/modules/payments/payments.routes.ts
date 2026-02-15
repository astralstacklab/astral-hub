import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod/v4'
import { PaymentsService } from './payments.service.js'
import {
  UpdatePaymentStatusSchema,
  ECPayCallbackSchema,
  CreatePaymentLogSchema,
} from './payments.schema.js'
import { successResponse, errorResponse } from '../../utils/response.js'
import { verifyCheckMacValue } from '../../utils/ecpay-validator.js'

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

const PaymentLogSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    orderId: { type: 'string', format: 'uuid' },
    provider: { type: 'string', enum: ['ECPAY', 'MANUAL', 'CASH'] },
    method: { type: 'string' },
    amount: { type: 'number' },
    status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
    transactionId: { type: 'string', nullable: true },
    requestData: { type: 'object', nullable: true },
    responseData: { type: 'object', nullable: true },
    errorCode: { type: 'string', nullable: true },
    errorMessage: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

const CashPaymentSchema = z.object({
  orderId: z.string().uuid(),
})

const LogsParamSchema = z.object({
  orderId: z.string().uuid(),
})

const paymentsRoutes: FastifyPluginAsync = async (server) => {
  const paymentsService = new PaymentsService(server.prisma)

  server.post(
    '/status',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Payments'],
        summary: '更新付款狀態',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['orderId', 'status'],
          properties: {
            orderId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PAID', 'FAILED', 'REFUNDED'] },
            transactionId: { type: 'string' },
            paidAmount: { type: 'number', exclusiveMinimum: 0 },
            paidAt: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            description: '成功更新付款狀態',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: { type: 'object', additionalProperties: true },
            },
          },
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const data = UpdatePaymentStatusSchema.parse(request.body)
      const order = await paymentsService.updatePaymentStatus(data)
      return reply.send(successResponse(order))
    }
  )

  server.post(
    '/cash',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Payments'],
        summary: '現金付款',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            description: '現金付款成功',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: { type: 'object', additionalProperties: true },
            },
          },
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { orderId } = CashPaymentSchema.parse(request.body)
      const order = await paymentsService.processCashPayment(orderId)
      return reply.send(successResponse(order))
    }
  )

  server.post(
    '/ecpay/callback',
    {
      schema: {
        tags: ['Payments'],
        summary: '綠界付款回調',
        response: {
          200: {
            description: '綠界要求純文字回應',
            type: 'string',
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = ECPayCallbackSchema.parse(request.body)
        if (!verifyCheckMacValue(data)) {
          return reply.type('text/plain').send('0|Error')
        }

        await paymentsService.handleECPayCallback(data)
        return reply.type('text/plain').send('1|OK')
      } catch {
        return reply.type('text/plain').send('0|Error')
      }
    }
  )

  server.get(
    '/logs/:orderId',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Payments'],
        summary: '查詢付款記錄',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            description: '成功回傳付款記錄',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: { type: 'array', items: PaymentLogSchema },
            },
          },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { orderId } = LogsParamSchema.parse(request.params)
      const logs = await paymentsService.getPaymentLogsByOrderId(orderId)
      return reply.send(successResponse(logs))
    }
  )

  server.post(
    '/ecpay/create',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Payments'],
        summary: '建立綠界訂單（預留）',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            orderId: { type: 'string', format: 'uuid' },
            provider: { type: 'string', enum: ['ECPAY', 'MANUAL', 'CASH'] },
            method: { type: 'string' },
            amount: { type: 'number', exclusiveMinimum: 0 },
            status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
            transactionId: { type: 'string' },
          },
        },
        response: {
          501: { description: '尚未實作', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      CreatePaymentLogSchema.partial().parse(request.body ?? {})
      return reply.code(501).send(errorResponse('NOT_IMPLEMENTED', '尚未實作'))
    }
  )
}

export default paymentsRoutes
