"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Bookmark, BookmarkCheck } from "lucide-react";

export default function SaveButton({ paper, initialSaved = false, onSaved, size = "sm", block = false }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  // The list of saved papers can arrive after the button first appears.
  useEffect(() => {
    if (initialSaved) setSaved(true);
  }, [initialSaved]);

  async function save() {
    if (status !== "authenticated") {
      toast("Log in to save papers to your library.");
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname + window.location.search)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save this paper.");
      setSaved(true);
      onSaved?.(paper.id);
      toast.success(data.already ? "Already in your library" : "Saved to your library");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const cls = `${size === "sm" ? "btn-sm" : ""} ${block ? "w-full" : ""}`;
  if (saved) {
    return (
      <Link href="/library" className={`btn-outline ${cls} border-ok/40 text-ok`}>
        <BookmarkCheck size={size === "sm" ? 14 : 16} /> In your library
      </Link>
    );
  }
  return (
    <button type="button" onClick={save} disabled={busy} className={`btn-primary ${cls}`}>
      <Bookmark size={size === "sm" ? 14 : 16} />
      {busy ? "Saving…" : "Save to library"}
    </button>
  );
}
