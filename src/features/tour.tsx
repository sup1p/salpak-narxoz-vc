import { useEffect, useState, type RefObject } from 'react'
import { useBank } from '../store/useBank'

/**
 * In-app onboarding tour (CONCEPT.md §5.1, US-1.1): dims the screen, highlights one
 * real block at a time (`data-tour="<id>"`) and explains it. No quizzes, no slides.
 */
const STEPS = [
  { id: 'total', title: 'Всё твоё — в одной сумме', text: 'Карта, сбережения и золото. Мы положили 50 000 ₸ тестовых денег — пробуй без риска.' },
  { id: 'gold', title: 'Это твоё золото', text: 'Граммы и примерная стоимость в ₸. Нажми — увидишь слиток, хранителя и по какой цене ты покупал(а).' },
  { id: 'actions', title: 'Купить золото от 1000 ₸', text: 'Цена фиксируется на 30 секунд, а чек показывает спред и комиссию. Первую покупку можно сделать понарошку — в режиме Пробы.' },
  { id: 'loyalty', title: 'Кешбэк в граммах', text: 'Покупки картой могут приносить золото. Чем больше сбережений в банке — тем выше кешбэк.' },
  { id: 'next', title: 'Подскажем следующий шаг', text: 'Здесь — что сделать дальше. А короткие уроки про золото, налоги и безопасность — во вкладке «Академия».' },
]

interface Box {
  top: number
  left: number
  width: number
  height: number
}

export function Tour({ root }: { root: RefObject<HTMLDivElement | null> }) {
  const { onboarded, tourDone, finishTour } = useBank()
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const active = onboarded && !tourDone

  // passive effect: the parent ref is attached only after child layout effects run
  useEffect(() => {
    if (!active || !root.current) return
    const el = root.current.querySelector<HTMLElement>(`[data-tour="${STEPS[i].id}"]`)
    if (!el) return
    el.scrollIntoView({ block: 'center' })
    const measure = () => {
      if (!root.current) return
      const r = el.getBoundingClientRect()
      const p = root.current.getBoundingClientRect()
      setBox({ top: r.top - p.top - 6, left: r.left - p.left - 6, width: r.width + 12, height: r.height + 12 })
    }
    const t = setTimeout(measure, 60)
    return () => clearTimeout(t)
  }, [active, i, root])

  if (!active || !box) return null
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  const below = box.top < 380
  return (
    <div className="absolute inset-0 z-40" role="dialog" aria-label="Знакомство с приложением">
      <div
        className="pointer-events-none absolute rounded-[22px] outline outline-2 outline-offset-2 outline-gold transition-all duration-300"
        style={{ ...box, boxShadow: '0 0 0 3000px rgba(20,21,24,.62)' }}
      />
      <div className="absolute inset-x-4 rounded-2xl bg-white p-4 shadow-2xl" style={below ? { top: box.top + box.height + 14 } : { top: Math.max(8, box.top - 196) }}>
        <div className="flex items-center justify-between">
          <span className="num text-xs text-ink-3">
            Шаг {i + 1} из {STEPS.length}
          </span>
          <button className="h-8 text-sm text-ink-2" onClick={finishTour}>
            Пропустить
          </button>
        </div>
        <div className="mt-1 text-[17px] font-semibold">{step.title}</div>
        <p className="mt-1 text-sm leading-snug text-ink-2">{step.text}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full ${k === i ? 'w-5 bg-ink' : 'w-1.5 bg-line'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && (
              <button className="h-10 rounded-xl bg-surface px-4 text-sm font-semibold" onClick={() => setI(i - 1)}>
                Назад
              </button>
            )}
            <button className="h-10 rounded-xl bg-ink px-5 text-sm font-semibold text-white" onClick={() => (last ? finishTour() : setI(i + 1))}>
              {last ? 'Начать' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
