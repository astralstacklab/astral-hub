import { createHash } from 'node:crypto'
import { config } from '../config/index.js'

export function generateCheckMacValue(params: Record<string, string>): string {
  const sortedPairs = Object.entries(params)
    .filter(([key]) => key !== 'CheckMacValue')
    .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))

  const queryString = sortedPairs.map(([key, value]) => `${key}=${value}`).join('&')
  const raw = `HashKey=${config.ECPAY_HASH_KEY}&${queryString}&HashIV=${config.ECPAY_HASH_IV}`
  const encoded = encodeURIComponent(raw).toLowerCase()

  return createHash('sha256').update(encoded).digest('hex').toUpperCase()
}

export function verifyCheckMacValue(data: Record<string, string>): boolean {
  const expected = generateCheckMacValue(data)
  return expected === data.CheckMacValue
}
