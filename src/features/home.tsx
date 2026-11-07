import { ArrowDownLeft, Bell, BookOpen, ChevronRight, Coffee, Coins, CreditCard, FileText, Gift, PiggyBank, Plus, Repeat, Sparkles, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PARTNER, USDT_KZT } from '../data/seed'
import { nextStatusGap, STATUS_LABEL } from '../domain/loyalty'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { hasRealBuy, selectPortfolio, selectRegular, selectStatus, useBank } from '../store/useBank'
import { GoldCapsule, MiningRain } from '../ui/gold'
import { Badge, Balance, Button, List, ListRow, SectionTitle, TabPage, Toast } from '../ui/ui'
import { useUnreadCount } from './messages'

function Action({ icon: Icon, label, onClick, gold }: { icon: LucideIcon; label: string; onClick: () => void; gold?: boolean }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <span className={`grid h-12 w-12 place-items-center rounded-full ${gold ? 'bg-gold text-ink' : 'bg-surface text-ink'}`}>
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

/** «Главная» tab (DESIGN-SYSTEM §13). */
export function Home() {
  const nav = useNavigate()
  const s = useBank()
  const unread = useUnreadCount()
  const portfolio = selectPortfolio(s)
  const status = selectStatus(s)
  const regular = selectRegular(s)
  const gap = nextStatusGap(portfolio, regular)
  const partnerKzt = s.partnerConnected ? PARTNER.usdt * USDT_KZT : 0
  const total = portfolio + partnerKzt
  const bought = hasRealBuy(s)
  const [toast, setToast] = useState('')
  const [rain, setRain] = useState(false)
  const [pulse, setPulse] = useState(0)

  const flash = (t: string, ms = 2400) => {
    setToast(t)
    setTimeout(() => setToast(''), ms)
  }
  const pay = () => {
    const r = s.payCard(1500, 'Кофе · Coffee Boom')
    if (s.cashbackMode === 'gold') {
      setRain(true)
      setTimeout(() => setPulse((p) => p + 1), 900)
      setTimeout(() => setRain(false), 2600)
      flash(`Оплата 1 500 ₸ · кешбэк +${formatNum(r.grams, 4)} г золота`)
    } else flash(`Оплата 1 500 ₸ · кешбэк +${formatNum(r.kzt, 0)} ₸`)
  }

  const forYou: { icon: LucideIcon; title: string; sub: string; to: string }[] = [
    !bought
      ? { icon: Coins, title: 'Первая покупка без риска', sub: 'Режим Пробы — виртуальные деньги', to: '/buy?try=1' }
      : s.cashbackMode !== 'gold'
        ? { icon: Sparkles, title: 'Кешбэк в граммах', sub: 'Покупки картой → золото', to: '/cashback' }
        : { icon: Gift, title: 'Позови друга', sub: '0,01 г другу, +0,05 г обоим', to: '/invite' },
    { icon: BookOpen, title: s.lessonsDone.includes('spread') ? 'Академия' : 'Спред за 2 минуты', sub: `${s.lessonsDone.length} из 7 уроков пройдено`, to: s.lessonsDone.includes('spread') ? '/academy' : '/academy/spread' },
    { icon: FileText, title: 'Декларация', sub: 'Подготовим данные за тебя', to: '/tax' },
  ]

  const recent = s.history.filter((o) => o.id !== 'seed-cb').slice(0, 3)

  return (
    <TabPage>
      <Toast show={!!toast}>{toast}</Toast>
      <MiningRain show={rain} status={status} />

      {/* header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <button onClick={() => nav('/more')} className="flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-base font-bold">А</span>
          <div>
            <div className="text-[13px] text-ink-2">GRAM by BCC</div>
            <div className="text-[17px] font-semibold leading-tight">Айгерим</div>
          </div>
        </button>
        <button aria-label="Сообщения" onClick={() => nav('/messages')} className="relative grid h-10 w-10 place-items-center rounded-full bg-white">
          <Bell size={20} strokeWidth={1.8} />
          {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-err" />}
        </button>
      </div>

      <div className="px-4">
        {/* total + quick actions */}
        <div className="rounded-2xl bg-white p-4">
          <div data-tour="total">
            <div className="flex items-center justify-between">
              <div className="text-sm text-ink-2">Всего</div>
              <Badge tone="gold">{STATUS_LABEL[status]} · кешбэк {status === 'sand' ? '1' : status === 'nugget' ? '1,5' : '2'}%</Badge>
            </div>
            <Balance value={total} className="mt-2 text-[36px]" />
            <div className="num mt-1 text-xs text-ink-3">≈ {formatGrams(total / s.market, 2)} золота — эквивалент, не золото</div>
          </div>
          <div data-tour="actions" className="mt-4 grid grid-cols-3 border-t border-line pt-4">
            <Action icon={ArrowDownLeft} label="Пополнить" onClick={() => { s.topUp(10000); flash('Пополнение +10 000 ₸ (тест)', 1800) }} />
            <Action icon={Coffee} label="Оплатить" onClick={pay} />
            <Action icon={Plus} label="Купить золото" gold onClick={() => nav(bought ? '/buy' : '/buy?try=1')} />
          </div>
        </div>

        {/* gold widget */}
        <div data-tour="gold" className="mt-3 overflow-hidden rounded-2xl bg-white">
          <div className="flex items-stretch">
            <div className="flex-1 p-4 pr-0">
              <div className="text-sm text-ink-2">Золото · проба 999,9</div>
              <div className="num mt-1 text-[26px] font-bold leading-tight">{formatGrams(s.gold)}</div>
              <div className="num text-sm text-ink-2">≈ {formatKzt(s.gold * s.market, 0)}</div>
              {s.gold < 1 && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(3, s.gold * 100)}%` }} />
                  </div>
                  <div className="num mt-1 text-xs text-ink-3">До первого грамма — {formatGrams(1 - s.gold, 2)}</div>
                </div>
              )}
            </div>
            <div className="flex w-[150px] items-center justify-center">
              <GoldCapsule grams={s.gold} height={96} pulse={pulse} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <Button variant="secondary" onClick={() => nav('/gold')}>
              Перейти к золоту
            </Button>
            <Button variant="gold" onClick={() => nav(bought ? '/buy' : '/buy?try=1')}>
              Купить
            </Button>
          </div>
        </div>

        {/* accounts */}
        <SectionTitle>Счета</SectionTitle>
        <List>
          <ListRow icon={CreditCard} title="Карта GRAM" sub="•• 2026" value={formatKzt(s.cardKzt, 0)} />
          <ListRow icon={PiggyBank} title="Сбережения" sub="В тенге" value={formatKzt(s.savingsKzt, 0)} />
          {s.usdt > 0 && <ListRow icon={Repeat} title="USDT" sub="Хранение у кастодиана банка" value={`${formatNum(s.usdt, 2)} USDT`} valueSub={`≈ ${formatKzt(s.usdt * USDT_KZT, 0)}`} onClick={() => nav('/otc')} />}
          {s.partnerConnected && <ListRow icon={Repeat} title={PARTNER.name} sub="Хранится у партнёра, не у банка" value={`${PARTNER.usdt} USDT`} valueSub={`≈ ${formatKzt(partnerKzt, 0)}`} onClick={() => nav('/partner')} />}
        </List>

        {/* golden rain */}
        <button data-tour="loyalty" onClick={() => nav('/cashback')} className="mt-3 w-full rounded-2xl bg-white p-4 text-left">
          <div className="flex items-center justify-between">
            <div className="text-[15px] font-semibold">Золотой дождь</div>
            <span className="text-xs text-ink-2">{s.cashbackMode === 'gold' ? 'Кешбэк в золоте' : 'Кешбэк в тенге'}</span>
          </div>
          {gap ? (
            <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (portfolio / (gap.next === 'nugget' ? 100000 : 500000)) * 100)}%` }} />
              </div>
              <div className="num mt-2 text-[13px] text-ink-2">
                До статуса «{STATUS_LABEL[gap.next]}» — ещё {formatKzt(Math.max(0, gap.gapKzt), 0)}
                {gap.next === 'bar' && regular < 2 ? ' и пополнения 2 месяца подряд' : ''}
              </div>
            </>
          ) : (
            <div className="mt-2 text-[13px] text-ink-2">Максимальный статус — кешбэк 2%</div>
          )}
        </button>

        {/* for you (replaces round stories) */}
        <SectionTitle>Для тебя</SectionTitle>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {forYou.map((c) => (
            <button key={c.title} onClick={() => nav(c.to)} className="flex w-[200px] shrink-0 flex-col justify-between rounded-2xl bg-white p-4 text-left">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-soft text-[#7A5527]">
                <c.icon size={20} strokeWidth={1.8} />
              </span>
              <div className="mt-6 text-[15px] font-semibold leading-tight">{c.title}</div>
              <div className="mt-1 text-xs text-ink-2">{c.sub}</div>
            </button>
          ))}
        </div>

        {/* recent operations */}
        <SectionTitle
          action={
            <button onClick={() => nav('/operations')} className="flex items-center text-sm font-medium text-ink-2">
              Все <ChevronRight size={16} />
            </button>
          }
        >
          Последние операции
        </SectionTitle>
        {recent.length ? (
          <List>
            {recent.map((o) => (
              <ListRow
                key={o.id}
                icon={o.type === 'topup' ? ArrowDownLeft : o.type === 'purchase' ? Coffee : o.type === 'cashback' ? Sparkles : o.asset === 'usdt' ? Repeat : Coins}
                tone={o.type === 'buy' || o.type === 'cashback' ? 'gold' : 'grey'}
                title={o.title}
                sub={new Date(o.at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                value={o.kzt ? `${o.kzt > 0 ? '+' : '−'}${formatKzt(Math.abs(o.kzt), 0)}` : `${o.grams > 0 ? '+' : '−'}${formatNum(Math.abs(o.grams), 4)} ${o.asset === 'usdt' ? 'USDT' : 'г'}`}
              />
            ))}
          </List>
        ) : (
          <div className="rounded-2xl bg-white p-4 text-sm text-ink-2">Пока операций нет — начни с покупки золота от 1000 ₸.</div>
        )}
      </div>
    </TabPage>
  )
}
