import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { one } from "./db";

export const authOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) throw new Error("Enter your email and password.");

        const user = await one(
          "SELECT id, name, email, password_hash, role, is_suspended FROM users WHERE email = $1",
          [email]
        );
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
          throw new Error("Email or password is incorrect.");
        }
        if (user.is_suspended) throw new Error("This account is suspended. Contact the site admin.");
        return { id: String(user.id), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Lets the settings page update the name shown in the menu.
      if (trigger === "update" && session?.name) token.name = session.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export function isAdmin(user) {
  return user?.role === "ADMIN";
}

/**
 * The logged-in user, read fresh from the database (so role changes and
 * suspensions apply immediately). Returns null for visitors.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  try {
    const user = await one(
      "SELECT id, name, email, role, is_suspended, created_at FROM users WHERE id = $1",
      [session.user.id]
    );
    if (!user || user.is_suspended) return null;
    return user;
  } catch {
    return null;
  }
}

/** For pages: send visitors to the login page. */
export async function requireUserPage(callbackUrl = "/dashboard") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  const user = await one(
    "SELECT id, name, email, role, is_suspended, created_at FROM users WHERE id = $1",
    [session.user.id]
  );
  if (!user) redirect("/login?error=missing");
  if (user.is_suspended) redirect("/login?error=suspended");
  return user;
}

/** For admin pages: non-admins go back to their dashboard. */
export async function requireAdminPage() {
  const user = await requireUserPage("/admin");
  if (!isAdmin(user)) redirect("/dashboard?denied=1");
  return user;
}

/** For API routes: returns { user } or { error: Response }. */
export async function requireUserApi() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Please log in first." }, { status: 401 }) };
  return { user };
}

export async function requireAdminApi() {
  const { user, error } = await requireUserApi();
  if (error) return { error };
  if (!isAdmin(user)) return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  return { user };
}
