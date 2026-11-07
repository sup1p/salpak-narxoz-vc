import { ArrowDownLeft, ArrowUpRight, Coffee, Coins, Gift, Repeat, Sparkles, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatKzt, formatNum } from '../domain/money'
import { useBank, type Op } from '../store/useBank'
import { List, ListRow, PageTitle, TabPage } from '../ui/ui'

type Filter = 'all' | 'gold' | 'cashback' | 'topup' | 'usdt'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'gold', label: 'Золото' },
  { id: 'cashback', label: 'Кешбэк' },
  { id: 'topup', label: 'Пополнения' },
  { id: 'usdt', label: 'USDT' },
]

const match = (o: Op, f: Filter) =>
  f === 'all' ||
  (f === 'gold' && (o.type === 'buy' || o.type === 'sell' || o.type === 'gift_out' || o.type === 'bonus') && o.asset !== 'usdt') ||
  (f === 'cashback' && o.type === 'cashback') ||
  (f === 'topup' && o.type === 'topup') ||
  (f === 'usdt' && o.asset === 'usdt')

const ICON: Record<Op['type'], { icon: LucideIcon; tone: 'grey' | 'gold' | 'green' }> = {
  topup: { icon: ArrowDownLeft, tone: 'green' },
  buy: { icon: Coins, tone: 'gold' },
  sell: { icon: ArrowUpRight, tone: 'grey' },
  cashback: { icon: Sparkles, tone: 'gold' },
  gift_out: { icon: Gift, tone: 'grey' },
  bonus: { icon: Gift, tone: 'green' },
  purchase: { icon: Coffee, tone: 'grey' },
}

const dayLabel = (t: number) => {
  const d = new Date(t)
  const today = new Date()
  const y = new Date(Date.now() - 86400000)
  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === y.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

const amount = (o: Op) => {
  const parts: string[] = []
  if (o.kzt) parts.push(`${o.kzt > 0 ? '+' : '−'}${formatKzt(Math.abs(o.kzt), 0)}`)
  if (o.grams) parts.push(`${o.grams > 0 ? '+' : '−'}${o.asset === 'usdt' ? `${formatNum(Math.abs(o.grams), 2)} USDT` : `${formatNum(Math.abs(o.grams), 4)} г`}`)
  return parts
}

/** «Операции» tab: month summary, filter chips, list grouped by day (DESIGN-SYSTEM §13). */
export function Operations() {
  const history = useBank((s) => s.history)
  const [f, setF] = useState<Filter>('all')
  const month = new Date().getMonth()
  const inMonth = history.filter((o) => new Date(o.at).getMonth() === month)
  const spent = inMonth.filter((o) => o.type === 'purchase').reduce((a, o) => a - o.kzt, 0)
  const goldBought = inMonth.filter((o) => o.type === 'buy' && o.asset !== 'usdt').reduce((a, o) => a + o.grams, 0)
  const cashback = inMonth.filter((o) => o.type === 'cashback').reduce((a, o) => a + (o.grams || 0), 0)

  const groups = useMemo(() => {
    const m = new Map<string, Op[]>()
    for (const o of history.filter((x) => match(x, f))) {
      const k = dayLabel(o.at)
      m.set(k, [...(m.get(k) ?? []), o])
    }
    return [...m.entries()]
  }, [history, f])

  return (
    <TabPage>
      <PageTitle>Операции</PageTitle>
      <div className="px-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'Покупки картой', v: formatKzt(spent, 0) },
            { k: 'Куплено золота', v: `${formatNum(goldBought, 4)} г` },
            { k: 'Кешбэк золотом', v: `${formatNum(cashback, 4)} г` },
          ].map((x) => (
            <div key={x.k} className="rounded-2xl bg-white p-3">
              <div className="text-xs text-ink-2">{x.k}</div>
              <div className="num mt-1 text-[15px] font-semibold">{x.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-1 text-xs text-ink-3">За этот месяц</div>

        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((x) => (
            <button
              key={x.id}
              onClick={() => setF(x.id)}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${f === x.id ? 'bg-ink text-white' : 'bg-white text-ink'}`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {groups.length === 0 && <div className="mt-8 text-center text-sm text-ink-2">Операций этого типа пока нет</div>}
        {groups.map(([day, ops]) => (
          <div key={day}>
            <div className="px-1 pb-2 pt-5 text-sm font-semibold text-ink-2">{day}</div>
            <List>
              {ops.map((o) => {
                const [a, b] = amount(o)
                const ic = ICON[o.type]
                return (
                  <ListRow
                    key={o.id}
                    icon={o.asset === 'usdt' ? Repeat : ic.icon}
                    tone={ic.tone}
                    title={o.title}
                    sub={new Date(o.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    value={a}
                    valueSub={b}
                  />
                )
              })}
            </List>
          </div>
        ))}
      </div>
    </TabPage>
  )
}
