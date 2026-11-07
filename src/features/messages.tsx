import { BookOpen, FileText, Hand, Landmark, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBank, type BankState, type Op } from '../store/useBank'
import { Button, PageTitle, Sheet, TabPage } from '../ui/ui'
import { OpDetail, opAmounts, opIcon } from './opView'

/**
 * «Сообщения» (US-16.1): every money movement + service messages, split into topics.
 * Tapping a message opens the message itself (a sheet), never another section.
 */
type Topic = 'all' | 'payments' | 'topups' | 'cashback' | 'gold' | 'bank'
const TOPICS: { id: Topic; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'payments', label: 'Платежи' },
  { id: 'topups', label: 'Пополнения' },
  { id: 'cashback', label: 'Кешбэк' },
  { id: 'gold', label: 'Золото и USDT' },
  { id: 'bank', label: 'От банка' },
]

interface Msg {
  id: string
  at: number
  topic: Exclude<Topic, 'all'>
  icon: LucideIcon
  tone: 'grey' | 'gold' | 'green'
  title: string
  text: string
  amount?: string
  op?: Op
  action?: { label: string; to: string }
}

const DAY = 86400000

const opTopic = (o: Op): Msg['topic'] =>
  o.type === 'purchase' ? 'payments' : o.type === 'topup' ? 'topups' : o.type === 'cashback' || o.type === 'bonus' ? 'cashback' : 'gold'

const opText = (o: Op) => {
  const [, second] = opAmounts(o)
  if (o.type === 'purchase') return `${o.title.split(' · ')[1] ?? o.title}${second ? ` · ${second}` : ''}`
  if (o.type === 'topup') return 'Зачислено на карту GRAM'
  if (o.type === 'cashback') return o.asset === 'gold' ? 'Начислено золотом за покупку картой' : 'Вернули на карту за покупку'
  if (o.type === 'bonus') return o.title.replace('Бонус: ', '')
  if (o.receipt) return `По цене ${o.receipt.price.toLocaleString('ru-RU')} ₸ · внутри Рентген цены`
  return ''
}

export function buildMessages(s: BankState): Msg[] {
  const out: Msg[] = s.history.map((o) => {
    const { icon, tone } = opIcon(o)
    return {
      id: o.id,
      at: o.at,
      topic: opTopic(o),
      icon,
      tone,
      title: o.type === 'purchase' ? o.title.split(' · ')[0] : o.title,
      text: opText(o),
      amount: opAmounts(o)[0],
      op: o,
    }
  })
  out.push({
    id: 'welcome',
    at: s.installedAt,
    topic: 'bank',
    icon: Hand,
    tone: 'grey',
    title: 'Добро пожаловать в GRAM',
    text: 'На карте 50 000 ₸ тестовых денег. Первую покупку золота можно сделать понарошку — в режиме Пробы.',
    action: { label: 'Купить золото', to: '/buy?try=1' },
  })
  for (const b of s.bankLinks)
    out.push({ id: b.id, at: b.connectedAt, topic: 'bank', icon: Landmark, tone: 'grey', title: `Подключён счёт: ${b.bank}`, text: 'Баланс виден в общей сумме. Только просмотр — отозвать можно в любой момент.', action: { label: 'Счета других банков', to: '/banks' } })
  const risk = s.events.find((e) => e.name === 'risk_test_passed')
  if (risk) out.push({ id: 'risk', at: risk.at, topic: 'bank', icon: ShieldCheck, tone: 'green', title: 'Тест на понимание рисков пройден', text: 'Обмен ₸ ↔ USDT и партнёры МФЦА доступны.' })
  const firstBuy = s.events.find((e) => e.name === 'first_purchase')
  if (firstBuy && !s.lessonsDone.includes('spread'))
    out.push({ id: 'tip-spread', at: firstBuy.at + 1000, topic: 'bank', icon: BookOpen, tone: 'grey', title: 'Сколько ты заплатил(а) сверх рынка?', text: 'Урок на 2 минуты по твоему чеку.', action: { label: 'Открыть урок', to: '/academy/spread' } })
  if (s.gold > 0 && firstBuy) {
    const now = new Date()
    const deadline = new Date(now.getFullYear() + (now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() > 15) ? 1 : 0), 8, 15)
    out.push({ id: 'tax', at: firstBuy.at + 2000, topic: 'bank', icon: FileText, tone: 'grey', title: 'Декларация — подготовим за тебя', text: `Золото — актив, его нужно отразить в декларации до 15 сентября (через ${Math.ceil((deadline.getTime() - now.getTime()) / DAY)} дн.). Данные уже собираем.`, action: { label: 'Налоги и декларация', to: '/tax' } })
  }
  return out.sort((a, b) => b.at - a.at)
}

