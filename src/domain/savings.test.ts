import { describe, expect, it } from 'vitest'
import { DAY_MS, daysSince, rewardGrams, savingsReward, SAVINGS_RATE } from './savings'

describe('savings reward (CONCEPT §5.15)', () => {
  it('rate is 14% per year (synthetic)', () => expect(SAVINGS_RATE).toBe(0.14))
  it('100 000 ₸ for 30 days → 1 150,68 ₸', () => expect(savingsReward(100_000, 30)).toBe(1150.68))
  it('13 000 ₸ for 1 day → 4,99 ₸', () => expect(savingsReward(13_000, 1)).toBe(4.99))
  it('13 000 ₸ for 30 days → 149,59 ₸ → 0,00273 g at 54 800', () => {
    expect(savingsReward(13_000, 30)).toBe(149.59)
    expect(rewardGrams(149.59, 54_800)).toBe(0.00273)
  })
  it('nothing on empty balance or zero days', () => {
    expect(savingsReward(0, 30)).toBe(0)
    expect(savingsReward(10_000, 0)).toBe(0)
  })
  it('counts only full days', () => {
    expect(daysSince(0, DAY_MS * 2.9)).toBe(2)
    expect(daysSince(DAY_MS, 0)).toBe(0)
  })
})
