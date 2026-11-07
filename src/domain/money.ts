export const round = (n: number, digits: number) => {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/** "10 000" → 10000, "1,5" → 1.5, garbage → null */
export function parseAmount(input: string): number | null {
  const s = input.replace(/[\s ₸г]/g, '').replace(',', '.')
  if (!s || !/^\d*\.?\d+$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const fmt = (n: number, max: number, min = 0) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: min, maximumFractionDigits: max })
    .format(n)
    .replace(/ | /g, ' ')

export const formatKzt = (n: number, digits = 1) => `${fmt(n, digits)} ₸`
export const formatGrams = (g: number, digits = 4) => `${fmt(g, digits, digits)} г`
export const formatNum = (n: number, digits = 0) => fmt(n, digits)
