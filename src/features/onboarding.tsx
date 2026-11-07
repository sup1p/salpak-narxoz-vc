import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RISK_QUIZ } from '../data/seed'
import { useBank } from '../store/useBank'
import { BarKeychain, GoldCapsule, Nugget, Sticker } from '../ui/gold'
import { Button, Header, Screen, TestBadge } from '../ui/ui'

const SLIDES = [
  { title: 'ТВОЁ ЗОЛОТО.\nС 1000 ₸', text: 'Копи в настоящем золоте понемногу — без слитков, ячеек и бирж.' },
  { title: 'КЕШБЭК\nВ ГРАММАХ', text: 'Каждая покупка картой добавляет немного золота в твою копилку.' },
  { title: 'НИКАКИХ\nСЮРПРИЗОВ', text: 'Видишь каждый тенге цены, кто хранит слиток и что сказать налоговой.' },
]

export function Intro() {
  const [i, setI] = useState(0)
  const nav = useNavigate()
  const last = i === SLIDES.length - 1
  return (
    <div className="sky relative flex min-h-full flex-col overflow-hidden px-5 pb-10 pt-12">
      {/* sticker collage */}
      <div className="pointer-events-none relative h-[330px]">
        <motion.div className="absolute left-2 top-4" animate={{ rotate: [-8, -4, -8] }} transition={{ repeat: Infinity, duration: 5 }}>
          <BarKeychain size={110} />
        </motion.div>
        <motion.div className="absolute right-6 top-0" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
          <Nugget size={84} />
        </motion.div>
        <Sticker className="absolute right-4 top-[120px]" bg="#00AB75" rotate={8}>
          999,9
        </Sticker>
        <Sticker className="absolute left-[46%] top-[60px]" bg="#D2EEE5" rotate={-10}>
          от 1000 ₸
        </Sticker>
        <Sticker className="absolute left-4 top-[250px]" bg="#fff" rotate={-4}>
          не депозит. честно.
        </Sticker>
        <div className="absolute right-12 top-[180px]">
          <GoldCapsule grams={0.37} height={130} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="mt-auto">
          <h1 className="whitespace-pre-line font-display text-[46px] font-bold uppercase leading-[0.95] text-white drop-shadow-[0_2px_0_rgba(20,21,24,.25)]">
            {SLIDES[i].title}
          </h1>
          <p className="mt-3 text-base text-ink/80">{SLIDES[i].text}</p>
        </motion.div>
      </AnimatePresence>

      <div className="my-5 flex gap-1.5">
        {SLIDES.map((_, k) => (
          <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-6 bg-ink' : 'w-1.5 bg-ink/30'}`} />
        ))}
      </div>
      <Button onClick={() => (last ? nav('/login') : setI(i + 1))}>{last ? 'Начать' : 'Далее'}</Button>
      {!last && (
        <button className="mt-3 h-11 text-sm font-medium text-ink/70" onClick={() => nav('/login')}>
          Пропустить
        </button>
      )}
    </div>
  )
}

export function Login() {
  const nav = useNavigate()
  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [pin, setPin] = useState('')

  const press = (d: string) => {
    setErr('')
    if (step === 'phone') setPhone((p) => (d === '⌫' ? p.slice(0, -1) : p.length < 10 ? p + d : p))
    if (step === 'otp') setCode((p) => (d === '⌫' ? p.slice(0, -1) : p.length < 4 ? p + d : p))
    if (step === 'pin') {
      const next = d === '⌫' ? pin.slice(0, -1) : pin.length < 4 ? pin + d : pin
      setPin(next)
      if (next.length === 4) setTimeout(() => nav('/risk'), 250)
    }
  }
  const submit = () => {
    if (step === 'phone') return setStep('otp')
    if (step === 'otp') {
      if (code !== '1111') return setErr('Код не подошёл, попробуй ещё раз')
      setStep('pin')
    }
  }
  const val = step === 'phone' ? phone : step === 'otp' ? code : pin
  const titles = { phone: 'Твой номер телефона', otp: 'Код из SMS', pin: 'Придумай PIN' }
  const hints = {
    phone: 'Отправим код подтверждения. Номер не проверяется — это тест.',
    otp: 'Тестовый код: 1111',
    pin: '4 цифры для подтверждения операций',
  }
  return (
    <Screen>
      <Header />
      <div className="px-5">
        <h1 className="text-[28px] font-bold leading-tight">{titles[step]}</h1>
        <p className="mt-2 text-sm text-ink-2">{hints[step]}</p>
        <div className="num mt-6 flex h-16 items-center rounded-[16px] bg-surface px-4 text-2xl font-semibold tracking-widest">
          {step === 'phone' && <span className="mr-2 text-ink-3">+7</span>}
          {step === 'pin' ? '●'.repeat(pin.length).padEnd(4, '○') : val || <span className="text-ink-3">{step === 'phone' ? '7__ ___ __ __' : '____'}</span>}
        </div>
        {err && <p className="mt-2 text-sm text-err">{err}</p>}
      </div>
      <div className="mt-4">
        <TestBadge />
      </div>
      <div className="mt-auto px-5 pb-6 pt-4">
        {step !== 'pin' && (
          <Button onClick={submit} disabled={step === 'phone' ? phone.length < 10 : code.length < 4}>
            {step === 'phone' ? 'Получить код' : 'Подтвердить'}
          </Button>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d) =>
            d ? (
              <button key={d} onClick={() => press(d)} className="num h-12 rounded-xl bg-surface text-xl font-semibold active:bg-line">
                {d}
              </button>
            ) : (
              <span key="e" />
            ),
          )}
        </div>
      </div>
    </Screen>
  )
}

