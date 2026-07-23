import React, { useState, useEffect, useRef } from 'react'
import GlowUpLogo from './GlowUpWordmark'
import SideMenu from './SideMenu'
import { supabase } from '../lib/supabase'
import T from './theme'
import { useConfirm } from './shared/useConfirm'
import Btn from './shared/Btn'
import { fmtDate, fmtDateTime } from './dateFormat'
import InfoTooltip from './shared/InfoTooltip'
import {
  RoutinePeriodForm, DailyEditor, ShowerEditor,
  getActivePeriod, getActiveDailyPeriod, getActiveShowerPeriod,
} from './GlowUpCalendar'


const TOOLTIP_TEXT = "Add a new routine when your approach is changing — it preserves your history and lets you track what you used before. Edit when you're correcting a mistake. Think of each routine as a chapter."

const CONTENT_WIDTH = 900 // matches the calendar page's content column


function getPeriodLabel(p) {
  const today = new Date(); today.setHours(0,0,0,0)
  const start = new Date(p.startDate + 'T00:00:00')
  const end = p.endDate ? new Date(p.endDate + 'T00:00:00') : null
  if (start > today) return `Upcoming — starts ${fmtDate(p.startDate)}`
  if (!end || end >= today) return `Current (as of ${fmtDate(p.startDate)})`
  return `${fmtDate(p.startDate)} — ${p.endDate ? fmtDate(p.endDate) : '—'}`
}

// Editing an existing period still hands off to the Calendar page — it
// already owns the day-by-day view that makes an edit meaningful to see.
function navigate(type, data) {
  sessionStorage.setItem('glowup-history-action', JSON.stringify({ type, data }))
  window.location.href = '/routine'
}

