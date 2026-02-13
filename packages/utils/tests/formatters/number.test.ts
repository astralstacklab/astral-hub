import { formatNumber, formatPercent, formatCompact } from '../../src/formatters/number'

describe('formatters/number', () => {
  // formatNumber tests
  it('should format integer with thousands separator', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('should format number with specified decimals and rounding', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1,234.57') // Rounds up
    expect(formatNumber(1234.562, 2)).toBe('1,234.56') // Rounds down
  })

  it('should format zero correctly', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(0, 2)).toBe('0.00')
  })

  it('should format negative numbers correctly', () => {
    expect(formatNumber(-1234)).toBe('-1,234')
    expect(formatNumber(-1234.567, 2)).toBe('-1,234.57')
  })

  it('should handle NaN and Infinity for formatNumber', () => {
    expect(formatNumber(NaN)).toBe('0')
    expect(formatNumber(Infinity)).toBe('0')
    expect(formatNumber(-Infinity)).toBe('0')
  })

  // formatPercent tests
  it('should format decimal to percentage with default 0 decimals', () => {
    expect(formatPercent(0.15)).toBe('15%')
    expect(formatPercent(0.156)).toBe('16%') // Rounds up
  })

  it('should format decimal to percentage with specified decimals', () => {
    expect(formatPercent(0.156, 1)).toBe('15.6%')
    expect(formatPercent(0.05, 2)).toBe('5.00%')
  })

  it('should format zero percent correctly', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(0, 1)).toBe('0.0%')
  })

  it('should handle NaN and Infinity for formatPercent', () => {
    expect(formatPercent(NaN)).toBe('0%')
    expect(formatPercent(Infinity)).toBe('0%')
    expect(formatPercent(-Infinity)).toBe('0%')
  })

  // formatCompact tests
  it('should format numbers to K abbreviation', () => {
    expect(formatCompact(1500)).toBe('1.5K')
    expect(formatCompact(1000)).toBe('1K')
    expect(formatCompact(999)).toBe('999')
  })

  it('should format numbers to M abbreviation', () => {
    expect(formatCompact(2300000)).toBe('2.3M')
    expect(formatCompact(1000000)).toBe('1M')
  })

  it('should format numbers to B abbreviation', () => {
    expect(formatCompact(1500000000)).toBe('1.5B')
    expect(formatCompact(1000000000)).toBe('1B')
  })

  it('should handle exact multiples with no decimals', () => {
    expect(formatCompact(1000)).toBe('1K')
    expect(formatCompact(2000000)).toBe('2M')
  })

  it('should handle negative numbers for compact format', () => {
    expect(formatCompact(-1500)).toBe('-1.5K')
    expect(formatCompact(-2300000)).toBe('-2.3M')
  })

  it('should handle numbers less than 1000', () => {
    expect(formatCompact(500)).toBe('500')
    expect(formatCompact(999)).toBe('999')
  })

  it('should handle NaN and Infinity for formatCompact', () => {
    expect(formatCompact(NaN)).toBe('0')
    expect(formatCompact(Infinity)).toBe('0')
    expect(formatCompact(-Infinity)).toBe('0')
  })
})
