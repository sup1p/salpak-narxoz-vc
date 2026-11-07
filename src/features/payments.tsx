import { AlertTriangle, Bus, Check, GraduationCap, Home as HomeIcon, QrCode, Search, Smartphone, Wifi, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatKzt, formatNum, parseAmount } from '../domain/money'
import { previewCashback, selectStatus, useBank } from '../store/useBank'
import { MiningRain } from '../ui/gold'
import { Button, Header, List, ListRow, Screen, SectionTitle, Sheet } from '../ui/ui'

/** Payment categories (CONCEPT §5.14). Neutral provider names — no third-party brands. */
interface Provider {
  id: string
  icon: LucideIcon
  tint: string
  title: string
  provider: string
  field: { label: string; placeholder: string; prefill: string; valid: (v: string) => boolean; hint: string }
  amounts: number[]
}

const digits = (v: string) => v.replace(/\D/g, '')

export const PROVIDERS: Provider[] = [
  {
    id: 'qr',
    icon: QrCode,
    tint: 'bg-gold',
    title: 'Оплата по QR',
    provider: 'Кофейня «Зерно» (тест)',
    field: { label: 'Счёт по QR', placeholder: '', prefill: 'Заказ №2048', valid: () => true, hint: '' },
    amounts: [1500],
  },
  {
    id: 'mobile',
    icon: Smartphone,
    tint: 'bg-lime',
    title: 'Мобильная связь',
    provider: 'Мобильный оператор (тест)',
    field: { label: 'Номер телефона', placeholder: '+7 700 000 00 00', prefill: '+7 701 123 45 67', valid: (v) => digits(v).length === 11, hint: 'Нужно 11 цифр' },
    amounts: [1000, 2000, 3000],
  },
  {
    id: 'internet',
    icon: Wifi,
    tint: 'bg-lilac',
    title: 'Интернет и ТВ',
    provider: 'Интернет-провайдер (тест)',
    field: { label: 'Лицевой счёт', placeholder: '10 цифр', prefill: '', valid: (v) => digits(v).length === 10, hint: 'Лицевой счёт — 10 цифр' },
    amounts: [5990, 8990],
  },
  {
    id: 'utilities',
    icon: HomeIcon,
    tint: 'bg-peach',
    title: 'Коммунальные услуги',
    provider: 'Единая квитанция (тест)',
    field: { label: 'Лицевой счёт', placeholder: '10 цифр', prefill: '', valid: (v) => digits(v).length === 10, hint: 'Лицевой счёт — 10 цифр' },
    amounts: [12400, 18750],
  },
  {
    id: 'transport',
    icon: Bus,
    tint: 'bg-mint',
    title: 'Транспорт',
    provider: 'Транспортная карта (тест)',
    field: { label: 'Номер транспортной карты', placeholder: '16 цифр', prefill: '9643 1000 2048 7731', valid: (v) => digits(v).length === 16, hint: 'Номер карты — 16 цифр' },
    amounts: [1000, 3000, 5000],
  },
  {
    id: 'education',
    icon: GraduationCap,
    tint: 'bg-gold-soft',
    title: 'Образование',
    provider: 'Университет (тест)',
    field: { label: 'ИИН студента', placeholder: '12 цифр', prefill: '', valid: (v) => digits(v).length === 12, hint: 'ИИН — 12 цифр' },
    amounts: [25000, 50000],
  },
]

