import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";

// POST /api/admin/announcements { title, body }
export async function POST(req) {
  const { user, error } = await requireAdminApi();
  if (error) return error;
  const data = await req.json().catch(() => ({}));
  const title = String(data.title || "").trim().slice(0, 140);
  const body = String(data.body || "").trim().slice(0, 1000);
  if (title.length < 3) return NextResponse.json({ error: "Give the announcement a title." }, { status: 400 });
  const row = await one(
    "INSERT INTO announcements (title, body, created_by) VALUES ($1, $2, $3) RETURNING id, title, body, is_active, created_at",
    [title, body, user.id]
  );
  return NextResponse.json({ announcement: row }, { status: 201 });
}
