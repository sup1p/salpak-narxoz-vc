import { Check, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBank } from '../store/useBank'
import { Badge, Button, Header, Screen } from '../ui/ui'

/**
 * Risk test before USDT and AIFC partners (review 2026-11-07, replaces the levels ladder).
 * Like the suitability test brokers run for non-qualified investors — not tied to Academy lessons.
 */
const QUESTIONS = [
  {
    q: 'Что будет, если цена USDT или цифрового актива упадёт?',
    options: ['Стоимость моих активов снизится', 'Банк вернёт разницу'],
    correct: 0,
    why: 'Цифровые активы не застрахованы как вклад: их стоимость может снижаться, банк разницу не компенсирует.',
  },
  {
    q: 'Кто хранит активы в кошельке партнёра МФЦА?',
    options: ['Банк GRAM', 'Сам партнёр с лицензией МФЦА'],
    correct: 1,
    why: 'Активы у партнёра хранит партнёр и отвечает за них он. GRAM только показывает баланс с твоего согласия.',
  },
  {
    q: 'Тебе пишут «из поддержки» и просят seed-фразу для проверки кошелька. Что делать?',
    options: ['Отправить — это же поддержка', 'Не отправлять: это мошенники'],
    correct: 1,
    why: 'Seed-фразу, PIN и коды не спрашивает никто. Такой запрос — всегда мошенничество.',
  },
]

export function RiskTest() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/services'
  const s = useBank()
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const q = QUESTIONS[i]
  const right = picked === q?.correct

  if (s.riskTestPassed)
    return (
      <Screen>
        <Header title="Тест на понимание рисков" />
        <div className="flex flex-1 flex-col items-center px-4 pt-10 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-mint text-[#00663F]">
            <ShieldCheck size={30} />
          </span>
          <h1 className="mt-5 text-[24px] font-extrabold tracking-[-0.02em]">Тест пройден</h1>
          <p className="mt-1 text-ink-2">Обмен ₸ ↔ USDT и партнёры МФЦА доступны.</p>
          <div className="mt-auto w-full pb-6">
            <Button onClick={() => nav(next, { replace: true })}>Продолжить</Button>
          </div>
        </div>
      </Screen>
    )

  return (
    <Screen>
      <Header title="Тест на понимание рисков" />
      <div className="flex flex-1 flex-col px-4">
        <p className="text-sm text-ink-2">Перед обменом USDT и подключением партнёров МФЦА — 3 вопроса о рисках цифровых активов. Так делают брокеры для неквалифицированных инвесторов. Это не экзамен и не награда: мы проверяем, что риски понятны.</p>
        <div className="mt-4 flex gap-1">
          {QUESTIONS.map((_, k) => (
            <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= i ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>
        <div className="mt-5">
          <Badge tone="grey">
            Вопрос {i + 1} из {QUESTIONS.length}
          </Badge>
        </div>
        <h2 className="mt-3 text-[20px] font-bold leading-snug">{q.q}</h2>
        <div className="mt-4 space-y-2">
          {q.options.map((o, k) => (
            <button
              key={k}
              disabled={picked !== null}
              onClick={() => setPicked(k)}
              className={`flex w-full items-center justify-between rounded-xl bg-surface p-4 text-left font-medium ${picked === null ? '' : k === q.correct ? 'ring-2 ring-ok' : k === picked ? 'ring-2 ring-err' : 'opacity-50'}`}
            >
              {o}
              {picked !== null && k === q.correct && <Check size={18} className="text-ok" />}
              {picked === k && k !== q.correct && <X size={18} className="text-err" />}
            </button>
          ))}
        </div>
        {picked !== null && <p className="mt-4 rounded-xl bg-gold-soft p-4 text-sm">{q.why}</p>}
        <div className="mt-auto pb-6 pt-4">
          <Button
            disabled={picked === null}
            onClick={() => {
              if (!right) return setPicked(null)
              if (i < QUESTIONS.length - 1) {
                setI(i + 1)
                setPicked(null)
                return
              }
              s.passRiskTest()
            }}
          >
            {picked === null ? 'Выберите ответ' : !right ? 'Попробовать ещё раз' : i < QUESTIONS.length - 1 ? 'Следующий вопрос' : 'Завершить'}
          </Button>
        </div>
      </div>
    </Screen>
  )
}
