import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useBank } from '../store/useBank'

/**
 * In-app onboarding tour (CONCEPT §5.1, US-1.1, DESIGN-SYSTEM §13).
 * Rendered over the whole phone frame (tab bar included). Highlights real elements
 * marked with `data-tour`, keeps the hint fully on screen, re-measures on scroll/resize.
 */
const STEPS = [
  { id: 'total', title: 'Все деньги — в одной сумме', text: 'Карта, сбережения и золото. Мы положили 50 000 ₸ тестовых денег — пробуй без риска.' },
  { id: 'gold', title: 'Твоё золото', text: 'Граммы и стоимость в тенге. Кнопка «Перейти к золоту» — покупка, продажа, хранитель слитка и цена покупки.' },
  { id: 'actions', title: 'Быстрые действия', text: 'Пополнить карту, оплатить покупку (кешбэк может прийти золотом) и купить золото от 1000 ₸.' },
  { id: 'tab-services', title: 'Сервисы', text: 'Обмен ₸ ↔ USDT, кешбэк, Академия, налоги, приглашения и партнёры МФЦА — всё здесь.' },
  { id: 'tab-messages', title: 'Сообщения', text: 'Чеки, начисления кешбэка, напоминания о декларации и подсказки — в одной ленте.' },
  { id: 'tab-more', title: 'Ещё', text: 'Профиль, уровни, безопасность и документы.' },
]

interface Box {
  top: number
  left: number
  width: number
  height: number
}

export function Tour({ frame, scroller }: { frame: RefObject<HTMLDivElement | null>; scroller: RefObject<HTMLDivElement | null> }) {
  const { onboarded, tourDone, finishTour } = useBank()
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [tipTop, setTipTop] = useState(0)
  const tip = useRef<HTMLDivElement>(null)
  const active = onboarded && !tourDone

  const target = useCallback(() => frame.current?.querySelector<HTMLElement>(`[data-tour="${STEPS[i].id}"]`) ?? null, [frame, i])

  const measure = useCallback(() => {
    const el = target()
    const f = frame.current
    if (!el || !f) return
    const r = el.getBoundingClientRect()
    const p = f.getBoundingClientRect()
    const pad = 6
    setBox({ top: r.top - p.top - pad, left: r.left - p.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 })
  }, [frame, target])

  // bring the target into view (only elements inside the scroll area), then measure
  useEffect(() => {
    if (!active) return
    const el = target()
    if (!el) return
    if (scroller.current?.contains(el)) {
      const sc = scroller.current
      const er = el.getBoundingClientRect()
      const sr = sc.getBoundingClientRect()
      const want = sc.scrollTop + (er.top - sr.top) - Math.max(16, (sr.height - er.height) / 2 - 80)
      sc.scrollTo({ top: Math.max(0, want), behavior: 'smooth' })
    }
    const t1 = setTimeout(measure, 50)
    const t2 = setTimeout(measure, 380)
    const sc = scroller.current
    sc?.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      sc?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [active, i, measure, scroller, target])

  // place the hint below or above the highlight and clamp it inside the frame
  useLayoutEffect(() => {
    if (!box || !tip.current || !frame.current) return
    const fh = frame.current.clientHeight
    const th = tip.current.offsetHeight
    const gap = 12
    const below = box.top + box.height + gap
    const above = box.top - th - gap
    const top = below + th <= fh - 12 ? below : above >= 12 ? above : Math.max(12, fh - th - 12)
    setTipTop(top)
  }, [box, frame])

  if (!active || !box) return null
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  return (
    <div className="absolute inset-0 z-50" role="dialog" aria-modal="true" aria-label="Знакомство с приложением">
      <div
        className="pointer-events-none absolute rounded-2xl ring-2 ring-gold transition-all duration-300"
        style={{ ...box, boxShadow: '0 0 0 4000px rgba(20,21,24,.6)' }}
      />
      <div ref={tip} className="absolute inset-x-4 rounded-2xl bg-white p-4 shadow-2xl transition-[top] duration-300" style={{ top: tipTop }}>
        <div className="flex items-center justify-between">
          <span className="num text-xs text-ink-3">
            {i + 1} из {STEPS.length}
          </span>
          <button className="h-8 text-sm font-medium text-ink-2" onClick={finishTour}>
            Пропустить
          </button>
        </div>
        <div className="mt-1 text-[17px] font-semibold">{step.title}</div>
        <p className="mt-1 text-sm leading-snug text-ink-2">{step.text}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-ink' : 'w-1.5 bg-line'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && (
              <button className="h-10 rounded-xl bg-surface px-4 text-sm font-semibold" onClick={() => setI(i - 1)}>
                Назад
              </button>
            )}
            <button className="h-10 rounded-xl bg-ink px-5 text-sm font-semibold text-white" onClick={() => (last ? finishTour() : setI(i + 1))}>
              {last ? 'Готово' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
