import { Check, ChevronDown, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { MARKET_PRICE } from '../data/seed'
import type { Widget } from '../data/lessons'
import { cashbackGrams, cashbackKzt, CASHBACK_RATE, STATUS_LABEL, type Status } from '../domain/loyalty'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { quoteBuy, quoteSell } from '../domain/pricing'
import { budgetSplit, savingsProjection } from '../domain/savings'
import { ReceiptView } from './trade'

/** Interactive blocks inside Academy lessons. All money math comes from src/domain. */

function Chips<T extends string | number>({ items, value, onChange, label }: { items: T[]; value: T; onChange: (v: T) => void; label: (v: T) => string }) {
  return (
    <div className="flex gap-2">
      {items.map((v) => (
        <button key={String(v)} onClick={() => onChange(v)} className={`num h-9 flex-1 rounded-full text-sm font-semibold ${v === value ? 'bg-ink text-white' : 'bg-white text-ink'}`}>
          {label(v)}
        </button>
      ))}
    </div>
  )
}

function Box({ children }: { children: ReactNode }) {
  return <div className="mt-4 rounded-2xl bg-surface p-4">{children}</div>
}

const kzt0 = (v: number) => formatKzt(v, 0)

function TokenSlice() {
  const [amount, setAmount] = useState(5000)
  const r = quoteBuy(amount, MARKET_PRICE, 0)
  return (
    <Box>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-2">Сумма</span>
        <span className="num text-[17px] font-bold">{kzt0(amount)}</span>
      </div>
      <input type="range" min={1000} max={60000} step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} aria-label="Сумма покупки" className="mt-2 w-full accent-[#F2AE3A]" />
      <div className="num mt-3 text-[30px] font-extrabold leading-none tracking-[-0.02em]">{formatGrams(r.grams, 4)}</div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, r.grams * 100)}%` }} />
      </div>
      <div className="num mt-1.5 text-xs text-ink-2">{r.grams >= 1 ? 'Целый грамм и больше' : `${formatNum(r.grams * 100, 1)}% от одного грамма`} · по {formatNum(r.price, 0)} ₸/г</div>
    </Box>
  )
}

function SpreadCalc() {
  const [amount, setAmount] = useState(10000)
  const r = quoteBuy(amount, MARKET_PRICE, 0)
  return (
    <Box>
      <Chips items={[1000, 10000, 100000]} value={amount} onChange={setAmount} label={kzt0} />
      <div className="mt-2 rounded-xl bg-white px-3">
        <ReceiptView r={r} onTerm={() => {}} />
      </div>
    </Box>
  )
}

function Reveal({ items }: { items: { title: string; text: string; tag?: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="mt-4 space-y-2">
      {items.map((it, i) => (
        <button key={it.title} onClick={() => setOpen(open === i ? null : i)} className="w-full rounded-2xl bg-surface p-4 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              {it.tag && <span className="num grid h-6 min-w-6 place-items-center rounded-full bg-gold-soft px-1.5 text-xs font-bold text-[#7A4A00]">{it.tag}</span>}
              {it.title}
            </span>
            <ChevronDown size={18} className={`shrink-0 text-ink-3 transition ${open === i ? 'rotate-180' : ''}`} />
          </div>
          {open === i && <p className="mt-2 text-sm leading-snug text-ink-2">{it.text}</p>}
        </button>
      ))}
    </div>
  )
}

function PriceSwing() {
  const [d, setD] = useState(0)
  const buy = quoteBuy(10000, MARKET_PRICE, 0)
  const sell = quoteSell(buy.grams, Math.round(MARKET_PRICE * (1 + d)), 0)
  const diff = sell.totalKzt - buy.amountKzt
  return (
    <Box>
      <div className="text-sm text-ink-2">Купил(а) на 10 000 ₸ → {formatGrams(buy.grams, 4)}. Цена рынка при продаже:</div>
      <div className="mt-3">
        <Chips items={[-0.05, 0, 0.05]} value={d} onChange={setD} label={(v) => (v === 0 ? 'Та же' : `${v > 0 ? '+' : '−'}${Math.abs(v * 100)}%`)} />
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-sm text-ink-2">Вернётся на карту</span>
        <span className="num text-[22px] font-extrabold">{formatKzt(sell.totalKzt)}</span>
      </div>
      <div className={`num mt-1 text-right text-sm font-semibold ${diff < 0 ? 'text-err' : 'text-ok'}`}>
        {diff < 0 ? '−' : '+'}
        {formatKzt(Math.abs(diff))} к вложенным 10 000 ₸
      </div>
    </Box>
  )
}

function Sorter({ items, options }: { items: { text: string; answer: number; why: string }[]; options: string[] }) {
  const [picks, setPicks] = useState<(number | null)[]>(items.map(() => null))
  return (
    <div className="mt-4 space-y-2">
      {items.map((it, i) => {
        const p = picks[i]
        return (
          <div key={it.text} className="rounded-2xl bg-surface p-4">
            <p className="text-[15px] leading-snug">{it.text}</p>
            <div className="mt-3 flex gap-2">
              {options.map((o, k) => (
                <button
                  key={o}
                  disabled={p !== null}
                  onClick={() => setPicks(picks.map((x, j) => (j === i ? k : x)))}
                  className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-full text-sm font-semibold ${p === null ? 'bg-white' : k === it.answer ? 'bg-mint text-[#00663F]' : k === p ? 'bg-[#FDEDE3] text-err' : 'bg-white opacity-50'}`}
                >
                  {p !== null && k === it.answer && <Check size={14} />}
                  {p === k && k !== it.answer && <X size={14} />}
                  {o}
                </button>
              ))}
            </div>
            {p !== null && <p className="mt-2 text-sm text-ink-2">{it.why}</p>}
          </div>
        )
      })}
    </div>
  )
}

