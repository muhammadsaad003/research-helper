import { NextResponse } from "next/server";
import { many } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";

// GET /api/admin/users?q=search
export async function GET(req) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  const users = await many(
    `SELECT u.id, u.name, u.email, u.role, u.is_suspended, u.created_at, COUNT(s.id)::int AS saved
       FROM users u LEFT JOIN saved_papers s ON s.user_id = u.id
      WHERE ($1 = '' OR u.name ILIKE $2 OR u.email ILIKE $2)
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 300`,
    [q, `%${q}%`]
  );
  return NextResponse.json({ users });
}
