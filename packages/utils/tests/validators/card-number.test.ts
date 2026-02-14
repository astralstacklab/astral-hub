import { isValidCardNumber, parseCardNumber } from '../../src/validators/card-number'

describe('validators/card-number', () => {
  describe('isValidCardNumber', () => {
    it('should accept valid card number formats', () => {
      expect(isValidCardNumber('PKM-001-2026')).toBe(true)
      expect(isValidCardNumber('YGO-12345-2025')).toBe(true)
      expect(isValidCardNumber('MT-1-2024')).toBe(true)
    })

    it('should reject invalid card number formats', () => {
      expect(isValidCardNumber('')).toBe(false)
      expect(isValidCardNumber('pkm-001-2026')).toBe(false)
      expect(isValidCardNumber('PKM-001')).toBe(false)
      expect(isValidCardNumber('P-001-2026')).toBe(false)
      expect(isValidCardNumber('ABCDEF-001-2026')).toBe(false)
    })
  })

  describe('parseCardNumber', () => {
    it('should parse valid card number', () => {
      expect(parseCardNumber('PKM-001-2026')).toEqual({
        series: 'PKM',
        number: '001',
        year: '2026',
      })
    })

    it('should return null for invalid card number', () => {
      expect(parseCardNumber('')).toBeNull()
      expect(parseCardNumber('invalid-format')).toBeNull()
      expect(parseCardNumber('pkm-001-2026')).toBeNull()
    })
  })
})
