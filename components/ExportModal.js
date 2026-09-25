"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Download } from "lucide-react";
import Modal from "./Modal";
import { STYLES, formatBibliography } from "@/lib/citations";
import { copyToClipboard, downloadText } from "@/lib/clipboard";

export default function ExportModal({ open, onClose, papers }) {
  const [style, setStyle] = useState("apa");
  const bib = useMemo(() => formatBibliography(papers, style), [papers, style]);

  async function copy() {
    const ok = await copyToClipboard(bib.text, style === "bibtex" ? null : bib.html);
    ok ? toast.success(`Copied ${papers.length} references`) : toast.error("Couldn't copy. Use Download instead.");
  }

  function download() {
    const name = style === "bibtex" ? "references.bib" : `references-${style}.txt`;
    downloadText(name, bib.text);
  }

  return (
    <Modal open={open} onClose={onClose} title={`Export ${papers.length} references`} wide>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="export-style" className="text-sm font-medium">
          Style
        </label>
        <select id="export-style" className="field w-auto" value={style} onChange={(e) => setStyle(e.target.value)}>
          {STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 max-h-[45vh] overflow-y-auto rounded-md border border-line bg-canvas/60 p-4">
        {style === "bibtex" ? (
          <pre className="whitespace-pre-wrap text-xs leading-relaxed">{bib.text}</pre>
        ) : (
          <div className="space-y-3 font-serif text-sm leading-relaxed [overflow-wrap:anywhere] [&>p]:pl-6 [&>p]:-indent-6" dangerouslySetInnerHTML={{ __html: bib.html }} />
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-outline" onClick={download}>
          <Download size={16} /> Download
        </button>
        <button type="button" className="btn-primary" onClick={copy}>
          <Copy size={16} /> Copy all
        </button>
      </div>
    </Modal>
  );
}
