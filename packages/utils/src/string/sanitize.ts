/**
 * 清理 HTML 標籤，防止 XSS
 * @param input - 可能含有 HTML 的字串
 * @returns 清理後的純文字
 * @example sanitizeHtml('<script>alert("xss")</script>') // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function sanitizeHtml(input: string): string {
  if (!input) {
    return ''
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 截斷字串並加上省略符號
 * @param text - 原始字串
 * @param maxLength - 最大長度（含省略符號）
 * @param suffix - 省略符號（預設 '...'）
 * @returns 截斷後的字串
 * @example truncate('這是一段很長的文字', 6) // '這是一...'
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (!text) {
    return ''
  }

  if (text.length <= maxLength) {
    return text
  }

  if (maxLength <= suffix.length) {
    return suffix.slice(0, maxLength)
  }

  return `${text.slice(0, maxLength - suffix.length)}${suffix}`
}
