import { ArrowDownLeft, ArrowUpRight, Check, Coins, CreditCard, FastForward, PiggyBank } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatGrams, formatKzt, formatNum, parseAmount } from '../domain/money'
import { rewardGrams, SAVINGS_RATE, savingsReward } from '../domain/savings'
import { useBank, type Op } from '../store/useBank'
import { Button, Header, List, ListRow, Screen, SectionTitle, Sheet } from '../ui/ui'
import { OpDetail, opAmounts, opIcon } from './opView'

/**
 * «Сбережения» (CONCEPT §5.15, US-17.x): накопительный счёт в ₸ — пополнить, снять,
 * вознаграждение каждый день; выплата в ₸ или граммами золота по цене рынка.
 */
export function Savings() {
  const nav = useNavigate()
  const s = useBank()
  const [move, setMove] = useState<'in' | 'out' | null>(null)
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')
  const [payout, setPayout] = useState<'kzt' | 'gold'>(s.savingsPayout)
  const [ack, setAck] = useState(s.savingsPayout === 'gold')
  const [open, setOpen] = useState<Op | null>(null)

  useEffect(() => {
    useBank.getState().accrueSavings()
  }, [])

  const day = savingsReward(s.savingsKzt, 1)
  const month = savingsReward(s.savingsKzt, 30)
  const ops = s.history.filter((o) => o.type === 'interest' || o.type === 'transfer')
  const rewards = ops.filter((o) => o.type === 'interest')
  const totalKzt = rewards.reduce((a, o) => a + o.kzt, 0)
  const totalG = rewards.reduce((a, o) => a + o.grams, 0)
  const amount = parseAmount(input) ?? 0
  const max = move === 'in' ? s.cardKzt : s.savingsKzt

  const submit = () => {
    if (!move) return
    if (amount > max) return setErr(move === 'in' ? `На карте только ${formatKzt(s.cardKzt, 0)}` : `На сбережениях только ${formatKzt(s.savingsKzt, 0)}`)
    const e = s.moveSavings(amount, move)
    if (e) return setErr('Проверь сумму')
    setMove(null)
    setInput('')
    setErr('')
  }

  return (
    <Screen>
      <Header title="Сбережения" />
      <div className="px-4 pb-8">
        {/* account */}
        <div className="rounded-3xl bg-mint p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#00573B]">Накопительный вклад в ₸</span>
            <span className="inline-flex h-6 items-center rounded-full bg-white/70 px-2.5 text-xs font-semibold text-[#00573B]">{formatNum(SAVINGS_RATE * 100, 0)}% годовых</span>
          </div>
          <div className="num mt-2 text-[34px] font-extrabold leading-none tracking-[-0.03em]">{formatKzt(s.savingsKzt, 0)}</div>
          <div className="num mt-2 text-sm font-medium text-[#00573B]">
            {s.savingsKzt > 0 ? `Каждый день ≈ +${formatKzt(day)} · за 30 дней ≈ +${formatKzt(month, 0)}` : 'Пополни счёт — вознаграждение начнёт начисляться завтра'}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setMove('in')} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white">
              <ArrowDownLeft size={16} /> Пополнить
            </button>
            <button onClick={() => setMove('out')} disabled={s.savingsKzt <= 0} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold disabled:opacity-40">
              <ArrowUpRight size={16} /> Снять на карту
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-3">Снять можно в любой момент, без комиссии. Ставка и условия в прототипе тестовые.</p>

        {/* payout */}
        <SectionTitle>Как получать вознаграждение</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {(['kzt', 'gold'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setPayout(m)
                if (m === 'kzt') {
                  setAck(false)
                  s.setSavingsPayout('kzt')
                }
              }}
              className={`rounded-2xl p-4 text-left ${payout === m ? (m === 'gold' ? 'bg-gold text-ink' : 'bg-ink text-white') : 'bg-surface'}`}
            >
              <div className="text-[15px] font-bold">{m === 'kzt' ? 'В тенге' : 'В граммах золота'}</div>
              <div className={`mt-1 text-xs ${payout === m && m === 'kzt' ? 'text-white/70' : 'text-ink-2'}`}>
                {m === 'kzt' ? 'Добавляем к сбережениям — сумма растёт сама' : `≈ ${formatGrams(rewardGrams(month, s.market), 4)} за 30 дней по цене рынка`}
              </div>
            </button>
          ))}
        </div>
        {payout === 'gold' && s.savingsPayout !== 'gold' && (
          <>
            <button onClick={() => setAck(!ack)} className="mt-3 flex w-full items-start gap-3 rounded-[16px] bg-gold-soft p-4 text-left text-sm">
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${ack ? 'border-ink bg-ink text-white' : 'border-ink/40'}`}>{ack && <Check size={14} />}</span>
              <span>
                Понимаю: вознаграждение считается на <b>тенге</b>, а выплачивается граммами по цене рынка. Золото — <b>актив, а не вклад</b>: его цена может снижаться, его нужно отразить в декларации.
              </span>
            </button>
            <Button className="mt-2" variant="gold" disabled={!ack} onClick={() => s.setSavingsPayout('gold')}>
              Получать в граммах
            </Button>
          </>
        )}
        {s.savingsPayout === 'gold' && <p className="mt-2 text-xs text-ink-2">Сейчас: вознаграждение приходит граммами в «Твоё золото».</p>}

        {/* what is what */}
        <SectionTitle>Где какие деньги</SectionTitle>
        <List>
          <ListRow icon={CreditCard} title="Карта GRAM" sub="Платежи и кешбэк за траты" value={formatKzt(s.cardKzt, 0)} />
          <ListRow icon={PiggyBank} tone="green" title="Сбережения" sub="Вклад в ₸, снять в любой момент" value={formatKzt(s.savingsKzt, 0)} />
          <ListRow icon={Coins} tone="gold" title="Золото" sub="Актив, цена меняется" value={formatGrams(s.gold)} onClick={() => nav('/gold')} />
        </List>

        {/* history */}
        <SectionTitle>Начислено и переводы</SectionTitle>
        {rewards.length > 0 && (
          <div className="mb-2 rounded-2xl bg-surface p-4 text-sm">
            <div className="text-ink-2">Вознаграждение за всё время</div>
            <div className="num mt-0.5 text-[20px] font-extrabold">
              +{formatKzt(totalKzt)}
              {totalG > 0 && <span className="text-[15px] font-semibold text-ink-2"> · +{formatNum(totalG, 4)} г</span>}
            </div>
          </div>
        )}
        {ops.length ? (
          <List>
            {ops.slice(0, 8).map((o) => {
              const [a, b] = opAmounts(o)
              const ic = opIcon(o)
              return <ListRow key={o.id} icon={ic.icon} tone={ic.tone} title={o.title} sub={new Date(o.at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} value={a} valueSub={b} onClick={() => setOpen(o)} />
            })}
          </List>
        ) : (
          <div className="rounded-2xl bg-surface p-4 text-sm text-ink-2">Пока ничего — первое вознаграждение придёт через сутки после пополнения.</div>
        )}
        {s.demoMode && (
          <button onClick={() => s.skipSavingsDays(30)} className="mt-3 inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs text-ink-3 active:bg-surface">
            <FastForward size={14} /> демо: прошло 30 дней
          </button>
        )}
        <p className="mt-3 text-xs text-ink-3">Вознаграждение — на остаток в тенге. Кешбэк — только за траты картой, на остаток его нет.</p>
      </div>

      <Sheet open={!!move} onClose={() => { setMove(null); setErr('') }}>
        <div className="text-[19px] font-bold">{move === 'in' ? 'С карты на сбережения' : 'Со сбережений на карту'}</div>
        <p className="mt-1 text-sm text-ink-2">Доступно {formatKzt(max, 0)} · без комиссии, сразу</p>
        <div className="mt-4 flex items-baseline gap-2 border-b-2 border-ink pb-2">
          <input
            inputMode="decimal"
            value={input}
            onChange={(e) => {
              setErr('')
              setInput(e.target.value)
            }}
            placeholder="0"
            aria-label="Сумма перевода"
            className="num w-full bg-transparent text-[36px] font-extrabold tracking-[-0.03em] outline-none placeholder:text-ink-3"
          />
          <span className="text-[26px] font-bold text-ink-3">₸</span>
        </div>
        {err && <div className="mt-2 text-sm font-medium text-err">{err}</div>}
        <div className="mt-3 flex gap-2">
          {[5000, 10000].map((v) => (
            <button key={v} onClick={() => setInput(String(v))} className="num h-9 flex-1 rounded-full bg-surface text-sm font-medium">
              {formatKzt(v, 0)}
            </button>
          ))}
          <button onClick={() => setInput(String(Math.floor(max)))} className="h-9 flex-1 rounded-full bg-surface text-sm font-medium">
            Всё
          </button>
        </div>
        <Button className="mt-5" disabled={!amount} onClick={submit}>
          {amount ? `Перевести ${formatKzt(amount, 0)}` : 'Введите сумму'}
        </Button>
      </Sheet>

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && <OpDetail op={open} onClose={() => setOpen(null)} />}
      </Sheet>
    </Screen>
  )
}
