import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { INITIAL, LESSONS, MARKET_PRICE, USDT_KZT } from '../data/seed'
import { MIN_BUY, type Receipt } from '../domain/pricing'
import { cashbackKzt, monthKey, portfolioKzt, regularStreak, statusFor } from '../domain/loyalty'
import { round } from '../domain/money'

export type OpType = 'topup' | 'buy' | 'sell' | 'cashback' | 'gift_out' | 'bonus' | 'purchase'
export interface Op {
  id: string
  type: OpType
  title: string
  kzt: number
  /** grams of gold, or USDT units when `asset` is 'usdt' */
  grams: number
  asset?: 'gold' | 'usdt'
  at: number
  receipt?: Receipt
}
export type OpError = 'INSUFFICIENT_FUNDS' | 'INSUFFICIENT_GOLD' | 'BELOW_MIN' | 'QUOTE_EXPIRED' | 'DUPLICATE'
export type Level = 'start' | 'saver' | 'investor'

/** Product events for the hypothesis metrics (CONCEPT.md §9). */
export type EventName =
  | 'install'
  | 'activation'
  | 'first_purchase'
  | 'cashback_gold'
  | 'return_d1'
  | 'return_d7'
  | 'sandbox_try'
  | 'sandbox_to_real'
  | 'receipt_opened'
  | 'spread_understood'
  | 'lesson_done'
  | 'risk_facts_seen'
  | 'invite_sent'
  | 'friend_first_purchase'
  | 'tax_export'
  | 'partner_connected'
  | 'otc_usdt'
export interface Evt {
  name: EventName
  at: number
}
export interface Invite {
  name: string
  status: 'invited' | 'bought'
  at: number
}

export interface BankState {
  onboarded: boolean
  tourDone: boolean
  factsSeen: boolean
  market: number
  cardKzt: number
  savingsKzt: number
  gold: number
  avgPrice: number
  usdt: number
  sandbox: { on: boolean; cardKzt: number; gold: number; used: boolean }
  cashbackMode: 'kzt' | 'gold'
  cashbackUsedKzt: number
  cashbackMonth: string
  topupMonths: string[]
  /** demo override for the regularity streak */
  regularMonths: number
  /** demo override for the level */
  level: Level
  partnerConnected: boolean
  lessonsDone: string[]
  realizedKzt: number
  giftsOutGrams: number
  bonusGrams: number
  invites: Invite[]
  events: Evt[]
  installedAt: number
  messagesReadAt: number
  history: Op[]
  lastReceipt?: Receipt
  usedQuoteIds: string[]
}

interface Actions {
  finishOnboarding(): void
  finishTour(): void
  markFactsSeen(): void
  topUp(kzt: number): void
  confirm(r: Receipt, now: number): OpError | null
  payCard(spendKzt: number, title?: string): { grams: number; kzt: number }
  setCashbackMode(m: 'kzt' | 'gold'): void
  setSandbox(on: boolean): void
  bumpMarket(pct: number): void
  completeLesson(id: string): void
  connectPartner(): void
  revokePartner(): void
  setLevel(l: Level): void
  setRegularMonths(n: number): void
  sendGift(grams: number, to: string): OpError | null
  simulateFriendPurchase(name: string): void
  track(name: EventName, at?: number): void
  simulateReturn(days: number): void
  markMessagesRead(): void
  reset(): void
}

export const FRIEND_BONUS_G = 0.05
const ONCE: EventName[] = ['install', 'activation', 'first_purchase', 'cashback_gold', 'return_d1', 'return_d7', 'sandbox_try', 'sandbox_to_real', 'spread_understood', 'risk_facts_seen', 'partner_connected']

const fresh = (): BankState => {
  const now = Date.now()
  return {
    onboarded: false,
    tourDone: false,
    factsSeen: false,
    market: MARKET_PRICE,
    cardKzt: INITIAL.cardKzt,
    savingsKzt: INITIAL.savingsKzt,
    gold: INITIAL.gold,
    avgPrice: INITIAL.avgPrice,
    usdt: 0,
    sandbox: { on: false, cardKzt: INITIAL.sandboxKzt, gold: 0, used: false },
    cashbackMode: 'kzt',
    cashbackUsedKzt: 0,
    cashbackMonth: monthKey(now),
    topupMonths: [],
    regularMonths: 0,
    level: 'start',
    partnerConnected: false,
    lessonsDone: [],
    realizedKzt: 0,
    giftsOutGrams: 0,
    bonusGrams: 0,
    invites: [],
    events: [{ name: 'install', at: now }],
    installedAt: now,
    messagesReadAt: 0,
    history: [{ id: 'seed-cb', type: 'cashback', title: 'Кешбэк за прошлые покупки', kzt: 0, grams: INITIAL.gold, at: now - 86400000 * 3 }],
    usedQuoteIds: [],
  }
}

