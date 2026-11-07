// Fails if UI copy contains words banned by AGENTS.md (no yield promises, gold ≠ deposit).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Negations are allowed: «не гарантирует», «не процент на золото» are honest disclaimers.
const BANNED = [/доходност/i, /(^|[^а-яё])доход/i, /прибыл/i, /заработа/i, /(?<!не )гарант/i, /(?<!не )процент на золото/i]
const ALLOW = [/'Это депозит с гарантией\?'/]
const DEPOSIT = /депозит/i
const DEPOSIT_OK = /не депозит|а не депозит|это не депозит|не депозит с гарантией/i

const files = []
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|jsx?)$/.test(f) && !/\.test\./.test(f)) files.push(p)
  }
}
walk('src')

const problems = []
for (const f of files) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (line.trim().startsWith('//')) return
      if (ALLOW.some((a) => a.test(line))) return
      for (const re of BANNED) if (re.test(line)) problems.push(`${f}:${i + 1}  ${re}  →  ${line.trim()}`)
      if (DEPOSIT.test(line) && !DEPOSIT_OK.test(line) && !/'Это депозит с гарантией\?'/.test(line) && !/Да, как вклад/.test(line))
        problems.push(`${f}:${i + 1}  депозит  →  ${line.trim()}`)
    })
}

if (problems.length) {
  console.error('Banned copy found:\n' + problems.join('\n'))
  process.exit(1)
}
console.log(`check:copy OK (${files.length} files)`)
