import { formatCurrency, parseCurrency } from '../../src/formatters/currency'

describe('formatters/currency', () => {
  // formatCurrency tests
  it('should format TWD integer correctly', () => {
    expect(formatCurrency(1000)).toBe('NT$1,000')
    expect(formatCurrency(50000)).toBe('NT$50,000')
  })

  it('should format TWD with decimals correctly (TWD has 0 decimals)', () => {
    expect(formatCurrency(1234.56)).toBe('NT$1,235') // Rounds up
    expect(formatCurrency(1234.49)).toBe('NT$1,234') // Rounds down
  })

  it('should format USD correctly', () => {
    expect(formatCurrency(100, 'USD')).toBe('US$100.00')
    expect(formatCurrency(123.45, 'USD')).toBe('US$123.45')
  })

  it('should format zero value correctly', () => {
    expect(formatCurrency(0)).toBe('NT$0')
    expect(formatCurrency(0, 'USD')).toBe('US$0.00')
  })

  it('should format negative numbers correctly', () => {
    expect(formatCurrency(-500)).toBe('-NT$500')
    expect(formatCurrency(-123.45, 'USD')).toBe('-US$123.45')
  })

  // parseCurrency tests
  it('should parse TWD currency string to number', () => {
    expect(parseCurrency('NT$1,000')).toBe(1000)
    expect(parseCurrency('NT$50,000')).toBe(50000)
    expect(parseCurrency('-NT$500')).toBe(-500)
  })

  it('should parse USD currency string to number', () => {
    expect(parseCurrency('US$100.00')).toBe(100)
    expect(parseCurrency('$1,234.56')).toBe(1234.56)
    expect(parseCurrency('-US$123.45')).toBe(-123.45)
  })

  it('should return 0 for empty string input', () => {
    expect(parseCurrency('')).toBe(0)
  })

  it('should return 0 for invalid string input', () => {
    expect(parseCurrency('abc')).toBe(0)
    expect(parseCurrency('not a number')).toBe(0) // Ensure it doesn't parse partial numbers
    expect(parseCurrency('hello NT$100')).toBe(100) // Should parse valid number within invalid string
  })

  it('should handle numbers with commas and decimals correctly (Taiwan/US format)', () => {
    expect(parseCurrency('1,234,567.89')).toBe(1234567.89)
    expect(parseCurrency('1,234')).toBe(1234)
  })

  it('should handle numbers with dots and commas (European format)', () => {
    expect(parseCurrency('1.234.567,89')).toBe(1234567.89)
    expect(parseCurrency('1.234,56')).toBe(1234.56)
  })

  it('should handle negative values during parsing', () => {
    expect(parseCurrency('-1,000')).toBe(-1000)
    expect(parseCurrency('-123.45')).toBe(-123.45)
  })
})
