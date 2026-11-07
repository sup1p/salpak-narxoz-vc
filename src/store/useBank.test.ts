import { beforeEach, describe, expect, it } from 'vitest'
import { useBank } from './useBank'
import { quoteBuy, quoteSell } from '../domain/pricing'

const M = 54800
const s = () => useBank.getState()

beforeEach(() => s().reset())

describe('bank store', () => {
  it('buys gold and updates balances, avg price and history', () => {
    const r = quoteBuy(10000, M, 0)
    expect(s().confirm(r, 1)).toBeNull()
    expect(s().cardKzt).toBe(40000)
    expect(s().gold).toBeCloseTo(0.0124 + 0.1807, 6)
    expect(s().history[0].type).toBe('buy')
    expect(s().avgPrice).toBeGreaterThan(53900)
  })
  it('rejects duplicate confirmation of the same quote', () => {
    const r = quoteBuy(10000, M, 0)
    s().confirm(r, 1)
    expect(s().confirm(r, 2)).toBe('DUPLICATE')
    expect(s().cardKzt).toBe(40000)
  })
  it('rejects expired quotes', () => {
    const r = quoteBuy(10000, M, 0)
    expect(s().confirm(r, r.expiresAt + 1)).toBe('QUOTE_EXPIRED')
    expect(s().cardKzt).toBe(50000)
  })
  it('rejects insufficient funds, below-min buys and over-selling', () => {
    expect(s().confirm(quoteBuy(60000, M, 0), 1)).toBe('INSUFFICIENT_FUNDS')
    expect(s().confirm(quoteBuy(500, M, 0), 1)).toBe('BELOW_MIN')
    expect(s().confirm(quoteSell(1, M, 0), 1)).toBe('INSUFFICIENT_GOLD')
    expect(s().cardKzt).toBe(50000)
  })
  it('sandbox never touches real balances or history', () => {
    s().setSandbox(true)
    s().confirm(quoteBuy(10000, M, 0), 1)
    expect(s().cardKzt).toBe(50000)
    expect(s().sandbox.cardKzt).toBe(40000)
    expect(s().history.some((o) => o.type === 'buy')).toBe(false)
  })
  it('pays gold cashback on card spend', () => {
    s().setCashbackMode('gold')
    const { grams } = s().payCard(1500)
    expect(grams).toBeCloseTo(0.000274, 6)
    expect(s().cardKzt).toBe(48500)
  })
  it('pays tenge cashback on card spend', () => {
    s().payCard(1500)
    expect(s().cardKzt).toBe(48515)
  })
})