export default function RoutineHistory({ session }) {
  const [confirmDialog, confirm] = useConfirm()
  const [routineHistory, setRoutineHistory] = useState([])
  const [dailyHistory,   setDailyHistory]   = useState([])
  const [showerHistory,  setShowerHistory]  = useState([])
  const [products,       setProducts]       = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('skincare')
  const [showMenu, setShowMenu] = useState(false)
  const [newForm, setNewForm] = useState(null) // { type: 'skincare'|'daily'|'shower', editing }
  const catalogIds = useRef(new Set())
  const userId = session?.user?.id

  async function load() {
    const [{ data: rp }, { data: ep }, { data: sp }, { data: pr }] = await Promise.all([
      supabase.from('routine_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
      supabase.from('extras_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
      supabase.from('shower_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
      supabase.from('products').select('*').or(`is_catalog.eq.true,user_id.eq.${userId}`),
    ])
    setRoutineHistory((rp||[]).map(p => ({
      startDate: p.start_date, endDate: p.end_date, activeName: p.active_name,
      tretEnabled: p.tret_enabled, tretFrequency: p.tret_frequency, tretStartDate: p.tret_start_date,
      tretFrequencyHistory: p.tret_frequency_history || [],
      secondaryActives: p.secondary_actives || [], products: p.products || {},
      bhaEnabled: p.bha_enabled || false, bhaFrequency: p.bha_frequency || 1, bhaStartDay: p.bha_start_day ?? 6,
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
    const prodMap = {}
    catalogIds.current = new Set()
    ;(pr || []).forEach(p => {
      if (p.is_catalog) catalogIds.current.add(p.id)
      prodMap[p.id] = {
        id: p.id, name: p.name, brand: p.brand, category: p.category,
        imageUrl: p.image_url, purchaseUrl: p.purchase_url, bdsCompliant: p.bds_compliant,
        effectivenessAvg: p.effectiveness_avg || 0,
        tags: (p.tags || []).map(t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t),
        notes: p.notes || '', ingredient_category: p.ingredient_category || '', ingredient_form: p.ingredient_form || '',
        black_owned: p.black_owned || false, indigenous_owned: p.indigenous_owned || false, poc_owned: p.poc_owned || false,
        woman_owned: p.woman_owned || false, lgbtq_owned: p.lgbtq_owned || false, cruelty_free: p.cruelty_free || false,
        vegan: p.vegan || false, certified_organic: p.certified_organic || false, fair_trade: p.fair_trade || false,
        clean_formula: p.clean_formula || false, science_backed: p.science_backed || false, is_prescription: p.is_prescription || false,
        _isCatalog: p.is_catalog || false, store_name: p.store_name || '', direct_url: p.direct_url || '',
        direct_store_name: p.direct_store_name || '', description: p.description || '', ingredients: p.ingredients || '',
      }
    })
    setProducts(prodMap)
    setLoading(false)
  }

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  async function saveProduct(product) {
    if (catalogIds.current.has(product.id)) return
    const row = {
      id: product.id || undefined, user_id: userId, is_catalog: false,
      name: product.name, brand: product.brand || '', category: product.category,
      image_url: product.imageUrl, purchase_url: product.purchaseUrl, bds_compliant: product.bdsCompliant,
      tags: product.tags || [], notes: product.notes || '',
      ingredient_category: product.ingredient_category || null, ingredient_form: product.ingredient_form || null,
      store_name: product.store_name || null, direct_url: product.direct_url || null, direct_store_name: product.direct_store_name || null,
      description: product.description || null, ingredients: product.ingredients || null,
      black_owned: product.black_owned || false, indigenous_owned: product.indigenous_owned || false, poc_owned: product.poc_owned || false,
      woman_owned: product.woman_owned || false, lgbtq_owned: product.lgbtq_owned || false, cruelty_free: product.cruelty_free || false,
      vegan: product.vegan || false, certified_organic: product.certified_organic || false, fair_trade: product.fair_trade || false,
      clean_formula: product.clean_formula || false, science_backed: product.science_backed || false, is_prescription: product.is_prescription || false,
    }
    const { data: saved } = await supabase.from('products').upsert(row, { onConflict: 'name,brand' }).select().single()
    if (saved) setProducts(p => ({ ...p, [saved.id]: { ...product, id: saved.id, _isCatalog: false } }))
  }

  // Opens the full-page "start new routine" overlay for whichever tab is active
  function openNewForm() {
    if (tab === 'skincare') setNewForm({ type: 'skincare', editing: null })
    else if (tab === 'extras') {
      const current = getActiveDailyPeriod(new Date(), dailyHistory)
      setNewForm({ type: 'daily', editing: current ? { ...current, startDate: '', endDate: null, id: null } : null })
    } else {
      const current = getActiveShowerPeriod(new Date(), showerHistory)
      setNewForm({ type: 'shower', editing: current ? { ...current, startDate: '', endDate: null, id: null } : null })
    }
  }

  async function saveNewSkincare(form) {
    const row = {
      user_id: userId, start_date: form.startDate, end_date: form.endDate || null,
      active_name: form.activeName, tret_enabled: form.tretEnabled,
      tret_frequency: form.tretFrequency, tret_start_date: form.tretStartDate || null,
      secondary_actives: form.secondaryActives || [], products: form.products || {},
      steps: form.steps || null,
    }
    await supabase.from('routine_periods').insert(row)
    setNewForm(null)
    load()
  }
  async function saveNewDaily(form) {
    const id = form.id || crypto.randomUUID()
    const row = { id, user_id: userId, start_date: form.startDate, end_date: form.endDate || null, items: form.items || [], updated_at: new Date().toISOString() }
    await supabase.from('extras_periods').upsert(row)
    setNewForm(null)
    load()
  }
  async function saveNewShower(form) {
    const id = form.id || crypto.randomUUID()
    const row = { id, user_id: userId, start_date: form.startDate, end_date: form.endDate || null, items: form.items || [], updated_at: new Date().toISOString() }
    await supabase.from('shower_periods').upsert(row)
    setNewForm(null)
    load()
  }

  async function deleteSkincare(p) {
    if (!await confirm({ title: 'Delete this skincare routine?', message: 'This cannot be undone.' })) return
    if (p._dbId) await supabase.from('routine_periods').delete().eq('id', p._dbId)
    setRoutineHistory(h => h.filter(x => x._dbId !== p._dbId))
  }
  async function deleteDaily(p) {
    if (!await confirm({ title: 'Delete this extras routine?', message: 'This cannot be undone.' })) return
    if (p.id) await supabase.from('extras_periods').delete().eq('id', p.id)
    setDailyHistory(h => h.filter(x => x.id !== p.id))
  }
  async function deleteShower(p) {
    if (!await confirm({ title: 'Delete this shower routine?', message: 'This cannot be undone.' })) return
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', background: T.text }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.history.back()} style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.white }}>←</button>
          <GlowUpLogo size={32} style={{ color: T.white }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn variant="primary" style={{ background: T.darkGreen, color: T.white }} onClick={openNewForm}>+ Start new routine</Btn>
          <button onClick={() => setShowMenu(true)}
            style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '5px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', width: 36, height: 32 }}>
            <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
            <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
            <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
          </button>
        </div>
        {showMenu && <SideMenu session={session} onClose={() => setShowMenu(false)} />}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '16px 20px 8px', maxWidth: CONTENT_WIDTH, margin: '0 auto', boxSizing: 'border-box' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '6px 14px', borderRadius: T.radius.pill, fontSize: 12, cursor: 'pointer',
            border: 'none',
            background: tab === t.key ? T.darkGreen : '#EBFBF2',
            color: tab === t.key ? T.white : T.text, fontFamily: 'inherit',
          }}>{t.label} {t.count > 0 && <span style={{ fontSize: 10, color: tab === t.key ? 'rgba(255,255,255,0.75)' : T.textMuted }}>({t.count})</span>}</button>
        ))}
      </div>

      <div style={{ padding: '8px 20px', maxWidth: CONTENT_WIDTH, margin: '0 auto', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ fontSize: 13, color: T.textMuted, padding: '20px 0' }}>Loading...</div>
        ) : (
          <>
            {/* Skincare */}
            {tab === 'skincare' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skincare</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <InfoTooltip text={TOOLTIP_TEXT} />
                  </div>
                </div>
                {routineHistory.length === 0
                  ? <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>No skincare routines yet.</div>
                  : routineHistory.map((p, i) => (
                    <div key={i} style={{ background: T.green, borderRadius: T.radius.card, padding: '12px 14px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{getPeriodLabel(p)}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn style={{ borderColor: T.white, color: T.white }} onClick={() => navigate('edit-skincare', p)}>Edit</Btn>
                          <button onClick={() => deleteSkincare(p)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.white, opacity: 0.7, fontSize: 16, padding: '0 4px' }}>×</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: T.white, opacity: 0.85, lineHeight: 1.7 }}>
                        {(() => {
                          const steps = p.steps
                          if (steps) {
                            const amSteps = (steps.am || []).map(s => s.label).filter(Boolean)
                            const pmSteps = (steps.pm || []).map(s => s.label).filter(Boolean)
                            return (
                              <>
                                {amSteps.length > 0 && <div>AM: {amSteps.join(' · ')}</div>}
                                {pmSteps.length > 0 && <div>PM: {pmSteps.join(' · ')}</div>}
                                {p.bhaEnabled && <div>AHA/BHA: {p.bhaFrequency}× per week</div>}
                                {p.tretEnabled && <div>{p.activeName ? p.activeName.charAt(0).toUpperCase() + p.activeName.slice(1) : 'Tretinoin'}: {p.tretFrequency}</div>}
                              </>
                            )
                          }
                          // Fallback for older periods without steps object
                          return (
                            <div>{p.tretEnabled
                              ? `${p.activeName ? p.activeName.charAt(0).toUpperCase() + p.activeName.slice(1) : 'Tretinoin'}: ${p.tretFrequency}`
                              : 'Basic routine'
                            }</div>
                          )
                        })()}
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
                          <Btn style={{ borderColor: T.darkGreen, color: T.darkGreen }} onClick={() => navigate('edit-daily', p)}>Edit</Btn>
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
                          <Btn style={{ borderColor: T.darkGreen, color: T.darkGreen }} onClick={() => navigate('edit-shower', p)}>Edit</Btn>
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

      {/* "+ Start new routine" — fullscreen takeover, no border, mint green */}
      {newForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: T.green, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '64px 20px 48px' }}>
            {newForm.type === 'skincare' && (
              <RoutinePeriodForm
                initial={{ ...(newForm.editing || getActivePeriod(new Date(), routineHistory)), startDate: '' }}
                onSave={saveNewSkincare}
                onCancel={() => setNewForm(null)}
                isFirst={routineHistory.length === 0}
                allPeriods={routineHistory}
                products={products}
                onSaveProduct={saveProduct}
                onEditConflict={(p) => setNewForm({ type: 'skincare', editing: p })}
                userId={userId}
              />
            )}
            {newForm.type === 'daily' && (
              <DailyEditor
                initial={newForm.editing}
                onSave={saveNewDaily}
                onCancel={() => setNewForm(null)}
                allPeriods={dailyHistory}
                onEditConflict={(p) => setNewForm({ type: 'daily', editing: p })}
                products={products}
                onSaveProduct={saveProduct}
                userId={userId}
              />
            )}
            {newForm.type === 'shower' && (
              <ShowerEditor
                initial={newForm.editing}
                onSave={saveNewShower}
                onCancel={() => setNewForm(null)}
                allPeriods={showerHistory}
                onEditConflict={(p) => setNewForm({ type: 'shower', editing: p })}
                products={products}
                onSaveProduct={saveProduct}
                userId={userId}
              />
            )}
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  )
}
