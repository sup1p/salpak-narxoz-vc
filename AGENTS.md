# AGENTS.md — правила работы в репозитории

Для людей и AI-агентов (Claude Code, Codex, Cursor и т. п.). Читать перед любым изменением.

## Проект

Прототип самостоятельного мобильного необанка для Digital Natives 18–24 (хакатон BCC Future Talent, Crypto Neobank Case).

| Документ | Зачем |
|---|---|
| [CONCEPT.md](CONCEPT.md) | Концепция, сегмент, фичи, тестовые данные, метрики — **источник правды по продукту** |
| [USER_STORIES.md](USER_STORIES.md) | Боль → решение → критерии приёмки → метрика |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Цвета, типографика, компоненты, правила UI |
| [docs/superpowers/plans/](docs/superpowers/plans/) | Планы реализации |
| [CHANGELOG.md](CHANGELOG.md) | История версий |

## Git: ветки

- **Никогда не коммитить напрямую в `main`.** `main` всегда собирается и деплоится.
- Одна задача/фича = одна ветка от свежего `main`:

  | Префикс | Когда |
  |---|---|
  | `feat/<scope>` | новая функциональность (`feat/buy-flow`) |
  | `fix/<scope>` | исправление бага |
  | `docs/<scope>` | только документация |
  | `chore/<scope>` | конфиги, зависимости, деплой |
  | `refactor/<scope>` | без изменения поведения |
  | `design/<scope>` | визуал, стили, ассеты |

- Ветки короткоживущие: смержили — удалили.
- Перед стартом: `git checkout main && git pull && git checkout -b feat/<scope>`.

## Git: коммиты

[Conventional Commits](https://www.conventionalcommits.org/), на английском, детально:

```
<type>(<scope>): <что сделано, в повелительном наклонении>

<зачем и как — 1–5 строк; какие user stories закрыты (US-3.1, US-3.4)>
```

- Типы: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `design`.
- Один коммит — одно логическое изменение. Не смешивать рефакторинг и фичу.
- Коммитить часто: тест → реализация → экран — отдельные коммиты.
- Не коммитить: `node_modules/`, `dist/`, `.env*`, секреты, реальные персональные данные.

Пример:
```
feat(gold): add buy flow with 30s quote and receipt breakdown

Implements quoteBuy-based purchase: amount input, live grams,
30-second locked quote with timer ring, and "Из чего цена" receipt.
Closes US-3.1, US-3.2, US-3.3.
```

## Слияние в main

1. Перед слиянием в ветке: `npm test && npm run check:copy && npm run build` — всё зелёное.
2. Обновить `CHANGELOG.md` (раздел `[Unreleased]`).
3. Предпочтительно — Pull Request в `main` (описание: что, зачем, какие US закрыты, скриншот).
4. Если PR недоступен (нет `gh`/времени на хакатоне) — слияние без fast-forward, чтобы история фичи сохранилась:
   ```bash
   git checkout main && git pull && git merge --no-ff feat/<scope> && git push
   ```
5. Удалить ветку: `git branch -d feat/<scope> && git push origin --delete feat/<scope>`.

## Версии и CHANGELOG

- [SemVer](https://semver.org/lang/ru/): `MAJOR.MINOR.PATCH`, версия — в `package.json`.
  - До защиты живём в `0.x`: новая фича → `MINOR`, фикс → `PATCH`.
  - Версия, показанная жюри, — тег `v1.0.0`.
- [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/): каждая ветка дописывает `[Unreleased]` (Added / Changed / Fixed / Removed).
- Релиз: перенести `[Unreleased]` в `[x.y.z] — YYYY-MM-DD`, поднять версию в `package.json`, коммит `chore(release): vX.Y.Z`, тег `git tag vX.Y.Z && git push --tags`.

## Правила продукта (нельзя нарушать)

- **Запрещено в UI:** «доходность», «доход», «прибыль», «заработай», «гарантия», «процент на золото»; «депозит» — только во фразе «это не депозит». Проверяет `npm run check:copy`.
- Никаких реальных денег, персональных данных, ключей, seed-фраз. Все данные — синтетика (`src/data/seed.ts`).
- Отображение: ₸-счета — только в ₸; золото — граммы + ≈ ₸; партнёры — родная валюта + ≈ ₸.
- Повышенный кешбэк — только на траты, никогда на остаток.
- За уроки и квизы — никаких наград.
- Подача: «воспитываем финансовую привычку», **никогда** «подсаживаем». Nestlé — только кейс Японии 1970-х.
- Денежная математика — только в `src/domain/` и только с тестами; цифры из CONCEPT.md §6 закреплены тестами.

## Команды

```bash
npm install
npm run dev          # локально
npm test             # vitest
npm run check:copy   # запрещённые слова
npm run build        # прод-сборка
```
