"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Megaphone, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { timeAgo } from "@/lib/format";

export default function AnnouncementsManager({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((list) => [data.announcement, ...list]);
      setTitle("");
      setBody("");
      toast.success("Announcement published");
    } catch (err) {
      toast.error(err.message || "Couldn't publish it.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item) {
    const res = await fetch(`/api/admin/announcements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    if (!res.ok) return toast.error("Couldn't change it.");
    setItems((list) => list.map((a) => (a.id === item.id ? { ...a, is_active: !a.is_active } : a)));
    toast.success(item.is_active ? "Hidden from the site" : "Live on the site");
  }

  async function confirmDelete() {
    const res = await fetch(`/api/admin/announcements/${toDelete.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Couldn't delete it.");
    setItems((list) => list.filter((a) => a.id !== toDelete.id));
    setToDelete(null);
    toast.success("Announcement deleted");
  }

  return (
    <div className="mt-6 space-y-8">
      <form onSubmit={create} className="panel space-y-4 p-5">
        <div>
          <label htmlFor="a-title" className="label">Title</label>
          <input id="a-title" required maxLength={140} className="field" placeholder="Exam week: the library export now supports IEEE" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="a-body" className="label">Details (optional)</label>
          <textarea id="a-body" rows={3} maxLength={1000} className="field" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          <Megaphone size={16} /> {busy ? "Publishing…" : "Publish announcement"}
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet">
          Use announcements for news like new features, maintenance, or deadlines.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((a) => (
            <li key={a.id} className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between ${a.is_active ? "" : "opacity-60"}`}>
              <div className="min-w-0">
                <p className="font-medium">{a.title}</p>
                {a.body && <p className="mt-0.5 text-sm text-soft">{a.body}</p>}
                <p className="mt-1 text-xs text-soft">
                  {a.is_active ? "Live" : "Hidden"}, posted {timeAgo(a.created_at)}
                  {a.author && ` by ${a.author}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" className="btn-outline btn-sm" onClick={() => toggle(a)}>
                  {a.is_active ? "Hide" : "Show again"}
                </button>
                <button type="button" className="btn-ghost h-8 w-8 p-0 text-danger" aria-label={`Delete ${a.title}`} title="Delete" onClick={() => setToDelete(a)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this announcement?"
        message={toDelete ? `“${toDelete.title}” will be removed for good. Choose Hide if you might need it again.` : ""}
        confirmLabel="Delete announcement"
      />
    </div>
  );
}
