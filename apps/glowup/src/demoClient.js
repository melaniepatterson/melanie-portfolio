// A minimal mock of the supabase-js client, backed by the static data in
// demoData.js. Swapped in for the real client (see supabase.js) whenever
// VITE_GLOWUP_DEMO=true, so the whole app becomes read-only without
// touching any of its ~50 real .from(...) call sites.
//
// Supports exactly the query-builder surface this codebase actually uses
// (confirmed by grepping every .from() call site): .select, .eq, .neq,
// .in, .or (PostgREST "col.eq.val,..." syntax), .order, .limit, .single,
// .maybeSingle, .match, and direct awaiting of the builder itself. An
// unrecognized filter is simply ignored rather than thrown — a query
// degrades to returning more rows than expected instead of crashing the
// demo outright.
import { DEMO_TABLES, DEMO_USER_ID } from './demoData'

export const DEMO_SESSION = {
  access_token: 'demo', refresh_token: 'demo',
  user: { id: DEMO_USER_ID, email: 'demo@glowup.melanie.studio' },
}

// Plain DOM event rather than a React context — keeps this file
// framework-agnostic and lets any component (or App.jsx) listen without
// prop-drilling a "show the demo toast" callback through the whole tree.
function announceDemoWrite() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('glowup-demo-write'))
  }
}

function applyOr(rows, filterString) {
  const clauses = filterString.split(',').map(clause => {
    const [col, , ...rest] = clause.split('.')
    let val = rest.join('.')
    if (val === 'true') val = true
    else if (val === 'false') val = false
    return { col, val }
  })
  return rows.filter(row => clauses.some(c => row[c.col] === c.val))
}

function applyFilters(rows, filters) {
  return rows.filter(row => filters.every(f => {
    if (f.op === 'eq') return row[f.col] === f.val
    if (f.op === 'neq') return row[f.col] !== f.val
    if (f.op === 'in') return (f.val || []).includes(row[f.col])
    return true
  }))
}

class DemoQueryBuilder {
  constructor(table) {
    this.table = table
    this.filters = []
    this.orFilterString = null
    this.orderCol = null
    this.orderAsc = true
    this.limitN = null
  }
  select() { return this }
  eq(col, val) { this.filters.push({ col, op: 'eq', val }); return this }
  neq(col, val) { this.filters.push({ col, op: 'neq', val }); return this }
  in(col, val) { this.filters.push({ col, op: 'in', val }); return this }
  match(obj) {
    Object.entries(obj).forEach(([col, val]) => this.filters.push({ col, op: 'eq', val }))
    return this
  }
  or(filterString) { this.orFilterString = filterString; return this }
  order(col, opts) { this.orderCol = col; this.orderAsc = opts?.ascending !== false; return this }
  limit(n) { this.limitN = n; return this }

  _rows() {
    let rows = DEMO_TABLES[this.table] || []
    if (this.orFilterString) rows = applyOr(rows, this.orFilterString)
    if (this.filters.length) rows = applyFilters(rows, this.filters)
    if (this.orderCol) {
      rows = [...rows].sort((a, b) => {
        const av = a[this.orderCol], bv = b[this.orderCol]
        if (av === bv) return 0
        return (av < bv ? -1 : 1) * (this.orderAsc ? 1 : -1)
      })
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN)
    return rows
  }
  single() {
    const rows = this._rows()
    return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { message: 'No rows found' } })
  }
  maybeSingle() {
    const rows = this._rows()
    return Promise.resolve({ data: rows[0] ?? null, error: null })
  }
  // supabase-js query builders are thenable — `await supabase.from(x).select()`
  // resolves without an explicit .single()/.maybeSingle() call.
  then(onFulfilled, onRejected) {
    return Promise.resolve({ data: this._rows(), error: null }).then(onFulfilled, onRejected)
  }
}

// Real, if throwaway, mutations against DEMO_TABLES — so a visitor's
// actions actually show up as they click around (add a program, log a
// treatment, edit a product) instead of silently vanishing. DEMO_TABLES is
// rebuilt fresh from the literal source in demoData.js on every page load,
// so there's nothing to reset on the way out: a reload (or a different
// tab, or a different device entirely) just starts over from the same
// seed. Nothing here ever leaves this one JS module instance.
let genIdCounter = 0
const genId = (table) => `demo-${table}-${Date.now()}-${genIdCounter++}`

class DemoWriteBuilder {
  constructor(table, op, payload) {
    this.table = table
    this.op = op // 'insert' | 'update' | 'upsert' | 'delete'
    this.payload = payload
    this.filters = []
    this.wantSingle = false
  }
  eq(col, val) { this.filters.push({ col, op: 'eq', val }); return this }
  neq(col, val) { this.filters.push({ col, op: 'neq', val }); return this }
  in(col, val) { this.filters.push({ col, op: 'in', val }); return this }
  match(obj) {
    Object.entries(obj).forEach(([col, val]) => this.filters.push({ col, op: 'eq', val }))
    return this
  }
  select() { return this }
  single() { this.wantSingle = true; return this._resolve() }
  maybeSingle() { return this._resolve() }
  _resolve() {
    announceDemoWrite()
    const rows = DEMO_TABLES[this.table] || (DEMO_TABLES[this.table] = [])
    let result

    if (this.op === 'insert') {
      const incoming = Array.isArray(this.payload) ? this.payload : (this.payload ? [this.payload] : [])
      result = incoming.map(row => {
        const saved = { id: genId(this.table), ...row }
        rows.push(saved)
        return saved
      })
    } else if (this.op === 'upsert') {
      const incoming = Array.isArray(this.payload) ? this.payload : (this.payload ? [this.payload] : [])
      result = incoming.map(row => {
        const existing = row.id != null ? rows.find(r => r.id === row.id) : undefined
        if (existing) { Object.assign(existing, row); return existing }
        const saved = { id: row.id ?? genId(this.table), ...row }
        rows.push(saved)
        return saved
      })
    } else if (this.op === 'update') {
      const matched = this.filters.length ? applyFilters(rows, this.filters) : rows
      matched.forEach(row => Object.assign(row, this.payload))
      result = matched
    } else if (this.op === 'delete') {
      const matched = applyFilters(rows, this.filters)
      DEMO_TABLES[this.table] = rows.filter(r => !matched.includes(r))
      result = matched
    } else {
      result = []
    }

    return Promise.resolve({ data: this.wantSingle ? (result[0] ?? null) : result, error: null })
  }
  then(onFulfilled, onRejected) {
    return this._resolve().then(onFulfilled, onRejected)
  }
}

function from(table) {
  return {
    select: () => new DemoQueryBuilder(table),
    insert: (payload) => new DemoWriteBuilder(table, 'insert', payload),
    update: (payload) => new DemoWriteBuilder(table, 'update', payload),
    upsert: (payload) => new DemoWriteBuilder(table, 'upsert', payload),
    delete: () => new DemoWriteBuilder(table, 'delete', null),
  }
}

export const demoClient = {
  from,
  auth: {
    getSession: () => Promise.resolve({ data: { session: DEMO_SESSION } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithOtp: () => { announceDemoWrite(); return Promise.resolve({ data: null, error: null }) },
  },
  storage: {
    from: () => ({
      upload: () => { announceDemoWrite(); return Promise.resolve({ data: { path: 'demo/placeholder.png' }, error: null }) },
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: () => { announceDemoWrite(); return Promise.resolve({ data: null, error: null }) },
    }),
  },
  rpc: () => { announceDemoWrite(); return Promise.resolve({ data: null, error: null }) },
}
