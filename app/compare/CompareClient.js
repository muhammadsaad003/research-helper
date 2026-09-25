"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Table2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { downloadText } from "@/lib/clipboard";
import { STATUS, formatNumber } from "@/lib/format";
import { splitName } from "@/lib/citations";

function firstAuthor(authors = []) {
  if (!authors.length) return "Unknown";
  const last = splitName(authors[0]).last;
  return authors.length > 2 ? `${last} et al.` : authors.length === 2 ? `${last} and ${splitName(authors[1]).last}` : last;
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function CompareClient({ items }) {
  const [tag, setTag] = useState("");
  const [onlyNotes, setOnlyNotes] = useState(false);

  const tags = useMemo(() => [...new Set(items.flatMap((i) => i.tags))].sort(), [items]);
  const rows = items.filter(
    (i) => (!tag || i.tags.includes(tag)) && (!onlyNotes || i.method || i.findings || i.gap)
  );

  function exportCsv() {
    const header = ["Title", "Authors", "Year", "Venue", "DOI", "Cited by", "Status", "Methodology", "Key findings", "Limitations / gap"];
    const lines = rows.map((r) =>
      [r.title, r.authors.join("; "), r.year, r.venue, r.doi, r.cited_by, STATUS[r.status].label, r.method, r.findings, r.gap].map(csvCell).join(",")
    );
    // The BOM makes Excel open the file with the right characters.
    downloadText("literature-review.csv", "\uFEFF" + [header.join(","), ...lines].join("\n"), "text/csv");
  }

  if (!items.length) {
    return (
      <div className="container-page py-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">Compare papers</h1>
        <div className="mt-8">
          <EmptyState icon={Table2} title="Save some papers first" action={<Link href="/search" className="btn-primary">Search for papers</Link>}>
            This table lines up the method, findings and gaps of every paper in your library, which is the backbone of a literature review.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Compare papers</h1>
          <p className="mt-1 max-w-prose text-soft">
            Your notes from each paper, side by side. Fill in the method, findings and gap on each paper’s notes page.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={exportCsv} disabled={!rows.length}>
          <Download size={16} /> Download as CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        {tags.length > 0 && (
          <label className="flex items-center gap-2">
            <span>Tag</span>
            <select className="field w-auto" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">All papers</option>
              {tags.map((t) => (
                <option key={t} value={t}>#{t}</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--ink))]" checked={onlyNotes} onChange={(e) => setOnlyNotes(e.target.checked)} />
          Only papers with notes
        </label>
        <span className="text-soft">{rows.length} papers</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/70 text-xs text-soft">
              <th scope="col" className="w-[26%] px-4 py-3 font-medium">Paper</th>
              <th scope="col" className="px-4 py-3 font-medium">Methodology</th>
              <th scope="col" className="px-4 py-3 font-medium">Key findings</th>
              <th scope="col" className="px-4 py-3 font-medium">Limitations and gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line align-top last:border-0">
                <th scope="row" className="px-4 py-4 font-normal">
                  <Link href={`/library/${r.id}`} className="font-serif font-semibold leading-snug hover:underline hover:decoration-mark hover:decoration-2">
                    {r.title}
                  </Link>
                  <p className="mt-1 text-xs text-soft">
                    {firstAuthor(r.authors)}
                    {r.year && ` (${r.year})`}
                    {r.cited_by !== null && `, cited ${formatNumber(r.cited_by)}×`}
                  </p>
                </th>
                {["method", "findings", "gap"].map((f) => (
                  <td key={f} className="whitespace-pre-line px-4 py-4">
                    {r[f] ? r[f] : (
                      <Link href={`/library/${r.id}`} className="text-xs text-soft underline decoration-dotted underline-offset-2 hover:text-ink">
                        Add
                      </Link>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
