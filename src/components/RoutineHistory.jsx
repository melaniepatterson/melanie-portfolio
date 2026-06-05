import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  white:    '#FFFFFF',
  cream:    '#FAF7F2',
  creamDark:'#F3EDE4',
  border:   '#E7E0D8',
  text:     '#1C1917',
  textMuted:'#78716C',
  textLight:'#A8A29E',
  pink:     '#FFD6F9',
  pinkDeep: '#C93500',
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${m}/${d}/${y}`
}

function fmtDateTime(isoStr) {
  if (!isoStr) return ''
  const dt = new Date(isoStr)
  return dt.toLocaleString(undefined, {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function getPeriodStatus(p) {
  const today = new Date(); today.setHours(0,0,0,0)
  const start = new Date(p.startDate + 'T00:00:00')
  const end   = p.endDate ? new Date(p.endDate + 'T00:00:00') : null
  if (start > today) return 'upcoming'
  if (!end || end >= today) return 'current'
  return 'past'
}

function PeriodCard({ label, dateStr, endDateStr, createdAt, updatedAt, children }) {
  const status = getPeriodStatus({ startDate: dateStr, endDate: endDateStr })
  const statusLabel = status === 'current'
    ? `Current (as of ${fmtDate(dateStr)})`
    : status === 'upcoming'
    ? `Upcoming — starts ${fmtDate(dateStr)}`
    : `${fmtDate(dateStr)} — ${endDateStr ? fmtDate(endDateStr) : '—'}`

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{statusLabel}</div>
      {children && <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.7, marginBottom: 4 }}>{children}</div>}
      {(createdAt || updatedAt) && (
        <div style={{ fontSize: 10, color: T.textLight, fontStyle: 'italic', lineHeight: 1.8, marginTop: 6 }}>
          {createdAt && <div>Created: {fmtDateTime(createdAt)}</div>}
          {updatedAt && createdAt && updatedAt !== createdAt && <div>Last edited: {fmtDateTime(updatedAt)}</div>}
        </div>
      )}
    </div>
  )
}

export default function RoutineHistory({ session }) {
  const [routineHistory,  setRoutineHistory]  = useState([])
  const [dailyHistory,    setDailyHistory]    = useState([])
  const [showerHistory,   setShowerHistory]   = useState([])
  const [loading,         setLoading]         = useState(true)
  const [tab,             setTab]             = useState('skincare')
  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    async function load() {
      const [{ data: rp }, { data: ep }, { data: sp }] = await Promise.all([
        supabase.from('routine_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
        supabase.from('extras_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
        supabase.from('shower_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
      ])
      setRoutineHistory((rp || []).map(p => ({
        startDate: p.start_date, endDate: p.end_date,
        activeName: p.active_name, tretEnabled: p.tret_enabled,
        tretFrequency: p.tret_frequency, tretStartDate: p.tret_start_date,
        secondaryActives: p.secondary_actives || [],
        createdAt: p.created_at, updatedAt: p.updated_at,
      })))
      setDailyHistory((ep || []).map(p => ({
        startDate: p.start_date, endDate: p.end_date,
        items: p.items || [], createdAt: p.created_at, updatedAt: p.updated_at,
      })))
      setShowerHistory((sp || []).map(p => ({
        startDate: p.start_date, endDate: p.end_date,
        items: p.items || [], createdAt: p.created_at, updatedAt: p.updated_at,
      })))
      setLoading(false)
    }
    load()
  }, [userId])

  const tabs = [
    { key: 'skincare', label: 'Skincare', count: routineHistory.length },
    { key: 'extras',   label: 'Extras',   count: dailyHistory.length   },
    { key: 'shower',   label: 'Shower',   count: showerHistory.length  },
  ]

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: T.cream, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: `0.5px solid ${T.border}`, background: T.white }}>
        <button
          onClick={() => window.location.href = '/routine'}
          style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.text }}
        >←</button>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Full history</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '16px 20px 8px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: `0.5px solid ${tab === t.key ? T.pinkDeep : T.border}`,
            background: tab === t.key ? T.pink : T.white,
            color: T.text, fontFamily: 'inherit',
          }}>
            {t.label} {t.count > 0 && <span style={{ fontSize: 10, color: T.textMuted }}>({t.count})</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 20px' }}>
        {loading ? (
          <div style={{ fontSize: 13, color: T.textMuted, padding: '20px 0' }}>Loading...</div>
        ) : (
          <>
            {tab === 'skincare' && (
              routineHistory.length === 0
                ? <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic', padding: '20px 0' }}>No skincare routines yet.</div>
                : routineHistory.map((p, i) => (
                  <PeriodCard key={i} dateStr={p.startDate} endDateStr={p.endDate} createdAt={p.createdAt} updatedAt={p.updatedAt}>
                    <span>{p.activeName ? p.activeName.charAt(0).toUpperCase() + p.activeName.slice(1) : 'Retinoid'}: {p.tretEnabled ? p.tretFrequency : 'off'}</span>
                    {(p.secondaryActives || []).filter(sa => sa.enabled).length > 0 && (
                      <span> · {p.secondaryActives.filter(sa => sa.enabled).map(sa => sa.key).join(', ')}</span>
                    )}
                  </PeriodCard>
                ))
            )}
            {tab === 'extras' && (
              dailyHistory.length === 0
                ? <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic', padding: '20px 0' }}>No extras routines yet.</div>
                : dailyHistory.map((p, i) => (
                  <PeriodCard key={i} dateStr={p.startDate} endDateStr={p.endDate} createdAt={p.createdAt} updatedAt={p.updatedAt}>
                    {(p.items || []).map(it => it.label).join(' · ') || 'No items'}
                  </PeriodCard>
                ))
            )}
            {tab === 'shower' && (
              showerHistory.length === 0
                ? <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic', padding: '20px 0' }}>No shower routines yet.</div>
                : showerHistory.map((p, i) => (
                  <PeriodCard key={i} dateStr={p.startDate} endDateStr={p.endDate} createdAt={p.createdAt} updatedAt={p.updatedAt}>
                    {(p.items || []).map(it => `${it.label}${it.frequency ? ` (${it.frequency})` : ''}`).join(' · ') || 'No items'}
                  </PeriodCard>
                ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
