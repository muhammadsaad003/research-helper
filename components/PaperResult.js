"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Quote, Unlock } from "lucide-react";
import Highlight from "./Highlight";
import SaveButton from "./SaveButton";
import Modal from "./Modal";
import CitePanel from "./CitePanel";
import { paperHref } from "@/lib/ids";
import { formatNumber, shortAuthors } from "@/lib/format";

export default function PaperResult({ paper, query, saved, onSaved }) {
  const [citeOpen, setCiteOpen] = useState(false);
  const href = paperHref(paper.id);

  return (
    <article className="border-b border-line py-6 first:pt-2">
      <h3 className="text-lg font-semibold leading-snug sm:text-xl">
        <Link href={href} className="hover:underline hover:decoration-mark hover:decoration-2 hover:underline-offset-4">
          <Highlight text={paper.title} query={query} />
        </Link>
      </h3>
      <p className="mt-1.5 text-sm text-soft">{shortAuthors(paper.authors)}</p>
      <p className="mt-0.5 text-sm">
        {paper.venue && <i className="font-serif">{paper.venue}</i>}
        {paper.year && <span className="text-soft"> ({paper.year})</span>}
        {paper.citedBy !== null && paper.citedBy !== undefined && (
          <span className="text-soft">, cited {formatNumber(paper.citedBy)} times</span>
        )}
      </p>
      {paper.abstract && (
        <p className="mt-3 line-clamp-3 max-w-prose font-serif text-[0.95rem] leading-relaxed text-ink/85">
          <Highlight text={paper.abstract} query={query} />
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SaveButton paper={paper} initialSaved={saved} onSaved={onSaved} />
        <button type="button" className="btn-outline btn-sm" onClick={() => setCiteOpen(true)}>
          <Quote size={14} /> Cite
        </button>
        <Link href={href} className="btn-ghost btn-sm">
          Details
        </Link>
        {paper.oaUrl && (
          <a href={paper.oaUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-sm text-ok">
            <Unlock size={14} /> Free full text
          </a>
        )}
        {!paper.oaUrl && paper.url && (
          <a href={paper.url} target="_blank" rel="noreferrer" className="btn-ghost btn-sm text-soft">
            <ExternalLink size={14} /> Publisher page
          </a>
        )}
      </div>
      <Modal open={citeOpen} onClose={() => setCiteOpen(false)} title="Cite this paper">
        <p className="mb-4 font-serif text-sm text-soft">{paper.title}</p>
        <CitePanel paper={paper} compact />
      </Modal>
    </article>
  );
}
