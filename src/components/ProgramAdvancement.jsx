import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  bg:        '#FAF7F2',
  white:     '#FFFFFF',
  cream:     '#F5F0EB',
  creamDark: '#EDE8E2',
  border:    '#DDD8D0',
  text:      '#1A1A1A',
  textMuted: '#6B6560',
  textLight: '#A8A29E',
  pink:      '#FFD6F9',
  pinkDeep:  '#C93500',
}

// Maps program_phase_options.step_key -> INGREDIENT_CATEGORIES key + label
// used to build a routine_periods step entry
const STEP_KEY_MAP = {
  toner:           { categoryKey: 'toner',           label: 'Toner' },
  vitamin_c:       { categoryKey: 'treatment_serum', label: 'Vitamin C Serum' },
  hydrating_serum: { categoryKey: 'watery_serum',    label: 'Hydrating Serum' },
  exfoliant:       { categoryKey: 'aha_bha_toner',   label: 'Exfoliant (AHA/BHA)' },
  eye_cream:       { categoryKey: 'eye_cream',       label: 'Eye Cream' },
  facial_oil:      { categoryKey: 'face_oil',        label: 'Facial Oil' },
}

function daysSince(dateStr) {
  const then = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.floor((now - then) / 86400000)
}

// Step keys that introduce a new active ingredient — only one
// can be selected at a time so the user isn't ramping multiple
// actives simultaneously.
const ACTIVE_STEP_KEYS = new Set(['vitamin_c', 'exfoliant'])

