import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/* DESIGN-SYSTEM §13 — professional neobank: sentence case, radius 12/16, one set of shared parts. */

type BtnVariant = 'primary' | 'gold' | 'secondary' | 'ghost'
const btn: Record<BtnVariant, string> = {
  primary: 'bg-ink text-white',
  gold: 'bg-gold text-ink',
  secondary: 'bg-surface text-ink',
  ghost: 'bg-transparent text-ink',
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
      className={`${btn[variant]} ${small ? 'h-10 px-4 text-sm' : 'h-[52px] w-full text-[15px]'} inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:opacity-80 disabled:opacity-40 ${className}`}
    >
      {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  )
}

export function Card({ children, className = '', onClick, tone = 'surface' }: { children: ReactNode; className?: string; onClick?: () => void; tone?: 'surface' | 'white' }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 ${tone === 'white' ? 'bg-white' : 'bg-surface'} ${onClick ? 'cursor-pointer transition active:opacity-80' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function Header({ title, back = true, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="grid h-14 grid-cols-[44px_1fr_44px] items-center px-3">
      {back ? (
        <button aria-label="Назад" onClick={() => nav(-1)} className="grid h-11 w-11 place-items-center rounded-full active:bg-surface">
          <ChevronLeft />
        </button>
      ) : (
        <span />
      )}
      <div className="truncate text-center text-[16px] font-semibold">{title}</div>
      <div className="grid place-items-center">{right}</div>
    </div>
  )
}

/** Large title for tab roots (Главная, Операции, Сервисы, Сообщения, Ещё). */
export function PageTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pb-3 pt-5">
      <h1 className="text-[30px] font-extrabold tracking-[-0.03em]">{children}</h1>
      {right}
    </div>
  )
}

/** Section heading inside a page. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-1 pb-2 pt-5">
      <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">{children}</h2>
      {action}
    </div>
  )
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex min-h-full flex-col bg-paper ${className}`}>{children}</div>
}

/** Grey page used by the five tab roots. */
export function TabPage({ children }: { children: ReactNode }) {
  return <div className="min-h-full bg-white pb-24">{children}</div>
}

export function TestBadge() {
  return <div className="mx-4 rounded-xl bg-surface px-4 py-3 text-xs text-ink-2">Тестовый режим — реальные деньги и данные не используются</div>
}

/** One badge component (pill, 24px) — no hand-made text boxes. */
export function Badge({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'green' | 'grey' | 'warn' | 'dark' | 'lime' | 'lilac' }) {
  const t = {
    gold: 'bg-gold-soft text-[#7A4A00]',
    lime: 'bg-lime text-ink',
    lilac: 'bg-lilac text-ink',
    green: 'bg-mint text-[#00663F]',
    grey: 'bg-surface text-ink-2',
    warn: 'bg-[#FDEDE3] text-warn',
    dark: 'bg-ink text-white',
  }[tone]
  return <span className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${t}`}>{children}</span>
}

/** Soft circle with an icon, used by every list row. */
export function IconCircle({ icon: Icon, tone = 'grey' }: { icon: LucideIcon; tone?: 'grey' | 'gold' | 'green' | 'dark' }) {
  const t = { grey: 'bg-surface text-ink', gold: 'bg-gold-soft text-[#7A4A00]', green: 'bg-mint text-[#00663F]', dark: 'bg-ink text-white' }[tone]
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${t}`}>
      <Icon size={20} strokeWidth={1.8} />
    </span>
  )
}

/** Shared list row: icon · title/subtitle · value/subvalue · chevron. */
export function ListRow({
  icon,
  tone,
  title,
  sub,
  value,
  valueSub,
  onClick,
  chevron = true,
  right,
}: {
  icon?: LucideIcon
  tone?: 'grey' | 'gold' | 'green' | 'dark'
  title: ReactNode
  sub?: ReactNode
  value?: ReactNode
  valueSub?: ReactNode
  onClick?: () => void
  chevron?: boolean
  right?: ReactNode
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left">
      {icon && <IconCircle icon={icon} tone={tone} />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{title}</div>
        {sub && <div className="truncate text-[13px] text-ink-2">{sub}</div>}
      </div>
      {(value || valueSub) && (
        <div className="shrink-0 text-right">
          {value && <div className="num text-[15px] font-semibold">{value}</div>}
          {valueSub && <div className="num text-[13px] text-ink-2">{valueSub}</div>}
        </div>
      )}
      {right}
      {onClick && chevron && <ChevronRight size={18} className="shrink-0 text-ink-3" />}
    </Tag>
  )
}

/** White grouped list with hairline dividers inset after the icon. */
export function List({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`[&>*+*]:border-t [&>*+*]:border-line ${className}`}>{children}</div>
}

export function Row({ label, value, strong, onLabel }: { label: ReactNode; value: ReactNode; strong?: boolean; onLabel?: () => void }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-2.5 ${strong ? 'font-semibold' : ''}`}>
      <span onClick={onLabel} className={`text-sm ${onLabel ? 'cursor-pointer underline decoration-dotted underline-offset-4' : ''} ${strong ? 'text-ink' : 'text-ink-2'}`}>
        {label}
      </span>
      <span className={`num whitespace-nowrap text-right ${strong ? 'text-[17px]' : 'text-sm'}`}>{value}</span>
    </div>
  )
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-50 flex items-end bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="w-full rounded-t-3xl bg-paper p-5 pb-8"
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
          className="absolute left-1/2 top-4 z-50 -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
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

/** Big balance: integer large, fraction small superscript. */
export function Balance({ value, unit = '₸', digits = 2, className = '' }: { value: number; unit?: string; digits?: number; className?: string }) {
  const [int, frac] = value.toFixed(digits).split('.')
  const intFmt = Number(int).toLocaleString('ru-RU').replace(/ | /g, ' ')
  return (
    <div className={`num font-bold leading-none tracking-tight ${className}`}>
      {intFmt}
      <span className="align-top text-[0.42em] font-semibold">
        ,{frac} {unit}
      </span>
    </div>
  )
}

/** GRAM logo (DESIGN-SYSTEM §14.1): green «G» with a gold-bar cut-out. */
export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return <img src="/logo.svg" alt="GRAM" width={size} height={size} className={`shrink-0 ${className}`} />
}
