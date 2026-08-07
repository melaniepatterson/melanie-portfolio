// Static, fabricated data for the read-only demo build (VITE_GLOWUP_DEMO=true).
// Not a snapshot of any real account — representative content only, sized to
// make every screen render fully populated instead of empty-state.
const DEMO_USER_ID = '00000000-0000-0000-0000-0000000000d1'
const now = () => new Date().toISOString()
const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
const daysFromNow = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const programs = [
  { id: 'p-basic', slug: 'basic-skincare', name: 'Basic Skincare', description: 'Your foundation routine — cleanse, moisturize, SPF. Everything else builds on this.', is_stackable: false, is_linear: true },
  { id: 'p-tret', slug: 'tretinoin-onboarding', name: 'Tretinoin Onboarding', description: 'A slow, guided ramp-up to nightly tretinoin — paced to avoid the worst of the purge.', is_stackable: true, is_linear: true },
  { id: 'p-ahabha', slug: 'aha-bha-onboarding', name: 'AHA/BHA Onboarding', description: 'Introduces a chemical exfoliant gradually, 1-3x a week, to avoid over-exfoliating.', is_stackable: true, is_linear: true },
  { id: 'p-bpo', slug: 'benzoyl-peroxide-onboarding', name: 'Benzoyl Peroxide Onboarding', description: 'Ramps up benzoyl peroxide for active breakouts without overdrying skin.', is_stackable: true, is_linear: true },
  { id: 'p-hp', slug: 'hyperpigmentation-protocol', name: 'Hyperpigmentation Protocol', description: 'Layers brightening actives to fade dark spots safely alongside your routine.', is_stackable: true, is_linear: true },
  { id: 'p-barrier', slug: 'skin-barrier-repair', name: 'Skin Barrier Repair', description: 'A stripped-back routine to rebuild a compromised moisture barrier.', is_stackable: true, is_linear: true },
]

const program_phases = [
  { id: 'ph-tret-1', program_id: 'p-tret', phase_number: 1, name: 'Twice a week', description: 'Tretinoin, twice a week, to let your skin acclimate.', preview_description: 'Twice a week, low and slow.', duration_days: 14 },
  { id: 'ph-tret-2', program_id: 'p-tret', phase_number: 2, name: 'Every other night', description: 'Stepping up to every other night as your skin adjusts.', preview_description: 'Every other night.', duration_days: 21 },
  { id: 'ph-tret-3', program_id: 'p-tret', phase_number: 3, name: 'Nightly', description: 'Full nightly use — the maintenance phase.', preview_description: 'Nightly, ongoing.', duration_days: null },

  // Every other seeded program gets phases too — otherwise starting them in
  // the demo silently renders nothing (ProgramAdvancement bails out with no
  // phases to show).
  { id: 'ph-basic-1', program_id: 'p-basic', phase_number: 1, name: 'Foundation', description: 'Cleanse, moisturize, SPF — the basics before anything else.', preview_description: 'Cleanse, moisturize, SPF.', duration_days: 14 },
  { id: 'ph-basic-2', program_id: 'p-basic', phase_number: 2, name: 'Build your routine', description: 'Layer in whatever your skin needs next.', preview_description: 'Ongoing.', duration_days: null },

  { id: 'ph-ahabha-1', program_id: 'p-ahabha', phase_number: 1, name: 'Once a week', description: 'One exfoliation night, to see how your skin responds.', preview_description: 'Once a week.', duration_days: 14 },
  { id: 'ph-ahabha-2', program_id: 'p-ahabha', phase_number: 2, name: 'Twice a week', description: 'Stepping up to twice a week.', preview_description: 'Twice a week.', duration_days: 21 },
  { id: 'ph-ahabha-3', program_id: 'p-ahabha', phase_number: 3, name: 'Maintenance', description: 'Three nights a week, ongoing.', preview_description: 'Three nights a week.', duration_days: null },

  { id: 'ph-bpo-1', program_id: 'p-bpo', phase_number: 1, name: 'Every other night', description: 'Benzoyl peroxide every other night to let your skin adjust.', preview_description: 'Every other night.', duration_days: 14 },
  { id: 'ph-bpo-2', program_id: 'p-bpo', phase_number: 2, name: 'Nightly', description: 'Stepping up to nightly use.', preview_description: 'Nightly.', duration_days: 21 },
  { id: 'ph-bpo-3', program_id: 'p-bpo', phase_number: 3, name: 'Maintenance', description: 'Nightly, ongoing — watch for overdrying.', preview_description: 'Nightly, ongoing.', duration_days: null },

  { id: 'ph-hp-1', program_id: 'p-hp', phase_number: 1, name: 'Introduce brightening serum', description: 'One brightening active layered into your existing routine.', preview_description: 'One brightening active.', duration_days: 14 },
  { id: 'ph-hp-2', program_id: 'p-hp', phase_number: 2, name: 'Add a second active', description: 'Layering in a second brightening step.', preview_description: 'Two brightening actives.', duration_days: 21 },
  { id: 'ph-hp-3', program_id: 'p-hp', phase_number: 3, name: 'Maintenance', description: 'Full brightening routine, ongoing.', preview_description: 'Ongoing.', duration_days: null },

  { id: 'ph-barrier-1', program_id: 'p-barrier', phase_number: 1, name: 'Strip back to basics', description: 'Cleanser, moisturizer, SPF only — nothing else while your barrier heals.', preview_description: 'Basics only.', duration_days: 14 },
  { id: 'ph-barrier-2', program_id: 'p-barrier', phase_number: 2, name: 'Reintroduce slowly', description: 'Adding actives back in one at a time, watching for irritation.', preview_description: 'Reintroducing actives.', duration_days: 21 },
  { id: 'ph-barrier-3', program_id: 'p-barrier', phase_number: 3, name: 'Maintenance', description: 'Full routine, barrier-safe pace.', preview_description: 'Ongoing.', duration_days: null },
]

