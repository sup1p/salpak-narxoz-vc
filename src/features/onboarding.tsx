import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBank } from '../store/useBank'
import { Button, Header, Screen, TestBadge } from '../ui/ui'

/**
 * Onboarding = login only. After the PIN the user lands on the real home screen
 * with a test balance and an in-app coach-mark tour (see features/tour.tsx).
 * Risks are shown once before the first purchase (RiskFacts in trade.tsx).
 */
export function Login() {
  const nav = useNavigate()
  const finish = useBank((s) => s.finishOnboarding)
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
      if (next.length === 4)
        setTimeout(() => {
          finish()
          nav('/home', { replace: true })
        }, 250)
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
  const titles = { phone: 'Вход в GRAM', otp: 'Код из SMS', pin: 'Придумай PIN-код' }
  const fmtPhone = (p: string) => [p.slice(0, 3), p.slice(3, 6), p.slice(6, 8), p.slice(8, 10)].filter(Boolean).join(' ')
  const hints = {
    phone: 'Золото от 1000 ₸, кешбэк в граммах, прозрачная цена. Введи номер — пришлём код. Это тест, номер не проверяется.',
    otp: 'Тестовый код: 1111',
    pin: '4 цифры для подтверждения операций',
  }
  return (
    <Screen>
      <Header back={false} />
      <div className="px-5">
        <div className="mb-5 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-extrabold text-gold">G</span>
          <span className="text-[15px] font-semibold">GRAM</span>
          <span className="text-xs font-semibold text-green">by BCC</span>
        </div>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">{titles[step]}</h1>
        <p className="mt-2 text-sm text-ink-2">{hints[step]}</p>
        <div className="num mt-6 flex h-14 items-center rounded-xl bg-surface px-4 text-[22px] font-semibold">
          {step === 'phone' && <span className="mr-2 text-ink-3">+7</span>}
          {step === 'pin' ? <span className="tracking-[.4em]">{'●'.repeat(pin.length).padEnd(4, '○')}</span> : val ? (step === 'phone' ? fmtPhone(val) : <span className="tracking-[.4em]">{val}</span>) : <span className="text-ink-3">{step === 'phone' ? '700 000 00 00' : '• • • •'}</span>}
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
