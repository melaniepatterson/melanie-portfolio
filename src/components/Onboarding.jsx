import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { buildStepEntries } from './programOptions'
import ProgramOptionsChecklist, { toggleOption } from './ProgramOptionsChecklist'

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
  orange:    '#FF6B35',
}

// ─── STEP INDICATOR ──────────────────────────────────────────
function StepDot({ active, done }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
      background: done ? T.text : active ? T.pinkDeep : T.border,
      transition: 'background 0.2s',
    }} />
  )
}

// ─── AM/PM STEP LIST ─────────────────────────────────────────
function StepList({ steps, tod }) {
  const filtered = steps.filter(s => s.time_of_day === tod || s.time_of_day === 'both')
  if (!filtered.length) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        {tod === 'am' ? '☀ Morning' : '☾ Evening'}
      </div>
      {filtered.sort((a, b) => a.position - b.position).map((s, i) => (
        <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: 0, border: `1px solid ${T.border}`, background: T.creamDark, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: T.textMuted, marginTop: 1 }}>
            {i + 1}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.label}</div>
            {s.notes && <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginTop: 2 }}>{s.notes}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── START AT PHASE 2 SCREEN ─────────────────────────────────
function Phase2StartScreen({ phase2, phase1Steps, phase2Options, onBack, onConfirm }) {
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      <button onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 13, padding: 0, marginBottom: 32, fontFamily: 'inherit' }}>
        ← Back
      </button>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
        Starting at Phase 2
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
        What do you want to add?
      </h2>
      <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 16px' }}>
        We'll start your routine with the basics — cleanser, moisturizer, SPF — already in place, plus whatever you pick here. Pick as many as you're ready for.
      </p>

      {/* Baseline reminder */}
      <div style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 0, padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Already in your routine</div>
        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
          {phase1Steps.map(s => s.label).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
        </div>
      </div>

      <ProgramOptionsChecklist
        options={phase2Options}
        selected={selected}
        onToggle={opt => setSelected(prev => toggleOption(prev, opt, phase2Options))}
      />

      <button
        disabled={selected.size === 0 || saving}
        onClick={async () => {
          setSaving(true)
          const chosen = phase2Options.filter(o => selected.has(o.id))
          await onConfirm(chosen)
          setSaving(false)
        }}
        style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: selected.size > 0 ? T.pinkDeep : T.border, color: '#fff', cursor: selected.size > 0 ? 'pointer' : 'default', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, marginTop: 16 }}>
        {saving ? 'Setting up…' : (() => {
          if (selected.size === 0) return 'Choose at least one'
          const realCount = phase2Options.filter(o => selected.has(o.id) && !o.is_skip_option).length
          if (realCount === 0) return 'Start with the basics'
          return realCount > 1 ? `Start with ${realCount} added` : 'Start with 1 added'
        })()}
      </button>
    </div>
  )
}

