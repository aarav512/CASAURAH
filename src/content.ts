export const services = [
  {
    slug: 'direct-tax',
    title: 'Direct taxation',
    text: 'Income-tax computations, return papers, and notice responses, where the firm is engaged for that work.',
    points: ['Return working papers', 'Tax computation support', 'A calendar of filings that are actually due'],
  },
  {
    slug: 'gst',
    title: 'GST and indirect tax',
    text: 'GST registrations, returns, and reconciliations between books and the portal, when those tasks are in scope.',
    points: ['Outward and inward supply summaries', 'Return working files', 'Reconciliation notes'],
  },
  {
    slug: 'accounts',
    title: 'Accounting and bookkeeping',
    text: 'Books, ledgers, and periodic closures prepared from records the client supplies.',
    points: ['Bookkeeping from source papers', 'Ledger review', 'Period-end packs'],
  },
  {
    slug: 'audit',
    title: 'Audit and assurance',
    text: 'Statutory or agreed-upon checks, with a list of what the file still needs.',
    points: ['Engagement scope in writing', 'Sample and query lists', 'A status for open points'],
  },
  {
    slug: 'compliance',
    title: 'Corporate and regulatory compliance',
    text: 'ROC, TDS, and other filings that apply to the entity, tracked as individual requests.',
    points: ['Filing checklists', 'Challan and acknowledgement copies', 'A record of what was lodged'],
  },
  {
    slug: 'advisory',
    title: 'Business advisory',
    text: 'Discussion of records, structure, and the information a decision needs. This is not a claim of any particular mandate.',
    points: ['Questions before a meeting', 'Working notes', 'A written list of what was asked'],
  },
] as const

export const articles = [
  {
    slug: 'how-a-request-moves',
    title: 'How a document request moves through this preview',
    standfirst: 'A demonstration of the portal. It is not a client circular and it is not tax advice.',
    paragraphs: [
      'Each piece of work in the preview has one of four states: Requested, Submitted, Under Review, or Completed. The label is a tracking mark for the demonstration, not a statutory status.',
      'When a request is open, the client can record a PDF, JPEG, PNG, CSV, or XLSX file of up to 10 MB. In this preview the file is checked and then discarded. Only the name, type, and size stay in the browser.',
      'Changing a status in the administrator view updates the same local record the client sees. Nothing is sent to the firm, and nothing should be a real tax document.',
    ],
  },
  {
    slug: 'what-an-enquiry-is',
    title: 'What an enquiry on this website is',
    standfirst: 'The contact form accepts a message. It does not create an appointment or an engagement.',
    paragraphs: [
      'A completed form in this preview stays on the page. It is not emailed, stored on a server, or treated as instructions to begin work.',
      'An appointment exists only when the firm confirms it in a separate message. Publishing a form is not that confirmation.',
      'Until the firm names an inbox, a production form should not pretend that a message has been delivered.',
    ],
  },
  {
    slug: 'arranging-a-file',
    title: 'Draft note: arranging a file before a discussion',
    standfirst: 'A writing sample for the firm to edit or discard. It does not tell anyone how to treat a transaction.',
    paragraphs: [
      'A useful file usually separates source papers, workings, and the question the client wants answered. The portal is meant to show which of those the firm has asked for.',
      'This draft does not interpret the Income-tax Act, GST law, or any filing deadline. Those points belong in advice given to a client after the firm has seen the records.',
      'If this note is published later, it should be rewritten by the firm and dated. The version on this preview is fictional scaffolding.',
    ],
  },
] as const

export const legal = {
  privacy: {
    title: 'Privacy notice',
    lede: 'Draft for the firm and its counsel. This page is not a compliance certificate.',
    sections: [
      {
        h: 'What this preview does with information',
        p: [
          'The enquiry form keeps what you type in the page until you leave it. It is not written to a server.',
          'The portal demonstration keeps fictional client records, and the name, type, and size of files you record, in this browser. Reset demonstration data deletes that copy. Do not upload real tax documents, passwords, or client files.',
        ],
      },
      {
        h: 'What a production system would hold',
        p: [
          'If the firm later connects Supabase, an account would hold a name, organisation, email, document requests, status history, file metadata, and the file itself in a private bucket. Collect only what the engagement needs.',
          'An enquiry should be stored only after the firm names a recipient and a retention period. This preview has no recipient.',
        ],
      },
      {
        h: 'Indian data protection',
        p: [
          'The Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025 were notified with a phased start. Rules 1, 2 and 17 to 21, and the Data Protection Board provisions, took effect on 13 November 2025. Consent-manager provisions are timed for 13 November 2026. The broader duties of a data fiduciary, including notice, security safeguards, breach notice, and principal rights in Rules 3, 5 to 16, 22 and 23, are timed for 13 May 2027. Confirm the gazette before launch.',
          'This draft does not say the firm is a data fiduciary, a consent manager, or compliant with the Act.',
        ],
      },
      {
        h: 'CERT-In and security logs',
        p: [
          'The CERT-In directions of 28 April 2022 can require covered entities to report certain incidents within six hours and to retain specified logs in India. The firm must decide whether those directions apply and where logs will live. This demonstration does not implement that logging.',
          'Production access should depend on a database role, not on a role sent by the browser. File links should stay private. A service-role key must stay on the server.',
        ],
      },
      {
        h: 'Retention and deletion',
        p: [
          'The firm should set how long engagement records are kept, including where tax or company law requires a longer hold. A deletion request should remove the auth user, profile, requests, notes, and storage objects, with the lag of any backup stated plainly.',
          'Resetting the demonstration clears only this browser. It does not delete anything held by the firm, because this preview does not send the firm a copy.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    lede: 'Draft for counsel. Using this preview does not create a professional engagement.',
    sections: [
      {
        h: 'No advice and no appointment',
        p: [
          'Pages, draft articles, and portal labels are general description. They are not an opinion on anyone’s tax, audit, or filing position.',
          'An enquiry is a message. It is not a confirmed appointment and it does not start an engagement. Work begins only when the firm agrees the scope.',
        ],
      },
      {
        h: 'The portal preview',
        p: [
          'Demonstration sign-in is a shared preview password stored in the application source, not a production control. Do not rely on it to protect a real document.',
          'Uploads in the preview are validated and discarded. A simulated upload is not evidence that the firm received a file.',
        ],
      },
      {
        h: 'Limits',
        p: [
          'The firm may decline or stop work. Service headings on this site are proposals for approval, not a warranty that each service is currently offered.',
          'Counsel should confirm the governing law and forum before publication. This draft assumes the firm’s public site is aimed at clients in India.',
        ],
      },
    ],
  },
} as const
