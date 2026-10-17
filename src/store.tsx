import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Role = 'client' | 'admin'
export type Status = 'requested' | 'submitted' | 'under_review' | 'completed'
export type Person = { id: string; role: Role; name: string; org: string; email: string }
export type Item = {
  id: string
  clientId: string
  kind: 'document' | 'task'
  title: string
  detail: string
  status: Status
  updatedAt: string
}
export type FileRec = { id: string; itemId: string; clientId: string; name: string; size: number; mime: string; at: string }
export type Note = { id: string; clientId: string; itemId?: string; actor: string; body: string; internal: boolean; at: string }
type Db = { v: 1; users: Person[]; items: Item[]; files: FileRec[]; notes: Note[] }
export type Result = { ok: true; role?: Role; detail?: string } | { ok: false; error: string }

export type Api = {
  mode: 'demo' | 'supabase' | 'closed'
  ready: boolean
  notice: string | null
  user: Person | null
  items: Item[]
  files: FileRec[]
  notes: Note[]
  clients: Person[]
  login: (email: string, password: string) => Promise<Result>
  logout: () => Promise<void>
  recover: (email: string) => Promise<Result>
  createClient: (input: { name: string; org: string; email: string }) => Promise<Result>
  createItem: (input: { clientId: string; kind: Item['kind']; title: string; detail: string }) => Promise<Result>
  setStatus: (id: string, status: Status) => Promise<Result>
  addNote: (clientId: string, body: string, itemId?: string) => Promise<Result>
  addFile: (itemId: string, file: File, onProgress?: (percent: number) => void) => Promise<Result>
  updateProfile: (input: { name: string; org: string }) => Promise<Result>
  reset: () => Promise<Result>
}

export const STATUS: Status[] = ['requested', 'submitted', 'under_review', 'completed']
export const STATUS_LABEL: Record<Status, string> = {
  requested: 'Requested',
  submitted: 'Submitted',
  under_review: 'Under Review',
  completed: 'Completed',
}
export const CLIENT_PASSWORD = 'demo-client'
export const ADMIN_PASSWORD = 'demo-admin'

const DB_KEY = 'sba-demo-v1'
const SES_KEY = 'sba-session-v1'
const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

const nid = () => crypto.randomUUID()
const mailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const fail = (error: string): Result => ({ ok: false, error })
const ok = (detail?: string, role?: Role): Result => ({ ok: true, detail, role })

export function when(iso: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}
export function sizeLabel(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${Math.round(n / 1024)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}

export function checkFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!MIME[ext] || file.name.length > 140) return 'Use a PDF, JPEG, PNG, CSV, or XLSX file.'
  if (file.size <= 0) return 'The file is empty.'
  if (file.size > 10 * 1024 * 1024) return 'Files must be 10 MB or smaller.'
  if (file.type && file.type !== MIME[ext] && file.type !== 'application/octet-stream') {
    return 'The file type does not match its extension.'
  }
  return null
}

function publishable(key?: string) {
  const value = key?.trim() ?? ''
  if (!value || value.startsWith('sb_secret') || value.includes('service_role')) return ''
  const part = value.split('.')[1]
  if (!part) return value
  try {
    const role = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))?.role
    return role === 'service_role' ? '' : value
  } catch {
    return value
  }
}

export function resolveMode(): Api['mode'] {
  const mode = (import.meta.env.VITE_APP_MODE || 'demo').toLowerCase()
  const ready = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim() && publishable(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY))
  if (mode === 'production' || mode === 'supabase') return ready ? 'supabase' : 'closed'
  return 'demo'
}

