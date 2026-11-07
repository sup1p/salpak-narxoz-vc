import { ArrowDownLeft, ArrowRight, Landmark, Receipt, ScanLine, Bell, BookOpen, ChevronRight, Coffee, Coins, CreditCard, FileText, Gift, PiggyBank, Plus, Repeat, Sparkles, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PARTNER, USDT_KZT } from '../data/seed'
import { nextStatusGap, STATUS_LABEL } from '../domain/loyalty'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { hasRealBuy, selectCashbackStats, selectOtherBanksKzt, selectPortfolio, selectRegular, selectStatus, useBank } from '../store/useBank'
import { GoldCapsule } from '../ui/gold'
import { Badge, Balance, List, ListRow, Logo, SectionTitle, TabPage } from '../ui/ui'
import { useUnreadCount } from './messages'

function Action({ icon: Icon, label, onClick, gold }: { icon: LucideIcon; label: string; onClick: () => void; gold?: boolean }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <span className={`grid h-14 w-14 place-items-center rounded-full ${gold ? 'bg-gold text-ink' : 'bg-surface text-ink'}`}>
        <Icon size={24} strokeWidth={1.9} />
      </span>
      <span className="text-[13px] font-semibold">{label}</span>
    </button>
  )
}

/** «Главная» (DESIGN-SYSTEM §14): Gold Apple visual — white, heavy type, hero banner, saturated cards. */
export function Home() {
  const nav = useNavigate()
  const s = useBank()
  const unread = useUnreadCount()
  const portfolio = selectPortfolio(s)
  const status = selectStatus(s)
  const regular = selectRegular(s)
  const gap = nextStatusGap(portfolio, regular)
  const partnerKzt = s.partnerConnected ? PARTNER.usdt * USDT_KZT : 0
  const otherBanks = selectOtherBanksKzt(s)
  const total = portfolio + partnerKzt + otherBanks
  const bought = hasRealBuy(s)
  const cb = selectCashbackStats(s)
  const buyTo = bought ? '/buy' : '/buy?try=1'




  const forYou: { icon: LucideIcon; title: string; sub: string; to: string; bg: string }[] = [
    !bought
      ? { icon: Coins, title: 'Первая покупка без риска', sub: 'Режим Пробы', to: '/buy?try=1', bg: 'bg-lime' }
      : s.cashbackMode !== 'gold'
        ? { icon: Sparkles, title: 'Кешбэк в граммах', sub: 'Покупки картой → золото', to: '/cashback', bg: 'bg-lime' }
        : { icon: Gift, title: 'Позови друга', sub: '+0,05 г вам обоим', to: '/invite', bg: 'bg-lime' },
    { icon: BookOpen, title: s.lessonsDone.includes('spread') ? 'Академия' : 'Спред за 2 минуты', sub: `${s.lessonsDone.length} из 7 уроков`, to: s.lessonsDone.includes('spread') ? '/academy' : '/academy/spread', bg: 'bg-lilac' },
    { icon: FileText, title: 'Декларация', sub: 'Подготовим за тебя', to: '/tax', bg: 'bg-peach' },
  ]

  const recent = s.history.filter((o) => o.id !== 'seed-cb').slice(0, 3)

  return (
    <TabPage>

      {/* header */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <div className="leading-tight">
            <div className="text-[19px] font-extrabold tracking-[-0.02em]">GRAM</div>
            <div className="text-[11px] font-semibold text-green">by BCC</div>
          </div>
        </div>
        <div className="flex gap-2">
        <button aria-label="Сканировать QR" onClick={() => nav('/scan')} className="grid h-10 w-10 place-items-center rounded-full bg-surface">
          <ScanLine size={20} strokeWidth={1.9} />
        </button>
        <button aria-label="Сообщения" onClick={() => nav('/messages')} className="relative grid h-10 w-10 place-items-center rounded-full bg-surface">
          <Bell size={20} strokeWidth={1.9} />
          {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-err" />}
        </button>
        </div>
      </div>

      <div className="px-4">
        {/* total — no card, big heavy type */}
        <div data-tour="total" className="pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-ink-2">Всего</div>
            <Badge tone="gold">
              {STATUS_LABEL[status]} · кешбэк {status === 'sand' ? '1' : status === 'nugget' ? '1,5' : '2'}%
            </Badge>
          </div>
          <Balance value={total} className="mt-1 text-[42px] font-extrabold tracking-[-0.04em]" />
          <div className="num mt-1 text-xs text-ink-3">≈ {formatGrams(total / s.market, 2)} золота — эквивалент, не золото</div>
        </div>

        <div data-tour="actions" className="mt-5 grid grid-cols-3">
          <Action icon={ArrowDownLeft} label="Пополнить" onClick={() => nav('/topup')} />
          <Action icon={Receipt} label="Платежи" onClick={() => nav('/payments')} />
          <Action icon={Plus} label="Купить золото" gold onClick={() => nav(buyTo)} />
        </div>

        {/* hero banner: your gold */}
        <div data-tour="gold" className="relative mt-6 overflow-hidden rounded-3xl bg-gold-soft">
          <div className="absolute -right-6 top-6">
            <GoldCapsule grams={s.gold} height={140} />
          </div>
          <div className="relative p-5">
            <div className="text-[13px] font-semibold text-[#7A4A00]">Твоё золото · проба 999,9</div>
            <div className="num mt-2 text-[34px] font-extrabold leading-none tracking-[-0.03em]">{formatGrams(s.gold)}</div>
            <div className="num mt-1 text-sm font-medium text-[#5C3A00]">≈ {formatKzt(s.gold * s.market, 0)}</div>
            {s.gold < 1 && (
              <div className="mt-4 w-[55%]">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(3, s.gold * 100)}%` }} />
                </div>
                <div className="num mt-1.5 text-xs font-medium text-[#5C3A00]">До первого грамма — {formatGrams(1 - s.gold, 2)}</div>
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <button onClick={() => nav('/gold')} className="flex h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white">
                Перейти к золоту <ArrowRight size={16} />
              </button>
              <button onClick={() => nav(buyTo)} className="h-11 rounded-xl bg-white px-4 text-sm font-semibold">
                Купить
              </button>
            </div>
          </div>
        </div>

        {/* for you — saturated cards like Gold Apple category colours */}
        <SectionTitle>Для тебя</SectionTitle>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {forYou.map((c) => (
            <button key={c.title} onClick={() => nav(c.to)} className={`flex h-[148px] w-[160px] shrink-0 flex-col justify-between rounded-3xl p-4 text-left ${c.bg}`}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/70">
                <c.icon size={20} strokeWidth={1.9} />
              </span>
              <div>
                <div className="text-[16px] font-extrabold leading-tight tracking-[-0.01em]">{c.title}</div>
                <div className="mt-1 text-xs font-medium text-ink/70">{c.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* accounts */}
        <SectionTitle>Счета</SectionTitle>
        <List>
          <ListRow icon={CreditCard} title="Карта GRAM" sub="•• 2026" value={formatKzt(s.cardKzt, 0)} />
          <ListRow icon={PiggyBank} title="Сбережения" sub="В тенге" value={formatKzt(s.savingsKzt, 0)} />
          {s.usdt > 0 && <ListRow icon={Repeat} title="USDT" sub="Хранение у кастодиана банка" value={`${formatNum(s.usdt, 2)} USDT`} valueSub={`≈ ${formatKzt(s.usdt * USDT_KZT, 0)}`} onClick={() => nav('/otc')} />}
          {s.bankLinks.map((b) => (
            <ListRow key={b.id} icon={Landmark} title={b.bank} sub="В другом банке · только просмотр" value={formatKzt(b.balanceKzt, 0)} onClick={() => nav('/banks')} />
          ))}
          {s.partnerConnected && <ListRow icon={Repeat} title={PARTNER.name} sub="Хранится у партнёра, не у банка" value={`${PARTNER.usdt} USDT`} valueSub={`≈ ${formatKzt(partnerKzt, 0)}`} onClick={() => nav('/partner')} />}
        </List>
        {s.bankLinks.length === 0 && (
          <button onClick={() => nav('/banks')} className="mt-1 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-left text-sm font-medium text-ink-2">
            <Landmark size={18} /> Подключить счёт в другом банке
          </button>
        )}

        {/* golden rain */}
        <button data-tour="loyalty" onClick={() => nav('/cashback')} className="mt-4 w-full rounded-3xl bg-ink p-5 text-left text-white">
          <div className="flex items-center justify-between">
            <div className="text-[17px] font-extrabold">Золотой дождь</div>
            <span className="text-xs text-white/60">{s.cashbackMode === 'gold' ? 'Кешбэк в золоте' : 'Кешбэк в тенге'}</span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-xs text-white/60">Кешбэк в этом месяце</div>
              <div className="num text-[22px] font-extrabold tracking-[-0.02em]">+{formatKzt(cb.monthTotalKzt, 0)}</div>
            </div>
            <div className="num text-right text-xs text-white/60">
              {cb.monthGrams > 0 && <div>{formatNum(cb.monthGrams, 4)} г золотом</div>}
              <div>лимит {formatKzt(cb.usedKzt, 0)} / {formatKzt(cb.capKzt, 0)}</div>
            </div>
          </div>
          {gap ? (
            <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (portfolio / (gap.next === 'nugget' ? 100000 : 500000)) * 100)}%` }} />
              </div>
              <div className="num mt-2 text-[13px] text-white/70">
                До статуса «{STATUS_LABEL[gap.next]}» — ещё {formatKzt(Math.max(0, gap.gapKzt), 0)}
                {gap.next === 'bar' && regular < 2 ? ' и пополнения 2 месяца подряд' : ''}
              </div>
            </>
          ) : (
            <div className="mt-2 text-[13px] text-white/70">Максимальный статус — кешбэк 2%</div>
          )}
        </button>

        {/* recent operations */}
        <SectionTitle
          action={
            <button onClick={() => nav('/operations')} className="flex items-center text-sm font-semibold text-ink-2">
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
          <div className="rounded-2xl bg-surface p-4 text-sm text-ink-2">Пока операций нет — начни с покупки золота от 1000 ₸.</div>
        )}
      </div>
    </TabPage>
  )
}
