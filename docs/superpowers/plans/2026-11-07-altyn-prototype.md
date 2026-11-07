# Altyn — прототип необанка для Digital Natives · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile-first веб-прототип, на котором за 3 минуты демонстрируется сквозной сценарий: онбординг → покупка золота с Рентгеном и ошибкой котировки → кешбэк с «добычей» → продажа → прозрачность хранения → Академия → налоги/подарок/партнёры.

**Architecture:** Чистое SPA без бэкенда. Вся денежная логика — чистые функции в `src/domain/` (покрыты vitest, т.к. цифры жюри проверяет глазами). Состояние — один zustand-store с persist в localStorage и кнопкой «Сбросить демо». Экраны — React-компоненты, роутинг через `HashRouter` (статический хостинг без настроек). Все данные — синтетика из `src/data/seed.ts`.

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind CSS, zustand, framer-motion, react-router-dom (HashRouter), vitest, (опц.) @react-three/fiber + three. Деплой — Vercel.

**Spec:** [CONCEPT.md](../../../CONCEPT.md), [USER_STORIES.md](../../../USER_STORIES.md)

**Таймбокс:** старт 12:50, код заморожен в **15:00**, далее деплой/QR/репетиция. Если задача вылезла за свой бюджет >10 мин — режем по таблице приоритетов внизу.

## Global Constraints

- Цена золота (рынок): **54 800 ₸/г**; спред **0,5%** (покупка ×1,005, продажа ×0,995); комиссия **0,3%, мин. 50 ₸**; мин. покупка **1 000 ₸**; таймер котировки **30 сек**.
- Покупка: `grams = (amountKzt − fee) / (market × 1.005)`, `fee = max(50, amountKzt × 0.003)`. 10 000 ₸ → цена 55 074, комиссия 50, **0,1807 г** (округление граммов до 4 знаков).
- Продажа: `gross = grams × market × 0.995`, `fee = max(50, gross × 0.003)`, `net = gross − fee`. 0,1 г → 54 526 ₸/г, 5 452,6, комиссия 50, **5 402,6 ₸**.
- Кешбэк: на траты картой, ставка по статусу 1% / 1,5% / 2%, `grams = spend × rate / market`; потолок **5 000 ₸/мес** в эквиваленте.
- Статусы по портфелю в банке (карта + сбережения + золото × market, **без партнёров**): Песчинка < 100 000; Самородок 100 000–499 999; Слиток ≥ 500 000 **и** `regularMonths ≥ 2` (иначе Самородок).
- Seed: карта 50 000 ₸, сбережения 13 000 ₸, золото 0,0124 г (средняя цена 53 900), Проба 50 000 ₸, партнёр 120 USDT ≈ 62 400 ₸ (курс 520), слиток KZ-AU-0047-2026 / 1000 г / 999,9 / «Кастодиан (тест)» / аудит 01.10.2026.
- Отображение: ₸-счета только в ₸; золото — граммы крупно + ≈ ₸; партнёр — USDT + ≈ ₸; на общем итоге мелко «≈ N г золота · эквивалент, не золото».
- **Запрещённые слова в UI:** «доходность», «доход», «прибыль», «заработай», «гарантия», «процент на золото»; «депозит» — только в «это не депозит». Никаких seed-фраз, ключей, реальных ПД.
- Тон: на «ты», коротко, один экран — одно действие. Тёмная тема, золотые акценты, крупные цифры, без свечей/стаканов/стриков/лидербордов.
- Каждый экран — в мобильной рамке 390×844 на десктопе, на телефоне — во всю ширину.
- Плашка «Тестовый режим — реальные деньги и данные не используются» в онбординге и в профиле.

## Review Focus

1. **Двойной тап «Подтвердить»** → покупка не должна списаться дважды (кнопка disabled на время операции) — тест в Task 2 (`buy` идемпотентна по `quoteId`).
2. **Котировка истекла ровно в момент подтверждения** → должна показаться ошибка, а не пройти старая цена — тест в Task 2 (`confirmQuote` с `now > expiresAt` возвращает `QUOTE_EXPIRED`).
3. **Ввод суммы с пробелами/запятой («10 000», «1,5»)** → парсится корректно, нечисло — кнопка неактивна — тест в Task 1 (`parseAmount`).
4. **Продажа больше, чем есть / покупка больше баланса** → понятная ошибка, балансы не меняются — тесты в Task 2.
5. **Режим Пробы** → ни одна операция не трогает реальные балансы и историю — тест в Task 2.

---

## File Structure

