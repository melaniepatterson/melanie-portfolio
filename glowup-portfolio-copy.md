# GlowUp — portfolio copy drafts

Drafted for the `projects.js` entry / case study page. Pick, mix, or edit as needed.

---

## Short version (for a project card / one-liner)

**GlowUp — a skincare routine tracker that thinks like a dermatologist.**

A full-stack web app that helps people build and maintain a skincare routine safely — tracking active ingredients, pacing new products in gradually, and automatically flagging conflicts between treatments (peels, laser, microneedling) and what's already in someone's routine. Built solo, end to end: React front end, Supabase backend, passwordless auth, and a custom design system.

---

## Medium version (for the `description` field)

GlowUp is a skincare routine tracker built to solve a real problem: most people either wing their routine or get overwhelmed trying to introduce new actives safely. It walks users through phased, dermatologist-style onboarding programs that ramp up retinoid and exfoliant frequency gradually, tracks skincare, extras, and shower routines as separate histories, and automatically detects when a scheduled treatment — a peel, laser session, microneedling — conflicts with active ingredients already in someone's routine, suggesting the next safe date. It includes a product library with ethics/values tagging and expiry tracking, calendar export, and a fully anonymous feedback system. Designed and built solo: React/Supabase architecture, custom typography and brand system, and accessibility built in from the start rather than retrofitted.

---

## Long version (case-study style)

**GlowUp**
*Skincare routine tracking, designed like a dermatologist would build it*

**The problem**
Skincare advice is everywhere, but actually *managing* a routine — introducing a new retinoid without irritation, remembering to pause actives before a chemical peel, tracking what you're using across morning, evening, and shower routines — is mostly done in someone's Notes app, if at all. GlowUp is a purpose-built tracker that treats a skincare routine as something with real rules and real risk, not just a checklist.

**What it does**
- **Guided onboarding programs** ramp new users into actives gradually — a foundation phase locks in the basics, then a retinoid or AHA/BHA program increases frequency over weeks, pausing automatically if a scheduled treatment's recovery window would otherwise rush someone through a tolerance-building phase.
- **Conflict-aware treatment scheduling** cross-references any scheduled treatment (peels, laser, microneedling, Botox, and more) against the user's actual active routine, flags real conflicts, and finds the next safe date automatically.
- **Three independent routine histories** — skincare, extras, and shower — each with a full timeline, so past days always render correctly even after the routine has since changed.
- **A product library** with faceted filtering, ethics/values tags (cruelty-free, vegan, Black-owned, and more), ratings, and expiry tracking based on period-after-opening.
- **Calendar export**, in-app notifications for expiring products and recovery windows ending, and a beta program with a dedicated, optionally-anonymous feedback survey.

**How it's built**
Solo-designed and solo-built: a React front end on Supabase (Postgres + auth + edge functions), passwordless magic-link authentication with an invite-gated waitlist, and a custom design system — bespoke wordmark, five-color brand palette, and a component library built with accessibility (ARIA semantics, keyboard nav, focus states) from day one rather than bolted on later. Every screen respects the user's actual timezone for day-boundary logic, and the whole product treats user privacy as a default: no tracking, a genuinely anonymous feedback path, and self-serve data deletion.

---

## Reference: full feature inventory

### Core routine tracking
- Three parallel routine types (skincare, extras, shower), each with its own dated history — the calendar resolves the correct routine for any given day, past or present
- AM/PM per-day model built from a 14-item ingredient-category taxonomy (cleanser, toner, retinoid, SPF, etc.)
- Retinoid/active scheduling engine with 4 selectable frequency patterns; past days always render under whatever frequency was active *then*
- Independent AHA/BHA exfoliation schedule that runs alongside retinoid scheduling
- Product assignment per step, drag-to-reorder items (desktop drag-and-drop + mobile long-press)

### Guided programs
- Foundation program: locks in basics first, then a skin-type-aware picker for adding steps (toner, vitamin C, exfoliant, eye cream, etc.)
- Tretinoin/retinoid and AHA/BHA onboarding tracks that ramp frequency up phase by phase, including sandwich-method guidance for new retinoid users
- Phase timer automatically pauses for treatment recovery windows so a peel doesn't fast-track someone through a tolerance-building phase
- Program stacking with compatibility checks so conflicting programs can't run simultaneously

### Treatment & conflict intelligence
- Tracks 11+ treatment types (peels, laser, microneedling, Botox, HydraFacial, etc.) plus custom types, each with its own pre/post pause windows
- Detects scheduling conflicts (blocking) and ingredient/routine conflicts (advisory) against the user's actual active routine
- Automatically searches forward and suggests the next fully-safe date

### Product library
- Unified catalog + personal library model
- Faceted filtering: type, brand, ethics/values (cruelty-free, vegan, Black-owned, Indigenous-owned, POC-owned, woman-owned, LGBTQ+-owned, organic, fair trade, clean formula, science-backed, and more)
- Per-product ratings, notes, "buy again," and expiry tracking via period-after-opening
- "Mark as finished" with a finish counter and confetti animation

### Profile & personalization
- Fitzpatrick skin-tone scale, age range, skin type, skin goals, skin concerns, retinoid experience, climate, timezone
- Skin type feeds contextual advisory notes in the guided-program picker

### History
- Full timeline per routine type with human-readable labels, edit-in-place, and "carry forward + edit" for starting new periods

### Export & notifications
- `.ics` calendar export with customizable AM/PM timing
- In-app notifications for expiring products and recovery windows ending

### Auth & privacy
- Passwordless magic-link auth with an invite/waitlist gate
- Genuinely anonymous general feedback system (no user ID ever stored)
- Separate structured beta-tester survey with an anonymous-submission toggle
- Cookie consent banner, privacy policy, self-serve account deletion and routine reset

### Technical & UX polish
- Accessibility built in: ARIA dialog semantics, keyboard nav, focus-visible states, accessible custom checkboxes
- Responsive patterns tuned per surface (bottom-sheet filters on mobile vs. sticky sidebar on desktop)
- Timezone-correct date logic throughout
- Custom typography/wordmark and a cohesive 5-color brand system
- Delight touches: confetti, animated progress bars — without tipping into gimmicky
