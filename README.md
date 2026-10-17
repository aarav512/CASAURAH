# Saurabh Bansal & Associates

Firm preview for a chartered accountancy practice in New Delhi, with a public site and a client portal. Developed by Kynex Code.

This directory is separate from the static site at the repository root. It does not replace that site.

## Run the preview

```bash
cd ca-firm-demo
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

The dev server prints a local URL. Open that, not the static files at the repository root.

## Demonstration and production

`VITE_APP_MODE=demo` (the default) uses fictional records in this browser. No Supabase credentials are required.

`VITE_APP_MODE=production` uses Supabase Auth, Postgres, and private Storage. If the URL or publishable key is missing, or if the key is a service-role key, the portal closes. It does not fall back to the demonstration.

Copy `.env.example` to `.env`. Put only the project URL and the publishable (or legacy anon) key in `VITE_` variables. Keep the service-role key in Supabase Edge Function secrets.

Preview passwords, shown on the sign-in screen:

- Client: `meera.khanna@example.invalid` / `demo-client`
- Firm desk: `demo.admin@example.invalid` / `demo-admin`

New demonstration clients use `demo-client`. Passwords are not written to browser storage. Two tabs can sign in as different people; the shared record stays in step. Reset demonstration data restores the sample.

Do not upload real tax documents. A demonstration upload is checked and discarded. Only the name, type, and size remain.

## What is simulated

- Sign-in, until production mode is configured
- File upload in the demonstration
- Enquiry delivery (the message stays on the page)
- Password recovery email in the demonstration
- Office address, telephone, and email (withheld; public listings conflict)
- Service list and articles (drafts for the firm to approve)

## Supabase

Apply `supabase/migrations/20261017120000_init.sql` on a new project. It creates profiles, work items, document metadata, activity, and status history; enables row level security; and adds a private `client-documents` bucket.

Roles live in `profiles.role`. A new account is always a client. The browser cannot set that role. Promote an administrator in the SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<auth user uuid>';
```

Deploy the invitation function, which checks the caller’s database role before creating a user:

```bash
supabase functions deploy admin-create-client
```

There is no public file URL. Clients can read only their folder. Administrators are recognised by `private.is_admin()`, not by a claim the user can edit. Deleting a user does not, by itself, revoke tokens already issued; sign the user out as well.

Retention, once the firm sets it: remove the auth user, profile, requests, notes, and storage objects, and say how long backups remain. Tax-law retention may require a longer hold.

## Cloudflare Pages

Build command: `npm run build`. Output directory: `dist`.

```bash
npx wrangler pages deploy dist --project-name <project>
```

`public/_redirects` sends unknown paths to `index.html`. The site is marked `noindex` until the firm approves the copy. Remove that tag, and the robots rule, only at launch.

Do not point this build at the existing law-firm Pages project.

## Capacity

The design target is about 1,000–2,000 public visits over an agreed period, and about 15–20 people using the portal at once. Those figures are not a load-test result and not a promise of availability.

Before launch, run a short concurrency check (for example k6 or a parallel fetch of the built pages), upload several 10 MB files, and read Supabase and Cloudflare usage for database size, storage, and bandwidth. Stay inside the plan you pay for.

## Before launch

- Firm approves every public sentence, including the service list
- Confirm address, phone, and email, or keep them off the site
- Counsel reviews the draft privacy notice and terms, including DPDP commencement and CERT-In logging
- Production mode is on, with a publishable key only
- Row level security and the private bucket are applied
- An administrator exists only via the SQL update above
- Enquiry mail has a real recipient, or the form still says it does not send
- A password reset email arrives from Supabase
- One client cannot open another client’s request or file
- Remove `noindex` only when the copy is approved
