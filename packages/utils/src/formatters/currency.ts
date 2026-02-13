/**
 * 將數字格式化為貨幣字串
 * @param amount - 金額
 * @param currency - 貨幣代碼（預設 'TWD'）
 * @returns 格式化後的貨幣字串
 * @example formatCurrency(1000) // 'NT$1,000'
 * @example formatCurrency(1234.56, 'USD') // 'US$1,234.56'
 */
export function formatCurrency(amount: number, currency = 'TWD'): string {
  if (currency === 'TWD') {
    const sign = amount < 0 ? '-' : ''
    const formatted = new Intl.NumberFormat('zh-TW', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount))
    return `${sign}NT$${formatted}`
  } else {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }
}

/**
 * 從貨幣字串解析出數字
 * @param value - 貨幣字串
 * @returns 解析後的數字
 * @example parseCurrency('NT$1,000') // 1000
 * @example parseCurrency('$1,234.56') // 1234.56
 * @example parseCurrency('1.234.567,89') // 1234567.89
 */
export function parseCurrency(value: string): number {
  if (!value) {
    return 0
  }

  // Strip everything except digits, dots, commas, and minus sign
  let cleaned = value.replace(/[^0-9.,-]/g, '')

  if (!cleaned) {
    return 0
  }

  const lastCommaIdx = cleaned.lastIndexOf(',')
  const lastDotIdx = cleaned.lastIndexOf('.')

  if (lastCommaIdx > -1 && lastDotIdx > -1) {
    if (lastCommaIdx > lastDotIdx) {
      // European: 1.234.567,89 → dot is thousands, comma is decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // US/TW: 1,234,567.89 → comma is thousands, dot is decimal
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (lastCommaIdx > -1) {
    // Only commas — check if it's a thousands separator or decimal
    // If exactly 3 digits after the last comma, treat as thousands separator
    const afterLastComma = cleaned.slice(lastCommaIdx + 1)
    if (/^\d{3}$/.test(afterLastComma)) {
      cleaned = cleaned.replace(/,/g, '')
    } else {
      // Treat comma as decimal separator (e.g. "1,5" → 1.5)
      cleaned = cleaned.replace(',', '.')
    }
  }
  // Only dots or no separators: parseFloat handles correctly

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}
