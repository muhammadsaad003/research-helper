"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import AuthCard from "@/components/AuthCard";

export default function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const raw = sp.get("callbackUrl") || "/dashboard";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create the account.");
      const login = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (login?.error) throw new Error("Account created. Please log in.");
      toast.success(data.user.role === "ADMIN" ? "Account created. You are the admin." : "Account created");
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create an account" subtitle="Free. Keep a library, write notes and export your references.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" autoComplete="name" required className="field" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" required className="field" value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={8} className="field" value={form.password} onChange={set("password")} aria-describedby="pw-hint" />
          <p id="pw-hint" className="mt-1 text-xs text-soft">At least 8 characters.</p>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary h-11 w-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
