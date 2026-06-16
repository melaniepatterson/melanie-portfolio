import { ACTIVE_STEP_KEYS, SKIN_TYPE_NOTES } from './programOptions'

const T = {
  white:     '#FFFFFF',
  border:    '#DDD8D0',
  text:      '#1A1A1A',
  textMuted: '#6B6560',
  pinkDeep:  '#C93500',
  cream:     '#F5F0EB',
}

// Renders the checkbox list of program_phase_options with:
// - multi-select via toggling a Set
// - "skip" option exclusive with everything else
// - actives (vitamin_c / exfoliant) mutually exclusive with each other
// - contextual skin-type notes (informational only — never disables an option)
export default function ProgramOptionsChecklist({ options, selected, onToggle, skinType }) {
  const realOptions = options.filter(o => !o.is_skip_option)
  const skipOption = options.find(o => o.is_skip_option)
  const hasActiveSelected = realOptions.some(o => ACTIVE_STEP_KEYS.has(o.step_key) && selected.has(o.id))
  const notesForSkinType = SKIN_TYPE_NOTES[(skinType || '').toLowerCase()] || {}

  return (
    <>
      {realOptions.map(opt => {
        const isOn = selected.has(opt.id)
        const isActive = ACTIVE_STEP_KEYS.has(opt.step_key)
        const disabledByOtherActive = isActive && hasActiveSelected && !isOn
        const skinNote = notesForSkinType[opt.step_key]
        return (
          <div key={opt.id} style={{ marginBottom: 8 }}>
            <button onClick={() => !disabledByOtherActive && onToggle(opt)}
              disabled={disabledByOtherActive}
              style={{
                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 10,
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
                  {isActive && <span style={{ fontSize: 9, fontWeight: 700, color: isOn ? 'rgba(255,255,255,0.7)' : T.pinkDeep, marginLeft: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>New ingredient — go slow</span>}
                </div>
                <div style={{ fontSize: 12, color: isOn ? 'rgba(255,255,255,0.75)' : T.textMuted, lineHeight: 1.6 }}>
                  {opt.description}
                </div>
              </div>
            </button>
            {skinNote && (
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, padding: '8px 12px', background: T.cream, border: `0.5px solid ${T.border}`, borderTop: 'none' }}>
                {skinNote}
              </div>
            )}
          </div>
        )
      })}

      {hasActiveSelected && (
        <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, padding: '8px 0 4px', fontStyle: 'italic' }}>
          We limit new ingredients like this to one at a time, so it's clear what your skin is responding to. You can add another later.
        </div>
      )}

      {skipOption && (
        <button onClick={() => onToggle(skipOption)}
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
    </>
  )
}

// Shared toggle logic for the selection Set — used by both onboarding
// and the in-app Phase 2 picker so behavior stays identical.
export function toggleOption(prev, opt, options) {
  const next = new Set(prev)
  if (opt.is_skip_option) {
    return next.has(opt.id) ? new Set() : new Set([opt.id])
  }
  const skipOpt = options.find(o => o.is_skip_option)
  if (skipOpt) next.delete(skipOpt.id)

  if (next.has(opt.id)) {
    next.delete(opt.id)
    return next
  }

  if (ACTIVE_STEP_KEYS.has(opt.step_key)) {
    for (const o of options) {
      if (ACTIVE_STEP_KEYS.has(o.step_key) && o.id !== opt.id) next.delete(o.id)
    }
  }

  next.add(opt.id)
  return next
}
