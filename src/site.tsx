import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { articles, legal, services } from './content'

const titles: Record<string, string> = {
  '/': 'Saurabh Bansal & Associates',
  '/about': 'About the firm',
  '/services': 'Services',
  '/insights': 'Insights',
  '/contact': 'Contact',
  '/privacy': 'Privacy notice',
  '/terms': 'Terms of use',
}

export function Site() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (titles[pathname]) document.title = titles[pathname]
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.documentElement.classList.add('js')
    const nodes = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('in') })
    }, { threshold: 0.14 })
    nodes.forEach((node) => io.observe(node))
    return () => io.disconnect()
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <a className="skip" href="#content">Skip to content</a>
      <header className="site-header">
        <div className="wrap bar">
          <Link className="brand" to="/">
            <span className="mark" aria-hidden="true">SB</span>
            <span>
              <strong>Saurabh Bansal</strong>
              <em>& Associates</em>
            </span>
          </Link>
          <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((v) => !v)}>
            {open ? 'Close' : 'Menu'}
          </button>
          <nav id="site-nav" className={open ? 'open' : undefined}>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/insights">Insights</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
        </div>
      </header>
      <main id="content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap foot">
          <div>
            <p className="brand-line">Saurabh Bansal & Associates</p>
            <p>Chartered accountants · New Delhi</p>
          </div>
          <div>
            <p>Street address, telephone, and email are withheld until the firm confirms them.</p>
            <p><Link to="/privacy">Privacy notice</Link> · <Link to="/terms">Terms</Link></p>
          </div>
          <div>
            <p>Developed by Kynex Code.</p>
            <p className="foot-portal"><Link to="/portal">Client Portal</Link></p>
          </div>
        </div>
      </footer>
    </>
  )
}

function Plate() {
  const panes = []
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      panes.push(
        <rect key={`${row}-${col}`} x={62 + col * 76} y={78 + row * 76} width="58" height="54" fill={(row + col) % 3 === 0 ? '#efe6d6' : '#24344f'} />,
      )
    }
  }
  return (
    <svg viewBox="0 0 640 760" role="img" aria-label="Architectural plate of a windowed facade beside an open file">
      <rect width="640" height="760" fill="#e7dfd2" />
      <rect x="40" y="46" width="352" height="540" fill="#17233b" />
      {panes}
      <rect x="430" y="46" width="2" height="668" fill="#8d6d3d" />
      <rect x="286" y="468" width="312" height="230" fill="#fbf8f2" stroke="#17233b" />
      <text x="312" y="506" fill="#8d6d3d" fontSize="13" fontFamily="Palatino, serif" letterSpacing="2">FILE</text>
      <path d="M312 534h230M312 566h230M312 598h160M312 630h190" stroke="#cfc4b2" strokeWidth="1.4" />
      <circle cx="548" cy="640" r="15" fill="none" stroke="#2c4a3d" strokeWidth="1.4" />
    </svg>
  )
}

