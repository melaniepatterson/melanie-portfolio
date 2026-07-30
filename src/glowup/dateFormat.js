// ─── DATE DISPLAY FORMATTING ───────────────────────────────────
// Pure display formatters — no timezone resolution (see timezone.js
// for "what day is it for this user" logic).

// 'YYYY-MM-DD' → 'MM/DD/YYYY'
export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${m}/${d}/${y}`
}

// ISO timestamp → 'MM/DD/YYYY, H:MM AM/PM'
export function fmtDateTime(isoStr) {
  if (!isoStr) return ''
  const dt = new Date(isoStr)
  return dt.toLocaleString(undefined, {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}