function SavingsGrow() {
  const [monthly, setMonthly] = useState(10000)
  const [months, setMonths] = useState(12)
  const p = savingsProjection(monthly, months)
  return (
    <Box>
      <div className="text-xs text-ink-2">Откладываю в месяц</div>
      <div className="mt-1.5">
        <Chips items={[5000, 10000, 20000]} value={monthly} onChange={setMonthly} label={kzt0} />
      </div>
      <div className="mt-3 text-xs text-ink-2">Срок</div>
      <div className="mt-1.5">
        <Chips items={[6, 12, 24]} value={months} onChange={setMonths} label={(v) => `${v} мес`} />
      </div>
      <div className="num mt-4 text-[30px] font-extrabold leading-none tracking-[-0.02em]">≈ {kzt0(p.total)}</div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white">
        <div className="h-full bg-ink" style={{ width: `${(p.contributed / p.total) * 100}%` }} />
        <div className="h-full bg-green" style={{ width: `${(p.reward / p.total) * 100}%` }} />
      </div>
      <div className="num mt-2 flex justify-between text-xs">
        <span>Отложено {kzt0(p.contributed)}</span>
        <span className="font-semibold text-ok">Вознаграждение ≈ +{kzt0(p.reward)}</span>
      </div>
      <p className="mt-2 text-[11px] text-ink-3">14% годовых, тестовая ставка; ставка может меняться.</p>
    </Box>
  )
}

function CashbackCalc() {
  const [spend, setSpend] = useState(60000)
  const [status, setStatus] = useState<Status>('sand')
  const kzt = cashbackKzt(spend, status, 0)
  const g = cashbackGrams(spend, status, MARKET_PRICE, 0)
  return (
    <Box>
      <div className="text-xs text-ink-2">Трачу картой в месяц</div>
      <div className="mt-1.5">
        <Chips items={[30000, 60000, 150000]} value={spend} onChange={setSpend} label={kzt0} />
      </div>
      <div className="mt-3 text-xs text-ink-2">Статус</div>
      <div className="mt-1.5">
        <Chips items={['sand', 'nugget', 'bar'] as Status[]} value={status} onChange={setStatus} label={(v) => `${STATUS_LABEL[v]} ${formatNum(CASHBACK_RATE[v] * 100, 1)}%`} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-3">
          <div className="text-xs text-ink-2">В тенге</div>
          <div className="num text-[20px] font-extrabold">+{kzt0(kzt)}</div>
        </div>
        <div className="rounded-xl bg-gold-soft p-3">
          <div className="text-xs text-[#7A4A00]">Или в граммах</div>
          <div className="num text-[20px] font-extrabold">+{formatNum(g, 4)} г</div>
        </div>
      </div>
      {kzt >= 5000 && <p className="mt-2 text-xs text-ink-2">Упёрлись в лимит 5 000 ₸ в месяц.</p>}
    </Box>
  )
}

