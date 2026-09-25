import { NextResponse } from "next/server";
import { exec, one } from "@/lib/db";
import { requireUserApi } from "@/lib/auth";
import { getPaper } from "@/lib/papers";
import { summarizePaper } from "@/lib/summarize";

// POST /api/summarize { savedId } or { paperId }
export async function POST(req) {
  const { user, error } = await requireUserApi();
  if (error) return error;
  const body = await req.json().catch(() => ({}));

  let title;
  let abstract;
  let savedId = body.savedId ? Number(body.savedId) : null;

  if (savedId) {
    const row = await one("SELECT title, abstract FROM saved_papers WHERE id = $1 AND user_id = $2", [savedId, user.id]);
    if (!row) return NextResponse.json({ error: "Paper not found in your library." }, { status: 404 });
    ({ title, abstract } = row);
  } else if (body.paperId) {
    const paper = await getPaper(String(body.paperId));
    if (!paper) return NextResponse.json({ error: "Couldn't load that paper." }, { status: 404 });
    ({ title, abstract } = paper);
    const saved = await one("SELECT id FROM saved_papers WHERE user_id = $1 AND paper_id = $2", [user.id, paper.id]);
    savedId = saved?.id ?? null;
  } else {
    return NextResponse.json({ error: "Say which paper to summarize." }, { status: 400 });
  }

  try {
    const summary = await summarizePaper({ title, abstract });
    if (savedId) {
      await exec("UPDATE saved_papers SET summary = $1::jsonb WHERE id = $2 AND user_id = $3", [
        JSON.stringify(summary),
        savedId,
        user.id,
      ]);
    }
    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
