/**
 * 整合測試：驗證 @card-erp/utils 與 @card-erp/shared-types 的跨套件引用
 *
 * 目的：確認 workspace 依賴解析正確、型別正確傳遞、enum 值可在執行期使用
 */
import {
  // Enums（執行期值）
  ProductType,
  ProductStatus,
  ProductChannel,
  GradingStatus,
  OrderStatus,
  AuctionStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
  UserRole,
  AdminRole,
} from '@card-erp/shared-types'

import type {
  // Entities（純型別）
  Product,
  Order,
  User,
  // API
  SuccessResponse,
  ErrorResponse,
  ApiResponse,
  PaginationMeta,
} from '@card-erp/shared-types'

// Utils 函數
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  calculateCommission,
  calculateNetIncome,
  calculateProfitMargin,
  isValidEmail,
  isValidCardNumber,
  parseCardNumber,
} from '../../src/index'

describe('cross-package integration', () => {
  describe('shared-types enum imports', () => {
    it('should access ProductType enum values at runtime', () => {
      expect(ProductType.CARD).toBe('CARD')
      expect(ProductType.ACCESSORY).toBe('ACCESSORY')
    })

    it('should access ProductStatus enum values at runtime', () => {
      expect(ProductStatus.PENDING).toBe('PENDING')
      expect(ProductStatus.LISTED).toBe('LISTED')
      expect(ProductStatus.SOLD).toBe('SOLD')
    })

    it('should access GradingStatus enum values at runtime', () => {
      expect(GradingStatus.RAW).toBe('RAW')
      expect(GradingStatus.PSA).toBe('PSA')
      expect(GradingStatus.BGS).toBe('BGS')
    })

    it('should access OrderStatus enum values at runtime', () => {
      expect(OrderStatus.PENDING).toBe('PENDING')
    })

    it('should access AuctionStatus enum values at runtime', () => {
      expect(AuctionStatus.ACTIVE).toBe('ACTIVE')
    })

    it('should access ProductChannel enum values at runtime', () => {
      expect(ProductChannel.ONLINE).toBe('ONLINE')
      expect(ProductChannel.OFFLINE).toBe('OFFLINE')
      expect(ProductChannel.BOTH).toBe('BOTH')
    })

    it('should access PaymentMethod and PaymentStatus enum values at runtime', () => {
      expect(PaymentMethod.CREDIT_CARD).toBe('CREDIT_CARD')
      expect(PaymentStatus.PAID).toBe('PAID')
    })

    it('should access ShippingMethod enum values at runtime', () => {
      expect(ShippingMethod.SEVEN_ELEVEN).toBe('SEVEN_ELEVEN')
    })

    it('should access UserRole and AdminRole enum values at runtime', () => {
      expect(UserRole.BUYER).toBe('BUYER')
      expect(AdminRole.SUPER_ADMIN).toBe('SUPER_ADMIN')
    })
  })

  describe('shared-types type compatibility with utils', () => {
    it('should use utils formatters with shared-types Product fields', () => {
      const product: Pick<Product, 'sellingPrice' | 'costPrice'> = {
        sellingPrice: 1500,
        costPrice: 800,
      }

      const formatted = formatCurrency(product.sellingPrice)
      expect(formatted).toContain('1,500')

      const margin = calculateProfitMargin(product.sellingPrice, product.costPrice)
      expect(margin).toBeCloseTo(0.4667, 3)
    })

    it('should calculate commission for a Product sale', () => {
      const sellingPrice = 2000
      const commissionRate = 10 // 10%

      const commission = calculateCommission(sellingPrice, commissionRate)
      expect(commission).toBe(200)

      const netIncome = calculateNetIncome(sellingPrice, 1000, commissionRate, 50)
      expect(netIncome).toBe(750) // 2000 - 1000 - 200 - 50
    })

    it('should validate card number format used in Product.cardNumber', () => {
      expect(isValidCardNumber('PKM-001-2026')).toBe(true)
      expect(isValidCardNumber('YGO-12345-2025')).toBe(true)

      const parsed = parseCardNumber('PKM-001-2026')
      expect(parsed).toEqual({ series: 'PKM', number: '001', year: '2026' })
    })

    it('should format numbers consistent with shared-types numeric fields', () => {
      const order: Pick<Order, 'totalAmount'> = {
        totalAmount: 12500,
      }
      expect(formatNumber(order.totalAmount)).toBe('12,500')
      expect(formatPercent(0.15)).toBe('15%')
    })

    it('should validate email for User entity', () => {
      const user: Pick<User, 'email'> = {
        email: 'buyer@example.com',
      }
      expect(isValidEmail(user.email)).toBe(true)
    })
  })

  describe('shared-types API response type compatibility', () => {
    it('should construct typed SuccessResponse with Product data', () => {
      const response: SuccessResponse<{ id: string; name: string }> = {
        success: true,
        data: { id: '1', name: 'Test Card' },
      }
      expect(response.success).toBe(true)
      expect(response.data.name).toBe('Test Card')
    })

    it('should construct typed ErrorResponse', () => {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      }
      expect(response.success).toBe(false)
      expect(response.error.code).toBe('NOT_FOUND')
    })

    it('should construct PaginationMeta', () => {
      const meta: PaginationMeta = {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      }
      expect(meta.totalPages).toBe(5)
    })

    it('should use ApiResponse union type', () => {
      const success: ApiResponse<string> = { success: true, data: 'ok' }
      const error: ApiResponse<string> = {
        success: false,
        error: { code: 'ERR', message: 'fail' },
      }

      expect(success.success).toBe(true)
      expect(error.success).toBe(false)
    })
  })
})
