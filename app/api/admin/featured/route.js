import { NextResponse } from "next/server";
import { exec, one } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { getPaper, parsePaperInput } from "@/lib/papers";

// POST /api/admin/featured { input, note } -> feature a paper on the home page
export async function POST(req) {
  const { user, error } = await requireAdminApi();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const id = parsePaperInput(body.input);
  if (!id) return NextResponse.json({ error: "Paste a DOI, a doi.org link, or an OpenAlex id." }, { status: 400 });

  const paper = await getPaper(id);
  if (!paper) return NextResponse.json({ error: "No paper found for that id." }, { status: 404 });
  const note = String(body.note || "").trim().slice(0, 280);

  const row = await one(
    `INSERT INTO featured_papers (paper_id, title, authors, year, venue, note, added_by)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
     ON CONFLICT (paper_id) DO UPDATE SET note = EXCLUDED.note
     RETURNING id, paper_id, title, authors, year, venue, note, created_at`,
    [paper.id, paper.title, JSON.stringify(paper.authors.slice(0, 50)), paper.year, paper.venue, note, user.id]
  );
  return NextResponse.json({ featured: row }, { status: 201 });
}

// DELETE /api/admin/featured?id=3   or   ?paperId=10.1038/nature14539
export async function DELETE(req) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const res = sp.get("id")
    ? await exec("DELETE FROM featured_papers WHERE id = $1", [Number(sp.get("id"))])
    : await exec("DELETE FROM featured_papers WHERE paper_id = $1", [String(sp.get("paperId") || "")]);
  if (!res.rowCount) return NextResponse.json({ error: "That paper isn't featured." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
