// v2-stars-modal-fix
import { useState, useEffect, useRef } from 'react'
import GlowUpLogo from './GlowUpWordmark.js'
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
  { key: 'is_discontinued',    label: '⛔ Discontinued',      bg: '#FEF2F2', color: '#991B1B' },
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

// Acronyms that should be fully uppercase in labels
const UPPERCASE_WORDS = new Set(['spf', 'bha', 'aha', 'pha', 'bha/aha', 'aha/bha'])
// Lightweight nav menu — same links as the calendar sidebar
function NavMenu() {
  const [open, setOpen] = useState(false)
  const links = [
    { label: 'Calendar',          href: '/routine' },
    { label: 'Routine history',   href: '/routine' },
    { label: 'Product library',   href: '/routine/products' },
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

function formatCatLabel(cat) {
  return cat.split(' ').map(w =>
    UPPERCASE_WORDS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ')
}

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
  { key: 'clean_formula',     label: 'Clean formula'    },
  { key: 'science_backed',    label: 'Science-backed'   },
  { key: 'is_prescription',   label: '℞ Prescription'   },
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
  const path = 'M12,2 L14.35,9.24 L21.51,8.91 L15.80,13.24 L17.88,20.09 L12,16 L6.12,20.09 L8.20,13.24 L2.49,8.91 L9.65,9.24 Z'
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1,2,3,4,5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          onClick={onChange ? () => onChange(n) : undefined}
          style={{ cursor: onChange ? 'pointer' : 'default', display: 'block', flexShrink: 0 }}>
          <path d={path}
            fill={n <= value ? '#000000' : 'none'}
            stroke="#000000"
            strokeWidth={n <= value ? 0 : 1}
            strokeLinejoin="round" />
        </svg>
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
          fontSize: 9, padding: '2px 6px', borderRadius: 0,
          background: f.bg, color: f.color,
          border: '0.5px solid rgba(0,0,0,0.08)', fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>{f.label}</span>
      ))}
      {rest > 0 && <span style={{ fontSize: 9, color: T.textLight, padding: '2px 4px' }}>+{rest} more</span>}
    </div>
  )
}


// ─── PRODUCT IMAGE UPLOAD ──────────────────────────────────────────────────
const PRODUCT_IMAGES_URL = 'https://brcjhshptisevcndqavz.supabase.co/storage/v1/object/public/product-images/'

async function imageToWebP(file, maxDim = 600, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('toBlob failed')),
        'image/webp', quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

