import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { INITIAL, MARKET_PRICE, USDT_KZT } from '../data/seed'
import { MIN_BUY, type Receipt } from '../domain/pricing'
import { cashbackKzt, monthKey, portfolioKzt, regularStreak, statusFor, statusPortfolioKzt } from '../domain/loyalty'
import { round } from '../domain/money'
import { DAY_MS, daysSince, rewardGrams, savingsReward } from '../domain/savings'

export type OpType = 'topup' | 'buy' | 'sell' | 'cashback' | 'gift_out' | 'bonus' | 'purchase' | 'interest' | 'transfer'
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
  /** payments: category id for the icon, cashback earned by this payment */
  category?: string
  cbKzt?: number
  cbGrams?: number
  /** cashback op: the payment it belongs to */
  parentId?: string
}
export type OpError = 'INSUFFICIENT_FUNDS' | 'INSUFFICIENT_GOLD' | 'BELOW_MIN' | 'QUOTE_EXPIRED' | 'DUPLICATE'

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
  | 'external_topup'
  | 'bank_linked'
  | 'risk_test_passed'
export interface Evt {
  name: EventName
  at: number
}
export interface Invite {
  name: string
  status: 'invited' | 'bought'
  at: number
}

export interface ExtCard {
  id: string
  last4: string
}
/** Read-only account in another bank (Open Banking, CONCEPT §5.13). */
export interface BankLink {
  id: string
  bank: string
  balanceKzt: number
  connectedAt: number
}

export interface BankState {
  onboarded: boolean
  tourDone: boolean
  factsSeen: boolean
  market: number
  cardKzt: number
  savingsKzt: number
  /** how the savings reward is paid: ₸ to savings or grams of gold (CONCEPT §5.15) */
  savingsPayout: 'kzt' | 'gold'
  /** last day the savings reward was accrued */
  savingsAccruedAt: number
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
  /** passed the digital-assets risk test (gate for USDT and AIFC partners) */
  riskTestPassed: boolean
  /** shows demo-only controls (fast-forward timer, forced errors) */
  demoMode: boolean
  partnerConnected: boolean
  lessonsDone: string[]
  realizedKzt: number
  giftsOutGrams: number
  bonusGrams: number
  invites: Invite[]
  events: Evt[]
  installedAt: number
  messagesReadAt: number
  /** per-topic read marks for the Kaspi-style message topics */
  topicReadAt: Record<string, number>
  extCards: ExtCard[]
  bankLinks: BankLink[]
  history: Op[]
  lastReceipt?: Receipt
  usedQuoteIds: string[]
}

interface Actions {
  finishOnboarding(): void
  finishTour(): void
  markFactsSeen(): void
  topUp(kzt: number, title?: string): void
  addCard(last4: string): ExtCard
  connectBank(bank: string, balanceKzt: number): void
  revokeBank(id: string): void
  debitBank(id: string, kzt: number): void
  confirm(r: Receipt, now: number): OpError | null
  payCard(spendKzt: number, title?: string, category?: string): { grams: number; kzt: number; error?: OpError }
  setCashbackMode(m: 'kzt' | 'gold'): void
  setSandbox(on: boolean): void
  bumpMarket(pct: number): void
  completeLesson(id: string): void
  connectPartner(): void
  revokePartner(): void
  passRiskTest(): void
  setDemoMode(on: boolean): void
  setRegularMonths(n: number): void
  sendGift(grams: number, to: string): OpError | null
  simulateFriendPurchase(name: string): void
  track(name: EventName, at?: number): void
  simulateReturn(days: number): void
  markMessagesRead(): void
  markTopicRead(topic: string): void
  moveSavings(kzt: number, dir: 'in' | 'out'): OpError | null
  setSavingsPayout(m: 'kzt' | 'gold'): void
  accrueSavings(now?: number): void
  skipSavingsDays(days: number): void
  reset(): void
}

/** Invite: bank-funded gift to the friend and the bonus to both after the friend's first purchase. */
export const GIFT_G = 0.005
export const FRIEND_BONUS_G = 0.005
const ONCE: EventName[] = ['bank_linked', 'install', 'activation', 'first_purchase', 'cashback_gold', 'return_d1', 'return_d7', 'sandbox_try', 'sandbox_to_real', 'spread_understood', 'risk_facts_seen', 'partner_connected']

