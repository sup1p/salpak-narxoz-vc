export type Status = 'sand' | 'nugget' | 'bar'

export const STATUS_LABEL: Record<Status, string> = { sand: 'Песчинка', nugget: 'Самородок', bar: 'Слиток' }
export const CASHBACK_RATE: Record<Status, number> = { sand: 0.01, nugget: 0.015, bar: 0.02 }
export const NUGGET_FROM = 100_000
export const BAR_FROM = 500_000
export const BAR_REGULAR_MONTHS = 2
export const MONTHLY_CAP_KZT = 5000

/** Bank-held portfolio only: card + savings + gold. Partner assets are excluded. */
export function portfolioKzt(s: { cardKzt: number; savingsKzt: number; gold: number }, market: number): number {
  return s.cardKzt + s.savingsKzt + s.gold * market
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
