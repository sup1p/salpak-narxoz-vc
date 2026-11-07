import { BookOpen, Coins, FileText, Gift, Hand, Repeat, Sparkles, Unlock, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatKzt, formatNum } from '../domain/money'
import { selectLevel, useBank, type BankState } from '../store/useBank'
import { PageTitle, TabPage } from '../ui/ui'

interface Msg {
  id: string
  at: number
  icon: LucideIcon
  tone: 'grey' | 'gold' | 'green'
  title: string
  text: string
  to?: string
}

const DAY = 86400000

/** Inbox built from real state (DESIGN-SYSTEM §13 «Сообщения»). */
export function buildMessages(s: BankState): Msg[] {
  const out: Msg[] = [
    { id: 'welcome', at: s.installedAt, icon: Hand, tone: 'grey', title: 'Добро пожаловать в Altyn', text: 'Мы положили 50 000 ₸ тестовых денег. Начни с покупки золота в режиме Пробы — без риска.', to: '/buy?try=1' },
  ]
  for (const o of s.history) {
    if (o.id === 'seed-cb') continue
    if (o.type === 'buy' && o.asset === 'gold')
      out.push({ id: o.id, at: o.at, icon: Coins, tone: 'gold', title: 'Покупка золота', text: `+${formatNum(o.grams, 4)} г за ${formatKzt(-o.kzt, 0)}. Чек с разбором цены — в операциях.`, to: '/operations' })
    if (o.type === 'sell' && o.asset === 'gold')
      out.push({ id: o.id, at: o.at, icon: Coins, tone: 'gold', title: 'Продажа золота', text: `−${formatNum(-o.grams, 4)} г, на карту ${formatKzt(o.kzt, 0)}.`, to: '/operations' })
    if (o.asset === 'usdt')
      out.push({ id: o.id, at: o.at, icon: Repeat, tone: 'grey', title: o.type === 'buy' ? 'Покупка USDT' : 'Продажа USDT', text: `${formatNum(Math.abs(o.grams), 2)} USDT · ${formatKzt(Math.abs(o.kzt), 0)}`, to: '/operations' })
    if (o.type === 'cashback' && o.asset === 'gold')
      out.push({ id: o.id, at: o.at, icon: Sparkles, tone: 'gold', title: 'Кешбэк золотом', text: `+${formatNum(o.grams, 4)} г за покупку картой.`, to: '/cashback' })
    if (o.type === 'bonus') out.push({ id: o.id, at: o.at, icon: Gift, tone: 'green', title: 'Бонус за друга', text: `${o.title.replace('Бонус: ', '')}. Тебе +0,05 г золота.`, to: '/invite' })
  }
  const level = selectLevel(s)
  const lastLesson = [...s.events].reverse().find((e) => e.name === 'lesson_done')
  if (level !== 'start' && lastLesson)
    out.push({ id: 'level', at: lastLesson.at, icon: Unlock, tone: 'green', title: `Открыт уровень «${level === 'saver' ? 'Копилка' : 'Инвестор'}»`, text: level === 'saver' ? 'Теперь доступны цели в граммах.' : 'Теперь доступны партнёры МФЦА и обмен ₸ ↔ USDT.', to: '/levels' })
  const firstBuy = s.events.find((e) => e.name === 'first_purchase')
  if (firstBuy && !s.lessonsDone.includes('spread'))
    out.push({ id: 'tip-spread', at: firstBuy.at + 1000, icon: BookOpen, tone: 'grey', title: 'Сколько ты заплатил(а) сверх рынка?', text: 'Урок на 2 минуты по твоему чеку.', to: '/academy/spread' })
  if (s.gold > 0 && firstBuy) {
    const now = new Date()
    const deadline = new Date(now.getFullYear() + (now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() > 15) ? 1 : 0), 8, 15)
    out.push({ id: 'tax', at: firstBuy.at + 2000, icon: FileText, tone: 'grey', title: 'Декларация — подготовим за тебя', text: `Золото — актив. До 15 сентября ${Math.ceil((deadline.getTime() - now.getTime()) / DAY)} дн. Данные уже собираем.`, to: '/tax' })
  }
  return out.sort((a, b) => b.at - a.at)
}

export function useUnreadCount() {
  const s = useBank()
  return useMemo(() => buildMessages(s).filter((m) => m.at > s.messagesReadAt).length, [s])
}

const when = (t: number) => {
  const d = new Date(t)
  const today = new Date()
  const same = d.toDateString() === today.toDateString()
  return same ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function Messages() {
  const nav = useNavigate()
  const s = useBank()
  const msgs = useMemo(() => buildMessages(s), [s])
  const readAt = useMemo(() => s.messagesReadAt, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => useBank.getState().markMessagesRead(), 600)
    return () => clearTimeout(t)
  }, [])
  const tones = { grey: 'bg-white text-ink', gold: 'bg-gold-soft text-[#7A5527]', green: 'bg-mint text-[#00663F]' }

  return (
    <TabPage>
      <PageTitle>Сообщения</PageTitle>
      <div className="space-y-2 px-4">
        {msgs.map((m) => (
          <button key={m.id} onClick={() => m.to && nav(m.to)} className="flex w-full gap-3 rounded-2xl bg-white p-4 text-left">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tones[m.tone]} ${m.tone === 'grey' ? '!bg-surface' : ''}`}>
              <m.icon size={20} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="truncate text-[15px] font-semibold">{m.title}</div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs text-ink-3">
                  {m.at > readAt && <span className="h-2 w-2 rounded-full bg-err" aria-label="Новое" />}
                  {when(m.at)}
                </div>
              </div>
              <p className="mt-0.5 text-sm leading-snug text-ink-2">{m.text}</p>
            </div>
          </button>
        ))}
      </div>
    </TabPage>
  )
}
