// v2-stars-modal-fix
import { useState, useEffect, useRef } from 'react'
import GlowUpLogo from './GlowUpWordmark'
import { supabase } from '../lib/supabase'
import SideMenu from './SideMenu'
import NotificationBell from './shared/NotificationBell'
import T from './theme'
import ProductForm, { PRODUCT_CATEGORIES, formatCatLabel, PAO_OPTIONS } from './shared/ProductForm'
import { useConfirm, useAlert } from './shared/useConfirm'
import Btn from './shared/Btn'
import StarRating from './shared/StarRating'
import FeedbackPanel from './shared/FeedbackPanel'
import GlowUpFooter from './shared/GlowUpFooter'


// A stable "random" brand color per filter label — hashed so the same
// checkbox always lands on the same color instead of reshuffling on render.
const FILTER_BRAND_COLORS = [T.pink, T.blue, T.green, T.yellow, T.orange]
function brandColorForLabel(label) {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0
  return FILTER_BRAND_COLORS[Math.abs(hash) % FILTER_BRAND_COLORS.length]
}
// Assigns each label its hashed color, but nudges forward through the
// palette whenever that would repeat the previous item's color — keeps the
// per-label stability of brandColorForLabel while avoiding same-color
// neighbors in a rendered list.
function assignFilterColors(labels) {
  const colors = []
  labels.forEach((label, i) => {
    let color = brandColorForLabel(label)
    let attempts = 0
    while (i > 0 && color === colors[i - 1] && attempts < FILTER_BRAND_COLORS.length) {
      const idx = (FILTER_BRAND_COLORS.indexOf(color) + 1) % FILTER_BRAND_COLORS.length
      color = FILTER_BRAND_COLORS[idx]
      attempts++
    }
    colors.push(color)
  })
  return colors
}

// Per the STYLES — Product Library spec: each tag gets a flat brand-color
// fill, black text, no border. LGBTQ+-owned spans all five brand colors.
const PRODUCT_FLAGS = [
  { key: 'black_owned',       label: 'Black-owned',       bg: T.blue,   color: T.text },
  { key: 'indigenous_owned',  label: 'Indigenous-owned',  bg: T.green,  color: T.text },
  { key: 'poc_owned',         label: 'POC-owned',         bg: T.orange, color: T.text },
  { key: 'woman_owned',       label: 'Woman-owned',       bg: T.pink,   color: T.text },
  { key: 'lgbtq_owned',       label: 'LGBTQ+-owned',      bg: `linear-gradient(90deg, ${T.pink}, ${T.orange}, ${T.yellow}, ${T.green}, ${T.blue})`, color: T.text },
  { key: 'cruelty_free',      label: 'Cruelty-free',      bg: T.yellow, color: T.text },
  { key: 'vegan',             label: 'Vegan',             bg: T.blue,   color: T.text },
  { key: 'certified_organic', label: 'Organic',           bg: T.green,  color: T.text },
  { key: 'fair_trade',        label: 'Fair trade',        bg: T.orange, color: T.text },
  { key: 'is_prescription',    label: 'Prescription',      bg: T.pink,   color: T.text },
  { key: 'clean_formula',      label: 'Clean',             bg: T.green,  color: T.text },
  { key: 'science_backed',     label: 'Science-backed',    bg: T.yellow, color: T.text },
  { key: 'is_discontinued',    label: 'Discontinued',      bg: T.orange, color: T.text },
]

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


