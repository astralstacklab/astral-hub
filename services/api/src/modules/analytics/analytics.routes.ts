import type { FastifyPluginAsync } from 'fastify'
import { stringify } from 'csv-stringify/sync'
import { AnalyticsService } from './analytics.service.js'
import {
  ExportCSVSchema,
  QueryDashboardSchema,
  QueryProductStatsSchema,
  QuerySalesReportSchema,
  QuerySellerCommissionSchema,
} from './analytics.schema.js'
import { successResponse } from '../../utils/response.js'

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

const analyticsRoutes: FastifyPluginAsync = async (server) => {
  const service = new AnalyticsService(server.prisma, server.redis)

  server.get(
    '/sales',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: '銷售報表',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          required: ['period', 'startDate'],
          properties: {
            period: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
          },
        },
        response: {
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const query = QuerySalesReportSchema.parse(request.query)
      const result = await service.getSalesReport(query)
      return reply.send(successResponse(result))
    }
  )

  server.get(
    '/products',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: '商品統計',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
        response: {
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const query = QueryProductStatsSchema.parse(request.query)
      const result = await service.getProductStats(query)
      return reply.send(successResponse(result))
    }
  )

  server.get(
    '/sellers',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: '賣家佣金統計',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          required: ['startDate', 'endDate'],
          properties: {
            sellerId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
          },
        },
        response: {
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const query = QuerySellerCommissionSchema.parse(request.query)
      const result = await service.getSellerCommission(query)
      return reply.send(successResponse(result))
    }
  )

  server.get(
    '/dashboard',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: '分析儀表板',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {},
        },
        response: {
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      QueryDashboardSchema.parse(request.query)
      const result = await service.getDashboard()
      return reply.send(successResponse(result))
    }
  )

  server.get(
    '/export',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: '匯出分析報表 CSV',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          required: ['reportType', 'startDate', 'endDate'],
          properties: {
            reportType: { type: 'string', enum: ['sales', 'products', 'sellers'] },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
          },
        },
        response: {
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const query = ExportCSVSchema.parse(request.query)

      let rows: Array<Record<string, unknown>>
      if (query.reportType === 'sales') {
        const report = await service.getSalesReport({
          period: 'CUSTOM',
          startDate: query.startDate,
          endDate: query.endDate,
        })
        rows = report.dailyData
      } else if (query.reportType === 'products') {
        const report = await service.getProductStats({
          startDate: query.startDate,
          endDate: query.endDate,
          limit: 100,
        })
        rows = report.topSelling
      } else {
        const report = await service.getSellerCommission({
          startDate: query.startDate,
          endDate: query.endDate,
        })
        rows = report.sellers
      }

      const csv = stringify(rows, { header: true, bom: true })
      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header(
          'Content-Disposition',
          `attachment; filename="${query.reportType}-${query.startDate}-${query.endDate}.csv"`
        )
        .send(csv)
    }
  )
}

export default analyticsRoutes
