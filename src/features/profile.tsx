import { motion } from 'framer-motion'
import { AlertTriangle, ChevronRight, Download, FileText, Gift, History as HistoryIcon, Link2, Lock, RotateCcw, Sparkles, Unlock } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONTACTS, LESSONS, PARTNER, USDT_KZT } from '../data/seed'
import { formatGrams, formatKzt, formatNum } from '../domain/money'
import { selectStatus, useBank, type Level } from '../store/useBank'
import { STATUS_LABEL } from '../domain/loyalty'
import { GoldCapsule, Nugget, Sticker } from '../ui/gold'
import { Button, Card, Header, Row, Screen, TestBadge } from '../ui/ui'

function Item({ icon: Icon, title, sub, to }: { icon: typeof Gift; title: string; sub?: string; to: string }) {
  const nav = useNavigate()
  return (
    <Card className="flex items-center justify-between" onClick={() => nav(to)}>
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <div>
          <div className="font-semibold">{title}</div>
          {sub && <div className="text-xs text-ink-2">{sub}</div>}
        </div>
      </div>
      <ChevronRight size={18} className="text-ink-3" />
    </Card>
  )
}

export function Profile() {
  const s = useBank()
  const status = selectStatus(s)
  const nav = useNavigate()
  return (
    <div className="px-5 pb-28 pt-6">
      <div className="flex items-center gap-3">
        <div className="gold-grad grid h-14 w-14 place-items-center rounded-full font-display text-xl font-bold">А</div>
        <div>
          <div className="text-lg font-bold">Айгерим</div>
          <div className="text-xs text-ink-2">Тестовый профиль · статус «{STATUS_LABEL[status]}»</div>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Item icon={Sparkles} title="Кешбэк и Золотой дождь" sub={s.cashbackMode === 'gold' ? 'Сейчас: в золоте' : 'Сейчас: в ₸'} to="/cashback" />
        <Item icon={FileText} title="Налоги и декларация" sub="Готовность к декларации" to="/tax" />
        <Item icon={Gift} title="Позови подарком" sub="Подари другу 0,01 г" to="/invite" />
        <Item icon={Unlock} title="Уровни" sub={{ start: 'Старт', saver: 'Копилка', investor: 'Инвестор' }[s.level]} to="/levels" />
        <Item icon={Link2} title="Партнёры МФЦА" sub={s.level === 'investor' ? (s.partnerConnected ? 'Подключён' : 'Подключить кошелёк') : 'Откроется на уровне «Инвестор»'} to={s.level === 'investor' ? '/partner' : '/levels'} />
        <Item icon={HistoryIcon} title="История операций" to="/history" />
      </div>

      <div className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-3">Демо-панель</div>
      <Card className="mt-2 space-y-3">
        <div className="text-sm">Статус для демо «Золотого дождя»</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button className="h-10 rounded-full bg-white font-semibold" onClick={() => { s.setRegularMonths(0) }}>
            как есть
          </button>
          <button className="h-10 rounded-full bg-white font-semibold" onClick={() => { if (s.cardKzt + s.savingsKzt < 100000) s.topUp(100000 - s.cardKzt - s.savingsKzt) }}>
            → Самородок
          </button>
          <button className="h-10 rounded-full bg-white font-semibold" onClick={() => { s.topUp(Math.max(0, 500000 - s.cardKzt - s.savingsKzt)); s.setRegularMonths(2) }}>
            → Слиток
          </button>
        </div>
        <button onClick={() => { s.reset(); nav('/welcome') }} className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold">
          <RotateCcw size={16} /> Сбросить демо
        </button>
      </Card>
      <div className="mt-4 mb-4">
        <TestBadge />
      </div>
    </div>
  )
}

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
      ['Примечание', 'Тестовые данные. Подсказка, не налоговая консультация.'],
    ]
    const blob = new Blob(['﻿' + rows.map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'altyn-declaration-data.csv'
    a.click()
  }
  return (
    <Screen>
      <Header title="Налоги и декларация" />
      <div className="px-5">
        <h1 className="font-display text-[34px] font-bold uppercase leading-none">Первая декларация? Подготовим.</h1>
        <p className="mt-2 text-sm text-ink-2">Золото — это актив. Мы говорим об этом заранее, а не постфактум, и собираем данные за тебя.</p>
        <Card className="mt-4 bg-ink text-white">
          <div className="text-xs text-white/60">Срок подачи</div>
          <div className="num mt-1 text-3xl font-bold">через {days} дн.</div>
          <div className="text-xs text-white/60">до 15 сентября · напомним за 30 и 7 дней</div>
        </Card>
        <Card className="mt-3">
          <div className="text-sm font-semibold">Форма 250 — активы</div>
          <Row label="Золото (токены)" value={formatGrams(s.gold)} />
          <Row label="Оценка" value={formatKzt(s.gold * s.market, 0)} />
        </Card>
        <Card className="mt-3">
          <div className="text-sm font-semibold">Форма 270 — результат продаж</div>
          <Row label="Результат к средней цене покупки" value={`${s.realizedKzt >= 0 ? '+' : '−'}${formatKzt(Math.abs(s.realizedKzt), 0)}`} />
          <Row label="Подарки друзьям" value={formatGrams(s.giftsOutGrams)} />
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
  const [to, setTo] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const send = (name: string) => {
    const e = s.sendGift(0.01)
    if (e) return setErr('Чтобы подарить 0,01 г, сначала купи немного золота.')
    setTo(name)
  }
  return (
    <Screen>
      <Header title="Позови подарком" />
      <div className="px-5">
        <div className="relative h-40">
          <Nugget size={90} className="absolute left-4 top-2" />
          <Sticker className="absolute right-6 top-6" bg="#FF7AD9" rotate={8}>
            0,01 г другу
          </Sticker>
          <Sticker className="absolute right-16 top-24" bg="#C6F432" rotate={-6}>
            +0,05 г обоим
          </Sticker>
        </div>
        <h1 className="font-display text-[34px] font-bold uppercase leading-none">Пригласи не ссылкой, а золотом</h1>
        <p className="mt-2 text-sm text-ink-2">Друг сразу увидит щепотку золота в своей капсуле. Когда он сделает первую настоящую покупку — вы оба получите по 0,05 г.</p>

        {!to ? (
          <div className="mt-5 space-y-2">
            {CONTACTS.map((c) => (
              <Card key={c.name} className="flex items-center justify-between" onClick={() => send(c.name)}>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-ink-2">{c.phone}</div>
                </div>
                <span className="text-sm font-semibold">Подарить</span>
              </Card>
            ))}
            {err && <p className="text-sm text-err">{err}</p>}
          </div>
        ) : (
          <Card className="mt-5">
            <div className="font-semibold">Подарок для {to} отправлен</div>
            <div className="mt-3 space-y-2 text-sm">
              {['Приглашён', 'Установил приложение', 'Первая покупка → +0,05 г обоим'].map((st, i) => (
                <div key={st} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${i === 0 ? 'bg-ok' : 'bg-line'}`} />
                  {st}
                </div>
              ))}
            </div>
            <Button className="mt-4" variant="secondary" onClick={() => nav('/gift')}>
              Посмотреть глазами друга
            </Button>
          </Card>
        )}
        <p className="mt-4 mb-6 text-[11px] text-ink-3">Награда — только после первой реальной покупки друга. Подарки и бонусы видны в разделе «Налоги»; налог по бонусу удерживает банк как налоговый агент (гипотеза).</p>
      </div>
    </Screen>
  )
}

export function GiftReceived() {
  const nav = useNavigate()
  return (
    <div className="sky flex min-h-full flex-col items-center px-5 pb-10 pt-16 text-center">
      <Sticker bg="#fff" rotate={-4}>
        Айгерим подарила тебе золото
      </Sticker>
      <motion.div className="my-8" initial={{ scale: 0.7, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
        <GoldCapsule grams={0.06} height={200} />
      </motion.div>
      <h1 className="font-display text-[44px] font-bold uppercase leading-[0.95] text-white drop-shadow-[0_2px_0_rgba(11,11,15,.25)]">0,01 г золота — твои</h1>
      <p className="mt-3 text-ink/80">Настоящая доля в слитке пробы 999,9. Забери после регистрации — это 2 минуты.</p>
      <div className="mt-auto w-full">
        <Button onClick={() => nav(-1)}>Забрать подарок</Button>
      </div>
    </div>
  )
}

export function Levels() {
  const s = useBank()
  const nav = useNavigate()
  const bought = s.history.some((o) => o.type === 'buy')
  const levels: { id: Level; title: string; cond: string; opens: string; ok: boolean }[] = [
    { id: 'start', title: 'Старт', cond: 'Сразу', opens: 'Золото от 1000 ₸, кешбэк в золоте, режим Пробы', ok: true },
    { id: 'saver', title: 'Копилка', cond: 'Первая покупка + 2 урока', opens: 'Цели в граммах, автосбережение', ok: bought && s.lessonsDone.length >= 2 },
    { id: 'investor', title: 'Инвестор', cond: `Базовые уроки (${s.lessonsDone.length}/${LESSONS.length}) + 3 месяца`, opens: 'Партнёры МФЦА, обмен ₸ ↔ USDT', ok: s.level === 'investor' },
  ]
  return (
    <Screen>
      <Header title="Уровни" />
      <div className="px-5">
        <h1 className="font-display text-[34px] font-bold uppercase leading-none">Приложение растёт вместе с тобой</h1>
        <div className="mt-5 space-y-2">
          {levels.map((l) => (
            <Card key={l.id} className={s.level === l.id ? 'ring-2 ring-gold' : ''}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">{l.title}</div>
                {l.ok ? <Unlock size={18} /> : <Lock size={18} className="text-ink-3" />}
              </div>
              <div className="text-xs text-ink-2">Условие: {l.cond}</div>
              <div className="mt-1 text-sm">{l.opens}</div>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink-3">Уровень «Инвестор» — проверка готовности (как тест у брокеров), а не награда.</p>
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
        <h1 className="font-display text-[34px] font-bold uppercase leading-none">Все кошельки в одном экране</h1>
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
        {state === 'error' && (
          <div className="mt-3 flex gap-2 rounded-[16px] bg-warn/10 p-4 text-sm text-warn">
            <AlertTriangle size={18} className="shrink-0" /> Партнёр не отвечает, попробуй позже. Мы ничего не подключили.
          </div>
        )}
        <Button className="mt-4" loading={state === 'loading'} onClick={() => connect(false)}>
          Разрешить просмотр · {PARTNER.usdt} USDT ≈ {formatKzt(PARTNER.usdt * USDT_KZT, 0)}
        </Button>
        <button onClick={() => connect(true)} className="mt-2 mb-6 h-10 w-full text-xs text-ink-3">
          демо: партнёр недоступен
        </button>
      </div>
    </Screen>
  )
}

export function History() {
  const h = useBank((s) => s.history)
  return (
    <Screen>
      <Header title="История операций" />
      <div className="space-y-2 px-5 pb-6">
        {h.map((o) => (
          <Card key={o.id} className="flex items-center justify-between py-4">
            <div>
              <div className="font-semibold">{o.title}</div>
              <div className="text-xs text-ink-2">{new Date(o.at).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div className="num text-right text-sm">
              {o.kzt !== 0 && <div className="font-semibold">{`${o.kzt > 0 ? '+' : '−'}${formatKzt(Math.abs(o.kzt), 1)}`}</div>}
              {o.grams !== 0 && <div className={o.kzt !== 0 ? 'text-ink-2' : 'font-semibold'}>{`${o.grams > 0 ? '+' : '−'}${formatNum(Math.abs(o.grams), 6)} г`}</div>}
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  )
}
