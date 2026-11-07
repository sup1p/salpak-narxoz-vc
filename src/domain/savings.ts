import { round } from './money'

/**
 * Сбережения — накопительный счёт в ₸ (CONCEPT §5.15). Synthetic rate for the prototype.
 * Reward accrues every day on the ₸ balance; it is paid either in ₸ (added to savings)
 * or in grams of gold bought at the market price. Gold itself never earns anything —
 * the reward is on tenge, gold is only the way it is paid.
 */
export const SAVINGS_RATE = 0.14
export const DAY_MS = 86_400_000

/** ₸ reward for `days` full days on `balanceKzt` at `rate` per year (actual/365, simple). */
export function savingsReward(balanceKzt: number, days: number, rate = SAVINGS_RATE): number {
  if (balanceKzt <= 0 || days <= 0) return 0
  return round((balanceKzt * rate * days) / 365, 2)
}

/** The same reward paid in grams at the market price, 6 decimals like cashback. */
export function rewardGrams(rewardKzt: number, market: number): number {
  return market > 0 ? round(rewardKzt / market, 6) : 0
}

/** Full days elapsed since the last accrual. */
export function daysSince(fromMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - fromMs) / DAY_MS))
}

/**
 * Academy «Сбережения»: what regular top-ups grow into. Monthly steps: top up at the start
 * of the month, the reward for the month is added to the balance (≈ daily accrual).
 */
export function savingsProjection(monthlyKzt: number, months: number, rate = SAVINGS_RATE): { total: number; contributed: number; reward: number } {
  let balance = 0
  for (let m = 0; m < months; m++) balance = (balance + monthlyKzt) * (1 + rate / 12)
  const total = round(balance, 0)
  const contributed = monthlyKzt * months
  return { total, contributed, reward: total - contributed }
}

/** Academy «Бюджет»: the 50/30/20 split of the money a student gets in a month. */
export function budgetSplit(monthlyKzt: number): { needs: number; wants: number; save: number } {
  const needs = round(monthlyKzt * 0.5, 0)
  const wants = round(monthlyKzt * 0.3, 0)
  return { needs, wants, save: round(monthlyKzt - needs - wants, 0) }
}
