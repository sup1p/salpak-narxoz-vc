import { ArrowDownToLine, ChevronRight, Coffee, Gift, Plus, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LESSONS, PARTNER, USDT_KZT } from '../data/seed'
import { nextStatusGap, STATUS_LABEL } from '../domain/loyalty'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { hasRealBuy, selectPortfolio, selectRegular, selectStatus, useBank } from '../store/useBank'
import { Tour } from './tour'
import { GoldCapsule, MiningRain, Sticker } from '../ui/gold'
import { Balance, Card, Toast } from '../ui/ui'

const STATUS_BG = { sand: '#F6E7D3', nugget: '#DCA86E', bar: '#00AB75' } as const

export function Home() {
  const nav = useNavigate()
  const s = useBank()
  const portfolio = selectPortfolio(s)
  const status = selectStatus(s)
  const regular = selectRegular(s)
  const gap = nextStatusGap(portfolio, regular)
  const root = useRef<HTMLDivElement>(null)
  const partnerKzt = s.partnerConnected ? PARTNER.usdt * USDT_KZT : 0
  const total = portfolio + partnerKzt
  const [toast, setToast] = useState('')
  const [rain, setRain] = useState(false)
  const [pulse, setPulse] = useState(0)

  const payCoffee = () => {
    const r = s.payCard(1500, 'Кофе · Coffee Boom')
    if (s.cashbackMode === 'gold') {
      setRain(true)
      setTimeout(() => setPulse((p) => p + 1), 900)
      setTimeout(() => setRain(false), 2600)
      setToast(`☕ −1 500 ₸ · +${formatNum(r.grams, 4)} г золота`)
    } else setToast(`☕ −1 500 ₸ · кешбэк +${formatNum(r.kzt, 0)} ₸`)
    setTimeout(() => setToast(''), 2600)
  }

  const bought = hasRealBuy(s)
  const nextStep = !bought
    ? { text: 'Попробуй покупку в режиме Пробы — без риска', to: '/buy?try=1' }
    : s.cashbackMode !== 'gold'
      ? { text: 'Включи кешбэк в золоте', to: '/cashback' }
      : !s.lessonsDone.includes('spread')
        ? { text: 'Пройди урок «Спред и комиссия» — 2 минуты', to: '/academy/spread' }
        : { text: 'Подари другу немного золота', to: '/invite' }

  return (
    <div ref={root} className="relative px-5 pb-28 pt-6">
      <Toast show={!!toast}>{toast}</Toast>
      <Tour root={root} />
      <MiningRain show={rain} status={status} />

      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2"><span className="font-display text-xl font-bold uppercase tracking-wide">Altyn</span><span className="text-[11px] font-semibold text-green">by BCC</span></div>
        <Sticker bg={STATUS_BG[status]} rotate={4} className="text-xs">
          {STATUS_LABEL[status]}
        </Sticker>
      </div>

      <div data-tour="total">
        <div className="mt-6 text-sm text-ink-2">Всего</div>
        <Balance value={total} className="mt-1 text-[52px]" />
        <div className="mt-1 text-xs text-ink-3">≈ {formatGrams(total / s.market, 2)} золота · эквивалент, не золото</div>
      </div>

      <div data-tour="actions" className="mt-5 grid grid-cols-3 gap-2">
        <button onClick={() => nav(bought ? '/buy' : '/buy?try=1')} className="gold-grad flex h-12 items-center justify-center gap-1.5 rounded-full text-sm font-semibold">
          <Plus size={18} /> Купить
        </button>
        <button onClick={() => { s.topUp(10000); setToast('+10 000 ₸ (тест)'); setTimeout(() => setToast(''), 1800) }} className="flex h-12 items-center justify-center gap-2 rounded-full bg-surface text-sm font-semibold">
          <ArrowDownToLine size={18} /> Пополнить
        </button>
        <button onClick={payCoffee} className="flex h-12 items-center justify-center gap-2 rounded-full bg-surface text-sm font-semibold">
          <Coffee size={18} /> Кофе
        </button>
      </div>

      {/* Gold card */}
      <div data-tour="gold">
      <Card className="relative mt-4 flex items-center justify-between bg-white shadow-[0_0_0_1px_#E7E7EB]" onClick={() => nav('/gold')}>
        <div>
          <div className="text-sm text-ink-2">Твоё золото</div>
          <div className="num mt-1 text-[32px] font-bold leading-none">{formatGrams(s.gold)}</div>
          <div className="num mt-1 text-sm text-ink-2">≈ {formatKzt(s.gold * s.market, 0)}</div>
          {s.gold < 1 && <div className="mt-3 text-xs text-ink-3">ещё {formatGrams(1 - s.gold, 2)} до первого грамма</div>}
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
            Где лежит и сколько стоит <ChevronRight size={14} />
          </div>
        </div>
        <GoldCapsule grams={s.gold} height={140} pulse={pulse} />
      </Card>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-ink-2">Карта</div>
          <div className="num mt-1 text-lg font-bold">{formatKzt(s.cardKzt, 0)}</div>
        </Card>
        <Card>
          <div className="text-xs text-ink-2">Сбережения</div>
          <div className="num mt-1 text-lg font-bold">{formatKzt(s.savingsKzt, 0)}</div>
        </Card>
      </div>

      {s.usdt > 0 && (
        <Card className="mt-3" onClick={() => nav('/otc')}>
          <div className="text-xs text-ink-2">USDT в Altyn (хранение у кастодиана банка)</div>
          <div className="num mt-1 text-lg font-bold">{formatNum(s.usdt, 2)} USDT</div>
          <div className="num text-xs text-ink-2">≈ {formatKzt(s.usdt * USDT_KZT, 0)}</div>
        </Card>
      )}

      {s.partnerConnected && (
        <Card className="mt-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-ink-2">{PARTNER.name}</div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold">Хранится у партнёра, не у банка</span>
          </div>
          <div className="num mt-1 text-lg font-bold">{PARTNER.usdt} USDT</div>
          <div className="num text-xs text-ink-2">≈ {formatKzt(partnerKzt, 0)}</div>
        </Card>
      )}

      {/* Loyalty */}
      <div data-tour="loyalty">
      <Card className="mt-3" onClick={() => nav('/cashback')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} /> Золотой дождь · {STATUS_LABEL[status]}
          </div>
          <span className="text-xs text-ink-2">{s.cashbackMode === 'gold' ? 'кешбэк в золоте' : 'кешбэк в ₸'}</span>
        </div>
        {gap && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="gold-grad h-full" style={{ width: `${Math.min(100, (portfolio / (gap.next === 'nugget' ? 100000 : 500000)) * 100)}%` }} />
            </div>
            <div className="num mt-2 text-xs text-ink-2">
              До статуса «{STATUS_LABEL[gap.next]}» — ещё {formatKzt(Math.max(0, gap.gapKzt), 0)}
              {gap.next === 'bar' && regular < 2 ? ' и пополнения 2 месяца подряд' : ''}
            </div>
          </>
        )}
      </Card>
      </div>

      {/* Next step */}
      <div data-tour="next">
      <Card className="mt-3 flex items-center justify-between bg-ink text-white" onClick={() => nav(nextStep.to)}>
        <div>
          <div className="text-xs text-white/60">Следующий шаг</div>
          <div className="mt-1 font-semibold">{nextStep.text}</div>
        </div>
        <ChevronRight />
      </Card>
      </div>

      <Card className="mt-3" onClick={() => nav('/academy')}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Финансовая прокачка</span>
          <span className="num text-ink-2">
            {s.lessonsDone.length} из {LESSONS.length}
          </span>
        </div>
        <div className="mt-3 flex gap-1">
          {LESSONS.map((l) => (
            <span key={l.id} className={`h-2 flex-1 rounded-full ${s.lessonsDone.includes(l.id) ? 'bg-gold' : 'bg-white'}`} />
          ))}
        </div>
      </Card>

      <Card className="mt-3 mb-4 flex items-center gap-3" onClick={() => nav('/invite')}>
        <Gift size={20} />
        <div className="text-sm font-semibold">Позови друга подарком — 0,01 г золота</div>
      </Card>
    </div>
  )
}
