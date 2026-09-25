# Research Helper

A full-stack research assistant website. People can search millions of research papers, save them to a personal library, take structured notes, compare papers side by side, and export citations in APA, MLA, Chicago, Harvard, IEEE and BibTeX.

Built with **Next.js 15**, **PostgreSQL**, **NextAuth** and **Tailwind CSS**. Ready to host for free on **Vercel** with a free **Neon** database.

> **Want to put it online?** Follow **[DEPLOYMENT.md](./DEPLOYMENT.md)**. It goes step by step from zero to a live website.

---

## Three kinds of people use the site

| Role | Who | What they can do |
|---|---|---|
| **Visitor** | Anyone, not logged in | Search papers, read details and abstracts, make citations, see papers picked by the admin |
| **User** | Anyone who signs up | Everything a visitor can do, plus: save papers to a library, set reading status (to read, reading, done), add tags and notes, record method, findings and research gap, compare papers in a table, download a CSV literature review, summarize abstracts, export a full reference list |
| **Admin** | The site owner | Everything a user can do, plus: site statistics with charts, manage users (make admin, suspend, delete), feature papers on the home page, post announcements |

**How someone becomes an admin:** whoever signs up with the email in the `ADMIN_EMAIL` setting becomes an admin automatically. After that, an admin can make other users admins from **Admin, Users**.

**How roles are protected:**
- `middleware.js` stops visitors from opening member pages and stops non-admins from opening `/admin`.
- Every page and API route checks the role again on the server, reading it fresh from the database. So if an admin suspends someone, it works immediately.
- Users can only read and change their own library.
- Admins can't demote, suspend or delete themselves (so the site always has an admin).

---

## Features

- **Paper search** with highlighted search words, filters (year range, free-to-read only), sorting (best match, most cited, newest) and pages.
- **Paper page** with abstract, authors, citation count, DOI, topics and free full-text link when available.
- **Citation maker** in six styles. Paste a DOI to fill in the details automatically, or type them in. Copying keeps italics when you paste into Word or Google Docs.
- **Library** with status tabs, tag filters, text filter, sorting and one-click export of the whole reference list (copy or download, including `.bib`).
- **Notes page** for each saved paper: methodology, key findings, limitations and gap, and free notes on lined paper. Saves with a button or Ctrl+S, and warns you before leaving with unsaved changes.
- **Compare table** that lines up your notes from every paper, the core of a literature review. Download it as CSV for Excel.
- **Summaries** of abstracts. With an Anthropic API key, Claude writes the summary. Without a key, the site picks the key sentences itself, so the feature always works.
- **Admin panel** with statistics and 14-day charts, user management, featured papers and announcements.
- **Light and dark theme**, works on phones, keyboard friendly.

### Where paper data comes from

- **OpenAlex** (best results: abstracts and free-to-read info). Searching needs a **free API key** since February 2026. Add it as `OPENALEX_API_KEY`.
- **Crossref** (no key needed). Used automatically when there is no OpenAlex key, or if OpenAlex is down.

Looking up a single paper by DOI works without any key.

---

## Tech stack

| Part | Tool |
|---|---|
| Framework | Next.js 15 (App Router), React 19, JavaScript |
| Styling | Tailwind CSS 3, Literata and IBM Plex Sans fonts, lucide icons |
| Login | NextAuth 4 (email and password, passwords hashed with bcrypt, JWT sessions) |
| Database | PostgreSQL through `pg` with plain SQL (no ORM, easy to read) |
| Hosting | Vercel (app) and Neon (database), both free |

---

## Folder structure

```
research-helper/
├── app/                      Pages and API routes (Next.js App Router)
│   ├── page.js               Home page
│   ├── search/               Search page with filters
│   ├── paper/[...id]/        Paper details (id is a DOI or OpenAlex id)
│   ├── cite/                 Citation maker
│   ├── login/, register/     Log in and sign up
│   ├── dashboard/            User home: progress, recent papers, tags
│   ├── library/              Library list, and library/[id] notes page
│   ├── compare/              Literature review table
│   ├── settings/             Change name and password
│   ├── admin/                Admin panel: overview, users, featured, announcements
│   └── api/                  Server API routes (auth, search, library, admin...)
├── components/               Reusable UI pieces (Navbar, CitePanel, Modal...)
├── lib/                      Logic: database, auth, paper sources, citations, summaries
├── db/schema.sql             Database tables
├── scripts/                  migrate (create tables), make-admin, seed demo data
├── middleware.js             Blocks pages by role
├── .env.example              List of settings you need
├── README.md                 This file
└── DEPLOYMENT.md             Step-by-step hosting guide
```

---

## Run it on your computer

You need Node.js 18.18 or newer and a Postgres database (a free Neon database works, see DEPLOYMENT.md).

```bash
npm install
cp .env.example .env.local      # on Windows: copy .env.example .env.local
# open .env.local and fill in DATABASE_URL, NEXTAUTH_SECRET and ADMIN_EMAIL
npm run db:migrate              # creates the tables
npm run dev                     # open http://localhost:3000
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the site for development at http://localhost:3000 |
| `npm run build` | Create tables (if needed) and build the site for production |
| `npm start` | Run the production build |
| `npm run db:migrate` | Create the database tables (safe to run again) |
| `npm run make-admin -- you@example.com` | Turn an existing account into an admin |
| `npm run seed` | Create demo accounts `admin@demo.com` and `user@demo.com` (password `demo1234`) |

### Settings (environment variables)

| Name | Needed? | What it is |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `NEXTAUTH_SECRET` | Yes | Long random text that protects logins |
| `ADMIN_EMAIL` | Yes (for your first admin) | Email that becomes admin on sign-up. Several allowed, comma separated |
| `CONTACT_EMAIL` | Recommended | Your email, sent politely to OpenAlex and Crossref |
| `OPENALEX_API_KEY` | Recommended | Free key for better search results |
| `ANTHROPIC_API_KEY` | Optional | Turns on AI-written summaries |
| `ANTHROPIC_MODEL` | Optional | Claude model for summaries (default `claude-haiku-4-5-20251001`) |
| `NEXTAUTH_URL` | Only on your computer | `http://localhost:3000`. Don't set it on Vercel |

---

## Ideas to extend the project

- Password reset by email (for example with Resend or another email service).
- Rate limiting on sign-up, login and search.
- Shared collections so a research group can build one library together.
- Upload a PDF and summarize the full text, not just the abstract.
- Automated tests (Playwright for pages, Vitest for `lib/citations.js`).

## Credits

Paper data: [OpenAlex](https://openalex.org) (CC0) and [Crossref](https://www.crossref.org).