const fresh = (): BankState => {
  const now = Date.now()
  return {
    onboarded: false,
    tourDone: false,
    factsSeen: false,
    market: MARKET_PRICE,
    cardKzt: INITIAL.cardKzt,
    savingsKzt: INITIAL.savingsKzt,
    savingsPayout: 'kzt',
    savingsAccruedAt: now,
    gold: INITIAL.gold,
    avgPrice: INITIAL.avgPrice,
    usdt: 0,
    sandbox: { on: false, cardKzt: INITIAL.cardKzt, gold: 0, used: false },
    cashbackMode: 'kzt',
    cashbackUsedKzt: 0,
    cashbackMonth: monthKey(now),
    topupMonths: [],
    regularMonths: 0,
    riskTestPassed: false,
    demoMode: false,
    partnerConnected: false,
    lessonsDone: [],
    realizedKzt: 0,
    giftsOutGrams: 0,
    bonusGrams: 0,
    invites: [],
    events: [{ name: 'install', at: now }],
    installedAt: now,
    messagesReadAt: 0,
    topicReadAt: {},
    extCards: [{ id: 'card-4821', last4: '4821' }],
    bankLinks: [],
    history: [],
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

      topUp: (kzt, title = 'Пополнение (тест)') => {
        const now = Date.now()
        if (title !== 'Пополнение (тест)') get().track('external_topup', now)
        set((s) => ({
          cardKzt: s.cardKzt + kzt,
          topupMonths: s.topupMonths.includes(monthKey(now)) ? s.topupMonths : [...s.topupMonths, monthKey(now)],
          history: [{ id: opId(), type: 'topup', title, kzt, grams: 0, at: now }, ...s.history],
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

      payCard: (spendKzt, title = 'Покупка картой', category = 'qr') => {
        const now = Date.now()
        const s0 = get()
        // monthly cap resets when the calendar month changes
        if (s0.cashbackMonth !== monthKey(now)) set({ cashbackMonth: monthKey(now), cashbackUsedKzt: 0 })
        const s = get()
        if (spendKzt > s.cardKzt) return { grams: 0, kzt: 0, error: 'INSUFFICIENT_FUNDS' as const }
        const cb = cashbackKzt(spendKzt, selectStatus(s), s.cashbackUsedKzt)
        const gold = s.cashbackMode === 'gold'
        const g = gold ? round(cb / s.market, 6) : 0
        const payId = opId()
        // the payment row carries its own cashback so each line explains itself (review 2026-11-07)
        const pay: Op = { id: payId, type: 'purchase', title, category, kzt: -spendKzt, grams: 0, at: now, cbKzt: gold ? 0 : cb, cbGrams: g }
        const cbOp: Op | null = cb > 0 ? { id: opId(), parentId: payId, type: 'cashback', asset: gold ? 'gold' : undefined, title: gold ? 'Кешбэк в золоте' : 'Кешбэк в ₸', kzt: gold ? 0 : cb, grams: g, at: now } : null
        const newGold = round(s.gold + g, 6)
        set({
          cardKzt: round(s.cardKzt - spendKzt + (gold ? 0 : cb), 1),
          gold: newGold,
          avgPrice: gold && newGold ? (s.avgPrice * s.gold + s.market * g) / newGold : s.avgPrice,
          cashbackUsedKzt: s.cashbackUsedKzt + cb,
          history: [...(cbOp ? [cbOp] : []), pay, ...s.history],
        })
        return { grams: g, kzt: cb }
      },

      setCashbackMode: (m) => {
        set({ cashbackMode: m })
        if (m === 'gold') get().track('cashback_gold')
      },
      // Проба spends the same money «понарошку»: snapshot real balances, never touch them
      setSandbox: (on) => set((s) => ({ sandbox: on ? { on, used: s.sandbox.used, cardKzt: s.cardKzt, gold: s.gold } : { ...s.sandbox, on } })),
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
      passRiskTest: () => {
        set({ riskTestPassed: true })
        get().track('risk_test_passed')
      },
      setDemoMode: (on) => set({ demoMode: on }),
      setRegularMonths: (n) => set({ regularMonths: n }),

      sendGift: (grams, to) => {
        // gift is paid by the bank (marketing budget), the user's gold is not touched
        const s = get()
        set({
          giftsOutGrams: round(s.giftsOutGrams + grams, 6),
          invites: [{ name: to, status: 'invited', at: Date.now() }, ...s.invites.filter((i) => i.name !== to)],
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

      addCard: (last4) => {
        const card = { id: `card-${last4}-${Date.now().toString(36)}`, last4 }
        set((s) => ({ extCards: [...s.extCards, card] }))
        return card
      },
      connectBank: (bank, balanceKzt) => {
        set((s) => ({ bankLinks: [...s.bankLinks.filter((b) => b.bank !== bank), { id: `bank-${Date.now().toString(36)}`, bank, balanceKzt, connectedAt: Date.now() }] }))
        get().track('bank_linked')
      },
      debitBank: (id, kzt) => set((s) => ({ bankLinks: s.bankLinks.map((b) => (b.id === id ? { ...b, balanceKzt: b.balanceKzt - kzt } : b)) })),
      revokeBank: (id) => set((s) => ({ bankLinks: s.bankLinks.filter((b) => b.id !== id) })),
      markMessagesRead: () => set({ messagesReadAt: Date.now() }),
      markTopicRead: (topic) => set((s) => ({ topicReadAt: { ...s.topicReadAt, [topic]: Date.now() } })),

      // Сбережения: own-account transfers, no fee, no limits in the prototype
      moveSavings: (kzt, dir) => {
        const s = get()
        if (!(kzt > 0)) return 'BELOW_MIN'
        if (dir === 'in' ? kzt > s.cardKzt : kzt > s.savingsKzt) return 'INSUFFICIENT_FUNDS'
        get().accrueSavings()
        const sign = dir === 'in' ? 1 : -1
        set((st) => ({
          cardKzt: round(st.cardKzt - sign * kzt, 2),
          savingsKzt: round(st.savingsKzt + sign * kzt, 2),
          history: [{ id: opId(), type: 'transfer', title: dir === 'in' ? 'На сбережения' : 'Со сбережений на карту', kzt: -sign * kzt, grams: 0, at: Date.now() }, ...st.history],
        }))
        return null
      },
      setSavingsPayout: (m) => {
        get().accrueSavings()
        set({ savingsPayout: m })
      },
      // reward accrues per full day on the ₸ balance; paid in ₸ or as grams at the market price
      accrueSavings: (now = Date.now()) => {
        const s = get()
        const days = daysSince(s.savingsAccruedAt, now)
        if (days < 1) return
        const reward = savingsReward(s.savingsKzt, days)
        const at = s.savingsAccruedAt + days * DAY_MS
        if (reward <= 0) return set({ savingsAccruedAt: at })
        if (s.savingsPayout === 'gold') {
          const g = rewardGrams(reward, s.market)
          const newGold = round(s.gold + g, 6)
          return set({
            savingsAccruedAt: at,
            gold: newGold,
            avgPrice: (s.avgPrice * s.gold + s.market * g) / newGold,
            history: [{ id: opId(), type: 'interest', asset: 'gold', title: 'Вознаграждение по сбережениям', kzt: 0, grams: g, at: now }, ...s.history],
          })
        }
        set({
          savingsAccruedAt: at,
          savingsKzt: round(s.savingsKzt + reward, 2),
          history: [{ id: opId(), type: 'interest', title: 'Вознаграждение по сбережениям', kzt: reward, grams: 0, at: now }, ...s.history],
        })
      },
      // demo: pretend `days` have passed since the last accrual
      skipSavingsDays: (days) => {
        set((s) => ({ savingsAccruedAt: s.savingsAccruedAt - days * DAY_MS }))
        get().accrueSavings()
      },
      reset: () => set(fresh()),
    }),
    {
      name: 'gram-demo',
      // v3: review fixes changed the seed (no starting gold) and removed levels — start clean
      version: 3,
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
/** Status by purchase cost, not market value (review 2026-11-07). */
export const selectStatusPortfolio = (s: BankState) => statusPortfolioKzt(s, USDT_KZT)
export const selectStatus = (s: BankState) => statusFor(selectStatusPortfolio(s), selectRegular(s))
export const hasRealBuy = (s: BankState) => s.history.some((o) => o.type === 'buy' && o.asset !== 'usdt')

/** USDT and AIFC partners need the risk test (not lessons). */
export const selectInvestorAccess = (s: BankState) => s.riskTestPassed

/** Accounts in other banks (read-only): shown in the total, excluded from the loyalty status. */
export const selectOtherBanksKzt = (s: BankState) => s.bankLinks.reduce((a, b) => a + b.balanceKzt, 0)

/** Cashback a card payment would bring right now (shown before confirming, US-15.1). */
export function previewCashback(s: BankState, spendKzt: number): { kzt: number; grams: number } {
  const used = s.cashbackMonth === monthKey(Date.now()) ? s.cashbackUsedKzt : 0
  const kzt = cashbackKzt(spendKzt, selectStatus(s), used)
  return { kzt, grams: kzt / s.market }
}

export interface CashbackStats {
  monthKzt: number
  monthGrams: number
  /** ₸ + grams at the current price */
  monthTotalKzt: number
  totalKzt: number
  totalGrams: number
  totalAllKzt: number
  usedKzt: number
  capKzt: number
}

/** Cashback earned (US-13.4): this month and all time, both modes, plus the monthly cap usage. */
export function selectCashbackStats(s: BankState, now = Date.now()): CashbackStats {
  const month = monthKey(now)
  const cb = s.history.filter((o) => o.type === 'cashback')
  const inMonth = cb.filter((o) => monthKey(o.at) === month)
  const sum = (xs: Op[], f: (o: Op) => number) => xs.reduce((a, o) => a + f(o), 0)
  const monthKzt = sum(inMonth, (o) => o.kzt)
  const monthGrams = sum(inMonth, (o) => o.grams)
  const totalKzt = sum(cb, (o) => o.kzt)
  const totalGrams = sum(cb, (o) => o.grams)
  return {
    monthKzt,
    monthGrams,
    monthTotalKzt: monthKzt + monthGrams * s.market,
    totalKzt,
    totalGrams,
    totalAllKzt: totalKzt + totalGrams * s.market,
    usedKzt: s.cashbackMonth === month ? s.cashbackUsedKzt : 0,
    capKzt: 5000,
  }
}
