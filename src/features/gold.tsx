import { ArrowUpRight, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BAR, PRICE_HISTORY } from '../data/seed'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { quoteBuy } from '../domain/pricing'
import { useBank } from '../store/useBank'
import { GoldCapsule, goldRender, PriceLine, Sticker } from '../ui/gold'
import { Button, Row } from '../ui/ui'

/** Gold as a "product page" (§12, Gold Apple-style): photo on grey, overline, big price, square chips. */
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
    { label: 'щепотка', hint: 'до 0,1 г', src: '/gold/pinch.jpg' },
    { label: 'горка', hint: '0,1–1 г', src: '/gold/pile.jpg' },
    { label: 'слиток', hint: 'от 1 г', src: '/gold/bar.jpg' },
  ]

  return (
    <div className="pb-28">
      {/* photo block */}
      <div className="relative bg-surface px-5 pb-4 pt-6">
        <div className="eyebrow">токен золота · проба {BAR.fineness}</div>
        <h1 className="mt-1 text-[28px] font-extrabold lowercase leading-tight tracking-[-0.03em]">твоё золото</h1>
        <div className="mt-2 flex justify-center">
          <GoldCapsule grams={s.gold} height={180} />
        </div>
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
          {stages.map((st) => (
            <span key={st.label} className={`h-1.5 w-1.5 rounded-full ${st.label === stage ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="num text-[34px] font-extrabold leading-none tracking-[-0.03em]">{formatGrams(s.gold)}</div>
            <div className="num mt-1 text-sm text-ink-2">≈ {formatKzt(value, 0)}</div>
          </div>
          <div className="text-right">
            <div className="num text-[17px] font-bold">{formatNum(s.market, 0)} ₸/г</div>
            <div className="text-xs text-ink-3">цена рынка</div>
          </div>
        </div>

        {/* stage chips (like volume chips) */}
        <div className="eyebrow mt-5">стадия · {formatGrams(Math.max(0, 1 - s.gold), 2)} до слитка</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {stages.map((st) => (
            <div key={st.label} className={`rounded-[2px] p-2 text-center ${st.label === stage ? 'ring-1 ring-ink' : 'ring-1 ring-line'}`}>
              <img src={st.src} alt="" className="gold-img mx-auto h-10 w-full object-cover" />
              <div className="mt-1 text-[13px] font-semibold lowercase">{st.label}</div>
              <div className="text-[11px] text-ink-3">{st.hint}</div>
            </div>
          ))}
        </div>

        {/* buy / sell */}
        <div className="mt-5 flex gap-2">
          <Button onClick={() => nav('/buy')}>купить · {formatNum(buyPrice, 0)} ₸/г</Button>
          <Button variant="secondary" className="!w-[120px] shrink-0" disabled={s.gold <= 0} onClick={() => nav('/sell')}>
            <ArrowUpRight size={16} /> продать
          </Button>
        </div>
        <div className="mt-1.5 text-[11px] text-ink-3">цена покупки — с учётом спреда 0,5%</div>

        {/* price & change */}
        <div className="eyebrow mt-7">цена покупки и сейчас</div>
        <div className="mt-1 divide-y divide-line">
          <Row label="Ты покупал(а) в среднем по" value={`${formatNum(s.avgPrice, 0)} ₸/г`} />
          <Row label="Сейчас на рынке" value={`${formatNum(s.market, 0)} ₸/г`} />
          <Row label="Изменение стоимости" value={`${pct >= 0 ? '+' : ''}${formatNum(pct, 1)}% (${diff >= 0 ? '+' : '−'}${formatNum(Math.abs(diff), 0)} ₸)`} strong />
        </div>
        <div className="mt-3 bg-surface p-3">
          <div className="mb-1 flex justify-between text-[11px] text-ink-3">
            <span>цена золота · 30 дней</span>
            <span className="num">{formatNum(s.market, 0)} ₸/г</span>
          </div>
          <PriceLine data={history} />
        </div>
        <p className="mt-2 text-[11px] text-ink-3">Прошлое изменение цены не гарантирует будущего. Цена может как расти, так и снижаться.</p>

        {/* custody */}
        <div className="mt-7 flex items-center justify-between">
          <div className="eyebrow">где лежит твоё золото</div>
          <Sticker bg="#00AB75">аудит пройден</Sticker>
        </div>
        <div className="mt-3 flex items-center gap-4 bg-surface p-3">
          <img src="/gold/bar.jpg" alt="Слиток 1 кг" className="gold-img h-16 w-24 object-cover" />
          <div className="flex-1">
            <div className="text-xs text-ink-2">твоя доля в слитке</div>
            <div className="num text-lg font-bold">{formatNum(share, 5)}%</div>
            <div className="num text-[11px] text-ink-3">
              {formatGrams(s.gold)} из {BAR.weight} г
            </div>
          </div>
        </div>
        <div className="mt-1 divide-y divide-line">
          <Row label="Номер слитка" value={BAR.id} />
          <Row label="Проба" value={BAR.fineness} />
          <Row label="Хранитель" value={BAR.custodian} onLabel={() => nav('/academy/custody')} />
          <Row label="Последний аудит" value={BAR.audit} />
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-3">
          <Info size={12} /> Хранитель и аудит — тестовые данные прототипа
        </p>

        <button onClick={() => nav('/history')} className="mt-5 flex h-12 w-full items-center justify-between border-t border-line text-[15px] font-semibold lowercase">
          история операций <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}