// ─── MAIN ONBOARDING COMPONENT ───────────────────────────────
export default function Onboarding({ session, onEnrolled, onSkipToBuilder }) {
  const [screen, setScreen]       = useState('entry')     // entry | program | phase1 | enrolling
  const [program, setProgram]     = useState(null)
  const [phases, setPhases]       = useState([])
  const [phase1Steps, setPhase1Steps] = useState([])
  const [phase2Options, setPhase2Options] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    loadProgram()
  }, [])

  async function loadProgram() {
    try {
      // Load the basic skincare program with all phases
      const { data: prog, error: progErr } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', 'basic-skincare')
        .single()
      if (progErr) throw progErr

      const { data: ph, error: phErr } = await supabase
        .from('program_phases')
        .select('*')
        .eq('program_id', prog.id)
        .order('phase_number')
      if (phErr) throw phErr

      // Load phase 1 steps
      const phase1 = ph.find(p => p.phase_number === 1)
      const phase2 = ph.find(p => p.phase_number === 2)

      const { data: steps } = await supabase
        .from('program_phase_steps')
        .select('*')
        .eq('phase_id', phase1.id)
        .order('position')

      const { data: opts } = await supabase
        .from('program_phase_options')
        .select('*')
        .eq('phase_id', phase2.id)
        .order('position')

      setProgram(prog)
      setPhases(ph)
      setPhase1Steps(steps || [])
      setPhase2Options(opts || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function enroll() {
    setScreen('enrolling')
    try {
      const today = new Date().toISOString().split('T')[0]

      // 1. Enroll in the program
      const { error: progErr } = await supabase
        .from('user_programs')
        .insert({
          user_id:              session.user.id,
          program_id:           program.id,
          started_at:           today,
          current_phase_number: 1,
          phase_started_at:     today,
          status:               'active',
        })
      if (progErr) throw progErr

      // 2. Convert Phase 1 steps into the routine_periods steps shape
      //    am/pm arrays of { id, categoryKey, label, optional, enabled, professionalOnly }
      function buildSteps(tod) {
        return phase1Steps
          .filter(s => s.time_of_day === tod || s.time_of_day === 'both')
          .sort((a, b) => a.position - b.position)
          .map(s => ({
            id: `${tod}_${s.step_key}`,
            categoryKey: s.step_key,
            label: s.label,
            optional: false,
            enabled: true,
            professionalOnly: false,
          }))
      }

      // 3. Create the active routine period — this is what the calendar renders
      //    'off' is the key the calendar actually reads for PM days with no
      //    active retinoid/treatment schedule — write PM steps there too.
      const pmSteps = buildSteps('pm')
      const { error: routineErr } = await supabase
        .from('routine_periods')
        .insert({
          user_id:    session.user.id,
          start_date: today,
          end_date:   null,
          steps: {
            am:  buildSteps('am'),
            pm:  pmSteps,
            off: pmSteps,
          },
        })
      if (routineErr) throw routineErr

      onEnrolled()
    } catch (err) {
      setError(err.message)
      setScreen('phase1')
    }
  }

  // For users who already do the basics in real life — enroll directly
  // into Phase 2, with Phase 1 steps as baseline plus their chosen additions.
  async function enrollAtPhase2(chosenOptions) {
    setScreen('enrolling')
    try {
      const today = new Date().toISOString().split('T')[0]
      const phase2 = phases.find(p => p.phase_number === 2)

      function buildSteps(tod) {
        return phase1Steps
          .filter(s => s.time_of_day === tod || s.time_of_day === 'both')
          .sort((a, b) => a.position - b.position)
          .map(s => ({
            id: `${tod}_${s.step_key}`,
            categoryKey: s.step_key,
            label: s.label,
            optional: false,
            enabled: true,
            professionalOnly: false,
          }))
      }

      const { am: amAdds, pm: pmAdds } = buildStepEntries(chosenOptions)
      const baseAm = buildSteps('am')
      const basePm = buildSteps('pm')
      const mergedAm = [...baseAm, ...amAdds]
      const mergedPm = [...basePm, ...pmAdds]
      const mergedOff = [...mergedPm.map(s => ({ ...s, id: s.id.replace(/^pm_/, 'off_') }))]

      // 1. Enroll directly into Phase 2
      const { data: up, error: progErr } = await supabase
        .from('user_programs')
        .insert({
          user_id:              session.user.id,
          program_id:           program.id,
          started_at:           today,
          current_phase_number: 2,
          phase_started_at:     today,
          status:               'active',
        })
        .select()
        .single()
      if (progErr) throw progErr

      // 2. Create routine period: Phase 1 baseline + chosen Phase 2 additions
      const { error: routineErr } = await supabase
        .from('routine_periods')
        .insert({
          user_id:    session.user.id,
          start_date: today,
          end_date:   null,
          steps: { am: mergedAm, pm: mergedPm, off: mergedOff },
        })
      if (routineErr) throw routineErr

      // 3. Record selections
      for (const opt of chosenOptions) {
        await supabase.from('user_program_phase_selections').insert({
          user_program_id: up.id,
          phase_id: phase2.id,
          selected_option_id: opt.id,
        })
      }

      onEnrolled()
    } catch (err) {
      setError(err.message)
      setScreen('phase2start')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: T.textMuted, fontSize: 13 }}>
      Loading…
    </div>
  )

  if (error) return (
    <div style={{ padding: 24, color: T.pinkDeep, fontSize: 13 }}>
      Something went wrong: {error}
    </div>
  )

  // ── ENTRY ─────────────────────────────────────────────────
  if (screen === 'entry') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Welcome
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 12px' }}>
          Let's get your routine set up.
        </h1>
        <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7, margin: 0 }}>
          Glow Up tracks your skincare routine, schedules your treatments, and walks you through introducing new products safely.
        </p>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
        Where are you starting from?
      </div>

      {/* Option A — fresh start */}
      <button onClick={() => setScreen('program')}
        style={{ width: '100%', textAlign: 'left', background: T.white, border: `1px solid ${T.border}`, borderRadius: 0, padding: '18px 20px', cursor: 'pointer', marginBottom: 10, display: 'block', fontFamily: 'inherit' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>
          I'm starting fresh →
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
          Build a routine from scratch. We'll walk you through it step by step.
        </div>
      </button>

      {/* Option B — already doing the basics */}
      <button onClick={() => setScreen('phase2start')}
        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 0, padding: '18px 20px', cursor: 'pointer', marginBottom: 10, display: 'block', fontFamily: 'inherit' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>
          I already do the basics →
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
          Cleanse, moisturize, SPF — that's covered. Start at Phase 2 and choose what to add next.
        </div>
      </button>

      {/* Option C — already have a routine */}
      <button onClick={onSkipToBuilder}
        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 0, padding: '18px 20px', cursor: 'pointer', display: 'block', fontFamily: 'inherit' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>
          I already have a routine →
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
          Skip ahead and build your current routine manually.
        </div>
      </button>
    </div>
  )

  // ── PROGRAM SELECTION ────────────────────────────────────
  if (screen === 'program') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      <button onClick={() => setScreen('entry')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 13, padding: 0, marginBottom: 32, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back
      </button>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
        Your program
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
        We'll start with the basics.
      </h2>

      {/* Program card */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 0, padding: '20px 20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>{program.name}</div>
        <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, marginBottom: 20 }}>
          {program.description}
        </div>

        {/* Phase timeline */}
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          What to expect
        </div>
        {phases.map((ph, i) => (
          <div key={ph.id} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: 0, background: i === 0 ? T.text : T.creamDark, border: `1px solid ${i === 0 ? T.text : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: i === 0 ? '#fff' : T.textMuted, flexShrink: 0 }}>
                {ph.phase_number}
              </div>
              {i < phases.length - 1 && (
                <div style={{ width: 1, height: 16, background: T.border, marginTop: 4 }} />
              )}
            </div>
            <div style={{ paddingTop: 3 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                Phase {ph.phase_number}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                {ph.name}
                {ph.duration_days && <span style={{ fontWeight: 400, color: T.textMuted, marginLeft: 8 }}>{ph.duration_days} days</span>}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginTop: 2 }}>{ph.description}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setScreen('phase1')}
        style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: T.text, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
        See what Phase 1 looks like →
      </button>
    </div>
  )

  // ── PHASE 1 PREVIEW ──────────────────────────────────────
  if (screen === 'phase1') {
    const phase1 = phases.find(p => p.phase_number === 1)
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
        <button onClick={() => setScreen('program')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 13, padding: 0, marginBottom: 32, fontFamily: 'inherit' }}>
          ← Back
        </button>

        {/* Phase label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Phase 1 of {phases.length}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {phases.map((ph, i) => (
              <StepDot key={ph.id} active={i === 0} done={false} />
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          {phase1.name}
        </h2>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 28px' }}>
          {phase1.description}
        </p>

        {/* Step preview */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 0, padding: '20px' , marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Your routine for the next {phase1.duration_days} days
          </div>
          <StepList steps={phase1Steps} tod="am" />
          <div style={{ height: 1, background: T.border, margin: '16px 0' }} />
          <StepList steps={phase1Steps} tod="pm" />
        </div>

        {/* What happens next */}
        <div style={{ background: T.cream, border: `1px solid ${T.border}`, borderRadius: 0, padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>After 2 weeks — Phase 2</div>
          <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
            You'll get a prompt to advance to Phase 2, where you choose what to add to your routine — you can pick more than one. You'll tap to confirm when you're ready.
          </div>
        </div>

        <button onClick={enroll}
          style={{ width: '100%', padding: '12px', borderRadius: 0, border: 'none', background: T.pinkDeep, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, marginBottom: 12 }}>
          Start Phase 1 — Foundation
        </button>
        <button onClick={onSkipToBuilder}
          style={{ width: '100%', padding: '10px', borderRadius: 0, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
          Skip — I'll build my routine manually
        </button>
      </div>
    )
  }

  // ── START AT PHASE 2 ──────────────────────────────────────
  if (screen === 'phase2start') {
    const phase2 = phases.find(p => p.phase_number === 2)
    return (
      <Phase2StartScreen
        phase2={phase2}
        phase1Steps={phase1Steps}
        phase2Options={phase2Options}
        onBack={() => setScreen('entry')}
        onConfirm={enrollAtPhase2}
      />
    )
  }


  if (screen === 'enrolling') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, color: T.textMuted }}>Setting up your routine…</div>
    </div>
  )

  return null
}
