import { motion } from 'framer-motion'
import { AlertTriangle, FastForward, Scale } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAR } from '../data/seed'
import { formatGrams, formatKzt, formatNum, parseAmount } from '../domain/money'
import { MIN_BUY, quoteBuy, quoteSell, type Receipt, type Side } from '../domain/pricing'
import { useBank, type OpError } from '../store/useBank'
import { GoldCapsule, Sticker, TimerRing } from '../ui/gold'
import { Button, Card, Header, Row, Screen, Sheet } from '../ui/ui'

type Step = 'input' | 'quote' | 'expired' | 'success'

function ReceiptView({ r, onTerm }: { r: Receipt; onTerm: (id: string) => void }) {
  const buy = r.side === 'buy'
  return (
    <div>
      <Row label="Рыночная цена" value={`${formatNum(r.market, 0)} ₸/г`} />
      <Row label={buy ? 'Спред +0,5%' : 'Спред −0,5%'} onLabel={() => onTerm('spread')} value={`${formatNum(r.price, 0)} ₸/г`} />
      <Row label="Комиссия 0,3% (мин. 50 ₸)" onLabel={() => onTerm('spread')} value={formatKzt(r.fee)} />
      <div className="my-1 h-px bg-line" />
      {buy ? (
        <>
          <Row label="Ты платишь" value={formatKzt(r.amountKzt)} strong />
          <Row label="Получаешь" value={formatGrams(r.grams)} strong />
        </>
      ) : (
        <>
          <Row label="Продаёшь" value={formatGrams(r.grams)} strong />
          <Row label="Получишь на карту" value={formatKzt(r.totalKzt)} strong />
        </>
      )}
      <Row label="Хранитель" onLabel={() => onTerm('custody')} value={BAR.custodian} />
    </div>
  )
}

