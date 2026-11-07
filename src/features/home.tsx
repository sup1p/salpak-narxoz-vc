import { ArrowDownToLine, ArrowRight, BarChart3, BookOpen, ChevronRight, Coffee, FileText, Gift, Plus, Sparkles, Unlock } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LESSONS, PARTNER, USDT_KZT } from '../data/seed'
import { nextStatusGap, STATUS_LABEL } from '../domain/loyalty'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { hasRealBuy, selectPortfolio, selectRegular, selectStatus, useBank } from '../store/useBank'
import { GoldCapsule, MiningRain, Sticker } from '../ui/gold'
import { Balance, Toast } from '../ui/ui'
import { Tour } from './tour'

const STATUS_BG = { sand: '#F6E7D3', nugget: '#DCA86E', bar: '#00AB75' } as const

/** Round "stories" row (§12, Gold Apple-style). */
const STORIES = [
  { to: '/cashback', label: 'кешбэк', icon: Sparkles },
  { to: '/academy', label: 'академия', icon: BookOpen },
  { to: '/invite', label: 'подарок', icon: Gift },
  { to: '/tax', label: 'налоги', icon: FileText },
  { to: '/levels', label: 'уровни', icon: Unlock },
  { to: '/metrics', label: 'метрики', icon: BarChart3 },
]

