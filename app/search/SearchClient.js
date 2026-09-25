"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import PaperResult from "@/components/PaperResult";
import EmptyState from "@/components/EmptyState";
import { formatNumber } from "@/lib/format";

const THIS_YEAR = new Date().getFullYear();

function ResultSkeleton() {
  return (
    <div className="space-y-8 pt-2" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 border-b border-line pb-6">
          <div className="skeleton h-6 w-4/5" />
          <div className="skeleton h-4 w-2/5" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
        </div>
      ))}
    </div>
  );
}

function Filters({ sp, update }) {
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");

  useEffect(() => {
    setFrom(sp.get("from") || "");
    setTo(sp.get("to") || "");
  }, [sp]);

  function applyYears(e) {
    e.preventDefault();
    update({ from: from || null, to: to || null });
  }

  const hasFilters = sp.get("from") || sp.get("to") || sp.get("oa") || (sp.get("sort") && sp.get("sort") !== "relevance");

  return (
    <div className="space-y-6 text-sm">
      <div>
        <label htmlFor="sort" className="label">
          Sort by
        </label>
        <select id="sort" className="field" value={sp.get("sort") || "relevance"} onChange={(e) => update({ sort: e.target.value === "relevance" ? null : e.target.value })}>
          <option value="relevance">Best match</option>
          <option value="citations">Most cited</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      <form onSubmit={applyYears}>
        <fieldset>
          <legend className="label">Published between</legend>
          <div className="flex items-center gap-2">
            <input aria-label="From year" type="number" inputMode="numeric" min="1900" max={THIS_YEAR} placeholder="1990" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
            <span className="text-soft">and</span>
            <input aria-label="To year" type="number" inputMode="numeric" min="1900" max={THIS_YEAR} placeholder={String(THIS_YEAR)} value={to} onChange={(e) => setTo(e.target.value)} className="field" />
          </div>
        </fieldset>
        <button type="submit" className="btn-outline btn-sm mt-2 w-full">
          Apply years
        </button>
      </form>

      <label className="flex cursor-pointer items-start gap-2">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--ink))]" checked={sp.get("oa") === "1"} onChange={(e) => update({ oa: e.target.checked ? "1" : null })} />
        <span>
          Free to read only
          <span className="block text-xs text-soft">Open-access papers with a free full text</span>
        </span>
      </label>

      {hasFilters && (
        <button type="button" className="text-sm text-soft underline underline-offset-2 hover:text-ink" onClick={() => update({ from: null, to: null, oa: null, sort: null })}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function SearchClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const q = sp.get("q") || "";
  const page = Number(sp.get("page") || 1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState(new Set());

  const update = useCallback(
    (changes, keepPage = false) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === undefined || v === "") params.delete(k);
        else params.set(k, String(v));
      }
      if (!keepPage) params.delete("page");
      router.push(`/search?${params.toString()}`);
    },
    [sp, router]
  );

  const load = useCallback(async () => {
    if (!q.trim()) {
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/search?${sp.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed.");
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, sp]);

  useEffect(() => {
    load();
    window.scrollTo({ top: 0 });
  }, [load]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/library?ids=1")
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((j) => setSavedIds(new Set(j.ids || [])))
      .catch(() => {});
  }, [status]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.perPage || 10))) : 1;

  return (
    <div className="container-page py-8">
      <div className="max-w-3xl">
        <SearchBar initial={q} autoFocus={!q} />
      </div>

      {!q && (
        <div className="mt-10">
          <EmptyState icon={SlidersHorizontal} title="Search for a topic to begin">
            Try a subject like “renewable energy storage”, a paper title, an author name, or paste a DOI.
          </EmptyState>
        </div>
      )}

      {q && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr] lg:gap-12">
          <aside>
            <details className="group lg:hidden">
              <summary className="btn-outline cursor-pointer list-none">
                <SlidersHorizontal size={16} /> Filters and sorting
              </summary>
              <div className="panel mt-3 p-4">
                <Filters sp={sp} update={update} />
              </div>
            </details>
            <div className="hidden lg:sticky lg:top-24 lg:block">
              <Filters sp={sp} update={update} />
            </div>
          </aside>

          <section aria-live="polite" aria-busy={loading}>
            {data && !loading && (
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                <p className="text-sm">
                  <span className="font-medium">{data.total >= 10000 ? "10,000+" : formatNumber(data.total)}</span>
                  <span className="text-soft"> results for </span>
                  <span className="font-serif italic">“{q}”</span>
                </p>
                {data.source && <p className="text-xs text-soft">Data from {data.source === "openalex" ? "OpenAlex" : "Crossref"}</p>}
              </div>
            )}
            {data?.notice && !loading && <p className="mb-2 rounded-md bg-mark/25 px-3 py-2 text-sm">{data.notice}</p>}

            {loading && <ResultSkeleton />}

            {error && !loading && (
              <div className="rounded-md border border-danger/40 p-4 text-sm">
                <p className="font-medium text-danger">{error}</p>
                <button type="button" onClick={load} className="btn-outline btn-sm mt-3">
                  Search again
                </button>
              </div>
            )}

            {data && !loading && data.results.length === 0 && (
              <EmptyState icon={SearchX} title="No papers matched">
                Check the spelling, use fewer words, or remove the year and free-to-read filters.
              </EmptyState>
            )}

            {data && !loading &&
              data.results.map((paper) => (
                <PaperResult
                  key={paper.id}
                  paper={paper}
                  query={q}
                  saved={savedIds.has(paper.id)}
                  onSaved={(id) => setSavedIds((s) => new Set([...s, id]))}
                />
              ))}

            {data && !loading && data.results.length > 0 && totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Pages">
                <button type="button" className="btn-outline" disabled={page <= 1} onClick={() => update({ page: page - 1 }, true)}>
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-soft">
                  Page {page} of {formatNumber(totalPages)}
                </span>
                <button type="button" className="btn-outline" disabled={page >= totalPages} onClick={() => update({ page: page + 1 }, true)}>
                  Next <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
