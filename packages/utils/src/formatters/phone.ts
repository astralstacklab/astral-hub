/**
 * 格式化台灣手機號碼
 * @param phone - 手機號碼字串（純數字或含分隔符）
 * @returns 格式化後的手機號碼（09XX-XXX-XXX）
 * @example formatPhone('0912345678') // '0912-345-678'
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '') // 移除非數字字元
  if (cleaned.length !== 10 || !cleaned.startsWith('09')) {
    return cleaned // 長度不符或不是09開頭，回傳原始純數字
  }
  return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7, 10)}`
}

/**
 * 格式化台灣市話號碼
 * @param phone - 市話號碼字串
 * @param areaCode - 區碼（預設 '02'）
 * @returns 格式化後的市話號碼
 * @example formatLandline('27001234', '02') // '(02) 2700-1234'
 */
export function formatLandline(phone: string, areaCode = '02'): string {
  const cleanedAreaCode = areaCode.replace(/\D/g, '')
  const cleanedPhone = phone.replace(/\D/g, '') // Remove non-digits from input phone

  let eightDigitNumber = ''

  // Case 1: cleanedPhone starts with areaCode + 8 digits (e.g., "0227001234")
  if (
    cleanedPhone.startsWith(cleanedAreaCode) &&
    cleanedPhone.length === cleanedAreaCode.length + 8
  ) {
    eightDigitNumber = cleanedPhone.substring(cleanedAreaCode.length)
  }
  // Case 2: cleanedPhone is just 8 digits (e.g., "27001234")
  else if (cleanedPhone.length === 8) {
    eightDigitNumber = cleanedPhone
  }
  // Case 3: Invalid length, return original cleaned string
  else {
    return cleanedPhone
  }

  return `(${cleanedAreaCode}) ${eightDigitNumber.substring(0, 4)}-${eightDigitNumber.substring(4, 8)}`
}
