import { AlertTriangle, Building2, Check, CreditCard, Landmark, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatKzt, parseAmount } from '../domain/money'
import { useBank } from '../store/useBank'
import { Badge, Button, Header, List, ListRow, Screen, SectionTitle, Sheet } from '../ui/ui'

/** Synthetic banks for the Open Banking demo — neutral names, no third-party logos. */
export const OTHER_BANKS = [
  { name: 'Банк А (тест)', balanceKzt: 184300 },
  { name: 'Банк Б (тест)', balanceKzt: 62750 },
  { name: 'Банк В (тест)', balanceKzt: 9400 },
]
export const TOPUP_LIMIT = 500_000

type Source = { kind: 'card'; id: string; last4: string } | { kind: 'bank'; id: string; bank: string; balanceKzt: number }

/** US-14.1: top up GRAM from a card or a linked account in another bank. */
export function TopUp() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const s = useBank()
  const sources: Source[] = [
    ...s.extCards.map((c) => ({ kind: 'card' as const, id: c.id, last4: c.last4 })),
    ...s.bankLinks.map((b) => ({ kind: 'bank' as const, id: b.id, bank: b.bank, balanceKzt: b.balanceKzt })),
  ]
  const [input, setInput] = useState('')
  const [srcId, setSrcId] = useState(params.get('src') ?? sources[0]?.id ?? '')
  const [adding, setAdding] = useState(false)
  const [pan, setPan] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [failNext, setFailNext] = useState(false)

  const amount = parseAmount(input) ?? 0
  const src = sources.find((x) => x.id === srcId)
  const error = !amount
    ? null
    : amount > TOPUP_LIMIT
      ? `Превышен лимит — не больше ${formatKzt(TOPUP_LIMIT, 0)} за операцию`
      : src?.kind === 'bank' && amount > src.balanceKzt
        ? `На счёте в ${src.bank} только ${formatKzt(src.balanceKzt, 0)}`
        : null
  const panDigits = pan.replace(/\D/g, '').slice(0, 16)
  const panShown = panDigits.replace(/(.{4})/g, '$1 ').trim()

  const saveCard = () => {
    const c = s.addCard(panDigits.slice(-4))
    setSrcId(c.id)
    setAdding(false)
    setPan('')
  }
  const submit = () => {
    if (!src || error || !amount) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (failNext) {
        setFailNext(false)
        return setDeclined(true)
      }
      if (src.kind === 'bank') s.debitBank(src.id, amount)
      s.topUp(amount, src.kind === 'card' ? `Пополнение с карты •• ${src.last4}` : `Пополнение со счёта: ${src.bank}`)
      setDone(true)
    }, 700)
  }

  if (done)
    return (
      <Screen>
        <Header title="Пополнение" back={false} />
        <div className="flex flex-1 flex-col items-center px-4 pt-10 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-mint text-[#00663F]">
            <Check size={30} />
          </span>
          <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.02em]">+{formatKzt(amount, 0)}</h1>
          <p className="mt-1 text-ink-2">Деньги уже на карте GRAM. Комиссия 0 ₸.</p>
          <div className="mt-auto w-full pb-6">
            <Button onClick={() => nav('/buy')} variant="gold">
              Купить на них золото
            </Button>
            <Button className="mt-2" variant="secondary" onClick={() => nav('/home')}>
              На главную
            </Button>
          </div>
        </div>
      </Screen>
    )

  return (
    <Screen>
      <Header title="Пополнение" />
      <div className="flex flex-1 flex-col px-4">
        <label className="text-sm text-ink-2" htmlFor="topup-amount">
          Сумма
        </label>
        <div className="mt-1 flex items-baseline gap-2 border-b-2 border-ink pb-2">
          <input
            id="topup-amount"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0"
            className="num w-full bg-transparent text-[40px] font-extrabold tracking-[-0.03em] outline-none placeholder:text-ink-3"
          />
          <span className="text-[28px] font-bold text-ink-3">₸</span>
        </div>
        {error && <div className="mt-2 text-sm font-medium text-err">{error}</div>}
        <div className="mt-3 flex gap-2">
          {[10000, 50000, 100000].map((v) => (
            <button key={v} onClick={() => setInput(String(v))} className="num h-9 flex-1 rounded-full bg-surface text-sm font-medium">
              {formatKzt(v, 0)}
            </button>
          ))}
        </div>

        <SectionTitle>Откуда</SectionTitle>
        <div className="rounded-2xl bg-surface px-4">
          <List>
            {sources.map((x) => (
              <ListRow
                key={x.id}
                icon={x.kind === 'card' ? CreditCard : Landmark}
                title={x.kind === 'card' ? `Карта другого банка •• ${x.last4}` : x.bank}
                sub={x.kind === 'card' ? 'Перевод с карты' : `Счёт · ${formatKzt(x.balanceKzt, 0)}`}
                chevron={false}
                onClick={() => setSrcId(x.id)}
                right={
                  <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${srcId === x.id ? 'border-ink bg-ink text-white' : 'border-line'}`} aria-hidden>
                    {srcId === x.id && <Check size={14} />}
                  </span>
                }
              />
            ))}
            <ListRow icon={Plus} title="Привязать новую карту" sub="Сохраним только последние 4 цифры" onClick={() => setAdding(true)} />
            {s.bankLinks.length === 0 && <ListRow icon={Building2} title="Подключить счёт в другом банке" sub="Только просмотр, с вашего согласия" onClick={() => nav('/banks')} />}
          </List>
        </div>

        <div className="mt-4 rounded-2xl bg-surface px-4 py-1">
          <div className="flex justify-between py-2.5 text-sm">
            <span className="text-ink-2">Комиссия</span>
            <span className="font-semibold">0 ₸</span>
          </div>
          <div className="flex justify-between border-t border-line py-2.5 text-sm">
            <span className="text-ink-2">Зачисление</span>
            <span className="font-semibold">Сразу</span>
          </div>
        </div>
        {s.demoMode && (
          <button onClick={() => setFailNext(!failNext)} className="mt-2 self-start text-xs text-ink-3">
            демо: {failNext ? 'следующая операция будет отклонена ✓' : 'банк отклонит операцию'}
          </button>
        )}

        <div className="mt-auto pb-6 pt-4">
          <Button disabled={!amount || !!error || !src} loading={busy} onClick={submit}>
            {amount ? `Пополнить на ${formatKzt(amount, 0)}` : 'Введите сумму'}
          </Button>
        </div>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)}>
        <div className="text-[19px] font-bold">Новая карта</div>
        <p className="mt-1 text-sm text-ink-2">Тестовый режим: подойдёт любой номер из 16 цифр. Полный номер не сохраняем.</p>
        <input
          inputMode="numeric"
          value={panShown}
          onChange={(e) => setPan(e.target.value)}
          placeholder="0000 0000 0000 0000"
          className="num mt-4 h-14 w-full rounded-xl bg-surface px-4 text-[20px] font-semibold tracking-wider outline-none"
          aria-label="Номер карты"
        />
        <Button className="mt-4" disabled={panDigits.length !== 16} onClick={saveCard}>
          Привязать карту
        </Button>
      </Sheet>

      <Sheet open={declined} onClose={() => setDeclined(false)}>
        <div className="text-center">
          <AlertTriangle className="mx-auto text-err" />
          <div className="mt-2 text-lg font-bold">Банк отклонил операцию</div>
          <p className="mt-1 text-sm text-ink-2">Банк-отправитель не подтвердил перевод. Деньги не списаны. Попробуйте другую карту или позже.</p>
          <Button className="mt-4" onClick={() => setDeclined(false)}>
            Понятно
          </Button>
        </div>
      </Sheet>
    </Screen>
  )
}

/** US-14.2: read-only accounts in other banks (Open Banking). */
export function OtherBanks() {
  const nav = useNavigate()
  const s = useBank()
  const [picked, setPicked] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const available = OTHER_BANKS.filter((b) => !s.bankLinks.some((l) => l.bank === b.name))
  const bank = OTHER_BANKS.find((b) => b.name === picked)

  const connect = (fail: boolean) => {
    if (!bank) return
    setState('loading')
    setTimeout(() => {
      if (fail) return setState('error')
      s.connectBank(bank.name, bank.balanceKzt)
      setPicked(null)
      setState('idle')
    }, 900)
  }

  return (
    <Screen>
      <Header title="Счета других банков" />
      <div className="px-4 pb-8">
        <p className="text-sm text-ink-2">Подключи счёт в другом банке — увидишь его баланс в общей сумме GRAM. Только просмотр: мы не переводим без тебя и не спрашиваем пароли.</p>

        {s.bankLinks.length > 0 && (
          <>
            <SectionTitle>Подключены</SectionTitle>
            <div className="space-y-2">
              {s.bankLinks.map((l) => (
                <div key={l.id} className="rounded-2xl bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[15px] font-semibold">{l.bank}</div>
                    <Badge tone="grey">В другом банке</Badge>
                  </div>
                  <div className="num mt-1 text-[22px] font-extrabold tracking-[-0.02em]">{formatKzt(l.balanceKzt, 0)}</div>
                  <div className="text-xs text-ink-2">Обновлено {new Date(l.connectedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · не влияет на статус «Золотого дождя»</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button small onClick={() => nav(`/topup?src=${l.id}`)}>
                      Пополнить GRAM
                    </Button>
                    <Button small variant="ghost" className="!bg-white text-err" onClick={() => s.revokeBank(l.id)}>
                      Отозвать доступ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {available.length > 0 && (
          <>
            <SectionTitle>Подключить счёт</SectionTitle>
            <div className="rounded-2xl bg-surface px-4">
              <List>
                {available.map((b) => (
                  <ListRow key={b.name} icon={Landmark} title={b.name} sub="Тестовый банк для демо" onClick={() => setPicked(b.name)} />
                ))}
              </List>
            </div>
          </>
        )}
        <p className="mt-3 text-xs text-ink-3">Открытые API банков Казахстана — гипотеза для проверки. Названия банков в прототипе условные.</p>
      </div>

      <Sheet open={!!bank} onClose={() => { setPicked(null); setState('idle') }}>
        {bank && (
          <div>
            <div className="text-[19px] font-bold">Доступ к счёту · {bank.name}</div>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="font-semibold text-ok">Увидим:</span> <span className="text-ink-2">баланс и валюту счёта</span>
              </div>
              <div>
                <span className="font-semibold text-err">Не сможем:</span> <span className="text-ink-2">переводить без тебя, видеть пароли и коды</span>
              </div>
              <div>
                <span className="font-semibold">Отозвать:</span> <span className="text-ink-2">в любой момент на этом экране</span>
              </div>
            </div>
            {state === 'error' && (
              <div className="mt-3 flex gap-2 rounded-xl bg-[#FDEDE3] p-3 text-sm text-warn">
                <AlertTriangle size={18} className="shrink-0" /> Банк не отвечает. Ничего не подключено — попробуй позже.
              </div>
            )}
            <Button className="mt-4" loading={state === 'loading'} onClick={() => connect(false)}>
              Разрешить просмотр
            </Button>
            {s.demoMode && (
              <button onClick={() => connect(true)} className="mt-2 h-9 w-full text-xs text-ink-3">
                демо: банк не отвечает
              </button>
            )}
          </div>
        )}
      </Sheet>
    </Screen>
  )
}
