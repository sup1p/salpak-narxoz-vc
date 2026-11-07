# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile web prototype: users and the BCC jury open https://gram-virid-eta.vercel.app on their own phones; on a laptop it renders inside a phone frame (390×844).

## Users

Primary: **Digital Natives 18–24** — a student like Aigerim, 20, Almaty, freelancing 150–200k ₸/month with 80–150k ₸ savings in Kaspi. She opens GRAM between classes or on the bus to put 1–10k ₸ into gold, pay her phone or a QR purchase, and check her cashback. Her job: save without fear and understand exactly what she pays.

Secondary (today): the BCC Future Talent jury, who first see the product in a ~3-minute demo on a phone.

## Product Purpose

GRAM by BCC is a standalone neobank for young people: buy tokenized gold from 1 000 ₸, get card cashback in grams, see a transparent price for every operation, learn the basics in short lessons, and keep all money (card, savings, gold, USDT, other banks, AIFC partners) in one place. Success: activation, first purchase, choosing gold cashback, returns (D1/D7/D30); North Star — share of users who top up two months in a row.

## Positioning

A savings app, not an exchange: the first real asset for a young person, with the full price breakdown ("Рентген цены") and taxes shown before the decision, not after (unlike cashback paid in securities elsewhere).

## Operating Context

Short, frequent mobile sessions; one-handed use; payments by QR at a till; reading a notification about a debit or cashback; occasional deeper dives (gold page, academy, tax data). Demo context: jury opens the link, may toggle «Демо-режим» to show error states.

## Capabilities and Constraints

**Binding constraint (user, 2026-11-07): a redesign must keep ALL existing logic and ALL functions — none may be dropped or changed in behavior.** Visual layer only. **Update (user, 2026-11-07): the full redesign was cancelled — keep the current layout and main flow (DESIGN-SYSTEM.md §14); Impeccable is applied only as small, targeted fixes.** Current feature set (see CONCEPT.md and USER_STORIES.md for detail):

- Login (phone → OTP `1111` → PIN), in-app coach-mark tour over the whole screen.
- Home: total, quick actions (top-up, QR pay, buy gold), gold widget, «Для тебя», accounts (card, savings, USDT, other banks, AIFC partner), Golden Rain cashback card, recent operations with details.
- Gold: buy/sell with 30 s locked quote, «Рентген цены» (market, spread 0.5%, fee 0.3% no minimum, over-market %, custodian, tax trail), expiry error, PIN/Face ID, sandbox «Проба», 3 honest facts before first buy, stages pinch/pile/bar renders, custody & audit, status-drop warning.
- Payments tab: categories, search, recent, pay form with requisite validation and cashback preview, QR scanner (simulated) with manual code.
- Cashback: ₸ or gold with asset acknowledgement, statuses Базовый 1% / Плюс 1.5% / Макс 2% (by bank money + gold at purchase cost, spending only, 5 000 ₸ monthly cap), «Мой кешбэк».
- Messages tab: feed of all operations + bank messages, topic filters, tap opens details in place.
- Services: operations, top-up from other banks, gold, USDT OTC (behind a 3-question risk test), cashback, invite-by-gift (0.005 g, bank-funded), academy (7 lessons, quizzes, no rewards), tax readiness (CSV, forms 250/270), other banks (Open Banking, read-only), AIFC partners (read-only, revoke).
- More: profile, risk test, security, documents & tariffs, support chat, demo panel (metrics, demo mode, status switch, reset).
- Synthetic data only; no real money, personal data, keys or seed phrases. Copy rules: no «доходность/доход/прибыль/гарантия/заработай», «депозит» only as «не депозит» (enforced by `npm run check:copy`).

## Brand Commitments

- Name **GRAM** («GRAM by BCC»); logo `public/logo.svg` (green «G» with a gold-bar cut-out) — binding.
- **BCC colours are binding**: BCC gold (logo family, `#DCA86E` / saturated `#F2AE3A`) and BCC green `#00AB75`. Everything else (type, layout, components, style) may be replaced.
- Voice: friendly «ты», short, honest about risk; never «подсаживаем» — «воспитываем финансовую привычку».

## Evidence on Hand

- Photoreal gold renders: `public/gold/pinch.jpg`, `pile.jpg`, `bar.jpg` (generated for GRAM, no third-party logos).
- Docs: CONCEPT.md, USER_STORIES.md, DESIGN-SYSTEM.md, CHANGELOG.md.
- No real users, testimonials, customers or market data — pilot metrics in the app are labelled synthetic and must stay so.

## Product Principles

1. Honesty before the decision: price, risk and tax are visible before money moves.
2. Small amounts are first-class: 1 000 ₸ must feel as complete as 100 000 ₸.
3. One clear place for every money movement; nothing happens silently.
4. Learning is for the user, never bought with rewards.
5. Grow with the user: today a student, tomorrow the bank's mass-affluent client.

## Accessibility & Inclusion

Text contrast ≥ 4.5:1 (large ≥ 3:1), touch targets ≥ 44 px, honour `prefers-reduced-motion`, Russian-language UI with tenge formatting.
