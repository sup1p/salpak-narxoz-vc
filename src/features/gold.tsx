import { ArrowUpRight, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BAR, PRICE_HISTORY } from '../data/seed'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { quoteBuy } from '../domain/pricing'
import { useBank } from '../store/useBank'
import { GoldCapsule, goldRender, PriceLine } from '../ui/gold'
import { Badge, Button, Header, Row, Screen, SectionTitle } from '../ui/ui'

/** Gold page (DESIGN-SYSTEM §13): photo card, amount, stages, buy/sell, price, custody. */
export function Gold() {
  const nav = useNavigate()
  const s = useBank()
  const value = s.gold * s.market
  const cost = s.gold * s.avgPrice
  const diff = value - cost
  const pct = cost ? (diff / cost) * 100 : 0
  const history = [...PRICE_HISTORY.slice(0, -1), s.market]
  const share = (s.gold / BAR.weight) * 100
  const buyPrice = quoteBuy(1000, s.market, 0).price
  const stage = goldRender(s.gold).label
  const stages = [
    { label: 'щепотка', title: 'Щепотка', hint: 'до 0,1 г', src: '/gold/pinch.jpg' },
    { label: 'горка', title: 'Горка', hint: '0,1–1 г', src: '/gold/pile.jpg' },
    { label: 'слиток', title: 'Слиток', hint: 'от 1 г', src: '/gold/bar.jpg' },
  ]

  return (
    <Screen>
      <Header title="Золото" />
      <div className="px-4 pb-8">
        {/* photo card */}
        <div className="rounded-2xl bg-surface px-4 pb-4 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-2">Токен золота · проба {BAR.fineness}</span>
            <Badge tone="green">Аудит пройден</Badge>
          </div>
          <div className="mt-1 flex justify-center">
            <GoldCapsule grams={s.gold} height={160} />
          </div>
          <div className="mt-1 flex items-end justify-between">
            <div>
              <div className="num text-[30px] font-bold leading-none tracking-[-0.02em]">{formatGrams(s.gold)}</div>
              <div className="num mt-1 text-sm text-ink-2">≈ {formatKzt(value, 0)}</div>
            </div>
            <div className="text-right">
              <div className="num text-[17px] font-semibold">{formatNum(s.market, 0)} ₸/г</div>
              <div className="text-xs text-ink-2">Цена рынка</div>
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <Button variant="gold" onClick={() => nav('/buy')}>
            Купить · {formatNum(buyPrice, 0)} ₸/г
          </Button>
          <Button variant="secondary" className="!w-auto px-5" disabled={s.gold <= 0} onClick={() => nav('/sell')}>
            <ArrowUpRight size={18} /> Продать
          </Button>
        </div>
        <div className="mt-1.5 text-xs text-ink-3">Цена покупки — с учётом спреда 0,5%</div>

        {/* stages */}
        <SectionTitle action={<span className="num text-sm text-ink-2">до слитка {formatGrams(Math.max(0, 1 - s.gold), 2)}</span>}>Твоя стадия</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {stages.map((st) => (
            <div key={st.label} className={`rounded-xl p-2 text-center ${st.label === stage ? 'bg-gold-soft' : 'bg-surface'}`}>
              <img src={st.src} alt="" className="gold-img mx-auto h-10 w-full object-cover" />
              <div className="mt-1 text-[13px] font-semibold">{st.title}</div>
              <div className="text-[11px] text-ink-2">{st.hint}</div>
            </div>
          ))}
        </div>

        {/* price */}
        <SectionTitle>Цена покупки и сейчас</SectionTitle>
        <div className="rounded-2xl bg-surface px-4 py-1">
          <Row label="Средняя цена покупки" value={`${formatNum(s.avgPrice, 0)} ₸/г`} />
          <Row label="Сейчас на рынке" value={`${formatNum(s.market, 0)} ₸/г`} />
          <Row label="Изменение стоимости" value={`${pct >= 0 ? '+' : ''}${formatNum(pct, 1)}% (${diff >= 0 ? '+' : '−'}${formatNum(Math.abs(diff), 0)} ₸)`} strong />
        </div>
        <div className="mt-2 rounded-2xl bg-surface p-4">
          <div className="mb-1 flex justify-between text-xs text-ink-2">
            <span>Цена золота за 30 дней</span>
            <span className="num">{formatNum(s.market, 0)} ₸/г</span>
          </div>
          <PriceLine data={history} />
        </div>
        <p className="mt-2 text-xs text-ink-3">Прошлое изменение цены не гарантирует будущего. Цена может как расти, так и снижаться.</p>

        {/* custody */}
        <SectionTitle>Где лежит твоё золото</SectionTitle>
        <div className="flex items-center gap-4 rounded-2xl bg-surface p-4">
          <img src="/gold/bar.jpg" alt="Слиток 1 кг" className="gold-img h-14 w-20 object-cover" />
          <div className="flex-1">
            <div className="text-sm text-ink-2">Твоя доля в слитке</div>
            <div className="num text-[17px] font-semibold">{formatNum(share, 5)}%</div>
            <div className="num text-xs text-ink-3">
              {formatGrams(s.gold)} из {BAR.weight} г
            </div>
          </div>
        </div>
        <div className="mt-2 rounded-2xl bg-surface px-4 py-1">
          <Row label="Номер слитка" value={BAR.id} />
          <Row label="Проба" value={BAR.fineness} />
          <Row label="Хранитель" value={BAR.custodian} onLabel={() => nav('/academy/custody')} />
          <Row label="Последний аудит" value={BAR.audit} />
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-ink-3">
          <Info size={12} /> Хранитель и аудит — тестовые данные прототипа
        </p>
      </div>
    </Screen>
  )
}
