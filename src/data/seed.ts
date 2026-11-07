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
  gold: 0.0124,
  avgPrice: 53900,
  sandboxKzt: 50000,
}

export const CONTACTS = [
  { name: 'Данияр', phone: '+7 7•• ••• 12 34' },
  { name: 'Асель', phone: '+7 7•• ••• 56 78' },
  { name: 'Тимур', phone: '+7 7•• ••• 90 11' },
]

export interface Lesson {
  id: string
  title: string
  minutes: number
  ready: boolean
  cards: string[]
}

export const LESSONS: Lesson[] = [
  {
    id: 'token',
    title: 'Что такое золотой токен',
    minutes: 2,
    ready: false,
    cards: [],
  },
  {
    id: 'spread',
    title: 'Спред и комиссия',
    minutes: 2,
    ready: true,
    cards: [
      'Рыночная цена — сколько золото стоит прямо сейчас на рынке. Её видно в каждом чеке первой строкой.',
      'Спред — разница между рыночной ценой и ценой, по которой банк продаёт тебе золото. У нас 0,5%: при рынке 54 800 ₸/г ты покупаешь по 55 074 ₸/г. При продаже — наоборот, на 0,5% ниже рынка.',
      'Комиссия — плата за операцию: 0,3% от суммы, но не меньше 50 ₸. Спред + комиссия = всё, что ты платишь сверх рынка. Больше ничего скрытого.',
    ],
  },
  {
    id: 'custody',
    title: 'Кто хранит твоё золото',
    minutes: 2,
    ready: true,
    cards: [
      'Твой токен — это доля в настоящем слитке. 1 токен = 1 грамм золота пробы 999,9.',
      'Слиток лежит не у банка, а у хранителя (кастодиана) — независимой организации, которая отвечает за его сохранность. У каждого слитка есть номер.',
      'Раз в квартал проводится аудит: проверяют, что слитки на месте и их вес совпадает с суммой всех токенов. Дату последнего аудита видно на экране «Золото».',
    ],
  },
  { id: 'risk', title: 'Золото — не депозит: риски', minutes: 2, ready: false, cards: [] },
  { id: 'tax', title: 'Налоги и декларация 250/270', minutes: 3, ready: false, cards: [] },
  { id: 'aifc', title: 'МФЦА и партнёры', minutes: 2, ready: false, cards: [] },
  { id: 'safety', title: 'Безопасность: seed-фразы и мошенники', minutes: 2, ready: false, cards: [] },
]

export const RISK_QUIZ = [
  {
    q: 'Может ли золото подешеветь?',
    options: ['Да, цена может снижаться', 'Нет, золото только растёт'],
    correct: 0,
    why: 'Цена золота меняется каждый день и может снижаться. Поэтому мы не обещаем никакого результата.',
  },
  {
    q: 'Это депозит с гарантией?',
    options: ['Да, как вклад в банке', 'Нет, это актив, а не депозит'],
    correct: 1,
    why: 'Золотой токен — это актив. Он не застрахован как вклад, и его стоимость может меняться.',
  },
  {
    q: 'Кто хранит твоё золото?',
    options: ['Хранитель (кастодиан) в слитке', 'Оно лежит у меня в телефоне'],
    correct: 0,
    why: 'Физический слиток хранит независимый хранитель, а токен в приложении — твоя доля в нём.',
  },
]
