/**
 * 驗證台灣手機號碼格式
 * @param phone - 手機號碼字串
 * @returns 是否為有效的台灣手機號碼
 * @example isValidMobilePhone('0912345678') // true
 * @example isValidMobilePhone('02-27001234') // false
 */
export function isValidMobilePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return /^09\d{8}$/.test(cleaned)
}

/**
 * 驗證台灣市話號碼格式
 * @param phone - 市話號碼字串（含區碼）
 * @returns 是否為有效的台灣市話號碼
 * @example isValidLandline('02-27001234') // true
 * @example isValidLandline('0912345678') // false
 */
export function isValidLandline(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')

  if (!cleaned.startsWith('0') || cleaned.startsWith('09')) {
    return false
  }

  if (cleaned.length < 9 || cleaned.length > 10) {
    return false
  }

  // 台灣市話：區碼 2-3 碼（含前導 0），號碼 6-8 碼
  for (const areaCodeLength of [2, 3]) {
    const numberLength = cleaned.length - areaCodeLength
    if (numberLength >= 6 && numberLength <= 8) {
      return true
    }
  }

  return false
}

/**
 * 驗證台灣電話號碼（手機或市話）
 * @param phone - 電話號碼字串
 * @returns 是否為有效的台灣電話號碼
 * @example isValidPhone('0912345678') // true
 * @example isValidPhone('02-27001234') // true
 */
export function isValidPhone(phone: string): boolean {
  return isValidMobilePhone(phone) || isValidLandline(phone)
}
