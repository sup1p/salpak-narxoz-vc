import { motion } from 'framer-motion'
import { AlertTriangle, Download, Lock, Unlock } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONTACTS, LESSONS, PARTNER, USDT_KZT } from '../data/seed'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { FRIEND_BONUS_G, hasRealBuy, selectLevel, useBank, type Level } from '../store/useBank'
import { GoldCapsule } from '../ui/gold'
import { Badge, Button, Card, Header, Row, Screen } from '../ui/ui'

export function TaxReadiness() {
  const s = useBank()
  const today = new Date()
  const deadline = new Date(today.getFullYear() + (today.getMonth() >= 8 && today.getDate() > 15 ? 1 : 0), 8, 15)
  const days = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
  const download = () => {
    const rows = [
      ['Показатель', 'Значение'],
      ['Актив', 'Токен золота (1 токен = 1 г, проба 999,9)'],
      ['Количество на дату выписки, г', s.gold.toFixed(6)],
      ['Оценка, ₸', (s.gold * s.market).toFixed(2)],
      ['Средняя цена покупки, ₸/г', s.avgPrice.toFixed(2)],
      ['Результат продаж за год, ₸', s.realizedKzt.toFixed(2)],
      ['Подарено друзьям, г', s.giftsOutGrams.toFixed(6)],
      ['Получено бонусов за друзей, г', s.bonusGrams.toFixed(6)],
      ['USDT на дату выписки', s.usdt.toFixed(2)],
      ['Примечание', 'Тестовые данные. Подсказка, не налоговая консультация.'],
    ]
    const blob = new Blob(['﻿' + rows.map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'gram-declaration-data.csv'
    a.click()
    s.track('tax_export')
  }
  return (
    <Screen>
      <Header title="Налоги и декларация" />
      <div className="px-5">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Первая декларация? Подготовим за тебя</h1>
        <p className="mt-2 text-sm text-ink-2">Золото — это актив. Мы говорим об этом заранее, а не постфактум, и собираем данные за тебя.</p>
        <div className="mt-4 bg-ink p-5 text-white">
          <div className="text-xs text-white/60">Срок подачи</div>
          <div className="num mt-1 text-3xl font-bold">через {days} дн.</div>
          <div className="text-xs text-white/60">до 15 сентября · напомним за 30 и 7 дней</div>
        </div>
        <Card className="mt-3">
          <div className="text-sm font-semibold">Форма 250 — активы</div>
          <Row label="Золото (токены)" value={formatGrams(s.gold)} />
          <Row label="Оценка" value={formatKzt(s.gold * s.market, 0)} />
        </Card>
        <Card className="mt-3">
          <div className="text-sm font-semibold">Форма 270 — результат продаж</div>
          <Row label="Результат к средней цене покупки" value={`${s.realizedKzt >= 0 ? '+' : '−'}${formatKzt(Math.abs(s.realizedKzt), 0)}`} />
          <Row label="Подарки друзьям" value={formatGrams(s.giftsOutGrams)} />
          <Row label="Бонусы за друзей (облагаются ИПН)" value={formatGrams(s.bonusGrams)} />
        </Card>
        <Button className="mt-4" onClick={download}>
          <Download size={18} /> Скачать выписку (CSV)
        </Button>
        <p className="mt-3 mb-6 text-[11px] text-ink-3">Это подсказка, а не налоговая консультация. Налоговый режим токена и подарков — гипотеза для проверки юристами.</p>
      </div>
    </Screen>
  )
}

export function InviteGift() {
  const s = useBank()
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const send = (name: string) => {
    const e = s.sendGift(0.01, name)
    if (e) return setErr('Чтобы подарить 0,01 г, сначала купи немного золота.')
    setErr('')
  }
  const invited = new Set(s.invites.map((i) => i.name))
  return (
    <Screen>
      <Header title="Позови подарком" />
      <div className="px-5">
        <div className="flex items-center justify-between rounded-2xl bg-surface p-4">
          <div className="flex flex-col gap-2">
            <Badge tone="gold">0,01 г другу</Badge>
            <Badge tone="green">+0,05 г обоим</Badge>
          </div>
          <img src="/gold/pinch.jpg" alt="" className="gold-img h-20 w-32 object-cover" />
        </div>
        <div className="mt-4" />
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Пригласи друга подарком</h1>
        <p className="mt-2 text-sm text-ink-2">Друг сразу увидит щепотку золота в приложении. Когда он сделает первую настоящую покупку — вы оба получите по 0,05 г.</p>

        <div className="mt-5 space-y-2">
          {CONTACTS.filter((c) => !invited.has(c.name)).map((c) => (
            <Card key={c.name} className="flex items-center justify-between" onClick={() => send(c.name)}>
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-ink-2">{c.phone}</div>
              </div>
              <span className="text-sm font-semibold">Подарить 0,01 г</span>
            </Card>
          ))}
          {err && <p className="text-sm text-err">{err}</p>}
        </div>

        {s.invites.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="text-sm font-semibold">Твои приглашения</div>
            {s.invites.map((inv) => (
              <Card key={inv.name}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{inv.name}</div>
                  <span className={`text-xs font-semibold ${inv.status === 'bought' ? 'text-ok' : 'text-ink-2'}`}>
                    {inv.status === 'bought' ? `+${formatNum(FRIEND_BONUS_G, 2)} г получено` : 'ждём первую покупку'}
                  </span>
                </div>
                <div className="mt-2 flex gap-1.5 text-[11px] text-ink-2">
                  {['Подарок отправлен', 'Установил(а)', 'Первая покупка'].map((st, k) => (
                    <span key={st} className={`rounded-[2px] px-2 py-1 ${k === 0 || inv.status === 'bought' ? 'bg-mint text-ink' : 'bg-white'}`}>
                      {st}
                    </span>
                  ))}
                </div>
                {inv.status === 'invited' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button small variant="secondary" onClick={() => nav('/gift')}>
                      Глазами друга
                    </Button>
                    <Button small onClick={() => s.simulateFriendPurchase(inv.name)}>
                      Демо: друг купил
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        <p className="mt-4 mb-6 text-[11px] text-ink-3">Награда — только после первой реальной покупки друга. Подарки и бонусы видны в разделе «Налоги»; налог по бонусу удерживает банк как налоговый агент (гипотеза).</p>
      </div>
    </Screen>
  )
}

export function GiftReceived() {
  const nav = useNavigate()
  return (
    <div className="flex min-h-full flex-col items-center bg-surface px-5 pb-10 pt-16 text-center">
      <Badge tone="gold">Айгерим подарила тебе золото</Badge>
      <motion.div className="my-8" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
        <GoldCapsule grams={0.06} height={200} />
      </motion.div>
      <h1 className="text-[32px] font-bold leading-tight tracking-[-0.02em]">0,01 г золота — твои</h1>
      <p className="mt-3 text-ink-2">Настоящая доля в слитке пробы 999,9. Забери после регистрации — это 2 минуты.</p>
      <div className="mt-auto w-full">
        <Button onClick={() => nav(-1)}>Забрать подарок</Button>
      </div>
    </div>
  )
}

export function Levels() {
  const s = useBank()
  const nav = useNavigate()
  const bought = hasRealBuy(s)
  const level = selectLevel(s)
  const rank = { start: 0, saver: 1, investor: 2 }
  const levels: { id: Level; title: string; cond: string; opens: string; ok: boolean }[] = [
    { id: 'start', title: 'Старт', cond: 'Сразу', opens: 'Золото от 1000 ₸, кешбэк в золоте, режим Пробы', ok: true },
    { id: 'saver', title: 'Копилка', cond: `Первая покупка ${bought ? '✓' : '—'} + 2 урока (${Math.min(2, s.lessonsDone.length)}/2)`, opens: 'Цели в граммах, автосбережение', ok: rank[level] >= 1 },
    { id: 'investor', title: 'Инвестор', cond: `Все уроки Академии (${s.lessonsDone.length}/${LESSONS.length})`, opens: 'Партнёры МФЦА, обмен ₸ ↔ USDT', ok: rank[level] >= 2 },
  ]
  return (
    <Screen>
      <Header title="Уровни" />
      <div className="px-5">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Приложение растёт вместе с тобой</h1>
        <div className="mt-5 space-y-2">
          {levels.map((l) => (
            <Card key={l.id} className={level === l.id ? 'ring-2 ring-gold' : ''}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">{l.title}</div>
                {l.ok ? <Unlock size={18} /> : <Lock size={18} className="text-ink-3" />}
              </div>
              <div className="text-xs text-ink-2">Условие: {l.cond}</div>
              <div className="mt-1 text-sm">{l.opens}</div>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink-3">Уровни открываются сами, когда выполнены условия. «Инвестор» — проверка готовности (как тест у брокеров), а не награда.</p>
        <Button
          className="mt-4 mb-6"
          variant="secondary"
          onClick={() => {
            s.setLevel('investor')
            nav('/partner')
          }}
        >
          Демо: открыть «Инвестор»
        </Button>
      </div>
    </Screen>
  )
}

export function PartnerConnect() {
  const s = useBank()
  const nav = useNavigate()
  const [state, setState] = useState<'consent' | 'loading' | 'error'>('consent')
  const connect = (fail: boolean) => {
    setState('loading')
    setTimeout(() => {
      if (fail) return setState('error')
      s.connectPartner()
      nav('/home')
    }, 900)
  }
  return (
    <Screen>
      <Header title="Партнёры МФЦА" />
      <div className="px-5">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">Все кошельки в одном экране</h1>
        <p className="mt-2 text-sm text-ink-2">Подключи кошелёк у партнёра МФЦА — увидишь его баланс в общем портфеле. Только просмотр.</p>
        <Card className="mt-4">
          <div className="font-semibold">{PARTNER.name}</div>
          <div className="mt-3 text-sm">
            <div className="font-semibold text-ok">Что мы увидим</div>
            <div className="text-ink-2">Баланс и валюту кошелька</div>
            <div className="mt-2 font-semibold text-err">Что мы НЕ увидим и не сможем</div>
            <div className="text-ink-2">Переводить, продавать, видеть ключи. Seed-фразу никогда не спрашиваем.</div>
            <div className="mt-2 font-semibold">Отозвать доступ</div>
            <div className="text-ink-2">В любой момент в профиле</div>
          </div>
        </Card>
        <Card className="mt-3 text-sm">
          <div className="font-semibold">Кто за что отвечает</div>
          <div className="mt-1 text-ink-2">
            <b>Банк</b> показывает баланс по API с твоего согласия и не хранит эти активы. <b>Партнёр</b> (лицензия МФЦА) хранит активы и отвечает за них. Если партнёр недоступен — покажем последний известный баланс с датой.
          </div>
          <div className="mt-2 text-xs text-ink-3">Активы партнёра не учитываются в статусе «Золотого дождя». Модель — гипотеза для проверки.</div>
        </Card>
        {s.partnerConnected && (
          <Card className="mt-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">Подключено · только просмотр</div>
              <div className="num text-xs text-ink-2">
                {PARTNER.usdt} USDT ≈ {formatKzt(PARTNER.usdt * USDT_KZT, 0)}
              </div>
            </div>
            <Button small variant="secondary" onClick={() => s.revokePartner()}>
              Отозвать доступ
            </Button>
          </Card>
        )}
        {state === 'error' && (
          <div className="mt-3 flex gap-2 rounded-[16px] bg-warn/10 p-4 text-sm text-warn">
            <AlertTriangle size={18} className="shrink-0" /> Партнёр не отвечает, попробуй позже. Мы ничего не подключили.
          </div>
        )}
        {!s.partnerConnected && (
          <>
            <Button className="mt-4" loading={state === 'loading'} onClick={() => connect(false)}>
              Разрешить просмотр · {PARTNER.usdt} USDT ≈ {formatKzt(PARTNER.usdt * USDT_KZT, 0)}
            </Button>
            <button onClick={() => connect(true)} className="mt-2 mb-6 h-10 w-full text-xs text-ink-3">
              демо: партнёр недоступен
            </button>
          </>
        )}
      </div>
    </Screen>
  )
}
