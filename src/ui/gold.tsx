import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import type { Status } from '../domain/loyalty'

/** Our own stickers (DESIGN-SYSTEM §5) — not UGLYCASH assets. */
export function Sticker({
  children,
  bg = '#F5B700',
  color = '#0B0B0F',
  rotate = -6,
  className = '',
}: {
  children: React.ReactNode
  bg?: string
  color?: string
  rotate?: number
  className?: string
}) {
  return (
    <span
      className={`inline-block rounded-xl border-2 border-white px-3 py-1.5 font-display text-sm font-semibold uppercase tracking-wide shadow-[0_6px_16px_rgba(11,11,15,.18)] ${className}`}
      style={{ background: bg, color, transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  )
}

export function Nugget({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="ng" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF1B0" />
          <stop offset=".45" stopColor="#F5B700" />
          <stop offset="1" stopColor="#B57800" />
        </linearGradient>
      </defs>
      <path d="M10 38 L18 18 L34 10 L52 20 L56 40 L40 54 L20 52 Z" fill="url(#ng)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M18 18 L30 30 L34 10 M30 30 L52 20 M30 30 L40 54 M30 30 L10 38" stroke="#C98A00" strokeOpacity=".35" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="3" fill="#fff" opacity=".8" />
    </svg>
  )
}

export function BarKeychain({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" className={className} aria-hidden>
      <defs>
        <linearGradient id="bk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF1B0" />
          <stop offset=".5" stopColor="#F5B700" />
          <stop offset="1" stopColor="#B57800" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="14" r="10" fill="none" stroke="#C8C8D0" strokeWidth="4" />
      <path d="M50 24 L50 40" stroke="#C8C8D0" strokeWidth="4" />
      <path d="M22 50 L78 50 L90 118 L10 118 Z" fill="url(#bk)" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
      <path d="M30 58 L70 58 L76 110 L24 110 Z" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
      <text x="50" y="82" textAnchor="middle" fontFamily="Oswald" fontWeight="700" fontSize="13" fill="#7A5200">
        999,9
      </text>
      <text x="50" y="98" textAnchor="middle" fontFamily="Oswald" fontWeight="600" fontSize="9" fill="#7A5200">
        ALTYN · 1 KG
      </text>
    </svg>
  )
}

/**
 * Capsule with gold "sand": level ∝ grams (< 1 g fills the capsule).
 * `pulse` re-keys to animate a refill.
 */
export function GoldCapsule({ grams, height = 150, pulse = 0 }: { grams: number; height?: number; pulse?: number }) {
  // sqrt so tiny amounts are still visible as sand
  const level = Math.max(0.05, Math.min(1, Math.sqrt(grams)))
  const width = height * 0.46
  const grains = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({ x: ((i * 37) % 80) + 10, y: ((i * 53) % 90) + 5, r: 0.8 + ((i * 7) % 3) * 0.5 })),
    [],
  )
  return (
    <div className="relative" style={{ width, height }}>
      <div className="absolute inset-0 overflow-hidden rounded-full border-[3px] border-white bg-white/70 shadow-[inset_0_0_0_1px_#E6E6EA,0_8px_24px_rgba(11,11,15,.10)]">
        <motion.div
          key={pulse}
          className="gold-grad absolute inset-x-0 bottom-0"
          initial={{ height: `${Math.max(0, level * 100 - 6)}%` }}
          animate={{ height: `${level * 100}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {grains.map((g, i) => (
              <circle key={i} cx={g.x} cy={g.y} r={g.r} fill="#FFF6CF" opacity=".7" />
            ))}
          </svg>
          <div className="absolute inset-x-0 top-0 h-2 rounded-full bg-gold-light/80 blur-[2px]" />
        </motion.div>
        <div className="absolute left-[18%] top-[8%] h-[70%] w-[14%] rounded-full bg-white/60" />
      </div>
    </div>
  )
}

const PARTICLES: Record<Status, number> = { sand: 14, nugget: 32, bar: 80 }

/** Cashback "mining": gold particles fall; strength grows with loyalty status. */
export function MiningRain({ show, status }: { show: boolean; status: Status }) {
  const n = PARTICLES[status]
  const parts = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        left: status === 'bar' ? (i * 97) % 100 : 38 + ((i * 31) % 24),
        delay: (i % 12) * 0.08 + Math.floor(i / 12) * 0.12,
        size: status === 'nugget' && i % 10 === 0 ? 14 : 4 + (i % 4) * 2,
        dur: 1.1 + (i % 5) * 0.18,
      })),
    [n, status],
  )
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {parts.map((p, i) => (
            <motion.span
              key={i}
              className="gold-grad absolute top-0 rounded-[30%] shadow-[0_0_6px_rgba(245,183,0,.6)]"
              style={{ left: `${p.left}%`, width: p.size, height: p.size }}
              initial={{ y: -20, rotate: 0, opacity: 0 }}
              animate={{ y: 520, rotate: 200, opacity: [0, 1, 1, 0] }}
              transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Simple 30-day line (no candles). */
export function PriceLine({ data, height = 80 }: { data: number[]; height?: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / (max - min || 1)) * 90 - 5}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }} aria-label="График цены золота за 30 дней">
      <polyline points={pts} fill="none" stroke="#C98A00" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

/** Quote countdown ring (DESIGN-SYSTEM §5). */
export function TimerRing({ left, total = 30 }: { left: number; total?: number }) {
  const r = 20
  const c = 2 * Math.PI * r
  const warn = left <= 5
  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#E6E6EA" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={warn ? '#E8590C' : '#F5B700'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - left / total)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className={`num absolute inset-0 grid place-items-center text-sm font-bold ${warn ? 'text-warn' : ''}`}>{left}</span>
    </div>
  )
}
