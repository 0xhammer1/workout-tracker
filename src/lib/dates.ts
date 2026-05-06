// Returns YYYY-MM-DD in the user's local timezone. The straightforward
// `new Date().toISOString().split('T')[0]` returns UTC, which is off by
// a day for anyone west of UTC after their local evening — e.g. 8pm
// PST on the 5th becomes "2026-05-06" because UTC is already the 6th.
export function localDateStr(d: Date = new Date()): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
