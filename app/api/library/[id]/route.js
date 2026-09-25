import { NextResponse } from "next/server";
import { exec, one } from "@/lib/db";
import { requireUserApi } from "@/lib/auth";
import { STATUSES, cleanTags } from "@/lib/validate";

const TEXT_FIELDS = { notes: 20000, method: 4000, findings: 4000, gap: 4000 };

// PATCH /api/library/:id  -> update status, tags or notes of a saved paper
export async function PATCH(req, { params }) {
  const { user, error } = await requireUserApi();
  if (error) return error;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = await req.json().catch(() => ({}));

  const sets = [];
  const values = [];
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    values.push(body.status);
    sets.push(`status = $${values.length}`);
  }
  if (body.tags !== undefined) {
    values.push(cleanTags(body.tags));
    sets.push(`tags = $${values.length}`);
  }
  for (const [field, max] of Object.entries(TEXT_FIELDS)) {
    if (body[field] !== undefined) {
      values.push(String(body[field]).slice(0, max));
      sets.push(`${field} = $${values.length}`);
    }
  }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  values.push(Number(id), user.id);
  const row = await one(
    `UPDATE saved_papers SET ${sets.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length - 1} AND user_id = $${values.length}
      RETURNING id, status, tags, notes, method, findings, gap, updated_at`,
    values
  );
  if (!row) return NextResponse.json({ error: "Paper not found in your library." }, { status: 404 });
  return NextResponse.json({ item: row });
}

// DELETE /api/library/:id -> remove from library
export async function DELETE(req, { params }) {
  const { user, error } = await requireUserApi();
  if (error) return error;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const res = await exec("DELETE FROM saved_papers WHERE id = $1 AND user_id = $2", [Number(id), user.id]);
  if (!res.rowCount) return NextResponse.json({ error: "Paper not found in your library." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
