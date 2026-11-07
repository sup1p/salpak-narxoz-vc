import { useEffect, useRef } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Grid2x2, Home as HomeIcon, List, MoreHorizontal } from 'lucide-react'
import { useBank } from './store/useBank'
import { Login } from './features/onboarding'
import { Home } from './features/home'
import { Gold } from './features/gold'
import { TradeFlow } from './features/trade'
import { Cashback } from './features/cashback'
import { Academy, LessonScreen } from './features/academy'
import { TaxReadiness, InviteGift, GiftReceived, PartnerConnect, Levels } from './features/profile'
import { Metrics } from './features/metrics'
import { Operations } from './features/operations'
import { Services } from './features/services'
import { Messages, useUnreadCount } from './features/messages'
import { More, Security, Documents } from './features/more'
import { Tour } from './features/tour'
import { OtherBanks, TopUp } from './features/banks'

/** Bottom bar like Freedom SuperApp (DESIGN-SYSTEM §13): 5 labelled tabs, no centre button. */
export const TABS = [
  { to: '/home', icon: HomeIcon, label: 'Главная' },
  { to: '/operations', icon: List, label: 'Операции' },
  { to: '/services', icon: Grid2x2, label: 'Сервисы' },
  { to: '/messages', icon: Bell, label: 'Сообщения' },
  { to: '/more', icon: MoreHorizontal, label: 'Ещё' },
] as const

function TabBar() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const unread = useUnreadCount()
  if (!TABS.some((t) => t.to === pathname)) return null
  return (
    <nav aria-label="Навигация" className="absolute inset-x-0 bottom-0 z-30 grid h-[68px] grid-cols-5 border-t border-line bg-white pb-2">
      {TABS.map((t) => {
        const on = pathname === t.to
        return (
          <button
            key={t.to}
            data-tour={`tab-${t.to.slice(1)}`}
            aria-current={on ? 'page' : undefined}
            onClick={() => nav(t.to)}
            className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? 'text-ink' : 'text-ink-3'}`}
          >
            <span className="relative">
              <t.icon size={22} strokeWidth={on ? 2.1 : 1.7} />
              {t.to === '/messages' && unread > 0 && (
                <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-err px-1 text-[10px] font-bold text-white">{unread}</span>
              )}
            </span>
            {t.label}
          </button>
        )
      })}
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
  const frame = useRef<HTMLDivElement>(null)
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
      <div ref={frame} className="relative h-[100dvh] w-full overflow-hidden bg-paper sm:h-[min(844px,calc(100dvh-48px))] sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-ink sm:shadow-2xl">
        <div ref={scroller} className="no-scrollbar h-full overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to={onboarded ? '/home' : '/welcome'} replace />} />
            <Route path="/welcome" element={<Login />} />
            <Route path="/gift" element={<GiftReceived />} />
            {/* tabs */}
            <Route path="/home" element={<Guard><Home /></Guard>} />
            <Route path="/operations" element={<Guard><Operations /></Guard>} />
            <Route path="/services" element={<Guard><Services /></Guard>} />
            <Route path="/messages" element={<Guard><Messages /></Guard>} />
            <Route path="/more" element={<Guard><More /></Guard>} />
            {/* inner pages */}
            <Route path="/gold" element={<Guard><Gold /></Guard>} />
            <Route path="/buy" element={<Guard><TradeFlow side="buy" /></Guard>} />
            <Route path="/sell" element={<Guard><TradeFlow side="sell" /></Guard>} />
            <Route path="/otc" element={<Guard><TradeFlow side="buy" asset="usdt" /></Guard>} />
            <Route path="/otc/sell" element={<Guard><TradeFlow side="sell" asset="usdt" /></Guard>} />
            <Route path="/cashback" element={<Guard><Cashback /></Guard>} />
            <Route path="/academy" element={<Guard><Academy /></Guard>} />
            <Route path="/academy/:id" element={<Guard><LessonScreen /></Guard>} />
            <Route path="/tax" element={<Guard><TaxReadiness /></Guard>} />
            <Route path="/invite" element={<Guard><InviteGift /></Guard>} />
            <Route path="/partner" element={<Guard><PartnerConnect /></Guard>} />
            <Route path="/levels" element={<Guard><Levels /></Guard>} />
            <Route path="/metrics" element={<Guard><Metrics /></Guard>} />
            <Route path="/security" element={<Guard><Security /></Guard>} />
            <Route path="/documents" element={<Guard><Documents /></Guard>} />
            <Route path="/topup" element={<Guard><TopUp /></Guard>} />
            <Route path="/banks" element={<Guard><OtherBanks /></Guard>} />
            {/* old paths */}
            <Route path="/profile" element={<Navigate to="/more" replace />} />
            <Route path="/history" element={<Navigate to="/operations" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <TabBar />
        {pathname === '/home' && <Tour frame={frame} scroller={scroller} />}
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
