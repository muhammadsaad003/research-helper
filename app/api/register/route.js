import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { one } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function adminEmails() {
  return String(process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send the form as JSON." }, { status: 400 });
  }

  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
  const password = String(body.password || "");

  if (name.length < 2) return NextResponse.json({ error: "Enter your name (at least 2 letters)." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  if (password.length > 200) return NextResponse.json({ error: "That password is too long." }, { status: 400 });

  try {
    const existing = await one("SELECT id FROM users WHERE email = $1", [email]);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 409 });
    }
    const role = adminEmails().includes(email) ? "ADMIN" : "USER";
    const hash = await bcrypt.hash(password, 10);
    const user = await one(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hash, role]
    );
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Register failed:", err);
    return NextResponse.json({ error: "Couldn't create the account. Check the database connection." }, { status: 500 });
  }
}
