import { isValidLandline, isValidMobilePhone, isValidPhone } from '../../src/validators/phone'

describe('validators/phone', () => {
  describe('isValidMobilePhone', () => {
    it('should accept valid Taiwan mobile numbers', () => {
      expect(isValidMobilePhone('0912345678')).toBe(true)
      expect(isValidMobilePhone('0912-345-678')).toBe(true)
      expect(isValidMobilePhone('09 1234 5678')).toBe(true)
    })

    it('should reject invalid Taiwan mobile numbers', () => {
      expect(isValidMobilePhone('091234567')).toBe(false)
      expect(isValidMobilePhone('12345678')).toBe(false)
      expect(isValidMobilePhone('')).toBe(false)
    })
  })

  describe('isValidLandline', () => {
    it('should accept valid Taiwan landline numbers', () => {
      expect(isValidLandline('0227001234')).toBe(true)
      expect(isValidLandline('02-2700-1234')).toBe(true)
      expect(isValidLandline('037-123456')).toBe(true)
    })

    it('should reject invalid Taiwan landline numbers', () => {
      expect(isValidLandline('0912345678')).toBe(false)
      expect(isValidLandline('27001234')).toBe(false)
      expect(isValidLandline('')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should accept both valid mobile and landline', () => {
      expect(isValidPhone('0912345678')).toBe(true)
      expect(isValidPhone('02-2700-1234')).toBe(true)
    })

    it('should reject invalid phone', () => {
      expect(isValidPhone('abc')).toBe(false)
      expect(isValidPhone('12345')).toBe(false)
    })
  })
})