```
src/
  domain/
    money.ts          # parseAmount, formatKzt, formatGrams, round helpers
    pricing.ts        # quoteBuy, quoteSell, Receipt
    loyalty.ts        # portfolioKzt, statusFor, cashbackGrams
    copy-rules.ts     # BANNED_WORDS (используется тестом текстов)
    *.test.ts
  data/
    seed.ts           # стартовое состояние, цены 30 дней, слиток, уроки
  store/
    useBank.ts        # zustand store + actions
    useBank.test.ts
  ui/                 # Button, Card, Sheet, TabBar, PhoneFrame, Timer, Badge
  features/
    onboarding/       # Intro, Login, RiskQuiz, TopUp
    home/             # Home
    gold/             # Gold, BuyFlow, SellFlow, Receipt (Рентген), QuoteExpired, Success, PriceChart
    capsule/          # GoldCapsule (песок), MiningAnimation, BarInfo, Bar3D (опц.)
    cashback/         # CashbackChoice, PayCoffee
    academy/          # Academy, Lesson, Quiz
    profile/          # Profile, TaxReadiness, InviteGift, GiftReceived, PartnerConnect, Levels
  App.tsx             # HashRouter + routes + TabBar
scripts/check-copy.mjs  # grep запрещённых слов по src/
```

---

### Task 1: Каркас + доменная математика (12:50–13:15)

**Files:**
- Create: проект Vite (React+TS) в корне репо, `tailwind.config.js`, `src/ui/PhoneFrame.tsx`, `src/ui/TabBar.tsx`, `src/App.tsx`
- Create: `src/domain/money.ts`, `src/domain/pricing.ts`, `src/domain/loyalty.ts`, `src/data/seed.ts`
- Test: `src/domain/pricing.test.ts`, `src/domain/loyalty.test.ts`, `src/domain/money.test.ts`

**Interfaces — Produces:**
```ts
// money.ts
parseAmount(input: string): number | null          // "10 000" → 10000, "1,5" → 1.5, "abc" → null
formatKzt(n: number): string                       // 5402.6 → "5 402,6 ₸"; целые без ",0"
formatGrams(g: number): string                     // 0.1807 → "0,1807 г"
// pricing.ts
type Side = 'buy' | 'sell'
interface Receipt { side: Side; market: number; price: number; fee: number;
  grams: number; amountKzt: number; totalKzt: number; quoteId: string; expiresAt: number }
quoteBuy(amountKzt: number, market: number, now: number): Receipt   // totalKzt = amountKzt
quoteSell(grams: number, market: number, now: number): Receipt      // totalKzt = net
QUOTE_TTL_MS = 30_000; MIN_BUY = 1000; SPREAD = 0.005; FEE_RATE = 0.003; MIN_FEE = 50
// loyalty.ts
type Status = 'sand' | 'nugget' | 'bar'     // Песчинка / Самородок / Слиток
portfolioKzt(s: { cardKzt: number; savingsKzt: number; gold: number }, market: number): number
statusFor(portfolio: number, regularMonths: number): Status
CASHBACK_RATE: Record<Status, number>        // 0.01 / 0.015 / 0.02
cashbackGrams(spendKzt: number, status: Status, market: number, usedThisMonthKzt: number): number  // учитывает потолок 5000
```

- [ ] **Step 1: Скаффолд** — `npm create vite@latest . -- --template react-ts`, установить `tailwindcss postcss autoprefixer zustand framer-motion react-router-dom` и dev `vitest`. Скрипт `"test": "vitest run"`.
- [ ] **Step 2: Тесты домена (падают):**
  - `quoteBuy(10000, 54800, 0)` → `price 55074`, `fee 50`, `grams 0.1807`, `expiresAt 30000`.
  - `quoteBuy(100000, 54800, 0).fee` → `300`.
  - `quoteSell(0.1, 54800, 0)` → `price 54526`, `fee 50`, `totalKzt 5402.6`.
  - `statusFor(63679, 0)` → `'sand'`; `statusFor(100000, 0)` → `'nugget'`; `statusFor(500000, 1)` → `'nugget'`; `statusFor(500000, 2)` → `'bar'`.
  - `portfolioKzt({cardKzt:50000, savingsKzt:13000, gold:0.0124}, 54800)` ≈ `63679.5`.
  - `cashbackGrams(1500, 'sand', 54800, 0)` ≈ `0.000274`; `cashbackGrams(1500, 'sand', 54800, 5000)` → `0`.
  - `parseAmount("10 000")` → `10000`; `parseAmount("1,5")` → `1.5`; `parseAmount("abc")` → `null`.
