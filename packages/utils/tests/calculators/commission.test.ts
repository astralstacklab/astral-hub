import {
  calculateCommission,
  calculateNetIncome,
  calculateProfitMargin,
} from '../../src/calculators/commission'

describe('calculators/commission', () => {
  describe('calculateCommission', () => {
    it('should calculate commission correctly', () => {
      expect(calculateCommission(1000, 10)).toBe(100)
      expect(calculateCommission(2500, 12)).toBe(300)
    })

    it('should return 0 when selling price is 0', () => {
      expect(calculateCommission(0, 10)).toBe(0)
    })
  })

  describe('calculateNetIncome', () => {
    it('should calculate net income with listing fee', () => {
      expect(calculateNetIncome(1000, 500, 10, 30)).toBe(370)
    })

    it('should calculate net income without listing fee', () => {
      expect(calculateNetIncome(1000, 500, 10)).toBe(400)
    })

    it('should handle negative result naturally', () => {
      expect(calculateNetIncome(500, 700, 10, 20)).toBe(-270)
    })
  })

  describe('calculateProfitMargin', () => {
    it('should calculate profit margin correctly', () => {
      expect(calculateProfitMargin(1000, 500)).toBe(0.5)
    })

    it('should return 0 when selling price is 0', () => {
      expect(calculateProfitMargin(0, 500)).toBe(0)
    })

    it('should return negative margin for loss', () => {
      expect(calculateProfitMargin(500, 1000)).toBe(-1)
    })
  })
})