function BudgetSplit() {
  const [money, setMoney] = useState(150000)
  const b = budgetSplit(money)
  const rows = [
    { label: 'Нужное · 50%', v: b.needs, c: 'bg-ink' },
    { label: 'Желания · 30%', v: b.wants, c: 'bg-lilac' },
    { label: 'Отложить · 20%', v: b.save, c: 'bg-gold' },
  ]
  return (
    <Box>
      <Chips items={[80000, 150000, 250000]} value={money} onChange={setMoney} label={kzt0} />
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-sm">
              <span>{r.label}</span>
              <span className="num font-semibold">{kzt0(r.v)}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white">
              <div className={`h-full rounded-full ${r.c}`} style={{ width: `${(r.v / money) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-2">Отложенные {kzt0(b.save)} — сначала в подушку в сбережениях, сверх неё — в золото.</p>
    </Box>
  )
}

export function LessonWidget({ w }: { w: Widget }) {
  switch (w) {
    case 'token-slice':
      return <TokenSlice />
    case 'spread-calc':
      return <SpreadCalc />
    case 'custody-chain':
      return (
        <Reveal
          items={[
            { tag: '1', title: 'Ты', text: 'Покупаешь граммы в приложении и владеешь долей в слитке. Продать можно в любой момент.' },
            { tag: '2', title: 'GRAM (банк)', text: 'Принимает деньги, покупает золото на рынке, ведёт учёт твоих граммов и показывает Рентген цены.' },
            { tag: '3', title: 'Хранитель', text: 'Независимая организация: хранит слитки с номерами в хранилище и отвечает за их сохранность.' },
            { tag: '4', title: 'Аудитор', text: 'Раз в квартал сверяет вес слитков с количеством выпущенных токенов и публикует дату проверки.' },
          ]}
        />
      )
    case 'price-swing':
      return <PriceSwing />
    case 'tax-timeline':
      return (
        <Reveal
          items={[
            { tag: '1', title: 'Март: купил(а) 0,5 г', text: 'Покупка сама по себе налог не создаёт. Мы запоминаем цену покупки — она понадобится потом.' },
            { tag: '2', title: '31 декабря: что у тебя есть', text: 'Граммы на конец года — это актив. Он попадает в форму 250. Цифры мы соберём автоматически.' },
            { tag: '3', title: 'Если продал(а) дороже', text: 'Разница между ценой продажи и ценой покупки попадает в форму 270. Мы её посчитаем.' },
            { tag: '4', title: 'До 15 сентября: подать', text: 'Скачиваешь выгрузку в разделе «Налоги» и переносишь цифры в кабинет налогоплательщика. Напомним заранее.' },
          ]}
        />
      )
    case 'aifc-who':
      return (
        <Sorter
          options={['GRAM', 'Партнёр']}
          items={[
            { text: 'Кто хранит твоё золото, купленное в GRAM?', answer: 0, why: 'Золото в GRAM — у хранителя банка, слиток с номером и аудитом.' },
            { text: 'Кто хранит USDT в подключённом кошельке МФЦА?', answer: 1, why: 'Активы в кошельке партнёра хранит партнёр с лицензией МФЦА. GRAM только показывает баланс.' },
            { text: 'Кто может перевести деньги из кошелька партнёра?', answer: 1, why: 'Только ты в приложении партнёра. GRAM ничего не переводит — доступ только на просмотр.' },
          ]}
        />
      )
    case 'scam-spot':
      return (
        <Sorter
          options={['Мошенник', 'Всё в порядке']}
          items={[
            { text: '«Служба безопасности банка: попытка списания с вашей карты! Срочно назовите код из SMS для отмены».', answer: 0, why: 'Срочность и просьба кода — главный признак. Банк коды не спрашивает.' },
            { text: '«GRAM: кешбэк +15 ₸ за покупку в кофейне. Детали — в приложении».', answer: 1, why: 'Обычное уведомление: ничего не просит и не торопит.' },
            { text: '«Партнёр МФЦА: для проверки кошелька пришлите seed-фразу в ответ».', answer: 0, why: 'Seed-фразу не спрашивает никто и никогда.' },
          ]}
        />
      )
    case 'savings-grow':
      return <SavingsGrow />
    case 'cashback-calc':
      return <CashbackCalc />
    case 'budget-split':
      return <BudgetSplit />
  }
}

