import { formatPhone, formatLandline } from '../../src/formatters/phone'

describe('formatters/phone', () => {
  // formatPhone tests
  it('should format standard mobile number correctly', () => {
    expect(formatPhone('0912345678')).toBe('0912-345-678')
  })

  it('should format mobile number already with separators correctly', () => {
    expect(formatPhone('0912-345-678')).toBe('0912-345-678')
  })

  it('should format mobile number with spaces correctly', () => {
    expect(formatPhone('0912 345 678')).toBe('0912-345-678')
  })

  it('should return cleaned number if mobile number length is not 10', () => {
    expect(formatPhone('091234')).toBe('091234')
    expect(formatPhone('091234567890')).toBe('091234567890')
  })

  it('should return cleaned number if mobile number does not start with 09', () => {
    expect(formatPhone('1234567890')).toBe('1234567890')
  })

  // formatLandline tests
  it('should format standard landline number correctly with default area code', () => {
    expect(formatLandline('27001234')).toBe('(02) 2700-1234')
  })

  it('should format standard landline number correctly with specified area code', () => {
    expect(formatLandline('35008765', '03')).toBe('(03) 3500-8765')
  })

  it('should format landline number already with separators correctly', () => {
    expect(formatLandline('(02) 2700-1234')).toBe('(02) 2700-1234')
  })

  it('should format landline number with spaces correctly', () => {
    expect(formatLandline('02 2700 1234')).toBe('(02) 2700-1234')
  })

  it('should return cleaned number if landline number length is not 8 (excluding area code)', () => {
    expect(formatLandline('270012')).toBe('270012')
    expect(formatLandline('270012345')).toBe('270012345')
  })

  it('should handle landline number with different area code lengths', () => {
    // Assuming formatLandline expects areaCode to be 2 digits for (0X) format
    expect(formatLandline('12345678', '07')).toBe('(07) 1234-5678')
  })
})
