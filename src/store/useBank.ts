import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { INITIAL, MARKET_PRICE } from '../data/seed'
import { MIN_BUY, type Receipt } from '../domain/pricing'
import { cashbackKzt, portfolioKzt, statusFor } from '../domain/loyalty'
import { round } from '../domain/money'

export type OpType = 'topup' | 'buy' | 'sell' | 'cashback' | 'gift_out' | 'purchase'
export interface Op {
  id: string
  type: OpType
  title: string
  kzt: number
  grams: number
  at: number
  receipt?: Receipt
}
export type OpError = 'INSUFFICIENT_FUNDS' | 'INSUFFICIENT_GOLD' | 'BELOW_MIN' | 'QUOTE_EXPIRED' | 'DUPLICATE'
export type Level = 'start' | 'saver' | 'investor'

export interface BankState {
  onboarded: boolean
  market: number
  cardKzt: number
  savingsKzt: number
  gold: number
  avgPrice: number
  sandbox: { on: boolean; cardKzt: number; gold: number }
  cashbackMode: 'kzt' | 'gold'
  cashbackUsedKzt: number
  regularMonths: number
  level: Level
  partnerConnected: boolean
  lessonsDone: string[]
  realizedKzt: number
  giftsOutGrams: number
  history: Op[]
  lastReceipt?: Receipt
  usedQuoteIds: string[]
}

interface Actions {
  finishOnboarding(): void
  topUp(kzt: number): void
  confirm(r: Receipt, now: number): OpError | null
  payCard(spendKzt: number, title?: string): { grams: number; kzt: number }
  setCashbackMode(m: 'kzt' | 'gold'): void
  setSandbox(on: boolean): void
  bumpMarket(pct: number): void
  completeLesson(id: string): void
  connectPartner(): void
  setLevel(l: Level): void
  setRegularMonths(n: number): void
  sendGift(grams: number): OpError | null
  reset(): void
}

const fresh = (): BankState => ({
  onboarded: false,
  market: MARKET_PRICE,
  cardKzt: INITIAL.cardKzt,
  savingsKzt: INITIAL.savingsKzt,
  gold: INITIAL.gold,
  avgPrice: INITIAL.avgPrice,
  sandbox: { on: false, cardKzt: INITIAL.sandboxKzt, gold: 0 },
  cashbackMode: 'kzt',
  cashbackUsedKzt: 0,
  regularMonths: 0,
  level: 'start',
  partnerConnected: false,
  lessonsDone: [],
  realizedKzt: 0,
  giftsOutGrams: 0,
  history: [
    { id: 'seed-cb', type: 'cashback', title: 'Кешбэк за прошлые покупки', kzt: 0, grams: INITIAL.gold, at: Date.now() - 86400000 * 3 },
  ],
  usedQuoteIds: [],
})

