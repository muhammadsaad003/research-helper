"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { Star, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { paperHref } from "@/lib/ids";
import { shortAuthors, timeAgo } from "@/lib/format";

export default function FeaturedManager({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((list) => [data.featured, ...list.filter((i) => i.paper_id !== data.featured.paper_id)]);
      setInput("");
      setNote("");
      toast.success("Featured on the home page");
    } catch (err) {
      toast.error(err.message || "Couldn't add the paper.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    const res = await fetch(`/api/admin/featured?id=${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((list) => list.filter((i) => i.id !== item.id));
      toast.success("Removed from the home page");
    } else {
      toast.error("Couldn't remove it.");
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <form onSubmit={add} className="panel grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="f-input" className="label">DOI or OpenAlex id</label>
          <input id="f-input" required className="field" placeholder="10.1038/nature14539" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-note" className="label">Note for readers (optional)</label>
          <input id="f-note" className="field" maxLength={280} placeholder="Great starting point for beginners" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary h-[38px]" disabled={busy}>
          <Star size={16} /> {busy ? "Adding…" : "Feature paper"}
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={Star} title="No featured papers yet">
          Add a DOI above. Featured papers help new visitors see what the site can do.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((f, i) => (
            <li key={f.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <Link href={paperHref(f.paper_id)} className="font-serif font-semibold leading-snug hover:underline">
                  {f.title}
                </Link>
                <p className="mt-0.5 text-sm text-soft">
                  {shortAuthors(f.authors, 3)}
                  {f.year && ` (${f.year})`}
                  {i >= 6 && ", not shown (only the newest six appear)"}
                </p>
                {f.note && <p className="mt-1.5 border-l-2 border-mark pl-3 text-sm">{f.note}</p>}
                <p className="mt-1 text-xs text-soft">Added {timeAgo(f.created_at)}</p>
              </div>
              <button type="button" className="btn-ghost h-8 w-8 shrink-0 p-0 text-danger" onClick={() => remove(f)} aria-label={`Remove ${f.title}`} title="Remove">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
