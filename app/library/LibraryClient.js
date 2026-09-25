"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { BookOpen, FileDown, Quote, Search, Trash2, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import CitePanel from "@/components/CitePanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExportModal from "@/components/ExportModal";
import { STATUS, plural, shortAuthors, timeAgo } from "@/lib/format";

const TABS = [["ALL", "All"], ["TO_READ", "To read"], ["READING", "Reading"], ["DONE", "Done"]];

function toPaper(item) {
  const m = item.meta || {};
  return { id: item.paper_id, title: item.title, authors: item.authors, year: item.year, venue: item.venue, doi: item.doi, url: item.url, volume: m.volume, issue: m.issue, pages: m.pages, type: m.type };
}

export default function LibraryClient() {
  const sp = useSearchParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(TABS.some(([k]) => k === sp.get("status")) ? sp.get("status") : "ALL");
  const [tag, setTag] = useState(sp.get("tag") || "");
  const [text, setText] = useState("");
  const [sort, setSort] = useState("updated");
  const [citeItem, setCiteItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    fetch("/api/library")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Couldn't load your library.");
        setItems(j.items);
      })
      .catch((e) => setError(e.message));
  }, []);

  const counts = useMemo(() => {
    const c = { ALL: 0, TO_READ: 0, READING: 0, DONE: 0 };
    for (const i of items || []) {
      c.ALL++;
      c[i.status]++;
    }
    return c;
  }, [items]);

  const allTags = useMemo(() => {
    const t = new Map();
    for (const i of items || []) for (const tg of i.tags) t.set(tg, (t.get(tg) || 0) + 1);
    return [...t.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const visible = useMemo(() => {
    const q = text.trim().toLowerCase();
    let list = (items || []).filter(
      (i) =>
        (tab === "ALL" || i.status === tab) &&
        (!tag || i.tags.includes(tag)) &&
        (!q || [i.title, i.venue, i.notes, ...(i.authors || [])].join(" ").toLowerCase().includes(q))
    );
    const sorters = {
      updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      added: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      title: (a, b) => a.title.localeCompare(b.title),
      year: (a, b) => (b.year || 0) - (a.year || 0),
    };
    return [...list].sort(sorters[sort]);
  }, [items, tab, tag, text, sort]);

  async function changeStatus(item, status) {
    const before = items;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status, updated_at: new Date().toISOString() } : i)));
    const res = await fetch(`/api/library/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setItems(before);
      toast.error("Couldn't change the status.");
    } else {
      toast.success(`Marked as “${STATUS[status].label}”`);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    const res = await fetch(`/api/library/${deleteItem.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setItems((list) => list.filter((i) => i.id !== deleteItem.id));
      toast.success("Removed from your library");
      setDeleteItem(null);
    } else {
      toast.error("Couldn't remove it.");
    }
  }

  if (error) {
    return (
      <div className="container-page py-10">
        <p className="rounded-md bg-danger/10 p-4 text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">My library</h1>
          <p className="mt-1 text-soft">{items ? plural(counts.ALL, "saved paper") : "Loading…"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/compare" className="btn-outline">
            Compare
          </Link>
          <button type="button" className="btn-primary" disabled={!visible.length} onClick={() => setExportOpen(true)}>
            <FileDown size={16} /> Export references
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-b border-line lg:flex-row lg:items-end lg:justify-between">
        <div role="tablist" aria-label="Reading status" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-[3px] px-3 pb-3 pt-1 text-sm transition-colors ${
                tab === key ? "border-mark font-medium text-ink" : "border-transparent text-soft hover:text-ink"
              }`}
            >
              {label} <span className="text-soft">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 pb-3">
          <div className="relative flex-1 lg:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-soft" aria-hidden="true" />
            <input aria-label="Filter your library" className="field pl-9" placeholder="Filter by title, author, notes" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <select aria-label="Sort" className="field w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated">Recently updated</option>
            <option value="added">Recently added</option>
            <option value="title">Title A to Z</option>
            <option value="year">Newest paper</option>
          </select>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-soft">Tags:</span>
          {allTags.map(([t, n]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(tag === t ? "" : t)}
              aria-pressed={tag === t}
              className={`chip ${tag === t ? "border-transparent bg-mark text-on-mark" : "hover:border-ink/40 hover:text-ink"}`}
            >
              #{t} <span className="opacity-60">{n}</span>
              {tag === t && <X size={12} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        {!items && (
          <div className="space-y-6 pt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {items && items.length === 0 && (
          <div className="mt-8">
            <EmptyState icon={BookOpen} title="Nothing saved yet" action={<Link href="/search" className="btn-primary">Search for papers</Link>}>
              When you find a useful paper, choose “Save to library”. It will show up here with space for your notes.
            </EmptyState>
          </div>
        )}

        {items && items.length > 0 && visible.length === 0 && (
          <p className="py-12 text-center text-soft">No papers match these filters.</p>
        )}

        <ul>
          {visible.map((item) => (
            <li key={item.id} className="flex flex-col gap-3 border-b border-line py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <Link href={`/library/${item.id}`} className="font-serif text-lg font-semibold leading-snug hover:underline hover:decoration-mark hover:decoration-2">
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-soft">
                  {shortAuthors(item.authors, 3)}
                  {item.venue && (
                    <>
                      , <i className="font-serif">{item.venue}</i>
                    </>
                  )}
                  {item.year && ` (${item.year})`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-soft">
                  {item.tags.map((t) => (
                    <span key={t} className="chip">#{t}</span>
                  ))}
                  {(item.notes || item.findings) && <span>Has notes</span>}
                  <span>Updated {timeAgo(item.updated_at)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <label className="sr-only" htmlFor={`status-${item.id}`}>
                  Reading status
                </label>
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS[item.status].dot}`} aria-hidden="true" />
                <select id={`status-${item.id}`} className="field h-8 w-auto py-0 text-xs" value={item.status} onChange={(e) => changeStatus(item, e.target.value)}>
                  <option value="TO_READ">To read</option>
                  <option value="READING">Reading</option>
                  <option value="DONE">Done</option>
                </select>
                <button type="button" className="btn-ghost h-8 w-8 p-0" title="Cite" aria-label={`Cite ${item.title}`} onClick={() => setCiteItem(item)}>
                  <Quote size={16} />
                </button>
                <button type="button" className="btn-ghost h-8 w-8 p-0 text-danger" title="Remove" aria-label={`Remove ${item.title}`} onClick={() => setDeleteItem(item)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal open={Boolean(citeItem)} onClose={() => setCiteItem(null)} title="Cite this paper">
        {citeItem && (
          <>
            <p className="mb-4 font-serif text-sm text-soft">{citeItem.title}</p>
            <CitePanel paper={toPaper(citeItem)} compact />
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        title="Remove this paper?"
        message={deleteItem ? `“${deleteItem.title}” and your notes on it will be deleted from your library.` : ""}
        confirmLabel="Remove paper"
      />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} papers={visible.map(toPaper)} />
    </div>
  );
}
