import { Check, Circle } from 'lucide-react'
import { useBank, type EventName } from '../store/useBank'
import { Button, Card, Header, Screen } from '../ui/ui'

/**
 * Hypothesis metrics (ТЗ п.5, CONCEPT.md §9).
 * 1) This device: which funnel events actually happened — proves the app measures them.
 * 2) Pilot cohort: SYNTHETIC numbers vs. targets — how the team would judge the hypothesis.
 */
const FUNNEL: { name: EventName; title: string; how: string }[] = [
  { name: 'install', title: 'Установка', how: 'первый запуск' },
  { name: 'activation', title: 'Активация', how: 'вход + тестовое пополнение' },
  { name: 'first_purchase', title: 'Первая покупка', how: 'первое реальное золото' },
  { name: 'cashback_gold', title: 'Выбор кешбэка в золоте', how: 'переключил(а) кешбэк на граммы' },
  { name: 'return_d1', title: 'Возврат D1', how: 'зашёл(а) на следующий день' },
  { name: 'return_d7', title: 'Возврат D7', how: 'зашёл(а) через неделю' },
]

const GROWTH: { name: EventName; title: string }[] = [
  { name: 'risk_facts_seen', title: 'Прочитал(а) 3 факта о рисках' },
  { name: 'sandbox_try', title: 'Попробовал(а) режим Пробы' },
  { name: 'sandbox_to_real', title: 'Проба → реальная покупка' },
  { name: 'receipt_opened', title: 'Открыл(а) Рентген до подтверждения' },
  { name: 'spread_understood', title: 'Понял(а) спред (квиз по своему чеку)' },
  { name: 'invite_sent', title: 'Пригласил(а) друга подарком' },
  { name: 'tax_export', title: 'Скачал(а) данные для декларации' },
]

/** Synthetic pilot cohort of 1 000 installs — illustrative, labelled as such in the UI. */
const PILOT = [
  { title: 'Активация', value: 46, target: 40, of: 'от установок' },
  { title: 'Первая покупка за 7 дней', value: 28, target: 25, of: 'от активированных' },
  { title: 'Выбор кешбэка в золоте', value: 54, target: 50, of: 'от держателей карты' },
  { title: 'Возврат D7', value: 38, target: 35, of: 'от установок' },
  { title: 'Возврат D30', value: 22, target: 20, of: 'от установок' },
  { title: 'Проба → реальная покупка', value: 31, target: 30, of: 'от попробовавших' },
  { title: 'Понял спред', value: 74, target: 70, of: 'от прошедших квиз' },
  { title: 'K-factor «Позови подарком»', value: 0.32, target: 0.3, of: 'приглашённых на пользователя' },
]

export function Metrics() {
  const s = useBank()
  const at = (n: EventName) => s.events.find((e) => e.name === n)?.at
  const count = (n: EventName) => s.events.filter((e) => e.name === n).length
  const fmt = (t: number) => new Date(t).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <Screen>
      <Header title="Метрики гипотезы" />
      <div className="px-5 pb-8">
        <p className="text-sm text-ink-2">Приложение записывает события воронки. Так команда проверяет гипотезу на пилоте.</p>

        <div className="mt-5 text-sm font-semibold">Воронка ТЗ · это устройство</div>
        <Card className="mt-2 divide-y divide-line py-1">
          {FUNNEL.map((f) => {
            const t = at(f.name)
            return (
              <div key={f.name} className="flex items-center gap-3 py-3">
                {t ? <Check size={18} className="shrink-0 text-ok" /> : <Circle size={18} className="shrink-0 text-ink-3" />}
                <div className="flex-1">
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs text-ink-2">{f.how}</div>
                </div>
                <div className="num text-right text-xs text-ink-2">{t ? fmt(t) : '—'}</div>
              </div>
            )
          })}
        </Card>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button small variant="secondary" onClick={() => s.simulateReturn(1)}>
            Демо: вернуться завтра
          </Button>
          <Button small variant="secondary" onClick={() => s.simulateReturn(7)}>
            Демо: через неделю
          </Button>
        </div>

        <div className="mt-6 text-sm font-semibold">Метрики «вырос» · это устройство</div>
        <Card className="mt-2 divide-y divide-line py-1">
          {GROWTH.map((g) => {
            const n = count(g.name)
            return (
              <div key={g.name} className="flex items-center gap-3 py-3">
                {n ? <Check size={18} className="shrink-0 text-ok" /> : <Circle size={18} className="shrink-0 text-ink-3" />}
                <div className="flex-1 text-sm">{g.title}</div>
                <div className="num text-xs text-ink-2">{n ? `×${n}` : '—'}</div>
              </div>
            )
          })}
        </Card>

        <div className="mt-6 flex items-baseline justify-between">
          <div className="text-sm font-semibold">Пилот · 1 000 установок</div>
          <span className="rounded-[2px] bg-gold-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[.08em]">синтетика</span>
        </div>
        <Card className="mt-2 space-y-4 py-4">
          {PILOT.map((m) => {
            const pct = m.target < 1 ? (m.value / 0.5) * 100 : m.value
            const tgt = m.target < 1 ? (m.target / 0.5) * 100 : m.target
            const ok = m.value >= m.target
            return (
              <div key={m.title}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{m.title}</span>
                  <span className="num font-semibold">
                    {m.target < 1 ? m.value.toString().replace('.', ',') : `${m.value}%`}{' '}
                    <span className={`text-xs ${ok ? 'text-ok' : 'text-warn'}`}>
                      {ok ? '≥' : '<'} цель {m.target < 1 ? m.target.toString().replace('.', ',') : `${m.target}%`}
                    </span>
                  </span>
                </div>
                <div className="relative mt-1.5 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-gold" style={{ width: `${Math.min(100, pct)}%` }} />
                  <div className="absolute top-[-3px] h-[14px] w-0.5 bg-ink" style={{ left: `${Math.min(100, tgt)}%` }} aria-hidden />
                </div>
                <div className="mt-1 text-[11px] text-ink-3">{m.of}</div>
              </div>
            )
          })}
        </Card>
        <p className="mt-3 text-[11px] text-ink-3">
          Главная метрика (North Star): доля пользователей, которые пополняют 2 месяца подряд. Пилотные цифры — иллюстрация для защиты, не реальные данные.
        </p>
      </div>
    </Screen>
  )
}