function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: T.surfaceMuted, border: `0.5px solid ${T.hairline}`, fontSize: 12, color: T.text, marginBottom: 6 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: T.darkPink }} />
      {label}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, width = 140 }) {
  return <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={{ width, fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.hairline}`, borderRadius: 6, background: T.white, color: T.text }} />
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
          fontSize: 9, padding: '2px 8px', borderRadius: T.radius.pill,
          background: f.bg, color: f.color,
          border: 'none', fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>{f.label}</span>
      ))}
      {rest > 0 && <span style={{ fontSize: 9, color: T.textLight, padding: '2px 4px' }}>+{rest} more</span>}
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
    width: '100%', boxSizing: 'border-box', padding: '8px 14px',
    borderRadius: T.radius.pill, border: '1px solid rgba(0,0,0,0.15)',
    background: T.white, color: T.text, fontSize: 12,
    fontFamily: 'inherit', outline: 'none',
  }
  const textareaStyle = { ...inputStyle, borderRadius: T.radius.card, resize: 'vertical' }
  const labelStyle = {
    fontSize: 10, fontWeight: 600, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 4,
  }

  return (
    <div style={{ marginTop: 20, borderTop: '0.5px solid rgba(0,0,0,0.1)', paddingTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>My notes</div>

      {/* Notes */}
      <div style={{ marginBottom: 12 }}>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How does this work for you? Any tips..."
          rows={3}
          style={textareaStyle}
        />
      </div>

      {/* Effectiveness + Buy again — same line, wraps on narrow screens */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
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
                  padding: '6px 14px', borderRadius: T.radius.pill, fontSize: 11,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: 'none',
                  background: buyAgain === val ? T.darkPink : 'rgba(0,0,0,0.06)',
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
          style={{ width: '100%', fontSize: 12, padding: '8px 30px 8px 14px', border: '1px solid rgba(0,0,0,0.15)', borderRadius: T.radius.pill, background: T.white, color: paoMonths ? T.text : T.textMuted, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
          <option value="">— Select PAO —</option>
          {PAO_OPTIONS.map(m => <option key={m} value={m}>{m} months</option>)}
        </select>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        style={{
          width: '100%', padding: '10px', borderRadius: T.radius.pill, border: 'none',
          background: saved ? '#4caf50' : T.darkPink,
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
// Spans all 5 brand hues at 3 lightness levels each, so product tiles read
// as randomly colorful rather than one narrow pink family.
const BRAND_COLORS = [
  '#FCE9F5', '#FAD4EB', '#F6B7DD', // pink — light to medium
  '#F0F2FE', '#E0E6FD', '#CCD5FC', // blue — light to medium
  '#EBFBF2', '#D7F7E4', '#BDF1D2', // green — light to medium
  '#FEF6DE', '#FCEDBD', '#FAE191', // yellow — light to medium
  '#F9E9E2', '#FBD4C6', '#F8B8A0', // orange — light to medium
]
function getBrandColor(brand, id) {
  // Use product ID hash for random-but-stable color per product (not per brand)
  const str = id || brand || 'unknown'
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return BRAND_COLORS[hash % BRAND_COLORS.length]
}

function ProductModal({ product: p, onClose, onEdit, onDelete, catalogProducts, isWhatWeUsing, userRoutineNames, upd, onAddToLibrary, onRemoveFromLibrary, onSaveUserProductData, onMarkFinished }) {
  const [confirmDialog, confirm] = useConfirm()
  const [finishConfetti, setFinishConfetti] = useState(false)
  const [finishCount, setFinishCount] = useState(upd?.finish_count || p.finish_count || 0)

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleMarkFinished() {
    setFinishConfetti(true)
    setFinishCount(c => c + 1)
    setTimeout(() => setFinishConfetti(false), 2500)
    if (onMarkFinished) await onMarkFinished(p)
  }
  if (!p) return null
  // Merge user-specific data (upd) into p so date/PAO fields work for catalog products
  const merged = {
    ...p,
    opened_at:    upd?.opened_at    || p.opened_at    || null,
    purchased_at: upd?.purchased_at || p.purchased_at || null,
    expires_at:   upd?.expiry_date  || p.expires_at   || null,
    pao_months:   upd?.pao_months   || p.pao_months   || null,
  }
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
      <div style={{ position: 'relative', width: '100%', maxWidth: 760, height: 'min(85vh, 680px)' }}>
        <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={p.name || 'Product details'} style={{
          background: T.white, borderRadius: T.radius.modal, width: '100%',
          height: '100%',
          display: 'flex', overflow: 'hidden', position: 'relative',
        }}>
          {/* Plain × sitting inside the box, matching the day-flyout close
              button — no circle/pill background, one close-button language
              across the app. */}
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 12, right: 14, zIndex: 1010, border: 'none', background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 20, opacity: 0.8, padding: '0 2px', lineHeight: 1 }}>×</button>

        {/* ── Left: portrait image ─────────────────────────── */}
        {img && (
          <div style={{ width: '40%', flexShrink: 0, overflow: 'hidden', background: getBrandColor(p.brand, p.id), borderRadius: `${T.radius.card} 0 0 ${T.radius.card}` }}>
            <img src={img} alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.currentTarget.parentElement.style.display = 'none' }} />
          </div>
        )}

        {/* ── Right: scrollable content ─────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', padding: '20px 16px 28px', position: 'relative' }}>

          {/* Name + brand */}
          <div style={{ paddingRight: 38, marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{p.name}</div>
            {p.brand && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{p.brand}</div>}
          </div>

          {/* Routine badges */}
          {(isCatalog || p._isLinked) && wwu && (
            <div style={{ display: 'inline-block', fontSize: 11, background: T.green, color: T.text, borderRadius: T.radius.pill, padding: '3px 10px', fontWeight: 600, marginBottom: 8, marginRight: 6 }}>What we're using!</div>
          )}
          {userUsing && (
            <div style={{ display: 'inline-block', fontSize: 11, background: '#EBFBF2', color: T.darkGreen, borderRadius: T.radius.pill, padding: '3px 10px', fontWeight: 600, marginBottom: 8 }}>In my routine</div>
          )}

          {/* Category — most specific only */}
          {(p.ingredient_form || p.ingredient_category || p.category) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', color: T.textMuted, borderRadius: T.radius.pill, padding: '3px 10px' }}>
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
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: T.radius.pill, background: T.white, color: T.text, textDecoration: 'none', border: `1px solid ${T.text}`, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                  Buy from {storeName || getStoreName(purchaseUrl) || 'affiliate'} ↗
                </a>
              )}
              {directUrl && (
                <a href={directUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: T.radius.pill, background: T.white, color: T.text, textDecoration: 'none', border: `1px solid ${T.text}`, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                  Buy from {directStoreName || getStoreName(directUrl) || 'brand site'} ↗
                </a>
              )}
            </div>
          )}

          {/* Our note — curator note, hidden if empty */}
          {p.notes && (
            <div style={{ margin: '10px 0 12px', padding: '10px 12px', background: T.pink, borderRadius: 0, borderLeft: `3px solid ${T.darkPink}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.darkPink, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Our note</div>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{p.notes}</div>
            </div>
          )}

          {/* Description */}
          {p.description && <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7, marginTop: 12, marginBottom: 12 }}>{p.description}</div>}

          {/* Ingredients — collapsible accordion */}
          {p.ingredients && <IngredientsAccordion ingredients={p.ingredients} />}



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
                ? <>
                    <button onClick={handleMarkFinished}
                      style={{ flex: 1, padding: '9px', borderRadius: T.radius.pill, border: '0.5px solid ' + T.darkGreen, background: finishConfetti ? T.green : 'transparent', color: T.darkGreen, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500, transition: 'background 0.3s' }}>
                      {finishConfetti ? '✓ Finished!' : finishCount > 0 ? `Mark as finished (${finishCount}×)` : 'Mark as finished'}
                    </button>
                    <button onClick={() => { onRemoveFromLibrary(p.id); onClose() }}
                      style={{ padding: '9px 14px', borderRadius: T.radius.pill, border: '1px solid rgba(0,0,0,0.15)', background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      Remove
                    </button>
                  </>
                : <button onClick={() => { onAddToLibrary(p); onClose() }}
                    style={{ flex: 1, padding: '9px', borderRadius: T.radius.pill, border: 'none', background: T.darkPink, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
                    + Add to my products
                  </button>
            ) : (
              <>
                <button onClick={() => { onClose(); onEdit(p) }}
                  style={{ flex: 1, padding: '9px', borderRadius: T.radius.pill, border: 'none', background: 'rgba(0,0,0,0.06)', color: T.text, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
                  Edit
                </button>
                <button onClick={handleMarkFinished}
                  style={{ flex: 1, padding: '9px', borderRadius: T.radius.pill, border: '0.5px solid ' + T.darkGreen, background: finishConfetti ? T.green : 'transparent', color: T.darkGreen, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500, transition: 'background 0.3s' }}>
                  {finishConfetti ? '✓ Finished!' : finishCount > 0 ? `Mark as finished (${finishCount}×)` : 'Mark as finished'}
                </button>
                <button onClick={async () => { if (await confirm({ title: `Delete ${p.name}?`, message: 'This cannot be undone.' })) { onDelete(p); onClose() } }}
                  style={{ padding: '9px 14px', borderRadius: T.radius.pill, border: '1px solid rgba(0,0,0,0.15)', background: 'transparent', color: T.textLight, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        </div>

        {/* Confetti burst on finish */}
        {finishConfetti && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 0 }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 40}%`,
                width: 6, height: 6,
                borderRadius: Math.random() > 0.5 ? '50%' : 0,
                background: [T.pink, T.blue, T.green, T.yellow, T.orange][i % 5],
                animation: `confettiFall ${0.8 + Math.random() * 1.2}s ease-out forwards`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }} />
            ))}
            <style>{`@keyframes confettiFall { to { transform: translateY(120px) rotate(720deg); opacity: 0; } }`}</style>
          </div>
        )}
      </div>
      </div>
      {confirmDialog}
    </div>
  )
}


// ─── PRODUCT LIBRARY ─────────────────────────────────────────
function ProductLibrary({ products, catalogProducts, userProductData, activeRoutineNames, userRoutineNames, onEdit, onAdd, onDelete, onAddToLibrary, onRemoveFromLibrary, onSaveUserProductData, onMarkFinished }) {
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
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 640) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useEffect(() => {
    if (!filterSheetOpen) return
    function handleKey(e) { if (e.key === 'Escape') setFilterSheetOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [filterSheetOpen])

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

  function FilterSection({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
      <div style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)', paddingBottom: 12, marginBottom: 12 }}>
        <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: open ? 8 : 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
          <span style={{ fontSize: 12, color: T.textLight }}>{open ? '−' : '+'}</span>
        </button>
        {open && children}
      </div>
    )
  }

  function CheckItem({ label, checked, onChange, color }) {
    const boxColor = color || brandColorForLabel(label)
    return (
      <div onClick={onChange} role="checkbox" aria-checked={checked} tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange() } }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text, cursor: 'pointer', padding: '3px 0', userSelect: 'none' }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid ' + (checked ? boxColor : T.text), background: checked ? boxColor : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {checked && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4L4 7.5L10 1" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        {label}
      </div>
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
    const catColors    = assignFilterColors(availableCats.map(formatCatLabel))
    const brandColors  = assignFilterColors(availableBrands)
    const flagColors   = assignFilterColors(availableFlags.map(f => f.label))
    const statusColors = assignFilterColors(['Currently using', 'Would buy again'])
    return (
      <>
        <FilterSection title="Product type">
          {availableCats.map((cat, i) => (
            <CheckItem key={cat} label={formatCatLabel(cat)} checked={filterCats.includes(cat)} onChange={() => toggleCat(cat)} color={catColors[i]} />
          ))}
        </FilterSection>
        <FilterSection title="Brand">
          {availableBrands.map((brand, i) => (
            <CheckItem key={brand} label={brand} checked={filterBrands.includes(brand)} onChange={() => toggleBrand(brand)} color={brandColors[i]} />
          ))}
        </FilterSection>
        <FilterSection title="Ethics & values">
          {availableFlags.map(({ key, label }, i) => (
            <CheckItem key={key} label={label} checked={filterFlags.includes(key)} onChange={() => toggleFlag(key)} color={flagColors[i]} />
          ))}
        </FilterSection>
        <FilterSection title="Status">
          <CheckItem label="Currently using" checked={filterUsing} onChange={() => setFilterUsing(s => !s)} color={statusColors[0]} />
          <CheckItem label="Would buy again" checked={filterBuyAgain} onChange={() => setFilterBuyAgain(s => !s)} color={statusColors[1]} />
        </FilterSection>
        {hasFilters && (
          <button onClick={clearAll} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: T.radius.pill, border: 'none', background: '#000000', color: '#ffffff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
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
          <div role="dialog" aria-modal="true" aria-labelledby="filter-sheet-title" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101, background: T.white, borderRadius: '16px 16px 0 0', padding: '0 20px 32px', maxHeight: '75vh', overflowY: 'auto', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', animation: 'slideUp 0.22s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 16px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div id="filter-sheet-title" style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Filters</div>
              <button onClick={() => setFilterSheetOpen(false)} aria-label="Close filters" style={{ border: 'none', background: 'transparent', fontSize: 20, color: T.textMuted, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
            </div>
            <FilterContent />
          </div>
        </>
      )}

      {/* ── Mobile filter pill button ────────────────────────── */}
      {isMobile && (
        <button onClick={() => setFilterSheetOpen(true)} style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 99, padding: '10px 20px', borderRadius: 24, background: hasFilters ? T.darkPink : T.text, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚙︎ Filters</span>
          {hasFilters && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{filterBrands.length + filterCats.length + filterFlags.length + (filterUsing ? 1 : 0) + (filterBuyAgain ? 1 : 0)}</span>}
        </button>
      )}

      {/* ── Left Sidebar — desktop only ──────────────────────── */}
      {!isMobile && <div style={{ width: 200, flexShrink: 0, background: T.white, color: T.text, borderRight: '0.5px solid rgba(0,0,0,0.1)', padding: '16px 16px 16px 20px', overflowY: 'auto', position: 'sticky', top: 0, height: '100%' }}>
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
            <button key={t.key} onClick={() => setLibTab(t.key)} style={{
              padding: '5px 12px', borderRadius: T.radius.pill, fontSize: 11, cursor: 'pointer',
              border: `1px solid ${libTab === t.key ? T.darkGreen : T.text}`,
              background: libTab === t.key ? T.darkGreen : 'transparent',
              color: libTab === t.key ? T.white : T.text, fontFamily: 'inherit',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {t.label} <span style={{ color: libTab === t.key ? 'rgba(255,255,255,0.75)' : T.textMuted }}>({t.count})</span>
            </button>
          ))}
        </div>

        {/* Sort + Search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>Sort</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '7px 30px 7px 14px', borderRadius: T.radius.pill, border: '1px solid rgba(0,0,0,0.15)', background: T.white, color: T.text, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, outline: 'none' }}>
            <option value="routine">My routine first</option>
            <option value="name">A–Z Product name</option>
            <option value="brand">A–Z Brand name</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." aria-label="Search products" style={{ flex: 1, fontSize: 12, padding: '7px 14px', border: '1px solid rgba(0,0,0,0.15)', borderRadius: T.radius.pill, background: T.white, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Empty state */}
        {list.length === 0 && (
          <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
            {pool.length === 0 ? 'No products yet.' : 'No products match your filters.'}
          </div>
        )}

        {/* Grid — 2 col mobile, 5 col desktop, portrait images */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 12, paddingBottom: isMobile ? 80 : 24 }}>
          {list.map(p => {
            const wwu = isWhatWeUsing(p)
            const userUsing = !wwu && (userRoutineNames||new Set()).has(((p.name||'')+'|'+(p.brand||'')).toLowerCase())
            const img = p.imageUrl || p.image_url
            return (
              <div key={p.id} onClick={() => setSelectedProduct(p)}
                role="button" tabIndex={0} aria-label={p.name}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedProduct(p) } }}
                style={{ cursor: 'pointer', position: 'relative', background: T.white, display: 'flex', flexDirection: 'column', borderRadius: T.radius.card, overflow: 'hidden' }}>
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
                      {wwu && <span style={{ fontSize: 8, background: T.green, color: T.text, borderRadius: T.radius.pill, padding: '2px 6px', fontWeight: 700, whiteSpace: 'nowrap' }}>What we're using!</span>}
                      {userUsing && <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.93)', color: T.darkGreen, borderRadius: T.radius.pill, padding: '2px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>In my routine</span>}
                    </div>
                  )}
                </div>
                {/* Text — flex column so pills pin to bottom regardless of count */}
                <div style={{ padding: '8px 8px 10px', background: T.white, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.4, marginBottom: 2 }}>{p.name}</div>
                    {p.brand && <div style={{ fontSize: 11, color: T.textMuted }}>{p.brand}</div>}
                    {p.finish_count > 0 || (userProductData||{})[p.id]?.finish_count > 0 ? (
                      <div style={{ fontSize: 9, color: T.darkGreen, marginTop: 3, fontWeight: 600 }}>
                        Finished {((userProductData||{})[p.id]?.finish_count || p.finish_count)}×
                      </div>
                    ) : null}
                  </div>
                  {/* URL pills — always at bottom, stacked full width */}
                  {(p.purchaseUrl || p.direct_url) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      {p.purchaseUrl && (
                        <a href={p.purchaseUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', fontSize: 9, padding: '4px 8px', borderRadius: T.radius.pill, background: getBrandColor(p.brand, p.id), color: T.text, textDecoration: 'none', border: 'none', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                          Buy from {p.store_name || 'affiliate'} ↗
                        </a>
                      )}
                      {p.direct_url && (
                        <a href={p.direct_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', fontSize: 9, padding: '4px 8px', borderRadius: T.radius.pill, background: getBrandColor(p.brand, p.id), color: T.text, textDecoration: 'none', border: 'none', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit', boxSizing: 'border-box' }}>
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
          onMarkFinished={onMarkFinished}
        />
      )}
    </div>
  )
}

// ─── PRODUCTS PAGE ────────────────────────────────────────────
export default function ProductsPage({ session }) {
  const [alertDialog, alertUser] = useAlert()
  const [products, setProducts] = useState({})
  const [catalogProducts, setCatalogProducts] = useState({})
  const [userProductData, setUserProductData] = useState({}) // keyed by product_id
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('library') // library | history
  const [finishHistory, setFinishHistory] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [activeRoutineNames, setActiveRoutineNames] = useState(new Set())
  const [userRoutineNames, setUserRoutineNames] = useState(new Set())
  const userId = session?.user?.id
  const CURATOR_ID = '27fbf9cd-5cfe-4032-9594-398e96fd0ccf'

  useEffect(() => {
    if (!editingProduct) return
    function handleKey(e) { if (e.key === 'Escape') setEditingProduct(null) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [editingProduct])

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
            finish_count: p.finish_count || 0,
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

      // Load finish history
      const { data: finishes } = await supabase
        .from('product_finishes')
        .select('id, product_id, finished_at, notes')
        .eq('user_id', userId)
        .order('finished_at', { ascending: false })
      setFinishHistory(finishes || [])
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
        await alertUser(product.name + ' is already in your products.')
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

  async function markFinished(product) {
    if (!product.id || !session?.user?.id) return
    const userId = session.user.id
    const existing = userProductData[product.id] || {}
    const newCount = (existing.finish_count || 0) + 1

    // Store in user_product_data — works for catalog AND personal products
    await supabase.from('user_product_data')
      .upsert({ user_id: userId, product_id: product.id, ...existing, finish_count: newCount }, { onConflict: 'user_id,product_id' })

    // Log each finish event
    await supabase.from('product_finishes').insert({
      user_id: userId,
      product_id: product.id,
      finished_at: new Date().toISOString().split('T')[0],
    })

    // Update local state
    setUserProductData(prev => ({
      ...prev,
      [product.id]: { ...prev[product.id], finish_count: newCount }
    }))
  }

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: T.white, display: 'flex', flexDirection: 'column' }}>
      {/* ── App header ──────────────────────────────────────────── */}
      <div style={{ background: T.text }}>
        {/* Logo row — logo centered (matching the calendar page), arrow stays left */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' }}>
          <a href="/routine" aria-label="Back to calendar" style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.white, textDecoration: 'none', display: 'inline-block' }}>←</a>
          <a href="/routine" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'baseline', textDecoration: 'none' }}>
            <GlowUpLogo size={32} style={{ color: T.white }} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setEditingProduct('new')}
              style={{ border: 'none', background: T.darkGreen, color: T.white, borderRadius: T.radius.pill, padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap' }}>
              + Add new product
            </button>
            <NotificationBell session={session} />
            <button onClick={() => setShowMenu(true)}
              style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '5px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', width: 36, height: 32 }}>
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
            </button>
            {showMenu && (
              <SideMenu session={session} onClose={() => setShowMenu(false)}
                onFeedback={() => { setShowMenu(false); setShowFeedback(true) }} />
            )}
            {showFeedback && <FeedbackPanel onClose={() => setShowFeedback(false)} />}
          </div>
        </div>
        {/* Page title row with tabs */}
        <div style={{ padding: '0 20px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.white, marginBottom: 10 }}>Product Library</div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 20, borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
            {[['library', 'My Products'], ['history', 'Finish History']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: activeTab === key ? 700 : 400, color: activeTab === key ? T.white : 'rgba(255,255,255,0.6)', borderBottom: `2px solid ${activeTab === key ? T.white : 'transparent'}`, marginBottom: -1 }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {editingProduct && (
        <div onClick={() => setEditingProduct(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={editingProduct === 'new' ? 'Add new product' : 'Edit product'} style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <ProductForm
              initial={editingProduct === 'new' ? undefined : editingProduct}
              onSave={saveProduct}
              onCancel={() => setEditingProduct(null)}
              catalogProducts={catalogProducts}
              userId={userId}
            />
          </div>
        </div>
      )}

      {loading
        ? <div style={{ padding: '40px 20px', fontSize: 13, color: T.textMuted, textAlign: 'center' }}>Loading your products...</div>
        : activeTab === 'history'
        ? <div style={{ padding: '20px' }}>
            {finishHistory.length === 0
              ? <div style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>No finishes yet — mark a product as finished to see your history here.</div>
              : finishHistory.map(f => {
                  const allProds = { ...products, ...Object.fromEntries(Object.entries(catalogProducts)) }
                  const prod = allProds[f.product_id]
                  return (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: 20, color: T.darkGreen }}>✓</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{prod?.name || 'Unknown product'}</div>
                        {prod?.brand && <div style={{ fontSize: 11, color: T.textMuted }}>{prod.brand}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, whiteSpace: 'nowrap' }}>
                        {new Date(f.finished_at + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  )
                })
            }
          </div>
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
              onMarkFinished={markFinished}
            />
      }
      {alertDialog}
      <GlowUpFooter onFeedback={() => setShowFeedback(true)} />
    </div>
  )
}
