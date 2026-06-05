import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  pink:         '#FFD6F9',
  pinkDeep:     '#F472B6',
  orange:       '#FB923C',
  orangeLight:  '#FED7AA',
  cream:        '#FAF7F2',
  creamDark:    '#F0EBE3',
  text:         '#1C1917',
  textMuted:    '#78716C',
  textLight:    '#A8A29E',
  border:       '#E7E0D8',
  white:        '#FFFFFF',
  tret:         { bg: '#EDE9FE', border: '#A78BFA', text: '#5B21B6' },
  bha:          { bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  pause:        { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' },
  recovery:     { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },
  microneedling: { bg: '#FED7AA', border: '#FB923C', text: '#9A3412' },
  massage:      { bg: '#E0F2FE', border: '#38BDF8', text: '#0C4A6E' },
  hairTreatment:      { bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  peel:         { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },
  electrolysis: { bg: '#EDE9FE', border: '#A78BFA', text: '#5B21B6' },
  facial:       { bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  microderm:    { bg: '#E0F2FE', border: '#38BDF8', text: '#0C4A6E' },
  custom:       { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },
}

const PRODUCT_FLAGS = [
  { key: 'black_owned',       label: 'Black-owned',       bg: '#1a1a1a', color: '#fff'    },
  { key: 'indigenous_owned',  label: 'Indigenous-owned',  bg: '#7C3AED', color: '#fff'    },
  { key: 'poc_owned',         label: 'POC-owned',         bg: '#D97706', color: '#fff'    },
  { key: 'woman_owned',       label: 'Woman-owned',       bg: '#DB2777', color: '#fff'    },
  { key: 'lgbtq_owned',       label: 'LGBTQ+-owned',      bg: 'linear-gradient(90deg,#FF6B6B,#FFE66D,#4ECDC4)', color: '#1a1a1a' },
  { key: 'cruelty_free',      label: '🐰 Cruelty-free',   bg: '#D1FAE5', color: '#065F46' },
  { key: 'vegan',             label: '🌱 Vegan',           bg: '#ECFDF5', color: '#065F46' },
  { key: 'certified_organic', label: '🌿 Organic',         bg: '#F0FDF4', color: '#166534' },
  { key: 'fair_trade',        label: '🤝 Fair trade',      bg: '#FEF3C7', color: '#92400E' },
  { key: 'is_prescription',    label: '℞ Prescription',      bg: '#FFF7ED', color: '#9A3412' },
  { key: 'clean_formula',      label: '✨ Clean',             bg: '#FDF4FF', color: '#7E22CE' },
  { key: 'science_backed',     label: '🔬 Science-backed',    bg: '#EFF6FF', color: '#1D4ED8' },
]

const PAO_OPTIONS = [3, 6, 9, 12, 18, 24, 36]

const PRODUCT_INGREDIENT_CATEGORIES = {
  vitamin_c:       { label: 'Vitamin C',          forms: ['L-ascorbic acid (most potent)','Ascorbyl glucoside (stable)','Sodium ascorbyl phosphate','Ascorbyl tetraisopalmitate (oil-soluble)','Vitamin C powder (mix-in)','Other vitamin C derivative'] },
  niacinamide:     { label: 'Niacinamide',         forms: ['Niacinamide serum','Niacinamide toner','Other'] },
  hyaluronic_acid: { label: 'Hyaluronic acid',     forms: ['Low molecular weight','High molecular weight','Multi-weight blend','Other'] },
  peptides:        { label: 'Peptides',             forms: ['Matrixyl','Argireline','Copper peptides','Other peptides'] },
  retinoid:        { label: 'Retinoid',             forms: ['Tretinoin (prescription)','Adapalene','Retinol','Retinaldehyde','Tazarotene','Other retinoid'] },
  aha:             { label: 'AHA',                  forms: ['Glycolic acid','Lactic acid','Mandelic acid','Citric acid','Other AHA'] },
  bha:             { label: 'BHA',                  forms: ['Salicylic acid (leave-on)','Salicylic acid (rinse-off)','Betaine salicylate','Other BHA'] },
  pha:             { label: 'PHA',                  forms: ['Gluconolactone','Lactobionic acid','Other PHA'] },
  azelaic_acid:    { label: 'Azelaic acid',         forms: ['10% or under (OTC)','15-20% (prescription)','Other'] },
  benzoyl_peroxide:{ label: 'Benzoyl peroxide',     forms: ['2.5%','5%','10%'] },
  tranexamic_acid: { label: 'Tranexamic acid',      forms: ['Tranexamic acid serum','Other'] },
  alpha_arbutin:   { label: 'Alpha arbutin',        forms: ['Alpha arbutin serum','Other'] },
  kojic_acid:      { label: 'Kojic acid',           forms: ['Kojic acid serum','Other'] },
  bakuchiol:       { label: 'Bakuchiol',            forms: ['Bakuchiol serum','Other'] },
  centella:        { label: 'Centella / Cica',      forms: ['Centella serum','Cica cream','Madecassoside serum','Other'] },
  snail_mucin:     { label: 'Snail mucin',          forms: ['Snail mucin essence','Snail mucin serum','Other'] },
  antioxidant:     { label: 'Antioxidant',          forms: ['Resveratrol','Coenzyme Q10','Vitamin E','Ferulic acid','Other antioxidant'] },
  ceramide:        { label: 'Ceramide',             forms: ['Ceramide serum','Ceramide moisturizer','Other'] },
  squalane:        { label: 'Squalane',             forms: ['100% squalane','Squalane blend','Other'] },
}

const INGREDIENT_CATEGORIES = {
  micellar_water: {
    label: 'Micellar / cleansing water', order: 1,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Micellar water', 'Cleansing water', 'Other'],
    productCategories: ['micellar water', 'cleansing water'],
  },
  oil_cleanser: {
    label: 'Oil / balm cleanser', order: 2,
    dayTypes: { am: false, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Cleansing oil', 'Cleansing balm', 'Cleansing butter', 'Other'],
    productCategories: ['cleansing oil', 'cleansing balm', 'cleansing oil / balm'],
  },
  cleanser: {
    label: 'Water-based cleanser', order: 3,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: false,
    forms: ['Gel cleanser', 'Foam cleanser', 'Cream cleanser', 'Other'],
    productCategories: ['cleanser', 'face wash'],
  },
  aha_bha_toner: {
    label: 'Exfoliant toner (AHA / BHA)', order: 4,
    dayTypes: { am: false, main: false, off: true, recovery: false, pause: false },
    optional: true,
    forms: ['AHA toner (glycolic)', 'AHA toner (lactic)', 'BHA toner (salicylic)', 'Mixed AHA+BHA', 'PHA toner', 'Other'],
    productCategories: ['aha toner', 'bha toner', 'exfoliant toner'],
  },
  toner: {
    label: 'Toner', order: 5,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Hydrating toner', 'Softening toner', 'Balancing toner', 'Other'],
    productCategories: ['toner'],
  },
  essence: {
    label: 'Essence', order: 6,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Hydrating essence', 'Fermented essence', 'Treatment essence', 'Other'],
    productCategories: ['essence'],
  },
  watery_serum: {
    label: 'Watery serum', order: 7,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Hyaluronic acid serum', 'Niacinamide serum', 'Snail mucin', 'Centella serum', 'Vitamin C powder (mix-in)', 'Other watery serum'],
    productCategories: ['serum', 'hyaluronic acid', 'niacinamide', 'snail mucin'],
    ingredientCategories: ['hyaluronic_acid', 'niacinamide', 'snail_mucin', 'centella'],
  },
  treatment_serum: {
    label: 'Treatment serum', order: 8,
    dayTypes: { am: true, main: true, off: true, recovery: false, pause: false },
    optional: true,
    forms: ['Vitamin C serum', 'Peptide serum', 'Tranexamic acid', 'Alpha arbutin', 'Retinol serum', 'Bakuchiol', 'Other treatment serum'],
    productCategories: ['serum', 'vitamin c', 'peptides'],
    ingredientCategories: ['vitamin_c', 'peptides', 'tranexamic_acid', 'alpha_arbutin', 'kojic_acid', 'bakuchiol', 'antioxidant'],
  },
  retinoid: {
    label: 'Retinoid', order: 8.5,
    dayTypes: { am: false, main: true, off: false, recovery: false, pause: false },
    optional: false,
    forms: ['Tretinoin (prescription)', 'Adapalene', 'Retinol', 'Retinaldehyde', 'Tazarotene', 'Other retinoid'],
    productCategories: ['retinoid', 'retinol', 'tretinoin'],
    ingredientCategories: ['retinoid'],
  },
  spot_treatment: {
    label: 'Spot treatment', order: 9,
    dayTypes: { am: true, main: false, off: true, recovery: false, pause: false },
    optional: true,
    forms: ['Benzoyl peroxide', 'Azelaic acid', 'Salicylic acid spot treatment', 'Sulfur treatment', 'Other'],
    productCategories: ['spot treatment', 'azelaic acid', 'benzoyl peroxide'],
    ingredientCategories: ['benzoyl_peroxide', 'azelaic_acid', 'bha', 'aha'],
  },
  eye_cream: {
    label: 'Eye cream', order: 10,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Eye cream', 'Eye gel', 'Eye serum', 'Other'],
    productCategories: ['eye cream', 'eye gel'],
  },
  moisturizer: {
    label: 'Moisturizer', order: 11,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: false,
    forms: ['Gel moisturizer', 'Cream moisturizer', 'Lotion', 'Gel-cream', 'Barrier cream', 'Other'],
    productCategories: ['moisturizer', 'lotion', 'barrier cream'],
  },
  face_oil: {
    label: 'Face oil', order: 12,
    dayTypes: { am: false, main: true, off: true, recovery: 'professional', pause: true },
    optional: true,
    forms: ['Rosehip oil', 'Squalane', 'Jojoba oil', 'Marula oil', 'Argan oil', 'Other'],
    productCategories: ['face oil', 'facial oil', 'oil'],
  },
  occlusive: {
    label: 'Occlusive / slug', order: 13,
    dayTypes: { am: false, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Petrolatum / Vaseline', 'Lanolin', 'Plant-based occlusive', 'Other'],
    productCategories: ['occlusive', 'petrolatum'],
  },
  spf: {
    label: 'SPF', order: 14,
    dayTypes: { am: true, main: false, off: false, recovery: true, pause: true },
    optional: false,
    forms: ['Chemical SPF', 'Mineral SPF', 'Hybrid SPF', 'Tinted SPF', 'Other'],
    productCategories: ['spf', 'sunscreen', 'sun protection'],
  },
}

const PRODUCT_CATEGORIES = [
  'cleanser', 'cleansing oil / balm', 'toner', 'essence',
  'serum', 'moisturizer', 'spf', 'eye cream',
  'bha', 'azelaic acid', 'tretinoin',
  'body wash', 'body treatment', 'haircare', 'hair growth', 'boosts', 'other'
]

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, color: T.textLight, marginBottom: 3 }}>{children}</div>
}

function InfoTooltip({ text }) {
  const [pos, setPos] = useState(null)
  const ref = useRef(null)
  function show() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.top - 8, left: r.left + r.width / 2 })
    }
  }
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
      <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)}
        onTouchStart={e => { e.stopPropagation(); pos ? setPos(null) : show() }}
        style={{ width: 14, height: 14, borderRadius: '50%', background: T.border, color: T.textMuted, fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', userSelect: 'none', flexShrink: 0 }}
      >i</span>
      {pos && (
        <span style={{ position: 'fixed', top: pos.top, left: Math.min(pos.left, window.innerWidth - 240), transform: 'translate(-50%, -100%)', background: T.text, color: T.white, fontSize: 11, lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, width: 220, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', pointerEvents: 'none' }}>
          {text}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: 4, borderStyle: 'solid', borderColor: `${T.text} transparent transparent transparent` }} />
        </span>
      )}
    </span>
  )
}

