/**
 * 將數字格式化為千分位字串
 * @param value - 數字
 * @param decimals - 小數位數（預設 0）
 * @returns 格式化後的字串
 * @example formatNumber(1234567) // '1,234,567'
 * @example formatNumber(1234.5678, 2) // '1,234.57'
 */
export function formatNumber(value: number, decimals = 0): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0'
  }
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * 將數字格式化為百分比字串
 * @param value - 小數值（0.15 = 15%）
 * @param decimals - 小數位數（預設 0）
 * @returns 百分比字串
 * @example formatPercent(0.156, 1) // '15.6%'
 */
export function formatPercent(value: number, decimals = 0): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0%'
  }
  return new Intl.NumberFormat('zh-TW', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * 將大數字縮寫為 K/M/B 表示
 * @param value - 數字
 * @returns 縮寫字串
 * @example formatCompact(1500) // '1.5K'
 * @example formatCompact(2300000) // '2.3M'
 */
export function formatCompact(value: number): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0'
  }

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1_000_000_000) {
    return `${sign}${formatNumber(absValue / 1_000_000_000, absValue % 1_000_000_000 === 0 ? 0 : 1)}B`
  }
  if (absValue >= 1_000_000) {
    return `${sign}${formatNumber(absValue / 1_000_000, absValue % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (absValue >= 1_000) {
    return `${sign}${formatNumber(absValue / 1_000, absValue % 1_000 === 0 ? 0 : 1)}K`
  }
  return formatNumber(value, 0) // No decimals for numbers < 1000
}
