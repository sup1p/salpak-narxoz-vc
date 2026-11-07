import { Check, ChevronRight, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LESSONS, MARKET_PRICE, type QuizQ } from '../data/seed'
import { formatKzt, formatNum } from '../domain/money'
import { overpayKzt, quoteBuy } from '../domain/pricing'
import { useBank } from '../store/useBank'
import { LessonWidget } from './academyWidgets'
import { Badge, Button, Card, Header, Screen } from '../ui/ui'

export function Academy() {
  const nav = useNavigate()
  const s = useBank()
  const done = s.lessonsDone
  return (
    <div className="px-5 pb-28 pt-6">
      <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Академия</h1>
      <p className="mt-1 text-sm text-ink-2">{LESSONS.length} коротких уроков: теория, интерактив и квиз. Учимся ради себя — без призов и баллов.</p>
      <div className="mt-4 bg-ink p-5 text-white">
        <div className="text-xs text-white/60">Финансовая прокачка</div>
        <div className="num mt-1 text-3xl font-bold">
          {done.length} из {LESSONS.length}
        </div>
        <div className="mt-3 flex gap-1">
          {LESSONS.map((l) => (
            <span key={l.id} className={`h-2 flex-1 rounded-full ${done.includes(l.id) ? 'bg-gold' : 'bg-white/20'}`} />
          ))}
        </div>
        <div className="mt-3 text-xs text-white/60">
          Учимся ради себя: уроки ничего не открывают и ничем не награждаются.
        </div>
      </div>
      {(['Золото', 'Деньги', 'Налоги', 'Безопасность'] as const).map((topic) => (
        <div key={topic}>
          <h2 className="pb-2 pt-6 text-[19px] font-bold tracking-[-0.02em]">{topic}</h2>
          <div className="space-y-2">
            {LESSONS.filter((l) => l.topic === topic).map((l) => (
              <Card key={l.id} className="flex items-center justify-between gap-3" onClick={() => nav(`/academy/${l.id}`)}>
                <div className="min-w-0">
                  <div className="font-semibold">{l.title}</div>
                  <div className="mt-0.5 text-[13px] text-ink-2">{l.summary}</div>
                  <div className="mt-1 text-xs text-ink-3">
                    {l.minutes} мин · {l.pages.length} страницы · интерактив и квиз
                  </div>
                </div>
                {done.includes(l.id) ? <Check className="shrink-0 text-ok" aria-label="Пройден" /> : <ChevronRight size={18} className="shrink-0 text-ink-3" />}
              </Card>
            ))}
          </div>
        </div>
      ))}
      <div className="pb-4" />
    </div>
  )
}

/** New lesson = fresh page index and quiz state (the route stays mounted between lessons). */
export function LessonScreen() {
  const { id } = useParams()
  return <Lesson key={id} />
}

