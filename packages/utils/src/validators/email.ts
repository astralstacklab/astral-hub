/**
 * 驗證電子郵件地址格式
 * @param email - 電子郵件字串
 * @returns 是否為有效的電子郵件格式
 * @example isValidEmail('user@example.com') // true
 * @example isValidEmail('invalid') // false
 */
export function isValidEmail(email: string): boolean {
  if (!email) {
    return false
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}