function seed(): Db {
  const users: Person[] = [
    { id: 'usr_admin', role: 'admin', name: 'Demo administrator', org: 'Saurabh Bansal & Associates', email: 'demo.admin@example.invalid' },
    { id: 'usr_meera', role: 'client', name: 'Meera Khanna', org: 'Khanna Textiles Pvt. Ltd.', email: 'meera.khanna@example.invalid' },
    { id: 'usr_arjun', role: 'client', name: 'Arjun Sethi', org: 'Sethi Cold Storage', email: 'arjun.sethi@example.invalid' },
    { id: 'usr_leela', role: 'client', name: 'Leela Nair', org: 'Nair Design Studio', email: 'leela.nair@example.invalid' },
  ]
  const items: Item[] = [
    { id: 'wit_gst', clientId: 'usr_meera', kind: 'document', title: 'Outward supply summary', detail: 'A fictional request for a spreadsheet of outward supplies.', status: 'requested', updatedAt: '2026-10-08T10:00:00+05:30' },
    { id: 'wit_bank', clientId: 'usr_meera', kind: 'document', title: 'Bank statements, April to June', detail: 'Demonstration period only. No real statement is attached.', status: 'submitted', updatedAt: '2026-10-06T15:10:00+05:30' },
    { id: 'wit_salary', clientId: 'usr_meera', kind: 'document', title: 'Salary certificate workings', detail: 'Marked under review in the sample record.', status: 'under_review', updatedAt: '2026-10-04T11:20:00+05:30' },
    { id: 'wit_fs', clientId: 'usr_meera', kind: 'document', title: 'Financial statements pack', detail: 'Sample item already marked completed.', status: 'completed', updatedAt: '2026-09-18T16:00:00+05:30' },
    { id: 'wit_questions', clientId: 'usr_meera', kind: 'task', title: 'List open questions before the next discussion', detail: 'A task, not a file request.', status: 'requested', updatedAt: '2026-10-09T09:00:00+05:30' },
    { id: 'wit_tds', clientId: 'usr_arjun', kind: 'document', title: 'TDS challan copies', detail: 'Still requested in the sample.', status: 'requested', updatedAt: '2026-10-07T12:00:00+05:30' },
    { id: 'wit_assets', clientId: 'usr_arjun', kind: 'task', title: 'Fixed asset register review', detail: 'Sample review with no file.', status: 'under_review', updatedAt: '2026-10-02T13:40:00+05:30' },
    { id: 'wit_letter', clientId: 'usr_leela', kind: 'task', title: 'Engagement checklist acknowledged', detail: 'Nothing is waiting on this sample client.', status: 'completed', updatedAt: '2026-09-12T10:30:00+05:30' },
  ]
  const files: FileRec[] = [
    { id: 'fil_bank', itemId: 'wit_bank', clientId: 'usr_meera', name: 'bank-statements-sample.pdf', size: 240112, mime: 'application/pdf', at: '2026-10-06T15:10:00+05:30' },
    { id: 'fil_fs', itemId: 'wit_fs', clientId: 'usr_meera', name: 'statements-pack-sample.pdf', size: 880440, mime: 'application/pdf', at: '2026-09-16T12:05:00+05:30' },
  ]
  const notes: Note[] = [
    { id: 'nte_1', clientId: 'usr_meera', itemId: 'wit_gst', actor: 'Firm desk', body: 'Outward supply summary requested.', internal: false, at: '2026-10-08T10:00:00+05:30' },
    { id: 'nte_2', clientId: 'usr_meera', itemId: 'wit_bank', actor: 'Meera Khanna', body: 'A sample file name was recorded. The file itself was never stored.', internal: false, at: '2026-10-06T15:10:00+05:30' },
    { id: 'nte_3', clientId: 'usr_meera', itemId: 'wit_salary', actor: 'Firm desk', body: 'Status set to Under Review.', internal: false, at: '2026-10-04T11:20:00+05:30' },
    { id: 'nte_4', clientId: 'usr_meera', itemId: 'wit_salary', actor: 'Firm desk', body: 'Internal sample: check the salary workings against the payroll register before closing.', internal: true, at: '2026-10-04T11:25:00+05:30' },
    { id: 'nte_5', clientId: 'usr_arjun', itemId: 'wit_tds', actor: 'Firm desk', body: 'TDS challan copies requested.', internal: false, at: '2026-10-07T12:00:00+05:30' },
  ]
  return { v: 1, users, items, files, notes }
}

function readDb(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as Db
    if (parsed?.v !== 1 || !Array.isArray(parsed.users)) return seed()
    return parsed
  } catch {
    return seed()
  }
}