const user_programs = [
  {
    id: 'up-tret-active', user_id: DEMO_USER_ID, program_id: 'p-tret', status: 'active',
    current_phase_number: 2, started_at: daysAgo(19), phase_started_at: daysAgo(5),
    status_detail: null, tret_start_date: daysAgo(19),
  },
  {
    id: 'up-basic-done', user_id: DEMO_USER_ID, program_id: 'p-basic', status: 'completed',
    current_phase_number: 2, started_at: daysAgo(90), status_detail: null,
  },
]

const products = [
  { id: 'pr-cleanser', name: 'Gentle Foaming Cleanser', brand: 'CeraVe', category: 'cleanser', image_url: null, purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.5, tags: ['fragrance-free'], notes: '', ingredient_category: '', ingredient_form: '', is_catalog: true, user_id: null },
  { id: 'pr-tret', name: 'Tretinoin 0.025%', brand: 'Compounded Rx', category: 'active', image_url: null, purchase_url: '', bds_compliant: false, effectiveness_avg: 4.8, tags: ['prescription'], notes: 'From dermatologist', ingredient_category: 'retinoid', ingredient_form: 'cream', is_catalog: false, user_id: DEMO_USER_ID },
  { id: 'pr-moisturizer', name: 'Ultra Repair Cream', brand: 'First Aid Beauty', category: 'moisturizer', image_url: null, purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.6, tags: ['barrier-repair'], notes: '', ingredient_category: '', ingredient_form: '', is_catalog: true, user_id: null },
  { id: 'pr-spf', name: 'Anthelios Mineral SPF 50', brand: 'La Roche-Posay', category: 'spf', image_url: null, purchase_url: 'https://example.com', bds_compliant: false, effectiveness_avg: 4.4, tags: ['mineral'], notes: '', ingredient_category: '', ingredient_form: '', is_catalog: true, user_id: null },
  { id: 'pr-vitc', name: 'C E Ferulic', brand: 'SkinCeuticals', category: 'active', image_url: null, purchase_url: 'https://example.com', bds_compliant: false, effectiveness_avg: 4.7, tags: ['vitamin-c'], notes: '', ingredient_category: 'antioxidant', ingredient_form: 'serum', is_catalog: true, user_id: null },
  { id: 'pr-hydrating', name: 'Hyaluronic Acid 2% + B5', brand: 'The Ordinary', category: 'serum', image_url: 'https://brcjhshptisevcndqavz.supabase.co/storage/v1/object/public/product-images/ord-hyaluronic-acid-2pct-B5-30ml-Clr-Acu.webp', purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.1, tags: ['budget'], notes: '', ingredient_category: 'humectant', ingredient_form: 'serum', is_catalog: true, user_id: null },
  { id: 'pr-toner', name: 'Pore Minimizing Toner', brand: 'Paula’s Choice', category: 'toner', image_url: null, purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.0, tags: [], notes: '', ingredient_category: '', ingredient_form: '', is_catalog: true, user_id: null },
  { id: 'pr-eye', name: 'Protini Polypeptide Eye Cream', brand: 'Drunk Elephant', category: 'eye_cream', image_url: null, purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.3, tags: [], notes: '', ingredient_category: '', ingredient_form: '', is_catalog: true, user_id: null },
  { id: 'pr-exfoliant', name: 'AHA 30% + BHA 2% Peeling Solution', brand: 'The Ordinary', category: 'exfoliant', image_url: 'https://brcjhshptisevcndqavz.supabase.co/storage/v1/object/public/product-images/rdn-aha-30pct-bha-2pct-peeling-solution-30ml.webp', purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.2, tags: ['strong'], notes: 'Weekly only', ingredient_category: 'exfoliant', ingredient_form: 'liquid', is_catalog: true, user_id: null },
  { id: 'pr-oil', name: 'Squalane Facial Oil', brand: 'Biossance', category: 'facial_oil', image_url: null, purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.4, tags: [], notes: '', ingredient_category: '', ingredient_form: '', is_catalog: true, user_id: null },
  { id: 'pr-mask', name: 'Watermelon Glow Sleeping Mask', brand: 'Glow Recipe', category: 'mask', image_url: null, purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.0, tags: ['weekly'], notes: '', ingredient_category: '', ingredient_form: '', is_catalog: true, user_id: null },
  { id: 'pr-lip', name: 'Lip Sleeping Mask', brand: 'Laneige', category: 'lip_care', image_url: null, purchase_url: 'https://example.com', bds_compliant: true, effectiveness_avg: 4.6, tags: [], notes: '', ingredient_category: '', ingredient_form: '', is_catalog: true, user_id: null },
]

