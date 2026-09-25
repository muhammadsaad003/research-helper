import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { exec, one } from "@/lib/db";
import { requireUserApi } from "@/lib/auth";

// PATCH /api/settings  { name }  or  { currentPassword, newPassword }
export async function PATCH(req) {
  const { user, error } = await requireUserApi();
  if (error) return error;
  const body = await req.json().catch(() => ({}));

  if (body.name !== undefined) {
    const name = String(body.name).trim().slice(0, 80);
    if (name.length < 2) return NextResponse.json({ error: "Enter a name with at least 2 letters." }, { status: 400 });
    await exec("UPDATE users SET name = $1 WHERE id = $2", [name, user.id]);
    return NextResponse.json({ ok: true, name });
  }

  if (body.newPassword !== undefined) {
    const current = String(body.currentPassword || "");
    const next = String(body.newPassword || "");
    if (next.length < 8) return NextResponse.json({ error: "Use a new password with at least 8 characters." }, { status: 400 });
    const row = await one("SELECT password_hash FROM users WHERE id = $1", [user.id]);
    if (!(await bcrypt.compare(current, row.password_hash))) {
      return NextResponse.json({ error: "Your current password is not correct." }, { status: 400 });
    }
    await exec("UPDATE users SET password_hash = $1 WHERE id = $2", [await bcrypt.hash(next, 10), user.id]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}
