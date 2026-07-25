// Self-contained notifications fetch for pages other than the calendar —
// GlowUpCalendar already has products/treatments/timezone loaded for its
// own purposes and keeps its own effect; this hook does a small dedicated
// fetch of just what computeNotifications needs, so the bell can drop into
// any header without each page having to load calendar-specific data.
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { detectTimezone } from '../timezone'
import { BASE_TYPES } from '../GlowUpCalendar'
import { computeNotifications } from './notifications'

export function useNotifications(session) {
  const userId = session?.user?.id
  const [products, setProducts] = useState({})
  const [treatments, setTreatments] = useState({})
  const [customTypes, setCustomTypes] = useState({})
  const [timezone, setTimezone] = useState(() => detectTimezone())

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      const results = await Promise.allSettled([
        supabase.from('products').select('id, name, opened_at, expires_at, pao_months').or(`is_catalog.eq.true,user_id.eq.${userId}`),
        supabase.from('treatments').select('*').eq('user_id', userId),
        supabase.from('custom_treatment_types').select('*').eq('user_id', userId),
        supabase.from('profiles').select('timezone').eq('id', userId).single(),
      ])
      if (cancelled) return
      const getValue = (r) => r.status === 'fulfilled' ? (r.value?.data ?? null) : null
      const [pr, tr, ct, profile] = results.map(getValue)

      const prodMap = {}
      ;(pr || []).forEach(p => {
        prodMap[p.id] = { id: p.id, name: p.name, opened_at: p.opened_at || null, expires_at: p.expires_at || null, pao_months: p.pao_months || null }
      })
      setProducts(prodMap)

      const treatMap = {}
      ;(tr || []).forEach(t => {
        if (!treatMap[t.date]) treatMap[t.date] = []
        treatMap[t.date].push({ type: t.type, timeOfDay: t.time_of_day, area: t.area, pre: t.pre_days, post: t.post_days, _dbId: t.id })
      })
      setTreatments(treatMap)

      const ctMap = {}
      ;(ct || []).forEach(t => { ctMap[t.key] = { label: t.label, pre: t.pre_days, post: t.post_days } })
      setCustomTypes(ctMap)

      if (profile?.timezone) setTimezone(profile.timezone)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const allTypes = { ...BASE_TYPES, ...customTypes }
  const notifications = computeNotifications({ products, treatments, allTypes, timezone })
  return { notifications, unreadCount: notifications.length }
}
