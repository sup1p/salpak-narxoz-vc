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
