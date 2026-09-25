-- Research Helper database schema.
-- Safe to run many times: every statement uses IF NOT EXISTS.
-- It runs automatically on every Vercel build (see scripts/migrate.js).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  is_suspended  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Papers a user saved to their personal library, with reading status and notes.
CREATE TABLE IF NOT EXISTS saved_papers (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paper_id    TEXT NOT NULL,              -- DOI (lowercase) or OpenAlex id like W123
  title       TEXT NOT NULL,
  authors     JSONB NOT NULL DEFAULT '[]',
  year        INTEGER,
  venue       TEXT,
  doi         TEXT,
  url         TEXT,
  abstract    TEXT,
  cited_by    INTEGER,
  meta        JSONB NOT NULL DEFAULT '{}', -- volume, issue, pages, type, oaUrl
  status      TEXT NOT NULL DEFAULT 'TO_READ' CHECK (status IN ('TO_READ', 'READING', 'DONE')),
  tags        TEXT[] NOT NULL DEFAULT '{}',
  notes       TEXT NOT NULL DEFAULT '',
  method      TEXT NOT NULL DEFAULT '',
  findings    TEXT NOT NULL DEFAULT '',
  gap         TEXT NOT NULL DEFAULT '',
  summary     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, paper_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_papers_user ON saved_papers(user_id);

-- Papers the admin picks to show on the home page.
CREATE TABLE IF NOT EXISTS featured_papers (
  id         SERIAL PRIMARY KEY,
  paper_id   TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  authors    JSONB NOT NULL DEFAULT '[]',
  year       INTEGER,
  venue      TEXT,
  note       TEXT NOT NULL DEFAULT '',
  added_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site-wide notices written by the admin.
CREATE TABLE IF NOT EXISTS announcements (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