function StarRating({ value, onChange, size = 12 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          onClick={onChange ? () => onChange(n) : undefined}
          style={{
            fontSize: size, cursor: onChange ? 'pointer' : 'default',
            color: n <= value ? '#FB923C' : T.textLight,
          }}
        >★</span>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: T.creamDark, border: `0.5px solid ${T.border}`, fontSize: 12, color: T.text, marginBottom: 6 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: T.pinkDeep }} />
      {label}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, width = 140 }) {
  return <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={{ width, fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }} />
}

function Btn({ onClick, children, variant = 'default', style: sx = {}, disabled = false }) {
  const base = { padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }
  const variants = {
    default:   { border: `0.5px solid ${T.border}`,   background: 'transparent', color: T.textMuted },
    primary:   { border: `0.5px solid ${T.pinkDeep}`, background: T.pink,        color: T.text, fontWeight: 600 },
    danger:    { border: '0.5px solid #FB7185',        background: 'transparent', color: '#9F1239' },
    secondary: { border: `0.5px solid ${T.border}`,   background: T.creamDark,   color: T.text },
    active:    { border: `0.5px solid ${T.pinkDeep}`, background: T.pink,        color: T.text },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...sx }}>{children}</button>
}

function PaoIcon({ months, size = 20 }) {
  if (!months) return null
  const s = Math.round(size)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, verticalAlign: 'middle' }}>
      <svg width={s} height={s} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4 8V6.5C4 5.67 6.69 5 10 5s6 .67 6 1.5V8" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7 5.2L6 3.5M13 5.2L14 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: Math.max(8, Math.round(s * 0.5)), fontWeight: 700, lineHeight: 1 }}>{months}M</span>
    </span>
  )
}

