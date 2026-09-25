"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, ExternalLink, Save, Trash2, X } from "lucide-react";
import CitePanel from "@/components/CitePanel";
import SummaryPanel from "@/components/SummaryPanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import { paperHref } from "@/lib/ids";
import { STATUS, shortAuthors, timeAgo } from "@/lib/format";

const FIELDS = [
  ["method", "Methodology", "How was the study done? Sample, data, tools…"],
  ["findings", "Key findings", "What did they find? Main numbers or results."],
  ["gap", "Limitations and research gap", "What is missing? What could your work add?"],
];

export default function LibraryEditor({ item }) {
  const router = useRouter();
  const [data, setData] = useState({
    status: item.status,
    tags: item.tags || [],
    notes: item.notes || "",
    method: item.method || "",
    findings: item.findings || "",
    gap: item.gap || "",
  });
  const [saved, setSaved] = useState(data);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(item.updated_at);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty = JSON.stringify(data) !== JSON.stringify(saved);
  const meta = item.meta || {};
  const paper = { id: item.paper_id, title: item.title, authors: item.authors, year: item.year, venue: item.venue, doi: item.doi, url: item.url, volume: meta.volume, issue: meta.issue, pages: meta.pages, type: meta.type };

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/library/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const next = { ...data, tags: json.item.tags };
      setData(next);
      setSaved(next);
      setUpdatedAt(json.item.updated_at);
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err.message || "Couldn't save your notes.");
    } finally {
      setSaving(false);
    }
  }, [data, item.id]);

  // Ctrl+S / Cmd+S saves, and the browser warns before leaving with unsaved notes.
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    }
    function onLeave(e) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, saving, save]);

  function addTag(e) {
    e.preventDefault();
    const t = tagInput.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (t && !data.tags.includes(t) && data.tags.length < 12) setData((d) => ({ ...d, tags: [...d.tags, t] }));
    setTagInput("");
  }

  async function remove() {
    setDeleting(true);
    const res = await fetch(`/api/library/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Removed from your library");
      router.push("/library");
      router.refresh();
    } else {
      setDeleting(false);
      toast.error("Couldn't remove it.");
    }
  }

  return (
    <div className="container-page py-8">
      <Link href="/library" className="inline-flex items-center gap-1.5 text-sm text-soft hover:text-ink">
        <ArrowLeft size={16} /> My library
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{item.title}</h1>
          <p className="mt-2 text-sm text-soft">
            {shortAuthors(item.authors, 6)}
            {item.venue && (
              <>
                , <i className="font-serif">{item.venue}</i>
              </>
            )}
            {item.year && ` (${item.year})`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={paperHref(item.paper_id)} className="btn-ghost btn-sm -ml-3">
              Paper details
            </Link>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                <ExternalLink size={14} /> Publisher page
              </a>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-line py-4">
            <fieldset>
              <legend className="sr-only">Reading status</legend>
              <div className="flex rounded-md border border-line p-0.5">
                {Object.entries(STATUS).map(([key, s]) => (
                  <label key={key} className={`flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-sm ${data.status === key ? "bg-primary text-on-primary" : "text-soft hover:text-ink"}`}>
                    <input type="radio" name="status" value={key} checked={data.status === key} onChange={() => setData((d) => ({ ...d, status: key }))} className="sr-only" />
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-2">
              {data.tags.map((t) => (
                <span key={t} className="chip text-ink">
                  #{t}
                  <button type="button" aria-label={`Remove tag ${t}`} onClick={() => setData((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }))} className="text-soft hover:text-danger">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <form onSubmit={addTag}>
                <label htmlFor="tag-input" className="sr-only">Add a tag</label>
                <input id="tag-input" className="field h-7 w-32 py-0 text-xs" placeholder="Add tag, press Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} maxLength={30} />
              </form>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {FIELDS.map(([key, label, hint]) => (
              <div key={key}>
                <label htmlFor={`f-${key}`} className="label">{label}</label>
                <textarea id={`f-${key}`} rows={6} className="field resize-y" placeholder={hint} value={data[key]} onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <label htmlFor="f-notes" className="label">My notes</label>
            <textarea
              id="f-notes"
              rows={10}
              className="field lined resize-y font-serif text-[0.98rem]"
              placeholder="Quotes, ideas, questions for your supervisor…"
              value={data.notes}
              onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
            />
          </div>

          <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/95 py-4 backdrop-blur">
            <p className="text-sm text-soft" aria-live="polite">
              {dirty ? "You have unsaved changes." : `Saved ${timeAgo(updatedAt)}.`}
              <span className="hidden sm:inline"> Press Ctrl+S to save.</span>
            </p>
            <button type="button" className="btn-primary" onClick={save} disabled={!dirty || saving}>
              <Save size={16} /> {saving ? "Saving…" : "Save notes"}
            </button>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="panel p-4" aria-labelledby="sum-h">
            <h2 id="sum-h" className="mb-3 font-sans text-sm font-semibold">Quick summary</h2>
            <SummaryPanel savedId={item.id} hasAbstract={Boolean(item.abstract)} initialSummary={item.summary} />
          </section>
          <section className="panel p-4" aria-labelledby="cite-h">
            <h2 id="cite-h" className="mb-3 font-sans text-sm font-semibold">Cite this paper</h2>
            <CitePanel paper={paper} compact />
          </section>
          <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => setConfirmOpen(true)}>
            <Trash2 size={14} /> Remove from library
          </button>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        busy={deleting}
        title="Remove this paper?"
        message="The paper and all your notes on it will be deleted from your library."
        confirmLabel="Remove paper"
      />
    </div>
  );
}
