import { Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LESSONS, MARKET_PRICE, type QuizQ } from '../data/seed'
import { formatKzt, formatNum } from '../domain/money'
import { overpayKzt, quoteBuy } from '../domain/pricing'
import { useBank } from '../store/useBank'
import { Badge, Button, Card, Header, Screen } from '../ui/ui'

export function Academy() {
  const nav = useNavigate()
  const s = useBank()
  const done = s.lessonsDone
  return (
    <div className="px-5 pb-28 pt-6">
      <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Академия</h1>
      <p className="mt-1 text-sm text-ink-2">Короткие уроки по 2 минуты. Учимся ради себя — без призов и баллов.</p>
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
      <div className="mt-4 space-y-2 pb-4">
        {LESSONS.map((l, i) => (
          <Card key={l.id} className="flex items-center justify-between" onClick={() => nav(`/academy/${l.id}`)}>
            <div className="flex items-center gap-3">
              <span className="num grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-bold">{i + 1}</span>
              <div>
                <div className="font-semibold">{l.title}</div>
                <div className="text-xs text-ink-2">{l.minutes} мин + квиз</div>
              </div>
            </div>
            {done.includes(l.id) && <Check className="text-ok" />}
          </Card>
        ))}
      </div>
    </div>
  )
}

export function LessonScreen() {
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

  const inQuiz = card >= lesson.cards.length
  const q = quiz[qi]
  const right = !!q && picked === q.correct
  const steps = lesson.cards.length + quiz.length

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
            <div className="mt-6 self-start">
              <Badge tone="gold">
                Карточка {Math.min(card + 1, lesson.cards.length)} из {lesson.cards.length}
              </Badge>
            </div>
            <p className="mt-5 text-xl font-medium leading-snug">{lesson.cards[Math.min(card, lesson.cards.length - 1)]}</p>
            <div className="mt-auto pb-6">
              <Button onClick={() => setCard(card + 1)}>{card === lesson.cards.length - 1 ? 'Проверить себя' : 'Дальше'}</Button>
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
