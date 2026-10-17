import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ADMIN_PASSWORD, CLIENT_PASSWORD, STATUS, STATUS_LABEL, sizeLabel, usePortal, when, type Status } from './store'

export function Gate({ role, children }: { role: 'client' | 'admin'; children: ReactNode }) {
  const api = usePortal()
  if (!api.ready) return <p className="wait">Loading the record…</p>
  if (api.mode === 'closed') return <Closed />
  if (!api.user) return <Navigate to="/login" replace />
  if (api.user.role !== role) return <Navigate to={api.user.role === 'admin' ? '/admin' : '/portal'} replace />
  return <Frame>{children}</Frame>
}

function Frame({ children }: { children: ReactNode }) {
  const api = usePortal()
  const admin = api.user?.role === 'admin'
  return (
    <div className="portal">
      <p className="demo-flag">{api.mode === 'demo' ? 'Demonstration · this browser only · not a secure filing system' : 'Signed-in portal · access still depends on database policies'}</p>
      <div className="portal-bar">
        <Link className="brand" to="/">
          <span className="mark" aria-hidden="true">SB</span>
          <span><strong>Saurabh Bansal</strong><em>{admin ? 'Firm desk' : 'Client portal'}</em></span>
        </Link>
        <button className="text-btn" type="button" onClick={() => api.logout()}>Sign out</button>
      </div>
      {api.notice ? <p className="form-error wrap" role="alert">{api.notice}</p> : null}
      <div className="shell">
        <nav className="side" aria-label="Portal">
          {admin ? (
            <>
              <Link to="/admin">Overview</Link>
              <Link to="/admin?tab=clients">Clients</Link>
              <Link to="/admin?tab=activity">Activity</Link>
            </>
          ) : (
            <>
              <Link to="/portal">Overview</Link>
              <Link to="/portal?tab=requests">Requests</Link>
              <Link to="/portal?tab=documents">Documents</Link>
              <Link to="/portal?tab=activity">Activity</Link>
              <Link to="/portal?tab=account">Account</Link>
            </>
          )}
        </nav>
        <div className="portal-main">{children}</div>
      </div>
    </div>
  )
}

function Closed() {
  return (
    <article className="wrap page">
      <h1>Portal sign-in is unavailable.</h1>
      <p>Production authentication is not configured, so the demonstration record is not used as a fallback.</p>
      <p><Link to="/">Return to the site</Link></p>
    </article>
  )
}

export function Login() {
  const api = usePortal()
  const [error, setError] = useState('')
  if (!api.ready) return <p className="wait">Loading…</p>
  if (api.mode === 'closed') return <Closed />
  if (api.user) return <Navigate to={api.user.role === 'admin' ? '/admin' : '/portal'} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '')
    const password = String(data.get('password') ?? '')
    if (!email.trim() || !password) {
      setError('Enter the email and password.')
      return
    }
    const result = await api.login(email, password)
    setError(result.ok ? '' : result.error)
  }

  return (
    <section className="auth">
      <div className="auth-copy">
        <p className="eyebrow light">Client portal</p>
        <h1>Sign in to the preview.</h1>
        <p>Two tabs in this browser can stay signed in as different people. The shared record updates in both.</p>
        {api.mode === 'demo' ? (
          <dl className="creds">
            <div><dt>Client</dt><dd>meera.khanna@example.invalid<br />{CLIENT_PASSWORD}</dd></div>
            <div><dt>Firm desk</dt><dd>demo.admin@example.invalid<br />{ADMIN_PASSWORD}</dd></div>
          </dl>
        ) : null}
        <p className="fine light">These are preview passwords published on this screen. They are not a production control.</p>
      </div>
      <form className="form auth-form" onSubmit={submit} noValidate>
        <h2>Account</h2>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" />
        </div>
        <button className="btn btn-navy" type="submit">Sign in</button>
        <p><Link to="/recover">Forgot password</Link></p>
        {api.mode === 'demo' ? <Reset /> : null}
      </form>
    </section>
  )
}

export function Recover() {
  const api = usePortal()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  if (api.mode === 'closed') return <Closed />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') ?? '')
    const result = await api.recover(email)
    setError(result.ok ? '' : result.error)
    setMessage(result.ok ? result.detail ?? '' : '')
  }

  return (
    <section className="auth">
      <div className="auth-copy">
        <p className="eyebrow light">Password recovery</p>
        <h1>Request a reset.</h1>
        <p>The preview does not reveal whether an address exists.</p>
      </div>
      <form className="form auth-form" onSubmit={submit} noValidate>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {message ? <p className="form-ok" role="status">{message}</p> : null}
        <div className="field">
          <label htmlFor="recover-email">Email</label>
          <input id="recover-email" name="email" type="email" autoComplete="email" />
        </div>
        <button className="btn btn-navy" type="submit">Continue</button>
        <p><Link to="/login">Back to sign in</Link></p>
      </form>
    </section>
  )
}