export function RiskQuiz() {
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const q = RISK_QUIZ[i]
  const right = picked === q.correct
  const next = () => {
    if (!right) return setPicked(null)
    if (i === RISK_QUIZ.length - 1) return nav('/topup')
    setI(i + 1)
    setPicked(null)
  }
  return (
    <Screen>
      <Header title={`Честно о рисках · ${i + 1}/3`} />
      <div className="px-5">
        <Sticker bg="#F6E7D3" rotate={-3}>
          3 вопроса до старта
        </Sticker>
        <h1 className="mt-5 text-[28px] font-bold leading-tight">{q.q}</h1>
        <div className="mt-6 space-y-3">
          {q.options.map((o, k) => {
            const state = picked === null ? '' : k === q.correct ? 'ring-2 ring-ok' : k === picked ? 'ring-2 ring-err' : 'opacity-50'
            return (
              <button key={k} disabled={picked !== null} onClick={() => setPicked(k)} className={`flex w-full items-center justify-between rounded-[16px] bg-surface p-4 text-left font-medium ${state}`}>
                {o}
                {picked !== null && k === q.correct && <Check className="text-ok" size={20} />}
                {picked === k && k !== q.correct && <X className="text-err" size={20} />}
              </button>
            )
          })}
        </div>
        {picked !== null && <p className="mt-4 rounded-[16px] bg-gold-soft p-4 text-sm">{q.why}</p>}
      </div>
      <div className="mt-auto p-5">
        <Button disabled={picked === null} onClick={next}>
          {picked === null ? 'Выбери ответ' : right ? 'Понятно, дальше' : 'Попробовать ещё раз'}
        </Button>
      </div>
    </Screen>
  )
}

export function TopUp() {
  const nav = useNavigate()
  const finish = useBank((s) => s.finishOnboarding)
  const [done, setDone] = useState(false)
  return (
    <div className="sky flex min-h-full flex-col px-5 pb-10 pt-16">
      <h1 className="font-display text-[44px] font-bold uppercase leading-[0.95] text-white drop-shadow-[0_2px_0_rgba(20,21,24,.25)]">
        Тестовый
        <br />
        баланс готов
      </h1>
      <p className="mt-3 text-ink/80">Мы положили 50 000 ₸ тестовых денег, чтобы ты всё попробовал(а) без риска.</p>
      <motion.div className="mx-auto my-10" initial={{ scale: 0.8, rotate: -6 }} animate={{ scale: done ? 1.05 : 1, rotate: 0 }}>
        <div className="rounded-[28px] bg-ink px-8 py-7 text-white shadow-2xl">
          <div className="text-xs uppercase tracking-widest text-white/60">Карта Altyn · тест</div>
          <div className="num mt-2 text-4xl font-bold">50 000 ₸</div>
          <div className="mt-6 flex justify-between text-xs text-white/60">
            <span>•••• 2026</span>
            <span>ALTYN</span>
          </div>
        </div>
      </motion.div>
      <div className="mt-auto">
        <Button
          onClick={() => {
            setDone(true)
            finish()
            setTimeout(() => nav('/home'), 300)
          }}
        >
          На главную
        </Button>
      </div>
    </div>
  )
}
