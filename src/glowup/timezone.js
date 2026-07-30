// ─── TIMEZONE UTILITIES ───────────────────────────────────────
// All date operations that care about "what day is it for this user"
// should go through these helpers rather than new Date() directly.
// This prevents midnight UTC rollover from showing tomorrow's calendar
// to users in timezones that haven't crossed midnight yet.

// Returns today's YYYY-MM-DD date string in the given IANA timezone.
// Falls back to the device's local timezone if tz is null/undefined.
export function todayInTz(tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
  } catch {
    // Invalid timezone string — fall back to local
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
  }
}

// Returns a Date object representing midnight local-to-timezone for today.
// Used anywhere the app needs a Date (not just a string) for comparisons.
export function nowInTz(tz) {
  const dateStr = todayInTz(tz)
  return new Date(dateStr + 'T00:00:00')
}

// Auto-detect the device's IANA timezone string.
// e.g. "America/New_York", "America/Los_Angeles", "Europe/London"
export function detectTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

// A curated list of IANA timezone names with human-readable labels,
// organized by region, for the manual selector in Profile.
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York',      label: 'Eastern Time (ET) — New York' },
  { value: 'America/Chicago',       label: 'Central Time (CT) — Chicago' },
  { value: 'America/Denver',        label: 'Mountain Time (MT) — Denver' },
  { value: 'America/Phoenix',       label: 'Mountain Time — Phoenix (no DST)' },
  { value: 'America/Los_Angeles',   label: 'Pacific Time (PT) — Los Angeles' },
  { value: 'America/Anchorage',     label: 'Alaska Time — Anchorage' },
  { value: 'Pacific/Honolulu',      label: 'Hawaii Time — Honolulu' },
  { value: 'America/Puerto_Rico',   label: 'Atlantic Time — Puerto Rico' },
  { value: 'America/Toronto',       label: 'Eastern Time — Toronto' },
  { value: 'America/Vancouver',     label: 'Pacific Time — Vancouver' },
  { value: 'America/Sao_Paulo',     label: 'Brasília Time — São Paulo' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time — Buenos Aires' },
  { value: 'America/Bogota',        label: 'Colombia Time — Bogotá' },
  { value: 'America/Lima',          label: 'Peru Time — Lima' },
  { value: 'America/Mexico_City',   label: 'Central Time — Mexico City' },
  { value: 'America/Jamaica',       label: 'Eastern Time — Jamaica' },
  { value: 'America/Barbados',      label: 'Atlantic Time — Barbados' },
  { value: 'America/Trinidad',      label: 'Atlantic Time — Trinidad' },
  { value: 'Europe/London',         label: 'Greenwich Mean Time — London' },
  { value: 'Europe/Paris',          label: 'Central European Time — Paris' },
  { value: 'Europe/Berlin',         label: 'Central European Time — Berlin' },
  { value: 'Europe/Amsterdam',      label: 'Central European Time — Amsterdam' },
  { value: 'Europe/Rome',           label: 'Central European Time — Rome' },
  { value: 'Europe/Madrid',         label: 'Central European Time — Madrid' },
  { value: 'Europe/Stockholm',      label: 'Central European Time — Stockholm' },
  { value: 'Europe/Athens',         label: 'Eastern European Time — Athens' },
  { value: 'Europe/Helsinki',       label: 'Eastern European Time — Helsinki' },
  { value: 'Europe/Lisbon',         label: 'Western European Time — Lisbon' },
  { value: 'Europe/Dublin',         label: 'Greenwich Mean Time — Dublin' },
  { value: 'Africa/Lagos',          label: 'West Africa Time — Lagos' },
  { value: 'Africa/Nairobi',        label: 'East Africa Time — Nairobi' },
  { value: 'Africa/Johannesburg',   label: 'South Africa Standard Time — Johannesburg' },
  { value: 'Africa/Accra',          label: 'Greenwich Mean Time — Accra' },
  { value: 'Asia/Dubai',            label: 'Gulf Standard Time — Dubai' },
  { value: 'Asia/Karachi',          label: 'Pakistan Standard Time — Karachi' },
  { value: 'Asia/Kolkata',          label: 'India Standard Time — Mumbai/Kolkata' },
  { value: 'Asia/Dhaka',            label: 'Bangladesh Standard Time — Dhaka' },
  { value: 'Asia/Bangkok',          label: 'Indochina Time — Bangkok' },
  { value: 'Asia/Singapore',        label: 'Singapore Time — Singapore' },
  { value: 'Asia/Hong_Kong',        label: 'Hong Kong Time — Hong Kong' },
  { value: 'Asia/Shanghai',         label: 'China Standard Time — Shanghai' },
  { value: 'Asia/Seoul',            label: 'Korea Standard Time — Seoul' },
  { value: 'Asia/Tokyo',            label: 'Japan Standard Time — Tokyo' },
  { value: 'Asia/Manila',           label: 'Philippine Time — Manila' },
  { value: 'Australia/Sydney',      label: 'Australian Eastern Time — Sydney' },
  { value: 'Australia/Melbourne',   label: 'Australian Eastern Time — Melbourne' },
  { value: 'Australia/Perth',       label: 'Australian Western Time — Perth' },
  { value: 'Pacific/Auckland',      label: 'New Zealand Time — Auckland' },
  { value: 'Pacific/Fiji',          label: 'Fiji Time — Suva' },
]
