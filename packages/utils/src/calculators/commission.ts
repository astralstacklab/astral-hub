/**
 * 計算佣金金額
 * @param sellingPrice - 銷售價格
 * @param commissionRate - 佣金比率（百分比，例如 10 = 10%）
 * @returns 佣金金額
 * @example calculateCommission(1000, 10) // 100
 */
export function calculateCommission(sellingPrice: number, commissionRate: number): number {
  return sellingPrice * (commissionRate / 100)
}

/**
 * 計算淨收入
 * @param sellingPrice - 銷售價格
 * @param costPrice - 成本價格
 * @param commissionRate - 佣金比率（百分比）
 * @param listingFee - 上架費（預設 0）
 * @returns 淨收入
 * @example calculateNetIncome(1000, 500, 10, 30) // 370
 */
export function calculateNetIncome(
  sellingPrice: number,
  costPrice: number,
  commissionRate: number,
  listingFee = 0
): number {
  const commission = calculateCommission(sellingPrice, commissionRate)
  return sellingPrice - costPrice - commission - listingFee
}

/**
 * 計算利潤率
 * @param sellingPrice - 銷售價格
 * @param costPrice - 成本價格
 * @returns 利潤率（0-1 之間的小數，例如 0.5 = 50%）
 * @example calculateProfitMargin(1000, 500) // 0.5
 */
export function calculateProfitMargin(sellingPrice: number, costPrice: number): number {
  if (sellingPrice === 0) {
    return 0
  }

  return (sellingPrice - costPrice) / sellingPrice
}
