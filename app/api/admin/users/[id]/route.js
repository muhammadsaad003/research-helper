import { NextResponse } from "next/server";
import { exec, one } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";

// PATCH /api/admin/users/:id  { role } or { is_suspended }
export async function PATCH(req, { params }) {
  const { user: admin, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const targetId = Number(id);
  if (targetId === admin.id) {
    return NextResponse.json({ error: "You can't change your own role or suspend yourself." }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));

  if (body.role !== undefined) {
    if (!["USER", "ADMIN"].includes(body.role)) return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    const row = await one("UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role, is_suspended", [body.role, targetId]);
    if (!row) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json({ user: row });
  }
  if (body.is_suspended !== undefined) {
    const row = await one("UPDATE users SET is_suspended = $1 WHERE id = $2 RETURNING id, role, is_suspended", [
      Boolean(body.is_suspended),
      targetId,
    ]);
    if (!row) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json({ user: row });
  }
  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}

// DELETE /api/admin/users/:id  (also deletes their library)
export async function DELETE(req, { params }) {
  const { user: admin, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (Number(id) === admin.id) return NextResponse.json({ error: "You can't delete your own account here." }, { status: 400 });
  const res = await exec("DELETE FROM users WHERE id = $1", [Number(id)]);
  if (!res.rowCount) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
