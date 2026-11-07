import { describe, expect, it } from 'vitest'
import { formatGrams, formatKzt, parseAmount } from './money'
import { quoteBuy, quoteSell, QUOTE_TTL_MS } from './pricing'
import { cashbackGrams, portfolioKzt, statusFor } from './loyalty'

const M = 54800

describe('money', () => {
  it('parses amounts with spaces and commas', () => {
    expect(parseAmount('10 000')).toBe(10000)
    expect(parseAmount('1,5')).toBe(1.5)
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('')).toBeNull()
  })
  it('formats tenge and grams the Russian way', () => {
    expect(formatKzt(5402.6)).toBe('5 402,6 ₸')
    expect(formatKzt(10000)).toBe('10 000 ₸')
    expect(formatGrams(0.1807)).toBe('0,1807 г')
  })
})

describe('pricing', () => {
  it('quotes a 10 000 ₸ buy (CONCEPT §6)', () => {
    const r = quoteBuy(10000, M, 0)
    expect(r.price).toBe(55074)
    expect(r.fee).toBe(50)
    expect(r.grams).toBe(0.1807)
    expect(r.totalKzt).toBe(10000)
    expect(r.expiresAt).toBe(QUOTE_TTL_MS)
  })
  it('uses 0.3% fee above the 50 ₸ minimum', () => {
    expect(quoteBuy(100000, M, 0).fee).toBe(300)
  })
  it('quotes a 0.1 g sell', () => {
    const r = quoteSell(0.1, M, 0)
    expect(r.price).toBe(54526)
    expect(r.fee).toBe(50)
    expect(r.totalKzt).toBe(5402.6)
  })
})

describe('loyalty', () => {
  it('computes bank portfolio without partners', () => {
    expect(portfolioKzt({ cardKzt: 50000, savingsKzt: 13000, gold: 0.0124 }, M)).toBeCloseTo(63679.52, 2)
  })
  it('assigns statuses by portfolio and regularity', () => {
    expect(statusFor(63679, 0)).toBe('sand')
    expect(statusFor(100000, 0)).toBe('nugget')
    expect(statusFor(500000, 1)).toBe('nugget')
    expect(statusFor(500000, 2)).toBe('bar')
  })
  it('computes cashback grams with a monthly cap', () => {
    expect(cashbackGrams(1500, 'sand', M, 0)).toBeCloseTo(0.000274, 6)
    expect(cashbackGrams(1500, 'sand', M, 5000)).toBe(0)
    expect(cashbackGrams(1500, 'bar', M, 0)).toBeCloseTo(30 / M, 8)
  })
})