// ─── PHASE 2 OPTION PICKER ────────────────────────────────────
function Phase2Picker({ options, onChoose, onClose }) {
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)

  function toggle(opt) {
    setSelected(prev => {
      const next = new Set(prev)
      if (opt.is_skip_option) {
        // Skip is exclusive — selecting it clears everything else
        return next.has(opt.id) ? new Set() : new Set([opt.id])
      }
      // Selecting a real option clears skip if present
      const skipOpt = options.find(o => o.is_skip_option)
      if (skipOpt) next.delete(skipOpt.id)

      if (next.has(opt.id)) {
        next.delete(opt.id)
        return next
      }

      // Actives are mutually exclusive — selecting one deselects any other active
      if (ACTIVE_STEP_KEYS.has(opt.step_key)) {
        for (const o of options) {
          if (ACTIVE_STEP_KEYS.has(o.step_key) && o.id !== opt.id) next.delete(o.id)
        }
      }

      next.add(opt.id)
      return next
    })
  }

  const realOptions = options.filter(o => !o.is_skip_option)
  const skipOption = options.find(o => o.is_skip_option)
  const hasActiveSelected = realOptions.some(o => ACTIVE_STEP_KEYS.has(o.step_key) && selected.has(o.id))

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 0, width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Phase 2 — Add to your routine
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          What do you want to add?
        </h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>
          Pick as many as you're ready for. We'll slot each one into your routine in the right place — you can add the actual products later.
        </p>

        {realOptions.map(opt => {
          const isOn = selected.has(opt.id)
          const isActive = ACTIVE_STEP_KEYS.has(opt.step_key)
          const disabledByOtherActive = isActive && hasActiveSelected && !isOn
          return (
            <button key={opt.id} onClick={() => !disabledByOtherActive && toggle(opt)}
              disabled={disabledByOtherActive}
              style={{
                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8,
                padding: '14px 16px', borderRadius: 0, cursor: disabledByOtherActive ? 'default' : 'pointer', fontFamily: 'inherit',
                border: `1px solid ${isOn ? T.text : T.border}`,
                background: isOn ? T.text : 'transparent',
                opacity: disabledByOtherActive ? 0.4 : 1,
              }}>
              <div style={{ width: 16, height: 16, border: `1.5px solid ${isOn ? '#fff' : T.border}`, background: isOn ? '#fff' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isOn && <svg width="10" height="8" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isOn ? '#fff' : T.text, marginBottom: 3 }}>
                  {opt.label}
                  {isActive && <span style={{ fontSize: 9, fontWeight: 700, color: isOn ? 'rgba(255,255,255,0.7)' : T.pinkDeep, marginLeft: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Active</span>}
                </div>
                <div style={{ fontSize: 12, color: isOn ? 'rgba(255,255,255,0.75)' : T.textMuted, lineHeight: 1.6 }}>
                  {opt.description}
                </div>
              </div>
            </button>
          )
        })}

        {hasActiveSelected && (
          <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, padding: '8px 0 4px', fontStyle: 'italic' }}>
            We limit new actives to one at a time, so it's clear what your skin is responding to. You can add another later.
          </div>
        )}

        {skipOption && (
          <button onClick={() => toggle(skipOption)}
            style={{
              width: '100%', textAlign: 'left', display: 'block', marginTop: 12, marginBottom: 8,
              padding: '14px 16px', borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${selected.has(skipOption.id) ? T.text : T.border}`,
              background: selected.has(skipOption.id) ? T.text : 'transparent',
              borderTop: `1px solid ${T.border}`,
            }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: selected.has(skipOption.id) ? '#fff' : T.text, marginBottom: 3 }}>
              {skipOption.label}
            </div>
            <div style={{ fontSize: 12, color: selected.has(skipOption.id) ? 'rgba(255,255,255,0.75)' : T.textMuted, lineHeight: 1.6 }}>
              {skipOption.description}
            </div>
          </button>
        )}

        <button
          disabled={selected.size === 0 || saving}
          onClick={async () => {
            setSaving(true)
            const chosen = options.filter(o => selected.has(o.id))
            await onChoose(chosen)
            setSaving(false)
          }}
          style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: selected.size > 0 ? T.pinkDeep : T.border, color: '#fff', cursor: selected.size > 0 ? 'pointer' : 'default', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, marginTop: 12 }}>
          {saving ? 'Saving…' : selected.size > 1 ? `Add ${selected.size} to my routine` : 'Add to my routine'}
        </button>
      </div>
    </div>
  )
}

// ─── GRADUATION CONFIRM ───────────────────────────────────────
function GraduationModal({ onConfirm, onClose }) {
  const [saving, setSaving] = useState(false)
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 0, width: '100%', maxWidth: 420, padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Graduation
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
          This is your routine now.
        </h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>
          Everything you've built over the last few weeks is saved. Keep going from here, or add a new program on top whenever you're ready.
        </p>
        <button disabled={saving} onClick={async () => { setSaving(true); await onConfirm() }}
          style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: T.pinkDeep, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
          {saving ? 'Saving…' : "Got it — that's my routine"}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN ADVANCEMENT BANNER ─────────────────────────────────
// Renders nothing if no program is active, or if the current phase
// hasn't reached its duration yet. Otherwise shows a tap-to-advance
// banner appropriate to the current phase.
export default function ProgramAdvancement({ session, activeProgram, routinePeriod, onAdvanced }) {
  const [program, setProgram] = useState(null)
  const [phases, setPhases] = useState([])
  const [phase2Options, setPhase2Options] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [showGraduation, setShowGraduation] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeProgram) { setLoading(false); return }
    loadProgramContent()
  }, [activeProgram?.id])

  async function loadProgramContent() {
    try {
      const { data: prog } = await supabase
        .from('programs').select('*').eq('id', activeProgram.program_id).single()
      const { data: ph } = await supabase
        .from('program_phases').select('*').eq('program_id', activeProgram.program_id).order('phase_number')

      setProgram(prog)
      setPhases(ph || [])

      const phase2 = (ph || []).find(p => p.phase_number === 2)
      if (phase2) {
        const { data: opts } = await supabase
          .from('program_phase_options').select('*').eq('phase_id', phase2.id).order('position')
        setPhase2Options(opts || [])
      }
    } catch (err) {
      console.error('ProgramAdvancement load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !activeProgram || !program || !phases.length) return null

  const currentPhase = phases.find(p => p.phase_number === activeProgram.current_phase_number)
  if (!currentPhase) return null

  const elapsed = daysSince(activeProgram.phase_started_at)
  const ready = currentPhase.duration_days != null && elapsed >= currentPhase.duration_days

  // ── Phase 1 -> Phase 2 ─────────────────────────────────────
  async function advanceToPhase2(chosenOptions) {
    const today = new Date().toISOString().split('T')[0]
    const realChoices = chosenOptions.filter(o => !o.is_skip_option)

    // Add each chosen step to routine_periods.steps
    if (realChoices.length && routinePeriod?._dbId) {
      const currentSteps = routinePeriod.steps || { am: [], pm: [], off: [] }
      const newSteps = {
        am:  [...(currentSteps.am  || [])],
        pm:  [...(currentSteps.pm  || [])],
        off: [...(currentSteps.off || currentSteps.pm || [])],
      }

      for (const opt of realChoices) {
        const map = STEP_KEY_MAP[opt.step_key]
        if (!map) continue
        const base = {
          categoryKey: map.categoryKey,
          label: map.label,
          optional: false,
          enabled: true,
          professionalOnly: false,
        }
        if (opt.time_of_day === 'am' || opt.time_of_day === 'both') {
          newSteps.am.push({ ...base, id: `am_${opt.step_key}` })
        }
        if (opt.time_of_day === 'pm' || opt.time_of_day === 'both') {
          newSteps.pm.push({ ...base, id: `pm_${opt.step_key}` })
          newSteps.off.push({ ...base, id: `off_${opt.step_key}` })
        }
      }

      await supabase
        .from('routine_periods')
        .update({ steps: newSteps, updated_at: new Date().toISOString() })
        .eq('id', routinePeriod._dbId)
    }

    // Record each selection (including skip, if that's what was chosen)
    for (const opt of chosenOptions) {
      await supabase.from('user_program_phase_selections').insert({
        user_program_id: activeProgram.id,
        phase_id: currentPhase.id,
        selected_option_id: opt.id,
      })
    }

    // Advance phase
    await supabase.from('user_programs').update({
      current_phase_number: 2,
      phase_started_at: today,
    }).eq('id', activeProgram.id)

    await supabase.from('user_program_phase_history').insert({
      user_program_id: activeProgram.id,
      from_phase: 1,
      to_phase: 2,
      reason: 'manual',
    })

    setShowPicker(false)
    onAdvanced()
  }

  // ── Phase 2 -> Graduation ──────────────────────────────────
  async function graduate() {
    const today = new Date().toISOString().split('T')[0]

    await supabase.from('user_programs').update({
      current_phase_number: 3,
      phase_started_at: today,
      status: 'completed',
      completed_at: today,
    }).eq('id', activeProgram.id)

    await supabase.from('user_program_phase_history').insert({
      user_program_id: activeProgram.id,
      from_phase: 2,
      to_phase: 3,
      reason: 'manual',
    })

    setShowGraduation(false)
    onAdvanced()
  }

  // ── Status chip — always visible while program is active ──
  const totalDuration = phases.filter(p => p.duration_days).reduce((s, p) => s + p.duration_days, 0)
  const daysCompleted = phases
    .filter(p => p.phase_number < activeProgram.current_phase_number)
    .reduce((s, p) => s + (p.duration_days || 0), 0) + elapsed

  return (
    <>
      {/* Status chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 0, padding: '10px 14px', marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            {program.name}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
            Phase {currentPhase.phase_number} of {phases.length} — {currentPhase.name}
            {currentPhase.duration_days && (
              <span style={{ fontWeight: 400, color: T.textMuted }}> · Day {Math.min(elapsed + 1, currentPhase.duration_days)} of {currentPhase.duration_days}</span>
            )}
          </div>
        </div>
        {totalDuration > 0 && (
          <div style={{ width: 80, height: 4, background: T.creamDark, borderRadius: 0, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ width: `${Math.min(100, (daysCompleted / totalDuration) * 100)}%`, height: '100%', background: T.pinkDeep }} />
          </div>
        )}
      </div>

      {/* Advancement banner */}
      {ready && currentPhase.phase_number === 1 && (
        <button onClick={() => setShowPicker(true)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: T.text, color: '#fff', border: 'none', borderRadius: 0, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>You're ready for Phase 2</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Tap to choose what to add to your routine</div>
          </div>
          <span style={{ fontSize: 18, flexShrink: 0 }}>→</span>
        </button>
      )}

      {ready && currentPhase.phase_number === 2 && (
        <button onClick={() => setShowGraduation(true)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: T.text, color: '#fff', border: 'none', borderRadius: 0, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>You're ready to graduate</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Tap to lock in your routine</div>
          </div>
          <span style={{ fontSize: 18, flexShrink: 0 }}>→</span>
        </button>
      )}

      {showPicker && (
        <Phase2Picker
          options={phase2Options}
          onChoose={advanceToPhase2}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showGraduation && (
        <GraduationModal
          onConfirm={graduate}
          onClose={() => setShowGraduation(false)}
        />
      )}
    </>
  )
}
