/**
 * 將字串轉為 URL-safe slug
 * @param text - 原始字串
 * @returns URL-safe slug 字串
 * @example toSlug('Hello World') // 'hello-world'
 * @example toSlug('寶可夢 卡片 001') // '寶可夢-卡片-001'
 */
export function toSlug(text: string): string {
  if (!text) {
    return ''
  }

  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
