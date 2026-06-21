import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  white: '#FFFFFF', cream: '#FAF7F2', creamDark: '#F3EDE4',
  border: '#E7E0D8', text: '#1C1917', textMuted: '#78716C',
  textLight: '#A8A29E', pink: '#FFD6F9', pinkDeep: '#C93500', orange: '#F97316',
}

const TOOLTIP_TEXT = "Add a new routine when your approach is changing — it preserves your history and lets you track what you used before. Edit when you're correcting a mistake. Think of each routine as a chapter."


function NavMenu() {
  const [open, setOpen] = React.useState(false)
  const links = [
    { label: 'Calendar',           href: '/routine' },
    { label: 'Routine history',    href: '/routine/history' },
    { label: 'Product library',    href: '/routine/products' },
    { label: 'Account & settings', href: '/routine/profile' },
  ]
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(s => !s)}
        style={{ border: `0.5px solid ${open ? T.pinkDeep : T.border}`, background: open ? T.pink : 'transparent', borderRadius: 0, padding: '5px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', width: 36, height: 32 }}>
        <span style={{ display: 'block', width: 14, height: 1.5, background: T.text }} />
        <span style={{ display: 'block', width: 14, height: 1.5, background: T.text }} />
        <span style={{ display: 'block', width: 14, height: 1.5, background: T.text }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, zIndex: 201, minWidth: 180, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            {links.map(l => (
              <a key={l.label} href={l.href}
                style={{ display: 'block', padding: '11px 16px', fontSize: 13, color: T.text, textDecoration: 'none', borderBottom: `0.5px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.cream}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {l.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Btn({ children, onClick, style, variant = 'default' }) {
  const base = { border: 'none', borderRadius: 0, cursor: 'pointer', fontSize: 11, padding: '4px 10px', fontFamily: 'inherit' }
  const variants = {
    default:  { background: T.creamDark, color: T.text, border: `0.5px solid ${T.border}` },
    primary:  { background: T.pinkDeep, color: '#fff' },
    danger:   { background: 'transparent', color: '#9F1239', border: `0.5px solid #FECDD3` },
  }
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>
}

function InfoTooltip({ text }) {
  const [pos, setPos] = useState(null)
  const ref = { current: null }
  function show(e) {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ top: r.top - 8, left: r.left + r.width / 2 })
  }
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
      <span ref={el => ref.current = el} onMouseEnter={show} onMouseLeave={() => setPos(null)}
        onTouchStart={e => { e.stopPropagation(); pos ? setPos(null) : show(e) }}
        style={{ width: 14, height: 14, borderRadius: '50%', background: T.border, color: T.textMuted, fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', userSelect: 'none' }}>i</span>
      {pos && (
        <span style={{ position: 'fixed', top: pos.top, left: Math.min(pos.left, window.innerWidth - 240), transform: 'translate(-50%, -100%)', background: T.text, color: '#fff', fontSize: 11, lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, width: 220, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', pointerEvents: 'none' }}>
          {text}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: 4, borderStyle: 'solid', borderColor: `${T.text} transparent transparent transparent` }} />
        </span>
      )}
    </span>
  )
}

function fmtDate(d) { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${m}/${dd}/${y}` }
function fmtDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, { month:'2-digit', day:'2-digit', year:'numeric', hour:'numeric', minute:'2-digit', hour12:true })
}
function getPeriodLabel(p) {
  const today = new Date(); today.setHours(0,0,0,0)
  const start = new Date(p.startDate + 'T00:00:00')
  const end = p.endDate ? new Date(p.endDate + 'T00:00:00') : null
  if (start > today) return `Upcoming — starts ${fmtDate(p.startDate)}`
  if (!end || end >= today) return `Current (as of ${fmtDate(p.startDate)})`
  return `${fmtDate(p.startDate)} — ${p.endDate ? fmtDate(p.endDate) : '—'}`
}

function navigate(type, data) {
  sessionStorage.setItem('glowup-history-action', JSON.stringify({ type, data }))
  window.location.href = '/routine'
}

export default function RoutineHistory({ session }) {
  const [routineHistory, setRoutineHistory] = useState([])
  const [dailyHistory,   setDailyHistory]   = useState([])
  const [showerHistory,  setShowerHistory]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('skincare')
  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    async function load() {
      const [{ data: rp }, { data: ep }, { data: sp }] = await Promise.all([
        supabase.from('routine_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
        supabase.from('extras_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
        supabase.from('shower_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
      ])
      setRoutineHistory((rp||[]).map(p => ({
        startDate: p.start_date, endDate: p.end_date, activeName: p.active_name,
        tretEnabled: p.tret_enabled, tretFrequency: p.tret_frequency,
        secondaryActives: p.secondary_actives || [], products: p.products || {},
        steps: p.steps || null, _dbId: p.id, createdAt: p.created_at, updatedAt: p.updated_at,
      })))
      setDailyHistory((ep||[]).map(p => ({
        id: p.id, startDate: p.start_date, endDate: p.end_date,
        items: p.items || [], createdAt: p.created_at, updatedAt: p.updated_at,
      })))
      setShowerHistory((sp||[]).map(p => ({
        id: p.id, startDate: p.start_date, endDate: p.end_date,
        items: p.items || [], createdAt: p.created_at, updatedAt: p.updated_at,
      })))
      setLoading(false)
    }
    load()
  }, [userId])

  async function deleteSkincare(p) {
    if (!window.confirm('Delete this skincare routine? This cannot be undone.')) return
    if (p._dbId) await supabase.from('routine_periods').delete().eq('id', p._dbId)
    setRoutineHistory(h => h.filter(x => x._dbId !== p._dbId))
  }
  async function deleteDaily(p) {
    if (!window.confirm('Delete this extras routine? This cannot be undone.')) return
    if (p.id) await supabase.from('extras_periods').delete().eq('id', p.id)
    setDailyHistory(h => h.filter(x => x.id !== p.id))
  }
  async function deleteShower(p) {
    if (!window.confirm('Delete this shower routine? This cannot be undone.')) return
    if (p.id) await supabase.from('shower_periods').delete().eq('id', p.id)
    setShowerHistory(h => h.filter(x => x.id !== p.id))
  }

  const tabs = [
    { key: 'skincare', label: 'Skincare', count: routineHistory.length },
    { key: 'extras',   label: 'Extras',   count: dailyHistory.length   },
    { key: 'shower',   label: 'Shower',   count: showerHistory.length  },
  ]

  function Timestamps({ p }) {
    if (!p.createdAt && !p.updatedAt) return null
    return (
      <div style={{ fontSize: 10, color: T.textLight, fontStyle: 'italic', marginTop: 6, lineHeight: 1.7 }}>
        {p.createdAt && <div>Created: {fmtDateTime(p.createdAt)}</div>}
        {p.updatedAt && p.createdAt && p.updatedAt !== p.createdAt && <div>Last edited: {fmtDateTime(p.updatedAt)}</div>}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: T.cream, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: `0.5px solid ${T.border}`, background: T.white }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.history.back()} style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 0, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.text }}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Full history</div>
        </div>
        <NavMenu />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '16px 20px 8px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '6px 14px', borderRadius: 0, fontSize: 12, cursor: 'pointer',
            border: `0.5px solid ${tab === t.key ? T.pinkDeep : T.border}`,
            background: tab === t.key ? T.pink : T.white,
            color: T.text, fontFamily: 'inherit',
          }}>{t.label} {t.count > 0 && <span style={{ fontSize: 10, color: T.textMuted }}>({t.count})</span>}</button>
        ))}
      </div>

      <div style={{ padding: '8px 20px' }}>
        {loading ? (
          <div style={{ fontSize: 13, color: T.textMuted, padding: '20px 0' }}>Loading...</div>
        ) : (
          <>
            {/* Skincare */}
            {tab === 'skincare' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skincare</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Btn variant="primary" onClick={() => navigate('new-skincare', null)}>+ Start new routine</Btn>
                    <InfoTooltip text={TOOLTIP_TEXT} />
                  </div>
                </div>
                {routineHistory.length === 0
                  ? <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>No skincare routines yet.</div>
                  : routineHistory.map((p, i) => (
                    <div key={i} style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '12px 14px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{getPeriodLabel(p)}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn onClick={() => navigate('edit-skincare', p)}>Edit</Btn>
                          <button onClick={() => deleteSkincare(p)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px' }}>×</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.7 }}>
                        {p.activeName ? p.activeName.charAt(0).toUpperCase() + p.activeName.slice(1) : 'Retinoid'}: {p.tretEnabled ? p.tretFrequency : 'off'}
                        {(p.secondaryActives||[]).filter(sa => sa.enabled).length > 0 && (
                          <span> · {p.secondaryActives.filter(sa => sa.enabled).map(sa => sa.key).join(', ')}</span>
                        )}
                      </div>
                      <Timestamps p={p} />
                    </div>
                  ))
                }
              </>
            )}

            {/* Extras */}
            {tab === 'extras' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Extras</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Btn variant="primary" onClick={() => navigate('new-daily', null)}>+ Start new routine</Btn>
                    <InfoTooltip text={TOOLTIP_TEXT} />
                  </div>
                </div>
                {dailyHistory.length === 0
                  ? <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>No extras routines yet.</div>
                  : dailyHistory.map((p, i) => (
                    <div key={i} style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '12px 14px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{getPeriodLabel(p)}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn onClick={() => navigate('edit-daily', p)}>Edit</Btn>
                          <button onClick={() => deleteDaily(p)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px' }}>×</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{(p.items||[]).map(it => it.label).join(' · ') || 'No items'}</div>
                      <Timestamps p={p} />
                    </div>
                  ))
                }
              </>
            )}

            {/* Shower */}
            {tab === 'shower' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shower</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Btn variant="primary" onClick={() => navigate('new-shower', null)}>+ Start new routine</Btn>
                    <InfoTooltip text={TOOLTIP_TEXT} />
                  </div>
                </div>
                {showerHistory.length === 0
                  ? <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>No shower routines yet.</div>
                  : showerHistory.map((p, i) => (
                    <div key={i} style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '12px 14px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{getPeriodLabel(p)}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn onClick={() => navigate('edit-shower', p)}>Edit</Btn>
                          <button onClick={() => deleteShower(p)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px' }}>×</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{(p.items||[]).map(it => `${it.label}${it.frequency ? ` (${it.frequency})` : ''}`).join(' · ') || 'No items'}</div>
                      <Timestamps p={p} />
                    </div>
                  ))
                }
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
