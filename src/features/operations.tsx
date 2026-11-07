import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formatKzt, formatNum } from '../domain/money'
import { selectCashbackStats, useBank, type Op } from '../store/useBank'
import { Header, List, ListRow, Screen, Sheet } from '../ui/ui'
import { OpDetail, opAmounts, opIcon } from './opView'

type Filter = 'all' | 'payments' | 'gold' | 'cashback' | 'topup' | 'usdt'

/** Gold filter = every movement of gold grams: buys, sells, gold cashback, bonuses (review fix). */
const match = (o: Op, f: Filter) =>
  f === 'all' ||
  (f === 'payments' && o.type === 'purchase') ||
  (f === 'gold' && o.asset !== 'usdt' && o.grams !== 0) ||
  (f === 'cashback' && o.type === 'cashback') ||
  (f === 'topup' && o.type === 'topup') ||
  (f === 'usdt' && o.asset === 'usdt')

const dayLabel = (t: number) => {
  const d = new Date(t)
  if (d.toDateString() === new Date().toDateString()) return 'Сегодня'
  if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

/** «Операции» (inner page): month summary, filters, list by day, every row opens its details. */
export function Operations() {
  const s = useBank()
  const history = s.history
  const [params] = useSearchParams()
  const [f, setF] = useState<Filter>((params.get('f') as Filter) || 'all')
  const [open, setOpen] = useState<Op | null>(null)
  const cbStats = selectCashbackStats(s)
  const month = new Date().getMonth()
  const inMonth = history.filter((o) => new Date(o.at).getMonth() === month)
  const spent = inMonth.filter((o) => o.type === 'purchase').reduce((a, o) => a - o.kzt, 0)
  const goldBought = inMonth.filter((o) => o.type === 'buy' && o.asset !== 'usdt').reduce((a, o) => a + o.grams, 0)
  const hasUsdt = history.some((o) => o.asset === 'usdt')

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'payments', label: 'Платежи' },
    { id: 'gold', label: 'Золото' },
    { id: 'cashback', label: 'Кешбэк' },
    { id: 'topup', label: 'Пополнения' },
    ...(hasUsdt ? [{ id: 'usdt' as const, label: 'USDT' }] : []),
  ]

  const groups = useMemo(() => {
    const m = new Map<string, Op[]>()
    // in «Все» the cashback lives inside its payment row, so it isn't listed twice
    for (const o of history.filter((x) => match(x, f) && !(f === 'all' && x.parentId))) {
      const k = dayLabel(o.at)
      m.set(k, [...(m.get(k) ?? []), o])
    }
    return [...m.entries()]
  }, [history, f])

  return (
    <Screen>
      <Header title="Операции" />
      <div className="px-4 pb-8">
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'Платежи', v: formatKzt(spent, 0) },
            { k: 'Куплено золота', v: `${formatNum(goldBought, 4)} г` },
            { k: 'Кешбэк', v: `+${formatKzt(cbStats.monthTotalKzt, 0)}`, sub: cbStats.monthGrams ? `${formatNum(cbStats.monthGrams, 4)} г золотом` : undefined },
          ].map((x) => (
            <div key={x.k} className="rounded-2xl bg-surface p-3">
              <div className="text-xs text-ink-2">{x.k}</div>
              <div className="num mt-1 text-[15px] font-semibold">{x.v}</div>
              {'sub' in x && x.sub && <div className="num text-[11px] text-ink-3">{x.sub}</div>}
            </div>
          ))}
        </div>
        <div className="mt-1 text-xs text-ink-3">За этот месяц</div>

        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {filters.map((x) => (
            <button key={x.id} onClick={() => setF(x.id)} className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${f === x.id ? 'bg-ink text-white' : 'bg-surface text-ink'}`}>
              {x.label}
            </button>
          ))}
        </div>

        {groups.length === 0 && <div className="mt-8 text-center text-sm text-ink-2">Операций этого типа пока нет</div>}
        {groups.map(([day, ops]) => (
          <div key={day}>
            <div className="px-1 pb-1 pt-5 text-sm font-semibold text-ink-2">{day}</div>
            <List>
              {ops.map((o) => {
                const [a, b] = opAmounts(o)
                const ic = opIcon(o)
                return (
                  <ListRow
                    key={o.id}
                    icon={ic.icon}
                    tone={ic.tone}
                    title={o.type === 'purchase' ? o.title.split(' · ')[0] : o.title}
                    sub={new Date(o.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    value={a}
                    valueSub={b}
                    onClick={() => setOpen(o)}
                  />
                )
              })}
            </List>
          </div>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && <OpDetail op={open} onClose={() => setOpen(null)} />}
      </Sheet>
    </Screen>
  )
}