export function Home() {
  return (
    <>
      <section className="hero wrap">
        <div>
          <p className="eyebrow">Chartered accountants · New Delhi</p>
          <h1>A clear record for accounts, tax, and compliance.</h1>
          <p className="lede">Saurabh Bansal & Associates is a chartered accountancy practice in New Delhi. This site sets out proposed areas of work for accounts, tax, and compliance.</p>
          <div className="hero-actions">
            <Link className="btn btn-navy" to="/services">Proposed services</Link>
            <Link className="btn btn-line" to="/contact">Send an enquiry</Link>
          </div>
          <p className="fine">Service categories and articles are drafts for the firm to approve.</p>
        </div>
        <figure className="hero-figure">
          <Plate />
          <figcaption>An original plate for this site. A file moves from request to review.</figcaption>
        </figure>
      </section>

      <section className="intro wrap reveal">
        <p className="eyebrow">The practice</p>
        <div className="intro-grid">
          <h2>Described without a sales claim.</h2>
          <div>
            <p>The firm’s public pages are for people who want to understand the kind of accounting, tax, and compliance work a practice of this sort undertakes, and how a client file is tracked.</p>
            <p>Biographies, years of practice, client names, and testimonials are not published here. Add them only after the firm approves the wording.</p>
          </div>
        </div>
      </section>

      <section className="band reveal">
        <div className="wrap">
          <div className="section-head">
            <h2>Proposed areas of work</h2>
            <Link to="/services">Read the full list</Link>
          </div>
          <ol className="service-list">
            {services.slice(0, 4).map((service, index) => (
              <li key={service.slug}>
                <span>0{index + 1}</span>
                <strong>{service.title}</strong>
                <p>{service.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap approach reveal">
        <p className="eyebrow">How the work is handled</p>
        <ol>
          <li><span>01</span><h3>Agree the records</h3><p>The firm says which papers an item needs. The request stays visible until it is closed.</p></li>
          <li><span>02</span><h3>Receive them once</h3><p>The client records a file against that request. The preview keeps the description, not a second copy in someone’s inbox.</p></li>
          <li><span>03</span><h3>Show the status</h3><p>Requested, Submitted, Under Review, or Completed. The same label is what the client and the desk both see.</p></li>
        </ol>
      </section>

      <section className="wrap insights reveal">
        <div className="section-head">
          <h2>Draft notes</h2>
          <Link to="/insights">All drafts</Link>
        </div>
        <div className="insight-grid">
          <article>
            <p className="flag">Demonstration draft</p>
            <h3><Link to={`/insights/${articles[0].slug}`}>{articles[0].title}</Link></h3>
            <p>{articles[0].standfirst}</p>
          </article>
          <div>
            {articles.slice(1).map((article) => (
              <article key={article.slug}>
                <p className="flag">Demonstration draft</p>
                <h3><Link to={`/insights/${article.slug}`}>{article.title}</Link></h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <p className="eyebrow light">Enquiry</p>
          <h2>Write to the firm. An enquiry is not an appointment.</h2>
          <Link className="btn btn-ivory" to="/contact">Contact</Link>
        </div>
      </section>
    </>
  )
}

export function About() {
  return (
    <article className="wrap page">
      <p className="eyebrow">About the firm</p>
      <h1>Saurabh Bansal & Associates, New Delhi.</h1>
      <div className="split-copy">
        <p className="lede">This page introduces a chartered accountancy practice. It does not rank the firm, count its clients, or describe a partner’s career. Those details are waiting for the firm’s own words.</p>
        <div>
          <p>The work people usually bring to a practice of this kind sits under the proposed headings on the services page: direct tax, GST, accounts, audit, corporate compliance, and advisory discussions. Treat that list as a draft menu, not as a record of current mandates.</p>
          <p>A separate client portal shows how a request, a received file, and a status can live in one place. On this preview that portal is a demonstration with fictional clients.</p>
        </div>
      </div>
      <h2>Intentionally unpublished</h2>
      <ul className="plain">
        <li>Partner biographies and qualifications</li>
        <li>Years of practice, awards, and rankings</li>
        <li>Client names, logos, and testimonials</li>
        <li>A street address, telephone number, or email, until the firm confirms them</li>
      </ul>
    </article>
  )
}

export function Services() {
  return (
    <article className="wrap page">
      <p className="eyebrow">Services</p>
      <h1>Proposed areas, pending the firm’s approval.</h1>
      <p className="callout">These headings are a draft for Saurabh Bansal & Associates to accept, edit, or remove. They are not a statement of current engagements or a promise that every item is offered.</p>
      <ol className="service-list long">
        {services.map((service, index) => (
          <li id={service.slug} key={service.slug}>
            <span>0{index + 1}</span>
            <div>
              <strong>{service.title}</strong>
              <p>{service.text}</p>
            </div>
            <ul>{service.points.map((point) => <li key={point}>{point}</li>)}</ul>
          </li>
        ))}
      </ol>
    </article>
  )
}

export function Insights() {
  return (
    <article className="wrap page">
      <p className="eyebrow">Insights</p>
      <h1>Draft notes for the firm to keep or discard.</h1>
      <p className="lede">Nothing in this list is published professional guidance. Each piece is labelled as a demonstration draft.</p>
      <div className="article-index">
        {articles.map((article) => (
          <article key={article.slug}>
            <p className="flag">Demonstration draft</p>
            <h2><Link to={`/insights/${article.slug}`}>{article.title}</Link></h2>
            <p>{article.standfirst}</p>
          </article>
        ))}
      </div>
    </article>
  )
}

export function Article() {
  const { slug } = useParams()
  const article = articles.find((item) => item.slug === slug)
  useEffect(() => {
    document.title = article ? `${article.title} · Saurabh Bansal & Associates` : 'Not found'
  }, [article])
  if (!article) return <Missing />
  return (
    <article className="wrap page article">
      <p className="flag">Demonstration draft · not professional guidance</p>
      <h1>{article.title}</h1>
      <p className="lede">{article.standfirst}</p>
      {article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <p><Link to="/insights">Back to drafts</Link></p>
    </article>
  )
}

export function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '')
    const email = String(data.get('email') ?? '')
    const phone = String(data.get('phone') ?? '').trim()
    const topic = String(data.get('topic') ?? '')
    const message = String(data.get('message') ?? '')
    const consent = data.get('consent') === 'yes'
    const next: Record<string, string> = {}
    if (name.trim().length < 2) next.name = 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.'
    if (phone && !/^[+()\d\s-]{8,20}$/.test(phone)) next.phone = 'Enter a telephone number, or leave this blank.'
    if (!topic) next.topic = 'Choose a topic.'
    if (message.trim().length < 20) next.message = 'Write at least 20 characters.'
    if (message.trim().length > 2000) next.message = 'Keep the message under 2,000 characters.'
    if (!consent) next.consent = 'Confirm that you understand this form does not send the message.'
    setErrors(next)
    setDone(Object.keys(next).length === 0)
  }

  return (
    <article className="wrap page">
      <p className="eyebrow">Contact</p>
      <h1>An enquiry, not an appointment.</h1>
      <div className="contact-grid">
        <div>
          {done ? (
            <p className="form-ok" role="status">This preview kept your message on this page only. It has not been emailed, stored, or treated as an appointment.</p>
          ) : (
            <form className="form" onSubmit={submit} noValidate>
              {Object.keys(errors).length > 0 ? <p className="form-error" role="alert">Check the highlighted fields.</p> : null}
              <Field id="name" label="Name" error={errors.name}>
                <input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
              </Field>
              <Field id="email" label="Email" error={errors.email}>
                <input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
              </Field>
              <Field id="phone" label="Telephone, if you want a call" error={errors.phone}>
                <input id="phone" name="phone" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} />
              </Field>
              <Field id="topic" label="What is this about?" error={errors.topic}>
                <select id="topic" name="topic" defaultValue="" aria-invalid={!!errors.topic} aria-describedby={errors.topic ? 'topic-error' : undefined}>
                  <option value="">Select</option>
                  <option>A general enquiry</option>
                  <option>Accounts</option>
                  <option>Taxation</option>
                  <option>Compliance</option>
                  <option>The portal preview</option>
                </select>
              </Field>
              <Field id="message" label="Message" error={errors.message}>
                <textarea id="message" name="message" rows={6} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'message-error' : undefined} />
              </Field>
              <div className={errors.consent ? 'field invalid' : 'field'}>
                <label className="check" htmlFor="consent">
                  <input id="consent" name="consent" type="checkbox" value="yes" aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'consent-error' : undefined} />
                  I understand this demonstration does not send the message to the firm.
                </label>
                {errors.consent ? <p id="consent-error" className="field-error">{errors.consent}</p> : null}
              </div>
              <button className="btn btn-navy" type="submit">Submit enquiry</button>
            </form>
          )}
        </div>
        <aside className="location">
          <p className="eyebrow">Location</p>
          <h2>New Delhi</h2>
          <p>The street address is not shown. Public listings for this firm name do not agree, and the domain associated with one listing did not open a confirmed office page. Publish an address only after the firm confirms it.</p>
          <p>No email address or telephone number is invented on this site.</p>
        </aside>
      </div>
    </article>
  )
}

export function Legal({ name }: { name: 'privacy' | 'terms' }) {
  const page = legal[name]
  return (
    <article className="wrap page legal">
      <p className="flag">Draft · approve before production</p>
      <h1>{page.title}</h1>
      <p className="lede">{page.lede}</p>
      {page.sections.map((section) => (
        <section key={section.h}>
          <h2>{section.h}</h2>
          {section.p.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
    </article>
  )
}

export function Missing() {
  return (
    <article className="wrap page">
      <h1>This page is not on the site.</h1>
      <p><Link to="/">Return home</Link></p>
    </article>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className={error ? 'field invalid' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p id={`${id}-error`} className="field-error">{error}</p> : null}
    </div>
  )
}
