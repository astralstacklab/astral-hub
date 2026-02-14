const CARD_NUMBER_PATTERN = /^([A-Z]{2,5})-(\d{1,5})-(\d{4})$/

export interface ParsedCardNumber {
  series: string
  number: string
  year: string
}

/**
 * 驗證收藏卡編號格式
 * @param cardNumber - 卡片編號字串
 * @returns 是否為有效的卡片編號格式
 * @example isValidCardNumber('PKM-001-2026') // true
 * @example isValidCardNumber('') // false
 */
export function isValidCardNumber(cardNumber: string): boolean {
  if (!cardNumber) {
    return false
  }

  return CARD_NUMBER_PATTERN.test(cardNumber)
}

/**
 * 解析卡片編號，提取系列代碼和序號
 * @param cardNumber - 卡片編號字串
 * @returns 解析結果，或 null（格式無效時）
 * @example parseCardNumber('PKM-001-2026') // { series: 'PKM', number: '001', year: '2026' }
 */
export function parseCardNumber(cardNumber: string): ParsedCardNumber | null {
  if (!cardNumber) {
    return null
  }

  const match = cardNumber.match(CARD_NUMBER_PATTERN)
  if (!match) {
    return null
  }

  return {
    series: match[1],
    number: match[2],
    year: match[3],
  }
}
