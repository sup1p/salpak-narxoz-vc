import { ArrowDownLeft, BookOpen, Coins, FileText, Hand, Landmark, PiggyBank, Receipt, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBank, type BankState, type Op } from '../store/useBank'
import { Button, Header, PageTitle, Screen, Sheet, TabPage } from '../ui/ui'
import { OpDetail, opAmounts, opIcon } from './opView'

/**
 * «Сообщения» (US-16.1, Kaspi-style since 2026-11-07): the tab lists topics vertically;
 * a topic opens its own scroll of messages; tapping a message opens it in place (a sheet).
 */
type Topic = 'payments' | 'topups' | 'cashback' | 'gold' | 'savings' | 'bank'
export const TOPICS: { id: Topic; label: string; icon: LucideIcon; tone: 'grey' | 'gold' | 'green' }[] = [
  { id: 'payments', label: 'Платежи', icon: Receipt, tone: 'grey' },
  { id: 'topups', label: 'Пополнения', icon: ArrowDownLeft, tone: 'green' },
  { id: 'cashback', label: 'Кешбэк и бонусы', icon: Sparkles, tone: 'gold' },
  { id: 'gold', label: 'Золото и USDT', icon: Coins, tone: 'gold' },
  { id: 'savings', label: 'Сбережения', icon: PiggyBank, tone: 'green' },
  { id: 'bank', label: 'GRAM · от банка', icon: Hand, tone: 'grey' },
]

interface Msg {
  id: string
  at: number
  topic: Topic
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
  o.type === 'purchase'
    ? 'payments'
    : o.type === 'topup'
      ? 'topups'
      : o.type === 'cashback' || o.type === 'bonus'
        ? 'cashback'
        : o.type === 'interest' || o.type === 'transfer'
          ? 'savings'
          : 'gold'

const opText = (o: Op) => {
  const [, second] = opAmounts(o)
  if (o.type === 'purchase') return `${o.title.split(' · ')[1] ?? o.title}${second ? ` · ${second}` : ''}`
  if (o.type === 'topup') return 'Зачислено на карту GRAM'
  if (o.type === 'cashback') return o.asset === 'gold' ? 'Начислено золотом за покупку картой' : 'Вернули на карту за покупку'
  if (o.type === 'bonus') return o.title.replace('Бонус: ', '')
  if (o.type === 'interest') return o.asset === 'gold' ? 'Начислено граммами по цене рынка' : 'Добавлено к сбережениям · 14% годовых'
  if (o.type === 'transfer') return o.kzt < 0 ? 'С карты GRAM на сбережения' : 'Со сбережений на карту GRAM'
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

const isUnread = (s: BankState, m: Msg) => m.at > Math.max(s.messagesReadAt, s.topicReadAt?.[m.topic] ?? 0)

export function useUnreadCount() {
  const s = useBank()
  return useMemo(() => buildMessages(s).filter((m) => isUnread(s, m)).length, [s])
}

const when = (t: number) => {
  const d = new Date(t)
  const same = d.toDateString() === new Date().toDateString()
  return same ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
const dayLabel = (t: number) => {
  const d = new Date(t)
  if (d.toDateString() === new Date().toDateString()) return 'Сегодня'
  if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}
const TONES = { grey: 'bg-surface text-ink', gold: 'bg-gold-soft text-[#7A4A00]', green: 'bg-mint text-[#00663F]' }

/** «Сообщения» tab (Kaspi-style): one row per topic, newest first; a topic opens its own feed. */
export function Messages() {
  const nav = useNavigate()
  const s = useBank()
  const all = useMemo(() => buildMessages(s), [s])
  const rows = TOPICS.map((t) => {
    const msgs = all.filter((m) => m.topic === t.id)
    return { ...t, last: msgs[0], unread: msgs.filter((m) => isUnread(s, m)).length }
  }).sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0))

  return (
    <TabPage>
      <PageTitle>Сообщения</PageTitle>
      <div className="px-4">
        {rows.map((t) => (
          <button key={t.id} onClick={() => nav(`/messages/${t.id}`)} className="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-0 active:opacity-80">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${TONES[t.tone]}`}>
              <t.icon size={22} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="truncate text-[16px] font-semibold">{t.label}</div>
                {t.last && <span className="shrink-0 text-xs text-ink-3">{when(t.last.at)}</span>}
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="truncate text-[13px] text-ink-2">{t.last ? `${t.last.title}${t.last.amount ? ` · ${t.last.amount}` : ''}` : 'Пока нет сообщений'}</p>
                {t.unread > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-err px-1.5 text-[11px] font-bold text-white">{t.unread}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </TabPage>
  )
}

/** One topic's feed: scroll of its messages by day; tapping opens the message itself in a sheet. */
export function MessageTopic() {
  const nav = useNavigate()
  const { topic } = useParams()
  const s = useBank()
  const t = TOPICS.find((x) => x.id === topic) ?? TOPICS[0]
  const [open, setOpen] = useState<Msg | null>(null)
  const msgs = useMemo(() => buildMessages(s).filter((m) => m.topic === t.id), [s, t.id])
  // capture the read mark on entry so new ones keep their dot while you look
  const readAt = useMemo(() => Math.max(s.messagesReadAt, s.topicReadAt?.[t.id] ?? 0), [t.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setTimeout(() => useBank.getState().markTopicRead(t.id), 800)
    return () => clearTimeout(id)
  }, [t.id])
  const groups: [string, Msg[]][] = []
  for (const m of msgs) {
    const k = dayLabel(m.at)
    const g = groups.find((x) => x[0] === k)
    if (g) g[1].push(m)
    else groups.push([k, [m]])
  }

  return (
    <Screen>
      <Header title={t.label} />
      <div className="px-4 pb-8">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className={`grid h-14 w-14 place-items-center rounded-full ${TONES[t.tone]}`}>
              <t.icon size={24} strokeWidth={1.8} />
            </span>
            <p className="mt-3 text-sm text-ink-2">Здесь пока пусто. Сообщения появятся после первой операции.</p>
          </div>
        )}
        {groups.map(([day, list]) => (
          <div key={day}>
            <div className="pb-2 pt-4 text-[13px] font-semibold text-ink-2">{day}</div>
            <div className="space-y-2">
              {list.map((m) => (
                <button key={m.id} onClick={() => setOpen(m)} className="flex w-full items-start gap-3 rounded-2xl bg-surface p-4 text-left active:opacity-80">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${TONES[m.tone]} ${m.tone === 'grey' ? '!bg-white' : ''}`}>
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
          </div>
        ))}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open?.op ? (
          <OpDetail op={open.op} onClose={() => setOpen(null)} />
        ) : (
          open && (
            <div>
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-full ${TONES[open.tone]}`}>
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
    </Screen>
  )
}
