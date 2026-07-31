import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SHEET_ID    = Deno.env.get('SHEET_ID') ?? ''
const SHEET_RANGE = 'Products!A2:Z1000'

// Column order matches the actual Google Sheet exactly.
// NOTE: image_url is NOT in the sheet — images are managed manually
// in Supabase Storage and are never touched by this sync.
const COLUMNS = [
  'name', 'brand', 'category', 'ingredient_category', 'ingredient_form',
  'description', 'notes', 'ingredients', 'image_url',
  'purchase_url', 'store_name', 'direct_url', 'direct_store_name',
  'tags',
  'black_owned', 'indigenous_owned', 'poc_owned', 'woman_owned', 'lgbtq_owned',
  'cruelty_free', 'vegan', 'certified_organic', 'fair_trade', 'clean_formula',
  'science_backed', 'is_prescription',
]

const BOOLEAN_COLUMNS = new Set([
  'black_owned', 'indigenous_owned', 'poc_owned', 'woman_owned', 'lgbtq_owned',
  'cruelty_free', 'vegan', 'certified_organic', 'fair_trade', 'clean_formula',
  'science_backed', 'is_prescription',
])

function parseRow(row: string[]) {
  const obj: Record<string, unknown> = {}
  for (let i = 0; i < COLUMNS.length; i++) {
    const col = COLUMNS[i]
    const raw = (row[i] ?? '').trim()
    if (BOOLEAN_COLUMNS.has(col)) {
      obj[col] = raw.toUpperCase() === 'TRUE'
    } else if (col === 'tags') {
      obj[col] = raw ? raw.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    } else if (col === 'brand') {
      obj[col] = raw || ''  // empty string not null — unique constraint needs this
    } else {
      obj[col] = raw || null
    }
  }
  if (!obj.name) return null
  return obj
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const apiKey             = Deno.env.get('GOOGLE_API_KEY')             ?? ''
    const supabaseUrl        = Deno.env.get('SUPABASE_URL')               ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  ?? ''

    const encodedRange = encodeURIComponent(SHEET_RANGE)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodedRange}?key=${apiKey}`

    const sheetRes  = await fetch(url)
    const sheetJson = await sheetRes.json()
    const { values } = sheetJson

    if (!values?.length) {
      return new Response(JSON.stringify({ message: 'Sheet is empty', upserted: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const rows = values.map(parseRow).filter(Boolean)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // image_url is intentionally absent — it is never written by this sync
    // so Supabase always keeps whatever was manually uploaded.
    // URL fields (purchase_url, direct_url, etc.) are only written when
    // the sheet cell has an actual value — empty cells leave Supabase untouched.
    const catalogRows = rows.map(r => {
      const record = r as Record<string, unknown>
      const cleaned: Record<string, unknown> = {}
      const urlFields = new Set(['purchase_url', 'store_name', 'direct_url', 'direct_store_name'])

      for (const [key, value] of Object.entries(record)) {
        if (urlFields.has(key)) {
          // Only write URL fields when the sheet cell has a real value
          if (value !== null && value !== '' && value !== undefined) {
            cleaned[key] = value
          }
        } else {
          cleaned[key] = value
        }
      }

      return { ...cleaned, is_catalog: true, user_id: null }
    })

    const { data, error } = await supabase
      .from('products')
      .upsert(catalogRows, { onConflict: 'name,brand', ignoreDuplicates: false })
      .select('id')

    if (error) throw new Error(JSON.stringify(error))

    return new Response(
      JSON.stringify({ message: 'Sync complete', upserted: data?.length ?? rows.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
