import { Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CASHBACK_RATE, MONTHLY_CAP_KZT, STATUS_LABEL, type Status } from '../domain/loyalty'
import { formatKzt } from '../domain/money'
import { selectStatus, useBank } from '../store/useBank'
import { Nugget, Sticker } from '../ui/gold'
import { Button, Card, Header, Screen } from '../ui/ui'

const STATUSES: { id: Status; cond: string; look: string }[] = [
  { id: 'sand', cond: 'портфель в банке до 100 000 ₸', look: 'тонкая струйка' },
  { id: 'nugget', cond: '100 000 – 500 000 ₸', look: 'частицы и самородки' },
  { id: 'bar', cond: 'от 500 000 ₸ и пополнения 2 месяца подряд', look: 'золотой дождь' },
]

export function Cashback() {
  const nav = useNavigate()
  const s = useBank()
  const status = selectStatus(s)
  const [mode, setMode] = useState<'kzt' | 'gold'>(s.cashbackMode)
  const [ack, setAck] = useState(s.cashbackMode === 'gold')

  return (
    <Screen>
      <Header title="Кешбэк" />
      <div className="px-5">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Кешбэк в тенге или в граммах?</h1>
        <p className="mt-2 text-sm text-ink-2">Кешбэк начисляется только за покупки картой — не на остаток.</p>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-line text-sm">
          <div className="grid grid-cols-[1fr_1fr_1fr] bg-surface font-semibold">
            <div className="p-3" />
            <div className="p-3">В ₸</div>
            <div className="p-3">В золоте</div>
          </div>
          {[
            ['Что это', 'Возврат денег', 'Актив: токен золота'],
            ['Цена', 'Не меняется', 'Может расти и снижаться'],
            ['Декларация', 'Не нужна', 'Нужна (250, при продаже 270) — подготовим'],
          ].map(([a, b, c]) => (
            <div key={a} className="grid grid-cols-[1fr_1fr_1fr] border-t border-line">
              <div className="p-3 text-ink-2">{a}</div>
              <div className="p-3">{b}</div>
              <div className="p-3 font-medium">{c}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(['kzt', 'gold'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`h-12 rounded-xl text-[15px] font-semibold ${mode === m ? (m === 'gold' ? 'bg-gold text-ink' : 'bg-ink text-white') : 'bg-surface text-ink'}`}
            >
              {m === 'gold' ? 'В золоте' : 'В тенге'}
            </button>
          ))}
        </div>

        {mode === 'gold' && (
          <button onClick={() => setAck(!ack)} className="mt-4 flex w-full items-start gap-3 rounded-[16px] bg-gold-soft p-4 text-left text-sm">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${ack ? 'border-ink bg-ink text-white' : 'border-ink/40'}`}>{ack && <Check size={14} />}</span>
            <span>
              Понимаю, что золото — это <b>актив, а не депозит</b>: его цена может снижаться, и его нужно отражать в декларации. Мы говорим об этом <b>до</b> выбора, а не после.
            </span>
          </button>
        )}

        <Button
          className="mt-4"
          disabled={mode === 'gold' && !ack}
          onClick={() => {
            s.setCashbackMode(mode)
            nav('/home')
          }}
        >
          Сохранить выбор
        </Button>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">Золотой дождь</h2>
          <Nugget size={40} />
        </div>
        <p className="mt-1 text-sm text-ink-2">Чем больше твои сбережения в банке — тем больше золота падает с каждой покупки. Активы партнёров не учитываются — они хранятся не у банка.</p>
        <div className="mt-3 space-y-2">
          {STATUSES.map((st) => (
            <Card key={st.id} className={`flex items-center justify-between ${status === st.id ? 'ring-2 ring-gold' : ''}`}>
              <div>
                <div className="font-semibold">
                  {STATUS_LABEL[st.id]} {status === st.id && <span className="text-xs text-ink-2">· сейчас</span>}
                </div>
                <div className="text-xs text-ink-2">{st.cond}</div>
                <div className="text-xs text-ink-3">анимация: {st.look}</div>
              </div>
              <Sticker bg={status === st.id ? '#F2AE3A' : '#fff'} rotate={-4}>
                {CASHBACK_RATE[st.id] * 100}%
              </Sticker>
            </Card>
          ))}
        </div>
        <p className="mt-3 mb-6 text-[11px] text-ink-3">Повышенный кешбэк за статус — не процент на золото. Лимит — {formatKzt(MONTHLY_CAP_KZT, 0)} в месяц.</p>
      </div>
    </Screen>
  )
}