export function TradeFlow({ side }: { side: Side }) {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const s = useBank()
  const buy = side === 'buy'
  const [step, setStep] = useState<Step>('input')
  const [input, setInput] = useState('')
  const [r, setR] = useState<Receipt | null>(null)
  const [oldPrice, setOldPrice] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [pinOpen, setPinOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<OpError | null>(null)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    if (params.get('try') === '1' && buy) s.setSandbox(true)
    return () => useBank.getState().setSandbox(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sandbox = s.sandbox.on
  const card = sandbox ? s.sandbox.cardKzt : s.cardKzt
  const gold = sandbox ? s.sandbox.gold : s.gold

  const amount = parseAmount(input) ?? 0
  const preview = useMemo(() => (amount > 0 ? (buy ? quoteBuy(amount, s.market, 0) : quoteSell(amount, s.market, 0)) : null), [amount, buy, s.market])

  const inputError = !amount
    ? null
    : buy
      ? amount < MIN_BUY
        ? `Минимальная покупка — ${formatKzt(MIN_BUY)}`
        : amount > card
          ? `Не хватает ${formatKzt(amount - card, 0)}`
          : null
      : amount > gold + 1e-9
        ? `У тебя только ${formatGrams(gold)}`
        : null

  useEffect(() => {
    if (step !== 'quote' || !r) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [step, r])

  const left = r ? Math.max(0, Math.ceil((r.expiresAt - now) / 1000)) : 30

  useEffect(() => {
    if (step === 'quote' && r && left === 0 && !pinOpen) expire()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, step])

  const getQuote = () => {
    const t = Date.now()
    setNow(t)
    setR(buy ? quoteBuy(amount, s.market, t) : quoteSell(amount, s.market, t))
    setStep('quote')
  }
  const expire = () => {
    if (!r) return
    setOldPrice(r.price)
    s.bumpMarket(0.003)
    setPinOpen(false)
    setPin('')
    setStep('expired')
  }
  const requote = () => {
    const t = Date.now()
    const m = useBank.getState().market
    setNow(t)
    setR(buy ? quoteBuy(amount, m, t) : quoteSell(amount, m, t))
    setStep('quote')
  }
  const confirm = () => {
    if (!r || busy) return
    setBusy(true)
    setTimeout(() => {
      const e = useBank.getState().confirm(r, Date.now())
      setBusy(false)
      setPinOpen(false)
      setPin('')
      if (e === 'QUOTE_EXPIRED') return expire()
      if (e) return setErr(e)
      setStep('success')
      setTimeout(() => setPulse(1), 300)
    }, 500)
  }
  const pressPin = (d: string) => {
    const next = d === '⌫' ? pin.slice(0, -1) : pin.length < 4 ? pin + d : pin
    setPin(next)
    if (next.length === 4) confirm()
  }
  const goTerm = (id: string) => nav(`/academy/${id}`)

  const presets = buy ? [1000, 5000, 10000] : [0.25, 0.5, 1].map((p) => Math.floor(gold * p * 10000) / 10000)

  return (
    <Screen className="relative">
      <Header
        title={buy ? 'Купить золото' : 'Продать золото'}
        right={
          sandbox ? (
            <Sticker bg="#FF7AD9" rotate={4} className="text-[11px]">
              Проба
            </Sticker>
          ) : undefined
        }
      />

      {step === 'input' && (
        <div className="flex flex-1 flex-col px-5">
          {sandbox && <p className="mb-3 rounded-2xl bg-pink/20 p-3 text-sm">Режим Пробы: виртуальные {formatKzt(s.sandbox.cardKzt, 0)}. Реальные балансы не меняются.</p>}
          <div className="text-sm text-ink-2">{buy ? 'Сумма в тенге' : 'Сколько граммов продать'}</div>
          <div className="mt-2 flex items-baseline gap-2">
            <input
              autoFocus
              inputMode="decimal"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={buy ? '10 000' : '0,1'}
              className="num w-full bg-transparent text-[52px] font-bold outline-none placeholder:text-ink-3"
            />
            <span className="text-3xl font-bold text-ink-3">{buy ? '₸' : 'г'}</span>
          </div>
          <div className="num text-sm text-ink-2">
            {preview && !inputError ? (buy ? `≈ ${formatGrams(preview.grams)} золота` : `≈ ${formatKzt(preview.totalKzt)} на карту`) : buy ? `Доступно ${formatKzt(card, 0)}` : `Доступно ${formatGrams(gold)}`}
          </div>
          {inputError && <div className="mt-2 text-sm font-medium text-err">{inputError}</div>}
          <div className="mt-5 flex gap-2">
            {presets.map((p, i) => (
              <button key={i} onClick={() => setInput(String(p).replace('.', ','))} className="num h-10 flex-1 rounded-full bg-surface text-sm font-semibold">
                {buy ? formatNum(p) : ['25%', '50%', 'Всё'][i]}
              </button>
            ))}
          </div>
          {inputError?.startsWith('Не хватает') && (
            <button onClick={() => { s.topUp(50000) }} className="mt-3 h-10 rounded-full border border-line text-sm font-semibold">
              Пополнить на 50 000 ₸ (тест)
            </button>
          )}
          <div className="mt-auto pb-6 pt-6">
            <Button variant="gold" disabled={!amount || !!inputError} onClick={getQuote}>
              Зафиксировать цену на 30 сек
            </Button>
          </div>
        </div>
      )}

      {step === 'quote' && r && (
        <div className="flex flex-1 flex-col px-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-2xl font-bold uppercase">Цена на 30 секунд</div>
              <div className="text-sm text-ink-2">Заплатишь ровно то, что видишь</div>
            </div>
            <TimerRing left={left} />
          </div>
          <Card className="mt-4">
            <div className="mb-1 text-sm font-semibold">Из чего цена</div>
            <ReceiptView r={r} onTerm={goTerm} />
          </Card>
          <div className="mt-3 flex gap-3 rounded-[16px] bg-gold-soft p-4 text-sm">
            <Scale size={18} className="shrink-0" />
            {buy ? 'Золото — это актив, а не депозит. Оно попадёт в декларацию (форма 250) — данные мы подготовим.' : 'Продажа — событие для декларации (форма 270): результат к средней цене покупки мы посчитаем.'}
          </div>
          <button onClick={() => setR({ ...r, expiresAt: Date.now() })} className="mt-3 inline-flex h-9 items-center gap-1 self-start rounded-full px-3 text-xs text-ink-3 active:bg-surface">
            <FastForward size={14} /> демо: ускорить таймер
          </button>
          <div className="mt-auto pb-6 pt-4">
            <Button variant="gold" onClick={() => setPinOpen(true)}>
              Подтвердить
            </Button>
          </div>
        </div>
      )}

      {step === 'expired' && r && (
        <div className="flex flex-1 flex-col px-5">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-warn/10 text-warn">
            <AlertTriangle />
          </div>
          <h1 className="mt-4 text-[28px] font-bold leading-tight">Цена обновилась</h1>
          <p className="mt-2 text-ink-2">30 секунд прошли, а рынок двигается. Мы ничего не списали — вот новая цена.</p>
          <Card className="mt-5">
            <Row label="Была" value={`${formatNum(oldPrice, 0)} ₸/г`} />
            <Row label="Стала" value={`${formatNum((buy ? quoteBuy(MIN_BUY, s.market, 0) : quoteSell(1, s.market, 0)).price, 0)} ₸/г`} strong />
            <Row label="Изменение" value="+0,3%" />
          </Card>
          <div className="mt-auto space-y-2 pb-6 pt-4">
            <Button variant="gold" onClick={requote}>
              Получить новую цену
            </Button>
            <Button variant="secondary" onClick={() => nav(-1)}>
              Отменить
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && r && (
        <div className="flex flex-1 flex-col items-center px-5 text-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-2">
            <GoldCapsule grams={sandbox ? s.sandbox.gold : s.gold} height={170} pulse={pulse} />
          </motion.div>
          <h1 className="mt-5 font-display text-[36px] font-bold leading-none">{buy ? `+${formatGrams(r.grams)}` : `+${formatKzt(r.totalKzt)}`}</h1>
          <p className="mt-2 text-ink-2">{buy ? (sandbox ? 'Это была проба — реальные деньги не тронуты.' : 'Золото уже в твоей капсуле.') : 'Деньги уже на карте.'}</p>
          <Card className="mt-5 w-full text-left">
            <div className="mb-1 text-sm font-semibold">Чек · Из чего цена</div>
            <ReceiptView r={r} onTerm={goTerm} />
          </Card>
          <div className="mt-auto w-full space-y-2 pb-6 pt-4">
            {sandbox ? (
              <Button
                variant="gold"
                onClick={() => {
                  s.setSandbox(false)
                  setStep('input')
                  setR(null)
                }}
              >
                Повторить по-настоящему
              </Button>
            ) : (
              <Button onClick={() => nav('/home')}>На главную</Button>
            )}
            {!sandbox && buy && (
              <Button variant="secondary" onClick={() => nav('/academy/spread')}>
                Сколько я заплатил(а) сверх рынка?
              </Button>
            )}
          </div>
        </div>
      )}

      <Sheet open={pinOpen} onClose={() => { setPinOpen(false); setPin('') }}>
        <div className="text-center">
          <div className="text-lg font-bold">Введи PIN</div>
          <div className="num mt-1 text-sm text-ink-2">{r && (buy ? `${formatKzt(r.amountKzt)} → ${formatGrams(r.grams)}` : `${formatGrams(r.grams)} → ${formatKzt(r.totalKzt)}`)}</div>
          <div className="mt-4 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < pin.length ? 'bg-ink' : 'bg-line'}`} />
            ))}
          </div>
          {busy && <div className="mt-3 text-sm text-ink-2">Проводим операцию…</div>}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Face ID', '0', '⌫'].map((d) => (
              <button
                key={d}
                disabled={busy}
                onClick={() => (d === 'Face ID' ? confirm() : pressPin(d))}
                className={`num h-12 rounded-xl bg-surface font-semibold active:bg-line ${d === 'Face ID' ? 'text-xs' : 'text-xl'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet open={!!err} onClose={() => setErr(null)}>
        <div className="text-center">
          <AlertTriangle className="mx-auto text-err" />
          <div className="mt-2 text-lg font-bold">Операция не прошла</div>
          <p className="mt-1 text-sm text-ink-2">
            {err === 'INSUFFICIENT_FUNDS' && 'Не хватает денег на карте.'}
            {err === 'INSUFFICIENT_GOLD' && 'Золота меньше, чем ты хочешь продать.'}
            {err === 'BELOW_MIN' && `Минимальная покупка — ${formatKzt(MIN_BUY)}.`}
            {err === 'DUPLICATE' && 'Эта операция уже проведена — мы не спишем дважды.'}
          </p>
          <Button className="mt-4" onClick={() => { setErr(null); setStep('input') }}>
            Понятно
          </Button>
        </div>
      </Sheet>
    </Screen>
  )
}
