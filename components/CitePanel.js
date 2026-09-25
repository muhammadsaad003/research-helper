"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy } from "lucide-react";
import { STYLES, formatCitation } from "@/lib/citations";
import { copyToClipboard } from "@/lib/clipboard";

export default function CitePanel({ paper, compact = false }) {
  const [style, setStyle] = useState("apa");
  const [copied, setCopied] = useState(false);
  const citation = useMemo(() => formatCitation(paper, style), [paper, style]);

  async function copy() {
    const ok = await copyToClipboard(citation.text, style === "bibtex" ? null : citation.html);
    if (ok) {
      setCopied(true);
      toast.success("Citation copied");
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Couldn't copy. Select the text and copy it yourself.");
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="Citation style" className="flex flex-wrap gap-1">
        {STYLES.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={style === s.id}
            onClick={() => setStyle(s.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              style === s.id ? "bg-primary text-on-primary" : "text-soft hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className={`mt-3 rounded-md border border-line bg-canvas/60 p-3 ${compact ? "text-sm" : ""}`}>
        {style === "bibtex" ? (
          <pre className="overflow-x-auto whitespace-pre text-xs leading-relaxed">{citation.text}</pre>
        ) : (
          <p className="font-serif text-[0.95rem] leading-relaxed [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: citation.html }} />
        )}
      </div>
      <button type="button" onClick={copy} className="btn-outline btn-sm mt-3">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy citation"}
      </button>
    </div>
  );
}