export function useUnreadCount() {
  const s = useBank()
  return useMemo(() => buildMessages(s).filter((m) => m.at > s.messagesReadAt).length, [s])
}

const when = (t: number) => {
  const d = new Date(t)
  const same = d.toDateString() === new Date().toDateString()
  return same ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function Messages() {
  const nav = useNavigate()
  const s = useBank()
  const [topic, setTopic] = useState<Topic>('all')
  const [open, setOpen] = useState<Msg | null>(null)
  const all = useMemo(() => buildMessages(s), [s])
  const msgs = topic === 'all' ? all : all.filter((m) => m.topic === topic)
  const readAt = useMemo(() => s.messagesReadAt, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => useBank.getState().markMessagesRead(), 800)
    return () => clearTimeout(t)
  }, [])
  const tones = { grey: 'bg-white text-ink', gold: 'bg-gold-soft text-[#7A4A00]', green: 'bg-mint text-[#00663F]' }
  const count = (t: Topic) => (t === 'all' ? all.length : all.filter((m) => m.topic === t).length)

  return (
    <TabPage>
      <PageTitle>Сообщения</PageTitle>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {TOPICS.map((t) => (
          <button key={t.id} onClick={() => setTopic(t.id)} className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${topic === t.id ? 'bg-ink text-white' : 'bg-surface text-ink'}`}>
            {t.label} <span className={topic === t.id ? 'text-white/60' : 'text-ink-3'}>{count(t.id)}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2 px-4">
        {msgs.length === 0 && <div className="py-10 text-center text-sm text-ink-2">Здесь пока пусто</div>}
        {msgs.map((m) => (
          <button key={m.id} onClick={() => setOpen(m)} className="flex w-full items-start gap-3 rounded-2xl bg-surface p-4 text-left active:opacity-80">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tones[m.tone]}`}>
              <m.icon size={20} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="truncate text-[15px] font-semibold">{m.title}</div>
                {m.amount && <div className={`num shrink-0 text-[15px] font-semibold ${m.amount.startsWith('+') ? 'text-[#00663F]' : ''}`}>{m.amount}</div>}
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-2">
                <p className="line-clamp-2 text-[13px] leading-snug text-ink-2">{m.text}</p>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-3">
                  {m.at > readAt && <span className="h-2 w-2 rounded-full bg-err" aria-label="Новое" />}
                  {when(m.at)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open?.op ? (
          <OpDetail op={open.op} onClose={() => setOpen(null)} />
        ) : (
          open && (
            <div>
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-full ${tones[open.tone]} ${open.tone === 'grey' ? '!bg-surface' : ''}`}>
                  <open.icon size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="text-xs text-ink-2">От банка · {when(open.at)}</div>
                  <div className="text-[17px] font-bold leading-tight">{open.title}</div>
                </div>
              </div>
              <p className="mt-4 rounded-2xl bg-surface p-4 text-[15px] leading-snug">{open.text}</p>
              <div className="mt-4 grid gap-2">
                {open.action && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const to = open.action!.to
                      setOpen(null)
                      nav(to)
                    }}
                  >
                    {open.action.label}
                  </Button>
                )}
                <Button onClick={() => setOpen(null)}>Закрыть</Button>
              </div>
            </div>
          )
        )}
      </Sheet>
    </TabPage>
  )
}
