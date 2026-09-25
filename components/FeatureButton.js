"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Star } from "lucide-react";

export default function FeatureButton({ paperId, initialFeatured = false }) {
  const router = useRouter();
  const [featured, setFeatured] = useState(initialFeatured);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function feature() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: paperId, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeatured(true);
      toast.success("Featured on the home page");
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Couldn't feature this paper.");
    } finally {
      setBusy(false);
    }
  }

  async function unfeature() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/featured?paperId=${encodeURIComponent(paperId)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeatured(false);
      toast.success("Removed from the home page");
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Couldn't remove it.");
    } finally {
      setBusy(false);
    }
  }

  if (featured) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm">
          <Star size={16} className="fill-mark text-warn" /> On the home page
        </p>
        <button type="button" className="btn-outline btn-sm" onClick={unfeature} disabled={busy}>
          {busy ? "Removing…" : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="feature-note" className="label">
        Note for readers (optional)
      </label>
      <input id="feature-note" className="field" maxLength={280} placeholder="Why this paper is worth reading" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" className="btn-outline btn-sm w-full" onClick={feature} disabled={busy}>
        <Star size={14} /> {busy ? "Featuring…" : "Feature on home page"}
      </button>
    </div>
  );
}
