import { NextResponse } from "next/server";
import { exec, one } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";

// PATCH /api/admin/announcements/:id { is_active }
export async function PATCH(req, { params }) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const data = await req.json().catch(() => ({}));
  const row = await one("UPDATE announcements SET is_active = $1 WHERE id = $2 RETURNING id, is_active", [
    Boolean(data.is_active),
    Number(id),
  ]);
  if (!row) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
  return NextResponse.json({ announcement: row });
}

// DELETE /api/admin/announcements/:id
export async function DELETE(req, { params }) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const res = await exec("DELETE FROM announcements WHERE id = $1", [Number(id)]);
  if (!res.rowCount) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
