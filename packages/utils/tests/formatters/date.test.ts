import { formatDate, formatRelativeTime } from '../../src/formatters/date'

describe('formatters/date', () => {
  // Mock Date.now() for consistent relative time testing
  const MOCK_DATE_NOW = new Date(2026, 0, 15, 12, 0, 0).getTime() // Jan 15, 2026 12:00:00
  let originalDateNow: (this: DateConstructor) => number

  beforeAll(() => {
    originalDateNow = Date.now
    Date.now = () => MOCK_DATE_NOW
  })

  afterAll(() => {
    Date.now = originalDateNow
  })

  // formatDate tests
  it('should format date to default YYYY-MM-DD format', () => {
    const date = new Date(2026, 0, 15) // Jan 15, 2026
    expect(formatDate(date)).toBe('2026-01-15')
  })

  it('should format date to custom YYYY/MM/DD format', () => {
    const date = new Date(2026, 0, 15)
    expect(formatDate(date, 'YYYY/MM/DD')).toBe('2026/01/15')
  })

  it('should format date with full time tokens', () => {
    const date = new Date(2026, 0, 15, 10, 30, 5) // Jan 15, 2026 10:30:05
    expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2026-01-15 10:30:05')
  })

  it('should handle single digit month/day/hour/minute/second with padding', () => {
    const date = new Date(2026, 0, 5, 2, 3, 4) // Jan 5, 2026 02:03:04
    expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2026-01-05 02:03:04')
  })

  it('should format ISO string input', () => {
    const isoString = '2026-01-15T10:30:00Z'
    expect(formatDate(isoString, 'YYYY/MM/DD HH:mm')).toBe('2026/01/15 18:30') // Adjust for timezone if running in non-UTC
  })

  it('should return empty string for null/undefined date input for formatDate', () => {
    expect(formatDate(null as unknown as string)).toBe('') // Test with null input
    expect(formatDate(undefined as unknown as string)).toBe('') // Test with undefined input
  })

  // formatRelativeTime tests
  it('should return "剛剛" for less than 1 minute ago', () => {
    const date = new Date(MOCK_DATE_NOW - 30 * 1000) // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('剛剛')
  })

  it('should return "X 分鐘前" for minutes ago', () => {
    const date = new Date(MOCK_DATE_NOW - 5 * 60 * 1000) // 5 minutes ago
    expect(formatRelativeTime(date)).toBe('5 分鐘前')
  })

  it('should return "X 小時前" for hours ago', () => {
    const date = new Date(MOCK_DATE_NOW - 3 * 60 * 60 * 1000) // 3 hours ago
    expect(formatRelativeTime(date)).toBe('3 小時前')
  })

  it('should return "X 天前" for days ago', () => {
    const date = new Date(MOCK_DATE_NOW - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    expect(formatRelativeTime(date)).toBe('7 天前')
  })

  it('should return "X 個月前" for months ago', () => {
    const date = new Date(MOCK_DATE_NOW - 45 * 24 * 60 * 60 * 1000) // 45 days ago (approx 1 month)
    expect(formatRelativeTime(date)).toBe('1 個月前')
    const date2 = new Date(MOCK_DATE_NOW - 65 * 24 * 60 * 60 * 1000) // 65 days ago (approx 2 months)
    expect(formatRelativeTime(date2)).toBe('2 個月前')
  })

  it('should return "X 年前" for years ago', () => {
    const date = new Date(MOCK_DATE_NOW - 400 * 24 * 60 * 60 * 1000) // 400 days ago (approx 1 year)
    expect(formatRelativeTime(date)).toBe('1 年前')
    const date2 = new Date(MOCK_DATE_NOW - 800 * 24 * 60 * 60 * 1000) // 800 days ago (approx 2 years)
    expect(formatRelativeTime(date2)).toBe('2 年前')
  })

  it('should return empty string for null/undefined date input for formatRelativeTime', () => {
    expect(formatRelativeTime(null as unknown as string)).toBe('')
    expect(formatRelativeTime(undefined as unknown as string)).toBe('')
  })
})