const user_product_data = [
  { id: 'upd-1', user_id: DEMO_USER_ID, product_id: 'pr-cleanser', in_library: true, buy_again: true, finish_count: 2, opened_at: daysAgo(10), expires_at: daysFromNow(170), pao_months: 6 },
  { id: 'upd-2', user_id: DEMO_USER_ID, product_id: 'pr-moisturizer', in_library: true, buy_again: true, finish_count: 1, opened_at: daysAgo(30), expires_at: daysFromNow(150), pao_months: 6 },
  { id: 'upd-3', user_id: DEMO_USER_ID, product_id: 'pr-spf', in_library: true, buy_again: true, finish_count: 3, opened_at: daysAgo(5), expires_at: daysFromNow(85), pao_months: 3 },
  { id: 'upd-4', user_id: DEMO_USER_ID, product_id: 'pr-vitc', in_library: true, buy_again: false, finish_count: 0, opened_at: daysAgo(60), expires_at: daysFromNow(30), pao_months: 3 },
  { id: 'upd-5', user_id: DEMO_USER_ID, product_id: 'pr-hydrating', in_library: true, buy_again: true, finish_count: 1, opened_at: null, expires_at: null, pao_months: null },
  { id: 'upd-6', user_id: DEMO_USER_ID, product_id: 'pr-eye', in_library: true, buy_again: true, finish_count: 0, opened_at: daysAgo(20), expires_at: daysFromNow(160), pao_months: 6 },
]

const product_finishes = [
  { id: 'pf-1', user_id: DEMO_USER_ID, product_id: 'pr-cleanser', finished_at: daysAgo(95) },
  { id: 'pf-2', user_id: DEMO_USER_ID, product_id: 'pr-spf', finished_at: daysAgo(40) },
]

const routine_periods = [
  {
    id: 'rp-1', user_id: DEMO_USER_ID, start_date: daysAgo(19), end_date: null,
    active_name: 'tretinoin', tret_enabled: true, tret_frequency: 2, tret_start_date: daysAgo(19),
    tret_frequency_history: [{ start_date: daysAgo(19), frequency: 2 }],
    secondary_actives: [], bha_enabled: false, bha_frequency: 1, bha_start_day: 6,
    products: { cleanser: 'pr-cleanser', moisturizer: 'pr-moisturizer', spf: 'pr-spf', active: 'pr-tret' },
    steps: null, created_at: daysAgo(19), updated_at: daysAgo(2),
  },
]

const extras_periods = [
  { id: 'ep-1', user_id: DEMO_USER_ID, start_date: daysAgo(60), end_date: null, extras: ['gua_sha'], products: {}, created_at: daysAgo(60), updated_at: daysAgo(60) },
]

const shower_periods = [
  { id: 'sp-1', user_id: DEMO_USER_ID, start_date: daysAgo(60), end_date: null, frequency: 'daily', products: {}, created_at: daysAgo(60), updated_at: daysAgo(60) },
]

const treatments = [
  { id: 'tr-1', user_id: DEMO_USER_ID, type: 'facial', date: daysFromNow(9), notes: 'Monthly hydrating facial', created_at: daysAgo(30) },
  { id: 'tr-2', user_id: DEMO_USER_ID, type: 'peel', date: daysAgo(21), notes: '', created_at: daysAgo(35) },
]

const profiles = [
  {
    id: DEMO_USER_ID, email: 'demo@glowup.melanie.studio', display_name: 'Demo Account',
    avatar_url: null, skin_type: 'combination', timezone: 'America/New_York',
    survey_submitted_at: null, beta_tester: false, calendar_tour_completed_at: now(),
    recovery_routines: {}, updated_at: now(),
  },
]

export const DEMO_TABLES = {
  profiles,
  programs,
  program_phases,
  program_phase_steps: [],
  program_phase_options: [],
  user_programs,
  user_program_phase_history: [],
  user_program_phase_selections: [],
  routine_periods,
  extras_periods,
  shower_periods,
  products,
  user_product_data,
  product_finishes,
  treatments,
  custom_treatment_types: [],
  feedback: [],
  beta_survey: [],
  approved_emails: [],
}

export { DEMO_USER_ID }
