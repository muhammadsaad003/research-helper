"use client";

import { useState } from "react";
import CitePanel from "@/components/CitePanel";
import SaveButton from "@/components/SaveButton";

const EMPTY = { title: "", authorsText: "", year: "", venue: "", volume: "", issue: "", pages: "", doi: "", url: "", type: "journal-article" };

export default function CiteClient() {
  const [form, setForm] = useState(EMPTY);
  const [lookup, setLookup] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function findDoi(e) {
    e.preventDefault();
    if (!lookup.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/paper?id=${encodeURIComponent(lookup.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const p = data.paper;
      setFound(p);
      setForm({
        title: p.title || "",
        authorsText: (p.authors || []).join("\n"),
        year: p.year ? String(p.year) : "",
        venue: p.venue || "",
        volume: p.volume || "",
        issue: p.issue || "",
        pages: p.pages || "",
        doi: p.doi || "",
        url: p.url || "",
        type: p.type || "journal-article",
      });
    } catch (err) {
      setError(err.message || "Couldn't find that paper.");
    } finally {
      setLoading(false);
    }
  }

  const paper = {
    title: form.title || "Title of the work",
    authors: form.authorsText.split("\n").map((a) => a.trim()).filter(Boolean),
    year: form.year ? Number(form.year) : null,
    venue: form.venue,
    volume: form.volume,
    issue: form.issue,
    pages: form.pages,
    doi: form.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, ""),
    url: form.url,
    type: form.type,
  };

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-semibold sm:text-4xl">Citation maker</h1>
      <p className="mt-2 max-w-prose text-soft">
        Paste a DOI to fill everything in automatically, or type the details yourself. The citation updates as you type.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          <form onSubmit={findDoi} className="panel p-5">
            <label htmlFor="doi-lookup" className="label">
              Look up by DOI
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="doi-lookup"
                className="field"
                placeholder="10.1038/nature14539 or https://doi.org/..."
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={loading}>
                {loading ? "Looking up…" : "Fill in details"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            {found && !error && <p className="mt-2 text-sm text-ok">Found it. Check the details below and edit anything that looks wrong.</p>}
          </form>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-lg font-semibold">Details</legend>
            <div>
              <label htmlFor="c-title" className="label">Title</label>
              <input id="c-title" className="field" value={form.title} onChange={set("title")} />
            </div>
            <div>
              <label htmlFor="c-authors" className="label">Authors</label>
              <textarea id="c-authors" rows={4} className="field" placeholder={"One author per line, e.g.\nJane A. Smith\nRahim Uddin"} value={form.authorsText} onChange={set("authorsText")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div>
                <label htmlFor="c-venue" className="label">Journal or conference</label>
                <input id="c-venue" className="field" value={form.venue} onChange={set("venue")} />
              </div>
              <div>
                <label htmlFor="c-year" className="label">Year</label>
                <input id="c-year" inputMode="numeric" className="field" value={form.year} onChange={set("year")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="c-vol" className="label">Volume</label>
                <input id="c-vol" className="field" value={form.volume} onChange={set("volume")} />
              </div>
              <div>
                <label htmlFor="c-iss" className="label">Issue</label>
                <input id="c-iss" className="field" value={form.issue} onChange={set("issue")} />
              </div>
              <div>
                <label htmlFor="c-pages" className="label">Pages</label>
                <input id="c-pages" className="field" placeholder="12-19" value={form.pages} onChange={set("pages")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-doi" className="label">DOI</label>
                <input id="c-doi" className="field" value={form.doi} onChange={set("doi")} />
              </div>
              <div>
                <label htmlFor="c-url" className="label">Web link (if no DOI)</label>
                <input id="c-url" className="field" value={form.url} onChange={set("url")} />
              </div>
            </div>
            <button type="button" className="text-sm text-soft underline underline-offset-2 hover:text-ink" onClick={() => { setForm(EMPTY); setFound(null); setLookup(""); }}>
              Clear the form
            </button>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-5">
            <h2 className="mb-3 font-sans text-sm font-semibold">Your citation</h2>
            <CitePanel paper={paper} />
            {found && (
              <div className="mt-5 border-t border-line pt-4">
                <SaveButton paper={found} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
