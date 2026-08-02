# Folio

**Folio** is an ATS-focused CV platform: build a resume that clears real applicant
tracking systems, tailor it to each posting, and export PDF or DOCX that parses cleanly.

Built with Next.js 16 (App Router, Node.js route handlers) and Supabase
(Postgres + Auth, with row-level security on every table).

## What it does

- **ATS scoring.** 30+ checks across contact details, structure, content
  quality, keywords, parse safety and length, each with a specific fix.
- **Job description matching.** Extracts and weights keywords from a posting,
  separates hard requirements from nice-to-haves, and shows what is missing.
- **Three templates.** All single-column, no tables, no images, no icons, and
  restricted to fonts every PDF viewer embeds natively.
- **PDF and DOCX export.** Both render from the same document model, so the
  preview, the PDF and the Word file are always in sync.
- **Import.** Pulls text out of an existing PDF or DOCX and parses it back into
  structured fields.
- **Version history.** Automatic restore points plus manual ones, 30 kept per CV.
- **Cover letters.** Drafts generated from your own achievements and the
  posting's vocabulary.

## Setup

### 1. Requirements

Node.js 22 or later (`@supabase/supabase-js` no longer supports Node 20).

```bash
node --version   # must be >= 22
npm install
```

### 2. Create a Supabase project

At [supabase.com/dashboard](https://supabase.com/dashboard), create a project
and wait for it to finish provisioning.

### 3. Run the database migration

Open the SQL Editor in your project, paste the contents of
`supabase/migrations/0001_init.sql`, and run it. This creates the `profiles`,
`resumes`, `resume_versions`, `cover_letters` and `job_targets` tables along
with their RLS policies and triggers.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
from Project Settings → API.

### 5. Configure authentication

**Local dev** — Authentication → URL Configuration:

- Site URL: `http://localhost:3000`
- Redirect URLs:

```
http://localhost:3000/**
```

**Vercel production** — use your live domain instead of localhost:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs (keep local + add production):

```
http://localhost:3000/**
https://your-app.vercel.app/**
https://*.vercel.app/**
```

Set `NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app` in Vercel → Settings → Environment Variables, then redeploy.

For Google sign-in, enable the Google provider under Authentication → Providers
and paste in a client ID and secret from the Google Cloud Console. The
authorised redirect URI on the Google side is
`https://<your-project-ref>.supabase.co/auth/v1/callback`.

### 6. Run it

```bash
npm run dev
```

Visiting `/setup` walks through the same steps if anything is missing.

## Architecture

```
app/
  (auth)/            Login, signup, password reset — server actions
  (app)/             Authenticated pages: dashboard, editor, cover letters, settings
  api/               Route handlers (CV CRUD, versions, ATS, import, export)
  auth/              OAuth and email confirmation callbacks
lib/
  ats/               Scoring engine, JD matching, lexicons, text processing
  cv/                Schema, defaults, migrations, document model, templates
  export/            DOCX builder
  import/            PDF/DOCX text extraction and resume parsing
  supabase/          Browser, server and proxy clients
proxy.ts             Session refresh and route protection (Next.js 16)
supabase/migrations/ Database schema and RLS policies
```

The single most important piece is `lib/cv/blocks.ts`, which turns a CV into a
renderer-agnostic list of blocks. The HTML preview, the PDF exporter and the
DOCX exporter all consume that same structure, which is why the three outputs
cannot drift apart.

## Security

Every table has row-level security enabled with policies keyed on `auth.uid()`,
so a user can only ever read or write their own rows. Route handlers
additionally verify the session through `withAuth` before touching the
database, and server-side reads go through the data access layer in
`lib/auth/dal.ts` rather than trusting anything from the client.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```