function ProductFlagBadges({ product, max }) {
  const active = PRODUCT_FLAGS.filter(f => product[f.key])
  const shown = max ? active.slice(0, max) : active
  const rest = max && active.length > max ? active.length - max : 0
  if (!shown.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
      {shown.map(f => (
        <span key={f.key} style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 10,
          background: f.bg, color: f.color,
          border: '0.5px solid rgba(0,0,0,0.08)', fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>{f.label}</span>
      ))}
      {rest > 0 && <span style={{ fontSize: 9, color: T.textLight, padding: '2px 4px' }}>+{rest} more</span>}
    </div>
  )
}

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', brand: '', category: 'cleanser',
    imageUrl: '', purchaseUrl: '',
    bdsCompliant: true, tags: [],
    effectiveness: 0, buyAgain: null, notes: '',
    ingredient_category: '', ingredient_form: '',
    black_owned: false, indigenous_owned: false, poc_owned: false, woman_owned: false,
    lgbtq_owned: false, cruelty_free: false, vegan: false, certified_organic: false, fair_trade: false,
    clean_formula: false, science_backed: false, is_prescription: false,
    purchased_at: '', opened_at: '', expires_at: '', pao_months: null,
    store_name: '', direct_url: '', direct_store_name: '',
    ...(initial ? { ...initial, tags: initial.tags || [] } : {})
  })
  const [tagInput, setTagInput] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function addTag() {
    const raw = tagInput.trim()
    if (!raw) return
    const t = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
    if ((form.tags || []).map(x => x.toLowerCase()).includes(t.toLowerCase())) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  function removeTag(t) { set('tags', (form.tags || []).filter(x => x !== t)) }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 12 }}>
        {initial?.id ? 'Edit product' : 'Add product'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><FieldLabel>Product name</FieldLabel><TextInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Blueberry Cleanser" width="100%" /></div>
        <div><FieldLabel>Brand</FieldLabel><TextInput value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Glow Recipe" width="100%" /></div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Category</FieldLabel>
        <select value={form.category} onChange={e => set('category', e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text, width: '100%' }}>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><FieldLabel>Image URL</FieldLabel><TextInput value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." width="100%" /></div>
        <div><FieldLabel>Purchase URL</FieldLabel><TextInput value={form.purchaseUrl} onChange={e => set('purchaseUrl', e.target.value)} placeholder="https://..." width="100%" /></div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Where do you use this? (select all that apply)</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Face', 'Body', 'Hair'].map(area => {
            const key = area.toLowerCase()
            const active = !!(form.applicationArea?.[key])
            return (
              <button key={key} onClick={() => set('applicationArea', { ...(form.applicationArea || {}), [key]: !active })}
                style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', border: `0.5px solid ${active ? T.pinkDeep : T.border}`, background: active ? T.pink : 'transparent', color: active ? T.text : T.textMuted, fontWeight: active ? 600 : 400 }}>
                {area}
              </button>
            )
          })}
        </div>
      </div>

      {/* Currently using + Would buy again — same row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
        <Toggle checked={!!form.currentlyUsing} onChange={e => set('currentlyUsing', e.target.checked)} label="I'm currently using this" />
        <Toggle checked={form.buyAgain === true} onChange={e => set('buyAgain', e.target.checked ? true : null)} label="Would buy again" />
      </div>

      {/* Purchase & expiry tracking */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12, marginBottom: 10 }}>
        <FieldLabel>Purchase & expiry <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span></FieldLabel>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>Purchased</FieldLabel>
          <input type="date" value={form.purchased_at || ''} onChange={e => set('purchased_at', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>Opened</FieldLabel>
          <input type="date" value={form.opened_at || ''} onChange={e => set('opened_at', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>Expires</FieldLabel>
          <input type="date" value={form.expires_at || ''} onChange={e => set('expires_at', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <PaoIcon months={form.pao_months} size={14} />
              PAO
              <InfoTooltip text="Period After Opening — how long the product is good for once opened. Look for the open jar symbol on packaging." />
            </span>
          </FieldLabel>
          <select value={form.pao_months || ''} onChange={e => set('pao_months', e.target.value ? Number(e.target.value) : null)}
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: form.pao_months ? T.text : T.textMuted, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
            <option value="">— Select PAO —</option>
            {PAO_OPTIONS.map(m => <option key={m} value={m}>{m} months</option>)}
          </select>
        </div>
      </div>
      {form.opened_at && form.pao_months && (
        <div style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic', marginBottom: 10 }}>
          Use by: {new Date(new Date(form.opened_at).setMonth(new Date(form.opened_at).getMonth() + form.pao_months)).toLocaleDateString()}
        </div>
      )}

      {/* Ownership & ethics */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12, marginBottom: 8 }}>
        <FieldLabel>Ownership & ethics</FieldLabel>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'black_owned',       label: 'Black-owned'       },
          { key: 'indigenous_owned',  label: 'Indigenous-owned'  },
          { key: 'poc_owned',         label: 'POC-owned'         },
          { key: 'woman_owned',       label: 'Woman-owned'       },
          { key: 'lgbtq_owned',       label: 'LGBTQ+-owned'      },
          { key: 'cruelty_free',      label: 'Cruelty-free'      },
          { key: 'vegan',             label: 'Vegan'             },
          { key: 'certified_organic', label: 'Certified organic' },
          { key: 'fair_trade',        label: 'Fair trade'        },
          { key: 'is_prescription',   label: '℞ Prescription'    },
          { key: 'clean_formula',     label: 'Clean formula'     },
          { key: 'science_backed',    label: 'Science-backed'    },
        ].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => set(key, !form[key])} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
            border: `0.5px solid ${form[key] ? T.pinkDeep : T.border}`,
            background: form[key] ? T.pink : 'transparent',
            color: T.text, fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Effectiveness</FieldLabel>
        <StarRating value={form.effectiveness} onChange={v => set('effectiveness', v)} size={18} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Tags (fragrance free, silicone free, etc.)</FieldLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {(form.tags || []).map(t => (
            <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: T.pink, color: T.text, border: `0.5px solid ${T.pinkDeep}`, cursor: 'pointer' }} onClick={() => removeTag(t)}>
              {t} ×
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <TextInput value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="e.g. fragrance free" width={150} />
          <Btn variant="secondary" onClick={addTag}>Add</Btn>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Ingredient category <span style={{ fontWeight: 400, color: T.textLight }}>(optional — enables conflict detection)</span></FieldLabel>
        <select
          value={form.ingredient_category || ''}
          onChange={e => set('ingredient_category', e.target.value)}
          style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: form.ingredient_category ? T.text : T.textMuted, fontFamily: 'inherit', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
        >
          <option value="">— Select ingredient category —</option>
          {Object.entries(PRODUCT_INGREDIENT_CATEGORIES).map(([key, cat]) => (
            <option key={key} value={key}>{cat.label}</option>
          ))}
        </select>
        {form.ingredient_category && PRODUCT_INGREDIENT_CATEGORIES[form.ingredient_category]?.forms?.length > 0 && (<>
          <FieldLabel>Ingredient form <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span></FieldLabel>
          <select
            value={form.ingredient_form || ''}
            onChange={e => set('ingredient_form', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: form.ingredient_form ? T.text : T.textMuted, fontFamily: 'inherit', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
          >
            <option value="">— Select form —</option>
            {PRODUCT_INGREDIENT_CATEGORIES[form.ingredient_category].forms.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>Store name <span style={{ fontWeight: 400, color: T.textLight }}>(e.g. Ulta)</span></FieldLabel>
          <input value={form.store_name || ''} onChange={e => set('store_name', e.target.value)} placeholder="e.g. Sephora"
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>Direct URL <span style={{ fontWeight: 400, color: T.textLight }}>(brand site)</span></FieldLabel>
          <input value={form.direct_url || ''} onChange={e => set('direct_url', e.target.value)} placeholder="https://..."
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel>Direct store name <span style={{ fontWeight: 400, color: T.textLight }}>(e.g. The Ordinary)</span></FieldLabel>
          <input value={form.direct_store_name || ''} onChange={e => set('direct_store_name', e.target.value)} placeholder="e.g. The Ordinary"
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Notes</FieldLabel>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." style={{ width: '100%', fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, borderTop: `0.5px solid ${T.border}`, paddingTop: 10 }}>
        <Btn variant="primary" onClick={() => form.name && onSave({ ...form, id: form.id || uid() })} disabled={!form.name}>Save product</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ─── STORE NAME FROM URL ──────────────────────────────────────
const STORE_MAP = {
  'ulta.com':                'Ulta',
  'sephora.com':             'Sephora',
  'amazon.com':              'Amazon',
  'target.com':              'Target',
  'walmart.com':             'Walmart',
  'cvs.com':                 'CVS',
  'walgreens.com':           'Walgreens',
  'theordinary.com':         'The Ordinary',
  'blackgirlsunscreen.com':  'Black Girl Sunscreen',
  'cosrx.com':               'COSRX',
  'glowrecipe.com':          'Glow Recipe',
  'farmacybeauty.com':       'Farmacy',
  'puritoseoul.com':         'Purito',
  'goodmolecules.com':       'Good Molecules',
  'starface.world':          'Starface',
  'vegamour.com':            'Vegamour',
  'olaplex.com':             'Olaplex',
  'us.klairs.com':           'Klairs',
  'klairs.com':              'Klairs',
  'anua.com':                'Anua',
  'clinique.com':            'Clinique',
  'skinstore.com':           'SkinStore',
  'dermstore.com':           'Dermstore',
  'cultbeauty.com':          'Cult Beauty',
  'lookfantastic.com':       'Look Fantastic',
  'nordstrom.com':           'Nordstrom',
  'macys.com':               "Macy's",
  'bloomingdales.com':       "Bloomingdale's",
  'revolve.com':             'Revolve',
  'yesstyle.com':            'YesStyle',
  'iherb.com':               'iHerb',
  'glamradar.com':           'Glam Radar',
}

function getStoreName(url) {
  if (!url) return null
  try {
    const hostname = new URL(url).hostname.replace(/^(www|m)\./, '')
    if (STORE_MAP[hostname]) return STORE_MAP[hostname]
    // Fallback: capitalize the root domain
    const root = hostname.split('.')[0]
    return root.charAt(0).toUpperCase() + root.slice(1)
  } catch {
    return null
  }
}


// ─── PRODUCT LIBRARY (standalone, no external deps) ──────────
function ProductLibrary({ products, onEdit, onAdd, onDelete }) {
  const [filterCat, setFilterCat] = useState('all')
  const [filterFlags, setFilterFlags] = useState([])
  const [filterUsing, setFilterUsing] = useState(false)
  const [filterBuyAgain, setFilterBuyAgain] = useState(false)
  const [search, setSearch] = useState('')

  const ETHICS_FILTERS = [
    { key: 'black_owned',       label: 'Black-owned'      },
    { key: 'indigenous_owned',  label: 'Indigenous-owned' },
    { key: 'poc_owned',         label: 'POC-owned'        },
    { key: 'woman_owned',       label: 'Woman-owned'      },
    { key: 'lgbtq_owned',       label: 'LGBTQ+-owned'     },
    { key: 'cruelty_free',      label: 'Cruelty-free'     },
    { key: 'vegan',             label: 'Vegan'            },
    { key: 'certified_organic', label: 'Organic'          },
    { key: 'fair_trade',        label: 'Fair trade'       },
    { key: 'clean_formula',     label: 'Clean'            },
    { key: 'science_backed',    label: 'Science-backed'   },
    { key: 'is_prescription',   label: '℞ Rx'             },
  ]

  function toggleFlag(key) {
    setFilterFlags(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const hasFilters = filterCat !== 'all' || filterFlags.length > 0 || filterUsing || filterBuyAgain

  const list = Object.values(products)
    .filter(p => {
      const matchCat = filterCat === 'all' || p.category === filterCat
      const matchSearch = !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(search.toLowerCase())
      const matchFlags = filterFlags.length === 0 || filterFlags.every(f => p[f])
      const matchUsing = !filterUsing || p.currentlyUsing
      const matchBuyAgain = !filterBuyAgain || p.buyAgain === true
      return matchCat && matchSearch && matchFlags && matchUsing && matchBuyAgain
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  function SideSection({ title, children }) {
    return (
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingBottom: 6, borderBottom: `0.5px solid ${T.border}` }}>
          {title}
        </div>
        {children}
      </div>
    )
  }

  function SideCheck({ label, checked, onChange }) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0', cursor: 'pointer', fontSize: 12, color: checked ? T.text : T.textMuted, userSelect: 'none' }}>
        <input type="checkbox" checked={checked} onChange={onChange}
          style={{ width: 13, height: 13, cursor: 'pointer', accentColor: T.pinkDeep, flexShrink: 0 }} />
        {label}
      </label>
    )
  }

  return (
    <div style={{ padding: '12px 20px' }}>
      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search products..."
        style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '8px 12px', border: '0.5px solid ' + T.border, borderRadius: 8, background: T.white, color: T.text, fontFamily: 'inherit', outline: 'none', marginBottom: 16 }}
      />

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Sidebar ── */}
        <div style={{ width: 164, flexShrink: 0 }}>

          <SideSection title="Category">
            {['all', ...PRODUCT_CATEGORIES].map(cat => {
              const active = filterCat === cat
              return (
                <div key={cat} onClick={() => setFilterCat(cat)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0', cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{
                    width: 13, height: 13, borderRadius: 3, flexShrink: 0, display: 'inline-block',
                    border: `1.5px solid ${active ? T.pinkDeep : T.border}`,
                    background: active ? T.pink : 'transparent',
                  }} />
                  <span style={{ fontSize: 12, color: active ? T.pinkDeep : T.textMuted, fontWeight: active ? 600 : 400 }}>
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </span>
                </div>
              )
            })}
          </SideSection>

          <SideSection title="Status">
            <SideCheck label="Currently using" checked={filterUsing} onChange={e => setFilterUsing(e.target.checked)} />
            <SideCheck label="Would buy again" checked={filterBuyAgain} onChange={e => setFilterBuyAgain(e.target.checked)} />
          </SideSection>

          <SideSection title="Ethics">
            {ETHICS_FILTERS.map(({ key, label }) => (
              <SideCheck key={key} label={label} checked={filterFlags.includes(key)} onChange={() => toggleFlag(key)} />
            ))}
          </SideSection>

          {hasFilters && (
            <button
              onClick={() => { setFilterCat('all'); setFilterFlags([]); setFilterUsing(false); setFilterBuyAgain(false) }}
              style={{ fontSize: 11, color: T.textMuted, background: 'transparent', border: `0.5px solid ${T.border}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear all ×
            </button>
          )}
        </div>

        {/* ── Product grid ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {list.length === 0 && (
            <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
              {Object.keys(products).length === 0
                ? 'No products yet — tap + Add product to get started.'
                : 'No products match your search.'}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {list.map(p => (
              <div key={p.id} style={{ background: T.white, border: '0.5px solid ' + T.border, borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{p.name}</div>
                    {p.brand && <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{p.brand}</div>}
                    {p.category && (
                      <div style={{ fontSize: 11, color: T.textLight, marginBottom: 4 }}>
                        {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                      </div>
                    )}
                    <ProductFlagBadges product={p} max={4} />
                    {p.pao_months && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                        <PaoIcon months={p.pao_months} size={13} />
                      </span>
                    )}
                    {p.effectiveness > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <StarRating value={p.effectiveness} size={11} />
                      </div>
                    )}
                    {p.currentlyUsing && (
                      <div style={{ fontSize: 10, color: T.pinkDeep, fontWeight: 600, marginTop: 4 }}>Currently using</div>
                    )}
                    {p.notes && (
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>{p.notes}</div>
                    )}
                    {p.purchaseUrl && (
                      <a href={p.purchaseUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', marginTop: 8, fontSize: 11, padding: '4px 12px', borderRadius: 20, background: T.pinkDeep, color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
                        Buy at {getStoreName(p.purchaseUrl) || 'store'} →
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignSelf: 'flex-start' }}>
                    <Btn onClick={() => onEdit(p)} style={{ fontSize: 11, padding: '3px 10px' }}>Edit</Btn>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete ' + p.name + '? This cannot be undone.')) onDelete(p)
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 18, lineHeight: 1, padding: 0 }}
                    >×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PRODUCTS PAGE ────────────────────────────────────────────
export default function ProductsPage({ session }) {
  const [products, setProducts] = useState({})
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    async function load() {
      const { data } = await supabase.from('products').select('*').eq('user_id', userId)
      if (data) {
        const map = {}
        data.forEach(p => {
          map[p.id] = {
            id: p.id, name: p.name, brand: p.brand, category: p.category,
            imageUrl: p.image_url, purchaseUrl: p.purchase_url,
            bdsCompliant: p.bds_compliant, currentlyUsing: p.currently_using,
            applicationArea: p.application_area || {},
            effectiveness: p.effectiveness, buyAgain: p.buy_again,
            tags: (p.tags || []).map(t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t),
            notes: p.notes,
            ingredient_category: p.ingredient_category || '',
            ingredient_form: p.ingredient_form || '',
            black_owned: p.black_owned || false,
            indigenous_owned: p.indigenous_owned || false,
            poc_owned: p.poc_owned || false,
            woman_owned: p.woman_owned || false,
            lgbtq_owned: p.lgbtq_owned || false,
            cruelty_free: p.cruelty_free || false,
            vegan: p.vegan || false,
            certified_organic: p.certified_organic || false,
            fair_trade: p.fair_trade || false,
            clean_formula: p.clean_formula || false,
            science_backed: p.science_backed || false,
            is_prescription: p.is_prescription || false,
            purchased_at: p.purchased_at || '',
            opened_at: p.opened_at || '',
            expires_at: p.expires_at || '',
            pao_months:          p.pao_months || null,
            store_name:          p.store_name || '',
            direct_url:          p.direct_url || '',
            direct_store_name:   p.direct_store_name || '',
          }
        })
        setProducts(map)
      }
      setLoading(false)
    }
    load()
  }, [userId])

  async function saveProduct(product) {
    const row = {
      id: product.id,
      user_id: userId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      image_url: product.imageUrl,
      purchase_url: product.purchaseUrl,
      bds_compliant: product.bdsCompliant,
      currently_using: product.currentlyUsing,
      application_area: product.applicationArea || {},
      effectiveness: product.effectiveness,
      buy_again: product.buyAgain,
      tags: product.tags || [],
      notes: product.notes,
      ingredient_category: product.ingredient_category || null,
      ingredient_form: product.ingredient_form || null,
      black_owned: product.black_owned || false,
      indigenous_owned: product.indigenous_owned || false,
      poc_owned: product.poc_owned || false,
      woman_owned: product.woman_owned || false,
      lgbtq_owned: product.lgbtq_owned || false,
      cruelty_free: product.cruelty_free || false,
      vegan: product.vegan || false,
      certified_organic: product.certified_organic || false,
      fair_trade: product.fair_trade || false,
      clean_formula: product.clean_formula || false,
      science_backed: product.science_backed || false,
      is_prescription: product.is_prescription || false,
      purchased_at: product.purchased_at || null,
      opened_at: product.opened_at || null,
      expires_at: product.expires_at || null,
      pao_months:          product.pao_months || null,
      store_name:          product.store_name || null,
      direct_url:          product.direct_url || null,
      direct_store_name:   product.direct_store_name || null,
    }
    if (!row.id) {
      row.id = crypto.randomUUID()
      product = { ...product, id: row.id }
    }
    await supabase.from('products').upsert(row)
    setProducts(prev => ({ ...prev, [row.id]: { ...product, id: row.id } }))
    setEditingProduct(null)
  }

  async function deleteProduct(product) {
    if (product.id) await supabase.from('products').delete().eq('id', product.id)
    setProducts(prev => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })
  }

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: T.cream, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '0.5px solid ' + T.border, background: T.white }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.history.back()}
            style={{ border: '0.5px solid ' + T.border, background: 'transparent', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.text }}>←</button>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Product library</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>({Object.keys(products).length})</div>
        </div>
        <button onClick={() => setEditingProduct('new')}
          style={{ border: 'none', background: T.pinkDeep, color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
          + Add product
        </button>
      </div>

      {/* Form */}
      {editingProduct && (
        <div style={{ padding: '16px 20px' }}>
          <ProductForm
            initial={editingProduct === 'new' ? undefined : editingProduct}
            onSave={saveProduct}
            onCancel={() => setEditingProduct(null)}
          />
        </div>
      )}

      {/* Library */}
      {!editingProduct && (
        loading
          ? <div style={{ padding: '40px 20px', fontSize: 13, color: T.textMuted, textAlign: 'center' }}>Loading your products...</div>
          : <ProductLibrary
              products={products}
              onEdit={p => setEditingProduct(p)}
              onAdd={() => setEditingProduct('new')}
              onDelete={deleteProduct}
            />
      )}
    </div>
  )
}