const opId = () => `op${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const useBank = create<BankState & Actions>()(
  persist(
    (set, get) => ({
      ...fresh(),

      finishOnboarding: () => set({ onboarded: true }),

      topUp: (kzt) =>
        set((s) => ({
          cardKzt: s.cardKzt + kzt,
          history: [{ id: opId(), type: 'topup', title: 'Пополнение (тест)', kzt, grams: 0, at: Date.now() }, ...s.history],
        })),

      confirm: (r, now) => {
        const s = get()
        if (s.usedQuoteIds.includes(r.quoteId)) return 'DUPLICATE'
        if (now > r.expiresAt) return 'QUOTE_EXPIRED'
        const sb = s.sandbox.on
        const card = sb ? s.sandbox.cardKzt : s.cardKzt
        const gold = sb ? s.sandbox.gold : s.gold

        if (r.side === 'buy') {
          if (r.amountKzt < MIN_BUY) return 'BELOW_MIN'
          if (r.amountKzt > card) return 'INSUFFICIENT_FUNDS'
          if (sb) {
            set({ sandbox: { on: true, cardKzt: card - r.amountKzt, gold: round(gold + r.grams, 6) }, lastReceipt: r, usedQuoteIds: [...s.usedQuoteIds, r.quoteId] })
            return null
          }
          const newGold = round(gold + r.grams, 6)
          const avgPrice = (s.avgPrice * gold + r.price * r.grams) / newGold
          set({
            cardKzt: card - r.amountKzt,
            gold: newGold,
            avgPrice,
            lastReceipt: r,
            usedQuoteIds: [...s.usedQuoteIds, r.quoteId],
            history: [{ id: opId(), type: 'buy', title: 'Покупка золота', kzt: -r.amountKzt, grams: r.grams, at: now, receipt: r }, ...s.history],
          })
          return null
        }

        if (r.grams > gold + 1e-9) return 'INSUFFICIENT_GOLD'
        if (sb) {
          set({ sandbox: { on: true, cardKzt: card + r.totalKzt, gold: round(gold - r.grams, 6) }, lastReceipt: r, usedQuoteIds: [...s.usedQuoteIds, r.quoteId] })
          return null
        }
        set({
          cardKzt: round(card + r.totalKzt, 1),
          gold: round(gold - r.grams, 6),
          realizedKzt: round(s.realizedKzt + (r.totalKzt - r.grams * s.avgPrice), 1),
          lastReceipt: r,
          usedQuoteIds: [...s.usedQuoteIds, r.quoteId],
          history: [{ id: opId(), type: 'sell', title: 'Продажа золота', kzt: r.totalKzt, grams: -r.grams, at: now, receipt: r }, ...s.history],
        })
        return null
      },

      payCard: (spendKzt, title = 'Кофе') => {
        const s = get()
        const status = statusFor(portfolioKzt(s, s.market), s.regularMonths)
        const cb = cashbackKzt(spendKzt, status, s.cashbackUsedKzt)
        const ops: Op[] = [{ id: opId(), type: 'purchase', title, kzt: -spendKzt, grams: 0, at: Date.now() }]
        if (s.cashbackMode === 'gold') {
          const g = round(cb / s.market, 6)
          const newGold = round(s.gold + g, 6)
          set({
            cardKzt: s.cardKzt - spendKzt,
            gold: newGold,
            avgPrice: (s.avgPrice * s.gold + s.market * g) / newGold,
            cashbackUsedKzt: s.cashbackUsedKzt + cb,
            history: [{ id: opId(), type: 'cashback', title: 'Кешбэк в золоте', kzt: 0, grams: g, at: Date.now() }, ...ops, ...s.history],
          })
          return { grams: g, kzt: cb }
        }
        set({
          cardKzt: round(s.cardKzt - spendKzt + cb, 1),
          cashbackUsedKzt: s.cashbackUsedKzt + cb,
          history: [{ id: opId(), type: 'cashback', title: 'Кешбэк в ₸', kzt: cb, grams: 0, at: Date.now() }, ...ops, ...s.history],
        })
        return { grams: 0, kzt: cb }
      },

      setCashbackMode: (m) => set({ cashbackMode: m }),
      setSandbox: (on) => set((s) => ({ sandbox: { ...s.sandbox, on } })),
      bumpMarket: (pct) => set((s) => ({ market: round(s.market * (1 + pct), 0) })),
      completeLesson: (id) => set((s) => ({ lessonsDone: s.lessonsDone.includes(id) ? s.lessonsDone : [...s.lessonsDone, id] })),
      connectPartner: () => set({ partnerConnected: true }),
      setLevel: (l) => set({ level: l }),
      setRegularMonths: (n) => set({ regularMonths: n }),

      sendGift: (grams) => {
        const s = get()
        if (grams > s.gold) return 'INSUFFICIENT_GOLD'
        set({
          gold: round(s.gold - grams, 6),
          giftsOutGrams: round(s.giftsOutGrams + grams, 6),
          history: [{ id: opId(), type: 'gift_out', title: 'Подарок другу', kzt: 0, grams: -grams, at: Date.now() }, ...s.history],
        })
        return null
      },

      reset: () => set(fresh()),
    }),
    {
      name: 'altyn-demo',
      storage: createJSONStorage(() => {
        try {
          localStorage.setItem('__t', '1')
          localStorage.removeItem('__t')
          return localStorage
        } catch {
          const mem = new Map<string, string>()
          return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) }
        }
      }),
    },
  ),
)

export const selectPortfolio = (s: BankState) => portfolioKzt(s, s.market)
export const selectStatus = (s: BankState) => statusFor(portfolioKzt(s, s.market), s.regularMonths)
