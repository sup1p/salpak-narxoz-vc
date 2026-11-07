import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useBank } from '../store/useBank'

/**
 * In-app onboarding tour (CONCEPT §5.1, US-1.1, DESIGN-SYSTEM §13).
 * Rendered over the whole phone frame (tab bar included). Highlights real elements
 * marked with `data-tour`, keeps the hint fully on screen, re-measures on scroll/resize.
 */
const STEPS = [
  { id: 'total', title: 'Все деньги — в одной сумме', text: 'Карта, сбережения и золото. Мы положили 50 000 ₸ тестовых денег — пробуй без риска.' },
  { id: 'gold', title: 'Твоё золото', text: 'Граммы и стоимость в тенге. Кнопка «Перейти к золоту» — покупка, продажа, хранитель слитка и цена покупки.' },
  { id: 'actions', title: 'Быстрые действия', text: 'Пополнить с карты другого банка, оплатить по QR и купить золото от 1000 ₸ — без минимальной комиссии.' },
  { id: 'tab-payments', title: 'Платежи', text: 'Связь, интернет, коммуналка и оплата по QR. За каждый платёж — кешбэк, можно золотом.' },
  { id: 'tab-services', title: 'Сервисы', text: 'Операции, пополнение, кешбэк, Академия, налоги, приглашения, счета других банков, USDT и МФЦА.' },
  { id: 'tab-messages', title: 'Сообщения', text: 'Каждое списание, пополнение и кешбэк — отдельным сообщением с деталями. Темы-фильтры сверху.' },
  { id: 'tab-more', title: 'Ещё', text: 'Профиль, безопасность, документы и тарифы, поддержка.' },
]

interface Box {
  top: number
  left: number
  width: number
  height: number
  radius: number
}

export function Tour({ frame, scroller }: { frame: RefObject<HTMLDivElement | null>; scroller: RefObject<HTMLDivElement | null> }) {
  const { onboarded, tourDone, finishTour } = useBank()
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [tipTop, setTipTop] = useState(0)
  const [tick, setTick] = useState(0)
  const tip = useRef<HTMLDivElement>(null)
  const active = onboarded && !tourDone

  const target = useCallback(() => frame.current?.querySelector<HTMLElement>(`[data-tour="${STEPS[i].id}"]`) ?? null, [frame, i])

  const measure = useCallback(() => {
    const el = target()
    const f = frame.current
    if (!el || !f) return
    const r = el.getBoundingClientRect()
    const p = f.getBoundingClientRect()
    // absolute children are positioned from the padding box: subtract the frame border
    const ox = p.left + f.clientLeft
    const oy = p.top + f.clientTop
    const pad = 4
    const fw = f.clientWidth
    const fh = f.clientHeight
    const left = Math.max(2, r.left - ox - pad)
    const top = Math.max(2, r.top - oy - pad)
    const right = Math.min(fw - 2, r.right - ox + pad)
    const bottom = Math.min(fh - 2, r.bottom - oy + pad)
    // follow the element's own corner radius so the cut-out hugs it
    const own = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
    setBox({ top, left, width: right - left, height: bottom - top, radius: own ? own + pad : 14 })
  }, [frame, target])

  // bring the target into view (only elements inside the scroll area), then measure
  useLayoutEffect(() => {
    if (!active) return
    const el = target()
    if (!el) {
      // parent refs attach after child layout effects on first mount — retry next frame
      const retry = setTimeout(() => setTick((t) => t + 1), 16)
      return () => clearTimeout(retry)
    }
    if (scroller.current?.contains(el)) {
      const sc = scroller.current
      const er = el.getBoundingClientRect()
      const sr = sc.getBoundingClientRect()
      const want = sc.scrollTop + (er.top - sr.top) - Math.max(16, (sr.height - er.height) / 2 - 80)
      // instant scroll: the cut-out must never lag behind the element
      sc.scrollTo({ top: Math.max(0, want), behavior: 'auto' })
    }
    measure() // synchronous: layout is forced by getBoundingClientRect, no timer needed
    const raf = requestAnimationFrame(measure)
    const t1 = setTimeout(measure, 120)
    const t2 = setTimeout(measure, 400)
    const sc = scroller.current
    sc?.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      sc?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [active, i, measure, scroller, target, tick])

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
        className="pointer-events-none absolute transition-[top,left,width,height] duration-200"
        style={{
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          borderRadius: box.radius,
          boxShadow: '0 0 0 2px #F2AE3A, 0 0 0 4000px rgba(11,11,12,.6)',
        }}
      />
      <div ref={tip} className="absolute inset-x-4 rounded-2xl bg-white p-4 shadow-2xl transition-[top] duration-200" style={{ top: tipTop }}>
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