const opId = () => `op${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const useBank = create<BankState & Actions>()(
  persist(
    (set, get) => ({
      ...fresh(),

      track: (name, at = Date.now()) => {
        const s = get()
        if (ONCE.includes(name) && s.events.some((e) => e.name === name)) return
        set({ events: [...s.events, { name, at }] })
      },

      finishOnboarding: () => {
        const now = Date.now()
        set((s) => ({ onboarded: true, topupMonths: s.topupMonths.includes(monthKey(now)) ? s.topupMonths : [...s.topupMonths, monthKey(now)] }))
        get().track('activation', now)
      },
      finishTour: () => set({ tourDone: true }),
      markFactsSeen: () => {
        set({ factsSeen: true })
        get().track('risk_facts_seen')
      },

      topUp: (kzt) => {
        const now = Date.now()
        set((s) => ({
          cardKzt: s.cardKzt + kzt,
          topupMonths: s.topupMonths.includes(monthKey(now)) ? s.topupMonths : [...s.topupMonths, monthKey(now)],
          history: [{ id: opId(), type: 'topup', title: 'Пополнение (тест)', kzt, grams: 0, at: now }, ...s.history],
        }))
      },

      confirm: (r, now) => {
        const s = get()
        if (s.usedQuoteIds.includes(r.quoteId)) return 'DUPLICATE'
        if (now > r.expiresAt) return 'QUOTE_EXPIRED'
        const sb = s.sandbox.on && r.asset === 'gold'
        const card = sb ? s.sandbox.cardKzt : s.cardKzt
        const held = r.asset === 'usdt' ? s.usdt : sb ? s.sandbox.gold : s.gold
        const used = [...s.usedQuoteIds, r.quoteId]

        if (r.side === 'buy') {
          if (r.amountKzt < MIN_BUY) return 'BELOW_MIN'
          if (r.amountKzt > card) return 'INSUFFICIENT_FUNDS'
          if (sb) {
            set({ sandbox: { on: true, used: true, cardKzt: card - r.amountKzt, gold: round(held + r.grams, 6) }, lastReceipt: r, usedQuoteIds: used })
            get().track('sandbox_try', now)
            return null
          }
          if (r.asset === 'usdt') {
            set({
              cardKzt: card - r.amountKzt,
              usdt: round(held + r.grams, 2),
              lastReceipt: r,
              usedQuoteIds: used,
              history: [{ id: opId(), type: 'buy', asset: 'usdt', title: 'Покупка USDT', kzt: -r.amountKzt, grams: r.grams, at: now, receipt: r }, ...s.history],
            })
            get().track('otc_usdt', now)
            return null
          }
          const newGold = round(held + r.grams, 6)
          const avgPrice = (s.avgPrice * held + r.price * r.grams) / newGold
          const firstReal = !s.history.some((o) => o.type === 'buy' && o.asset !== 'usdt')
          set({
            cardKzt: card - r.amountKzt,
            gold: newGold,
            avgPrice,
            lastReceipt: r,
            usedQuoteIds: used,
            history: [{ id: opId(), type: 'buy', asset: 'gold', title: 'Покупка золота', kzt: -r.amountKzt, grams: r.grams, at: now, receipt: r }, ...s.history],
          })
          if (firstReal) get().track('first_purchase', now)
          if (s.sandbox.used) get().track('sandbox_to_real', now)
          return null
        }

        if (r.grams > held + 1e-9) return 'INSUFFICIENT_GOLD'
        if (sb) {
          set({ sandbox: { ...s.sandbox, cardKzt: card + r.totalKzt, gold: round(held - r.grams, 6) }, lastReceipt: r, usedQuoteIds: used })
          return null
        }
        if (r.asset === 'usdt') {
          set({
            cardKzt: round(card + r.totalKzt, 1),
            usdt: round(held - r.grams, 2),
            lastReceipt: r,
            usedQuoteIds: used,
            history: [{ id: opId(), type: 'sell', asset: 'usdt', title: 'Продажа USDT', kzt: r.totalKzt, grams: -r.grams, at: now, receipt: r }, ...s.history],
          })
          get().track('otc_usdt', now)
          return null
        }
        set({
          cardKzt: round(card + r.totalKzt, 1),
          gold: round(held - r.grams, 6),
          realizedKzt: round(s.realizedKzt + (r.totalKzt - r.grams * s.avgPrice), 1),
          lastReceipt: r,
          usedQuoteIds: used,
          history: [{ id: opId(), type: 'sell', asset: 'gold', title: 'Продажа золота', kzt: r.totalKzt, grams: -r.grams, at: now, receipt: r }, ...s.history],
        })
        return null
      },

      payCard: (spendKzt, title = 'Кофе') => {
        const now = Date.now()
        const s0 = get()
        // monthly cap resets when the calendar month changes
        if (s0.cashbackMonth !== monthKey(now)) set({ cashbackMonth: monthKey(now), cashbackUsedKzt: 0 })
        const s = get()
        const status = selectStatus(s)
        const cb = cashbackKzt(spendKzt, status, s.cashbackUsedKzt)
        const ops: Op[] = [{ id: opId(), type: 'purchase', title, kzt: -spendKzt, grams: 0, at: now }]
        if (s.cashbackMode === 'gold') {
          const g = round(cb / s.market, 6)
          const newGold = round(s.gold + g, 6)
          set({
            cardKzt: s.cardKzt - spendKzt,
            gold: newGold,
            avgPrice: newGold ? (s.avgPrice * s.gold + s.market * g) / newGold : s.avgPrice,
            cashbackUsedKzt: s.cashbackUsedKzt + cb,
            history: [{ id: opId(), type: 'cashback', asset: 'gold', title: 'Кешбэк в золоте', kzt: 0, grams: g, at: now }, ...ops, ...s.history],
          })
          return { grams: g, kzt: cb }
        }
        set({
          cardKzt: round(s.cardKzt - spendKzt + cb, 1),
          cashbackUsedKzt: s.cashbackUsedKzt + cb,
          history: [{ id: opId(), type: 'cashback', title: 'Кешбэк в ₸', kzt: cb, grams: 0, at: now }, ...ops, ...s.history],
        })
        return { grams: 0, kzt: cb }
      },

      setCashbackMode: (m) => {
        set({ cashbackMode: m })
        if (m === 'gold') get().track('cashback_gold')
      },
      setSandbox: (on) => set((s) => ({ sandbox: { ...s.sandbox, on } })),
      bumpMarket: (pct) => set((s) => ({ market: round(s.market * (1 + pct), 0) })),
      completeLesson: (id) => {
        const s = get()
        if (s.lessonsDone.includes(id)) return
        set({ lessonsDone: [...s.lessonsDone, id] })
        get().track('lesson_done')
        if (id === 'spread') get().track('spread_understood')
      },
      connectPartner: () => {
        set({ partnerConnected: true })
        get().track('partner_connected')
      },
      revokePartner: () => set({ partnerConnected: false }),
      setLevel: (l) => set({ level: l }),
      setRegularMonths: (n) => set({ regularMonths: n }),

      sendGift: (grams, to) => {
        const s = get()
        if (grams > s.gold) return 'INSUFFICIENT_GOLD'
        set({
          gold: round(s.gold - grams, 6),
          giftsOutGrams: round(s.giftsOutGrams + grams, 6),
          invites: [{ name: to, status: 'invited', at: Date.now() }, ...s.invites.filter((i) => i.name !== to)],
          history: [{ id: opId(), type: 'gift_out', asset: 'gold', title: `Подарок: ${to}`, kzt: 0, grams: -grams, at: Date.now() }, ...s.history],
        })
        get().track('invite_sent')
        return null
      },

      simulateFriendPurchase: (name) => {
        const s = get()
        const inv = s.invites.find((i) => i.name === name)
        if (!inv || inv.status === 'bought') return
        const newGold = round(s.gold + FRIEND_BONUS_G, 6)
        set({
          gold: newGold,
          avgPrice: (s.avgPrice * s.gold + s.market * FRIEND_BONUS_G) / newGold,
          bonusGrams: round(s.bonusGrams + FRIEND_BONUS_G, 6),
          invites: s.invites.map((i) => (i.name === name ? { ...i, status: 'bought' } : i)),
          history: [{ id: opId(), type: 'bonus', asset: 'gold', title: `Бонус: ${name} сделал(а) первую покупку`, kzt: 0, grams: FRIEND_BONUS_G, at: Date.now() }, ...s.history],
        })
        get().track('friend_first_purchase')
      },

      simulateReturn: (days) => {
        const s = get()
        get().track(days >= 7 ? 'return_d7' : 'return_d1', s.installedAt + days * 86400000)
      },

      markMessagesRead: () => set({ messagesReadAt: Date.now() }),
      reset: () => set(fresh()),
    }),
    {
      name: 'gram-demo',
      version: 2,
      migrate: () => fresh() as never,
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

export const selectRegular = (s: BankState) => Math.max(s.regularMonths, regularStreak(s.topupMonths, Date.now()))
export const selectPortfolio = (s: BankState) => portfolioKzt(s, s.market, USDT_KZT)
export const selectStatus = (s: BankState) => statusFor(selectPortfolio(s), selectRegular(s))
export const hasRealBuy = (s: BankState) => s.history.some((o) => o.type === 'buy' && o.asset !== 'usdt')

const RANK: Record<Level, number> = { start: 0, saver: 1, investor: 2 }
/** Level unlocks automatically; the demo override can only raise it. */
export function selectLevel(s: BankState): Level {
  let computed: Level = 'start'
  if (hasRealBuy(s) && s.lessonsDone.length >= 2) computed = 'saver'
  if (computed === 'saver' && s.lessonsDone.length >= LESSONS.length) computed = 'investor'
  return RANK[s.level] > RANK[computed] ? s.level : computed
}
