import { motion } from 'framer-motion'
import { Check, Keyboard, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatKzt } from '../domain/money'
import { Button, Sheet } from '../ui/ui'

/** Merchants a demo QR can resolve to (neutral names, synthetic). */
export const QR_MERCHANTS = [
  { merchant: 'Кофейня «Зерно» (тест)', order: 'Заказ №2048', amount: 1500 },
  { merchant: 'Магазин у дома (тест)', order: 'Чек №7731', amount: 4320 },
  { merchant: 'Книжный (тест)', order: 'Чек №0519', amount: 6900 },
]

const toPay = (m: (typeof QR_MERCHANTS)[number]) => `/payments/qr?m=${encodeURIComponent(m.merchant)}&o=${encodeURIComponent(m.order)}&a=${m.amount}`

/**
 * QR scanner (US-15.2). The camera is simulated so the demo never depends on browser
 * permissions: a viewfinder with a scanning line "recognises" a code after ~2 s.
 */
export function Scan() {
  const nav = useNavigate()
  const [found, setFound] = useState<(typeof QR_MERCHANTS)[number] | null>(null)
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const [torch, setTorch] = useState(false)

  useEffect(() => {
    if (found || manual) return
    const t = setTimeout(() => setFound(QR_MERCHANTS[Math.floor(Math.random() * QR_MERCHANTS.length)]), 2200)
    return () => clearTimeout(t)
  }, [found, manual])

  return (
    <div className="relative flex min-h-full flex-col bg-[#0B0B0C] text-white">
      {/* fake camera feed */}
      <div className={`absolute inset-0 ${torch ? 'bg-[radial-gradient(circle_at_50%_40%,#5a5a5a,#141414_70%)]' : 'bg-[radial-gradient(circle_at_50%_40%,#2b2b2e,#0b0b0c_70%)]'}`} aria-hidden />

      <div className="relative flex items-center justify-between px-4 pt-4">
        <button aria-label="Закрыть" onClick={() => nav(-1)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
          <X />
        </button>
        <div className="text-[16px] font-semibold">Оплата по QR</div>
        <button aria-label="Фонарик" aria-pressed={torch} onClick={() => setTorch(!torch)} className={`grid h-11 w-11 place-items-center rounded-full ${torch ? 'bg-gold text-ink' : 'bg-white/10'}`}>
          <Zap size={20} />
        </button>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8">
        <div className="relative h-64 w-64">
          {/* corners */}
          {['left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-3xl', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-3xl'].map((c) => (
            <span key={c} className={`absolute h-12 w-12 ${found ? 'border-green' : 'border-gold'} ${c}`} />
          ))}
          {/* a faint QR silhouette */}
          <div className="absolute inset-10 grid grid-cols-7 gap-1 opacity-20" aria-hidden>
            {Array.from({ length: 49 }, (_, i) => (
              <span key={i} className={`rounded-sm ${[0, 1, 2, 7, 9, 14, 15, 16, 4, 5, 6, 11, 13, 18, 19, 20, 28, 29, 30, 35, 37, 42, 43, 44, 24, 26, 32, 40, 46].includes(i) ? 'bg-white' : ''}`} />
            ))}
          </div>
          {!found && (
            <motion.span
              className="absolute inset-x-4 h-0.5 rounded-full bg-gold shadow-[0_0_12px_#F2AE3A]"
              initial={{ top: '12%' }}
              animate={{ top: ['12%', '88%', '12%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {found && (
            <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-green">
              <Check size={32} />
            </motion.span>
          )}
        </div>
        <p className="mt-8 text-center text-[15px] text-white/80">{found ? 'QR-код распознан' : 'Наведите камеру на QR-код на кассе'}</p>
        <p className="mt-1 text-center text-xs text-white/40">Демо: камера имитируется, код распознаётся автоматически</p>
      </div>

      <div className="relative px-4 pb-8">
        <button onClick={() => setManual(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-[15px] font-semibold">
          <Keyboard size={18} /> Ввести код вручную
        </button>
      </div>

      <Sheet open={!!found} onClose={() => setFound(null)}>
        {found && (
          <div>
            <div className="text-sm text-ink-2">{found.order}</div>
            <div className="mt-0.5 text-[19px] font-bold text-ink">{found.merchant}</div>
            <div className="num mt-3 text-[32px] font-extrabold tracking-[-0.02em] text-ink">{formatKzt(found.amount, 0)}</div>
            <Button className="mt-4" variant="gold" onClick={() => nav(toPay(found), { replace: true })}>
              Перейти к оплате
            </Button>
            <Button className="mt-2" variant="secondary" onClick={() => setFound(null)}>
              Сканировать снова
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={manual} onClose={() => setManual(false)}>
        <div className="text-[19px] font-bold text-ink">Код под QR</div>
        <p className="mt-1 text-sm text-ink-2">Обычно напечатан под QR-кодом на кассе. В демо подойдёт любой из 6 цифр.</p>
        <input
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          aria-label="Код под QR"
          className="num mt-4 h-14 w-full rounded-xl bg-surface px-4 text-center text-[24px] font-semibold tracking-[.3em] text-ink outline-none"
        />
        <Button className="mt-4" disabled={code.length !== 6} onClick={() => nav(toPay(QR_MERCHANTS[Number(code) % QR_MERCHANTS.length]), { replace: true })}>
          Продолжить
        </Button>
      </Sheet>
    </div>
  )
}
