/**
 * 將數字補零至指定長度
 * @param num - 數字
 * @param len - 長度
 * @returns 補零後的字串
 */
function padZero(num: number, len: number = 2): string {
  return String(num).padStart(len, '0')
}

/**
 * 將日期格式化為指定格式字串
 * @param date - Date 物件或 ISO 字串
 * @param format - 格式字串（預設 'YYYY-MM-DD'）
 * @returns 格式化後的日期字串
 * @example formatDate(new Date(2026, 0, 15)) // '2026-01-15'
 * @example formatDate('2026-01-15T10:30:00Z', 'YYYY/MM/DD') // '2026/01/15'
 */
export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  if (date === null || date === undefined) {
    return ''
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return '' // 無效日期回傳空字串
  }

  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const seconds = d.getSeconds()

  return format
    .replace(/YYYY/g, String(year))
    .replace(/MM/g, padZero(month))
    .replace(/DD/g, padZero(day))
    .replace(/HH/g, padZero(hours))
    .replace(/mm/g, padZero(minutes))
    .replace(/ss/g, padZero(seconds))
}

/**
 * 將日期格式化為相對時間描述
 * @param date - Date 物件或 ISO 字串
 * @returns 相對時間字串（繁體中文）
 * @example formatRelativeTime(oneMinuteAgo) // '1 分鐘前'
 */
export function formatRelativeTime(date: Date | string): string {
  if (date === null || date === undefined) {
    return ''
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return '' // 無效日期回傳空字串
  }

  const now = Date.now()
  const diff = now - d.getTime() // 毫秒差

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30) // 簡化為 30 天/月
  const years = Math.floor(days / 365) // 簡化為 365 天/年

  if (seconds < 60) {
    return '剛剛'
  } else if (minutes < 60) {
    return `${minutes} 分鐘前`
  } else if (hours < 24) {
    return `${hours} 小時前`
  } else if (days < 30) {
    return `${days} 天前`
  } else if (months < 12) {
    return `${months} 個月前`
  } else {
    return `${years} 年前`
  }
}