function AccountRow({ title, sub, value, valueSub, onClick }: { title: string; sub?: string; value: string; valueSub?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-3 border-b border-line py-3.5 text-left last:border-0">
      <div>
        <div className="text-[15px] font-semibold lowercase">{title}</div>
        {sub && <div className="text-xs text-ink-3">{sub}</div>}
      </div>
      <div className="text-right">
        <div className="num text-[15px] font-semibold">{value}</div>
        {valueSub && <div className="num text-xs text-ink-3">{valueSub}</div>}
      </div>
    </button>
  )
}

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
  const bought = hasRealBuy(s)

  const flash = (t: string, ms = 2400) => {
    setToast(t)
    setTimeout(() => setToast(''), ms)
  }
  const payCoffee = () => {
    const r = s.payCard(1500, 'Кофе · Coffee Boom')
    if (s.cashbackMode === 'gold') {
      setRain(true)
      setTimeout(() => setPulse((p) => p + 1), 900)
      setTimeout(() => setRain(false), 2600)
      flash(`Кофе −1 500 ₸ · +${formatNum(r.grams, 4)} г золота`)
    } else flash(`Кофе −1 500 ₸ · кешбэк +${formatNum(r.kzt, 0)} ₸`)
  }

  const nextStep = !bought
    ? { text: 'Попробуй покупку в режиме Пробы — без риска', to: '/buy?try=1' }
    : s.cashbackMode !== 'gold'
      ? { text: 'Включи кешбэк в золоте', to: '/cashback' }
      : !s.lessonsDone.includes('spread')
        ? { text: 'Урок «Спред и комиссия» — 2 минуты', to: '/academy/spread' }
        : { text: 'Подари другу немного золота', to: '/invite' }

  return (
    <div ref={root} className="relative pb-28">
      <Toast show={!!toast}>{toast}</Toast>
      <MiningRain show={rain} status={status} />
      <Tour root={root} />

      {/* top bar */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-extrabold lowercase tracking-[-0.04em]">altyn</span>
          <span className="text-[11px] font-semibold text-green">by BCC</span>
        </div>
        <Sticker bg={STATUS_BG[status]}>{STATUS_LABEL[status]}</Sticker>
      </div>

      {/* total */}
      <div data-tour="total" className="px-5 pt-5">
        <div className="eyebrow">всего в altyn</div>
        <Balance value={total} className="mt-1.5 text-[44px] tracking-[-0.04em]" />
        <div className="num mt-1 text-xs text-ink-3">≈ {formatGrams(total / s.market, 2)} золота · эквивалент, не золото</div>
      </div>

      {/* hero: your gold (full-bleed, product-photo style) */}
      <div data-tour="gold" className="mt-5 bg-surface">
        <div className="relative overflow-hidden px-5 pb-5 pt-5">
          <button onClick={() => nav('/gold')} className="block text-left">
            <div className="eyebrow">твоё золото · проба 999,9</div>
            <div className="num mt-2 text-[34px] font-extrabold leading-none tracking-[-0.03em]">{formatGrams(s.gold)}</div>
            <div className="num mt-1 text-sm text-ink-2">≈ {formatKzt(s.gold * s.market, 0)}</div>
            {s.gold < 1 && <div className="num mt-1 text-xs text-ink-3">ещё {formatGrams(1 - s.gold, 2)} до первого грамма</div>}
          </button>
          <div className="pointer-events-none absolute -right-4 bottom-0">
            <GoldCapsule grams={s.gold} height={128} pulse={pulse} />
          </div>
          <button
            onClick={() => nav(bought ? '/buy' : '/buy?try=1')}
            className="relative mt-5 inline-flex h-10 items-center gap-2 bg-white px-4 text-[12px] font-semibold uppercase tracking-[.1em] text-ink"
          >
            купить золото <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* actions */}
      <div data-tour="actions" className="mt-4 grid grid-cols-3 gap-2 px-5">
        <button onClick={() => nav(bought ? '/buy' : '/buy?try=1')} className="flex h-11 items-center justify-center gap-1.5 rounded-[2px] bg-ink text-[12px] font-semibold uppercase tracking-[.08em] text-white">
          <Plus size={16} /> купить
        </button>
        <button onClick={() => { s.topUp(10000); flash('+10 000 ₸ (тест)', 1800) }} className="flex h-11 items-center justify-center gap-1.5 rounded-[2px] text-[12px] font-semibold uppercase tracking-[.08em] ring-1 ring-inset ring-ink">
          <ArrowDownToLine size={16} /> пополнить
        </button>
        <button onClick={payCoffee} className="flex h-11 items-center justify-center gap-1.5 rounded-[2px] text-[12px] font-semibold uppercase tracking-[.08em] ring-1 ring-inset ring-ink">
          <Coffee size={16} /> кофе
        </button>
      </div>

      {/* stories */}
      <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto px-5 pb-1">
        {STORIES.map((st) => (
          <button key={st.to} onClick={() => nav(st.to)} className="flex w-[64px] shrink-0 flex-col items-center gap-1.5 pt-1">
            <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-surface ring-2 ring-gold ring-offset-2">
              <st.icon size={24} strokeWidth={1.7} />
            </span>
            <span className="text-[12px] lowercase text-ink">{st.label}</span>
          </button>
        ))}
      </div>

      {/* accounts */}
      <div className="mt-7 px-5">
        <div className="eyebrow">счета</div>
        <div className="mt-1">
          <AccountRow title="золото" sub="хранитель: Кастодиан (тест)" value={formatGrams(s.gold)} valueSub={`≈ ${formatKzt(s.gold * s.market, 0)}`} onClick={() => nav('/gold')} />
          {s.usdt > 0 && <AccountRow title="USDT" sub="хранение у кастодиана банка" value={`${formatNum(s.usdt, 2)} USDT`} valueSub={`≈ ${formatKzt(s.usdt * USDT_KZT, 0)}`} onClick={() => nav('/otc')} />}
          <AccountRow title="карта altyn" sub="•• 2026" value={formatKzt(s.cardKzt, 0)} />
          <AccountRow title="сбережения" sub="в тенге" value={formatKzt(s.savingsKzt, 0)} />
          {s.partnerConnected && <AccountRow title={PARTNER.name} sub="хранится у партнёра, не у банка" value={`${PARTNER.usdt} USDT`} valueSub={`≈ ${formatKzt(partnerKzt, 0)}`} onClick={() => nav('/partner')} />}
        </div>
      </div>

      {/* loyalty */}
      <div data-tour="loyalty" className="mt-6 px-5">
        <button onClick={() => nav('/cashback')} className="w-full border-t border-line pt-4 text-left">
          <div className="flex items-baseline justify-between">
            <div className="eyebrow">золотой дождь · {STATUS_LABEL[status]}</div>
            <span className="text-xs text-ink-2">{s.cashbackMode === 'gold' ? 'кешбэк в золоте' : 'кешбэк в ₸'}</span>
          </div>
          {gap && (
            <>
              <div className="mt-3 h-[3px] bg-line">
                <div className="h-full bg-gold" style={{ width: `${Math.min(100, (portfolio / (gap.next === 'nugget' ? 100000 : 500000)) * 100)}%` }} />
              </div>
              <div className="num mt-2 text-sm text-ink-2">
                До «{STATUS_LABEL[gap.next]}» — ещё {formatKzt(Math.max(0, gap.gapKzt), 0)}
                {gap.next === 'bar' && regular < 2 ? ' и пополнения 2 месяца подряд' : ''}
              </div>
            </>
          )}
        </button>
      </div>

      {/* next step */}
      <div data-tour="next" className="mt-6 px-5">
        <button onClick={() => nav(nextStep.to)} className="flex w-full items-center justify-between bg-ink px-5 py-4 text-left text-white">
          <div>
            <div className="eyebrow !text-white/60">следующий шаг</div>
            <div className="mt-1 text-[15px] font-semibold">{nextStep.text}</div>
          </div>
          <ChevronRight />
        </button>
      </div>

      {/* learning progress */}
      <div className="mt-6 px-5">
        <button onClick={() => nav('/academy')} className="w-full border-t border-line pt-4 text-left">
          <div className="flex items-baseline justify-between">
            <div className="eyebrow">финансовая прокачка</div>
            <span className="num text-sm text-ink-2">
              {s.lessonsDone.length} из {LESSONS.length}
            </span>
          </div>
          <div className="mt-3 flex gap-1">
            {LESSONS.map((l) => (
              <span key={l.id} className={`h-[3px] flex-1 ${s.lessonsDone.includes(l.id) ? 'bg-gold' : 'bg-line'}`} />
            ))}
          </div>
        </button>
      </div>
    </div>
  )
}
