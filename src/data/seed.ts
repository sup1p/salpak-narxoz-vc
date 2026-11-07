// All data is synthetic (CONCEPT.md §6). No real money, people or keys.

export const MARKET_PRICE = 54800
export const USDT_KZT = 520

export const BAR = {
  id: 'KZ-AU-0047-2026',
  weight: 1000,
  fineness: '999,9',
  custodian: 'Кастодиан (тест)',
  audit: '01.10.2026',
}

export const PARTNER = { name: 'Партнёр МФЦА (тест)', usdt: 120 }

/** 30 daily synthetic prices ending at MARKET_PRICE (gentle, no candles). */
export const PRICE_HISTORY: number[] = Array.from({ length: 30 }, (_, i) => {
  const t = i / 29
  const wave = Math.sin(i * 0.7) * 260 + Math.sin(i * 0.23) * 380
  return Math.round(53600 + t * 1200 + wave * (1 - t * 0.6))
}).map((p, i, a) => (i === a.length - 1 ? MARKET_PRICE : p))

export const INITIAL = {
  cardKzt: 50000,
  savingsKzt: 13000,
  gold: 0,
  avgPrice: 0,
  sandboxKzt: 50000,
}

export const CONTACTS = [
  { name: 'Данияр', phone: '+7 7•• ••• 12 34' },
  { name: 'Асель', phone: '+7 7•• ••• 56 78' },
  { name: 'Тимур', phone: '+7 7•• ••• 90 11' },
]

export { LESSONS, type Lesson, type LessonPage, type QuizQ, type Widget } from './lessons'

/** Shown once before the first purchase (CONCEPT.md §5.1). */
export const RISK_FACTS = [
  { title: 'Цена может снижаться', text: 'Золото дорожает и дешевеет каждый день. Мы не обещаем никакого результата.' },
  { title: 'Это не депозит', text: 'Это актив: он не застрахован как вклад и попадает в декларацию. Данные для неё мы подготовим.' },
  { title: 'Слиток хранит хранитель', text: '1 токен = 1 г в настоящем слитке с номером. Продать можно в любой момент.' },
]