- [ ] **Step 3: Run** `npm test` → FAIL.
- [ ] **Step 4: Реализовать** функции по сигнатурам выше.
- [ ] **Step 5: Run** `npm test` → PASS.
- [ ] **Step 6: Каркас UI** — `PhoneFrame` (390×844 на ≥ 500px, иначе full), `TabBar` (Главная · Золото · Академия · Профиль), `HashRouter` с пустыми экранами. `npm run dev` открывается, табы переключаются.
- [ ] **Step 7: Commit** `feat: scaffold app, domain pricing/loyalty with tests`

---

### Task 2: Store и операции (13:15–13:35)

**Files:** Create `src/store/useBank.ts`, Test `src/store/useBank.test.ts`

**Interfaces — Consumes:** Task 1 domain. **Produces:**
```ts
interface Op { id: string; type: 'topup'|'buy'|'sell'|'cashback'|'gift_in'|'gift_out'|'bonus';
  kzt: number; grams: number; at: number; receipt?: Receipt; sandbox?: boolean }
interface BankState {
  onboarded: boolean; cardKzt: number; savingsKzt: number; gold: number; avgPrice: number;
  sandbox: { on: boolean; cardKzt: number; gold: number };
  cashbackMode: 'kzt'|'gold'; cashbackUsedKzt: number; regularMonths: number;
  level: 'start'|'saver'|'investor'; partnerConnected: boolean;
  lessonsDone: string[]; history: Op[]; lastReceipt?: Receipt; usedQuoteIds: string[];
  market: number;
}
type OpError = 'INSUFFICIENT_FUNDS'|'INSUFFICIENT_GOLD'|'BELOW_MIN'|'QUOTE_EXPIRED'|'DUPLICATE'
// actions
topUp(kzt: number): void
confirmBuy(r: Receipt, now: number): OpError | null
confirmSell(r: Receipt, now: number): OpError | null
payCard(spendKzt: number): { cashbackGrams: number }   // кешбэк в золото или ₸ по cashbackMode
setCashbackMode(m: 'kzt'|'gold'): void
setSandbox(on: boolean): void
bumpMarket(pct: number): void                           // для демо ошибки: market *= 1+pct
completeLesson(id: string): void
connectPartner(): void; setLevel(l: BankState['level']): void; setRegularMonths(n: number): void
sendGift(grams: number): OpError | null
reset(): void
```
`persist` в localStorage (ключ `altyn-demo`), обёрнут в try/catch.

- [ ] **Step 1: Тесты (падают):**
  - `confirmBuy(quoteBuy(10000,…))` → `cardKzt 40000`, `gold 0.0124+0.1807`, `history[0].type 'buy'`, `avgPrice` пересчитана взвешенно.
  - Повторный `confirmBuy` с тем же `quoteId` → `'DUPLICATE'`, балансы не изменились.
  - `confirmBuy(r, r.expiresAt + 1)` → `'QUOTE_EXPIRED'`.
  - Покупка на 60 000 при 50 000 → `'INSUFFICIENT_FUNDS'`; покупка 500 → `'BELOW_MIN'`.
  - `confirmSell` 1 г при 0,0124 → `'INSUFFICIENT_GOLD'`.
  - `setSandbox(true)` + `confirmBuy` → меняется только `sandbox.*`, `history` реальная пуста от операции (op с `sandbox: true` не попадает в реальную историю).
  - `payCard(1500)` при `cashbackMode 'gold'` → `gold` +≈0,000274, op `'cashback'`; при `'kzt'` → `cardKzt` −1500 +15.