const empty = (mode: Api['mode']): Api => ({
  mode,
  ready: true,
  notice: null,
  user: null,
  items: [],
  files: [],
  notes: [],
  clients: [],
  login: async () => fail('Portal sign-in is not configured.'),
  logout: async () => {},
  recover: async () => fail('Portal sign-in is not configured.'),
  createClient: async () => fail('Portal sign-in is not configured.'),
  createItem: async () => fail('Portal sign-in is not configured.'),
  setStatus: async () => fail('Portal sign-in is not configured.'),
  addNote: async () => fail('Portal sign-in is not configured.'),
  addFile: async () => fail('Portal sign-in is not configured.'),
  updateProfile: async () => fail('Portal sign-in is not configured.'),
  reset: async () => fail('Portal sign-in is not configured.'),
})

function useDemo(on: boolean): Api {
  const [db, setDb] = useState<Db>(readDb)
  const [sid, setSid] = useState<string | null>(() => (on ? sessionStorage.getItem(SES_KEY) : null))

  useEffect(() => {
    if (!on) return
    const sync = (e: StorageEvent) => {
      if (e.key === DB_KEY && e.newValue) {
        try { setDb(JSON.parse(e.newValue) as Db) } catch { /* ignore malformed cache */ }
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [on])

  useEffect(() => {
    if (!on || !sid) return
    if (!db.users.some((u) => u.id === sid)) {
      sessionStorage.removeItem(SES_KEY)
      setSid(null)
    }
  }, [on, db, sid])

  const user = db.users.find((u) => u.id === sid) ?? null
  const save = (next: Db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(next))
    setDb(next)
  }
  const sign = (id: string) => {
    sessionStorage.setItem(SES_KEY, id)
    setSid(id)
  }

  return {
    mode: 'demo',
    ready: true,
    notice: null,
    user: on ? user : null,
    items: !user ? [] : user.role === 'admin' ? db.items : db.items.filter((i) => i.clientId === user.id),
    files: !user ? [] : user.role === 'admin' ? db.files : db.files.filter((f) => f.clientId === user.id),
    notes: !user ? [] : user.role === 'admin' ? db.notes : db.notes.filter((n) => n.clientId === user.id && !n.internal),
    clients: user?.role === 'admin' ? db.users.filter((u) => u.role === 'client') : [],
    async login(email, password) {
      const found = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      const expected = found?.role === 'admin' ? ADMIN_PASSWORD : CLIENT_PASSWORD
      if (!found || password !== expected) return fail('Those details were not accepted.')
      sign(found.id)
      return ok(undefined, found.role)
    },
    async logout() {
      sessionStorage.removeItem(SES_KEY)
      setSid(null)
    },
    async recover(email) {
      if (!mailOk(email)) return fail('Enter the email address used for the preview.')
      return ok('This demonstration does not send email, and it does not say whether an address is on file.')
    },
    async createClient(input) {
      if (user?.role !== 'admin') return fail('Only the firm desk can add a client.')
      const name = input.name.trim()
      const org = input.org.trim()
      const email = input.email.trim().toLowerCase()
      if (name.length < 2 || name.length > 80 || org.length < 2 || org.length > 120 || !mailOk(email)) {
        return fail('Check the name, organisation, and email.')
      }
      if (db.users.some((u) => u.email === email)) return fail('That email is already in the demonstration.')
      const person: Person = { id: nid(), role: 'client', name, org, email }
      save({ ...db, users: [...db.users, person] })
      return ok(`Created. Sign in with ${email} and the shared preview password ${CLIENT_PASSWORD}. No separate password is stored.`)
    },
    async createItem(input) {
      if (user?.role !== 'admin') return fail('Only the firm desk can add a request.')
      const title = input.title.trim()
      const detail = input.detail.trim()
      if (!db.users.some((u) => u.id === input.clientId && u.role === 'client')) return fail('Choose a client.')
      if (title.length < 3 || title.length > 160 || detail.length > 2000) return fail('Check the title and the note.')
      const item: Item = {
        id: nid(), clientId: input.clientId, kind: input.kind, title, detail, status: 'requested', updatedAt: new Date().toISOString(),
      }
      const note: Note = {
        id: nid(), clientId: input.clientId, itemId: item.id, actor: user.name, body: `${title} requested.`, internal: false, at: item.updatedAt,
      }
      save({ ...db, items: [item, ...db.items], notes: [note, ...db.notes] })
      return ok('Request added.')
    },
    async setStatus(id, status) {
      if (user?.role !== 'admin') return fail('Only the firm desk can change a status.')
      if (!STATUS.includes(status)) return fail('That status is not available.')
      const current = db.items.find((i) => i.id === id)
      if (!current) return fail('That item is not in the record.')
      const updatedAt = new Date().toISOString()
      save({
        ...db,
        items: db.items.map((i) => (i.id === id ? { ...i, status, updatedAt } : i)),
        notes: [{ id: nid(), clientId: current.clientId, itemId: id, actor: user.name, body: `Status set to ${STATUS_LABEL[status]}.`, internal: false, at: updatedAt }, ...db.notes],
      })
      return ok('Status saved.')
    },
    async addNote(clientId, body, itemId) {
      if (user?.role !== 'admin') return fail('Only the firm desk can add an internal note.')
      const text = body.trim()
      if (text.length < 3 || text.length > 1000) return fail('Write a note between 3 and 1,000 characters.')
      if (!db.users.some((u) => u.id === clientId)) return fail('That client is not in the record.')
      save({
        ...db,
        notes: [{ id: nid(), clientId, itemId, actor: user.name, body: text, internal: true, at: new Date().toISOString() }, ...db.notes],
      })
      return ok('Internal note saved. The client does not see it.')
    },
    async addFile(itemId, file, onProgress) {
      if (user?.role !== 'client') return fail('Sign in as the client to record a file.')
      const problem = checkFile(file)
      if (problem) return fail(problem)
      const item = db.items.find((i) => i.id === itemId && i.clientId === user.id)
      if (!item || item.kind !== 'document') return fail('This item does not take a file.')
      if (item.status !== 'requested' && item.status !== 'submitted') return fail('The firm is not asking for a file on this item.')
      onProgress?.(35)
      await new Promise((resolve) => setTimeout(resolve, 120))
      onProgress?.(75)
      await new Promise((resolve) => setTimeout(resolve, 120))
      const at = new Date().toISOString()
      const rec: FileRec = { id: nid(), itemId, clientId: user.id, name: file.name, size: file.size, mime: file.type || MIME[file.name.split('.').pop()!.toLowerCase()], at }
      save({
        ...db,
        files: [rec, ...db.files],
        items: db.items.map((i) => (i.id === itemId && i.status === 'requested' ? { ...i, status: 'submitted', updatedAt: at } : i)),
        notes: [{ id: nid(), clientId: user.id, itemId, actor: user.name, body: `${file.name} was checked in this browser and discarded. It was not stored.`, internal: false, at }, ...db.notes],
      })
      onProgress?.(100)
      return ok('Demonstration only. The file was not sent to Supabase or any server.')
    },
    async updateProfile(input) {
      if (!user || user.role !== 'client') return fail('Sign in as the client to edit the profile.')
      const name = input.name.trim()
      const org = input.org.trim()
      if (name.length < 2 || name.length > 80 || org.length > 120) return fail('Check the name and organisation.')
      save({ ...db, users: db.users.map((u) => (u.id === user.id ? { ...u, name, org } : u)) })
      return ok('Profile updated in this browser.')
    },
    async reset() {
      localStorage.setItem(DB_KEY, JSON.stringify(seed()))
      setDb(seed())
      return ok('Demonstration data restored.')
    },
  }
}

let client: SupabaseClient | null = null

async function supabase() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = publishable(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  if (!url || !key) return null
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  }
  return client
}

async function uploadPrivate(sb: SupabaseClient, path: string, file: File, onProgress?: (percent: number) => void): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '')
  const key = publishable(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  const session = await sb.auth.getSession()
  const token = session.data.session?.access_token
  if (!url || !key || !token) return { ok: false, error: 'Upload is not configured.' }
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${url}/storage/v1/object/client-documents/${encoded}`)
    xhr.setRequestHeader('apikey', key)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300 ? { ok: true } : { ok: false, error: 'The file was not accepted.' })
    xhr.onerror = () => resolve({ ok: false, error: 'The file was not accepted.' })
    xhr.send(file)
  })
}

type Row = Record<string, unknown>

function mapPerson(row: Row): Person {
  return { id: String(row.id), role: row.role === 'admin' ? 'admin' : 'client', name: String(row.full_name ?? ''), org: String(row.organisation ?? ''), email: String(row.email ?? '') }
}
function mapItem(row: Row): Item {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    kind: row.kind === 'task' ? 'task' : 'document',
    title: String(row.title),
    detail: String(row.detail ?? ''),
    status: STATUS.includes(row.status as Status) ? (row.status as Status) : 'requested',
    updatedAt: String(row.updated_at),
  }
}
function mapFile(row: Row): FileRec {
  return { id: String(row.id), itemId: String(row.work_item_id), clientId: String(row.client_id), name: String(row.file_name), size: Number(row.size_bytes), mime: String(row.mime), at: String(row.created_at) }
}
function mapNote(row: Row): Note {
  return { id: String(row.id), clientId: String(row.client_id), itemId: row.work_item_id ? String(row.work_item_id) : undefined, actor: 'Office', body: String(row.body), internal: Boolean(row.internal), at: String(row.created_at) }
}

function useRemote(on: boolean): Api {
  const [user, setUser] = useState<Person | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [files, setFiles] = useState<FileRec[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [clients, setClients] = useState<Person[]>([])
  const [ready, setReady] = useState(!on)
  const [notice, setNotice] = useState<string | null>(null)

  async function pull(who: Person) {
    const sb = await supabase()
    if (!sb) throw new Error('closed')
    const [itemRes, fileRes, noteRes, clientRes] = await Promise.all([
      sb.from('work_items').select('id, client_id, kind, title, detail, status, updated_at').order('updated_at', { ascending: false }),
      sb.from('documents').select('id, work_item_id, client_id, file_name, size_bytes, mime, created_at').order('created_at', { ascending: false }),
      sb.from('activities').select('id, client_id, work_item_id, body, internal, created_at').order('created_at', { ascending: false }),
      who.role === 'admin'
        ? sb.from('profiles').select('id, role, full_name, organisation, email').eq('role', 'client')
        : Promise.resolve({ data: [], error: null }),
    ])
    if (itemRes.error || fileRes.error || noteRes.error || clientRes.error) throw new Error('load')
    setItems(((itemRes.data ?? []) as Row[]).map(mapItem))
    setFiles(((fileRes.data ?? []) as Row[]).map(mapFile))
    setNotes(((noteRes.data ?? []) as Row[]).map(mapNote))
    setClients(((clientRes.data ?? []) as Row[]).map(mapPerson))
  }

  useEffect(() => {
    if (!on) return
    let cancel = false
    ;(async () => {
      try {
        const sb = await supabase()
        if (!sb) throw new Error('closed')
        const { data } = await sb.auth.getUser()
        if (cancel || !data.user) return
        const { data: profile, error } = await sb.from('profiles').select('id, role, full_name, organisation, email').eq('id', data.user.id).single()
        if (error || !profile || cancel) throw new Error('profile')
        const person = mapPerson(profile as Row)
        setUser(person)
        await pull(person)
      } catch {
        if (!cancel) setNotice('The portal record could not be loaded.')
      } finally {
        if (!cancel) setReady(true)
      }
    })()
    return () => { cancel = true }
  }, [on])

  return {
    mode: 'supabase',
    ready: on ? ready : true,
    notice: on ? notice : null,
    user: on ? user : null,
    items,
    files,
    notes,
    clients,
    async login(email, password) {
      const sb = await supabase()
      if (!sb) return fail('Sign-in is not configured.')
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
      if (error || !data.user) return fail('Those details were not accepted.')
      const { data: profile, error: profileError } = await sb.from('profiles').select('id, role, full_name, organisation, email').eq('id', data.user.id).single()
      if (profileError || !profile) {
        await sb.auth.signOut()
        return fail('No profile is available for this account.')
      }
      const person = mapPerson(profile as Row)
      setUser(person)
      try { await pull(person) } catch { setNotice('The portal record could not be loaded.') }
      return ok(undefined, person.role)
    },
    async logout() {
      const sb = await supabase()
      await sb?.auth.signOut()
      setUser(null)
      setItems([])
      setFiles([])
      setNotes([])
      setClients([])
    },
    async recover(email) {
      if (!mailOk(email)) return fail('Enter an email address.')
      const sb = await supabase()
      if (!sb) return fail('Password recovery is not configured.')
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/login` })
      if (error) return fail('The recovery request could not be completed.')
      return ok('If the address can receive mail, the authentication service will send a reset link. This screen does not confirm that the address is on file.')
    },
    async createClient(input) {
      if (user?.role !== 'admin') return fail('Only the firm desk can add a client.')
      const sb = await supabase()
      if (!sb) return fail('Client creation is not configured.')
      const { error } = await sb.functions.invoke('admin-create-client', {
        body: { fullName: input.name.trim(), organisation: input.org.trim(), email: input.email.trim() },
      })
      if (error) return fail('The account could not be created. The invitation function must be deployed, and the caller must be an administrator in the database.')
      await pull(user)
      return ok('Invitation requested. The new account is a client. The role is set in the database, not by this browser.')
    },
    async createItem(input) {
      if (user?.role !== 'admin') return fail('Only the firm desk can add a request.')
      const title = input.title.trim()
      const detail = input.detail.trim()
      if (title.length < 3 || title.length > 160 || detail.length > 2000) return fail('Check the title and the note.')
      const sb = await supabase()
      const { error } = await sb!.from('work_items').insert({ client_id: input.clientId, kind: input.kind, title, detail, status: 'requested' })
      if (error) return fail('The request could not be saved.')
      await pull(user)
      return ok('Request added.')
    },
    async setStatus(id, status) {
      if (user?.role !== 'admin') return fail('Only the firm desk can change a status.')
      const sb = await supabase()
      const { error } = await sb!.from('work_items').update({ status }).eq('id', id)
      if (error) return fail('The status could not be saved.')
      await pull(user)
      return ok('Status saved.')
    },
    async addNote(clientId, body, itemId) {
      if (user?.role !== 'admin') return fail('Only the firm desk can add an internal note.')
      const text = body.trim()
      if (text.length < 3 || text.length > 1000) return fail('Write a note between 3 and 1,000 characters.')
      const sb = await supabase()
      const { error } = await sb!.from('activities').insert({ client_id: clientId, work_item_id: itemId ?? null, body: text, internal: true })
      if (error) return fail('The note could not be saved.')
      await pull(user)
      return ok('Internal note saved.')
    },
    async addFile(itemId, file, onProgress) {
      if (!user || user.role !== 'client') return fail('Sign in as the client to record a file.')
      const problem = checkFile(file)
      if (problem) return fail(problem)
      const item = items.find((i) => i.id === itemId && i.clientId === user.id)
      if (!item || item.kind !== 'document' || (item.status !== 'requested' && item.status !== 'submitted')) {
        return fail('This item does not take a file.')
      }
      const sb = await supabase()
      if (!sb) return fail('Upload is not configured.')
      const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 80)
      const path = `${user.id}/${itemId}/${crypto.randomUUID()}-${safe}`
      const uploaded = await uploadPrivate(sb, path, file, onProgress)
      if (!uploaded.ok) return fail(uploaded.error)
      const inserted = await sb.from('documents').insert({
        work_item_id: itemId,
        client_id: user.id,
        file_name: file.name.slice(0, 140),
        mime: file.type || MIME[file.name.split('.').pop()!.toLowerCase()],
        size_bytes: file.size,
        storage_path: path,
      })
      if (inserted.error) {
        await sb.storage.from('client-documents').remove([path])
        return fail('The file record could not be saved.')
      }
      await pull(user)
      return ok('Sent to the configured storage bucket. This screen does not publish a link.')
    },
    async updateProfile(input) {
      if (!user) return fail('Sign in to edit the profile.')
      const name = input.name.trim()
      const org = input.org.trim()
      if (name.length < 2 || name.length > 80 || org.length > 120) return fail('Check the name and organisation.')
      const sb = await supabase()
      const { error } = await sb!.from('profiles').update({ full_name: name, organisation: org }).eq('id', user.id)
      if (error) return fail('The profile could not be saved.')
      setUser({ ...user, name, org })
      return ok('Profile updated.')
    },
    async reset() {
      return fail('Reset applies only to demonstration data in this browser.')
    },
  }
}

const Ctx = createContext<Api>(empty('demo'))

export function PortalProvider({ children }: { children: ReactNode }) {
  const mode = resolveMode()
  const demo = useDemo(mode === 'demo')
  const remote = useRemote(mode === 'supabase')
  const value = mode === 'demo' ? demo : mode === 'supabase' ? remote : empty('closed')
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePortal() {
  return useContext(Ctx)
}
