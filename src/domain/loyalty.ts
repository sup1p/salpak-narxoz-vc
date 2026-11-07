export type Status = 'sand' | 'nugget' | 'bar'

/** One progress ladder only (review 2026-11-07); names don't clash with gold stages (pinch/pile/bar). */
export const STATUS_LABEL: Record<Status, string> = { sand: 'Базовый', nugget: 'Плюс', bar: 'Макс' }
export const CASHBACK_RATE: Record<Status, number> = { sand: 0.01, nugget: 0.015, bar: 0.02 }
export const NUGGET_FROM = 100_000
export const BAR_FROM = 500_000
export const BAR_REGULAR_MONTHS = 2
export const MONTHLY_CAP_KZT = 5000

/** Bank-held portfolio only: card + savings + gold (+ USDT held in bank custody). Partner assets are excluded. */
export function portfolioKzt(
  s: { cardKzt: number; savingsKzt: number; gold: number; usdt?: number },
  market: number,
  usdtRate = 0,
): number {
  return s.cardKzt + s.savingsKzt + s.gold * market + (s.usdt ?? 0) * usdtRate
}

/**
 * Portfolio used for the loyalty status: tenge balances + gold at its PURCHASE cost (+ bank-held USDT).
 * Market moves never change the status (review 2026-11-07).
 */
export function statusPortfolioKzt(
  s: { cardKzt: number; savingsKzt: number; gold: number; avgPrice: number; usdt?: number },
  usdtRate = 0,
): number {
  return s.cardKzt + s.savingsKzt + s.gold * s.avgPrice + (s.usdt ?? 0) * usdtRate
}

/** 'YYYY-MM' of a timestamp. */
export const monthKey = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Consecutive months with a top-up, counting back from the month of `now`. */
export function regularStreak(topupMonths: string[], now: number): number {
  const set = new Set(topupMonths)
  const d = new Date(now)
  let n = 0
  while (set.has(monthKey(d.getTime()))) {
    n++
    d.setMonth(d.getMonth() - 1)
  }
  return n
}

export function statusFor(portfolio: number, regularMonths: number): Status {
  if (portfolio >= BAR_FROM && regularMonths >= BAR_REGULAR_MONTHS) return 'bar'
  if (portfolio >= NUGGET_FROM) return 'nugget'
  return 'sand'
}

export function nextStatusGap(portfolio: number, regularMonths: number): { next: Status; gapKzt: number } | null {
  const s = statusFor(portfolio, regularMonths)
  if (s === 'sand') return { next: 'nugget', gapKzt: NUGGET_FROM - portfolio }
  if (s === 'nugget') return { next: 'bar', gapKzt: Math.max(0, BAR_FROM - portfolio) }
  return null
}

/** Cashback is paid on card spending only (never on balances), capped per month. */
export function cashbackKzt(spendKzt: number, status: Status, usedThisMonthKzt: number): number {
  const raw = spendKzt * CASHBACK_RATE[status]
  return Math.max(0, Math.min(raw, MONTHLY_CAP_KZT - usedThisMonthKzt))
}

export function cashbackGrams(spendKzt: number, status: Status, market: number, usedThisMonthKzt: number): number {
  return cashbackKzt(spendKzt, status, usedThisMonthKzt) / market
}
