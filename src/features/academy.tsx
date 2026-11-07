import { Check, Lock, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LESSONS, MARKET_PRICE } from '../data/seed'
import { formatKzt, formatNum } from '../domain/money'
import { overpayKzt, quoteBuy } from '../domain/pricing'
import { useBank } from '../store/useBank'
import { Sticker } from '../ui/gold'
import { Button, Card, Header, Screen } from '../ui/ui'

export function Academy() {
  const nav = useNavigate()
  const done = useBank((s) => s.lessonsDone)
  return (
    <div className="px-5 pb-28 pt-6">
      <h1 className="text-[28px] font-bold">Академия</h1>
      <p className="mt-1 text-sm text-ink-2">Короткие уроки по 2 минуты. Учимся ради себя — без призов и баллов.</p>
      <Card className="mt-4 bg-ink text-white">
        <div className="text-xs text-white/60">Финансовая прокачка</div>
        <div className="num mt-1 text-3xl font-bold">
          {done.length} из {LESSONS.length}
        </div>
        <div className="mt-3 flex gap-1">
          {LESSONS.map((l) => (
            <span key={l.id} className={`h-2 flex-1 rounded-full ${done.includes(l.id) ? 'bg-gold' : 'bg-white/20'}`} />
          ))}
        </div>
        <div className="mt-3 text-xs text-white/60">Базовые уроки открывают уровень «Инвестор» — как проверка готовности, не как награда.</div>
      </Card>
      <div className="mt-4 space-y-2 pb-4">
        {LESSONS.map((l, i) => (
          <Card key={l.id} className="flex items-center justify-between" onClick={l.ready ? () => nav(`/academy/${l.id}`) : undefined}>
            <div className="flex items-center gap-3">
              <span className="num grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-bold">{i + 1}</span>
              <div>
                <div className="font-semibold">{l.title}</div>
                <div className="text-xs text-ink-2">{l.ready ? `${l.minutes} мин + квиз` : 'скоро'}</div>
              </div>
            </div>
            {done.includes(l.id) ? <Check className="text-ok" /> : l.ready ? null : <Lock size={18} className="text-ink-3" />}
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
  const [picked, setPicked] = useState<number | null>(null)

  const quiz = useMemo(() => {
    if (id === 'spread') {
      const r = s.lastReceipt?.side === 'buy' ? s.lastReceipt : quoteBuy(10000, MARKET_PRICE, 0)
      const ok = overpayKzt(r)
      const own = s.lastReceipt?.side === 'buy'
      return {
        q: own
          ? `По твоему последнему чеку: ты купил(а) золото на ${formatKzt(r.amountKzt, 0)}. Сколько ты заплатил(а) сверх рыночной цены?`
          : `Пример: покупка на ${formatKzt(r.amountKzt, 0)}. Сколько заплачено сверх рыночной цены?`,
        options: [ok, r.fee, Math.round(ok * 3)].map((v) => `${formatNum(v, 0)} ₸`),
        correct: 0,
        why: `Спред (${formatNum(r.price - r.market, 0)} ₸ на каждый грамм) + комиссия ${formatKzt(r.fee, 0)} ≈ ${formatKzt(ok, 0)}. Всё, что ты платишь сверх рынка, — в одной строке чека.`,
      }
    }
    return {
      q: 'Где физически лежит твоё золото?',
      options: ['У хранителя, в слитке с номером', 'В приложении на телефоне', 'В сейфе у меня дома'],
      correct: 0,
      why: 'Токен — твоя доля в настоящем слитке. Слиток хранит независимый хранитель, его номер и дату аудита видно на экране «Золото».',
    }
  }, [id, s.lastReceipt])

  if (!lesson || !lesson.ready) {
    return (
      <Screen>
        <Header title="Академия" />
        <div className="p-5 text-ink-2">Этот урок скоро появится.</div>
      </Screen>
    )
  }

  const inQuiz = card >= lesson.cards.length
  const right = picked === quiz.correct

  return (
    <Screen>
      <Header title={lesson.title} />
      <div className="flex flex-1 flex-col px-5">
        <div className="flex gap-1">
          {[...lesson.cards, 'quiz'].map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= card ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>
        {!inQuiz ? (
          <>
            <Sticker bg="#FFE9A6" rotate={-3} className="mt-6 self-start">
              {card + 1} / {lesson.cards.length}
            </Sticker>
            <p className="mt-5 text-xl font-medium leading-snug">{lesson.cards[card]}</p>
            <div className="mt-auto pb-6">
              <Button onClick={() => setCard(card + 1)}>{card === lesson.cards.length - 1 ? 'Проверить себя' : 'Дальше'}</Button>
            </div>
          </>
        ) : (
          <>
            <Sticker bg="#C6F432" rotate={-3} className="mt-6 self-start">
              квиз
            </Sticker>
            <h2 className="mt-4 text-xl font-bold leading-snug">{quiz.q}</h2>
            <div className="mt-5 space-y-2">
              {quiz.options.map((o, k) => (
                <button
                  key={k}
                  disabled={picked !== null}
                  onClick={() => setPicked(k)}
                  className={`num flex w-full items-center justify-between rounded-[16px] bg-surface p-4 text-left font-medium ${picked === null ? '' : k === quiz.correct ? 'ring-2 ring-ok' : k === picked ? 'ring-2 ring-err' : 'opacity-50'}`}
                >
                  {o}
                  {picked !== null && k === quiz.correct && <Check size={18} className="text-ok" />}
                  {picked === k && k !== quiz.correct && <X size={18} className="text-err" />}
                </button>
              ))}
            </div>
            {picked !== null && <p className="mt-4 rounded-[16px] bg-gold-soft p-4 text-sm">{quiz.why}</p>}
            <div className="mt-auto pb-6 pt-4">
              <Button
                disabled={picked === null}
                onClick={() => {
                  if (!right) return setPicked(null)
                  s.completeLesson(lesson.id)
                  nav('/academy')
                }}
              >
                {picked === null ? 'Выбери ответ' : right ? 'Готово' : 'Попробовать ещё раз'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
