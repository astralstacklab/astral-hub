import { isValidEmail } from '../../src/validators/email'

describe('validators/email', () => {
  it('should validate correct email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@domain.co.jp')).toBe(true)
  })

  it('should reject invalid email formats', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user @domain.com')).toBe(false)
  })
})
