import { useEffect, useRef } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Coins, Home as HomeIcon, Plus, User } from 'lucide-react'
import { useBank } from './store/useBank'
import { Login } from './features/onboarding'
import { Home } from './features/home'
import { Gold } from './features/gold'
import { TradeFlow } from './features/trade'
import { Cashback } from './features/cashback'
import { Academy, LessonScreen } from './features/academy'
import { Profile, TaxReadiness, InviteGift, GiftReceived, PartnerConnect, Levels, History } from './features/profile'
import { Metrics } from './features/metrics'

const TABS = [
  { to: '/home', icon: HomeIcon, label: 'Главная' },
  { to: '/gold', icon: Coins, label: 'Золото' },
  null,
  { to: '/academy', icon: BookOpen, label: 'Академия' },
  { to: '/profile', icon: User, label: 'Профиль' },
] as const

function TabBar() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const show = ['/home', '/gold', '/academy', '/profile'].includes(pathname)
  if (!show) return null
  return (
    <nav className="absolute inset-x-4 bottom-4 z-30 flex h-16 items-center justify-between rounded-full bg-ink px-3 shadow-[0_8px_24px_rgba(20,21,24,.25)]">
      {TABS.map((t, i) =>
        t === null ? (
          <button
            key={i}
            aria-label="Купить золото"
            onClick={() => nav('/buy')}
            className="gold-grad -mt-8 grid h-14 w-14 place-items-center rounded-full border-4 border-paper text-ink shadow-lg active:scale-95"
          >
            <Plus strokeWidth={3} />
          </button>
        ) : (
          <button
            key={t.to}
            onClick={() => nav(t.to)}
            className={`flex h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[10px] font-medium ${pathname === t.to ? 'text-white' : 'text-white/45'}`}
          >
            <t.icon size={20} />
            {t.label}
          </button>
        ),
      )}
    </nav>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  const onboarded = useBank((s) => s.onboarded)
  return onboarded ? <>{children}</> : <Navigate to="/welcome" replace />
}

function Shell() {
  const onboarded = useBank((s) => s.onboarded)
  const { pathname } = useLocation()
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [pathname])
  // ТЗ п.5 «возвраты»: a later visit counts as D1 / D7 return
  useEffect(() => {
    const st = useBank.getState()
    if (!st.onboarded) return
    const days = (Date.now() - st.installedAt) / 86400000
    if (days >= 1) st.track('return_d1')
    if (days >= 7) st.track('return_d7')
  }, [])
  return (
    <div className="flex min-h-full items-center justify-center sm:py-6">
      <div className="relative h-[100dvh] w-full overflow-hidden bg-paper sm:h-[min(844px,calc(100dvh-48px))] sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-ink sm:shadow-2xl">
        <div ref={scroller} className="no-scrollbar h-full overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to={onboarded ? '/home' : '/welcome'} replace />} />
            <Route path="/welcome" element={<Login />} />
            <Route path="/gift" element={<GiftReceived />} />
            <Route path="/home" element={<Guard><Home /></Guard>} />
            <Route path="/gold" element={<Guard><Gold /></Guard>} />
            <Route path="/buy" element={<Guard><TradeFlow side="buy" /></Guard>} />
            <Route path="/sell" element={<Guard><TradeFlow side="sell" /></Guard>} />
            <Route path="/otc" element={<Guard><TradeFlow side="buy" asset="usdt" /></Guard>} />
            <Route path="/otc/sell" element={<Guard><TradeFlow side="sell" asset="usdt" /></Guard>} />
            <Route path="/metrics" element={<Guard><Metrics /></Guard>} />
            <Route path="/cashback" element={<Guard><Cashback /></Guard>} />
            <Route path="/academy" element={<Guard><Academy /></Guard>} />
            <Route path="/academy/:id" element={<Guard><LessonScreen /></Guard>} />
            <Route path="/profile" element={<Guard><Profile /></Guard>} />
            <Route path="/tax" element={<Guard><TaxReadiness /></Guard>} />
            <Route path="/invite" element={<Guard><InviteGift /></Guard>} />
            <Route path="/partner" element={<Guard><PartnerConnect /></Guard>} />
            <Route path="/levels" element={<Guard><Levels /></Guard>} />
            <Route path="/history" element={<Guard><History /></Guard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <TabBar />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
