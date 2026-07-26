import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ACTIVE_STEP_KEYS, buildStepEntries, applyProgramPhase, countTreatmentPauseDays } from './programOptions'
import ProgramOptionsChecklist, { toggleOption } from './ProgramOptionsChecklist'
import T from './theme'
import Btn from './shared/Btn'
import AccentWord from './shared/AccentWord'
import { programCardColor } from './programColors'


function daysSince(dateStr) {
  const then = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.floor((now - then) / 86400000)
}

// Escape closes whatever modal calls this, matching native dialog behavior
function useEscapeToClose(onClose) {
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])
}

// ─── PHASE 2 OPTION PICKER ────────────────────────────────────
export function Phase2Picker({ options, onChoose, onClose, skinType, alreadyAdded = new Set() }) {
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [bhaStep, setBhaStep] = useState(false) // show AHA/BHA day picker after confirming
  const [bhaDay, setBhaDay] = useState(6)       // default Saturday
  const [chosenItems, setChosenItems] = useState([])

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  useEscapeToClose(onClose)

  if (bhaStep) return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="bha-onboarding-title" style={{ background: T.white, border: `1px solid ${T.hairline}`, borderRadius: 0, width: '100%', maxWidth: 460, padding: '28px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.darkPink, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>AHA/BHA Onboarding</div>
        <h3 id="bha-onboarding-title" style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 8px' }}>One more step</h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>
          AHA/BHA needs a slow ramp-up to avoid irritation — we'll track it through the AHA/BHA Onboarding program. Pick which night works best for you and we'll handle the rest.
        </p>
        <div style={{ fontSize: 11, color: T.textLight, marginBottom: 8 }}>Your exfoliation night</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {DAYS.map((d, i) => (
            <button key={i} onClick={() => setBhaDay(i)}
              aria-pressed={bhaDay === i}
              style={{ padding: '6px 12px', borderRadius: 0, border: `1px solid ${bhaDay === i ? T.text : T.hairline}`, background: bhaDay === i ? T.text : 'transparent', color: bhaDay === i ? '#fff' : T.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              {d}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
          Phase 1 → {DAYS[bhaDay]} only · Phase 2 → {DAYS[bhaDay]} + {DAYS[(bhaDay + 3) % 7]} · Maintenance → {DAYS[bhaDay]} + {DAYS[(bhaDay + 2) % 7]} + {DAYS[(bhaDay + 4) % 7]}
        </div>
        <button disabled={saving} onClick={async () => {
          setSaving(true)
          await onChoose(chosenItems, bhaDay)
          setSaving(false)
        }}
          style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: T.darkPink, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
          {saving ? 'Starting…' : 'Start AHA/BHA Onboarding'}
        </button>
      </div>
    </div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="phase2-picker-title" style={{ position: 'relative', background: T.white, border: `1px solid ${T.hairline}`, borderRadius: 0, width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, border: `1px solid ${T.hairline}`, background: 'transparent', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 14, lineHeight: 1, fontFamily: 'inherit', padding: 0 }}>
          ×
        </button>

        <div style={{ fontSize: 11, fontWeight: 700, color: T.darkPink, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, paddingRight: 36 }}>
          Phase 2 — Add to your routine
        </div>
        <h3 id="phase2-picker-title" style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 8px', paddingRight: 36 }}>
          What do you want to add?
        </h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>
          Pick as many as you're ready for. We'll slot each one into your routine in the right place — you can add the actual products later.
        </p>

        <ProgramOptionsChecklist
          options={options}
          selected={selected}
          onToggle={opt => {
            if (alreadyAdded.has(opt.step_key)) return
            setSelected(prev => toggleOption(prev, opt, options))
          }}
          skinType={skinType}
          alreadyAdded={alreadyAdded}
        />

        <button
          disabled={selected.size === 0 || saving}
          onClick={async () => {
            const chosen = options.filter(o => selected.has(o.id))
            const hasExfoliant = chosen.some(o => o.step_key === 'exfoliant')
            if (hasExfoliant) {
              // Route exfoliant through AHA/BHA Onboarding
              setChosenItems(chosen)
              setBhaStep(true)
            } else {
              setSaving(true)
              await onChoose(chosen, null)
              setSaving(false)
            }
          }}
          style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: selected.size > 0 ? T.darkPink : T.hairline, color: '#fff', cursor: selected.size > 0 ? 'pointer' : 'default', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, marginTop: 12 }}>
          {saving ? 'Saving…' : (() => {
            if (selected.size === 0) return 'Select an option to continue'
            const realCount = options.filter(o => selected.has(o.id) && !o.is_skip_option).length
            if (realCount === 0) return 'Continue without adding anything'
            return realCount > 1 ? `Add ${realCount} to my routine` : 'Add to my routine'
          })()}
        </button>
      </div>
    </div>
  )
}



function GraduationModal({ onConfirm, onClose }) {
  const [saving, setSaving] = useState(false)
  useEscapeToClose(onClose)
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="graduation-modal-title" style={{ background: T.white, border: `1px solid ${T.hairline}`, borderRadius: 0, width: '100%', maxWidth: 420, padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.darkPink, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Graduation
        </div>
        <h3 id="graduation-modal-title" style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
          This is your routine now.
        </h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>
          Everything you've built over the last few weeks is saved. Keep going from here, or add a new program on top whenever you're ready.
        </p>
        <button disabled={saving} onClick={async () => { setSaving(true); await onConfirm() }}
          style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: T.darkPink, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
          {saving ? 'Saving…' : "Got it — that's my routine"}
        </button>
      </div>
    </div>
  )
}

// ─── LINEAR PHASE ADVANCE CONFIRM ─────────────────────────────
// Generic tap-to-advance for programs with no per-phase options
// (e.g. Tretinoin Onboarding) — each phase fully redefines the
// active-night routine, so there's nothing to choose, just confirm.
function LinearAdvanceModal({ nextPhase, isGraduation, onConfirm, onClose }) {
  const [saving, setSaving] = useState(false)
  useEscapeToClose(onClose)
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="linear-advance-title" style={{ background: T.white, border: `1px solid ${T.hairline}`, borderRadius: 0, width: '100%', maxWidth: 420, padding: '24px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.darkPink, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          {isGraduation ? 'Graduation' : `Phase ${nextPhase.phase_number}`}
        </div>
        <h3 id="linear-advance-title" style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
          {isGraduation ? 'This is your routine now.' : nextPhase.name}
        </h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>
          {nextPhase.description}
        </p>
        <button disabled={saving} onClick={async () => { setSaving(true); await onConfirm() }}
          style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: T.darkPink, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
          {saving ? 'Saving…' : isGraduation ? "Got it — that's my routine" : `Start Phase ${nextPhase.phase_number}`}
        </button>
      </div>
    </div>
  )
}

// Shared "give me more time" link — pushes the ready-date out a week
// without forcing a decision. Shown under every ready-banner.
function NotReadyYetLink({ onClick, disabled }) {
  return (
    <div style={{ borderTop: `1px solid ${T.hairline}`, padding: '10px 16px' }}>
      <button onClick={onClick} disabled={disabled}
        style={{ padding: '7px 14px', borderRadius: T.radius.pill, border: 'none', background: T.text, color: T.white, cursor: disabled ? 'default' : 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
        {disabled ? 'Saving…' : "I'm not ready yet — add a week"}
      </button>
    </div>
  )
}

// ─── MAIN ADVANCEMENT BANNER ─────────────────────────────────
// Renders nothing if no program is active, or if the current phase
// hasn't reached its duration yet. Otherwise shows a tap-to-advance
// banner appropriate to the current phase.
export default function ProgramAdvancement({ session, activeProgram, routinePeriod, treatments, allTypes, skinType, onAdvanced }) {
  const storageKey = `program_banner_collapsed_${session?.user?.id || 'anon'}`
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'true' } catch { return false }
  })

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(storageKey, String(next)) } catch {}
      return next
    })
  }

  const [program, setProgram] = useState(null)
  const [phases, setPhases] = useState([])
  const [phase2Options, setPhase2Options] = useState([])
  const [allPhaseSteps, setAllPhaseSteps] = useState({}) // phase_id -> program_phase_steps[]
  const [showPicker, setShowPicker] = useState(false)
  const [showAddMore, setShowAddMore] = useState(false)
  const [endFoundationConfirm, setEndFoundationConfirm] = useState(false)
  const [endingFoundation, setEndingFoundation] = useState(false)
  const [showGraduation, setShowGraduation] = useState(false)
  const [showLinearAdvance, setShowLinearAdvance] = useState(false)
  const [postponing, setPostponing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!endFoundationConfirm) return
    function handleKey(e) { if (e.key === 'Escape') setEndFoundationConfirm(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [endFoundationConfirm])

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
      if (prog?.slug === 'basic-skincare' && phase2) {
        const { data: opts } = await supabase
          .from('program_phase_options').select('*').eq('phase_id', phase2.id).order('position')
        setPhase2Options(opts || [])
      } else if (ph?.length) {
        // Linear programs (e.g. Tretinoin) — preload all phases' step config
        // so advancing is a single tap with no extra fetch
        const { data: steps } = await supabase
          .from('program_phase_steps').select('*').in('phase_id', ph.map(p => p.id))
        const byPhase = {}
        for (const s of (steps || [])) {
          if (!byPhase[s.phase_id]) byPhase[s.phase_id] = []
          byPhase[s.phase_id].push(s)
        }
        setAllPhaseSteps(byPhase)
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
  // Use local midnight (same reference as daysSince) so pause day counting
  // iterates exactly the same days that elapsed counts
  // Only count phases with a duration (graduation phases with null don't count)
  const countedPhases = phases.filter(p => p.duration_days != null)

  // Effective duration for current phase — respects per-user overrides and postponements
  const phaseOverrides  = activeProgram.phase_duration_overrides || {}
  const phasePostponed  = activeProgram.phase_postponed_days     || {}
  const baseDuration    = phaseOverrides[currentPhase.phase_number]
    ?? currentPhase.duration_days
  const postponedDays   = phasePostponed[currentPhase.phase_number] || 0
  const effectiveDuration = baseDuration != null ? baseDuration + postponedDays : null

  const todayLocal = new Date(); todayLocal.setHours(0, 0, 0, 0)
  const todayKey = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth()+1).padStart(2,'0')}-${String(todayLocal.getDate()).padStart(2,'0')}`
  const pauseDays = (treatments && allTypes && elapsed >= 0)
    ? countTreatmentPauseDays(activeProgram.phase_started_at, todayKey, treatments, allTypes)
    : 0
  const effectiveElapsed = elapsed - pauseDays

  // Find the resume date — day after the last active treatment window ends
  const resumeDate = (() => {
    if (!pauseDays || !treatments) return null
    let latest = null
    for (const [tk, entries] of Object.entries(treatments)) {
      for (const tv of (Array.isArray(entries) ? entries : [entries])) {
        const td = new Date(tk + 'T00:00:00')
        const post = tv.post ?? allTypes[tv.type]?.post ?? 3
        const pre  = tv.pre  ?? allTypes[tv.type]?.pre  ?? 3
        const windowStart = new Date(td); windowStart.setDate(windowStart.getDate() - pre)
        const windowEnd   = new Date(td); windowEnd.setDate(windowEnd.getDate() + post)
        if (todayLocal >= windowStart && todayLocal <= windowEnd) {
          if (!latest || windowEnd > latest) latest = windowEnd
        }
      }
    }
    if (!latest) return null
    const resume = new Date(latest); resume.setDate(resume.getDate() + 1)
    return resume.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  })()
  const ready = effectiveDuration != null && effectiveElapsed >= effectiveDuration
  const nextPhase = phases.find(p => p.phase_number === currentPhase.phase_number + 1)
  const isLinearProgram = program.slug !== 'basic-skincare'

  // "Not ready yet" — push the ready-date out by a week without
  // requiring a decision. Available wherever a phase is "ready".
  async function postponePhase() {
    setPostponing(true)
    try {
      // Fetch current value fresh from DB — don't trust potentially stale React state
      const { data, error: fetchErr } = await supabase
        .from('user_programs')
        .select('phase_postponed_days')
        .eq('id', activeProgram.id)
        .single()
      if (fetchErr) throw fetchErr

      const current = data?.phase_postponed_days || {}
      const phaseKey = String(currentPhase.phase_number)
      const updated = { ...current, [phaseKey]: (current[phaseKey] || 0) + 7 }

      const { error } = await supabase.from('user_programs').update({
        phase_postponed_days: updated,
      }).eq('id', activeProgram.id)
      if (error) throw error
      onAdvanced()
    } catch (err) {
      console.error('Postpone phase error:', err)
      setPostponing(false)
    }
  }

  // ── Generic linear advance (Tretinoin and similar) ─────────
  async function advanceLinear() {
    if (!nextPhase) return
    const today = new Date().toISOString().split('T')[0]
    const isGraduation = nextPhase.advancement_type === 'auto'
    const nextSteps = allPhaseSteps[nextPhase.id] || []
    const patch = applyProgramPhase(nextSteps, routinePeriod, { isFirstApplication: false })

    if (routinePeriod?._dbId) {
      await supabase.from('routine_periods').update({
        steps: patch.steps,
        ...(patch.tret_enabled !== undefined && { tret_enabled: patch.tret_enabled }),
        ...(patch.tret_frequency !== undefined && { tret_frequency: patch.tret_frequency }),
        ...(patch.tret_frequency_history !== undefined && { tret_frequency_history: patch.tret_frequency_history }),
        ...(patch.active_name !== undefined && { active_name: patch.active_name }),
        updated_at: new Date().toISOString(),
      }).eq('id', routinePeriod._dbId)
    }

    await supabase.from('user_programs').update({
      current_phase_number: nextPhase.phase_number,
      phase_started_at: today,
      ...(isGraduation && { status: 'completed', completed_at: today, status_detail: 'graduated' }),
    }).eq('id', activeProgram.id)

    // AHA/BHA program — update bha_frequency on the active routine period
    if (program.slug === 'aha-bha-onboarding' && !isGraduation) {
      const { data: periods } = await supabase
        .from('routine_periods')
        .select('id, start_date, end_date')
        .eq('user_id', session.user.id)
        .order('start_date', { ascending: false })
      const activePeriod = (periods || []).find(p => p.start_date <= today && (!p.end_date || p.end_date >= today))
      if (activePeriod?.id) {
        await supabase.from('routine_periods')
          .update({ bha_frequency: nextPhase.phase_number })
          .eq('id', activePeriod.id)
      }
    }

    await supabase.from('user_program_phase_history').insert({
      user_program_id: activeProgram.id,
      from_phase: currentPhase.phase_number,
      to_phase: nextPhase.phase_number,
      reason: isGraduation ? 'graduated' : 'manual',
    })

    setShowLinearAdvance(false)
    onAdvanced()
  }

  // ── Phase 1 -> Phase 2 ─────────────────────────────────────
  async function advanceToPhase2(chosenOptions, bhaDay = null) {
    const today = new Date().toISOString().split('T')[0]
    const realChoices = chosenOptions.filter(o => !o.is_skip_option)
    const hasExfoliant = realChoices.some(o => o.step_key === 'exfoliant')
    const nonBhaChoices = realChoices.filter(o => o.step_key !== 'exfoliant')

    // Add non-exfoliant steps to routine_periods.steps
    if (nonBhaChoices.length && routinePeriod?._dbId) {
      const currentSteps = routinePeriod.steps || { am: [], pm: [], off: [] }
      const { am: amAdds, pm: pmAdds } = buildStepEntries(nonBhaChoices)
      const newSteps = {
        am:  [...(currentSteps.am  || []), ...amAdds],
        pm:  [...(currentSteps.pm  || []), ...pmAdds],
        off: [...(currentSteps.off || currentSteps.pm || []), ...pmAdds.map(s => ({ ...s, id: s.id.replace('pm_', 'off_') }))],
      }
      await supabase
        .from('routine_periods')
        .update({ steps: newSteps, updated_at: new Date().toISOString() })
        .eq('id', routinePeriod._dbId)
    }

    // Record selections (non-bha)
    for (const opt of chosenOptions.filter(o => o.step_key !== 'exfoliant')) {
      await supabase.from('user_program_phase_selections').insert({
        user_program_id: activeProgram.id,
        phase_id: currentPhase.id,
        selected_option_id: opt.id,
      })
    }

    // Enroll in AHA/BHA Onboarding if exfoliant was chosen
    if (hasExfoliant) {
      const { data: bhaProg, error: bhaErr } = await supabase
        .from('programs').select('id').eq('slug', 'aha-bha-onboarding').single()
      if (bhaProg) {
        const { error: insertErr } = await supabase.from('user_programs').insert({
          user_id: session.user.id,
          program_id: bhaProg.id,
          started_at: today,
          current_phase_number: 1,
          phase_started_at: today,
          status: 'active',
          phase_duration_overrides: null,
        })
        if (!insertErr && routinePeriod?._dbId) {
          await supabase.from('routine_periods')
            .update({ bha_enabled: true, bha_frequency: 1, bha_start_day: bhaDay ?? 6 })
            .eq('id', routinePeriod._dbId)
        }
      }
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

  // ── Add more, anytime during Phase 2 (doesn't touch phase/dates) ──
  async function addStepsNow(chosenOptions) {
    const realChoices = chosenOptions.filter(o => !o.is_skip_option)
    const phase2 = phases.find(p => p.phase_number === 2)

    if (realChoices.length && routinePeriod?._dbId) {
      const currentSteps = routinePeriod.steps || { am: [], pm: [], off: [] }
      const { am: amAdds, pm: pmAdds } = buildStepEntries(realChoices)
      const newSteps = {
        am:  [...(currentSteps.am  || []), ...amAdds],
        pm:  [...(currentSteps.pm  || []), ...pmAdds],
        off: [...(currentSteps.off || currentSteps.pm || []), ...pmAdds.map(s => ({ ...s, id: s.id.replace('pm_', 'off_') }))],
      }

      await supabase
        .from('routine_periods')
        .update({ steps: newSteps, updated_at: new Date().toISOString() })
        .eq('id', routinePeriod._dbId)
    }

    for (const opt of realChoices) {
      await supabase.from('user_program_phase_selections').insert({
        user_program_id: activeProgram.id,
        phase_id: phase2?.id || currentPhase.id,
        selected_option_id: opt.id,
      })
    }

    setShowAddMore(false)
    onAdvanced()
  }

  // For foundation programs (e.g. Basic Skincare), "ending early" means
  // graduating now with whatever's been built so far — not abandoning.
  // The routine stays exactly as it is; the program is just marked done.
  async function endFoundationEarly() {
    setEndingFoundation(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('user_programs').update({
        status: 'completed',
        completed_at: today,
        status_detail: 'graduated',
      }).eq('id', activeProgram.id)

      // AHA/BHA program graduated — keep bha_enabled but freeze frequency at 3
      // (user continues at maintenance pace independently)
      if (program.slug === 'aha-bha-onboarding') {
        const { data: periods } = await supabase
          .from('routine_periods').select('id, start_date, end_date')
          .eq('user_id', session.user.id).order('start_date', { ascending: false })
        const activePeriod = (periods || []).find(p => p.start_date <= today && (!p.end_date || p.end_date >= today))
        if (activePeriod?.id) {
          await supabase.from('routine_periods')
            .update({ bha_frequency: 3 })
            .eq('id', activePeriod.id)
        }
      }

      await supabase.from('user_program_phase_history').insert({
        user_program_id: activeProgram.id,
        from_phase: currentPhase.phase_number,
        to_phase: null,
        reason: 'graduated_early',
      })

      onAdvanced()
    } catch (err) {
      console.error('End foundation program error:', err)
      setEndingFoundation(false)
    }
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
  // Progress bar: show progress within the current phase only.
  // Cross-phase bars (e.g. "Day 16 of 28") are too abstract — the day
  // count shown in the chip already gives phase-level context.
  const phaseProgress = effectiveDuration
    ? Math.min(100, (Math.max(effectiveElapsed, 0) / effectiveDuration) * 100)
    : 0

  // Format a short date like "Jun 14"
  const fmtDate = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const phaseStart = new Date(activeProgram.phase_started_at + 'T00:00:00')
  const phaseEnd = currentPhase.duration_days != null
    ? new Date(phaseStart.getTime() + currentPhase.duration_days * 86400000)
    : null

  // Build set of step_keys already present in the routine so Phase2Picker can grey them out
  const alreadyAdded = new Set(
    [
      ...(routinePeriod?.steps?.am  || []),
      ...(routinePeriod?.steps?.pm  || []),
    ].map(s => s.id?.replace(/^(am|pm|off)_/, '') || '').filter(Boolean)
  )

  // Shown ahead of time so people can plan, per the expanded banner spec —
  // renders as the dark continuation of the same card, not a
  // separately bordered box.
  const upNextBlock = !ready && nextPhase && effectiveDuration != null && (
    <div style={{ background: T.darkGreen, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.white, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Up next — around {fmtDate(phaseEnd)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 3 }}>
        {nextPhase.advancement_type === 'auto' ? 'Graduation' : `Phase ${nextPhase.phase_number} — ${nextPhase.name}`}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{nextPhase.preview_description || nextPhase.description}</div>
    </div>
  )

  return (
    <div style={{ overflow: 'hidden', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Card — white header/content zone, olive border, seamlessly
          continues into the dark-olive Up Next zone when shown */}
      <div style={{ background: T.white, border: `1px solid ${T.text}`, borderRadius: T.radius.modal, marginBottom: 12, overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '10px 14px' }}>
          {/* Header row — always visible */}
          <button onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            style={{ width: '100%', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', boxSizing: 'border-box' }}>
            <style>{`
              .gu-progress-inline { display: flex; }
              .gu-progress-below  { display: none; }
              @media (max-width: 639px) {
                .gu-progress-inline { display: none; }
                .gu-progress-below  { display: block; }
              }
            `}</style>
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: programCardColor(program), letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 2 }}>
                {program.name}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Phase {currentPhase.phase_number} of {countedPhases.length} — {currentPhase.name}
                {elapsed < 0 ? (
                  <span style={{ fontWeight: 400, color: T.text, opacity: 0.7 }}> · Starts {fmtDate(phaseStart)}</span>
                ) : currentPhase.duration_days && (
                  pauseDays > 0 && effectiveElapsed <= elapsed
                    ? <span style={{ fontWeight: 400, color: T.text, opacity: 0.7 }}> · Day {Math.max(effectiveElapsed, 1)} of {effectiveDuration} — paused for treatment{resumeDate ? `, resumes ${resumeDate}` : ''}</span>
                    : <span style={{ fontWeight: 400, color: T.text, opacity: 0.7 }}> · Day {Math.min(Math.max(effectiveElapsed, 0) + 1, effectiveDuration)} of {effectiveDuration}</span>
                )}
              </div>
              {/* Mobile only — progress bar below text */}
              {effectiveDuration && (
                <div className="gu-progress-below" style={{ width: '100%', height: 4, background: '#EBFBF2', borderRadius: T.radius.pill, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{ width: `${phaseProgress}%`, height: '100%', background: programCardColor(program), borderRadius: T.radius.pill, transition: 'width 0.3s' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {/* Desktop only — progress bar inline */}
              {effectiveDuration && (
                <div className="gu-progress-inline" style={{ width: 80, height: 4, background: '#EBFBF2', borderRadius: T.radius.pill, overflow: 'hidden', alignItems: 'center' }}>
                  <div style={{ width: `${phaseProgress}%`, height: '100%', background: programCardColor(program), borderRadius: T.radius.pill, transition: 'width 0.3s' }} />
                </div>
              )}
              <span style={{ fontSize: 10, color: T.text, transition: 'transform 0.15s', display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>▼</span>
            </div>
          </button>

          {/* Expandable content */}
          {!collapsed && (
            <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>

              {/* Current phase description — hide for Phase 1 tretinoin since sandwich note covers it */}
              {program.slug !== 'basic-skincare' && currentPhase.description && !(currentPhase.phase_number === 1 && (/sandwich/i.test(currentPhase.name || '') || /sandwich/i.test(currentPhase.description || ''))) && (
                <div style={{ marginTop: 8, fontSize: 11, color: T.text, opacity: 0.85, lineHeight: 1.7, padding: '8px 10px', background: '#EBFBF2', borderRadius: T.radius.card }}>
                  {currentPhase.description}
                </div>
              )}

              {/* Sandwich method description — only shown on Phase 1 */}
              {currentPhase.phase_number === 1 && (/sandwich/i.test(currentPhase.name || '') || /sandwich/i.test(currentPhase.description || '')) && (
                <div style={{ marginTop: 8, fontSize: 11, color: T.text, opacity: 0.85, lineHeight: 1.7, padding: '8px 10px', background: '#EBFBF2', borderRadius: T.radius.card }}>
                  <span style={{ fontWeight: 600, color: T.text }}>What is the sandwich method? </span>
                  Apply moisturizer, wait 2–3 min, apply tretinoin, then moisturizer again on top. The buffer layers reduce irritation while it still absorbs.
                </div>
              )}

              {/* Buttons inside the chip for Basic Skincare */}
              {program.slug === 'basic-skincare' && (
                <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${T.hairline}`, marginTop: 10, paddingTop: 10 }}>
                  {currentPhase.phase_number >= 2 && (
                    <Btn variant="primary" onClick={e => { e.stopPropagation(); setShowAddMore(true) }}>
                      Add to my <AccentWord>routine</AccentWord>
                    </Btn>
                  )}
                  <Btn variant="secondary" onClick={e => { e.stopPropagation(); setEndFoundationConfirm(true) }}>
                    End this program <AccentWord>early</AccentWord>
                  </Btn>
                </div>
              )}

              {/* Confirm as a fixed modal so it never affects layout width */}
              {program.slug === 'basic-skincare' && endFoundationConfirm && (
                <div onClick={() => setEndFoundationConfirm(false)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="End this program early?"
                    style={{ background: T.white, border: `1px solid ${T.hairline}`, borderRadius: T.radius.modal, padding: '24px 20px', width: '100%', maxWidth: 420 }}>
                    <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, marginBottom: 20 }}>
                      This locks in your current routine exactly as it is — no more Basic Skincare phases. Whether you're happy with it or just ready to move on, your routine stays as-is and you can keep adjusting it manually or add a new program (like Tretinoin Onboarding) anytime.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn variant="secondary" onClick={() => setEndFoundationConfirm(false)} disabled={endingFoundation}>
                        Cancel
                      </Btn>
                      <Btn variant="danger" onClick={endFoundationEarly} disabled={endingFoundation}>
                        {endingFoundation ? 'Saving…' : 'End this program early'}
                      </Btn>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!collapsed && upNextBlock}
      </div>

      {/* Everything below is hidden when collapsed */}
      {!collapsed && (
        <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* Advancement banner — Phase 1 → 2 */}
      {!isLinearProgram && ready && currentPhase.phase_number === 1 && (
        <div style={{ border: `1px solid ${T.text}`, borderRadius: T.radius.modal, overflow: 'hidden', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <button onClick={() => setShowPicker(true)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: T.text, color: '#fff', border: 'none', borderRadius: 0, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>You're ready for Phase 2</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Add something to your routine — tap to choose</div>
            </div>
            <span style={{ fontSize: 18, flexShrink: 0 }}>→</span>
          </button>
          <NotReadyYetLink onClick={postponePhase} disabled={postponing} />
        </div>
      )}

      {/* Advancement banner — Phase 2 → Graduation */}
      {!isLinearProgram && ready && currentPhase.phase_number === 2 && (
        <div style={{ border: `1px solid ${T.text}`, borderRadius: T.radius.modal, overflow: 'hidden', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <button onClick={() => setShowGraduation(true)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: T.text, color: '#fff', border: 'none', borderRadius: 0, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>You're ready to graduate</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Tap to lock in your routine</div>
            </div>
            <span style={{ fontSize: 18, flexShrink: 0 }}>→</span>
          </button>
          <NotReadyYetLink onClick={postponePhase} disabled={postponing} />
        </div>
      )}

      {/* Advancement banner — Linear programs (Tretinoin etc) */}
      {isLinearProgram && ready && nextPhase && (
        <div style={{ border: `1px solid ${T.text}`, borderRadius: T.radius.modal, overflow: 'hidden', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <button onClick={() => setShowLinearAdvance(true)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: T.text, color: '#fff', border: 'none', borderRadius: 0, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                {nextPhase.advancement_type === 'auto' ? "You're ready to graduate" : `You're ready for Phase ${nextPhase.phase_number}`}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{nextPhase.name}{nextPhase.advancement_type !== 'auto' ? ' — tap to continue' : ' — tap to lock it in'}</div>
            </div>
            <span style={{ fontSize: 18, flexShrink: 0 }}>→</span>
          </button>
          <NotReadyYetLink onClick={postponePhase} disabled={postponing} />
        </div>
      )}

      {showPicker && (
        <Phase2Picker
          options={phase2Options}
          onChoose={advanceToPhase2}
          onClose={() => setShowPicker(false)}
          skinType={skinType}
          alreadyAdded={alreadyAdded}
        />
      )}
      </div> /* end expandable content */
      )}

      {/* Modals always rendered outside the collapsed gate so they
          can appear even if someone triggers them before collapsing */}
      {showAddMore && (
        <Phase2Picker
          options={phase2Options}
          onChoose={addStepsNow}
          onClose={() => setShowAddMore(false)}
          skinType={skinType}
          alreadyAdded={alreadyAdded}
        />
      )}

      {showGraduation && (
        <GraduationModal
          onConfirm={graduate}
          onClose={() => setShowGraduation(false)}
        />
      )}

      {showLinearAdvance && nextPhase && (
        <LinearAdvanceModal
          nextPhase={nextPhase}
          isGraduation={nextPhase.advancement_type === 'auto'}
          onConfirm={advanceLinear}
          onClose={() => setShowLinearAdvance(false)}
        />
      )}
    </div>
  )
}
