"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import AuthCard from "@/components/AuthCard";

const MESSAGES = {
  suspended: "This account is suspended. Contact the site admin.",
  missing: "That account no longer exists. Create a new one.",
};

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const rawCallback = sp.get("callbackUrl") || "/dashboard";
  // Only allow redirects inside this site.
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(MESSAGES[sp.get("error")] || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // A suspended or deleted account is logged out automatically.
    if (MESSAGES[sp.get("error")]) signOut({ redirect: false });
  }, [sp]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (!res || res.error) {
      setError(res?.error && res.error !== "CredentialsSignin" ? res.error : "Email or password is incorrect.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard title="Log in" subtitle="Welcome back. Log in to open your library.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" required className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary h-11 w-full" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-soft">
        New here?{" "}
        <Link href={`/register${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-medium text-ink underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
