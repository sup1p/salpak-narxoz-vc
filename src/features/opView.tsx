import { ArrowDownLeft, ArrowUpRight, Bus, Coins, Gift, GraduationCap, Home as HomeIcon, QrCode, Repeat, Smartphone, Sparkles, Wifi, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatKzt, formatNum } from '../domain/money'
import { useBank, type Op } from '../store/useBank'
import { Button, Row } from '../ui/ui'
import { ReceiptView } from './trade'

/** One place that knows how to present an operation (icons, amounts, details). Used by Сообщения and Операции. */
const CATEGORY_ICON: Record<string, LucideIcon> = { qr: QrCode, mobile: Smartphone, internet: Wifi, utilities: HomeIcon, transport: Bus, education: GraduationCap }

export function opIcon(o: Op): { icon: LucideIcon; tone: 'grey' | 'gold' | 'green' } {
  if (o.type === 'purchase') return { icon: CATEGORY_ICON[o.category ?? 'qr'] ?? QrCode, tone: 'grey' }
  if (o.type === 'topup') return { icon: ArrowDownLeft, tone: 'green' }
  if (o.type === 'cashback') return { icon: Sparkles, tone: 'gold' }
  if (o.type === 'bonus' || o.type === 'gift_out') return { icon: Gift, tone: 'green' }
  if (o.asset === 'usdt') return { icon: Repeat, tone: 'grey' }
  if (o.type === 'sell') return { icon: ArrowUpRight, tone: 'grey' }
  return { icon: Coins, tone: 'gold' }
}

const units = (o: Op, v: number) => (o.asset === 'usdt' ? `${formatNum(Math.abs(v), 2)} USDT` : `${formatNum(Math.abs(v), 4)} г`)

/** Main and secondary amount lines, signed. */
export function opAmounts(o: Op): [string, string?] {
  const kzt = o.kzt ? `${o.kzt > 0 ? '+' : '−'}${formatKzt(Math.abs(o.kzt), 0)}` : undefined
  const g = o.grams ? `${o.grams > 0 ? '+' : '−'}${units(o, o.grams)}` : undefined
  if (o.type === 'purchase') {
    const cb = o.cbGrams ? `кешбэк +${formatNum(o.cbGrams, 4)} г` : o.cbKzt ? `кешбэк +${formatKzt(o.cbKzt, 0)}` : undefined
    return [kzt ?? '', cb]
  }
  if (kzt && g) return [kzt, g]
  return [kzt ?? g ?? '']
}

export const OP_TYPE: Record<Op['type'], string> = {
  purchase: 'Платёж',
  topup: 'Пополнение',
  buy: 'Покупка',
  sell: 'Продажа',
  cashback: 'Кешбэк',
  bonus: 'Бонус за друга',
  gift_out: 'Подарок',
}

/** Full details of one operation — what a bank shows when you open a notification. */
export function OpDetail({ op, onClose }: { op: Op; onClose: () => void }) {
  const nav = useNavigate()
  const history = useBank((s) => s.history)
  const { icon: Icon, tone } = opIcon(op)
  const [main, second] = opAmounts(op)
  const parent = op.parentId ? history.find((h) => h.id === op.parentId) : undefined
  const child = history.find((h) => h.parentId === op.id)
  const [what, who] = op.title.includes(' · ') ? op.title.split(' · ') : [op.title, undefined]
  const tones = { grey: 'bg-surface text-ink', gold: 'bg-gold-soft text-[#7A4A00]', green: 'bg-mint text-[#00663F]' }
  const go = (to: string) => {
    onClose()
    nav(to)
  }

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <span className={`grid h-14 w-14 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={26} strokeWidth={1.8} />
        </span>
        <div className="mt-2 text-sm text-ink-2">{OP_TYPE[op.type]}</div>
        <div className="num mt-1 text-[30px] font-extrabold tracking-[-0.02em]">{main}</div>
        {second && <div className="num text-sm font-medium text-[#7A4A00]">{second}</div>}
      </div>

      <div className="mt-4 rounded-2xl bg-surface px-4 py-1">
        <Row label="Операция" value={what} />
        {who && <Row label={op.type === 'purchase' ? 'Получатель' : 'Источник'} value={who} />}
        {op.type === 'topup' && <Row label="Откуда" value={op.title.replace('Пополнение ', '').replace(/^с /, '').replace(/^со /, '') || 'Тест'} />}
        <Row label="Дата и время" value={new Date(op.at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} />
        {['purchase', 'topup', 'buy', 'sell'].includes(op.type) && <Row label="Карта" value="GRAM •• 2026" />}
        {op.type === 'purchase' && <Row label="Комиссия" value="0 ₸" />}
        {op.type === 'purchase' && <Row label="Кешбэк" value={op.cbGrams ? `+${formatNum(op.cbGrams, 4)} г золота` : op.cbKzt ? `+${formatKzt(op.cbKzt, 0)}` : 'Не начислен (лимит)'} />}
        {parent && <Row label="За платёж" value={`${parent.title.split(' · ')[0]} · ${formatKzt(-parent.kzt, 0)}`} />}
        {op.type === 'bonus' && <Row label="Налог" value="Удержит банк (гипотеза)" />}
        <Row label="Статус" value="Успешно" />
      </div>

      {op.receipt && (
        <div className="mt-3 rounded-2xl bg-surface px-4 py-2">
          <div className="pt-1 text-sm font-semibold">Рентген цены</div>
          <ReceiptView r={op.receipt} onTerm={(id) => go(`/academy/${id}`)} />
        </div>
      )}
      {child && <div className="mt-2 text-center text-xs text-ink-2">Кешбэк за этот платёж пришёл отдельным сообщением</div>}

      <div className="mt-4 grid gap-2">
        {(op.type === 'buy' || op.type === 'sell') && op.asset !== 'usdt' && (
          <Button variant="secondary" onClick={() => go('/gold')}>
            Открыть золото
          </Button>
        )}
        {op.type === 'cashback' && (
          <Button variant="secondary" onClick={() => go('/cashback')}>
            Мой кешбэк
          </Button>
        )}
        <Button onClick={onClose}>Закрыть</Button>
      </div>
    </div>
  )
}
