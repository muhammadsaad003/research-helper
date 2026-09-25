"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function SettingsForms({ initialName }) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState("");

  async function send(body, kind) {
    setBusy(kind);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } catch (err) {
      toast.error(err.message || "Couldn't save.");
      return null;
    } finally {
      setBusy("");
    }
  }

  async function saveName(e) {
    e.preventDefault();
    const data = await send({ name }, "name");
    if (data) {
      await update({ name: data.name });
      toast.success("Name updated");
      router.refresh();
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    const data = await send(pw, "pw");
    if (data) {
      setPw({ currentPassword: "", newPassword: "" });
      toast.success("Password changed");
    }
  }

  return (
    <div className="mt-8 space-y-10">
      <form onSubmit={saveName} className="space-y-3">
        <h2 className="text-lg font-semibold">Your name</h2>
        <label htmlFor="s-name" className="sr-only">Name</label>
        <input id="s-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <button type="submit" className="btn-primary" disabled={busy === "name" || name.trim() === initialName}>
          {busy === "name" ? "Saving…" : "Save name"}
        </button>
      </form>

      <form onSubmit={savePassword} className="space-y-3">
        <h2 className="text-lg font-semibold">Change password</h2>
        <div>
          <label htmlFor="s-cur" className="label">Current password</label>
          <input id="s-cur" type="password" autoComplete="current-password" className="field" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="s-new" className="label">New password</label>
          <input id="s-new" type="password" autoComplete="new-password" minLength={8} className="field" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
          <p className="mt-1 text-xs text-soft">At least 8 characters.</p>
        </div>
        <button type="submit" className="btn-primary" disabled={busy === "pw" || !pw.currentPassword || pw.newPassword.length < 8}>
          {busy === "pw" ? "Changing…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
