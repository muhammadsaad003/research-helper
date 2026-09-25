import { NextResponse } from "next/server";
import { many, one } from "@/lib/db";
import { requireUserApi } from "@/lib/auth";
import { cleanPaper } from "@/lib/validate";

// GET /api/library          -> all saved papers of the logged-in user
// GET /api/library?ids=1    -> just the paper ids (used to mark "In your library")
export async function GET(req) {
  const { user, error } = await requireUserApi();
  if (error) return error;

  if (req.nextUrl.searchParams.get("ids") === "1") {
    const rows = await many("SELECT paper_id FROM saved_papers WHERE user_id = $1", [user.id]);
    return NextResponse.json({ ids: rows.map((r) => r.paper_id) });
  }

  const items = await many(
    `SELECT id, paper_id, title, authors, year, venue, doi, url, cited_by, meta, status, tags,
            notes, method, findings, gap, created_at, updated_at,
            (abstract IS NOT NULL AND length(abstract) > 0) AS has_abstract
       FROM saved_papers WHERE user_id = $1 ORDER BY updated_at DESC`,
    [user.id]
  );
  return NextResponse.json({ items });
}

// POST /api/library  { paper }  -> save a paper
export async function POST(req) {
  const { user, error } = await requireUserApi();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const p = cleanPaper(body.paper);
  if (!p) return NextResponse.json({ error: "That paper is missing an id or title." }, { status: 400 });

  const count = await one("SELECT COUNT(*)::int AS n FROM saved_papers WHERE user_id = $1", [user.id]);
  if (count.n >= 2000) return NextResponse.json({ error: "Your library is full (2000 papers)." }, { status: 400 });

  const row = await one(
    `INSERT INTO saved_papers (user_id, paper_id, title, authors, year, venue, doi, url, abstract, cited_by, meta)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11::jsonb)
     ON CONFLICT (user_id, paper_id) DO NOTHING
     RETURNING id`,
    [user.id, p.id, p.title, JSON.stringify(p.authors), p.year, p.venue, p.doi, p.url, p.abstract, p.citedBy, JSON.stringify(p.meta)]
  );
  if (!row) {
    const existing = await one("SELECT id FROM saved_papers WHERE user_id = $1 AND paper_id = $2", [user.id, p.id]);
    return NextResponse.json({ id: existing?.id, already: true });
  }
  return NextResponse.json({ id: row.id }, { status: 201 });
}
