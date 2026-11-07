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
    expect(s().gold).toBeCloseTo(0.181, 6)
    expect(s().history[0].type).toBe('buy')
    expect(s().avgPrice).toBe(55074)
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
  it('pays gold cashback on card spend and links it to the payment', () => {
    s().setCashbackMode('gold')
    const { grams } = s().payCard(1500, 'Кофе', 'qr')
    expect(grams).toBeCloseTo(0.000274, 6)
    expect(s().cardKzt).toBe(48500)
    const [cb, pay] = s().history
    expect(cb.parentId).toBe(pay.id)
    expect(pay.cbGrams).toBeCloseTo(0.000274, 6)
  })
  it('sandbox mirrors the real card instead of a separate 50 000', () => {
    s().topUp(5000)
    s().setSandbox(true)
    expect(s().sandbox.cardKzt).toBe(55000)
  })
  it('pays tenge cashback on card spend', () => {
    s().payCard(1500)
    expect(s().cardKzt).toBe(48515)
  })
})

describe('system completion', () => {
  it('tracks funnel events once', () => {
    s().finishOnboarding()
    s().finishOnboarding()
    expect(s().events.filter((e) => e.name === 'activation')).toHaveLength(1)
    s().confirm(quoteBuy(10000, M, 0), 1)
    expect(s().events.some((e) => e.name === 'first_purchase')).toBe(true)
    s().setCashbackMode('gold')
    expect(s().events.some((e) => e.name === 'cashback_gold')).toBe(true)
  })
  it('records sandbox -> real conversion', () => {
    s().setSandbox(true)
    s().confirm(quoteBuy(10000, M, 0), 1)
    s().setSandbox(false)
    s().confirm(quoteBuy(5000, M, 0), 1)
    expect(s().events.some((e) => e.name === 'sandbox_to_real')).toBe(true)
  })
  it('pays the referral bonus only after the friend buys, once', () => {
    s().sendGift(0.005, 'Данияр')
    expect(s().gold).toBe(0) // the gift is paid by the bank
    s().simulateFriendPurchase('Данияр')
    s().simulateFriendPurchase('Данияр')
    expect(s().gold).toBeCloseTo(0.005, 6)
    expect(s().invites[0].status).toBe('bought')
  })
  it('opens USDT and partners only after the risk test, not after lessons', async () => {
    const { selectInvestorAccess } = await import('./useBank')
    for (const id of ['token', 'spread', 'custody', 'risk', 'tax', 'aifc', 'safety']) s().completeLesson(id)
    expect(selectInvestorAccess(s())).toBe(false)
    s().passRiskTest()
    expect(selectInvestorAccess(s())).toBe(true)
  })
  it('buys and sells USDT on the card', () => {
    expect(s().confirm(quoteBuy(10000, 520, 0, 'usdt'), 1)).toBeNull()
    expect(s().usdt).toBe(19.08)
    expect(s().cardKzt).toBe(40000)
    expect(s().confirm(quoteSell(10, 520, 0, 'usdt'), 1)).toBeNull()
    expect(s().usdt).toBe(9.08)
  })
  it('counts top-ups toward the regularity streak', async () => {
    const { selectRegular } = await import('./useBank')
    s().topUp(1000)
    expect(selectRegular(s())).toBe(1)
  })
})

describe('other banks', () => {
  it('tops up from an external card with a titled operation', () => {
    s().topUp(20000, 'Пополнение с карты •• 4821')
    expect(s().cardKzt).toBe(70000)
    expect(s().history[0].title).toBe('Пополнение с карты •• 4821')
    expect(s().events.some((e) => e.name === 'external_topup')).toBe(true)
  })
  it('stores only the last 4 digits of a new card', () => {
    const c = s().addCard('9910')
    expect(c.last4).toBe('9910')
    expect(JSON.stringify(s().extCards)).not.toMatch(/\d{5,}/)
  })
  it('links and revokes a read-only bank account without touching the status', async () => {
    const { selectOtherBanksKzt, selectStatus } = await import('./useBank')
    const before = selectStatus(s())
    s().connectBank('Банк А (тест)', 184300)
    expect(selectOtherBanksKzt(s())).toBe(184300)
    expect(selectStatus(s())).toBe(before)
    s().revokeBank(s().bankLinks[0].id)
    expect(s().bankLinks).toHaveLength(0)
  })
})

describe('payments', () => {
  it('refuses a payment above the card balance', () => {
    const r = s().payCard(60000, 'Интернет')
    expect(r.error).toBe('INSUFFICIENT_FUNDS')
    expect(s().cardKzt).toBe(50000)
  })
  it('previews the same cashback the payment then pays', async () => {
    const { previewCashback } = await import('./useBank')
    s().setCashbackMode('gold')
    const p = previewCashback(s(), 3000)
    const r = s().payCard(3000, 'Мобильная связь')
    expect(r.grams).toBeCloseTo(p.grams, 6)
    expect(p.kzt).toBe(30)
  })
})

describe('cashback stats', () => {
  it('sums tenge and gold cashback for the month and tracks the cap', async () => {
    const { selectCashbackStats } = await import('./useBank')
    s().payCard(1500, 'Кофе') // 15 ₸ in tenge mode
    s().setCashbackMode('gold')
    s().payCard(3000, 'Связь') // 30 ₸ as grams
    const st = selectCashbackStats(s())
    expect(st.monthKzt).toBe(15)
    expect(st.monthGrams).toBeCloseTo(30 / 54800, 6)
    expect(st.usedKzt).toBe(45)
    expect(st.monthTotalKzt).toBeCloseTo(45, 0)
  })
})
