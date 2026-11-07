import { Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BAR, PRICE_HISTORY } from '../data/seed'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { useBank } from '../store/useBank'
import { BarKeychain, GoldCapsule, PriceLine, Sticker } from '../ui/gold'
import { Button, Card, Row } from '../ui/ui'

export function Gold() {
  const nav = useNavigate()
  const s = useBank()
  const value = s.gold * s.market
  const cost = s.gold * s.avgPrice
  const diff = value - cost
  const pct = cost ? (diff / cost) * 100 : 0
  const history = [...PRICE_HISTORY.slice(0, -1), s.market]
  const share = (s.gold / BAR.weight) * 100

  return (
    <div className="px-5 pb-28 pt-6">
      <h1 className="text-[28px] font-bold">Золото</h1>

      <Card className="mt-4 flex items-center justify-between bg-white shadow-[0_0_0_1px_#E7E7EB]">
        <div>
          <div className="text-sm text-ink-2">У тебя</div>
          <div className="num mt-1 text-[34px] font-bold leading-none">{formatGrams(s.gold)}</div>
          <div className="num mt-1 text-sm text-ink-2">≈ {formatKzt(value, 0)}</div>
          <div className="mt-2 text-[11px] text-ink-3">1 токен = 1 г золота пробы {BAR.fineness}</div>
        </div>
        <GoldCapsule grams={s.gold} height={130} />
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="gold" onClick={() => nav('/buy')}>
          Купить
        </Button>
        <Button variant="secondary" onClick={() => nav('/sell')} disabled={s.gold <= 0}>
          Продать
        </Button>
      </div>

      {/* Purchase price vs current (TЗ: понимание цены покупки и изменения стоимости) */}
      <Card className="mt-4">
        <div className="text-sm font-semibold">Цена покупки и сейчас</div>
        <Row label="Ты покупал(а) в среднем по" value={`${formatNum(s.avgPrice, 0)} ₸/г`} />
        <Row label="Сейчас на рынке" value={`${formatNum(s.market, 0)} ₸/г`} />
        <Row
          label="Изменение стоимости"
          value={`${pct >= 0 ? '+' : ''}${formatNum(pct, 1)}% (${diff >= 0 ? '+' : '−'}${formatNum(Math.abs(diff), 0)} ₸)`}
          strong
        />
        <div className="mt-3 rounded-2xl bg-white p-3">
          <div className="mb-1 flex justify-between text-[11px] text-ink-3">
            <span>Цена золота · 30 дней</span>
            <span className="num">{formatNum(s.market, 0)} ₸/г</span>
          </div>
          <PriceLine data={history} />
        </div>
        <p className="mt-2 text-[11px] text-ink-3">Прошлое изменение цены не гарантирует будущего. Цена может как расти, так и снижаться.</p>
      </Card>

      {/* Custody transparency */}
      <Card className="mt-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">Где лежит твоё золото</div>
            <div className="mt-1 text-xs text-ink-2">Твоя доля в настоящем слитке</div>
          </div>
          <Sticker bg="#00AB75" rotate={6} className="text-xs">
            аудит ✓
          </Sticker>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <BarKeychain size={70} />
          <div className="flex-1">
            <div className="num text-xs text-ink-2">Твоя доля в слитке</div>
            <div className="num text-lg font-bold">{formatNum(share, 5)}%</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="gold-grad h-full" style={{ width: `${Math.max(1.5, share)}%` }} />
            </div>
            <div className="num mt-1 text-[11px] text-ink-3">
              {formatGrams(s.gold)} из {BAR.weight} г
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Row label="Номер слитка" value={BAR.id} />
          <Row label="Проба" value={BAR.fineness} />
          <Row label="Хранитель" value={BAR.custodian} onLabel={() => nav('/academy/custody')} />
          <Row label="Последний аудит" value={BAR.audit} />
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-3">
          <Info size={12} /> Хранитель и аудит — тестовые данные прототипа
        </p>
      </Card>

      <button onClick={() => nav('/history')} className="mt-3 mb-4 h-12 w-full rounded-full text-sm font-semibold underline underline-offset-4">
        История операций
      </button>
    </div>
  )
}
