import { BarChart3, FileText, Fingerprint, HelpCircle, KeyRound, RotateCcw, ShieldCheck, Unlock, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STATUS_LABEL } from '../domain/loyalty'
import { selectLevel, selectStatus, useBank } from '../store/useBank'
import { Badge, Header, List, ListRow, PageTitle, Screen, SectionTitle, TabPage, TestBadge, Toast } from '../ui/ui'

const LEVEL_LABEL = { start: 'Старт', saver: 'Копилка', investor: 'Инвестор' } as const

/** «Ещё» tab: profile and everything secondary (DESIGN-SYSTEM §13). */
export function More() {
  const s = useBank()
  const nav = useNavigate()
  const status = selectStatus(s)
  const level = selectLevel(s)
  const [toast, setToast] = useState('')
  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <TabPage>
      <Toast show={!!toast}>{toast}</Toast>
      <PageTitle>Ещё</PageTitle>
      <div className="px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#D5D6DB] text-lg font-semibold text-[#4A4D55]">А</span>
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-semibold">Айгерим</div>
            <div className="text-[13px] text-ink-2">+7 701 ••• 45 67 · тестовый профиль</div>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Badge tone="gold">Статус: {STATUS_LABEL[status]}</Badge>
          <Badge tone="green">Уровень: {LEVEL_LABEL[level]}</Badge>
        </div>

        <SectionTitle>Профиль</SectionTitle>
        <List>
          <ListRow icon={User} title="Личные данные" sub="Имя, телефон" onClick={() => flash('В прототипе данные тестовые')} />
          <ListRow icon={Unlock} title="Уровни" sub={LEVEL_LABEL[level]} onClick={() => nav('/levels')} />
          <ListRow icon={BarChart3} title="Метрики гипотезы" sub="Активация, покупка, кешбэк, возвраты" onClick={() => nav('/metrics')} />
        </List>

        <SectionTitle>Безопасность и документы</SectionTitle>
        <List>
          <ListRow icon={ShieldCheck} title="Безопасность" sub="PIN, Face ID, мошенники" onClick={() => nav('/security')} />
          <ListRow icon={FileText} title="Документы и тарифы" sub="Спред, комиссии, хранение, риски" onClick={() => nav('/documents')} />
          <ListRow icon={HelpCircle} title="Поддержка" sub="Ответим в чате — в прототипе недоступно" onClick={() => flash('Поддержка в прототипе недоступна')} />
        </List>

        <SectionTitle>Демо для защиты</SectionTitle>
        <div className="rounded-2xl bg-surface p-4">
          <div className="text-sm text-ink-2">Статус «Золотого дождя»</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button className="h-10 rounded-xl bg-white text-sm font-medium" onClick={() => s.setRegularMonths(0)}>
              Как есть
            </button>
            <button className="h-10 rounded-xl bg-white text-sm font-medium" onClick={() => s.cardKzt + s.savingsKzt < 100000 && s.topUp(100000 - s.cardKzt - s.savingsKzt)}>
              Самородок
            </button>
            <button
              className="h-10 rounded-xl bg-white text-sm font-medium"
              onClick={() => {
                s.topUp(Math.max(0, 500000 - s.cardKzt - s.savingsKzt))
                s.setRegularMonths(2)
              }}
            >
              Слиток
            </button>
          </div>
          <button
            onClick={() => {
              s.reset()
              nav('/welcome')
            }}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-err"
          >
            <RotateCcw size={16} /> Сбросить демо
          </button>
        </div>
      </div>
      <div className="mt-4">
        <TestBadge />
      </div>
    </TabPage>
  )
}

export function Security() {
  const [face, setFace] = useState(true)
  return (
    <Screen>
      <Header title="Безопасность" />
      <div className="px-4">
        <List className="!bg-surface">
          <ListRow icon={KeyRound} title="PIN-код" sub="4 цифры для входа и операций" chevron={false} right={<Badge tone="green">Включён</Badge>} />
          <ListRow
            icon={Fingerprint}
            title="Face ID"
            sub="Подтверждение операций"
            chevron={false}
            right={
              <button
                role="switch"
                aria-checked={face}
                onClick={() => setFace(!face)}
                className={`relative h-7 w-12 rounded-full transition ${face ? 'bg-green' : 'bg-line'}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${face ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            }
          />
        </List>
        <div className="mt-4 rounded-2xl bg-gold-soft p-4 text-sm leading-snug">
          Банк, партнёры и поддержка <b>никогда</b> не спрашивают seed-фразу, PIN и коды из SMS. Если просят — это мошенники.
        </div>
      </div>
    </Screen>
  )
}

const DOCS = [
  { t: 'Тарифы', d: 'Спред 0,5% от рыночной цены при покупке и продаже. Комиссия 0,3% от суммы, минимум 50 ₸. Минимальная покупка 1 000 ₸. Цена фиксируется на 30 секунд.' },
  { t: 'Хранение золота', d: '1 токен = 1 г золота пробы 999,9 в слитке с номером. Слиток хранит независимый хранитель (кастодиан), аудит — раз в квартал.' },
  { t: 'Кешбэк и статусы', d: 'Кешбэк начисляется только за покупки картой: 1% / 1,5% / 2% по статусу. Лимит 5 000 ₸ в месяц. На остаток ничего не начисляется.' },
  { t: 'Риски', d: 'Золото — актив, а не депозит: цена может снижаться, актив не застрахован как вклад. Продажа сразу после покупки — минус спред и комиссия.' },
  { t: 'Налоги', d: 'Золото и USDT отражаются в декларации (форма 250), продажи и бонусы — в форме 270. Срок — до 15 сентября. Это подсказка, не налоговая консультация.' },
  { t: 'Партнёры МФЦА', d: 'Только просмотр баланса с согласия клиента. Активы хранит партнёр, он же за них отвечает. Согласие можно отозвать в любой момент.' },
]

export function Documents() {
  const [open, setOpen] = useState<string | null>('Тарифы')
  return (
    <Screen>
      <Header title="Документы и тарифы" />
      <div className="space-y-2 px-4 pb-6">
        {DOCS.map((x) => (
          <div key={x.t} className="rounded-2xl bg-surface">
            <button onClick={() => setOpen(open === x.t ? null : x.t)} className="flex w-full items-center justify-between p-4 text-left text-[15px] font-semibold" aria-expanded={open === x.t}>
              {x.t}
              <span className="text-ink-3">{open === x.t ? '−' : '+'}</span>
            </button>
            {open === x.t && <p className="px-4 pb-4 text-sm leading-snug text-ink-2">{x.d}</p>}
          </div>
        ))}
        <p className="pt-2 text-xs text-ink-3">Условия — гипотеза прототипа; регуляторная модель проверяется отдельно.</p>
      </div>
    </Screen>
  )
}
