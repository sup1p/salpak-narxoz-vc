import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

type BtnVariant = 'primary' | 'gold' | 'secondary' | 'ghost'
const btn: Record<BtnVariant, string> = {
  primary: 'bg-ink text-white',
  gold: 'gold-grad text-ink',
  secondary: 'bg-surface text-ink',
  ghost: 'bg-transparent text-ink underline underline-offset-4',
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  loading,
  className = '',
  small,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  disabled?: boolean
  loading?: boolean
  className?: string
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${btn[variant]} ${small ? 'h-11 px-5 text-sm' : 'h-14 w-full text-base'} inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[.98] disabled:opacity-40 ${className}`}
    >
      {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`rounded-[24px] bg-surface p-5 ${onClick ? 'cursor-pointer active:scale-[.99] transition' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Header({ title, back = true, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="flex h-14 items-center justify-between px-5">
      {back ? (
        <button aria-label="Назад" onClick={() => nav(-1)} className="-ml-2 grid h-11 w-11 place-items-center rounded-full active:bg-surface">
          <ChevronLeft />
        </button>
      ) : (
        <span />
      )}
      {title && <div className="text-sm font-semibold">{title}</div>}
      <div className="min-w-11">{right}</div>
    </div>
  )
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex min-h-full flex-col bg-paper ${className}`}>{children}</div>
}

export function TestBadge() {
  return (
    <div className="mx-5 rounded-2xl bg-surface px-4 py-2 text-xs text-ink-2">
      🧪 Тестовый режим — реальные деньги и данные не используются
    </div>
  )
}

export function Row({ label, value, strong, onLabel }: { label: ReactNode; value: ReactNode; strong?: boolean; onLabel?: () => void }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-2 ${strong ? 'font-semibold' : ''}`}>
      <span onClick={onLabel} className={`text-sm ${onLabel ? 'cursor-pointer underline decoration-dotted underline-offset-4' : ''} ${strong ? 'text-ink' : 'text-ink-2'}`}>
        {label}
      </span>
      <span className={`num text-right ${strong ? 'text-lg' : 'text-sm'}`}>{value}</span>
    </div>
  )
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-50 flex items-end bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="w-full rounded-t-[32px] bg-paper p-5 pb-8"
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            exit={{ y: 400 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toast({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute left-1/2 top-4 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Big balance: integer large, fraction small superscript (DESIGN-SYSTEM §5). */
export function Balance({ value, unit = '₸', digits = 2, className = '' }: { value: number; unit?: string; digits?: number; className?: string }) {
  const [int, frac] = value.toFixed(digits).split('.')
  const intFmt = Number(int).toLocaleString('ru-RU').replace(/ | /g, ' ')
  return (
    <div className={`num font-bold leading-none tracking-tight ${className}`}>
      {intFmt}
      <span className="align-top text-[0.42em] font-semibold">
        ,{frac} {unit}
      </span>
    </div>
  )
}