- [ ] **Step 2: Run** `npm test` → FAIL. **Step 3:** реализовать. **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: bank store with buy/sell/cashback/sandbox`

---

### Task 3: Онбординг (13:35–13:50) — US-1.1…1.4

**Files:** `src/features/onboarding/{Intro,Login,RiskQuiz,TopUp}.tsx`
- [ ] Intro: 3 слайда (тексты из CONCEPT §5.1), «Далее»/«Пропустить».
- [ ] Login: телефон → OTP (`1111`; иначе «Код не подошёл, попробуй ещё раз») → PIN 4 цифры (любой). Плашка тестового режима.
- [ ] RiskQuiz: 3 вопроса (может ли подешеветь — да; это депозит — нет; кто хранит — хранитель). Неверно → объяснение ≤ 2 предложений + повтор; дальше только при 3/3.
- [ ] TopUp: «Пополнить 50 000 ₸ (тест)» → `onboarded = true` → Home. (Seed уже содержит 50 000, кнопка просто подтверждает и анимирует.)
- [ ] Проверка в браузере: пройти онбординг до главной < 60 сек. **Commit** `feat: onboarding`

---

### Task 4: Главная + экран Золото (13:50–14:05) — US-2.1–2.3, US-6.2, US-6.3

**Files:** `src/features/home/Home.tsx`, `src/features/gold/Gold.tsx`, `src/features/gold/PriceChart.tsx`, `src/features/capsule/GoldCapsule.tsx`, `src/features/capsule/BarInfo.tsx`
- [ ] Home: итог ₸ + мелко «≈ N г золота · эквивалент, не золото»; карточки «Карта», «Сбережения» (только ₸); «Твоё золото» (`GoldCapsule` + граммы + ≈ ₸); статус «Золотого дождя» + «До Самородка — ещё 36 300 ₸»; «Следующий шаг» (одна карточка по состоянию); «Финансовая прокачка N/7»; партнёр (если подключён) с бейджем «Хранится у партнёра, не у банка».
- [ ] GoldCapsule: SVG-капсула, уровень песка = `min(gold, 1)` (для < 1 г) + подпись «ещё X г до первого грамма»; при ≥ 1 г — блок «Слиток» (Bar3D или CSS-fallback, Task 10).
- [ ] Gold: граммы, средняя цена vs текущая «Изменение: +X% (+Y ₸)» нейтральным цветом, `PriceChart` (линия 30 точек из seed, без свечей, подпись «прошлое изменение цены не гарантирует будущего»), `BarInfo` (номер, проба, хранитель, аудит, «1 токен = 1 г», «тестовые данные»), кнопки Купить / Продать.
- [ ] **Commit** `feat: home and gold screens`

---

### Task 5: Покупка/продажа + Рентген + ошибка (14:05–14:30) — US-3.1–3.6, US-4.1

**Files:** `src/features/gold/{BuyFlow,SellFlow,Receipt,QuoteExpired,Success}.tsx`, `src/ui/Timer.tsx`
- [ ] BuyFlow: ввод (`parseAmount`), быстрые 1 000 / 5 000 / 10 000, живые граммы; ошибки `BELOW_MIN` / `INSUFFICIENT_FUNDS` («Не хватает X ₸» + «Пополнить»).
- [ ] «Получить цену» → `quoteBuy` → `Receipt` (Рентген: рынок · спред · комиссия · итог · граммы · хранитель · «актив попадёт в форму 250»; термины «спред», «хранитель» — ссылки на уроки) + `Timer` кольцо 30 сек + демо-кнопка «⏩ ускорить» (ставит `expiresAt = now`).
- [ ] Подтвердить → PIN-шторка → `confirmBuy`. `QUOTE_EXPIRED` → `bumpMarket(0.003)` → QuoteExpired: старая и новая цена рядом, «Подтвердить по новой цене» / «Отменить». Кнопка подтверждения disabled во время операции.
- [ ] Success: анимация досыпания песка + чек.
- [ ] SellFlow: те же компоненты, граммы 25% / 50% / всё, налоговый след «Продажа — событие для формы 270: результат ±X ₸ к средней цене покупки».
- [ ] Проба: если `sandbox.on` — бейдж «Проба» на всех экранах флоу, в Success кнопка «Повторить по-настоящему» (выключает sandbox, повторяет ту же сумму).
- [ ] Проверка: сценарий 10 000 ₸ даёт 0,1807 г; ошибка воспроизводится через «ускорить». **Commit** `feat: buy/sell flow with receipt, expiry error, sandbox`

---

### Task 6: Кешбэк + «добыча» + статусы (14:30–14:45) — US-5.1, US-5.2, US-13.1, US-13.2

**Files:** `src/features/cashback/{CashbackChoice,PayCoffee}.tsx`, `src/features/capsule/MiningAnimation.tsx`
- [ ] CashbackChoice: таблица ₸ vs золото (CONCEPT §5.5), обязательная галочка «Понимаю, что это актив, а не депозит», слово «декларация» видно до выбора; переключение обратно на ₸ всегда доступно.
- [ ] PayCoffee (демо-кнопка «Оплатить кофе 1 500 ₸» на главной): `payCard(1500)` → тост «+0,0003 г» → `MiningAnimation` (framer-motion, частицы падают в капсулу): sand — 12 частиц, nugget — 30 + 3 самородка, bar — 80 на весь экран. Без кирок/слотов.
- [ ] Демо-переключатель статуса в Профиле (`setRegularMonths`, пополнение) — чтобы показать разницу анимаций.
- [ ] **Commit** `feat: gold cashback, mining animation, loyalty statuses`

---

### Task 7: Академия (14:45–14:55) — US-7.1–7.3

**Files:** `src/features/academy/{Academy,Lesson,Quiz}.tsx`, уроки в `src/data/seed.ts`
- [ ] Список 7 уроков (CONCEPT §5.7); готовы полностью: **«Спред и комиссия»**, **«Кто хранит твоё золото»**; остальные — заглушка «скоро».
- [ ] Quiz «Спред» строится по `lastReceipt`: «Сколько ты заплатил сверх рынка?» — варианты: верный = `round(amountKzt − grams × market)` и 2 неверных. Если покупок не было — по примеру 10 000 ₸.
- [ ] Верно → `completeLesson` → прокачка +1. Неверно → объяснение + повтор. **Никаких наград**, нигде «пройди урок — получи».
- [ ] **Commit** `feat: academy with receipt-based quiz`

---

### Task 8: Профиль: налоги, подарок, партнёр, уровни (14:55–15:10) — US-8.2, US-9.1–9.2, US-10.1–10.2

**Files:** `src/features/profile/{Profile,TaxReadiness,InviteGift,GiftReceived,PartnerConnect,Levels}.tsx`
- [ ] TaxReadiness: золото на 31.12 (граммы, ≈ ₸), результат продаж за год, подарки/бонусы отдельной строкой, «до 15 сентября: N дней», кнопка «Скачать выписку» (генерирует CSV через Blob), плашка «подсказка, не налоговая консультация».
- [ ] InviteGift: «Подарить 0,01 г другу» → выбор из 3 фейковых контактов → `sendGift(0.01)` → экран статуса «Приглашён → Установил → Первая покупка» + «+0,05 г обоим после первой покупки друга» + пометка про налог (банк как налоговый агент — гипотеза). GiftReceived — экран друга (капсула со щепоткой, «0,01 г от Айгерим»).
- [ ] Levels: Старт / Копилка / Инвестор с условиями и замками + демо-кнопка «Открыть Инвестор».
- [ ] PartnerConnect (на уровне Инвестор): согласие (что увидим / не увидим / отозвать) → `connectPartner()` → 120 USDT ≈ 62 400 ₸ на главной; демо-ошибка «Партнёр не отвечает» по второй кнопке; абзац партнёрской модели (CONCEPT §5.10).
- [ ] Демо-панель: «Сбросить демо», переключатель статуса, плашка тестового режима.
- [ ] **Commit** `feat: profile — tax readiness, gift invite, partner, levels`

---

### Task 9: Проверка текстов, деплой, QR (15:00–15:15) — US-B2

**Files:** Create `scripts/check-copy.mjs`; `package.json` script `"check:copy"`
- [ ] `check-copy.mjs`: читает все `src/**/*.tsx|ts` (кроме `copy-rules.ts` и тестов), ищет `BANNED_WORDS` (без учёта регистра); «депозит» допустим только в фразе «не депозит». Выход 1 при находке.
- [ ] Run `npm run check:copy && npm test && npm run build` → всё зелёное.
- [ ] Деплой: `npx vercel --prod` (или Netlify drop `dist/`). Сгенерировать QR на URL, вставить в слайды.
- [ ] Прогнать демо-сценарий CONCEPT §8 на телефоне целиком, записать запасное видео экрана.
- [ ] **Commit** `chore: copy check, deploy`

---

### Task 10 (опционально, только если всё выше готово к 14:50): 3D-слиток — US-6.1

**Files:** `src/features/capsule/Bar3D.tsx` (+ `@react-three/fiber three`)
- [ ] Трапециевидный бокс с золотым `meshStandardMaterial`, вращение пальцем, подсвеченный срез = доля `gold / 1000`. Lazy-load. Fallback — CSS `transform: rotateY` по свайпу (сделать первым, 10 мин).

---

## Параллельно (не код, делает команда): презентация

По CONCEPT §15, 10 слайдов, к 15:00 черновик. Нужны: название продукта, 2 цитаты молодёжи, ссылка на интервью Freedom (15.06.2026), QR после Task 9.

## Что режем, если не успеваем (в этом порядке)

1. Task 10 (3D) → только CSS-fallback.
2. GiftReceived (экран друга) → только экран приглашения.
3. Партнёр: ошибка подключения.
4. Академия → 1 урок («Спред») с квизом.
5. SellFlow → кнопка «Продать» с готовым Рентгеном продажи без отдельного ввода.

**Не режем никогда:** онбординг, главная, покупка с Рентгеном и ошибкой котировки, кешбэк с выбором и предупреждением, хранение, деплой.