function Reset() {
  const api = usePortal()
  const [ask, setAsk] = useState(false)
  const [note, setNote] = useState('')
  if (!ask) return <button className="text-btn" type="button" onClick={() => setAsk(true)}>Reset demonstration data</button>
  return (
    <div className="reset">
      <button className="btn btn-line" type="button" onClick={async () => { const result = await api.reset(); setNote(result.ok ? result.detail ?? '' : result.error); setAsk(false) }}>Confirm reset</button>
      <button className="text-btn" type="button" onClick={() => setAsk(false)}>Cancel</button>
      {note ? <p role="status">{note}</p> : null}
    </div>
  )
}

function Pill({ status }: { status: Status }) {
  return <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>
}

export function ClientHome() {
  const api = usePortal()
  const [params] = useSearchParams()
  const tab = params.get('tab') ?? 'overview'
  const todo = api.items.filter((item) => item.status === 'requested')
  const [banner, setBanner] = useState('')

  return (
    <>
      <p className="eyebrow">Hello, {api.user?.name}</p>
      <h1>{tab === 'overview' ? 'Where the work stands' : tab === 'requests' ? 'Requests' : tab === 'documents' ? 'Documents received' : tab === 'activity' ? 'Activity' : 'Account'}</h1>
      {banner ? <p className="form-ok" role="status">{banner}</p> : null}
      {tab === 'overview' ? (
        <div className="trio">
          <section>
            <h2>What you need to do</h2>
            {todo.length === 0 ? <p className="empty">Nothing is waiting on you.</p> : todo.map((item) => (
              <article key={item.id} className="block">
                <h3>{item.title}</h3>
                <p>{item.kind === 'document' ? 'A file is requested.' : 'A reply is requested. No file is required.'}</p>
                <Pill status={item.status} />
              </article>
            ))}
          </section>
          <section>
            <h2>What the firm has received</h2>
            {api.files.length === 0 ? <p className="empty">No file has been recorded.</p> : api.files.map((file) => (
              <article key={file.id} className="block">
                <h3>{file.name}</h3>
                <p>{sizeLabel(file.size)} · {when(file.at)}</p>
              </article>
            ))}
          </section>
          <section>
            <h2>Status of the work</h2>
            {api.items.length === 0 ? <p className="empty">No work is on the record.</p> : api.items.map((item) => (
              <article key={item.id} className="block">
                <h3>{item.title}</h3>
                <Pill status={item.status} />
              </article>
            ))}
          </section>
        </div>
      ) : null}
      {tab === 'requests' ? (
        <div className="stack">
          {api.items.length === 0 ? <p className="empty">No requests yet.</p> : api.items.map((item) => (
            <article key={item.id} className="block">
              <div className="block-head"><h2>{item.title}</h2><Pill status={item.status} /></div>
              <p>{item.detail}</p>
              <p className="fine">{item.kind === 'document' ? 'Document request' : 'Task'} · updated {when(item.updatedAt)}</p>
              {item.kind === 'document' && (item.status === 'requested' || item.status === 'submitted') ? (
                <Upload itemId={item.id} onDone={setBanner} />
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {tab === 'documents' ? (
        api.files.length === 0 ? <p className="empty">No document has been recorded.</p> : (
          <ul className="lines">
            {api.files.map((file) => {
              const item = api.items.find((entry) => entry.id === file.itemId)
              return <li key={file.id}><strong>{file.name}</strong><span>{item?.title ?? 'Request'}</span><span>{sizeLabel(file.size)} · {when(file.at)}</span></li>
            })}
          </ul>
        )
      ) : null}
      {tab === 'activity' ? (
        api.notes.length === 0 ? <p className="empty">No activity yet.</p> : (
          <ol className="timeline">
            {api.notes.map((note) => <li key={note.id}><time dateTime={note.at}>{when(note.at)}</time><p>{note.body}</p><span>{note.actor}</span></li>)}
          </ol>
        )
      ) : null}
      {tab === 'account' ? <Account onDone={setBanner} /> : null}
    </>
  )
}

function Upload({ itemId, onDone }: { itemId: string; onDone: (message: string) => void }) {
  const api = usePortal()
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = event.currentTarget.elements.namedItem('file') as HTMLInputElement
    const file = input.files?.[0]
    if (!file) { setError('Choose a file.'); return }
    const result = await api.addFile(itemId, file)
    if (!result.ok) { setError(result.error); return }
    setError('')
    onDone(result.detail ?? 'Recorded.')
    event.currentTarget.reset()
  }
  return (
    <form className="upload" onSubmit={submit}>
      <label htmlFor={`file-${itemId}`}>File, PDF JPEG PNG CSV or XLSX, up to 10 MB
        <input id={`file-${itemId}`} name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,application/pdf,image/jpeg,image/png,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
      </label>
      <button className="btn btn-navy" type="submit">Record file</button>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <p className="fine">{api.mode === 'demo' ? 'The file is checked, then discarded. Only the name, type, and size stay in this browser.' : 'The file goes to a private bucket. It is not given a public link.'}</p>
    </form>
  )
}

function Account({ onDone }: { onDone: (message: string) => void }) {
  const api = usePortal()
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = await api.updateProfile({ name: String(data.get('name') ?? ''), org: String(data.get('org') ?? '') })
    setError(result.ok ? '' : result.error)
    if (result.ok) onDone(result.detail ?? 'Saved.')
  }
  return (
    <form className="form narrow" onSubmit={submit}>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="field">
        <label htmlFor="profile-name">Name</label>
        <input id="profile-name" name="name" defaultValue={api.user?.name} />
      </div>
      <div className="field">
        <label htmlFor="profile-org">Organisation</label>
        <input id="profile-org" name="org" defaultValue={api.user?.org} />
      </div>
      <div className="field">
        <label htmlFor="profile-email">Email</label>
        <input id="profile-email" value={api.user?.email ?? ''} readOnly />
      </div>
      <button className="btn btn-navy" type="submit">Save profile</button>
      <p className="fine">Password changes are not available in the demonstration. Use password recovery only after production authentication is connected.</p>
    </form>
  )
}

export function AdminHome() {
  const api = usePortal()
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = id ? 'detail' : params.get('tab') ?? 'overview'
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [banner, setBanner] = useState('')
  const client = api.clients.find((person) => person.id === id)
  const pending = api.items.filter((item) => item.status !== 'completed')
  const visible = api.items.filter((item) => {
    const person = api.clients.find((entry) => entry.id === item.clientId)
    const hay = `${item.title} ${person?.name ?? ''} ${person?.org ?? ''}`.toLowerCase()
    return (filter === 'all' || item.status === filter) && hay.includes(query.trim().toLowerCase())
  })

  async function changeStatus(itemId: string, status: Status) {
    const result = await api.setStatus(itemId, status)
    setBanner(result.ok ? result.detail ?? 'Saved.' : result.error)
  }

  return (
    <>
      <p className="eyebrow">Firm desk</p>
      <h1>{id ? (client?.name ?? 'Client') : tab === 'clients' ? 'Clients' : tab === 'activity' ? 'Activity' : 'Overview'}</h1>
      {banner ? <p className="form-ok" role="status">{banner}</p> : null}
      {tab === 'overview' ? (
        <>
          <div className="stats">
            <p><strong>{api.clients.length}</strong> clients</p>
            <p><strong>{pending.length}</strong> open items</p>
            <p><strong>{api.files.length}</strong> files recorded</p>
          </div>
          <div className="filters">
            <label htmlFor="find">Search<input id="find" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <label htmlFor="state">Status
              <select id="state" value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">All</option>
                {STATUS.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
              </select>
            </label>
          </div>
          {visible.length === 0 ? <p className="empty">No requests match this filter.</p> : (
            <ul className="lines">
              {visible.map((item) => {
                const person = api.clients.find((entry) => entry.id === item.clientId)
                return (
                  <li key={item.id}>
                    <Link to={`/admin/clients/${item.clientId}`}><strong>{item.title}</strong><span>{person?.name}</span></Link>
                    <label className="sr" htmlFor={`status-${item.id}`}>Status for {item.title}</label>
                    <select id={`status-${item.id}`} value={item.status} onChange={(event) => changeStatus(item.id, event.target.value as Status)}>
                      {STATUS.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                    </select>
                  </li>
                )
              })}
            </ul>
          )}
          <h2>Recent activity</h2>
          <Activity notes={api.notes.slice(0, 5)} />
          {api.mode === 'demo' ? <Reset /> : null}
        </>
      ) : null}
      {tab === 'clients' ? (
        <>
          <ClientForm onDone={setBanner} />
          <label htmlFor="client-find">Search clients<input id="client-find" value={query} onChange={(event) => { setQuery(event.target.value); setParams({ tab: 'clients' }) }} /></label>
          <ul className="lines">
            {api.clients.filter((person) => `${person.name} ${person.org} ${person.email}`.toLowerCase().includes(query.trim().toLowerCase())).map((person) => (
              <li key={person.id}><Link to={`/admin/clients/${person.id}`}><strong>{person.name}</strong><span>{person.org}</span><span>{person.email}</span></Link></li>
            ))}
          </ul>
          {api.clients.length === 0 ? <p className="empty">No clients yet.</p> : null}
        </>
      ) : null}
      {tab === 'activity' ? <Activity notes={api.notes} /> : null}
      {tab === 'detail' ? (
        client ? <ClientDetail clientId={client.id} onDone={setBanner} /> : <p className="empty">That client is not in the record.</p>
      ) : null}
    </>
  )
}

function Activity({ notes }: { notes: { id: string; at: string; body: string; internal: boolean; actor: string }[] }) {
  if (notes.length === 0) return <p className="empty">No activity yet.</p>
  return (
    <ol className="timeline">
      {notes.map((note) => (
        <li key={note.id}>
          <time dateTime={note.at}>{when(note.at)}</time>
          <p>{note.body}</p>
          <span>{note.actor}{note.internal ? ' · internal' : ''}</span>
        </li>
      ))}
    </ol>
  )
}

function ClientForm({ onDone }: { onDone: (message: string) => void }) {
  const api = usePortal()
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = await api.createClient({
      name: String(data.get('name') ?? ''),
      org: String(data.get('org') ?? ''),
      email: String(data.get('email') ?? ''),
    })
    setError(result.ok ? '' : result.error)
    if (result.ok) {
      onDone(result.detail ?? 'Created.')
      event.currentTarget.reset()
    }
  }
  return (
    <form className="form inline-form" onSubmit={submit}>
      <h2>Add a client</h2>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="field"><label htmlFor="new-name">Name</label><input id="new-name" name="name" /></div>
      <div className="field"><label htmlFor="new-org">Organisation</label><input id="new-org" name="org" /></div>
      <div className="field"><label htmlFor="new-email">Email</label><input id="new-email" name="email" type="email" /></div>
      <button className="btn btn-navy" type="submit">Create client</button>
    </form>
  )
}

function ClientDetail({ clientId, onDone }: { clientId: string; onDone: (message: string) => void }) {
  const api = usePortal()
  const client = api.clients.find((person) => person.id === clientId)!
  const items = api.items.filter((item) => item.clientId === clientId)
  const files = api.files.filter((file) => file.clientId === clientId)
  const [error, setError] = useState('')

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = await api.createItem({
      clientId,
      kind: String(data.get('kind')) === 'task' ? 'task' : 'document',
      title: String(data.get('title') ?? ''),
      detail: String(data.get('detail') ?? ''),
    })
    setError(result.ok ? '' : result.error)
    if (result.ok) { onDone(result.detail ?? 'Added.'); event.currentTarget.reset() }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await api.addNote(clientId, String(new FormData(event.currentTarget).get('body') ?? ''))
    setError(result.ok ? '' : result.error)
    if (result.ok) { onDone(result.detail ?? 'Saved.'); event.currentTarget.reset() }
  }

  return (
    <>
      <p>{client.org} · {client.email}</p>
      <form className="form inline-form" onSubmit={addItem}>
        <h2>Add a request</h2>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="field">
          <label htmlFor="kind">Kind</label>
          <select id="kind" name="kind"><option value="document">Document</option><option value="task">Task</option></select>
        </div>
        <div className="field"><label htmlFor="title">Title</label><input id="title" name="title" /></div>
        <div className="field"><label htmlFor="detail">Note</label><textarea id="detail" name="detail" rows={3} /></div>
        <button className="btn btn-navy" type="submit">Assign</button>
      </form>
      {items.length === 0 ? <p className="empty">No requests for this client.</p> : (
        <ul className="lines">
          {items.map((item) => (
            <li key={item.id}>
              <div><strong>{item.title}</strong><span>{item.detail}</span></div>
              <label className="sr" htmlFor={`st-${item.id}`}>Status for {item.title}</label>
              <select id={`st-${item.id}`} value={item.status} onChange={async (event) => {
                const result = await api.setStatus(item.id, event.target.value as Status)
                onDone(result.ok ? result.detail ?? 'Saved.' : result.error)
              }}>
                {STATUS.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
      <h2>Files on the record</h2>
      {files.length === 0 ? <p className="empty">No file metadata for this client. Bytes are not kept in the demonstration.</p> : (
        <ul className="lines">
          {files.map((file) => <li key={file.id}><strong>{file.name}</strong><span>{file.mime}</span><span>{sizeLabel(file.size)} · {when(file.at)}</span></li>)}
        </ul>
      )}
      <form className="form narrow" onSubmit={addNote}>
        <h2>Internal note</h2>
        <div className="field"><label htmlFor="note">Note the client will not see</label><textarea id="note" name="body" rows={3} /></div>
        <button className="btn btn-line" type="submit">Save note</button>
      </form>
    </>
  )
}
