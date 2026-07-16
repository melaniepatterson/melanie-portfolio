// Shared product-add/edit form — full-featured version (autocomplete against the
// catalog, duplicate detection, store/direct-link fields, discontinued flag).
// Used everywhere a product can be created or edited: ProductsPage, the day
// flyout's "+ Add new product", RoutinePeriodForm, DailyEditor, ShowerEditor.
// See GlowUp_Project_Handoff.md Section 13.5a for the consolidation decision —
// GlowUpCalendar.jsx and ProductsPage.jsx previously had two diverging copies.
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import T from '../theme'
import { useAlert } from './useConfirm'
import StarRating from './StarRating'

export const PRODUCT_CATEGORIES = [
  'cleanser', 'cleansing oil / balm', 'toner', 'essence',
  'serum', 'moisturizer', 'spf', 'eye cream',
  'bha', 'azelaic acid', 'tretinoin',
  'body wash', 'body treatment', 'haircare', 'hair growth', 'boosts', 'other'
]

// Acronyms that should be fully uppercase in labels
const UPPERCASE_WORDS = new Set(['spf', 'bha', 'aha', 'pha', 'bha/aha', 'aha/bha'])
export function formatCatLabel(cat) {
  return cat.split(' ').map(w =>
    UPPERCASE_WORDS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ')
}

export const PAO_OPTIONS = [3, 6, 9, 12, 18, 24, 36]

export const PRODUCT_INGREDIENT_CATEGORIES = {
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
}

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

export const PRODUCT_IMAGES_URL = 'https://brcjhshptisevcndqavz.supabase.co/storage/v1/object/public/product-images/'

export async function imageToWebP(file, maxDim = 600, quality = 0.88) {
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

export function ProductImageUpload({ value, onChange, userId, productName }) {
  const [alertDialog, alertUser] = useAlert()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(value || null)
  const ref = useRef(null)

  useEffect(() => { setPreview(value || null) }, [value])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { await alertUser('Image must be under 10MB'); return }
    setUploading(true)
    try {
      const webp = await imageToWebP(file)
      const slug = (productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
      const path = `${userId || 'anon'}/${slug}-${Date.now()}.webp`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, webp, { upsert: true, contentType: 'image/webp' })
      if (error) throw error
      const publicUrl = PRODUCT_IMAGES_URL + path
      setPreview(publicUrl)
      onChange(publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
      await alertUser('Upload failed — please try again')
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
      {alertDialog}
    </div>
  )
}

export default function ProductForm({ initial, onSave, onCancel, catalogProducts, userId }) {
  const [form, setForm] = useState({
    name: '', brand: '', category: 'cleanser',
    imageUrl: '', purchaseUrl: '',
    bdsCompliant: true, tags: [],
    effectiveness: 0, buyAgain: null, notes: '',
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
        <ProductImageUpload value={form.imageUrl} onChange={url => set('imageUrl', url)} userId={userId} productName={form.name} />
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
        <button type="button" onClick={() => form.name && onSave({ ...form, id: form.id || crypto.randomUUID() })} disabled={!form.name}
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