function Lesson() {
  const { id } = useParams()
  const nav = useNavigate()
  const lesson = LESSONS.find((l) => l.id === id)
  const s = useBank()
  const [card, setCard] = useState(0)
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)

  const quiz: QuizQ[] = useMemo(() => {
    if (id !== 'spread') return lesson?.quiz ?? []
    const own = s.lastReceipt?.side === 'buy' && s.lastReceipt.asset === 'gold'
    const r = own && s.lastReceipt ? s.lastReceipt : quoteBuy(10000, MARKET_PRICE, 0)
    const ok = overpayKzt(r)
    return [
      ...(lesson?.quiz ?? []),
      {
        q: own
          ? `По твоему последнему чеку: ты купил(а) золото на ${formatKzt(r.amountKzt, 0)}. Сколько ты заплатил(а) сверх рыночной цены?`
          : `Пример: покупка на ${formatKzt(r.amountKzt, 0)}. Сколько заплачено сверх рыночной цены?`,
        options: [ok, r.fee, Math.round(ok * 3)].map((v) => `${formatNum(v, 0)} ₸`),
        correct: 0,
        why: `Спред (${formatNum(r.price - r.market, 0)} ₸ на каждый грамм) + комиссия ${formatKzt(r.fee, 0)} ≈ ${formatKzt(ok, 0)}. Всё, что ты платишь сверх рынка, — в одной строке чека.`,
      },
    ]
  }, [id, lesson, s.lastReceipt])

  if (!lesson) {
    return (
      <Screen>
        <Header title="Академия" />
        <div className="p-5 text-ink-2">Урок не найден.</div>
      </Screen>
    )
  }

  const pages = lesson.pages
  const inQuiz = card >= pages.length
  const q = quiz[qi]
  const right = !!q && picked === q.correct
  const steps = pages.length + quiz.length
  const page = pages[Math.min(card, pages.length - 1)]

  const next = () => {
    if (!right) return setPicked(null)
    if (qi < quiz.length - 1) {
      setQi(qi + 1)
      setPicked(null)
      return
    }
    s.completeLesson(lesson.id)
    nav('/academy')
  }

  return (
    <Screen>
      <Header title={lesson.title} />
      <div className="flex flex-1 flex-col px-5">
        <div className="flex gap-1">
          {Array.from({ length: steps }, (_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= card + qi ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>
        {!inQuiz || !q ? (
          <>
            <div className="mt-5 self-start">
              <Badge tone="gold">
                {Math.min(card + 1, pages.length)} из {pages.length}
              </Badge>
            </div>
            {page.image && <img src={page.image} alt="" className="mt-4 h-44 w-full rounded-2xl bg-white object-contain" />}
            <h2 className="mt-4 text-[22px] font-bold leading-tight tracking-[-0.02em]">{page.title}</h2>
            <div className="mt-3 space-y-3">
              {page.text.map((t) => (
                <p key={t} className="text-[16px] leading-relaxed text-ink">
                  {t}
                </p>
              ))}
            </div>
            {page.widget && <LessonWidget key={page.widget} w={page.widget} />}
            {page.tip && <p className="mt-4 rounded-[16px] bg-gold-soft p-4 text-sm font-medium">Запомни: {page.tip}</p>}
            <div className="mt-auto pb-6 pt-6">
              <div className="grid grid-cols-[auto_1fr] gap-2">
                {card > 0 && (
                  <Button variant="secondary" className="!w-auto px-5" onClick={() => setCard(card - 1)}>
                    Назад
                  </Button>
                )}
                <Button className={card > 0 ? '' : 'col-span-2'} onClick={() => setCard(card + 1)}>
                  {card === pages.length - 1 ? 'Проверить себя' : 'Дальше'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 self-start">
              <Badge tone="green">{quiz.length > 1 ? `Вопрос ${qi + 1} из ${quiz.length}` : 'Проверь себя'}</Badge>
            </div>
            <h2 className="mt-4 text-xl font-bold leading-snug">{q.q}</h2>
            <div className="mt-5 space-y-2">
              {q.options.map((o, k) => (
                <button
                  key={k}
                  disabled={picked !== null}
                  onClick={() => setPicked(k)}
                  className={`num flex w-full items-center justify-between rounded-[16px] bg-surface p-4 text-left font-medium ${picked === null ? '' : k === q.correct ? 'ring-2 ring-ok' : k === picked ? 'ring-2 ring-err' : 'opacity-50'}`}
                >
                  {o}
                  {picked !== null && k === q.correct && <Check size={18} className="text-ok" />}
                  {picked === k && k !== q.correct && <X size={18} className="text-err" />}
                </button>
              ))}
            </div>
            {picked !== null && <p className="mt-4 rounded-[16px] bg-gold-soft p-4 text-sm">{q.why}</p>}
            <div className="mt-auto pb-6 pt-4">
              <Button disabled={picked === null} onClick={next}>
                {picked === null ? 'Выбери ответ' : !right ? 'Попробовать ещё раз' : qi < quiz.length - 1 ? 'Следующий вопрос' : 'Готово'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
