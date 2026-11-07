import { ArrowLeftRight, BookOpen, Coins, FileText, Gift, Link2, Lock, Sparkles, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatGrams, formatNum } from '../domain/money'
import { selectLevel, useBank } from '../store/useBank'
import { PageTitle, SectionTitle, TabPage } from '../ui/ui'

interface Tile {
  to: string
  icon: LucideIcon
  title: string
  sub: string
  locked?: boolean
}

function TileCard({ t }: { t: Tile }) {
  const nav = useNavigate()
  return (
    <button onClick={() => nav(t.locked ? '/levels' : t.to)} className="flex min-h-[112px] flex-col justify-between rounded-2xl bg-white p-4 text-left active:opacity-80">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-surface">
          <t.icon size={20} strokeWidth={1.8} />
        </span>
        {t.locked && <Lock size={16} className="text-ink-3" aria-label="Откроется позже" />}
      </div>
      <div>
        <div className="mt-3 text-[15px] font-semibold leading-tight">{t.title}</div>
        <div className="mt-0.5 text-xs text-ink-2">{t.sub}</div>
      </div>
    </button>
  )
}

/** «Сервисы» tab: grouped service tiles (DESIGN-SYSTEM §13). */
export function Services() {
  const s = useBank()
  const investor = selectLevel(s) === 'investor'
  const groups: { title: string; tiles: Tile[] }[] = [
    {
      title: 'Накопления',
      tiles: [
        { to: '/gold', icon: Coins, title: 'Золото', sub: `${formatGrams(s.gold)} · от 1000 ₸` },
        { to: '/otc', icon: ArrowLeftRight, title: 'Обмен ₸ ↔ USDT', sub: investor ? (s.usdt ? `${formatNum(s.usdt, 2)} USDT` : 'По котировке') : 'Уровень «Инвестор»', locked: !investor },
      ],
    },
    {
      title: 'Выгода',
      tiles: [
        { to: '/cashback', icon: Sparkles, title: 'Кешбэк и Золотой дождь', sub: s.cashbackMode === 'gold' ? 'Сейчас в золоте' : 'Сейчас в тенге' },
        { to: '/invite', icon: Gift, title: 'Позови подарком', sub: '0,01 г другу, +0,05 г обоим' },
      ],
    },
    {
      title: 'Знания и документы',
      tiles: [
        { to: '/academy', icon: BookOpen, title: 'Академия', sub: `${s.lessonsDone.length} из 7 уроков` },
        { to: '/tax', icon: FileText, title: 'Налоги и декларация', sub: 'Формы 250 и 270' },
      ],
    },
    {
      title: 'Экосистема',
      tiles: [{ to: '/partner', icon: Link2, title: 'Партнёры МФЦА', sub: investor ? (s.partnerConnected ? 'Подключён' : 'Подключить кошелёк') : 'Уровень «Инвестор»', locked: !investor }],
    },
  ]
  return (
    <TabPage>
      <PageTitle>Сервисы</PageTitle>
      <div className="px-4">
        {groups.map((g) => (
          <div key={g.title}>
            <SectionTitle>{g.title}</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {g.tiles.map((t) => (
                <TileCard key={t.to} t={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </TabPage>
  )
}
