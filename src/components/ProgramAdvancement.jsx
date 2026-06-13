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

// ─── PHASE 2 OPTION PICKER ────────────────────────────────────
function Phase2Picker({ options, onChoose, onClose }) {
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 0, width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Phase 2 — Add one thing
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          What do you want to add?
        </h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>
          Pick one. We'll slot it into your routine in the right place — you can add the actual product later.
        </p>

        {options.map(opt => (
          <button key={opt.id} onClick={() => setSelected(opt.id)}
            style={{
              width: '100%', textAlign: 'left', display: 'block', marginBottom: 8,
              padding: '14px 16px', borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${selected === opt.id ? T.text : T.border}`,
              background: selected === opt.id ? T.text : 'transparent',
            }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: selected === opt.id ? '#fff' : T.text, marginBottom: 3 }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 12, color: selected === opt.id ? 'rgba(255,255,255,0.75)' : T.textMuted, lineHeight: 1.6 }}>
              {opt.description}
            </div>
          </button>
        ))}

        <button
          disabled={!selected || saving}
          onClick={async () => {
            setSaving(true)
            await onChoose(options.find(o => o.id === selected))
            setSaving(false)
          }}
          style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: selected ? T.pinkDeep : T.border, color: '#fff', cursor: selected ? 'pointer' : 'default', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, marginTop: 12 }}>
          {saving ? 'Saving…' : 'Add to my routine'}
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
  async function advanceToPhase2(chosenOption) {
    const today = new Date().toISOString().split('T')[0]

    // If user picked a real step (not "skip"), add it to routine_periods.steps
    if (chosenOption && !chosenOption.is_skip_option && routinePeriod?._dbId) {
      const map = STEP_KEY_MAP[chosenOption.step_key]
      if (map) {
        const newStep = {
          id: `${chosenOption.time_of_day === 'am' ? 'am' : chosenOption.time_of_day === 'pm' ? 'pm' : 'both'}_${chosenOption.step_key}`,
          categoryKey: map.categoryKey,
          label: map.label,
          optional: false,
          enabled: true,
          professionalOnly: false,
        }
        const currentSteps = routinePeriod.steps || { am: [], pm: [] }
        const newSteps = { am: [...(currentSteps.am || [])], pm: [...(currentSteps.pm || [])] }

        if (chosenOption.time_of_day === 'am' || chosenOption.time_of_day === 'both') {
          newSteps.am.push({ ...newStep, id: `am_${chosenOption.step_key}` })
        }
        if (chosenOption.time_of_day === 'pm' || chosenOption.time_of_day === 'both') {
          newSteps.pm.push({ ...newStep, id: `pm_${chosenOption.step_key}` })
        }

        await supabase
          .from('routine_periods')
          .update({ steps: newSteps, updated_at: new Date().toISOString() })
          .eq('id', routinePeriod._dbId)
      }
    }

    // Record the selection
    if (chosenOption) {
      await supabase.from('user_program_phase_selections').insert({
        user_program_id: activeProgram.id,
        phase_id: currentPhase.id,
        selected_option_id: chosenOption.id,
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
