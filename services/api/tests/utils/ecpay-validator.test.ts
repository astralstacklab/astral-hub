import { describe, expect, it } from 'vitest'
import { generateCheckMacValue, verifyCheckMacValue } from '../../src/utils/ecpay-validator.js'

describe('ecpay-validator', () => {
  const baseParams = {
    MerchantID: '2000132',
    MerchantTradeNo: 'ORD20260215001',
    TradeNo: '2502151234567890',
    TradeAmt: '300',
    RtnCode: '1',
    RtnMsg: 'Succeeded',
    PaymentType: 'Credit_CreditCard',
    PaymentDate: '2026/02/15 21:00:00',
  }

  it('generateCheckMacValue should return 64-char uppercase hex', () => {
    const value = generateCheckMacValue(baseParams)
    expect(value).toMatch(/^[A-F0-9]{64}$/)
  })

  it('generateCheckMacValue should be deterministic for same params', () => {
    const a = generateCheckMacValue(baseParams)
    const b = generateCheckMacValue(baseParams)
    expect(a).toBe(b)
  })

  it('verifyCheckMacValue should return true for valid value', () => {
    const checkMacValue = generateCheckMacValue(baseParams)
    const isValid = verifyCheckMacValue({
      ...baseParams,
      CheckMacValue: checkMacValue,
    })
    expect(isValid).toBe(true)
  })

  it('verifyCheckMacValue should return false for invalid value', () => {
    const isValid = verifyCheckMacValue({
      ...baseParams,
      CheckMacValue: 'INVALID',
    })
    expect(isValid).toBe(false)
  })
})