function ProductImageUpload({ value, onChange, session, productName }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(value || null)
  const ref = useRef(null)

  useEffect(() => { setPreview(value || null) }, [value])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return }
    setUploading(true)
    try {
      const webp = await imageToWebP(file)
      const userId = session?.user?.id || 'anon'
      const slug = (productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
      const path = `${userId}/${slug}-${Date.now()}.webp`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, webp, { upsert: true, contentType: 'image/webp' })
      if (error) throw error
      const publicUrl = PRODUCT_IMAGES_URL + path
      setPreview(publicUrl)
      onChange(publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed — please try again')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      {preview && (
        <div style={{ position: 'relative', marginBottom: 6, display: 'inline-block', borderRadius: 0, overflow: 'hidden', border: `0.5px solid ${T.border}`, background: T.creamDark, verticalAlign: 'top' }}>
          <img src={preview} alt="" style={{ display: 'block', maxHeight: 88, maxWidth: 120, objectFit: 'contain' }} />
          <button
            onClick={() => { setPreview(null); onChange('') }}
            style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 18, height: 18, color: '#fff', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => ref.current?.click()}
          disabled={uploading}
          style={{ flex: 1, padding: '6px 10px', borderRadius: 0, border: `0.5px solid ${T.border}`, background: T.creamDark, color: T.textMuted, fontSize: 11, cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
          {uploading ? 'Uploading...' : preview ? '↑ Replace image' : '↑ Upload image'}
        </button>
        <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>
    </div>
  )
}

function ProductForm({ initial, onSave, onCancel, catalogProducts, session }) {
  const [form, setForm] = useState({
    name: '', brand: '', category: 'cleanser',
    imageUrl: '', purchaseUrl: '',
    bdsCompliant: true, tags: [],
    effectiveness: 0, buyAgain: null, notes: '',
    _effectiveness: initial?.effectiveness || 0,
    _buyAgain: initial?.buyAgain ?? null,
    ingredient_category: '', ingredient_form: '',
    black_owned: false, indigenous_owned: false, poc_owned: false, woman_owned: false,
    lgbtq_owned: false, cruelty_free: false, vegan: false, certified_organic: false, fair_trade: false,
    clean_formula: false, science_backed: false, is_prescription: false, is_discontinued: false,
    purchased_at: '', opened_at: '', expires_at: '', pao_months: null,
    store_name: '', direct_url: '', direct_store_name: '', catalog_product_id: null,
    ...(initial ? { ...initial, tags: initial.tags || [] } : {})
  })
  const [tagInput, setTagInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [brandSuggestions, setBrandSuggestions] = useState([])
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false)

  // All known brands from catalog
  const allBrands = [...new Set(Object.values(catalogProducts || {}).map(p => p.brand || '').filter(Boolean))].sort()

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'name' && catalogProducts) {
      const q = v.toLowerCase().trim()
      if (q.length > 1) {
        const matches = Object.values(catalogProducts).filter(p =>
          p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)
        ).slice(0, 6)
        setSuggestions(matches)
        setShowSuggestions(matches.length > 0)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }
    if (k === 'brand') {
      const q = v.toLowerCase().trim()
      if (q.length > 0) {
        const matches = allBrands.filter(b => b.toLowerCase().startsWith(q)).slice(0, 6)
        setBrandSuggestions(matches)
        setShowBrandSuggestions(matches.length > 0)
      } else {
        setBrandSuggestions([])
        setShowBrandSuggestions(false)
      }
    }
  }

  function selectSuggestion(p) {
    setForm(f => ({
      ...f,
      name: p.name,
      brand: p.brand || f.brand,
      category: p.category || f.category,
      notes: p.notes || f.notes,
      ingredient_category: p.ingredient_category || f.ingredient_category,
      ingredient_form: p.ingredient_form || f.ingredient_form,
      purchaseUrl: p.purchaseUrl || f.purchaseUrl,
      store_name: p.store_name || f.store_name,
      direct_url: p.direct_url || f.direct_url,
      direct_store_name: p.direct_store_name || f.direct_store_name,
      black_owned: p.black_owned || f.black_owned,
      indigenous_owned: p.indigenous_owned || f.indigenous_owned,
      poc_owned: p.poc_owned || f.poc_owned,
      woman_owned: p.woman_owned || f.woman_owned,
      lgbtq_owned: p.lgbtq_owned || f.lgbtq_owned,
      cruelty_free: p.cruelty_free || f.cruelty_free,
      vegan: p.vegan || f.vegan,
      certified_organic: p.certified_organic || f.certified_organic,
      fair_trade: p.fair_trade || f.fair_trade,
      clean_formula: p.clean_formula || f.clean_formula,
      science_backed: p.science_backed || f.science_backed,
      catalog_product_id: p.id,
    }))
    setSuggestions([])
    setShowSuggestions(false)
  }

  function addTag() {
    const raw = tagInput.trim()
    if (!raw) return
    const t = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
    if ((form.tags || []).map(x => x.toLowerCase()).includes(t.toLowerCase())) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  function removeTag(t) { set('tags', (form.tags || []).filter(x => x !== t)) }

  const inputStyle = { width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '6px 2px', border: 'none', borderBottom: '1px solid #000000', borderRadius: 0, background: 'transparent', color: T.text, fontFamily: 'inherit', outline: 'none' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '16px 18px', marginBottom: 10, maxWidth: 460 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>
        {initial?.id ? 'Edit product' : 'Add product'}
      </div>

      {/* Name — full width with autocomplete */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <FieldLabel>Product name</FieldLabel>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Blueberry Cleanser" style={{ ...inputStyle }} />
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '0.5px solid ' + T.border, borderRadius: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: 200, overflowY: 'auto' }}>
            {suggestions.map(p => (
              <div key={p.id} onMouseDown={() => selectSuggestion(p)}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '0.5px solid ' + T.border }}
                onMouseEnter={e => e.currentTarget.style.background = T.creamDark}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <div style={{ fontWeight: 500, color: T.text }}>{p.name}</div>
                {p.brand && <div style={{ fontSize: 11, color: T.textMuted }}>{p.brand}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand + Category side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
        <div style={{ position: 'relative' }}>
          <FieldLabel>Brand</FieldLabel>
          <input value={form.brand} onChange={e => set('brand', e.target.value)}
            onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 150)}
            placeholder="e.g. Glow Recipe" style={inputStyle} />
          {showBrandSuggestions && brandSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '0.5px solid ' + T.border, borderRadius: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: 180, overflowY: 'auto' }}>
              {brandSuggestions.map(b => (
                <div key={b} onMouseDown={() => { set('brand', b); setShowBrandSuggestions(false) }}
                  style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '0.5px solid ' + T.border, color: T.text }}
                  onMouseEnter={e => e.currentTarget.style.background = T.creamDark}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  {b}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <FieldLabel>Category</FieldLabel>
          <select value={form.category} onChange={e => set('category', e.target.value)} style={selectStyle}>
            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{formatCatLabel(c)}</option>)}
          </select>
        </div>
      </div>

      {/* Image upload */}
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Product image</FieldLabel>
        <ProductImageUpload value={form.imageUrl} onChange={url => set('imageUrl', url)} session={session} productName={form.name} />
      </div>

      {/* Application area */}
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Where do you use this?</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Face', 'Body', 'Hair'].map(area => {
            const key = area.toLowerCase()
            const active = !!(form.applicationArea?.[key])
            return (
              <button key={key} onClick={() => set('applicationArea', { ...(form.applicationArea || {}), [key]: !active })}
                style={{ fontSize: 11, padding: '4px 12px', borderRadius: 0, cursor: 'pointer', border: `1px solid ${active ? T.text : T.border}`, background: active ? T.text : 'transparent', color: active ? '#fff' : T.textMuted, fontFamily: 'inherit' }}>
                {area}
              </button>
            )
          })}
        </div>
      </div>

      {/* PAO + dates */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginBottom: 8 }}>
        <FieldLabel>Purchase & expiry <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span></FieldLabel>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
        <div><FieldLabel>Purchased</FieldLabel>
          <input type="date" value={form.purchased_at || ''} onChange={e => set('purchased_at', e.target.value)} style={inputStyle} /></div>
        <div><FieldLabel>Opened</FieldLabel>
          <input type="date" value={form.opened_at || ''} onChange={e => set('opened_at', e.target.value)} style={inputStyle} /></div>
        <div><FieldLabel>Expires</FieldLabel>
          <input type="date" value={form.expires_at || ''} onChange={e => set('expires_at', e.target.value)} style={inputStyle} /></div>
        <div>
          <FieldLabel><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><PaoIcon months={form.pao_months} size={14} /> PAO <InfoTooltip text="Period After Opening" /></span></FieldLabel>
          <select value={form.pao_months || ''} onChange={e => set('pao_months', e.target.value ? Number(e.target.value) : null)} style={selectStyle}>
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
      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginBottom: 8 }}>
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
          { key: 'is_discontinued',   label: '⛔ Discontinued'   },
        ].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => set(key, !form[key])} style={{
            padding: '4px 10px', borderRadius: 0, fontSize: 11, cursor: 'pointer',
            border: `1px solid ${form[key] ? T.text : T.border}`,
            background: form[key] ? T.text : 'transparent',
            color: form[key] ? '#fff' : T.textMuted, fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* Rating */}
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>My rating</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <StarRating value={form.effectiveness} onChange={v => set('effectiveness', v)} size={18} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>Buy again?</span>
            {[['Yes', true], ['No', false], ['—', null]].map(([label, val]) => (
              <button key={label} type="button" onClick={() => set('buyAgain', form.buyAgain === val ? null : val)}
                style={{ padding: '3px 9px', borderRadius: 0, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${form.buyAgain === val ? T.text : T.border}`, background: form.buyAgain === val ? T.text : 'transparent', color: form.buyAgain === val ? '#fff' : T.textMuted }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Tags</FieldLabel>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
          {(form.tags || []).map(t => (
            <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 0, background: T.creamDark, color: T.text, border: `0.5px solid ${T.border}`, cursor: 'pointer' }} onClick={() => removeTag(t)}>{t} ×</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} placeholder="e.g. fragrance free" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={addTag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 0, border: '1px solid ' + T.border, background: 'transparent', color: T.text, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Add</button>
        </div>
      </div>

      {/* Ingredient category */}
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Ingredient category <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span></FieldLabel>
        <select value={form.ingredient_category || ''} onChange={e => set('ingredient_category', e.target.value)} style={{ ...selectStyle, marginBottom: 8 }}>
          <option value="">— Select category —</option>
          {Object.entries(PRODUCT_INGREDIENT_CATEGORIES).map(([key, cat]) => (
            <option key={key} value={key}>{cat.label}</option>
          ))}
        </select>
        {form.ingredient_category && PRODUCT_INGREDIENT_CATEGORIES[form.ingredient_category]?.forms?.length > 0 && (<>
          <FieldLabel>Ingredient form <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span></FieldLabel>
          <select value={form.ingredient_form || ''} onChange={e => set('ingredient_form', e.target.value)} style={{ ...selectStyle, marginBottom: 8 }}>
            <option value="">— Select form —</option>
            {PRODUCT_INGREDIENT_CATEGORIES[form.ingredient_category].forms.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </>)}
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Notes</FieldLabel>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." rows={3}
          style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '6px 2px', border: 'none', borderBottom: '1px solid #000000', borderRadius: 0, background: 'transparent', color: T.text, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, borderTop: `0.5px solid ${T.border}`, paddingTop: 10 }}>
        <button type="button" onClick={() => form.name && onSave({ ...form, id: form.id || uid() })} disabled={!form.name}
          style={{ flex: 1, padding: '9px', borderRadius: 0, border: 'none', background: form.name ? T.text : T.border, color: '#fff', cursor: form.name ? 'pointer' : 'default', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
          {initial?.id ? 'Save changes' : 'Save product'}
        </button>
        <button type="button" onClick={onCancel}
          style={{ padding: '9px 16px', borderRadius: 0, border: '1px solid ' + T.border, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
          Cancel
        </button>
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
// ─── PERSONAL DATA FORM ────────────────────────────────────────────────────
function PersonalDataForm({ productId, isCatalog, upd, product, onSaveUpd, onClose }) {
  const [notes, setNotes]           = useState(upd?.notes || product?.notes || '')
  const [effectiveness, setEff]     = useState(upd?.effectiveness || 0)
  const [buyAgain, setBuyAgain]     = useState(upd?.buy_again ?? null)
  const [purchasedAt, setPurchased] = useState(upd?.purchased_at || '')
  const [openedAt, setOpened]       = useState(upd?.opened_at || '')
  const [expiresAt, setExpires]     = useState(upd?.expires_at || '')
  const [paoMonths, setPao]         = useState(upd?.pao_months || '')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSaveUpd(productId, {
      notes:         notes || null,
      effectiveness: effectiveness || null,
      buy_again:     buyAgain,
      purchased_at:  purchasedAt || null,
      opened_at:     openedAt || null,
      expires_at:    expiresAt || null,
      pao_months:    paoMonths ? parseInt(paoMonths) : null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '6px 2px',
    borderRadius: 0, border: 'none',
    borderBottom: '1px solid #000000',
    background: 'transparent', color: T.text, fontSize: 12,
    fontFamily: 'inherit', outline: 'none', resize: 'vertical',
  }
  const labelStyle = {
    fontSize: 10, fontWeight: 600, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 4,
  }

  return (
    <div style={{ marginTop: 20, borderTop: `0.5px solid ${T.border}`, paddingTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>My notes</div>

      {/* Notes */}
      <div style={{ marginBottom: 12 }}>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How does this work for you? Any tips..."
          rows={3}
          style={inputStyle}
        />
      </div>

      {/* Effectiveness + Buy again */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>My rating</label>
          <div style={{ paddingTop: 4 }}>
            <StarRating value={effectiveness} onChange={v => setEff(effectiveness === v ? 0 : v)} size={20} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Buy again?</label>
          <div style={{ display: 'flex', gap: 6, paddingTop: 2 }}>
            {[['Yes', true], ['No', false], ['—', null]].map(([label, val]) => (
              <button key={label} onClick={() => setBuyAgain(buyAgain === val ? null : val)}
                style={{
                  padding: '4px 10px', borderRadius: 0, fontSize: 11,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: `0.5px solid ${T.border}`,
                  background: buyAgain === val ? T.pinkDeep : T.cream,
                  color: buyAgain === val ? '#fff' : T.textMuted,
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dates row — stacked on mobile, 3-col on wider screens */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(100px, 1fr))', gap: 8, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Purchased</label>
          <input type="date" value={purchasedAt} onChange={e => setPurchased(e.target.value)} style={{ ...inputStyle, resize: 'none', fontSize: 11, minWidth: 0, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={labelStyle}>Opened</label>
          <input type="date" value={openedAt} onChange={e => setOpened(e.target.value)} style={{ ...inputStyle, resize: 'none', fontSize: 11, minWidth: 0, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={labelStyle}>Expires</label>
          <input type="date" value={expiresAt} onChange={e => setExpires(e.target.value)} style={{ ...inputStyle, resize: 'none', fontSize: 11, minWidth: 0, width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>
      {/* PAO separate row */}
      <div style={{ marginBottom: 12, maxWidth: 160 }}>
        <label style={labelStyle}>PAO (months)</label>
        <select value={paoMonths} onChange={e => setPao(e.target.value)}
          style={{ width: '100%', fontSize: 12, padding: '6px 2px', border: 'none', borderBottom: '1px solid #000000', borderRadius: 0, background: 'transparent', color: paoMonths ? T.text : T.textMuted, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
          <option value="">— Select PAO —</option>
          {PAO_OPTIONS.map(m => <option key={m} value={m}>{m} months</option>)}
        </select>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        style={{
          width: '100%', padding: '10px', borderRadius: 0, border: 'none',
          background: saved ? '#4caf50' : T.pinkDeep,
          color: '#fff', cursor: saving ? 'default' : 'pointer',
          fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
          transition: 'background 0.2s',
          marginTop: 20,
        }}>
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save my notes'}
      </button>
    </div>
  )
}

function IngredientsAccordion({ ingredients }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 12, marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #000000', padding: '6px 0', cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ingredients</span>
        <span style={{ fontSize: 12, color: T.textMuted }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8, padding: '10px 0 4px' }}>{ingredients}</div>
      )}
    </div>
  )
}

// ─── PRODUCT DETAIL MODAL ────────────────────────────────────
// Brand color palette — harmonious Glow Up pinks, blushes, peaches, and warm oranges
const BRAND_COLORS = [
  '#FFD6EC', // bubblegum pink
  '#FFE4F0', // soft blush
  '#FFC8E0', // deeper pink
  '#FFBBD4', // rose
  '#FFD0C8', // blush peach
  '#FFE0D0', // soft peach
  '#FFCAB8', // warm peach
  '#FFB8A4', // coral peach
  '#FFD8C0', // apricot
  '#FFC4A8', // warm apricot
  '#FFE8D8', // palest peach
  '#FFD4BC', // honey peach
  '#FFC8D8', // dusty rose
  '#FFE0E8', // palest pink
  '#FFCCD8', // muted rose
]
function getBrandColor(brand, id) {
  // Use product ID hash for random-but-stable color per product (not per brand)
  const str = id || brand || 'unknown'
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return BRAND_COLORS[hash % BRAND_COLORS.length]
}

function ProductModal({ product: p, onClose, onEdit, onDelete, catalogProducts, isWhatWeUsing, userRoutineNames, upd, onAddToLibrary, onRemoveFromLibrary, onSaveUserProductData }) {
  if (!p) return null
  const isCatalog = p._isCatalog && !p._isLinked
  const cat = p.catalog_product_id ? (catalogProducts || {})[p.catalog_product_id] : null
  const purchaseUrl = p.purchaseUrl || cat?.purchaseUrl
  const storeName = p.store_name || cat?.store_name
  const directUrl = p.direct_url || cat?.direct_url
  const directStoreName = p.direct_store_name || cat?.direct_store_name
  const img = p.imageUrl || p.image_url
  const wwu = isWhatWeUsing && isWhatWeUsing(p)
  const userUsing = (userRoutineNames || new Set()).has(((p.name||'')+'|'+(p.brand||'')).toLowerCase())

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.white, borderRadius: 0, width: '100%', maxWidth: 760,
        height: 'min(85vh, 680px)',
        display: 'flex', overflow: 'hidden', position: 'relative',
      }}>

        {/* ── Left: portrait image ─────────────────────────── */}
        {img && (
          <div style={{ width: '40%', flexShrink: 0, overflow: 'hidden', background: getBrandColor(p.brand, p.id), borderRadius: 0 }}>
            <img src={img} alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.currentTarget.parentElement.style.display = 'none' }} />
          </div>
        )}

        {/* ── Right: scrollable content — overflow hidden at flex level so accordion never resizes modal */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', padding: '20px 16px 28px', position: 'relative' }}>

          {/* × — top right */}
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 28, height: 28, borderRadius: 0, border: 'none', background: T.creamDark, color: T.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>

          {/* Name + brand */}
          <div style={{ paddingRight: 38, marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{p.name}</div>
            {p.brand && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{p.brand}</div>}
          </div>

          {/* Routine badges */}
          {(isCatalog || p._isLinked) && wwu && (
            <div style={{ display: 'inline-block', fontSize: 11, background: T.pink, color: T.pinkDeep, borderRadius: 0, padding: '3px 10px', fontWeight: 600, marginBottom: 8, marginRight: 6 }}>What we're using!</div>
          )}
          {userUsing && (
            <div style={{ display: 'inline-block', fontSize: 11, background: T.creamDark, color: T.textMuted, borderRadius: 0, padding: '3px 10px', fontWeight: 600, marginBottom: 8, border: `0.5px solid ${T.border}` }}>In my routine</div>
          )}

          {/* Category — most specific only */}
          {(p.ingredient_form || p.ingredient_category || p.category) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 11, background: T.creamDark, color: T.textMuted, borderRadius: 0, padding: '3px 10px' }}>
                {(p.ingredient_form || p.ingredient_category?.replace(/_/g, ' ') || p.category)?.charAt(0).toUpperCase() + (p.ingredient_form || p.ingredient_category?.replace(/_/g, ' ') || p.category)?.slice(1)}
              </span>
            </div>
          )}

          {/* Effectiveness */}
          {p.effectiveness > 0 && <div style={{ marginBottom: 10 }}><StarRating value={p.effectiveness} size={13} /></div>}

          {/* Flags */}
          <ProductFlagBadges product={p} />

          {/* Buy from pills — directly under badges */}
          {(purchaseUrl || directUrl) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
              {purchaseUrl && (
                <a href={purchaseUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: 0, background: T.white, color: T.text, textDecoration: 'none', border: `1px solid ${T.text}`, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                  Buy from {storeName || getStoreName(purchaseUrl) || 'affiliate'} ↗
                </a>
              )}
              {directUrl && (
                <a href={directUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: 0, background: T.white, color: T.text, textDecoration: 'none', border: `1px solid ${T.text}`, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                  Buy from {directStoreName || getStoreName(directUrl) || 'brand site'} ↗
                </a>
              )}
            </div>
          )}

          {/* Our note — curator note, hidden if empty */}
          {p.notes && (
            <div style={{ margin: '10px 0 12px', padding: '10px 12px', background: T.pink, borderRadius: 0, borderLeft: `3px solid ${T.pinkDeep}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.pinkDeep, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Our note</div>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{p.notes}</div>
            </div>
          )}

          {/* Description */}
          {p.description && <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7, marginTop: 12, marginBottom: 12 }}>{p.description}</div>}

          {/* Ingredients — collapsible accordion */}
          {p.ingredients && <IngredientsAccordion ingredients={p.ingredients} />}

          {/* PAO + dates */}
          {(p.pao_months || p.opened_at || p.expires_at || p.purchased_at) && (() => {
            const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            const computedExpiry = (!p.expires_at && p.opened_at && p.pao_months)
              ? (() => { const d = new Date(p.opened_at + 'T00:00:00'); d.setMonth(d.getMonth() + Number(p.pao_months)); return d })()
              : p.expires_at ? new Date(p.expires_at + 'T00:00:00') : null
            const today = new Date(); today.setHours(0,0,0,0)
            const daysLeft = computedExpiry ? Math.round((computedExpiry - today) / 86400000) : null
            const isExpired = daysLeft !== null && daysLeft < 0
            const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30

            return (
              <div style={{ marginBottom: 12 }}>
                {/* PAO / expiry line */}
                {(p.opened_at || p.expires_at) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', marginBottom: 6, borderRadius: 0,
                    background: isExpired ? '#FEF2F2' : expiringSoon ? '#FFFBEB' : T.creamDark,
                    border: `0.5px solid ${isExpired ? '#FCA5A5' : expiringSoon ? '#FCD34D' : T.border}`,
                  }}>
                    <span style={{ fontSize: 14 }}>{isExpired ? '⚠️' : expiringSoon ? '⏳' : '🗓'}</span>
                    <div>
                      {p.opened_at && (
                        <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>
                          Opened {fmt(p.opened_at)}
                          {p.pao_months && <span style={{ color: T.textMuted, fontWeight: 400 }}> · {p.pao_months}mo PAO</span>}
                        </div>
                      )}
                      {computedExpiry && (
                        <div style={{ fontSize: 11, color: isExpired ? '#DC2626' : expiringSoon ? '#92400E' : T.textMuted }}>
                          {isExpired
                            ? `Expired ${fmt(computedExpiry.toISOString().split('T')[0])} (${Math.abs(daysLeft)}d ago)`
                            : daysLeft === 0
                            ? 'Expires today'
                            : `Expires ${fmt(computedExpiry.toISOString().split('T')[0])} (${daysLeft}d left)`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Purchased */}
                {p.purchased_at && (
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    Purchased {fmt(p.purchased_at)}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Personal data form */}
          {(isCatalog ? upd?.in_library : true) && (
            <PersonalDataForm productId={p.id} isCatalog={isCatalog} upd={upd} product={p}
              onSaveUpd={onSaveUserProductData} onEdit={onEdit} onDelete={onDelete} onClose={onClose} />
          )}

          {/* Community rating */}
          {p.effectivenessAvg > 0 && (
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Community rating:</span><StarRating value={Math.round(p.effectivenessAvg)} size={11} />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {isCatalog ? (
              upd?.in_library
                ? <button onClick={() => { onRemoveFromLibrary(p.id); onClose() }}
                    style={{ flex: 1, padding: '9px', borderRadius: 0, border: '0.5px solid ' + T.border, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                    Remove from my products
                  </button>
                : <button onClick={() => { onAddToLibrary(p); onClose() }}
                    style={{ flex: 1, padding: '9px', borderRadius: 0, border: 'none', background: T.pinkDeep, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
                    + Add to my products
                  </button>
            ) : (
              <>
                <button onClick={() => { onClose(); onEdit(p) }}
                  style={{ flex: 1, padding: '9px', borderRadius: 0, border: '0.5px solid ' + T.border, background: T.creamDark, color: T.text, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
                  Edit
                </button>
                <button onClick={() => { if (window.confirm('Delete ' + p.name + '?')) { onDelete(p); onClose() } }}
                  style={{ padding: '9px 14px', borderRadius: 0, border: '0.5px solid ' + T.border, background: 'transparent', color: T.textLight, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}


// ─── PRODUCT LIBRARY ─────────────────────────────────────────
function ProductLibrary({ products, catalogProducts, userProductData, activeRoutineNames, userRoutineNames, onEdit, onAdd, onDelete, onAddToLibrary, onRemoveFromLibrary, onSaveUserProductData }) {
  const [libTab,        setLibTab]        = useState('all')
  const [filterCats,    setFilterCats]    = useState([])
  const [filterFlags,   setFilterFlags]   = useState([])
  const [filterBrands,  setFilterBrands]  = useState([])
  const [filterUsing,   setFilterUsing]   = useState(false)
  const [filterBuyAgain,setFilterBuyAgain]= useState(false)
  const [search,        setSearch]        = useState('')
  const [sortBy,        setSortBy]        = useState('routine')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  // Stable random order — generated once per session, routine products always float first
  const shuffleKeys = useRef(new Map())
  function getShuffleKey(id) {
    if (!shuffleKeys.current.has(id)) shuffleKeys.current.set(id, Math.random())
    return shuffleKeys.current.get(id)
  }

  function toggleCat(cat)   { setFilterCats(prev   => prev.includes(cat)   ? prev.filter(c => c !== cat)   : [...prev, cat]) }
  function toggleFlag(key)  { setFilterFlags(prev  => prev.includes(key)   ? prev.filter(k => k !== key)   : [...prev, key]) }
  function toggleBrand(b)   { setFilterBrands(prev => prev.includes(b)     ? prev.filter(x => x !== b)     : [...prev, b])   }
  function clearAll()       { setFilterCats([]); setFilterFlags([]); setFilterBrands([]); setFilterUsing(false); setFilterBuyAgain(false) }
  const hasFilters = filterCats.length > 0 || filterFlags.length > 0 || filterBrands.length > 0 || filterUsing || filterBuyAgain

  function isWhatWeUsing(p) {
    const key = ((p.name||'')+'|'+(p.brand||'')).toLowerCase()
    return (activeRoutineNames || new Set()).has(key)
  }

  function getMergedProducts() {
    const userArr = Object.values(products)
    const catalogArr = Object.values(catalogProducts || {})
    const linkedCatalogIds = new Set(userArr.map(p => p.catalog_product_id).filter(Boolean))
    const unlinkedCatalog = catalogArr.filter(p => !linkedCatalogIds.has(p.id))
    const userWithCatalogData = userArr.map(p => {
      if (p.catalog_product_id) {
        const cat = (catalogProducts || {})[p.catalog_product_id]
        if (cat) return { ...cat, ...p, _isLinked: true, purchaseUrl: p.purchaseUrl || cat.purchaseUrl, store_name: p.store_name || cat.store_name, direct_url: p.direct_url || cat.direct_url }
      }
      return p
    })
    return [...userWithCatalogData, ...unlinkedCatalog]
  }

  const userProductIds = new Set(Object.keys(products))

  const pool = libTab === 'all' ? getMergedProducts()
    : libTab === 'mine' ? getMergedProducts().filter(p =>
        userProductIds.has(p.id) ||                            // user-owned product
        (userProductData||{})[p.id]?.in_library ||             // catalog product added to library
        isWhatWeUsing(p) ||                                    // what we're using (catalog routine)
        (userRoutineNames||new Set()).has(((p.name||'')+'|'+(p.brand||'')).toLowerCase()) // current routine
      )
    : Object.values(catalogProducts || {})

  const list = pool
    .filter(p => {
      const matchCat    = filterCats.length === 0    || filterCats.includes(p.category)
      const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand||'').toLowerCase().includes(search.toLowerCase())
      const matchFlags  = filterFlags.length === 0   || filterFlags.every(f => p[f])
      const matchBrand  = filterBrands.length === 0  || filterBrands.includes(p.brand || '')
      const matchUsing  = !filterUsing    || isWhatWeUsing(p) || (userRoutineNames||new Set()).has(((p.name||'')+'|'+(p.brand||'')).toLowerCase())
      const matchBuyAgain = !filterBuyAgain || (userProductData||{})[p.id]?.buy_again === true
      return matchCat && matchSearch && matchFlags && matchBrand && matchUsing && matchBuyAgain
    })
    .sort((a, b) => {
      if (sortBy === 'routine') {
        const aW = isWhatWeUsing(a), bW = isWhatWeUsing(b)
        if (aW && !bW) return -1; if (!aW && bW) return 1
        const aU = (userRoutineNames||new Set()).has(((a.name||'')+'|'+(a.brand||'')).toLowerCase())
        const bU = (userRoutineNames||new Set()).has(((b.name||'')+'|'+(b.brand||'')).toLowerCase())
        if (aU && !bU) return -1; if (!aU && bU) return 1
        // Non-routine products: stable random order (generated once per session)
        return getShuffleKey(a.id) - getShuffleKey(b.id)
      }
      if (sortBy === 'brand') return (a.brand||'').localeCompare(b.brand||'')
      return (a.name||'').localeCompare(b.name||'')
    })

  const isCatalogCard = p => !!(p._isCatalog || p.is_catalog) && !(userProductData||{})[p.id]?.in_library

  function FilterSection({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
      <div style={{ borderBottom: '0.5px solid ' + T.border, paddingBottom: 12, marginBottom: 12 }}>
        <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: open ? 8 : 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
          <span style={{ fontSize: 12, color: T.textLight }}>{open ? '−' : '+'}</span>
        </button>
        {open && children}
      </div>
    )
  }

  function CheckItem({ label, checked, onChange }) {
    return (
      <label onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text, cursor: 'pointer', padding: '3px 0', userSelect: 'none' }}>
        <div style={{ width: 18, height: 18, borderRadius: 0, border: '1.5px solid ' + (checked ? T.text : T.border), background: checked ? T.text : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {checked && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        {label}
      </label>
    )
  }

  // Inject slideUp animation once
  useEffect(() => {
    if (document.getElementById('glowup-sheet-style')) return
    const s = document.createElement('style')
    s.id = 'glowup-sheet-style'
    s.textContent = '@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }'
    document.head.appendChild(s)
  }, [])

  // Faceted filtering — each section's options narrow based on other active filters
  function filterExcluding(excludeKey) {
    return getMergedProducts().filter(p => {
      const q = search.trim().toLowerCase()
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)
      const matchCat    = excludeKey === 'cat'    || filterCats.length === 0   || filterCats.includes(p.category)
      const matchBrand  = excludeKey === 'brand'  || filterBrands.length === 0 || filterBrands.includes(p.brand || '')
      const matchFlags  = excludeKey === 'flags'  || filterFlags.length === 0  || filterFlags.every(f => p[f])
      const matchStatus = excludeKey === 'status' || (
        (!filterUsing    || isWhatWeUsing(p) || (userRoutineNames||new Set()).has(((p.name||'')+'|'+(p.brand||'')).toLowerCase())) &&
        (!filterBuyAgain || (userProductData||{})[p.id]?.buy_again === true)
      )
      return matchSearch && matchCat && matchBrand && matchFlags && matchStatus
    })
  }
  const availableBrands = [...new Set(filterExcluding('brand').map(p => p.brand||'').filter(Boolean))].sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  const availableCats   = PRODUCT_CATEGORIES.filter(cat => filterExcluding('cat').some(p => p.category === cat))
  const availableFlags  = ETHICS_FILTERS.filter(({key}) => filterExcluding('flags').some(p => p[key]))

  function FilterContent() {
    return (
      <>
        <FilterSection title="Product type">
          {availableCats.map(cat => (
            <CheckItem key={cat} label={formatCatLabel(cat)} checked={filterCats.includes(cat)} onChange={() => toggleCat(cat)} />
          ))}
        </FilterSection>
        <FilterSection title="Brand">
          {availableBrands.map(brand => (
            <CheckItem key={brand} label={brand} checked={filterBrands.includes(brand)} onChange={() => toggleBrand(brand)} />
          ))}
        </FilterSection>
        <FilterSection title="Ethics & values">
          {availableFlags.map(({ key, label }) => (
            <CheckItem key={key} label={label} checked={filterFlags.includes(key)} onChange={() => toggleFlag(key)} />
          ))}
        </FilterSection>
        <FilterSection title="Status">
          <CheckItem label="Currently using" checked={filterUsing} onChange={() => setFilterUsing(s => !s)} />
          <CheckItem label="Would buy again" checked={filterBuyAgain} onChange={() => setFilterBuyAgain(s => !s)} />
        </FilterSection>
        {hasFilters && (
          <button onClick={clearAll} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 0, border: 'none', background: '#000000', color: '#ffffff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
            Clear filters
          </button>
        )}
      </>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 120px)', overflow: 'hidden', position: 'relative' }}>

      {/* ── Mobile bottom sheet overlay ─────────────────────── */}
      {isMobile && filterSheetOpen && (
        <>
          <div onClick={() => setFilterSheetOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101, background: T.white, borderRadius: '16px 16px 0 0', padding: '0 20px 32px', maxHeight: '75vh', overflowY: 'auto', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', animation: 'slideUp 0.22s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 16px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Filters</div>
              <button onClick={() => setFilterSheetOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: 20, color: T.textMuted, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
            </div>
            <FilterContent />
          </div>
        </>
      )}

      {/* ── Mobile filter pill button ────────────────────────── */}
      {isMobile && (
        <button onClick={() => setFilterSheetOpen(true)} style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 99, padding: '10px 20px', borderRadius: 24, background: hasFilters ? T.pinkDeep : T.text, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚙︎ Filters</span>
          {hasFilters && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{filterBrands.length + filterCats.length + filterFlags.length + (filterUsing ? 1 : 0) + (filterBuyAgain ? 1 : 0)}</span>}
        </button>
      )}

      {/* ── Left Sidebar — desktop only ──────────────────────── */}
      {!isMobile && <div style={{ width: 200, flexShrink: 0, borderRight: '0.5px solid ' + T.border, padding: '16px 16px 16px 20px', overflowY: 'auto', position: 'sticky', top: 0, height: '100%' }}>
        <FilterContent />
      </div>}

      {/* ── Main Content ──────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '16px 20px', minWidth: 0, overflowY: 'auto', height: '100%' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[
            { key: 'all',         label: 'All products',  count: getMergedProducts().length },
            { key: 'mine',        label: 'My products',   count: Object.keys(products).length + Object.values(catalogProducts || {}).filter(p => (userProductData || {})[p.id]?.in_library).length },
            { key: 'recommended', label: 'Recommended',   count: Object.keys(catalogProducts || {}).length },
          ].map(t => (
            <button key={t.key} onClick={() => setLibTab(t.key)} style={{ padding: '5px 12px', borderRadius: 0, fontSize: 12, cursor: 'pointer', border: '0.5px solid ' + (libTab === t.key ? T.pinkDeep : T.border), background: libTab === t.key ? T.pink : 'transparent', color: T.text, fontFamily: 'inherit' }}>
              {t.label} <span style={{ fontSize: 10, color: T.textMuted }}>({t.count})</span>
            </button>
          ))}
        </div>

        {/* Sort + Search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'baseline' }}>
          <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>Sort</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '7px 2px', borderRadius: 0, border: 'none', borderBottom: '1px solid #000000', background: 'transparent', color: T.text, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, outline: 'none' }}>
            <option value="routine">My routine first</option>
            <option value="name">A–Z Product name</option>
            <option value="brand">A–Z Brand name</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ flex: 1, fontSize: 12, padding: '7px 2px', border: 'none', borderBottom: '1px solid #000000', borderRadius: 0, background: 'transparent', color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Empty state */}
        {list.length === 0 && (
          <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
            {pool.length === 0 ? 'No products yet.' : 'No products match your filters.'}
          </div>
        )}

        {/* Grid — 2 col mobile, 5 col desktop, portrait images */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 2, paddingBottom: isMobile ? 80 : 24 }}>
          {list.map(p => {
            const wwu = isWhatWeUsing(p)
            const userUsing = !wwu && (userRoutineNames||new Set()).has(((p.name||'')+'|'+(p.brand||'')).toLowerCase())
            const img = p.imageUrl || p.image_url
            return (
              <div key={p.id} onClick={() => setSelectedProduct(p)}
                style={{ cursor: 'pointer', position: 'relative', background: T.white, display: 'flex', flexDirection: 'column' }}>
                {/* Portrait image — paddingBottom keeps 3:4 ratio consistent across all cards */}
                <div style={{ position: 'relative', paddingBottom: '133.33%', overflow: 'hidden', background: getBrandColor(p.brand, p.id), flexShrink: 0 }}>
                  {img && (
                    <img src={img} alt={p.name}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.currentTarget.style.display = 'none' }} />
                  )}
                  {/* Routine badges — top right */}
                  {(wwu || userUsing) && (
                    <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {wwu && <span style={{ fontSize: 8, background: T.pinkDeep, color: '#fff', borderRadius: 0, padding: '2px 6px', fontWeight: 700, whiteSpace: 'nowrap' }}>What we're using!</span>}
                      {userUsing && <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.93)', color: T.text, borderRadius: 0, padding: '2px 6px', fontWeight: 600, whiteSpace: 'nowrap', border: '0.5px solid ' + T.border }}>In my routine</span>}
                    </div>
                  )}
                </div>
                {/* Text — flex column so pills pin to bottom regardless of count */}
                <div style={{ padding: '7px 8px 10px', background: T.white, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: T.text, lineHeight: 1.4, marginBottom: 1 }}>{p.name}</div>
                    {p.brand && <div style={{ fontSize: 10, color: T.textMuted }}>{p.brand}</div>}
                  </div>
                  {/* URL pills — always at bottom, stacked full width */}
                  {(p.purchaseUrl || p.direct_url) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      {p.purchaseUrl && (
                        <a href={p.purchaseUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', fontSize: 9, padding: '4px 8px', borderRadius: 0, background: 'transparent', color: T.text, textDecoration: 'none', border: '0.5px solid ' + T.textMuted, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                          Buy from {p.store_name || 'affiliate'} ↗
                        </a>
                      )}
                      {p.direct_url && (
                        <a href={p.direct_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', fontSize: 9, padding: '4px 8px', borderRadius: 0, background: 'transparent', color: T.text, textDecoration: 'none', border: '0.5px solid ' + T.textMuted, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                          Buy from {p.direct_store_name || 'brand site'} ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={p => { setSelectedProduct(null); onEdit(p) }}
          onDelete={onDelete}
          catalogProducts={catalogProducts}
          isWhatWeUsing={isWhatWeUsing}
          userRoutineNames={userRoutineNames}
          upd={(userProductData || {})[selectedProduct?.id]}
          onAddToLibrary={onAddToLibrary}
          onRemoveFromLibrary={onRemoveFromLibrary}
          onSaveUserProductData={onSaveUserProductData}
        />
      )}
    </div>
  )
}

// ─── PRODUCTS PAGE ────────────────────────────────────────────
export default function ProductsPage({ session }) {
  const [products, setProducts] = useState({})
  const [catalogProducts, setCatalogProducts] = useState({})
  const [userProductData, setUserProductData] = useState({}) // keyed by product_id
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeRoutineNames, setActiveRoutineNames] = useState(new Set())  // curator's, BDS-gated — drives badge
  const [userRoutineNames, setUserRoutineNames] = useState(new Set())        // current user's — drives filter
  const userId = session?.user?.id
  const CURATOR_ID = '27fbf9cd-5cfe-4032-9594-398e96fd0ccf'

  useEffect(() => {
    if (!userId) return
    async function load() {
      // Single unified query — catalog (is_catalog=true) + user products
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`is_catalog.eq.true,user_id.eq.${userId}`)

      // Load user_product_data overlay
      const { data: upd } = await supabase
        .from('user_product_data')
        .select('*')
        .eq('user_id', userId)
      const updMap = {}
      ;(upd || []).forEach(row => { updMap[row.product_id] = row })
      setUserProductData(updMap)

      if (data) {
        const catMap = {}
        const userMap = {}
        data.forEach(p => {
          const mapped = {
            id: p.id, name: p.name, brand: p.brand, category: p.category,
            imageUrl: p.image_url, purchaseUrl: p.purchase_url,
            bdsCompliant: p.bds_compliant, currentlyUsing: p.currently_using,
            applicationArea: p.application_area || {},
            effectivenessAvg: p.effectiveness_avg || 0,
            tags: (p.tags || []).map(t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t),
            notes: p.notes,
            ingredient_category: p.ingredient_category || '',
            ingredient_form: p.ingredient_form || '',
            _isCatalog: p.is_catalog || false,
            store_name: p.store_name || '',
            direct_url: p.direct_url || '',
            direct_store_name: p.direct_store_name || '',
            description: p.description || '',
            ingredients: p.ingredients || '',
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
            is_discontinued: p.is_discontinued || false,
            purchased_at: p.purchased_at || '',
            opened_at: p.opened_at || '',
            expires_at: p.expires_at || '',
            pao_months: p.pao_months || null,
          }
          if (p.is_catalog) catMap[p.id] = mapped
          else if (p.user_id === userId) userMap[p.id] = mapped
        })
        setCatalogProducts(catMap)
        setProducts(userMap)
      }

      // Fetch curator's active routine for badge
      const CURATOR_ID = '27fbf9cd-5cfe-4032-9594-398e96fd0ccf'
      const { data: routinePeriods } = await supabase
        .from('routine_periods')
        .select('products')
        .eq('user_id', CURATOR_ID)
        .order('start_date', { ascending: false })
        .limit(1)

      if (routinePeriods?.[0]) {
        const productIds = [...new Set(
          Object.values(routinePeriods[0].products || {})
            .filter(id => id && !String(id).startsWith('seed-'))
        )]
        if (productIds.length > 0) {
          const { data: routineProds } = await supabase
            .from('products')
            .select('id, name, brand, bds_compliant')
            .in('id', productIds)
            .eq('is_catalog', true)
          const nameSet = new Set()
          ;(routineProds || []).forEach(p => {
            if (p.bds_compliant !== false)
              nameSet.add((p.name + '|' + (p.brand || '')).toLowerCase())
          })
          setActiveRoutineNames(nameSet)

          // Also build the current USER's routine name set (no BDS gate) for the filter
          if (userId !== CURATOR_ID) {
            const { data: userPeriods } = await supabase
              .from('routine_periods')
              .select('products')
              .eq('user_id', userId)
              .order('start_date', { ascending: false })
              .limit(1)
            if (userPeriods?.[0]) {
              const userIds = [...new Set(
                Object.values(userPeriods[0].products || {})
                  .filter(id => id && !String(id).startsWith('seed-'))
              )]
              if (userIds.length > 0) {
                const { data: userProds } = await supabase
                  .from('products')
                  .select('name, brand')
                  .in('id', userIds)   // no is_catalog filter — includes personal non-BDS products
                setUserRoutineNames(new Set(
                  (userProds || []).map(p => (p.name + '|' + (p.brand || '')).toLowerCase())
                ))
              }
            }
          } else {
            // User IS the curator — fetch ALL products in their routine (including non-BDS personal ones)
            const allRouteIds = [...new Set(
              Object.values(routinePeriods[0].products || {})
                .filter(id => id && !String(id).startsWith('seed-'))
            )]
            if (allRouteIds.length > 0) {
              const { data: allRoutineProds } = await supabase
                .from('products')
                .select('name, brand')
                .in('id', allRouteIds)  // no is_catalog filter — gets everything
              setUserRoutineNames(new Set(
                (allRoutineProds || []).map(p => (p.name + '|' + (p.brand || '')).toLowerCase())
              ))
            }
          }

          // Auto-add routine products to user's library (in_library=true) if not already tracked
          const autoRows = (routineProds || []).map(p => ({
            user_id: userId,
            product_id: p.id,
            in_library: true,
          }))
          if (autoRows.length > 0) {
            const { data: newUpd } = await supabase
              .from('user_product_data')
              .upsert(autoRows, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
              .select()
            // Merge any newly created rows into updMap
            ;(newUpd || []).forEach(row => { updMap[row.product_id] = row })
            setUserProductData({ ...updMap })
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [userId])

  async function addToLibrary(product) {
    const { data } = await supabase.from('user_product_data')
      .upsert({ user_id: userId, product_id: product.id, in_library: true }, { onConflict: 'user_id,product_id' })
      .select().single()
    if (data) setUserProductData(prev => ({ ...prev, [product.id]: data }))
  }

  async function removeFromLibrary(productId) {
    await supabase.from('user_product_data')
      .update({ in_library: false })
      .eq('user_id', userId).eq('product_id', productId)
    setUserProductData(prev => ({ ...prev, [productId]: { ...prev[productId], in_library: false } }))
  }

  async function saveUserProductData(productId, updates) {
    const existing = userProductData[productId]
    const { data } = await supabase.from('user_product_data')
      .upsert({ user_id: userId, product_id: productId, in_library: true, ...existing, ...updates }, { onConflict: 'user_id,product_id' })
      .select().single()
    if (data) setUserProductData(prev => ({ ...prev, [productId]: data }))
  }

  async function saveProduct(product) {
    if (product._isCatalog) {
      // For catalog products, save personal data to user_product_data instead
      await saveUserProductData(product.id, {
        notes: product.notes,
        effectiveness: product.effectiveness,
        purchased_at: product.purchased_at || null,
        opened_at: product.opened_at || null,
        expires_at: product.expires_at || null,
        pao_months: product.pao_months || null,
        in_library: true,
      })
      setEditingProduct(null)
      return
    }
    const row = {
      id: product.id || undefined,
      user_id: userId,
      is_catalog: false,
      name: product.name,
      brand: product.brand || '',
      category: product.category,
      image_url: product.imageUrl,
      purchase_url: product.purchaseUrl,
      bds_compliant: product.bdsCompliant,
      tags: (product.tags || []),
      notes: product.notes || '',
      ingredient_category: product.ingredient_category || null,
      ingredient_form: product.ingredient_form || null,
      store_name: product.store_name || null,
      direct_url: product.direct_url || null,
      direct_store_name: product.direct_store_name || null,
      description: product.description || null,
      ingredients: product.ingredients || null,
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
      is_discontinued: product.is_discontinued || false,
    }
    if (!row.id) {
      // Check for duplicate name+brand in user products
      const existingUser = Object.values(products).find(p => 
        p.name.toLowerCase() === (product.name || '').toLowerCase() && 
        (p.brand || '').toLowerCase() === (product.brand || '').toLowerCase()
      )
      if (existingUser) {
        alert(product.name + ' is already in your products.')
        return
      }
      row.id = crypto.randomUUID()
      product = { ...product, id: row.id }
    }
    const { data: saved, error: saveErr } = row.id && product._existingId
      ? await supabase.from('products').update(row).eq('id', row.id).select().single()
      : await supabase.from('products').insert(row).select().single()
    if (saveErr) { console.error('saveProduct error:', saveErr); return }
    if (saved) {
      setProducts(prev => ({ ...prev, [saved.id]: { ...product, id: saved.id, _isCatalog: false } }))
      // Save personal effectiveness + buy again to user_product_data
      if (product.effectiveness || product.buyAgain !== null) {
        const { data: updRow } = await supabase.from('user_product_data')
          .upsert({
            user_id: userId, product_id: saved.id, in_library: true,
            effectiveness: product.effectiveness || null,
            buy_again: product.buyAgain ?? null,
          }, { onConflict: 'user_id,product_id' })
          .select().single()
        if (updRow) setUserProductData(prev => ({ ...prev, [saved.id]: updRow }))
      }
    }
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
      {/* ── App header ──────────────────────────────────────────── */}
      <div style={{ background: T.white, borderBottom: '0.5px solid ' + T.border }}>
        {/* Logo row — logo links back to calendar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' }}>
          <style>{`.glowup-prodlogo { display: flex } @media (max-width: 639px) { .glowup-prodlogo { display: none } }`}</style>
          <a href="/routine" className="glowup-prodlogo" style={{ alignItems: 'baseline', gap: 6, textDecoration: 'none' }}>
            <GlowUpLogo />
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.pinkDeep, display: 'inline-block', marginBottom: 2 }} />
          </a>
          <div className="glowup-prodlogo" style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setEditingProduct('new')}
              style={{ border: 'none', background: T.pinkDeep, color: '#fff', borderRadius: 0, padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap' }}>
              + Add new product
            </button>
            <NavMenu />
          </div>
        </div>
        {/* Page title row — no back arrow, logo is the nav */}
        <div style={{ padding: '0 20px 12px' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Product library</span>
          <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 6 }}>({Object.keys(products).length + Object.keys(catalogProducts).length})</span>
        </div>
      </div>

      {editingProduct && (
        <div onClick={() => setEditingProduct(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <ProductForm
              initial={editingProduct === 'new' ? undefined : editingProduct}
              onSave={saveProduct}
              onCancel={() => setEditingProduct(null)}
              catalogProducts={catalogProducts}
            />
          </div>
        </div>
      )}

      {loading
        ? <div style={{ padding: '40px 20px', fontSize: 13, color: T.textMuted, textAlign: 'center' }}>Loading your products...</div>
        : <ProductLibrary
              products={products}
              catalogProducts={catalogProducts}
              userProductData={userProductData}
              activeRoutineNames={activeRoutineNames}
              userRoutineNames={userRoutineNames}
              onEdit={p => setEditingProduct(p)}
              onAdd={() => setEditingProduct('new')}
              onDelete={deleteProduct}
              onAddToLibrary={addToLibrary}
              onRemoveFromLibrary={removeFromLibrary}
              onSaveUserProductData={saveUserProductData}
            />
      }
    </div>
  )
}
