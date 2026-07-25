// ─── NOTIFICATIONS ───────────────────────────────────────────
// Pure function — computes all current alerts from app state. Shared so
// every page's header can show the same notification bell, not just the
// calendar.
import { todayInTz } from '../timezone'

export function computeNotifications({ products, treatments, allTypes, timezone }) {
  const notes = []
  const today = todayInTz(timezone)

  // ── PAO / expiry warnings ─────────────────────────────────
  const productsArr = Object.values(products || {})
  for (const p of productsArr) {
    if (!p.name) continue

    // Compute expiry date: explicit expires_at wins, then opened_at + pao_months
    let expiryDate = p.expires_at || null
    if (!expiryDate && p.opened_at && p.pao_months) {
      const d = new Date(p.opened_at + 'T00:00:00')
      d.setMonth(d.getMonth() + Number(p.pao_months))
      expiryDate = d.toISOString().split('T')[0]
    }
    if (!expiryDate) continue

    const daysLeft = Math.round((new Date(expiryDate + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000)
    if (daysLeft < 0) {
      notes.push({
        id: `pao-expired-${p.id}`,
        type: 'warning',
        category: 'pao',
        title: `${p.name} has expired`,
        body: `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago. Check if it's still safe to use.`,
        date: expiryDate,
      })
    } else if (daysLeft <= 30) {
      notes.push({
        id: `pao-soon-${p.id}`,
        type: 'info',
        category: 'pao',
        title: `${p.name} expires soon`,
        body: `${daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}. Opened ${p.opened_at ? new Date(p.opened_at + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}.`,
        date: expiryDate,
      })
    }
  }

  // ── Post-recovery nudge ───────────────────────────────────
  for (const [dateKey, entries] of Object.entries(treatments || {})) {
    for (const tx of (Array.isArray(entries) ? entries : [entries])) {
      const cfg = allTypes[tx.type]
      if (!cfg || !cfg.post) continue
      const resumeDate = new Date(dateKey + 'T00:00:00')
      resumeDate.setDate(resumeDate.getDate() + cfg.post + 1)
      const resumeKey = resumeDate.toISOString().split('T')[0]
      if (resumeKey === today) {
        notes.push({
          id: `recovery-${dateKey}-${tx._dbId || tx.type}`,
          type: 'nudge',
          category: 'recovery',
          title: 'Your recovery window ended',
          body: `Your ${cfg.label || tx.type} recovery is over — your full routine resumes tonight.`,
          date: today,
        })
      }
    }
  }

  // Sort: warnings first, then by date descending
  const priority = { warning: 0, nudge: 1, info: 2 }
  return notes.sort((a, b) => (priority[a.type] ?? 3) - (priority[b.type] ?? 3) || b.date.localeCompare(a.date))
}
