import { round } from './money'

export const QUOTE_TTL_MS = 30_000
export const MIN_BUY = 1000
export const SPREAD = 0.005
export const FEE_RATE = 0.003
export const MIN_FEE = 50

export type Side = 'buy' | 'sell'

export interface Receipt {
  side: Side
  market: number
  /** price per gram incl. spread */
  price: number
  fee: number
  grams: number
  /** buy: amount the user pays; sell: gross before fee */
  amountKzt: number
  /** buy: = amountKzt; sell: net credited to card */
  totalKzt: number
  quoteId: string
  expiresAt: number
}

let seq = 0
const newId = () => `q${Date.now().toString(36)}${(seq++).toString(36)}`

const feeFor = (kzt: number) => round(Math.max(MIN_FEE, kzt * FEE_RATE), 1)

export function quoteBuy(amountKzt: number, market: number, now: number): Receipt {
  const price = round(market * (1 + SPREAD), 2)
  const fee = feeFor(amountKzt)
  const grams = round(Math.max(0, amountKzt - fee) / price, 4)
  return { side: 'buy', market, price, fee, grams, amountKzt, totalKzt: amountKzt, quoteId: newId(), expiresAt: now + QUOTE_TTL_MS }
}

export function quoteSell(grams: number, market: number, now: number): Receipt {
  const price = round(market * (1 - SPREAD), 2)
  const gross = round(grams * price, 1)
  const fee = feeFor(gross)
  return { side: 'sell', market, price, fee, grams, amountKzt: gross, totalKzt: round(gross - fee, 1), quoteId: newId(), expiresAt: now + QUOTE_TTL_MS }
}

/** How much above the market the user paid on a buy (for the academy quiz). */
export const overpayKzt = (r: Receipt) => round(r.amountKzt - r.grams * r.market, 0)
