import { z } from 'zod/v4'

export const QuerySalesReportSchema = z.object({
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export const QueryProductStatsSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const QuerySellerCommissionSchema = z.object({
  sellerId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const QueryDashboardSchema = z.object({})

export const ExportCSVSchema = z.object({
  reportType: z.enum(['sales', 'products', 'sellers']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type QuerySalesReportInput = z.infer<typeof QuerySalesReportSchema>
export type QueryProductStatsInput = z.infer<typeof QueryProductStatsSchema>
export type QuerySellerCommissionInput = z.infer<typeof QuerySellerCommissionSchema>
export type QueryDashboardInput = z.infer<typeof QueryDashboardSchema>
export type ExportCSVInput = z.infer<typeof ExportCSVSchema>

export interface SalesReportOutput {
  period: string
  startDate: string
  endDate: string
  summary: {
    totalRevenue: string
    totalOrders: number
    totalProducts: number
    averageOrderValue: string
  }
  breakdown: {
    selfOperated: { revenue: string; orders: number; products: number }
    consignment: { revenue: string; orders: number; products: number; commission: string }
  }
  channels: {
    online: { revenue: string; orders: number }
    pos: { revenue: string; orders: number }
  }
  dailyData: Array<{ date: string; revenue: string; orders: number }>
}

export interface ProductStatsOutput {
  topSelling: Array<{
    productId: string
    productName: string
    category: string
    soldCount: number
    revenue: string
  }>
  inventory: {
    pending: number
    listed: number
    sold: number
    total: number
  }
  categoryBreakdown: Array<{
    category: string
    count: number
    revenue: string
  }>
}

export interface SellerCommissionOutput {
  startDate: string
  endDate: string
  sellers: Array<{
    sellerId: string
    sellerName: string
    commissionRate: string
    totalRevenue: string
    platformCommission: string
    sellerEarnings: string
    totalOrders: number
  }>
}

export interface DashboardOutput {
  overview: {
    totalRevenue: string
    totalOrders: number
    totalProducts: number
    activeSellers: number
  }
  recentTrends: {
    last7DaysRevenue: string
    last7DaysOrders: number
    last30DaysRevenue: string
    last30DaysOrders: number
    revenueGrowthRate7d: string
    revenueGrowthRate30d: string
  }
  quickStats: {
    pendingOrders: number
    pendingPayments: number
    lowStockProducts: number
    activeAuctions: number
  }
}