/** «Платежи» hub: QR, categories, recent payments. */
export function Payments() {
  const nav = useNavigate()
  const history = useBank((s) => s.history)
  const [q, setQ] = useState('')
  const recent = history.filter((o) => o.type === 'purchase').slice(0, 4)
  const list = PROVIDERS.filter((p) => p.id !== 'qr' && (p.title + p.provider).toLowerCase().includes(q.toLowerCase()))

  return (
    <Screen>
      <Header title="Платежи" />
      <div className="px-4 pb-8">
        <button onClick={() => nav('/scan')} className="flex w-full items-center gap-4 rounded-3xl bg-ink p-5 text-left text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold text-ink">
            <QrCode size={26} />
          </span>
          <div className="flex-1">
            <div className="text-[17px] font-bold">Сканировать QR</div>
            <div className="text-[13px] text-white/70">Наведи камеру на кассе — оплати в одно касание, кешбэк сразу</div>
          </div>
        </button>

        <label className="mt-4 flex h-11 items-center gap-2 rounded-xl bg-surface px-3 text-ink-3">
          <Search size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск услуги" className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3" aria-label="Поиск услуги" />
        </label>

        <SectionTitle>Категории</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {list.map((p) => (
            <button key={p.id} onClick={() => nav(`/payments/${p.id}`)} className="flex min-h-[104px] flex-col justify-between rounded-2xl bg-surface p-4 text-left">
              <span className={`grid h-11 w-11 place-items-center rounded-full ${p.tint}`}>
                <p.icon size={22} strokeWidth={1.9} />
              </span>
              <div className="mt-3 text-[15px] font-bold leading-tight">{p.title}</div>
            </button>
          ))}
          {list.length === 0 && <div className="col-span-2 py-6 text-center text-sm text-ink-2">Ничего не нашли</div>}
        </div>

        {recent.length > 0 && (
          <>
            <SectionTitle>Недавние</SectionTitle>
            <List>
              {recent.map((o) => (
                <ListRow key={o.id} icon={QrCode} title={o.title} sub={new Date(o.at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} value={`−${formatKzt(-o.kzt, 0)}`} />
              ))}
            </List>
          </>
        )}
        <p className="mt-4 text-xs text-ink-3">Платежи — это траты картой GRAM: за них начисляется кешбэк по твоему статусу. Поставщики в прототипе условные.</p>
      </div>
    </Screen>
  )
}

/** One payment: requisite, amount, cashback preview, confirm, success. */
export function PayForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const s = useBank()
  const [params] = useSearchParams()
  const base = PROVIDERS.find((x) => x.id === id) ?? PROVIDERS[0]
  const qr = base.id === 'qr'
  // a scanned QR brings merchant, order and amount (US-15.2)
  const p = qr && params.get('m') ? { ...base, provider: params.get('m') as string, amounts: [Number(params.get('a')) || base.amounts[0]], field: { ...base.field, prefill: params.get('o') ?? base.field.prefill } } : base
  const [field, setField] = useState(p.field.prefill)
  const [input, setInput] = useState(qr ? String(p.amounts[0]) : '')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ grams: number; kzt: number } | null>(null)
  const [err, setErr] = useState('')
  const [rain, setRain] = useState(false)

  const amount = parseAmount(input) ?? 0
  const fieldOk = p.field.valid(field)
  const preview = useMemo(() => previewCashback(s, amount), [s, amount])
  const short = amount > s.cardKzt

  const pay = () => {
    setTouched(true)
    if (!fieldOk || !amount || short) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      const r = useBank.getState().payCard(amount, `${p.title} · ${p.provider}`)
      if (r.error) return setErr('Не хватает денег на карте GRAM.')
      setDone({ grams: r.grams, kzt: r.kzt })
      if (s.cashbackMode === 'gold' && r.grams > 0) {
        setRain(true)
        setTimeout(() => setRain(false), 2600)
      }
    }, 600)
  }

  if (done)
    return (
      <Screen className="relative">
        <MiningRain show={rain} status={selectStatus(s)} />
        <Header title={p.title} back={false} />
        <div className="flex flex-1 flex-col items-center px-4 pt-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-mint text-[#00663F]">
            <Check size={30} />
          </span>
          <h1 className="mt-5 text-[28px] font-extrabold tracking-[-0.02em]">−{formatKzt(amount, 0)}</h1>
          <p className="mt-1 text-ink-2">{p.provider}</p>
          <div className="mt-6 w-full rounded-2xl bg-gold-soft p-4 text-left">
            <div className="text-sm font-semibold text-[#7A4A00]">Кешбэк</div>
            <div className="num mt-1 text-[22px] font-extrabold">{done.grams > 0 ? `+${formatNum(done.grams, 4)} г золота` : done.kzt > 0 ? `+${formatKzt(done.kzt, 0)}` : 'Лимит кешбэка на месяц исчерпан'}</div>
          </div>
          <div className="mt-auto w-full space-y-2 pb-6">
            <Button onClick={() => nav('/home')}>На главную</Button>
            <Button variant="secondary" onClick={() => nav('/payments')}>
              Ещё платёж
            </Button>
          </div>
        </div>
      </Screen>
    )

  return (
    <Screen>
      <Header title={p.title} />
      <div className="flex flex-1 flex-col px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${p.tint}`}>
            <p.icon size={22} strokeWidth={1.9} />
          </span>
          <div>
            <div className="text-[15px] font-semibold">{p.provider}</div>
            <div className="text-xs text-ink-2">{qr ? `${p.field.prefill} · счёт по QR-коду` : 'Без комиссии'}</div>
          </div>
        </div>

        {!qr && (
          <>
            <label className="mt-5 text-sm text-ink-2" htmlFor="pay-field">
              {p.field.label}
            </label>
            <input
              id="pay-field"
              inputMode="numeric"
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder={p.field.placeholder}
              className={`num mt-1 h-12 rounded-xl bg-surface px-4 text-[17px] font-medium outline-none ${touched && !fieldOk ? 'ring-2 ring-err' : ''}`}
            />
            {touched && !fieldOk && <div className="mt-1 text-sm text-err">Проверьте: {p.field.hint.toLowerCase()}</div>}
          </>
        )}

        <label className="mt-5 text-sm text-ink-2" htmlFor="pay-amount">
          Сумма
        </label>
        <div className="mt-1 flex items-baseline gap-2 border-b-2 border-ink pb-2">
          <input
            id="pay-amount"
            inputMode="decimal"
            value={input}
            readOnly={qr}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0"
            className="num w-full bg-transparent text-[36px] font-extrabold tracking-[-0.03em] outline-none placeholder:text-ink-3"
          />
          <span className="text-[26px] font-bold text-ink-3">₸</span>
        </div>
        {short && <div className="mt-2 text-sm font-medium text-err">Не хватает {formatKzt(amount - s.cardKzt, 0)} — пополните карту</div>}
        {!qr && (
          <div className="mt-3 flex gap-2">
            {p.amounts.map((v) => (
              <button key={v} onClick={() => setInput(String(v))} className="num h-9 flex-1 rounded-full bg-surface text-sm font-medium">
                {formatKzt(v, 0)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 rounded-2xl bg-surface px-4 py-1">
          <div className="flex justify-between py-2.5 text-sm">
            <span className="text-ink-2">Списать с</span>
            <span className="num font-semibold">Карта GRAM · {formatKzt(s.cardKzt, 0)}</span>
          </div>
          <div className="flex justify-between border-t border-line py-2.5 text-sm">
            <span className="text-ink-2">Комиссия</span>
            <span className="font-semibold">0 ₸</span>
          </div>
          <div className="flex justify-between border-t border-line py-2.5 text-sm">
            <span className="text-ink-2">Кешбэк</span>
            <span className="num font-semibold text-[#7A4A00]">
              {amount ? (s.cashbackMode === 'gold' ? `+${formatNum(preview.grams, 4)} г золота` : `+${formatKzt(preview.kzt, 0)}`) : '—'}
            </span>
          </div>
        </div>
        {s.cashbackMode !== 'gold' && (
          <button onClick={() => nav('/cashback')} className="mt-2 self-start text-xs font-medium text-ink-2 underline underline-offset-2">
            Получать кешбэк золотом
          </button>
        )}

        <div className="mt-auto pb-6 pt-4">
          <Button variant={qr ? 'gold' : 'primary'} disabled={!amount} loading={busy} onClick={pay}>
            {amount ? `Оплатить ${formatKzt(amount, 0)}` : 'Введите сумму'}
          </Button>
        </div>
      </div>

      <Sheet open={!!err} onClose={() => setErr('')}>
        <div className="text-center">
          <AlertTriangle className="mx-auto text-err" />
          <div className="mt-2 text-lg font-bold">Платёж не прошёл</div>
          <p className="mt-1 text-sm text-ink-2">{err}</p>
          <Button className="mt-4" onClick={() => nav('/topup')}>
            Пополнить карту
          </Button>
        </div>
      </Sheet>
    </Screen>
  )
}

/** Route wrapper: a new provider or a new scanned QR always starts a fresh form. */
export function PayRoute() {
  const { id } = useParams()
  const [params] = useSearchParams()
  return <PayForm key={`${id}?${params.toString()}`} />
}
